import type { Context } from 'koishi'
import { h } from 'koishi'
import type {} from 'koishi-plugin-puppeteer'
import {
  renderGroupScheduleTemplate,
  renderPersonalScheduleTemplate,
  renderRankingTemplate,
} from './template'
import { renderWeeklyScheduleTemplate } from './weekly-template'
import type { DayCourseView, RankingItem, WeeklyDayView } from '../types'
import type { RenderColors, Config, TextFontMode } from '../config'
import { defaultColors } from '../config'
import { resolveTextFont, type ResolvedTextFont } from '../utils/font'

export class ImageGenerator {
  private fontPromise: Promise<ResolvedTextFont> | null = null
  private verbose = false
  private colors: RenderColors
  private footerText = ''
  private nameDisplayStyle: Config['nameDisplayStyle']

  constructor(
    private ctx: Context,
    private fontMode: TextFontMode,
    private fontPath: string,
    private waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' = 'load',
    verbose = false,
    colors?: RenderColors,
    footerText = '',
    nameDisplayStyle: Config['nameDisplayStyle'] = 'name-card',
  ) {
    this.verbose = verbose
    this.colors = colors ?? defaultColors
    this.footerText = footerText
    this.nameDisplayStyle = nameDisplayStyle
  }

  async renderPersonalSchedule(items: DayCourseView[], targetDate: Date) {
    this.log('[render] 个人课表, 课程数=', items.length)
    const font = await this.getFont()
    const title = `我的课表 · ${targetDate.toLocaleDateString('zh-CN')}`
    const timestamp = this.getTimestamp()
    return this.renderHtml(renderPersonalScheduleTemplate(items, title, timestamp, font.family, this.colors, this.footerText, this.nameDisplayStyle), '个人课表', font)
  }

  async renderGroupSchedule(items: DayCourseView[], targetDate: Date) {
    this.log('[render] 群课表, 用户数=', items.length)
    const font = await this.getFont()
    const logFn = this.verbose ? (...args: unknown[]) => this.log('[render][verbose]', ...args) : undefined
    const timestamp = this.getTimestamp()
    const html = renderGroupScheduleTemplate(items, '群友在上什么课?', font.family, this.colors, logFn, this.footerText, timestamp, this.nameDisplayStyle)
    this.log('[render] 群课表HTML已生成, length=', html.length)
    return this.renderHtml(html, '群课表', font)
  }

  async renderRanking(items: RankingItem[], dateRange: string) {
    this.log('[render] 排行, 人数=', items.length)
    const font = await this.getFont()
    const timestamp = this.getTimestamp()
    return this.renderHtml(renderRankingTemplate(items, dateRange, font.family, this.footerText, timestamp, this.nameDisplayStyle), '排行', font)
  }

  async renderWeeklySchedule(username: string, nickname: string, week: number, dateRange: string, days: WeeklyDayView[]) {
    this.log('[render] 周课表, 周数=', week, '天数=', days.length)
    const font = await this.getFont()
    const timestamp = this.getTimestamp()
    return this.renderHtml(renderWeeklyScheduleTemplate(username, nickname, week, dateRange, days, timestamp, font.family, this.colors, this.footerText, this.nameDisplayStyle), '周课表', font)
  }

  private getFont(): Promise<ResolvedTextFont> {
    if (!this.fontPromise) {
      this.fontPromise = resolveTextFont(this.ctx, this.fontMode, this.fontPath).catch((error: any) => {
        this.ctx.logger.warn('[course-schedule] 字体解析失败，将使用系统默认字体:', error?.message || error)
        return { css: '', family: '', source: 'system' as const }
      })
    }
    return this.fontPromise
  }

  private getTimestamp(): string {
    const now = new Date()
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  }

  private log(...args: unknown[]) {
    this.ctx.logger.info('[course-schedule]', ...args)
  }

  private async injectFont(page: any, font: ResolvedTextFont) {
    if (!font.css) return
    try {
      await page.addStyleTag({ content: font.css })
      this.ctx.logger.info(`[course-schedule] 字体已注入: ${font.family} (${font.source})`)
    } catch (e: any) {
      this.ctx.logger.warn('[course-schedule] 字体注入失败，将使用模板字体回退:', e.message)
    }
  }

  private async waitForFontReady(page: any, font: ResolvedTextFont) {
    if (!font.family) return
    try {
      await page.evaluate(async (fontName: string) => {
        if (!('fonts' in document)) return
        await document.fonts.load(`16px "${fontName}"`, '\u8bfe\u8868\u5b57\u4f53\u6d4b\u8bd5 ABC 123')
        await document.fonts.ready
      }, font.family)
      this.ctx.logger.info(`[course-schedule] 字体已完成加载并可用于渲染: ${font.family}`)
    } catch (e: any) {
      this.ctx.logger.warn('[course-schedule] 等待字体渲染就绪失败，继续使用当前页面状态截图:', e.message)
    }
  }

  private async renderHtml(html: string, label: string, font: ResolvedTextFont) {
    if (!this.ctx.puppeteer) {
      this.log('[render]', label, '- puppeteer 不可用')
      return null
    }
    if (this.verbose) {
      this.log('[render][verbose]', label, '- HTML 前500字符:', html.substring(0, 500))
    }
    let page = null
    try {
      page = await this.ctx.puppeteer.page()
      this.log('[render]', label, '- 页面已创建')
      await page.setContent(html, { waitUntil: this.waitUntil, timeout: 30000 })
      this.log('[render]', label, `- setContent 完成(waitUntil=${this.waitUntil})`)
      await this.injectFont(page, font)
      await this.waitForFontReady(page, font)
      const el = await page.$('body')
      if (!el) {
        this.log('[render]', label, '- body 元素未找到')
        return null
      }
      const img = await el.screenshot({ type: 'png' })
      this.log('[render]', label, '- 截图完成, size=', img?.byteLength ?? 0)
      return h.image(img, 'image/png')
    } finally {
      if (page) {
        await page.close().catch(() => {})
        this.log('[render]', label, '- 页面已关闭')
      }
    }
  }
}
