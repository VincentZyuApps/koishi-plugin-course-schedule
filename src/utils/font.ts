import path from 'path'
import { createHash } from 'crypto'
import { existsSync, statSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import type { Context } from 'koishi'
import type { TextFontMode } from '../config'

export const LXGW_WENKAI_FILE_NAME = 'LXGWWenKaiMono-Regular.ttf'

const GITEE_RELEASE_URL = `https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/download/fonts/${LXGW_WENKAI_FILE_NAME}`
const GITHUB_RELEASE_URL = `https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/download/fonts/${LXGW_WENKAI_FILE_NAME}`

export const LXGW_FONT_INTEGRITY = {
  size: 24755236,
  md5: '90e75a25cca0e8868977b880352c6a53',
  sha256: 'ee9faa6479c5b2434f9bceca8e2e7b643f699f4f3d067aac9609261e07c6be61',
}

export interface ResolvedTextFont {
  css: string
  family: string
  source: 'npm' | 'release' | 'custom' | 'system'
}

export function getFontDirByBaseDir(baseDir: string): string {
  return path.join(baseDir, 'data', 'fonts')
}

export function getLxgwFontPath(baseDir: string): string {
  return path.join(getFontDirByBaseDir(baseDir), LXGW_WENKAI_FILE_NAME)
}

export async function verifyFontIntegrity(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return false
  try {
    if (statSync(filePath).size !== LXGW_FONT_INTEGRITY.size) return false

    const content = await readFile(filePath)
    const md5 = createHash('md5').update(content).digest('hex')
    if (md5 !== LXGW_FONT_INTEGRITY.md5) return false

    const sha256 = createHash('sha256').update(content).digest('hex')
    return sha256 === LXGW_FONT_INTEGRITY.sha256
  } catch {
    return false
  }
}

async function downloadFileWithFallback(ctx: Context, destPath: string): Promise<void> {
  const logger = ctx.logger('course-schedule')
  const dir = path.dirname(destPath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const sources = [
    { name: 'Gitee Release', url: GITEE_RELEASE_URL },
    { name: 'GitHub Release', url: GITHUB_RELEASE_URL },
  ]

  let lastError: unknown = null
  for (const source of sources) {
    try {
      logger.info(`📥 正在从 ${source.name} 下载字体: ${LXGW_WENKAI_FILE_NAME}...`)
      const response = await ctx.http.get(source.url, { responseType: 'arraybuffer', timeout: 30000 })
      await writeFile(destPath, Buffer.from(response))

      if (await verifyFontIntegrity(destPath)) {
        logger.info(`✅ 字体 ${LXGW_WENKAI_FILE_NAME} 从 ${source.name} 下载并校验成功`)
        return
      }
      throw new Error('下载文件哈希校验失败')
    } catch (error: any) {
      lastError = error
      logger.warn(`⚠️ 从 ${source.name} 下载字体失败: ${error?.message || error}`)
    }
  }

  throw new Error(`字体下载失败，Gitee / GitHub 均不可用: ${(lastError as any)?.message || lastError}`)
}

let downloadPromise: Promise<string> | null = null

export async function ensureLxgwFont(ctx: Context): Promise<string> {
  const fontPath = getLxgwFontPath(ctx.baseDir)
  if (await verifyFontIntegrity(fontPath)) return fontPath
  if (downloadPromise) return downloadPromise

  downloadPromise = (async () => {
    try {
      await downloadFileWithFallback(ctx, fontPath)
      return fontPath
    } finally {
      downloadPromise = null
    }
  })()

  return downloadPromise
}

function systemFont(): ResolvedTextFont {
  return { css: '', family: '', source: 'system' }
}

function getFontMimeType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.woff2': return 'font/woff2'
    case '.woff': return 'font/woff'
    case '.otf': return 'font/otf'
    default: return 'font/ttf'
  }
}

async function fontFileToDataUri(filePath: string): Promise<string> {
  const content = await readFile(filePath)
  return `data:${getFontMimeType(filePath)};base64,${content.toString('base64')}`
}

let npmFontPromise: Promise<ResolvedTextFont | null> | null = null

async function loadNpmFont(): Promise<ResolvedTextFont | null> {
  try {
    const cssPath = require.resolve('lxgw-wenkai-webfont/lxgwwenkaimono-regular.css')
    if (!existsSync(cssPath)) return null

    const cssDir = path.dirname(cssPath)
    let css = await readFile(cssPath, 'utf8')
    const fontUrlPattern = /url\(([\x22\x27]?)([^\x22\x27)]+)\1\)/g
    const replacements = new Map<string, string>()

    for (const match of css.matchAll(fontUrlPattern)) {
      const rawUrl = match[0]
      const sourceUrl = match[2]
      if (/^(?:data:|https?:|file:)/i.test(sourceUrl)) continue

      const fontPath = path.resolve(cssDir, sourceUrl)
      if (!existsSync(fontPath)) throw new Error(`npm 字体文件不存在: ${fontPath}`)
      replacements.set(rawUrl, `url('${await fontFileToDataUri(fontPath)}')`)
    }

    css = css.replace(fontUrlPattern, rawUrl => replacements.get(rawUrl) || rawUrl)
    return {
      css,
      family: 'LXGW WenKai Mono',
      source: 'npm',
    }
  } catch {
    return null
  }
}

function npmFont(): Promise<ResolvedTextFont | null> {
  if (!npmFontPromise) npmFontPromise = loadNpmFont()
  return npmFontPromise
}

async function releaseFont(ctx: Context): Promise<ResolvedTextFont | null> {
  try {
    const fontPath = await ensureLxgwFont(ctx)
    if (!existsSync(fontPath)) return null
    return {
      css: `@font-face{font-family:'LXGWWenKaiMono';src:url('${await fontFileToDataUri(fontPath)}') format('truetype');font-display:swap}`,
      family: 'LXGWWenKaiMono',
      source: 'release',
    }
  } catch (error: any) {
    ctx.logger('course-schedule').warn(`⚠️ Release 字体不可用: ${error?.message || error}`)
    return null
  }
}

async function customFont(fontPath: string): Promise<ResolvedTextFont | null> {
  if (!fontPath || !existsSync(fontPath)) return null
  return {
    css: `@font-face{font-family:'CourseScheduleCustomFont';src:url('${await fontFileToDataUri(fontPath)}');font-display:swap}`,
    family: 'CourseScheduleCustomFont',
    source: 'custom',
  }
}

export async function resolveTextFont(ctx: Context, mode: TextFontMode | undefined, customPath?: string): Promise<ResolvedTextFont> {
  const logger = ctx.logger('course-schedule')
  const fontMode = mode || 'npm'
  const localPath = customPath?.trim() || ''

  if (fontMode === 'none') return systemFont()

  if (fontMode === 'custom') {
    const resolved = await customFont(localPath)
    if (resolved) return resolved
    logger.warn(`⚠️ 本地字体路径无效，将使用系统默认字体: ${localPath || '(未填写)'}`)
    return systemFont()
  }

  if (fontMode === 'release') {
    const release = await releaseFont(ctx)
    if (release) return release

    const npm = await npmFont()
    if (npm) return npm
  } else {
    const npm = await npmFont()
    if (npm) return npm
    logger.warn('⚠️ 未能解析 npm 字体包，将尝试从 Release 下载')

    const release = await releaseFont(ctx)
    if (release) return release
  }

  logger.warn('⚠️ 所有自定义字体来源均不可用，将使用系统默认字体')
  return systemFont()
}
