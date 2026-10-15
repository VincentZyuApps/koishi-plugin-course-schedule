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
    const guildId = session.guildId ?? session.channelId?.replace(/^group-/, '')
    const isDirect = !guildId || session.isDirect || session.subtype === 'private'

    if (isDirect) {
      if (session.userId && uniqueUserIds.includes(session.userId)) {
        nameMap.set(session.userId, {
          username: session.username ?? courses.find(c => c.userid === session.userId)?.username ?? session.userId,
          nickname: '',
        })
      }
      return nameMap
    }

    await Promise.allSettled(
      uniqueUserIds.map(async uid => {
        try {
          const member = await session.bot.getGuildMember(guildId, uid)
          if (member) {
            nameMap.set(uid, {
              username: member.user?.name ?? member.nick ?? courses.find(c => c.userid === uid)?.username ?? uid,
              nickname: member.nick ?? '',
            })
          }
        } catch {
          // 不在本群，忽略
        }
      })
    )

    if (session.userId && !nameMap.has(session.userId) && uniqueUserIds.includes(session.userId)) {
      nameMap.set(session.userId, {
        username: session.username ?? session.userId,
        nickname: '',
      })
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
    const guildId = session.guildId ?? session.channelId?.replace(/^group-/, '')
    const member = await session.bot.getGuildMember(guildId, userid)
    if (member) {
      nameMap.set(userid, {
        username: member.user?.name ?? member.nick ?? userid,
        nickname: member.nick ?? '',
      })
    } else {
      nameMap.set(userid, {
        username: session.username ?? userid,
        nickname: '',
      })
    }
  } catch {
    log('[name] 无法获取用户信息, userId=', userid)
    nameMap.set(userid, {
      username: session.username ?? userid,
      nickname: '',
    })
  }
  return nameMap
}

