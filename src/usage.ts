const pkg = require('../package.json')

const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));transition:var(--color-transition, border-color .2s ease, background-color .2s ease)'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none'
const detailsBodyStyle = 'padding:2px 14px 8px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit)'

const KOISHI_LOGO_BASE64 = 'data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABU0lEQVR42p2UQSsFYRSGnxnqLuytKWKpKFkQNsS%2FsOHPWPADLCmxU5S7UzYWNrJR7lYiRF2FeWzOMKZ7mXHqNNP5vvP2nu%2B850CY2lP4X1K31ZbaDm%2BpO%2Bpyp5wfAXVEPfRvO1JHf4AVQGbUh7j4EZ4VkrNCXPVRnf3CUBN1SH2KC28VGOV3ntRhNclZHdcAKYM11QR1oVBOXctzFlNgBTC8qmXxPQEegbVeYApIgJT6tg%2F0AdMp0B%2FBpCabK2AAmAAa%2F2GRBft1oBFPkqTAba7LCiAfQC9wClwAY1HJHepuiO29Yrsf1Dn1uiDU3RTYCtTkl1Leg8k9MB4NGgReI28rV3azgyCz0og01Xl1Uz1QX8uCTELm3UbkTF1VJ9Wr0tn3iBSGdjYG0XivE3VN3VD31PM4a3cc2tIGGI0VkTO7rLxGuiy25ejmjfqsvkSXui62TxaK03td4FXTAAAAAElFTkSuQmCC'

export const usage = `
<h1>Koishi 插件：course-schedule</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>

<p>
  <a href="https://www.npmjs.com/package/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/npm/v/koishi-plugin-course-schedule?style=flat-square" alt="npm version">
  </a>
  <a href="https://github.com/VincentZyu233/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
  </a>
  <a href="https://forum.koishi.xyz/t/topic/12565" target="_blank">
    <img src="https://img.shields.io/badge/Koishi%20Forum-12565-5546A3?style=for-the-badge&logo=${KOISHI_LOGO_BASE64}&logoColor=white" alt="Koishi Forum">
  </a>
  <a href="https://qm.qq.com/q/ZN7fxZ3qCq" target="_blank">
    <img src="https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white" alt="QQ群">
  </a>
</p>

<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b> 🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入新QQ群：<b style="color: #12B7F5;">1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

<p><b>💡 提示：</b>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule" target="_blank">
    前往 Gitee README 获得更佳观感 →
    <i>https://gitee.com/vincent-zyu/koishi-plugin-course-schedule</i>
  </a>
</p>

<hr>

<details style="${detailsStyle}">
<summary style="${summaryStyle}"><b style="color: #16a34a;">📋 可用指令说明</b></summary>
<div style="${detailsBodyStyle}">
<h3>📋 命令速查表</h3>
<table>
  <tr><th>命令</th><th>说明</th><th>调用示例</th></tr>
  <tr><td><code>课表.查看当日 [天]</code></td><td>查看个人某天课程（支持今天、明天、周几等）</td><td><code>课表.查看当日 明天</code></td></tr>
  <tr><td><code>课表.查看本周 [周数]</code></td><td>查看个人完整周课表视图（默认当前周）</td><td><code>课表.查看本周 12</code></td></tr>
  <tr><td><code>课表.查看本群 [天]</code></td><td>查看本群群友某天的全部课程横向汇总</td><td><code>课表.查看本群 周三</code></td></tr>
  <tr><td><code>课表.本群周排行</code></td><td>统计本群成员本周上课总时长排行榜</td><td><code>课表.本群周排行</code></td></tr>
  <tr><td><code>课表.绑定 [文本]</code></td><td>导入课表数据（优先建议直接发分享码/JSON 文本，亦支持文件交互）</td><td><code>课表.绑定 分享口令为「xxxxxxxx」</code></td></tr>
  <tr><td><code>课表.设置星链时间表 [文本]</code></td><td>设置星链时间表并自动刷新已有课程时间</td><td><code>课表.设置星链时间表</code></td></tr>
</table>
<p>💡 <b>提示</b>：命令前缀 <code>课表</code> 及各子指令名称均可在配置项中自定义修改。</p>
</div>
</details>

<details style="${detailsStyle}">
<summary style="${summaryStyle}"><b style="color: #0d9488;">⚙️ 节假日、开学日与高级设置</b></summary>
<div style="${detailsBodyStyle}">
<h3>📅 开学日期与周数计算（defaultSemesterStart）</h3>
<p>严格采用 <code>YYYY-MM-DD</code> 格式（默认 <code>2026-09-07</code>）。插件为<b>每个用户独立推算开学日与周数</b>，防止多用户导入跨学期课表时干扰群课表计算；在课表源缺少开学日时自动以此配置兜底。</p>

<h3>🎈 节假日与调休识别</h3>
<p>内置 2026 节假日数据，法定节假日自动提示休息，调休补班日正常显示并推算对应星期课程。</p>

<h3>💬 贴心引导与防呆开关</h3>
<ul>
  <li><code>enableStarlinkTimeHint</code>：导入星链课表后自动提示前往设置时间表；</li>
  <li><code>enableTimetableInBindHint</code>：当用户误把作息时间表传给 <code>课表.绑定</code> 时，自动拦截并指引正确指令。</li>
</ul>

<h3>📁 文件与缓存设置</h3>
<ul>
  <li>课表临时文件目录与过期自动清理周期可调；</li>
  <li>节假日数据自动缓存，避免重复请求网络；</li>
  <li>用户自定义时间表安全存储于 <code>cache/timeslots/{userId}.json</code>。</li>
</ul>
</div>
</details>

<details style="${detailsStyle}">
<summary style="${summaryStyle}"><b style="color: #0284c7;">📥 适配情况与导入指南</b></summary>
<div style="${detailsBodyStyle}">
<h3>🎓 功能简介</h3>
<p>课程表插件 —— 群友都在上什么课捏？支持多格式课表导入、个人当日课表、群课表纵览、本周上课排行和周课表视图。</p>

<h3>📥 适配情况</h3>
<table>
  <tr><th>格式</th><th>说明</th><th>状态</th><th>导入指令</th></tr>
  <tr><td><b>WakeUp 分享口令</b></td><td>发送口令即可直接导入。⚠️ 需使用旧版 6.0.x（推荐 6.0.23）。📤 获取方式：右上角分享图标 → 在线分享课表 → 点击复制/分享</td><td>✅ 实测可用</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>WakeUp 备份文件</b></td><td>支持 <code>.wakeup_schedule</code> 备份文件直接发送导入</td><td>⏳ 待测/待完善</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>星链分享码</b></td><td>发送星链分享码即可一键导入。📤 获取方式：右上角三点 → 分享课表 → 在线分享 → 复制分享码</td><td>✅ 实测可用</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>星链 JSON</b></td><td>粘贴星链课表导出 JSON。📤 获取方式：右上角三点 → 分享课表 → 导出课表文件</td><td>✅ 实测可用</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>星链作息时间表</b></td><td>上传时间表 JSON，自动保存并<b>即时刷新该用户已有的星链课程时间</b>，无需重复导入！</td><td>✅ 实测可用</td><td><code>课表.设置星链时间表</code></td></tr>
  <tr><td><b><a href="https://github.com/Temmie0125/Yunzai-Schedule-Plugin" target="_blank" style="text-decoration: underline;"><i>【Yunzai 插件】</i></a>原生 JSON</b></td><td>兼容 Yunzai 原生 JSON 格式，课程内已自带起止时间，<b>推荐手动或 AI 识图构造课表时首选</b>（参考 <a href="https://github.com/VincentZyu233/koishi-plugin-course-schedule/blob/main/docs/formats/yunzai-schedule-plugin-json.md" target="_blank">说明文档</a>）</td><td>✅ 实测可用</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>拾光课表 JSON</b></td><td>兼容拾光课程表 App 导出的 JSON 结构</td><td>⏳ 待测/待完善</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>ICS 文件 / 链接</b></td><td>支持 <code>.ics</code> 日历文件上传或 ICS 公网链接解析</td><td>⏳ 待测/待完善</td><td><code>课表.绑定</code></td></tr>
</table>
<blockquote>
✅ <b>实测可用</b> = 经过实机测试验证，功能完全稳定可用<br>
⏳ <b>待测/待完善</b> = 基础解析已接入，未来持续测试与完善<br>
📖 更多细节参见：<a href="https://github.com/VincentZyu233/koishi-plugin-course-schedule/blob/main/docs/formats/README.md" target="_blank">各种课表格式文档目录</a>
</blockquote>
</div>
</details>

<details style="${detailsStyle}">
<summary style="${summaryStyle}"><b style="color: #d97706;">⚠️ App 兼容性与实测心得</b></summary>
<div style="${detailsBodyStyle}">
<p><img src="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/raw/main/docs/images/%E4%B8%89%E4%B8%AA%E8%AF%BE%E7%A8%8B%E8%A1%A8app%E5%9B%BE%E6%A0%87.%E6%98%9F%E9%93%BE.%E6%8B%BE%E5%85%89.WakeUp.png" alt="三个课程表app图标" width="360"></p>

<ul>
  <li>
    <b>WakeUp 课程表</b> — 旧版安卓 App 使用 v1 API（无鉴权），新版使用 v2 API（有鉴权）。
    <ul>
      <li>WakeUp 的教务导入非常平滑；</li>
      <li>新版（≥ 6.1.x）口令分享已被限制，推荐降级至 <b>6.0.23</b> 稳定版：</li>
    </ul>
    <p>
      <a href="https://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk" target="_blank">
        <img src="https://img.shields.io/badge/Release_APK-GitHub-181717?style=flat-square&logo=github" alt="GitHub Release APK">
      </a>
    </p>
    <p>📖 详见 <a href="https://github.com/VincentZyu233/koishi-plugin-course-schedule/blob/main/docs/formats/wakeup-schedule.md" target="_blank">WakeUp 课程表规范与分享口令文档</a></p>
  </li>
  <li>
    <b>星链课表</b> — 若无直连教务，可通过 AI 识别教务课表截图转为星链 JSON 后在 App 内导课。
    <br>💡 <b>作息时间说明</b>：星链课表分享不包含具体时间段，仅含节次。请使用 <code>课表.设置星链时间表</code> 上传作息时间 JSON，保存后<b>自动为该用户现有课程补齐时间</b>！
    <br>📤 <b>导出方法</b>：星链 App 右上角三点 → 上课时间 → 点击时间表 → ✏️ 编辑 → 点击分享符号导出时间表 JSON。
    <p>📖 详见 <a href="https://github.com/VincentZyu233/koishi-plugin-course-schedule/blob/main/docs/formats/starlink-schedule.md" target="_blank">星链课表规范与分享码文档</a></p>
  </li>
  <li>
    <b>拾光课程表</b> — 持续维护适配中。
  </li>
</ul>

<p>遇到导入或解析问题，欢迎进群直接 @VincentZyu 反馈交流 🙏</p>
</div>
</details>

<details style="${detailsStyle}">
<summary style="${summaryStyle}"><b style="color: #9333ea;">🖼️ 渲染方式与视觉定制</b></summary>
<div style="${detailsBodyStyle}">
<h3>🖼️ 渲染机制</h3>
<p>基于 <b>Puppeteer</b> 将现代 HTML 模板渲染为高质量图片输出。支持多种字体模式：LXGW 文楷等宽（npm 内置/下载）、本地自定义字体路径或系统默认字体。</p>

<h3>🎭 用户名显示样式（nameDisplayStyle）</h3>
<p>在群课表等场景中可灵活定制群友称呼：</p>
<ul>
  <li><code>name-only</code>：仅显示用户注册名 / 全局用户名</li>
  <li><code>name-card</code>：用户名（本群群名片）</li>
  <li><code>card-name</code>：本群群名片（用户名）</li>
  <li><code>card-only</code>：仅显示本群群名片（优先显示名片，无名片退回用户名）</li>
</ul>

<h3>🎨 渲染色彩自定义</h3>
<p>支持自由定制图片各组件色值：</p>
<ul>
  <li><b>主题色</b> —— 标题横线、装饰边条与高亮强调色</li>
  <li><b>卡片背景色</b> —— 课程卡片背景与半透明磨砂风格</li>
  <li><b>进行中标签色</b> —— 正在上课的醒目标签</li>
  <li><b>下一节标签色</b> —— 即将开课的预警标签</li>
  <li><b>已结束标签色</b> —— 当日已结课的状态标签</li>
</ul>
</div>
</details>

<hr>
`
;
