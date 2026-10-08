const pkg = require('../package.json')

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
  <a href="https://qm.qq.com/q/ZN7fxZ3qCq" target="_blank">
    <img src="https://img.shields.io/badge/QQ群-1085190201-1AAD19?style=flat-square" alt="QQ群">
  </a>
</p>

<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b> 🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入新QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

<p><b>💡 提示：</b>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule" target="_blank">
    前往 Gitee README 获得更佳观感 →
    <i>https://gitee.com/vincent-zyu/koishi-plugin-course-schedule</i>
  </a>
</p>

<hr>

<details>
<summary><h2>📖 插件详细说明（点击展开）</h2></summary>

<h2>🎓 功能简介</h2>
<p>课程表插件 —— 群u在上什么课捏？支持多格式课表导入、个人课表查看、群课表纵览、本周上课排行和周课表视图。</p>

<h3>📥 适配情况</h3>
<table>
  <tr><th>格式</th><th>说明</th><th>状态</th><th>指令</th></tr>
  <tr><td><b>WakeUp 分享口令</b></td><td>发送分享口令即可导入。⚠️ 需使用旧版 6.0.x，建议 6.0.23。📤 获取：右上角分享图标 → 在线分享课表 → 点击复制/分享</td><td>✅ 实测可用</td><td>课表.绑定</td></tr>
  <tr><td><b>WakeUp 备份文件</b></td><td>支持 <code>.wakeup_schedule</code> 备份文件导入</td><td>⏳ 待测/待完善</td><td>课表.绑定</td></tr>
  <tr><td><b>星链分享码</b></td><td>发送星链分享码即可导入。📤 获取：右上角竖着的三个点 → 倒数第二行 分享课表 → 在线分享 → 点击复制分享码</td><td>✅ 实测可用</td><td>课表.绑定</td></tr>
  <tr><td><b>星链 JSON</b></td><td>粘贴星链课表 JSON。📤 获取：右上角竖着的三个点 → 倒数第二行 分享课表 → 导出课表文件 → 发送到聊天平台</td><td>✅ 实测可用</td><td>课表.绑定</td></tr>
  <tr><td><b>星链格式时间表</b></td><td>通过自定义时间段 JSON 上传，绑定星链课表时自动应用</td><td>✅ 实测可用</td><td>课表.设置星链时间表</td></tr>
  <tr><td><b><a href="https://github.com/Temmie0125/Yunzai-Schedule-Plugin" style="text-decoration: underline;"><i>【Yunzai 插件】</i></a>原生 JSON</b></td><td>兼容 Yunzai Schedule Plugin 的原生 JSON 格式，时间信息直接存储，<b>推荐手动构造课表时使用</b>（比如截图本学期全部课表图片（如果你的教务平台支持的话），然后让识图 AI 转换成 Yunzai JSON 格式，需要同时让 AI 参考 <a href="https://github.com/Temmie0125/Yunzai-Schedule-Plugin" style="text-decoration: underline;"><i>【Yunzai 插件源代码】</i></a> 或 <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/blob/main/docs/各种课表格式/Yunzai-Schedule-Plugin原生JSON格式.md" style="text-decoration: underline;"><i>【Yunzai插件原生JSON格式说明文档】</i></a>）</td><td>✅ 实测可用</td><td><code>课表.绑定</code></td></tr>
  <tr><td><b>拾光课表 JSON</b></td><td>兼容拾光课程表 App 的导出 JSON</td><td>⏳ 待测/待完善</td><td>课表.绑定</td></tr>
  <tr><td><b>ICS 文件/链接</b></td><td>支持 <code>.ics</code> 文件上传或 ICS 链接下载解析</td><td>⏳ 待测/待完善</td><td>课表.绑定</td></tr>
</table>
<blockquote>
✅ <b>实测可用</b> = 经过测试，功能正常可用<br>
⏳ <b>待测/待完善</b> = 目前尚未支持/完善，未来可能支持，仍在计划中
</blockquote>

<h3>📋 可用命令</h3>
<table>
  <tr><th>命令</th><th>说明</th><th>示例</th></tr>
  <tr><td><code>课表.绑定 &lt;文本&gt;</code></td><td>导入课表数据（建议使用文本：分享码/JSON，交互式传文件可能有问题）</td><td><code>课表.绑定 分享口令为「xxxxxxxx」</code></td></tr>
  <tr><td><code>课表.设置星链时间表</code></td><td>设置星链课表时间表</td><td><code>课表.设置星链时间表</code></td></tr>
  <tr><td><code>课表.查看 [天]</code></td><td>查看个人某天课程</td><td><code>课表.查看 明天</code></td></tr>
  <tr><td><code>课表.群课表 [天]</code></td><td>查看所有已导入用户某天的课程</td><td><code>课表.群课表 周三</code></td></tr>
  <tr><td><code>课表.排行</code></td><td>查看本周上课时长排行榜</td><td><code>课表.排行</code></td></tr>
  <tr><td><code>课表.周课表 [周数]</code></td><td>查看个人周课表纵览</td><td><code>课表.周课表 12</code></td></tr>
</table>

<blockquote>
<p><b>⚠️ 兼容性说明</b>（更新于 2026-05-27，可能有时效性）</p>

<p><img src="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/raw/main/docs/images/%E4%B8%89%E4%B8%AA%E8%AF%BE%E7%A8%8B%E8%A1%A8app%E5%9B%BE%E6%A0%87.%E6%98%9F%E9%93%BE.%E6%8B%BE%E5%85%89.WakeUp.png" alt="三个课程表app图标" width="400"></p>

<ul>
  <li>
    <b>WakeUp 课程表</b> — 旧版安卓 App 使用 v1 API（无鉴权），新版使用 v2 API（有鉴权）。<i>对于作者自己的学校教务网站</i>：
    <ul>
      <li>WakeUp 的课表导入很顺利</li>
      <li>但口令导出功能在最新版 App 中不可用，需要降级到旧版本</li>
      <li>据说 <b>≥ 6.1.x 的版本均不行，6.0.x 及以下版本可以</b></li>
      <li>作者暂时不清楚新旧版本的确切分水岭，推测大概率是 <b>6.0.x 与 6.1.x</b> 之间</li>
    </ul>
    <p>因此在不同的导入方案中，<b>最佳选择是降级 WakeUp 到作者同款版本</b>（作者实测确认可用）：<br>
    作者使用的版本：<b>6.0.23</b></p>
    <p>
      <a href="https://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk" target="_blank">
        <img src="https://img.shields.io/badge/Release_APK-GitHub-181717?style=flat-square&logo=github" alt="GitHub Release APK">
      </a>
      &nbsp;
      <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk" target="_blank">
        <img src="https://img.shields.io/badge/Release_APK-Gitee-C71D23?style=flat-square&logo=gitee" alt="Gitee Release APK">
      </a>
    </p>
  </li>
  <li>
    <b>星链课表</b> — <i>对于作者自己的学校教务网站</i>：没有直接的学校教务导入选项，通用的 AI 导入工具也无法使用。作者目前的导入方式：浏览器 F12 下载课表 HTML 数据 → 让 AI（如 OpenCode / Codex / Gemini）参考本地 HTML 结构与课表截图识别，生成符合星链 JSON 格式的文件 → 复制 JSON → 星链 App 右上角「+」→ 一键导课 → 粘贴 JSON → 点击 AI 解析即可完成导入。
    <br>💡 <b>时间修改提示</b>：星链的分享码或JSON导出不包含时间信息，每节课的时间信息需要单独导出。请使用「课表.设置星链时间表」上传时间表 JSON。📤 导出方法：星链 App 右上角竖着的三个点 → 上课时间 → 点击时间表 → ✏️ 编辑符号 → 修改时间，然后点击分享符号导出时间 JSON
  </li>
  <li>
    <b>拾光课程表</b> — 作者暂时无法成功导入
  </li>
</ul>

<p>如果你遇到了导入问题，欢迎加群反馈，帮助逐步完善适配 🙏 艾特作者回复更快哦~ @VincentZyu</p>
</blockquote>

<h3>🖼️ 渲染方式</h3>
<p>基于 <b>Puppeteer</b> 将 HTML 模板渲染为图片输出，默认使用 npm 的 LXGW 文楷等宽字体，也可选择 Gitee / GitHub Release 下载、本地字体路径或系统默认字体。</p>

<h3>📅 节假日支持</h3>
<p>内置 2026 年节假日数据，节假日自动提示休息消息，调休上班日正常显示课程。</p>

<h3>🎨 渲染颜色自定义</h3>
<p>在插件配置中可自定义以下颜色：</p>
<ul>
  <li><b>主题色</b> —— 左侧装饰竖线、周课表标题下划线</li>
  <li><b>卡片背景色</b> —— 个人课表课程卡片背景</li>
  <li><b>进行中标签色</b> —— 正在上课的状态标签</li>
  <li><b>下一节标签色</b> —— 即将开始的状态标签</li>
  <li><b>已结束标签色</b> —— 已结束的状态标签</li>
</ul>

<h3>⚙️ 其他可配置项</h3>
<ul>
  <li><b>bindPromptText</b> —— 绑定指令交互式等待时的提示文本（支持换行）</li>
  <li><b>renderFooterText</b> —— 渲染图片底部文字（支持换行，留空则不显示）</li>
  <li><b>verboseConsoleLog</b> —— 开启后输出详细调试日志到控制台</li>
</ul>

<h3>📁 文件设置</h3>
<ul>
  <li>课表文件临时目录和自动清理时间可配置</li>
  <li>节假日缓存目录可自定义</li>
  <li>用户自定义时间表缓存于 <code>cache/timeslots/{userId}.json</code></li>
</ul>

</details>

<hr>

`;
