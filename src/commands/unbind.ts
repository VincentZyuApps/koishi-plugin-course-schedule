import { h, Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'

export function registerUnbindCommand(
  ctx: Context,
  config: Config,
  services: CourseScheduleServices,
) {
  ctx.command(`${config.baseCommand}.${config.unbindCommand}`, `🗑️ 解绑并清空个人课表`)
    .action(async ({ session }) => {
      const userid = session.userId
      if (!userid) return '❌ 无法获取您的用户 ID'

      const existing = await ctx.database.get('course_schedule', { userid })
      if (!existing.length) {
        const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
        return `${doQuote}ℹ️ 您当前尚未绑定任何课表数据，无需解绑捏~`
      }

      const count = existing.length
      await ctx.database.remove('course_schedule', { userid })
      services.log('[unbind] 用户成功解绑，清除课程数:', count, '用户 ID:', userid)

      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      return `${doQuote}🗑️ 解绑成功！已为您清除 ${count} 门课程记录。\n💡 您现在可以发送「${config.baseCommand}.${config.bindCommand}」重新导入课表进行测试捏~`
    })
}
