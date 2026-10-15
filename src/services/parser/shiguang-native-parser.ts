import type { CourseRecord, TargetUser } from '../../types'
import { toIsoDate } from '../../utils/date'

interface TimeSlot {
  number: number
  startTime: string
  endTime: string
}

interface ShiguangCourse {
  name: string
  teacher?: string
  position?: string
  location?: string
  day: number
  startSection?: number
  endSection?: number
  startTime?: string
  endTime?: string
  isCustomTime?: boolean
  weeks?: number[]
  customStartTime?: string
  customEndTime?: string
}

interface NativeCourse {
  name: string
  teacher?: string
  location?: string
  day: number
  startTime: string
  endTime: string
  weeks?: number[]
  startNode?: number
  step?: number
}

interface ShiguangJson {
  timeSlots?: TimeSlot[]
  courses?: ShiguangCourse[]
  semesterStart?: string
  tableName?: string
}

interface NativeJson {
  courses?: NativeCourse[]
  timeSlots?: TimeSlot[]
  semesterStart?: string
  tableName?: string
}

export class ShiguangNativeParser {
  parseJsonText(
    text: string,
    channelId: string,
    targetUser: TargetUser,
  ): Omit<CourseRecord, 'id'>[] | null {
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      return null
    }

    if (this.isShiguangJson(parsed)) {
      return this.parseShiguangJson(parsed, channelId, targetUser)
    }
    if (this.isNativeJson(parsed)) {
      return this.parseNativeJson(parsed, channelId, targetUser)
    }
    return null
  }

  isShiguangJson(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false
    const courses = obj.courses
    if (!Array.isArray(courses) || !courses.length) return false
    const sample = courses[0]
    return ('startSection' in sample || 'endSection' in sample || 'isCustomTime' in sample) &&
      Array.isArray(obj.timeSlots)
  }

  isNativeJson(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false
    const courses = obj.courses
    if (!Array.isArray(courses) || !courses.length) return false
    const sample = courses[0]
    return 'startTime' in sample && 'endTime' in sample && 'day' in sample
  }

  private parseShiguangJson(
    data: ShiguangJson,
    channelId: string,
    targetUser: TargetUser,
  ): Omit<CourseRecord, 'id'>[] {
    const timeSlots = data.timeSlots ?? []
    const startDate = data.semesterStart ?? this.defaultStartDate()
    const courses: Omit<CourseRecord, 'id'>[] = []
    const uniqueKeys = new Set<string>()

    for (const course of data.courses ?? []) {
      const weekday = this.weekdayFromNumber(course.day)
      if (!weekday) continue

      let startTime = course.customStartTime ?? course.startTime ?? ''
      let endTime = course.customEndTime ?? course.endTime ?? ''

      if ((!startTime || !endTime) && course.startSection && course.endSection) {
        for (let i = course.startSection; i <= course.endSection; i++) {
          const slot = timeSlots.find(s => s.number === i)
          if (!slot) continue
          if (!startTime) startTime = slot.startTime.slice(0, 5)
          endTime = slot.endTime.slice(0, 5)
        }
      }
      if (!startTime || !endTime) continue

      const weeks = course.weeks ?? this.defaultWeeks()
      const startWeek = weeks[0] ?? 1
      const endWeek = weeks[weeks.length - 1] ?? 20

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
        source: 'shiguang',
        weeks,
        startNode: course.startSection,
        step: course.endSection ? course.endSection - course.startSection + 1 : undefined,
      }

      const uniqueKey = [
        courseRecord.channelId,
        courseRecord.userid,
        courseRecord.curriculumname,
        courseRecord.curriculumndate.join(','),
        courseRecord.curriculumtime,
      ].join('|')
      if (uniqueKeys.has(uniqueKey)) continue
      uniqueKeys.add(uniqueKey)
      courses.push(courseRecord)
    }

    return courses
  }

  private parseNativeJson(
    data: NativeJson,
    channelId: string,
    targetUser: TargetUser,
  ): Omit<CourseRecord, 'id'>[] {
    const startDate = data.semesterStart ?? this.defaultStartDate()
    const courses: Omit<CourseRecord, 'id'>[] = []
    const uniqueKeys = new Set<string>()

    for (const course of data.courses ?? []) {
      const weekday = this.weekdayFromNumber(course.day)
      if (!weekday) continue
      if (!course.startTime || !course.endTime) continue

      const weeks = course.weeks ?? this.defaultWeeks()
      const startWeek = weeks[0] ?? 1
      const endWeek = weeks[weeks.length - 1] ?? 20

      const courseRecord: Omit<CourseRecord, 'id'> = {
        channelId,
        userid: targetUser.userId,
        username: targetUser.username,
        nickname: targetUser.nickname,
        useravatar: targetUser.useravatar,
        curriculumndate: [weekday],
        curriculumname: course.name,
        curriculumtime: `${course.startTime}-${course.endTime}`,
        startDate: this.calculateDate(startDate, startWeek),
        endDate: this.calculateDate(startDate, endWeek, true),
        location: course.location ?? '',
        teacher: course.teacher ?? '',
        source: 'json',
        weeks,
        startNode: course.startNode,
        step: course.step,
      }

      const uniqueKey = [
        courseRecord.channelId,
        courseRecord.userid,
        courseRecord.curriculumname,
        courseRecord.curriculumndate.join(','),
        courseRecord.curriculumtime,
      ].join('|')
      if (uniqueKeys.has(uniqueKey)) continue
      uniqueKeys.add(uniqueKey)
      courses.push(courseRecord)
    }

    return courses
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
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    now.setDate(now.getDate() + mondayOffset)
    return toIsoDate(now)
  }

  private defaultWeeks(): number[] {
    const weeks: number[] = []
    for (let i = 1; i <= 20; i++) weeks.push(i)
    return weeks
  }
}

export { ShiguangNativeParser as JsonParser }

