import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import { buildNameMap } from '../utils/name-resolver'

export function registerRankingCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.rankingCommand}`, `📊 查看本周上课排行榜`)
    .action(async ({ session }) => {
      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      services.log('[ranking] 频道=', session.channelId)

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}📊 正在渲染排行榜，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildNameMap(session, ctx, services.log)
      const img = await services.scheduleService.renderWeeklyRanking(nameMap)
      services.log('[ranking] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      return img ? [doQuote, img] : `${doQuote}当前群组没有排行数据。`
    })
}
