# 星链课表规范与分享码指南 (Starlink Schedule)

本格式描述星链课表（Starlink App）的数据结构、分享码机制与作息时间表规范，**koishi-plugin-course-schedule 完全兼容并进行了深度体验优化**。

---

## 🌟 一、星链分享码 (Share Code) 导入机制

### 1. 分享码格式与提取规则
在星链课表 App 内点击分享后，会生成如下文本：
```text
我在「星链课表」分享了课表给你。打开课表页右上角「+」→ 分享码，输入：PABRdldk（1小时内有效）
```
插件会智能匹配提取出短码（如 `PABRdldk`），并通过星链云端接口在线下载解析课表数据。

### 2. 星链课表的核心痛点：节次 vs 具体时间
- **没有内置时间段**：星链导出的分享码和 JSON 数据中，课程只包含 `weekday`（星期）和 `startSection`/`endSection`（第几节到第几节），**不包含上课的具体时间**（如 08:00 - 09:35）；
- **本插件的创新解决方案**：
  1. 支持通过独立指令 `课表.设置星链时间表` 上传本校作息时间表；
  2. **自动刷新现有课表**：设置时间表后，插件自动检索数据库中该用户已有的星链课程，即时计算并写入对应时间，无需用户再次导入分享码；
  3. **误传自动拦截指引**：若用户把作息时间表误发送给 `课表.绑定`，插件自动识别并给出指引提示，避免被当作空课表报错；
  4. **开学日兜底**：若星链数据中缺少 `startDate`，插件自动以 `defaultSemesterStart`（默认 `2026-09-07`）对齐周数，杜绝跨周导致课表全空。

---

## ⏰ 二、星链作息时间表 (Timetable) 格式

使用命令 `课表.设置星链时间表` 时发送的作息时间表 JSON 格式如下：

### 1. 完整时间表示例
```json
{
  "name": "大学秋季作息时间表",
  "items": [
    {
      "section": 1,
      "startHour": 8,
      "startMinute": 0,
      "endHour": 8,
      "endMinute": 45
    },
    {
      "section": 2,
      "startHour": 8,
      "startMinute": 55,
      "endHour": 9,
      "endMinute": 40
    },
    {
      "section": 3,
      "startHour": 10,
      "startMinute": 0,
      "endHour": 10,
      "endMinute": 45
    },
    {
      "section": 4,
      "startHour": 10,
      "startMinute": 55,
      "endHour": 11,
      "endMinute": 40
    }
  ]
}
```

### 2. 导出作息时间方法
在星链 App 中：
1. 点击右上角三点 $\rightarrow$ 「上课时间」；
2. 点击当前时间表 $\rightarrow$ 点击 ✏️ 编辑图标；
3. 点击右上角「分享」符号，选择导出时间 JSON 并发送给 Bot。

---

## 📄 三、星链课表完整 JSON 格式

除了分享码外，亦可直接在 App 中导出完整的课表 JSON 文本发送给 `课表.绑定`。

```json
{
  "tableName": "我的课表",
  "startDate": "2026-09-07",
  "timeSlots": [
    { "number": 1, "startTime": "08:00", "endTime": "08:45" },
    { "number": 2, "startTime": "08:55", "endTime": "09:35" },
    { "number": 3, "startTime": "10:10", "endTime": "10:55" },
    { "number": 4, "startTime": "11:05", "endTime": "12:00" }
  ],
  "courses": [
    {
      "name": "高等数学",
      "teacher": "张教授",
      "location": "教101",
      "weekday": 1,
      "startSection": 1,
      "endSection": 2,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
      "name": "大学英语",
      "teacher": "李老师",
      "location": "教A201",
      "weekday": 3,
      "startSection": 3,
      "endSection": 4,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ]
}
```

### 字段说明
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `tableName` | string | 课表名称 |
| `startDate` | string | 学期开学日期（YYYY-MM-DD） |
| `courses` | array | 课程数组 |
| `courses[].weekday` | number | 星期几（1 为周一，7 为周日） |
| `courses[].startSection` | number | 起始节次 |
| `courses[].endSection` | number | 结束节次 |
| `courses[].weeks` | number[] | 上课周数列表 |
