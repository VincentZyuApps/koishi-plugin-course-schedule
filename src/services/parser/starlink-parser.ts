import type { Context } from 'koishi'
import type { CourseRecord, TargetUser } from '../../types'
import { toIsoDate } from '../../utils/date'

interface StarlinkTimeSlot {
  number: number
  startTime: string
  endTime: string
}

interface UserTimeSlot {
  section: number
  startTime: string
  endTime: string
}

interface StarlinkCourse {
  name: string
  teacher?: string
  position?: string
  location?: string
  weekday: number
  startSection: number
  endSection: number
  startWeek?: number
  endWeek?: number
  weeks?: number[]
  isCustomTime?: boolean
  customStartTime?: string
  custom_endTime?: string
  startTime?: string
  endTime?: string
}

interface StarlinkResponseData {
  tableName?: string
  name?: string
  startDate?: string
  timeSlots?: StarlinkTimeSlot[]
  courses?: StarlinkCourse[]
}

interface StarlinkApiResponse {
  data?: StarlinkResponseData
}

const DEFAULT_TIME_SLOTS: StarlinkTimeSlot[] = [
  { number: 1, startTime: '08:00', endTime: '08:45' },
  { number: 2, startTime: '08:50', endTime: '09:35' },
  { number: 3, startTime: '09:50', endTime: '10:35' },
  { number: 4, startTime: '10:40', endTime: '11:25' },
  { number: 5, startTime: '11:30', endTime: '12:15' },
  { number: 6, startTime: '14:00', endTime: '14:45' },
  { number: 7, startTime: '14:50', endTime: '15:35' },
  { number: 8, startTime: '15:40', endTime: '16:25' },
  { number: 9, startTime: '16:30', endTime: '17:15' },
  { number: 10, startTime: '19:00', endTime: '19:45' },
  { number: 11, startTime: '19:50', endTime: '20:35' },
  { number: 12, startTime: '20:40', endTime: '21:25' },
]

export class StarlinkParser {
  constructor(private defaultSemesterStart = '2026-09-07') {}

  async fetchAndParse(
    ctx: Context,
    shareCode: string,
    channelId: string,
    targetUser: TargetUser,
    userTimeSlots?: UserTimeSlot[],
  ): Promise<Omit<CourseRecord, 'id'>[]> {
    const resp = await ctx.http.get<StarlinkApiResponse>(
      `https://api.starlinkkb.cn/share/curriculum/${shareCode}`,
      { timeout: 15000 },
    )
    const data = resp?.data
    if (!data?.courses?.length) return []
    return this.convertStarlinkJson(data, channelId, targetUser, userTimeSlots)
  }

  convertStarlinkJson(
    data: StarlinkResponseData,
    channelId: string,
    targetUser: TargetUser,
    userTimeSlots?: UserTimeSlot[],
  ): Omit<CourseRecord, 'id'>[] {
    const timeSlots = this.resolveTimeSlots(data.timeSlots, userTimeSlots)
    const source = userTimeSlots?.length ? 'user' : (data.timeSlots?.length ? 'api' : 'default')
    console.log(`[starlink-parser] 使用${source === 'user' ? '用户自定义' : source === 'api' ? 'API返回的' : '默认'}时间表, 共${timeSlots.length}个时间段`)
    const startDate = data.startDate ?? this.defaultStartDate()
    const courses: Omit<CourseRecord, 'id'>[] = []
    const uniqueKeys = new Set<string>()

    for (const course of data.courses ?? []) {
      const weekday = this.weekdayFromNumber(course.weekday)
      if (!weekday) continue

      let startTime = course.customStartTime ?? ''
      let endTime = course.custom_endTime ?? ''

      if (!startTime || !endTime) {
        for (let i = course.startSection; i <= course.endSection; i++) {
          const slot = timeSlots.find(s => s.number === i)
          if (!slot) continue
          if (!startTime) startTime = slot.startTime.slice(0, 5)
          endTime = slot.endTime.slice(0, 5)
        }
      }

      if (!startTime || !endTime) {
        startTime = course.startTime ?? ''
        endTime = course.endTime ?? ''
      }

      if (!startTime || !endTime) continue

      const weeks = this.calculateWeeks(course, startDate)
      const startWeek = course.startWeek ?? weeks[0] ?? 1
      const endWeek = course.endWeek ?? weeks[weeks.length - 1] ?? 20

      const courseRecord: Omit<CourseRecord, 'id'> = {
        channelId,
        userid: targetUser.userId,
        username: targetUser.username,
        nickname: targetUser.nickname,
        useravatar: targetUser.useravatar,
        curriculumndate: [weekday],
        curriculumname: course.name,
        curriculumtime: `${startTime}-${endTime}`,
        startDate: this.calculateDate(startDate, startWeek),
        endDate: this.calculateDate(startDate, endWeek, true),
        location: course.position ?? course.location ?? '',
        teacher: course.teacher ?? '',
        source: 'starlink',
        weeks,
        startNode: course.startSection,
        step: course.endSection - course.startSection + 1,
      }

      const uniqueKey = [
        courseRecord.channelId,
        courseRecord.userid,
        courseRecord.curriculumname,
        courseRecord.curriculumndate.join(','),
        courseRecord.curriculumtime,
        courseRecord.startDate,
        courseRecord.endDate,
      ].join('|')
      if (uniqueKeys.has(uniqueKey)) continue
      uniqueKeys.add(uniqueKey)
      courses.push(courseRecord)
    }

    return this.mergeContinuousCourses(courses)
  }

  isStarlinkJson(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false
    const courses = obj.courses
    if (!Array.isArray(courses) || !courses.length) return false
    const sample = courses[0]
    return 'startSection' in sample && 'weekday' in sample
  }

  private mergeContinuousCourses(
    courses: Omit<CourseRecord, 'id'>[],
  ): Omit<CourseRecord, 'id'>[] {
    const merged: Omit<CourseRecord, 'id'>[] = []
    const sorted = [...courses].sort((a, b) => {
      if (a.curriculumname !== b.curriculumname) return a.curriculumname.localeCompare(b.curriculumname, 'zh-CN')
      if (a.curriculumndate[0] !== b.curriculumndate[0]) return a.curriculumndate[0].localeCompare(b.curriculumndate[0])
      return a.curriculumtime.localeCompare(b.curriculumtime)
    })

    let current = sorted[0]
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]
      if (
        current.curriculumname === next.curriculumname &&
        current.curriculumndate[0] === next.curriculumndate[0] &&
        current.location === next.location &&
        current.teacher === next.teacher &&
        this.isTimeContinuous(current.curriculumtime, next.curriculumtime)
      ) {
        const [, curEnd] = current.curriculumtime.split('-')
        const [nextStart] = next.curriculumtime.split('-')
        current.curriculumtime = `${current.curriculumtime.split('-')[0]}-${nextStart}`
        current.step = (current.step ?? 1) + (next.step ?? 1)
      } else {
        merged.push(current)
        current = next
      }
    }
    if (current) merged.push(current)
    return merged
  }

  private isTimeContinuous(curTime: string, nextTime: string): boolean {
    const [, curEnd] = curTime.split('-')
    const [nextStart] = nextTime.split('-')
    if (!curEnd || !nextStart) return false
    const curMin = this.timeToMinutes(curEnd)
    const nextMin = this.timeToMinutes(nextStart)
    return nextMin - curMin <= 10
  }

  private calculateWeeks(course: StarlinkCourse, startDate: string): number[] {
    if (course.weeks) return course.weeks
    const start = course.startWeek ?? 1
    const end = course.endWeek ?? 20
    const weeks: number[] = []
    for (let i = start; i <= end; i++) weeks.push(i)
    return weeks
  }

  private calculateDate(termStartDate: string, week: number, asWeekEnd = false) {
    const date = new Date(termStartDate)
    let dayOffset = (week - 1) * 7
    if (asWeekEnd) dayOffset += 6
    date.setDate(date.getDate() + dayOffset)
    return toIsoDate(date)
  }

  private weekdayFromNumber(day: number): string {
    const map: Record<number, string> = {
      1: '周一', 2: '周二', 3: '周三', 4: '周四',
      5: '周五', 6: '周六', 7: '周日',
    }
    return map[day] ?? ''
  }

  private defaultStartDate(): string {
    return this.defaultSemesterStart || '2026-09-07'
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  private resolveTimeSlots(
    apiTimeSlots?: StarlinkTimeSlot[],
    userTimeSlots?: UserTimeSlot[],
  ): StarlinkTimeSlot[] {
    if (userTimeSlots?.length) {
      return userTimeSlots.map(u => ({
        number: u.section,
        startTime: u.startTime,
        endTime: u.endTime,
      }))
    }
    if (apiTimeSlots?.length) return apiTimeSlots
    return DEFAULT_TIME_SLOTS
  }
}
