import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import { buildSingleNameMap, extractTargetUserId } from '../utils/name'

function isLikelyWeekOffset(text: string): boolean {
  const trimmed = text.trim()
  if (['本周', '这周', '上周', '下周'].includes(trimmed)) return true
  const n = Number(trimmed)
  return !Number.isNaN(n) && n > 0 && n <= 50
}

export function registerWeekCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.weekCommand} [targetUser:text]`, `📅 查看某人的周课表纵览（支持 @某人 或 指定用户ID）`)
    .option('offset', '-o, --offset <offset:string> 指定学期周数（如 1~25、本周 等）')
    .action(async ({ session, options }, targetUser) => {
      let effectiveWeek = options?.offset
      let targetUserId = session.userId

      if (targetUser) {
        // 向下兼容：若未传入 -o，且参数是明确的周数（如 12、本周 等），则视为 offset
        if (!options?.offset && isLikelyWeekOffset(targetUser) && !targetUser.includes('<at')) {
          effectiveWeek = targetUser
        } else {
          targetUserId = extractTargetUserId(targetUser, session.userId)
        }
      }

      let weekNumber: number | undefined
      if (effectiveWeek) {
        const trimmed = effectiveWeek.trim()
        if (trimmed === '本周' || trimmed === '这周') {
          weekNumber = undefined
        } else if (trimmed === '上周') {
          weekNumber = -1
        } else if (trimmed === '下周') {
          weekNumber = -2
        } else {
          const n = Number(trimmed)
          if (!Number.isNaN(n) && n > 0) {
            weekNumber = n
          }
        }
      }

      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''

      if (weekNumber === -1 || weekNumber === -2) {
        return `${doQuote}上周/下周功能需要记录学期开始日期，暂未实现。请使用「${config.baseCommand}.${config.weekCommand} -o 5」指定周数。`
      }

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}📅 正在渲染周课表，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildSingleNameMap(session, targetUserId, services.log)
      const img = await services.scheduleService.renderWeeklySchedule(targetUserId, weekNumber, nameMap)
      services.log('[week] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      if (typeof img === 'string') return `${doQuote}${img}`
      return img ? [doQuote, img] : `${doQuote}当前没有可渲染的课程数据。`
    })
}
