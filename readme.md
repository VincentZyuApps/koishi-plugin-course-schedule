![koishi-plugin-course-schedule](https://socialify.git.ci/VincentZyuApps/koishi-plugin-course-schedule/image?custom_description=%F0%9F%93%9A%F0%9F%93%85+%E8%AF%BE%E7%A8%8B%E8%A1%A8%E6%8F%92%E4%BB%B6%EF%BC%8C%E6%94%AF%E6%8C%81+WakeUp+%2F+%E6%98%9F%E9%93%BE+%2F+%E6%8B%BE%E5%85%89+%2F+ICS+%E5%A4%9A%E6%A0%BC%E5%BC%8F%E5%AF%BC%E5%85%A5%EF%BC%8C%E6%B8%B2%E6%9F%93%E4%B8%BA%E5%9B%BE%E7%89%87%E8%BE%93%E5%87%BA%E4%B8%AA%E4%BA%BA%E8%AF%BE%E8%A1%A8%E3%80%81%E7%BE%A4%E8%AF%BE%E8%A1%A8%E3%80%81%E5%91%A8%E8%AF%BE%E8%A1%A8%E5%92%8C%E6%8E%92%E8%A1%8C%E6%A6%9C+%F0%9F%8E%93%F0%9F%96%BC%EF%B8%8F%E2%9C%A8&description=1&font=Bitter&forks=1&issues=1&language=1&logo=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Ff%2Ff3%2FKoishi.js_Logo.png%3F_%3D20230331182243&name=1&owner=1&pulls=1&stargazers=1&theme=Auto)

# koishi-plugin-course-schedule

📚📅 课程表插件，支持 WakeUp/星链/拾光 等课程表，ICS/JSON 等多格式导入，渲染为图片输出个人课表、群课表、周课表和排行榜 🎓🖼️✨

> 💡 readme 中的图片请前往 [GitHub](https://github.com/VincentZyu233/koishi-plugin-course-schedule) 或 [Gitee](https://gitee.com/vincent-zyu/koishi-plugin-course-schedule) 主页查看。

[![npm](https://img.shields.io/npm/v/koishi-plugin-course-schedule?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-course-schedule)
[![npm-download](https://img.shields.io/npm/dm/koishi-plugin-course-schedule?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-course-schedule)

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VincentZyu233/koishi-plugin-course-schedule)
[![Gitee](https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white)](https://gitee.com/vincent-zyu/koishi-plugin-course-schedule)

[![QQ群](https://img.shields.io/badge/QQ群-1085190201-1AAD19?style=flat-square)](https://qm.qq.com/q/ZN7fxZ3qCq)

<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b> 🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入新QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

---

## 📖 简介

课程表，**群u在上什么课捏**？

支持多种课表格式导入，自动渲染为图片输出，帮助群友互相了解彼此的课程安排。

## 📸 效果预览

**个人课表** — 查看自己某天的全部课程
![个人课表](docs/images/preview.课表.查看.png)

**群课表** — 查看所有已导入用户某天的课程
![群课表](docs/images/preview.课表.群课表.png)

**本周排行** — 查看本周上课时长排行榜
![本周排行](docs/images/preview.课表.排行.png)

**周课表** — 查看个人周课表纵览
![周课表](docs/images/preview.课表.周课表.png)

## ✨ 功能

### 📥 适配情况

| 格式 | 说明 | 状态 | 指令 |
|------|------|:----:|------|
| **WakeUp 分享口令** | 发送分享口令即可导入。⚠️ 需使用旧版 6.0.x，建议 6.0.23。📤 获取：右上角分享图标 → 在线分享课表 → 点击复制/分享 | ✅ 实测可用 | 课表.绑定 |
| **WakeUp 备份文件** | 支持 `.wakeup_schedule` 备份文件导入 | ⏳ 待测/待完善 | 课表.绑定 |
| **星链分享码** | 发送星链分享码即可导入。📤 获取：右上角竖着的三个点 → 倒数第二行 分享课表 → 在线分享 → 点击复制分享码 | ✅ 实测可用 | 课表.绑定 |
| **星链 JSON** | 粘贴星链课表 JSON。📤 获取：右上角竖着的三个点 → 倒数第二行 分享课表 → 导出课表文件 → 发送到聊天平台（[格式说明](docs/各种课表格式/星链课表JSON格式.md)） | ✅ 实测可用 | 课表.绑定 |
| **星链格式时间表** | 通过自定义时间段 JSON 上传，绑定星链课表时自动应用 | ✅ 实测可用 | 课表.设置星链时间表 |
| **[Yunzai 插件](https://github.com/Temmie0125/Yunzai-Schedule-Plugin)原生 JSON** | 兼容 Yunzai Schedule Plugin 的原生 JSON 格式，时间信息直接存储，**推荐手动构造课表时使用**（比如截图本学期全部课表图片（如果你的教务平台支持的话），然后让识图 AI 转换成 Yunzai JSON 格式，需要同时让 AI 参考 [Yunzai 插件源代码](https://github.com/Temmie0125/Yunzai-Schedule-Plugin) 或 [JSON 格式说明文档](docs/各种课表格式/Yunzai-Schedule-Plugin原生JSON格式.md)） | ✅ 实测可用 | 课表.绑定 |
| **拾光课表 JSON** | 兼容拾光课程表 App 的导出 JSON | ⏳ 待测/待完善 | 课表.绑定 |
| **ICS 文件/链接** | 支持 `.ics` 文件上传或 ICS 链接下载解析 | ⏳ 待测/待完善 | 课表.绑定 |

> ✅ **实测可用** = 经过测试，功能正常可用
> ⏳ **待测/待完善** = 目前尚未支持/完善，未来可能支持，仍在计划中

### 📋 可用命令

```
课表.绑定 <文本>         — 导入课表数据（建议使用文本：分享码/JSON，交互式传文件可能有问题）
课表.设置星链时间表       — 设置星链课表时间表（用户自定义时间段）
课表.查看 [天]           — 查看个人某天课程
课表.群课表 [天]         — 查看所有已导入用户某天的课程
课表.排行                — 查看本周上课时长排行榜
课表.周课表 [周数]        — 查看个人周课表纵览
```

> 命令名称可在插件配置中自定义。

#### ⚠️ **兼容性说明**（更新于 2026-05-27，可能有时效性）
>
> ![三个课程表app图标.星链.拾光.WakeUp.png](docs/images/三个课程表app图标.星链.拾光.WakeUp.png)
>
> - **WakeUp 课程表** — 旧版安卓 App 使用 v1 API（无鉴权），新版使用 v2 API（有鉴权）。_对于作者自己的学校教务网站_：
>   - WakeUp 的课表导入很顺利
>   - 但口令导出功能在最新版 App 中不可用，需要降级到旧版本
>   - 据说 **≥ 6.1.x 的版本均不行，6.0.x 及以下版本可以**
>   - 作者暂时不清楚新旧版本的确切分水岭，推测大概率是 **6.0.x 与 6.1.x** 之间
>
>   因此在不同的导入方案中，**最佳选择是降级 WakeUp 到作者同款版本**（作者实测确认可用）：
>   作者使用的版本：**6.0.23**
>   - [![Release APK - GitHub](https://img.shields.io/badge/Release_APK-GitHub-181717?style=flat-square&logo=github)](https://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk)
>   - [![Release APK - Gitee](https://img.shields.io/badge/Release_APK-Gitee-C71D23?style=flat-square&logo=gitee)](https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk)
> - **星链课表** — _对于作者自己的学校教务网站_：没有直接的学校教务导入选项，通用的 AI 导入工具也无法使用。作者目前的导入方式：浏览器 F12 下载课表 HTML 数据 → 让 AI（如 OpenCode / Codex / Gemini）参考本地 HTML 结构与课表截图识别，生成符合星链 JSON 格式的文件 → 复制 JSON → 星链 App 右上角「+」→ 一键导课 → 粘贴 JSON → 点击 AI 解析即可完成导入。
>   - 💡 **时间修改提示**：星链的分享码或JSON导出不包含时间信息，每节课的时间信息需要单独导出。请使用「课表.设置星链时间表」上传时间表 JSON。📤 导出方法：星链 App 右上角竖着的三个点 → 上课时间 → 点击时间表 → ✏️ 编辑符号 → 修改时间，然后点击分享符号导出时间 JSON
> - **拾光课程表** — 作者暂时无法成功导入
>
> 如果你遇到了导入问题，欢迎加群反馈，帮助逐步完善适配 🙏 艾特作者回复更快哦~ @VincentZyu

### 🖼️ 渲染方式

基于 **Puppeteer** 将 HTML 模板渲染为图片输出，配置项：
- **waitUntil 策略** —— 控制渲染等待时机（load / domcontentloaded / networkidle0 / networkidle2）
- **字体模式** —— 默认使用 npm 的 LXGW 文楷等宽字体，也可选择 Gitee / GitHub Release 下载、本地字体路径或系统默认字体
- **自定义颜色** —— 主题色、卡片背景色、状态标签色均可配置

### 📅 节假日支持

支持多级节假日数据源，自动获取并缓存：

1. **API 优先** — 首次访问自动请求 [timor.tech](https://timor.tech/api/holiday) 获取当年节假日数据
2. **本地缓存** — API 成功拉取后缓存到 `cache/holidays/{year}.json`，下次启动直接读取
3. **内置硬编码** — 内置 2026 年完整节假日数据作为离线 fallback（2027-2030 年占位，API 不可用时返回无数据）

节假日自动提示休息消息 🎉，调休上班日正常显示课程。

## 📦 安装

在 Koishi 插件市场搜索 `course-schedule` 即可安装

或使用 npm / yarn：

```bash
# 先切换到koishi的根目录
cd /path/to/koishi-app
ls
# 确保能看到 package.json, koishi.yml, data文件夹
npm install koishi-plugin-course-schedule
# 或者用yarn
yarn add koishi-plugin-course-schedule
```

## ⚙️ 配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `enableQuote` | `true` | 💬 开启后，所有消息都会引用回复触发指令的消息 |
| `enableWatingHint` | `true` | ⏳ 是否启用「渲染中，请稍候...」提示消息 |
| `bindPromptText` | (默认提示文本) | 📝 绑定指令交互式等待提示文本（支持换行） |
| `baseCommand` | `课表` | 父级指令名称 |
| `bindCommand` | `绑定` | 绑定课表命令名 |
| `timetableCommand` | `设置星链时间表` | 设置星链时间表命令名 |
| `showCommand` | `查看` | 查看个人课表命令名 |
| `groupCommand` | `群课表` | 查看所有已导入用户课表命令名 |
| `rankingCommand` | `排行` | 查看本周排行命令名 |
| `weekCommand` | `周课表` | 查看周课表命令名 |
| `renderWaitUntil` | `load` | Puppeteer 渲染等待策略 |
| `textFontMode` | `npm` | 字体模式：`npm`（默认）/ `release` / `custom` / `none` |
| `textFontPath` | `(空)` | 本地字体文件绝对路径，仅在 `textFontMode` 为 `custom` 时生效 |
| `renderFooterText` | (默认底部文字) | 📝 图片底部文字（支持换行，留空则不显示） |
| `scheduleFileTempDir` | `cache/files` | 课表文件临时目录（绝对路径） |
| `scheduleFileTempDeleteTime` | `300` | 临时课表文件删除时间（秒），`0`或`负数`表示永不删除 |
| `holidayCacheDir` | `cache/holidays` | 节假日缓存目录（绝对路径） |
| `renderColors.primaryColor` | `#52449e` | 主题色 |
| `renderColors.cardBgColor` | `#E3F2FD` | 个人课表卡片背景色 |
| `renderColors.statusOngoingColor` | `#D32F2F` | 进行中标签色 |
| `renderColors.statusNextColor` | `#1976D2` | 下一节标签色 |
| `renderColors.statusFinishedColor` | `#388E3C` | 已结束标签色 |
| `verboseConsoleLog` | `false` | 📋 详细控制台调试日志 |

## 🔗 本插件链接

- **GitHub**: https://github.com/VincentZyu233/koishi-plugin-course-schedule
- **Gitee**: https://gitee.com/vincent-zyu/koishi-plugin-course-schedule
- **npm**: https://www.npmjs.com/package/koishi-plugin-course-schedule

## 📄 许可证

由于绝大部分上游采用强 copyleft 许可证（AGPL v3 / GPL v3），
要求修改后的代码也必须以相同许可证公开，
故本插件同样采用 **GNU Affero General Public License v3 (AGPL-3.0)** 发布。

在开发过程中参考/借鉴了以下开源项目：

| 项目 | 许可证 |
|------|--------|
| [![GitHub](https://img.shields.io/badge/-181717?style=flat-square&logo=github)](https://github.com/advent259141/astrbot_plugin_CourseSchedule) [astrbot_plugin_CourseSchedule](https://github.com/advent259141/astrbot_plugin_CourseSchedule) | AGPL v3 |
| [![GitHub](https://img.shields.io/badge/-181717?style=flat-square&logo=github)](https://github.com/GLDYM/nonebot-plugin-course-schedule) [nonebot-plugin-course-schedule](https://github.com/GLDYM/nonebot-plugin-course-schedule) | AGPL v3 |
| [![GitHub](https://img.shields.io/badge/-181717?style=flat-square&logo=github)](https://github.com/Temmie0125/Yunzai-Schedule-Plugin) [Yunzai-Schedule-Plugin](https://github.com/Temmie0125/Yunzai-Schedule-Plugin) | GPL v3 |
| [![GitHub](https://img.shields.io/badge/-181717?style=flat-square&logo=github)](https://github.com/koishi-shangxue-plugins/koishi-shangxue-apps/tree/main/plugins/curriculum-table) [【koishi-shangxue-plugins】curriculum-table](https://github.com/koishi-shangxue-plugins/koishi-shangxue-apps/tree/main/plugins/curriculum-table) | MIT |
