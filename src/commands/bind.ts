import { h, Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import type { TargetUser } from '../types'
import { IcsFileService } from '../services/ics-file'
import { IcsWatcher } from '../services/ics-watcher'
import { StarlinkParser } from '../services/parser/starlink-parser'
import { ShiguangNativeParser, JsonParser } from '../services/parser/shiguang-native-parser'
import { WakeupFileParser } from '../services/parser/wakeup-file-parser'
import { TimeSlotManager } from '../services/timeslot-manager'

function isTimetableJson(text: string): boolean {
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object') return false
    if (parsed.courses) return false
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items.some((item: any) => item && (item.startHour !== undefined || item.section !== undefined || item.node !== undefined))
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.some((item: any) => item && (item.startHour !== undefined || item.section !== undefined || item.node !== undefined))
    }
  } catch {}
  return false
}

const DEFAULT_EMPTY_ERROR = `❌ 没有解析出可导入课程。📋 请检查格式是否正确。

💡 提示：若您使用的是「WakeUp 课程表」，极大概率是 App 版本过高（≥ 6.1.x，如 6.5.x 等）导致分享口令无法解析。
🛠️ 请尝试降级安装 6.0.23 稳定版后重新生成口令分享导入：
📥 官方稳定版 APK 下载（GitHub）：
https://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk`

export function registerBindCommand(
  ctx: Context, config: Config, services: CourseScheduleServices,
  icsFileService: IcsFileService, icsWatcher: IcsWatcher,
  timeSlotManager: TimeSlotManager,
) {
  ctx.command(`${config.baseCommand}.${config.bindCommand} [text:text]`, `📥 导入课表捏`)
    .example(`${config.baseCommand}.${config.bindCommand} 这是来自「WakeUp课程表」的课表分享......分享口令为「xxxxxxxx」`)
    .example(`${config.baseCommand}.${config.bindCommand} https://example.com/course.ics`)
    .action(async ({ session }, text) => {
      let realName = session.username || session.userId
      let groupNick = ''
      try {
        const member = await session.bot.getGuildMember(session.guildId, session.userId)
        if (member?.user?.name) realName = member.user.name
        if (member?.nick) groupNick = member.nick
      } catch {
        services.log('[bind] 无法获取用户信息，使用默认值')
      }

      const targetUser: TargetUser = {
        userId: session.userId,
        username: realName,
        nickname: groupNick,
        useravatar: session.event.user?.avatar ?? '',
      }

      let sourceText = (text || '').trim()
      let fileName = ''

      if (!sourceText) {
        const fileInfo = extractFileUrlFromMessage(session)
        if (fileInfo) {
          services.log('[bind] 从当前消息提取到文件附件:', fileInfo.filename)
          fileName = fileInfo.filename
          const localPath = await icsFileService.download(fileInfo.url)
          sourceText = await icsFileService.readFile(localPath)
        } else {
          const pending = icsWatcher.consume(session.userId)
          if (pending) {
            services.log('[bind] 从中间件缓存提取到文件附件:', pending.filename)
            fileName = pending.filename
            const localPath = await icsFileService.download(pending.url)
            sourceText = await icsFileService.readFile(localPath)
          }
        }
      }

      if (!sourceText) {
        services.log('[bind] 无直接参数，进入交互式等待')
        await session.send(`${config.enableQuote ? h.quote(session.messageId) : ''} ${config.bindPromptText}`)
        const promptResult = await (session as any).prompt(60000)

        if (promptResult) {
          const rawText = String(promptResult).trim()
          const cqUrl = extractIcsFromCqCode(rawText)
          if (cqUrl) {
            services.log('[bind] 交互式收到 CQ 文件码，提取到附件 URL')
            const localPath = await icsFileService.download(cqUrl)
            sourceText = await icsFileService.readFile(localPath)
          } else {
            sourceText = rawText
            services.log('[bind] 交互式收到文本, length=', sourceText.length)
          }
        } else {
          const pending = icsWatcher.consume(session.userId)
          if (pending) {
            services.log('[bind] 交互式等待期间捕获到文件:', pending.filename)
            fileName = pending.filename
            const localPath = await icsFileService.download(pending.url)
            sourceText = await icsFileService.readFile(localPath)
          } else {
            services.log('[bind] 交互式等待超时')
            const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
            return `${doQuote}操作超时，请重新绑定。`
          }
        }
      }

      if (config.enableTimetableInBindHint && isTimetableJson(sourceText)) {
        services.log('[bind] 检测到用户误传入星链作息时间表 JSON，触发拦截指引')
        const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
        const hintText = config.timetableInBindHintText
          .replace(/\{baseCommand\}/g, config.baseCommand)
          .replace(/\{timetableCommand\}/g, config.timetableCommand)
        return `${doQuote}${hintText}`
      }

      const { courses, errorMessage } = await parseSourceText(sourceText, fileName, session.channelId, targetUser, services, ctx, timeSlotManager, config)
      if (!courses.length) {
        services.log('[bind] 解析结果为空，无法导入')
        const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
        return `${doQuote}${errorMessage || DEFAULT_EMPTY_ERROR}`
      }

      services.log('[bind] 开始写入数据库(全局), 用户=', session.userId, '来源频道=', session.channelId)
      const removed = await ctx.database.remove('course_schedule', {
        userid: session.userId,
      })
      services.log('[bind] 清除旧数据, 受影响行数=', typeof removed === 'number' ? removed : 'unknown')

      for (const course of courses) {
        await ctx.database.create('course_schedule', course)
      }
      services.log('[bind] 写入完成, 共', courses.length, '门课程')

      if (config.enableStarlinkTimeHint && courses[0]?.source === 'starlink') {
        const quote = config.enableQuote ? h.quote(session.messageId) : ''
        const hintText = config.starlinkTimeHintText
          .replace(/\{baseCommand\}/g, config.baseCommand)
          .replace(/\{timetableCommand\}/g, config.timetableCommand)
        session.send(`${quote}${hintText}`)
      }

      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      return [doQuote, `✅ 已导入 ${courses.length} 门课程。`]
    })
}

interface ParseResult {
  courses: any[]
  errorMessage?: string
}

async function parseSourceText(
  sourceText: string,
  fileName: string,
  channelId: string,
  targetUser: TargetUser,
  services: CourseScheduleServices,
  ctx: Context,
  timeSlotManager: TimeSlotManager,
  config: Config,
): Promise<ParseResult> {
  const trimmed = sourceText.trim()
  const starlinkParser = new StarlinkParser(config.defaultSemesterStart)
  const jsonParser = new JsonParser()
  const wakeupFileParser = new WakeupFileParser()

  // 1. WakeUp 分享口令
  const shareKey = services.icsParser.parseWakeupShareKey(trimmed)
  if (shareKey) {
    services.log('[bind] 检测到 WakeUp 分享口令, key=', shareKey)
    let response: any
    try {
      response = await ctx.http.get(
        `https://i.wakeup.fun/share_schedule/get?key=${shareKey}`,
        {
          headers: { 'User-Agent': 'okhttp/4.12.0' },
          timeout: 15000,
          responseType: 'json',
        },
      )
    } catch (e: any) {
      services.log('[bind] WakeUp 请求异常:', e.message)
      return {
        courses: [],
        errorMessage: `❌ 请求 WakeUp 接口超时或网络异常：${e.message}`,
      }
    }

    if (response?.status === 5000004 || response?.message?.includes('版本过低')) {
      services.log('[bind] WakeUp API 返回版本过低拦截:', response?.message)
      return {
        courses: [],
        errorMessage: '⚠️ WakeUp 分享口令导入失败！\n\n📌 服务端提示：「当前版本过低，请升级」\n\n💡 原因分析：\n您当前使用的 WakeUp 课程表 App 版本过高（≥ 6.1.x，如 6.5.x 等），该版本生成的分享口令已被官方限制，无法通过公开接口获取课表数据。\n\n🛠️ 解决方案：\n请降级安装旧版本 WakeUp（实测推荐 6.0.23），在该版本中重新生成口令分享即可成功导入。\n\n📥 官方稳定版 APK 下载：\nhttps://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk',
      }
    }

    if (response?.status !== 1 || !response?.data) {
      const msg = response?.message || '未知错误'
      services.log('[bind] WakeUp API 返回异常:', msg)
      return {
        courses: [],
        errorMessage: `⚠️ WakeUp 接口返回错误：「${msg}」。\n\n💡 提示：口令可能已过期（通常 30 分钟内有效）。若使用的并非 6.0.23 版本，建议降级后再试：\nhttps://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk`,
      }
    }

    const courses = services.icsParser.convertWakeupPayload(String(response.data), channelId, targetUser)
    services.log('[bind] WakeUp 解析完成, 课程数=', courses.length)
    return { courses }
  }

  // 2. 星链课表关键词
  if (trimmed.includes('星链课表') || trimmed.includes('starlinkkb')) {
    const codeMatch = trimmed.match(/输入[：:]\s*([A-Za-z0-9_-]+)/)
      || trimmed.match(/「([A-Za-z0-9_-]+)」/)
      || trimmed.match(/分享码[为：:]\s*([A-Za-z0-9_-]+)/)
      || trimmed.match(/([A-Za-z0-9_-]{5,20})/)
    if (codeMatch?.[1]) {
      services.log('[bind] 检测到星链课表, code=', codeMatch[1])
      try {
        const userTimeSlots = await timeSlotManager.loadTimeSlots(targetUser.userId)
        if (userTimeSlots) {
          services.log('[bind] 加载用户自定义时间表, userId=', targetUser.userId, '共', userTimeSlots.length, '个时间段')
        } else {
          services.log('[bind] 未找到用户自定义时间表, 将使用默认/API时间表')
        }
        const courses = await starlinkParser.fetchAndParse(ctx, codeMatch[1], channelId, targetUser, userTimeSlots ?? undefined)
        services.log('[bind] 星链课表解析完成, 课程数=', courses.length)
        if (!courses.length) {
          return {
            courses: [],
            errorMessage: '⚠️ 星链课表解析结果为空。分享码可能已过期（通常 1 小时内有效），请在星链 App 内重新生成分享码。',
          }
        }
        return { courses }
      } catch (e: any) {
        services.log('[bind] 星链课表 API 请求失败:', e.message)
        return {
          courses: [],
          errorMessage: `❌ 请求星链课表接口失败：${e.message}`,
        }
      }
    }
  }

  // 3. JSON 文本（拾光 / 原生）
  if (trimmed.startsWith('{')) {
    let parsed: any
    try { parsed = JSON.parse(trimmed) } catch {}
    if (parsed) {
      if (starlinkParser.isStarlinkJson(parsed)) {
        services.log('[bind] 检测到星链课表 JSON')
        const userTimeSlots = await timeSlotManager.loadTimeSlots(targetUser.userId)
        if (userTimeSlots) {
          services.log('[bind] 加载用户自定义时间表, userId=', targetUser.userId, '共', userTimeSlots.length, '个时间段')
        } else {
          services.log('[bind] 未找到用户自定义时间表, 将使用默认/API时间表')
        }
        const courses = starlinkParser.convertStarlinkJson(parsed, channelId, targetUser, userTimeSlots ?? undefined)
        services.log('[bind] 星链 JSON 解析完成, 课程数=', courses.length)
        return { courses }
      }
      const jsonCourses = jsonParser.parseJsonText(trimmed, channelId, targetUser)
      if (jsonCourses) {
        services.log('[bind] JSON 课表解析完成, 课程数=', jsonCourses.length)
        return { courses: jsonCourses }
      }
      return {
        courses: [],
        errorMessage: '❌ JSON 课表解析失败：未识别到有效课程。请检查是否符合 Yunzai 原生 JSON 或星链课表 JSON 规范。',
      }
    }
  }

  // 4. WakeUp 备份文件
  if (fileName.endsWith('.wakeup_schedule') || isWakeupFileFormat(trimmed)) {
    services.log('[bind] 检测到 WakeUp 备份文件')
    const courses = wakeupFileParser.parseWakeupFileText(trimmed, channelId, targetUser)
    if (courses) {
      services.log('[bind] WakeUp 备份文件解析完成, 课程数=', courses.length)
      return { courses }
    }
  }

  // 5. ICS 文件/链接
  services.log('[bind] 未匹配到特殊格式，走 ICS 解析')
  let icsText = trimmed
  if (!/BEGIN:VCALENDAR/i.test(icsText) && /^https?:\/\//i.test(icsText)) {
    services.log('[bind] 检测到 ICS 链接，下载中...')
    icsText = await ctx.http.get(icsText, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': 'https://qun.qq.com/',
      },
    }) as string
  }
  const courses = services.icsParser.parseIcsText(icsText, channelId, targetUser)
  services.log('[bind] ICS 解析完成, 课程数=', courses.length)
  return { courses }
}

function isWakeupFileFormat(text: string): boolean {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 5) return false
  try {
    JSON.parse(lines[1])
    JSON.parse(lines[2])
    JSON.parse(lines[3])
    JSON.parse(lines[4])
    return true
  } catch {
    return false
  }
}

interface FileInfo {
  url: string
  filename: string
}

function extractFileUrlFromMessage(session: any): FileInfo | null {
  const fromElements = extractFileFromElements(session.elements as any[])
  if (fromElements) return fromElements
  const fromCq = extractFileFromCqCode(session.content)
  if (fromCq) return fromCq
  return null
}

function extractFileFromElements(elements: any[] = []): FileInfo | null {
  for (const element of elements ?? []) {
    if (!element) continue
    const attrs = element.attrs ?? {}
    const url = attrs.src || attrs.url
    const fileName = attrs.file || attrs.name || attrs.title || ''
    if (typeof url === 'string' && url && fileName) {
      return { url, filename: String(fileName) }
    }
    if (Array.isArray(element.children) && element.children.length) {
      const nested = extractFileFromElements(element.children)
      if (nested) return nested
    }
  }
  return null
}

function extractFileFromCqCode(content: string): FileInfo | null {
  if (!content) return null
  const match = content.match(/\[CQ:file[^\]]*?file=([^,\]]+)[^\]]*?url=([^,\]]+)/)
  if (match) return { url: match[2], filename: match[1] }
  const match2 = content.match(/\[CQ:file[^\]]*?url=([^,\]]+)[^\]]*?file=([^,\]]+)/)
  if (match2) return { url: match2[1], filename: match2[2] }
  return null
}

function extractIcsFromCqCode(content: string): string {
  if (!content) return ''
  const match = content.match(/\[CQ:file[^\]]*?url=([^,\]]+)/)
  return match ? match[1] : ''
}
