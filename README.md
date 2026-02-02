# StarAchiever Kids  星星宝贝

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="StarAchiever Kids Banner" width="1200"/>
</div>

> 一个有趣的儿童习惯养成应用，通过游戏化的方式帮助孩子们建立良好的生活习惯。

## 项目简介

StarAchiever Kids 是一个专为儿童设计的习惯养成和任务管理应用。通过积分奖励、成就勋章、AI 互动伙伴等游戏化元素，激发孩子们完成日常任务的积极性，培养良好的生活和学习习惯。

### 核心特性

- 多成员支持 - 支持多个孩子独立使用，各自记录任务和积分
- 任务分类管理 - 学习、健康、家务、其他四大分类
- 积分奖励系统 - 完成任务获得积分，兑换心仪奖励
- 成就勋章 - 解锁多种成就，激励持续进步
- 连续打卡 - 记录连续打卡天数，培养坚持习惯
- 日历视图 - 可视化展示每日打卡记录
- AI 互动伙伴 - 基于 Gemini AI 的智能鼓励和活动建议
- 家长模式 - 密码保护的家长设置中心
- 数据导出 - 支持 Excel 和 JSON 格式导出

## 技术栈

- **前端框架**: React 19.2.4 + TypeScript
- **构建工具**: Vite 6.2.0
- **样式方案**: Tailwind CSS (CDN)
- **图标库**: Lucide React
- **数据处理**: XLSX (Excel 导出)
- **AI 集成**: Google Gemini AI (@google/genai)

## 项目结构

```
starachiever/
├── components/          # React 组件
│   ├── CalendarTab.tsx      # 日历视图
│   ├── GeminiBuddy.tsx      # AI 互动伙伴
│   ├── Layout.tsx           # 布局组件
│   ├── Modal.tsx            # 弹窗组件
│   ├── ParentMode.tsx       # 家长设置中心
│   ├── ProfileTab.tsx       # 个人档案页
│   ├── RewardCard.tsx       # 奖励卡片
│   ├── TaskCard.tsx         # 任务卡片
│   └── exportToExcel.ts     # 数据导出功能
├── services/           # 服务层
│   └── geminiService.ts     # Gemini AI 服务
├── App.tsx             # 主应用组件
├── types.ts            # TypeScript 类型定义
├── constants.ts        # 常量定义
└── index.tsx           # 应用入口
```

## 功能详解

### 1. 任务管理

- **分类任务**: 支持 4 大分类（学习、健康、家务、其他），每个任务可设置：
  - 任务名称
  - 积分奖励
  - 图标 (Emoji)
  - 所属分类
- **每日重置**: 每日自动重置任务完成状态
- **分类收起**: 任务分类可收起/展开，方便查看

### 2. 积分与奖励

- **积分系统**: 完成任务获得积分，累计可兑换奖励
- **奖励兑换**: 孩子可用积分兑换家长设置的奖励
- **兑换记录**: 完整记录每次兑换的时间和内容

### 3. 成就系统

支持 4 种成就类型：
- `TOTAL_TASKS` - 累计完成任务总数
- `TOTAL_POINTS` - 累计获得积分总数
- `STREAK` - 连续打卡天数
- `CATEGORY_COUNT` - 特定分类任务数量

### 4. AI 互动伙伴 (GeminiBuddy)

基于 Google Gemini AI 的智能伙伴，提供：
- **智能鼓励**: 根据当前积分给予个性化鼓励
- **活动建议**: 推荐适合的趣味活动

> 需要配置 `GEMINI_API_KEY` 才能使用 AI 功能

### 5. 数据统计

- 每日打卡明细（包含任务完成时间）
- 累计统计（总任务数、总积分、分类统计）
- 连续打卡天数记录
- 积分消耗记录

### 6. 家长模式

密码保护的管理中心，功能包括：
- 成员管理（添加/删除孩子档案）
- 任务管理（自定义任务列表）
- 奖励管理（设置可兑换奖励）
- 勋章管理（设计成就勋章）
- 数据导出

### 7. 数据导出

支持两种导出方式：
- **Excel 导出**: 包含每日打卡明细、积分消耗记录、累计统计
- **JSON 导出**: 完整数据备份，便于数据迁移

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/your-username/starachiever.git
cd starachiever
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量（可选）

创建 `.env.local` 文件配置 Gemini API（如需使用 AI 功能）：
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

4. 启动开发服务器
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
```

## 使用指南

### 初次使用

1. 打开应用后，点击「添加成员」创建孩子档案
2. 设置家长密码（防止小朋友误操作）
3. 进入家长模式，为孩子配置任务和奖励
4. 孩子完成任务后点击完成，获得积分
5. 积分达到要求后可兑换奖励

### 家长设置

点击右下角「家长」按钮，输入密码后进入设置中心：

- **成员**: 管理孩子档案，导出数据
- **任务**: 为每个孩子配置每日任务
- **奖励**: 设置可兑换的奖励和所需积分
- **勋章**: 设计成就勋章和解锁条件

### 数据导出

在家长模式的「成员」页面：
- **导出 Excel**: 查看详细的每日打卡记录
- **导出 JSON**: 备份完整数据

## 数据存储

所有数据存储在浏览器的 `localStorage` 中，存储键为 `starachiever_data_v5`。

数据包含：
- 多个孩子的完整档案
- 每日任务完成记录（精确到秒）
- 积分兑换记录
- 成就解锁状态
- 家长密码

## 本地化

应用目前使用简体中文界面。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

<div align="center">
  Made with :sparkles: for kids and parents
</div>
