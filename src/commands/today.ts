import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import { buildSingleNameMap, extractTargetUserId } from '../utils/name'
import { parseDayOffset } from '../utils/date'

const DAY_KEYWORDS = new Set([
  '今天', '明天', '后天', '大后天',
  '昨天', '前天', '大前天',
  '周一', '周二', '周三', '周四', '周五', '周六', '周日',
  '礼拜一', '礼拜二', '礼拜三', '礼拜四', '礼拜五', '礼拜六', '礼拜日',
  '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日',
])

function isLikelyDayOffset(text: string): boolean {
  const trimmed = text.trim()
  if (DAY_KEYWORDS.has(trimmed)) return true
  if (/^[+-]?\d+$/.test(trimmed)) {
    const num = Number(trimmed)
    return Math.abs(num) <= 30
  }
  return false
}

export function registerTodayCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.todayCommand} [targetUser:text]`, `📋 查看某人的某天全部课程（支持 @某人 或 指定用户ID）`)
    .option('offset', '-o, --offset <offset:string> 指定日期偏移（如 今天、明天、周几、数字等）')
    .action(async ({ session, options }, targetUser) => {
      let effectiveOffset = options?.offset
      let targetUserId = session.userId

      if (targetUser) {
        // 向下兼容：若未传入 -o，且参数是明确的日期关键词或偏移数值，则视为 offset
        if (!options?.offset && isLikelyDayOffset(targetUser) && !targetUser.includes('<at')) {
          effectiveOffset = targetUser
        } else {
          targetUserId = extractTargetUserId(targetUser, session.userId)
        }
      }

      const dayOffset = parseDayOffset(effectiveOffset)
      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      services.log('[today] 频道=', session.channelId, '目标用户=', targetUserId, '发起用户=', session.userId, 'dayOffset=', dayOffset)

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}📋 正在渲染课表，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildSingleNameMap(session, targetUserId, services.log)
      const img = await services.scheduleService.renderPersonalSchedule(targetUserId, dayOffset, nameMap)
      services.log('[today] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      return img ? [doQuote, img] : `${doQuote}当前没有可渲染的课程数据。`
    })
}
