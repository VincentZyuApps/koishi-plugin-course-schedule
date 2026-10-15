import { DEFAULT_ICS_IMPORT_DAYS } from '../../constants'
import type { CourseRecord, TargetUser } from '../../types'
import { toIsoDate, weekdayCodeToName, weekdayNameOfDate } from '../../utils/date'

interface WakeupTimeSlot {
  node: number
  startTime: string
  endTime: string
}

interface WakeupTableInfo {
  startDate: string
}

interface WakeupCourseInfo {
  id: number
  courseName: string
}

interface WakeupCourseDetail {
  id: number
  day: number
  startNode: number
  step: number
  startWeek: number
  endWeek: number
  room?: string
  ownTime?: boolean
}

export class ICSParser {
  parseIcsText(
    text: string,
    channelId: string,
    targetUser: TargetUser,
  ): Omit<CourseRecord, 'id'>[] {
    const events = this.extractEventBlocks(text)
    const uniqueKeys = new Set<string>()
    const courses: Omit<CourseRecord, 'id'>[] = []

    for (const block of events) {
      const fields = this.parseEventFields(block)
      const summary = fields.SUMMARY?.value?.trim()
      const dtstart = fields.DTSTART?.value?.trim()
      const dtend = fields.DTEND?.value?.trim()
      if (!summary || !dtstart || !dtend) continue

      const start = this.parseIcsDateTime(dtstart)
      const end = this.parseIcsDateTime(dtend)
      if (!start || !end) continue

      const startTime = this.formatTime(start)
      const endTime = this.formatTime(end)
      const startDate = toIsoDate(start)
      const fallbackEnd = new Date(start)
      fallbackEnd.setDate(fallbackEnd.getDate() + DEFAULT_ICS_IMPORT_DAYS)

      let weekdays = [weekdayNameOfDate(start)]
      let endDate = startDate

      const rruleRaw = fields.RRULE?.value?.trim()
      if (rruleRaw) {
        const rule = this.parseRRule(rruleRaw)
        if (rule.BYDAY) {
          weekdays = rule.BYDAY
            .split(',')
            .map(item => weekdayCodeToName(item.trim()))
            .filter(Boolean)
        }

        if (rule.UNTIL) {
          const until = this.parseIcsDateTime(rule.UNTIL)
          endDate = until ? toIsoDate(until) : toIsoDate(fallbackEnd)
        } else {
          endDate = toIsoDate(fallbackEnd)
        }
      }

      const course: Omit<CourseRecord, 'id'> = {
        channelId,
        userid: targetUser.userId,
        username: targetUser.username,
        nickname: targetUser.nickname,
        useravatar: targetUser.useravatar,
        curriculumndate: weekdays,
        curriculumname: summary,
        curriculumtime: `${startTime}-${endTime}`,
        startDate,
        endDate,
        location: fields.LOCATION?.value?.trim() ?? '',
        source: 'ics',
      }

      const uniqueKey = [
        course.channelId,
        course.userid,
        course.curriculumname,
        course.curriculumndate.join(','),
        course.curriculumtime,
        course.startDate,
        course.endDate,
        course.location ?? '',
      ].join('|')
      if (uniqueKeys.has(uniqueKey)) continue
      uniqueKeys.add(uniqueKey)
      courses.push(course)
    }

    return courses
  }

  parseWakeupShareKey(text: string) {
    const byLabel = text.match(/分享口令[为：:]\s*[「"](.*?)[」"]/)
    if (byLabel?.[1]) return byLabel[1]
    const generic = text.match(/「([A-Za-z0-9_-]{8,64})」/)
    return generic?.[1] ?? null
  }

  convertWakeupPayload(
    payload: string,
    channelId: string,
    targetUser: TargetUser,
  ): Omit<CourseRecord, 'id'>[] {
    const normalized = payload.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    const parts = normalized.trim().split('\n')
    if (parts.length < 5) return []

    const timeTable = JSON.parse(parts[1]) as WakeupTimeSlot[]
    const tableInfo = JSON.parse(parts[2]) as WakeupTableInfo
    const courseInfos = JSON.parse(parts[3]) as WakeupCourseInfo[]
    const courseDetails = JSON.parse(parts[4]) as WakeupCourseDetail[]

    const weekdayMap: Record<number, string> = {
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五',
      6: '周六',
      7: '周日',
    }

    const uniqueKeys = new Set<string>()
    const courses: Omit<CourseRecord, 'id'>[] = []

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

      const startDate = this.calculateDate(tableInfo.startDate, detail.startWeek)
      const endDate = this.calculateDate(tableInfo.startDate, detail.endWeek, true)
      const uniqueKey = [
        channelId,
        targetUser.userId,
        courseInfo.courseName,
        weekday,
        startTime,
        endTime,
        startDate,
        endDate,
      ].join('|')
      if (uniqueKeys.has(uniqueKey)) continue
      uniqueKeys.add(uniqueKey)

      courses.push({
        channelId,
        userid: targetUser.userId,
        username: targetUser.username,
        nickname: targetUser.nickname,
        useravatar: targetUser.useravatar,
        curriculumndate: [weekday],
        curriculumname: courseInfo.courseName,
        curriculumtime: `${startTime}-${endTime}`,
        startDate,
        endDate,
        location: detail.room ?? '',
        source: 'wakeup',
      })
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

  private extractEventBlocks(text: string) {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const unfolded = normalized
      .split('\n')
      .reduce<string[]>((acc, line) => {
        if ((line.startsWith(' ') || line.startsWith('\t')) && acc.length) {
          acc[acc.length - 1] += line.slice(1)
        } else {
          acc.push(line)
        }
        return acc
      }, [])
      .join('\n')

    const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)
    return blocks ?? []
  }

  private parseEventFields(block: string) {
    const fields: Record<string, { value: string; params: Record<string, string> }> = {}
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'BEGIN:VEVENT' || trimmed === 'END:VEVENT') continue
      const separatorIndex = trimmed.indexOf(':')
      if (separatorIndex < 0) continue
      const left = trimmed.slice(0, separatorIndex)
      const value = trimmed.slice(separatorIndex + 1)
      const [rawKey, ...paramEntries] = left.split(';')
      const params: Record<string, string> = {}
      for (const entry of paramEntries) {
        const [k, v] = entry.split('=')
        if (k && v) params[k.toUpperCase()] = v
      }
      fields[rawKey.toUpperCase()] = { value, params }
    }
    return fields
  }

  private parseIcsDateTime(value: string) {
    const trimmed = value.trim()
    if (/^\d{8}$/.test(trimmed)) {
      const year = Number(trimmed.slice(0, 4))
      const month = Number(trimmed.slice(4, 6)) - 1
      const day = Number(trimmed.slice(6, 8))
      return new Date(year, month, day, 0, 0, 0)
    }

    const match = trimmed.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/)
    if (!match) return null
    const [, year, month, day, hour, minute, second = '00'] = match
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    )
  }

  private parseRRule(value: string) {
    return value.split(';').reduce<Record<string, string>>((acc, item) => {
      const [key, val] = item.split('=')
      if (key && val) acc[key.toUpperCase()] = val
      return acc
    }, {})
  }

  private formatTime(date: Date) {
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }
}
