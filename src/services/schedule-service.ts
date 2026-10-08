import type { Context } from 'koishi'
import { TABLE_NAME } from '../constants'
import type { CourseRecord, DayCourseView, RankingItem, WeeklyDayView, WeeklyCourseView } from '../types'
import type { DataManager } from './data-manager'
import type { ICSParser } from './ics-parser'
import type { ImageGenerator } from '../render/image-generator'
import type { HolidayService } from './holiday'
import {
  formatDurationMinutes,
  getDayOffsetDate,
  getWeekRange,
  isCourseActiveOnDate,
  toIsoDate,
  weekdayNameOfDate,
  calculateDateFromWeekAndDay,
  getWeekNumberFromDate,
} from '../utils/date'

export type NameMap = Map<string, { username: string; nickname: string }>

export class ScheduleService {
  constructor(
    private ctx: Context,
    private _dataManager: DataManager,
    private _icsParser: ICSParser,
    private imageGenerator: ImageGenerator,
    private holidayService: HolidayService,
  ) {}

  private log(...args: unknown[]) {
    this.ctx.logger.info('[course-schedule]', ...args)
  }

  // 全局查询：不按频道过滤，身份键只有 userid
  async listAllCourses() {
    const courses = await (this.ctx.database.get(TABLE_NAME, {}) as Promise<CourseRecord[]>)
    const deduped = this.dedupeCourses(courses)
    this.log('[schedule] listAllCourses, count=', deduped.length, '(raw=', courses.length, ')')
    return deduped
  }

  async listUserCourses(userid: string) {
    const courses = await (this.ctx.database.get(TABLE_NAME, { userid }) as Promise<CourseRecord[]>)
    const deduped = this.dedupeCourses(courses)
    this.log('[schedule] listUserCourses, user=', userid, 'count=', deduped.length, '(raw=', courses.length, ')')
    return deduped
  }

  // 旧版本按频道存过多份相同课程，这里按课程签名去重，避免个人课表/排行重复
  private dedupeCourses(courses: CourseRecord[]): CourseRecord[] {
    const seen = new Set<string>()
    const result: CourseRecord[] = []
    for (const course of courses) {
      const key = [
        course.userid,
        course.curriculumname,
        (course.curriculumndate ?? []).join(''),
        course.curriculumtime,
        course.startDate,
        course.endDate,
        course.location ?? '',
      ].join('|')
      if (seen.has(key)) continue
      seen.add(key)
      result.push(course)
    }
    return result
  }

  async renderPersonalSchedule(userid: string, dayOffset = 0, nameMap?: NameMap) {
    const targetDate = getDayOffsetDate(dayOffset)
    const currentWeekday = weekdayNameOfDate(targetDate)
    const allCourses = await this.listUserCourses(userid)
    const semesterStart = this.getSemesterStart(allCourses)

    const holidayInfo = await this.holidayService.getHolidayInfoForDate(targetDate)
    if (holidayInfo?.isHoliday) {
      const rescheduled = allCourses.filter(c => isCourseActiveOnDate(c, targetDate, currentWeekday, semesterStart))
      if (!rescheduled.length) {
        return `今天是 ${holidayInfo.name}，好好休息吧！🎉`
      }
    } else if (holidayInfo?.isWorkdayOnWeekend) {
      this.log('[schedule] 今天是调休上班日:', holidayInfo.name)
    }

    const courses = allCourses
      .filter(course => isCourseActiveOnDate(course, targetDate, currentWeekday, semesterStart))
      .sort((a, b) => a.curriculumtime.localeCompare(b.curriculumtime, 'zh-CN'))

    this.log('[schedule] renderPersonalSchedule, 总数=', allCourses.length, '筛选后=', courses.length)
    const items = courses.map(course => this.toDayCourseView(course, dayOffset, nameMap))
    return this.imageGenerator.renderPersonalSchedule(items, targetDate)
  }

  async renderGroupSchedule(dayOffset = 0, nameMap?: NameMap) {
    const targetDate = getDayOffsetDate(dayOffset)
    const weekday = weekdayNameOfDate(targetDate)
    const courses = await this.listAllCourses()
    const semesterStart = this.getSemesterStart(courses)

    this.log('[group] === 群课表渲染开始 ===')
    this.log('[group] 目标日期:', toIsoDate(targetDate), `(${weekday})`, 'dayOffset=', dayOffset)

    for (let i = 0; i < courses.length; i++) {
      const c = courses[i]
      this.log(`[group]   DB课程${i + 1}: ${c.curriculumname} | ${c.curriculumndate.join(',')} | ${c.startDate} ~ ${c.endDate} | ${c.curriculumtime} | 用户=${c.userid}`)
    }

    const holidayInfo = await this.holidayService.getHolidayInfoForDate(targetDate)
    if (holidayInfo?.isHoliday) {
      const rescheduled = courses.filter(c => isCourseActiveOnDate(c, targetDate, weekday, semesterStart))
      if (!rescheduled.length) {
        return `今天是 ${holidayInfo.name}，群友们都在休息！🎉`
      }
    } else if (holidayInfo?.isWorkdayOnWeekend) {
      this.log('[group] 今天是调休上班日:', holidayInfo.name)
    }

    const byUser = new Map<string, CourseRecord[]>()
    let passedCount = 0
    let filteredCount = 0

    for (const course of courses) {
      if (!isCourseActiveOnDate(course, targetDate, weekday, semesterStart)) {
        filteredCount++
        const reasons: string[] = []
        if (!course.curriculumndate.includes(weekday)) reasons.push('星期不匹配')
        if (toIsoDate(targetDate) < course.startDate) reasons.push('日期早于startDate')
        if (toIsoDate(targetDate) > course.endDate) reasons.push('日期晚于endDate')
        if (course.weeks?.length) {
          const weekNum = getWeekNumberFromDate(semesterStart, targetDate)
          if (!course.weeks.includes(weekNum)) reasons.push(`周数${weekNum}不在weeks数组中`)
        }
        this.log(`[group]   过滤掉: ${course.curriculumname} (原因: ${reasons.join(', ')})`)
        continue
      }
      passedCount++
      const bucket = byUser.get(course.userid) ?? []
      bucket.push(course)
      byUser.set(course.userid, bucket)
    }

    this.log('[group] 过滤结果: 通过=', passedCount, '未通过=', filteredCount, '独立用户=', byUser.size)

    const items: DayCourseView[] = []
    for (const [userid, userCourses] of byUser) {
      userCourses.sort((a, b) => a.curriculumtime.localeCompare(b.curriculumtime, 'zh-CN'))
      this.log(`[group]   用户 ${userid}: ${userCourses.length} 条课程`)
      for (const uc of userCourses) {
        this.log(`[group]     - ${uc.curriculumname} | ${uc.curriculumtime} | ${uc.location}`)
      }
      const active = this.pickRepresentativeCourse(userCourses, dayOffset)
      if (active) {
        this.log(`[group]     代表课程: ${active.curriculumname} | ${active.curriculumtime} | ${active.location}`)
        const view = this.toDayCourseView(active, dayOffset, nameMap)
        this.log(`[group]     DayCourseView: courseName=${view.courseName}, startTime=${view.startTime}, endTime=${view.endTime}, location=${view.location}, status=${view.status}`)
        items.push(view)
      } else {
        const sample = userCourses[0]
        const nameInfo = nameMap?.get(userid) ?? { username: sample.username, nickname: sample.nickname ?? '' }
        if (dayOffset === 0) {
          this.log(`[group]     无代表课程, 今日所有课程已结束`)
          items.push({
            userid,
            username: nameInfo.username,
            nickname: nameInfo.nickname,
            useravatar: sample.useravatar,
            courseName: '已结束',
            startTime: '',
            endTime: '',
            location: '',
            status: 'finished',
            statusDetail: '今日所有课程已结束',
          })
        } else {
          this.log(`[group]     无代表课程, 使用 nocourse`)
          items.push({
            userid,
            username: nameInfo.username,
            nickname: nameInfo.nickname,
            useravatar: sample.useravatar,
            courseName: '所选日期无课',
            startTime: '',
            endTime: '',
            location: '',
            status: 'nocourse',
            statusDetail: '',
          })
        }
      }
    }

    this.log('[group] 最终 items 数量:', items.length)
    this.log('[group] === 群课表渲染结束 ===')

    return this.imageGenerator.renderGroupSchedule(items, targetDate)
  }

  async getWeeklyRanking(nameMap?: NameMap) {
    const courses = await this.listAllCourses()
    const semesterStart = this.getSemesterStart(courses)
    const week = getWeekRange(new Date())
    const ranking = new Map<string, RankingItem>()

    for (const course of courses) {
      const weekdays = course.curriculumndate ?? []
      const [startTime, endTime] = course.curriculumtime.split('-')
      const duration = this.diffMinutes(startTime, endTime)
      if (duration <= 0) continue

      for (const day of week.days) {
        if (!isCourseActiveOnDate(course, day.date, day.weekday, semesterStart)) continue
        if (!weekdays.includes(day.weekday)) continue
        const nameInfo = nameMap?.get(course.userid) ?? { username: course.username, nickname: course.nickname ?? '' }
        const item = ranking.get(course.userid) ?? {
          userid: course.userid,
          username: nameInfo.username,
          nickname: nameInfo.nickname,
          useravatar: course.useravatar,
          totalMinutes: 0,
          courseCount: 0,
        }
        item.totalMinutes += duration
        item.courseCount += 1
        ranking.set(course.userid, item)
      }
    }

    return Array.from(ranking.values()).sort((a, b) => b.totalMinutes - a.totalMinutes)
  }

  async renderWeeklyRanking(nameMap?: NameMap) {
    const ranking = await this.getWeeklyRanking(nameMap)
    this.log('[schedule] renderWeeklyRanking, 参与人数=', ranking.length)
    const week = getWeekRange(new Date())
    const dateRange = `${week.days[0].date.toLocaleDateString('zh-CN')} - ${week.days[6].date.toLocaleDateString('zh-CN')}`
    return this.imageGenerator.renderRanking(ranking, dateRange)
  }

  async renderWeeklySchedule(userid: string, weekNumber?: number, nameMap?: NameMap) {
    const allCourses = await this.listUserCourses(userid)
    if (!allCourses.length) return null

    const semesterStart = this.getSemesterStart(allCourses)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentWeek = getWeekNumberFromDate(semesterStart, today)
    const week = weekNumber ?? currentWeek
    if (week < 1) return '周数不能小于 1'

    const maxWeek = Math.max(...allCourses.flatMap(c => c.weeks?.length ? c.weeks : []), 0)
    if (maxWeek > 0 && week > maxWeek) return `第 ${week} 周已超出本学期课程周数`

    const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const days: WeeklyDayView[] = []

    const yearDates = days.map(() => new Date())
    const firstDate = calculateDateFromWeekAndDay(semesterStart, week, 1)
    if (firstDate) await this.holidayService.loadHolidayData(firstDate.getFullYear())

    for (let d = 1; d <= 7; d++) {
      const targetDate = calculateDateFromWeekAndDay(semesterStart, week, d)
      if (!targetDate) continue
      const dateStr = targetDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
      const isToday = targetDate.getTime() === today.getTime()
      const weekday = weekdayNameOfDate(targetDate)

      const holidayInfo = await this.holidayService.getHolidayInfoForDate(targetDate)
      const isHoliday = holidayInfo?.isHoliday ?? false
      const holidayName = holidayInfo?.name ?? ''
      const isWorkdayOnWeekend = holidayInfo?.isWorkdayOnWeekend ?? false

      const dayCourses = allCourses
        .filter(c => c.curriculumndate.includes(weekday) && isCourseActiveOnDate(c, targetDate, weekday, semesterStart))
        .sort((a, b) => a.curriculumtime.localeCompare(b.curriculumtime, 'zh-CN'))

      const courses: WeeklyCourseView[] = dayCourses.map(c => {
        const [startTime, endTime] = c.curriculumtime.split('-')
        return {
          name: c.curriculumname,
          startTime: startTime ?? '',
          endTime: endTime ?? '',
          location: c.location ?? '',
          teacher: (c as any).teacher ?? '',
          rescheduled: (c as any).rescheduled ?? false,
          originalDate: (c as any).originalDate ?? '',
        }
      })

      days.push({ label: weekdayLabels[d - 1], date: dateStr, isToday, isHoliday, holidayName, isWorkdayOnWeekend, courses })
    }

    const monDate = calculateDateFromWeekAndDay(semesterStart, week, 1)
    const sunDate = calculateDateFromWeekAndDay(semesterStart, week, 7)
    let dateRange = ''
    if (monDate && sunDate) {
      dateRange = `${monDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} - ${sunDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}`
    }

    const nameInfo = nameMap?.get(userid)
    const username = nameInfo?.username ?? allCourses[0]?.username ?? `用户 ${userid}`
    const nickname = nameInfo?.nickname ?? allCourses[0]?.nickname ?? ''
    this.log('[schedule] renderWeeklySchedule, 周数=', week, '用户=', userid)
    return this.imageGenerator.renderWeeklySchedule(username, nickname, week, dateRange, days)
  }

  private getSemesterStart(courses: CourseRecord[]): string {
    let earliest = courses[0]?.startDate ?? toIsoDate(new Date())
    for (const c of courses) {
      if (c.startDate < earliest) earliest = c.startDate
    }
    return earliest
  }

  private pickRepresentativeCourse(courses: CourseRecord[], dayOffset: number) {
    if (dayOffset !== 0) return courses[0] ?? null
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
    let nextCourse: CourseRecord | null = null

    for (const course of courses) {
      const [startTime, endTime] = course.curriculumtime.split('-')
      const start = this.timeToMinutes(startTime)
      const end = this.timeToMinutes(endTime)
      if (start <= nowMinutes && nowMinutes <= end) return course
      if (start > nowMinutes && (!nextCourse || start < this.timeToMinutes(nextCourse.curriculumtime.split('-')[0]))) {
        nextCourse = course
      }
    }

    return nextCourse ?? null
  }

  private toDayCourseView(course: CourseRecord, dayOffset: number, nameMap?: NameMap): DayCourseView {
    const [startTime, endTime] = course.curriculumtime.split('-')
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes()
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)

    let status: DayCourseView['status'] = dayOffset === 0 ? 'finished' : 'next'
    let statusDetail = ''
    if (dayOffset === 0) {
      if (start <= currentMinutes && currentMinutes <= end) {
        status = 'ongoing'
        statusDetail = `剩余 ${formatDurationMinutes(end - currentMinutes)}`
      } else if (start > currentMinutes) {
        status = 'next'
        statusDetail = `${formatDurationMinutes(start - currentMinutes)}后`
      }
    }

    const nameInfo = nameMap?.get(course.userid) ?? { username: course.username, nickname: course.nickname ?? '' }
    return {
      userid: course.userid,
      username: nameInfo.username,
      nickname: nameInfo.nickname,
      useravatar: course.useravatar,
      courseName: course.curriculumname,
      startTime,
      endTime,
      location: course.location ?? '',
      status,
      statusDetail,
    }
  }

  private timeToMinutes(value: string) {
    const [hour, minute] = value.split(':').map(Number)
    return hour * 60 + minute
  }

  private diffMinutes(start: string, end: string) {
    return this.timeToMinutes(end) - this.timeToMinutes(start)
  }
}
