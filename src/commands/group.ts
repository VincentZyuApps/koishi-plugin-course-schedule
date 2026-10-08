import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import { buildNameMap } from '../utils/name-resolver'
import { parseDayOffset } from '../utils/date'

export function registerGroupCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.groupCommand} [day:text]`, `👥 获取所有已导入用户某天的全部课程`)
    .action(async ({ session }, day) => {
      const dayOffset = parseDayOffset(day)
      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      services.log('[group] 频道=', session.channelId, 'dayOffset=', dayOffset)

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}👥 正在渲染群课表，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildNameMap(session, ctx, services.log)
      const img = await services.scheduleService.renderGroupSchedule(dayOffset, nameMap)
      services.log('[group] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      return img ? [doQuote, img] : `${doQuote}当前群组没有可渲染的课程数据。`
    })
}
