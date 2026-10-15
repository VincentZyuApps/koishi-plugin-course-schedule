# Yunzai 插件原生 JSON 格式

本格式是 [Yunzai-Schedule-Plugin](https://github.com/Temmie0125/Yunzai-Schedule-Plugin) 的内部存储与导出默认格式，**koishi-plugin-course-schedule 完全兼容**。

> 下文中 **"本插件"** 指 koishi-plugin-course-schedule，"Yunzai 插件"指 Yunzai-Schedule-Plugin。

---

## 核心特点

- **时间信息直接存储**：每门课程自带 `startTime`/`endTime` 字段，不依赖节次映射表
- **数据零丢失**：导入→导出周期内时间信息完全保留
- **同时支持两种插件**：一份 JSON 可直接在 Yunzai 插件和本插件之间互换使用

---

## 完整 JSON 示例

```json
{
  "tableName": "2026春季学期",
  "semesterStart": "2026-03-02",
  "courses": [
    {
      "name": "高等数学",
      "teacher": "张教授",
      "location": "教101",
      "day": 1,
      "startTime": "08:00",
      "endTime": "09:35",
      "startNode": 1,
      "step": 2,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    },
    {
      "name": "大学英语",
      "teacher": "李老师",
      "location": "教A201",
      "day": 3,
      "startTime": "10:10",
      "endTime": "12:00",
      "startNode": 3,
      "step": 2,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ],
  "timeSlots": [
    { "number": 1, "startTime": "08:00", "endTime": "08:45" },
    { "number": 2, "startTime": "08:55", "endTime": "09:35" },
    { "number": 3, "startTime": "10:10", "endTime": "10:55" },
    { "number": 4, "startTime": "11:05", "endTime": "12:00" }
  ]
}
```

---

## 顶层字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tableName` | string | 否 | 课表名称，缺省时使用默认值 |
| `semesterStart` | string | 建议 | 学期开始日期，格式 `YYYY-MM-DD`。**本插件缺省时使用当前周一**；Yunzai 插件缺省时使用配置默认值 |
| `courses` | array | **是** | 课程数组，至少包含 1 门课程 |
| `timeSlots` | array | 否 | 时间表配置（本插件导入时会保存，可用于后续按节次查询/调整） |

---

## 课程对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | **是** | 课程名称 |
| `day` | number | **是** | 星期几：`1`=周一，`2`=周二，…，`7`=周日 |
| `startTime` | string | **是** | 开始时间，24 小时制 `HH:MM` |
| `endTime` | string | **是** | 结束时间，24 小时制 `HH:MM` |
| `weeks` | number[] | 建议 | 上课周数列表，如 `[1,3,5,7,9]`。**本插件缺省时使用 1-20 周**；Yunzai 插件缺省时使用空数组 |
| `teacher` | string | 否 | 教师姓名 |
| `location` | string | 否 | 上课地点 |
| `startNode` | number | 否 | 课程起始节次（本插件解析时保留，Yunzai 插件中用于时间表切换） |
| `step` | number | 否 | 课程持续节次数，如 `startNode=1, step=2` 表示第 1-2 节连上 |

---

## 最小可用示例

```json
{
  "tableName": "我的课表",
  "semesterStart": "2026-03-02",
  "courses": [
    {
      "name": "高等数学",
      "teacher": "张教授",
      "location": "教101",
      "day": 1,
      "startTime": "08:00",
      "endTime": "09:35",
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8]
    },
    {
      "name": "大学英语",
      "teacher": "李老师",
      "location": "教A201",
      "day": 3,
      "startTime": "10:10",
      "endTime": "12:00",
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ]
}
```

---

## 格式识别条件

### 本插件（koishi-plugin-course-schedule）

在 `src/services/json-parser.ts` 中，`isNativeJson()` 检测方式：

```ts
// 第一门课程同时包含 startTime、endTime、day 三个字段
return 'startTime' in sample && 'endTime' in sample && 'day' in sample
```

> **注意**：解析入口 `bind.ts` 的检测顺序为：星链 JSON → 拾光 JSON → 原生 JSON。如果课程同时含有 `weekday`（星链格式特征），**会优先匹配星链解析路径**。因此请确保使用 `day` 而非 `weekday`。

### Yunzai-Schedule-Plugin

在 `services/scheduleImporter.js` 中检测方式：

```js
// 第一门课程同时包含 startTime 和 endTime 字段
const isNativeCourseFormat = sampleCourse &&
  sampleCourse.hasOwnProperty('startTime') && sampleCourse.hasOwnProperty('endTime');
```

> 补充：Yunzai 插件的解析顺序为：星链格式 → 原生格式 → 拾光格式 → 兜底通用。星链格式检测要求课程**不含** `startTime`/`day`，因此原生格式不会被误拦截。

---

## 导入方式

1. **粘贴 JSON 文本**：直接发送 `课表.绑定` + JSON 文本
2. **上传 `.json` 文件**：发送 `课表.绑定` 后上传文件，或直接发送含 `.json` 文件附件的消息

两种方式均会自动识别格式并导入。

---

## 参考来源

- [Yunzai-Schedule-Plugin README — 课程表 JSON 数据结构说明](https://github.com/Temmie0125/Yunzai-Schedule-Plugin#-课程表-json-数据结构说明)
- 本插件源码：`src/services/json-parser.ts`
- Yunzai 插件源码：`services/scheduleImporter.js`（`isNativeCourseFormat` + `convertStarlinkJsonToStandard` 的 fallback 逻辑）
