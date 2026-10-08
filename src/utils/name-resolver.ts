import type { Context } from 'koishi'
import type { NameMap } from '../services/schedule-service'
import { TABLE_NAME } from '../constants'

export async function buildNameMap(
  session: any,
  ctx: Context,
  log: (...args: unknown[]) => void,
): Promise<NameMap> {
  const nameMap: NameMap = new Map()
  try {
    const courses = await (ctx.database.get(TABLE_NAME, {}) as Promise<{ userid: string; username: string; nickname?: string }[]>)
    const uniqueUserIds = [...new Set(courses.map(c => c.userid))]
    for (const uid of uniqueUserIds) {
      try {
        const member = await session.bot.getGuildMember(session.guildId, uid)
        if (member?.user?.name || member?.nick) {
          nameMap.set(uid, {
            username: member.user?.name ?? courses.find(c => c.userid === uid)?.username ?? uid,
            nickname: member.nick ?? '',
          })
        }
      } catch {
        log('[name-resolver] 无法获取用户信息, userId=', uid)
      }
    }
  } catch {
    log('[name-resolver] 无法获取课程列表')
  }
  return nameMap
}

export async function buildSingleNameMap(
  session: any,
  userid: string,
  log: (...args: unknown[]) => void,
): Promise<NameMap> {
  const nameMap: NameMap = new Map()
  try {
    const member = await session.bot.getGuildMember(session.guildId, userid)
    if (member?.user?.name || member?.nick) {
      nameMap.set(userid, {
        username: member.user?.name ?? userid,
        nickname: member.nick ?? '',
      })
    }
  } catch {
    log('[name-resolver] 无法获取用户信息, userId=', userid)
  }
  return nameMap
}
