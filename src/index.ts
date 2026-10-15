import { Context } from 'koishi'
import { createCourseScheduleServices } from './services'
import { registerBindCommand } from './commands/bind'
import { registerUnbindCommand } from './commands/unbind'
import { registerTimetableCommand } from './commands/timetable'
import { registerGroupCommand } from './commands/group'
import { registerRankingCommand } from './commands/ranking'
import { registerTodayCommand } from './commands/today'
import { registerWeekCommand } from './commands/week'
import { IcsFileService } from './services/ics-file'
import { IcsWatcher } from './services/ics-watcher'
import { Config } from './config'
import { TimeSlotManager } from './services/timeslot-manager'

export const name = 'course-schedule'
export const inject = {
  required: ['database', 'puppeteer', 'http'],
}
export { usage } from './usage'

export { Config }

export function apply(ctx: Context, config: Config) {
  const services = createCourseScheduleServices(ctx, config)
  const icsFileService = new IcsFileService(ctx, config.scheduleFileTempDir, config.scheduleFileTempDeleteTime, services.log)
  const icsWatcher = new IcsWatcher(ctx, services.log)
  const timeSlotManager = new TimeSlotManager()

  ctx.on('ready', async () => {
    await services.dataManager.ensureStorage()
    services.registerDatabase()
    registerBindCommand(ctx, config, services, icsFileService, icsWatcher, timeSlotManager)
    registerUnbindCommand(ctx, config, services)
    registerTimetableCommand(ctx, config, services, timeSlotManager)
    registerTodayCommand(ctx, config, services)
    registerWeekCommand(ctx, config, services)
    registerGroupCommand(ctx, config, services)
    registerRankingCommand(ctx, config, services)
  })

  ctx.on('dispose', () => {
    icsFileService.dispose()
    icsWatcher.dispose()
  })
}
