import type { CourseRecord, TargetUser } from '../../types'
import { toIsoDate } from '../../utils/date'

interface WakeupTimeSlot {
  node: number
  startTime: string
  endTime: string
}

interface WakeupTableInfo {
  startDate: string
  tableName?: string
}

interface WakeupCourseInfo {
  id: number
  courseName: string
  teacher?: string
}

interface WakeupCourseDetail {
  id: number
  day: number
  startNode: number
  step: number
  startWeek: number
  endWeek: number
  type: number
  room?: string
  ownTime?: boolean
  teacher?: string
}

export class WakeupFileParser {
  parseWakeupFileText(
    text: string,
    channelId: string,
    targetUser: TargetUser,
  ): Omit<CourseRecord, 'id'>[] | null {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 5) return null

    let timeTable: WakeupTimeSlot[]
    let tableInfo: WakeupTableInfo
    let courseInfos: WakeupCourseInfo[]
    let courseDetails: WakeupCourseDetail[]

    try {
      timeTable = JSON.parse(lines[1])
      tableInfo = JSON.parse(lines[2])
      courseInfos = JSON.parse(lines[3])
      courseDetails = JSON.parse(lines[4])
    } catch {
      return null
    }

    if (!Array.isArray(timeTable) || !Array.isArray(courseDetails)) return null

    const weekdayMap: Record<number, string> = {
      1: '周一', 2: '周二', 3: '周三', 4: '周四',
      5: '周五', 6: '周六', 7: '周日',
    }

    const courses: Omit<CourseRecord, 'id'>[] = []
    const uniqueKeys = new Set<string>()
    const startDate = tableInfo.startDate ?? this.defaultStartDate()

    for (const detail of courseDetails) {
      if (detail.ownTime) continue
      const courseInfo = courseInfos.find(item => item.id === detail.id)
      if (!courseInfo) continue

      const weekday = weekdayMap[detail.day]
      if (!weekday) continue

      let startTime = ''
      let endTime = ''
      for (let i = detail.startNode; i < detail.startNode + detail.step; i++) {
        const slot = timeTable.find(item => item.node === i)
        if (!slot) continue
        if (!startTime) startTime = slot.startTime.slice(0, 5)
        endTime = slot.endTime.slice(0, 5)
      }
      if (!startTime || !endTime) continue

      const weeks = this.calculateWeeks(detail)
      const teacher = detail.teacher ?? courseInfo.teacher ?? ''

      const courseRecord: Omit<CourseRecord, 'id'> = {
        channelId,
        userid: targetUser.userId,
        username: targetUser.username,
        nickname: targetUser.nickname,
        useravatar: targetUser.useravatar,
        curriculumndate: [weekday],
        curriculumname: courseInfo.courseName,
        curriculumtime: `${startTime}-${endTime}`,
        startDate: this.calculateDate(startDate, detail.startWeek),
        endDate: this.calculateDate(startDate, detail.endWeek, true),
        location: detail.room ?? '',
        teacher,
        source: 'wakeup-file',
        weeks,
        startNode: detail.startNode,
        step: detail.step,
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

    return courses
  }

  private calculateWeeks(detail: WakeupCourseDetail): number[] {
    const weeks: number[] = []
    for (let w = detail.startWeek; w <= detail.endWeek; w++) {
      if (detail.type === 0) {
        weeks.push(w)
      } else if (detail.type === 1 && w % 2 === 1) {
        weeks.push(w)
      } else if (detail.type === 2 && w % 2 === 0) {
        weeks.push(w)
      }
    }
    return weeks
  }

  private calculateDate(termStartDate: string, week: number, asWeekEnd = false) {
    const date = new Date(termStartDate)
    let dayOffset = (week - 1) * 7
    if (asWeekEnd) dayOffset += 6
    date.setDate(date.getDate() + dayOffset)
    return toIsoDate(date)
  }

  private defaultStartDate(): string {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    now.setDate(now.getDate() + mondayOffset)
    return toIsoDate(now)
  }
}
