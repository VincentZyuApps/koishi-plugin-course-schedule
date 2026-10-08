import type { Context } from 'koishi'
import type { Config } from '../config'
import { DataManager } from './data-manager'
import { ICSParser } from './ics-parser'
import { ScheduleService } from './schedule-service'
import { ImageGenerator } from '../render/image-generator'
import { HolidayService } from './holiday'

export function createCourseScheduleServices(ctx: Context, config: Config) {
  const dataManager = new DataManager(ctx)
  const icsParser = new ICSParser()
  const imageGenerator = new ImageGenerator(ctx, config.textFontMode, config.textFontPath, config.renderWaitUntil, config.verboseConsoleLog, config.renderColors, config.renderFooterText, config.nameDisplayStyle)
  const logFn = (...args: unknown[]) => {
    if (config.verboseConsoleLog) ctx.logger.info('[course-schedule]', ...args)
  }
  const holidayService = new HolidayService(ctx, config.holidayCacheDir, logFn)
  const scheduleService = new ScheduleService(ctx, dataManager, icsParser, imageGenerator, holidayService)

  return {
    dataManager,
    icsParser,
    imageGenerator,
    holidayService,
    scheduleService,
    registerDatabase() {
      dataManager.registerDatabase()
    },
    log: logFn,
  }
}

export type CourseScheduleServices = ReturnType<typeof createCourseScheduleServices>
