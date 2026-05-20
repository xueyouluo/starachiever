# StarAchiever Kids - WeChat Mini Program

基于 Taro 框架的微信小程序版本，提供更稳定的数据存储和更好的移动端体验。

## 功能特性

- ✅ 多孩子支持：为每个孩子创建独立的档案
- ✅ 任务管理：自定义任务，分类管理，每日打卡
- ✅ 积分奖励：完成任务获得积分，兑换奖励
- ✅ 成就系统：解锁勋章，激励孩子持续进步
- ✅ 日历统计：可视化查看完成记录
- ✅ 云端备份：自有服务器自动备份数据
- ✅ AI 助手：智能鼓励语和活动建议

## 开发指南

### 安装依赖

```bash
cd miniprogram
npm install
```

### 开发模式

```bash
npm run dev:weapp
```

然后在微信开发者工具中导入 `dist` 目录。

### 构建生产版本

```bash
STARACHIEVER_API_BASE_URL=https://stars.followllm.online npm run build:weapp
```

## 项目结构

```
miniprogram/
├── src/
│   ├── pages/           # 小程序页面
│   │   ├── index/       # 任务主页
│   │   ├── calendar/    # 日历页面
│   │   ├── profile/     # 个人档案
│   │   └── select-child/# 孩子选择
│   ├── components/      # 公共组件
│   ├── services/        # 服务层（本地存储、自有服务器同步）
│   ├── store/           # 状态管理（Zustand）
│   ├── utils/           # 工具函数
│   └── types.ts         # 类型定义
└── config/              # 配置文件
```

## 自有服务器同步配置

当前生产 API 地址：

```text
https://stars.followllm.online
```

小程序上传前需要完成两项配置：

1. 微信小程序后台添加 request 合法域名：

```text
https://stars.followllm.online
```

2. 构建小程序时注入 API 地址：

```bash
STARACHIEVER_API_BASE_URL=https://stars.followllm.online npm run build:weapp
```

注意：
- 微信后台只填写域名，不要带 `/api/health` 或其它路径。
- 正式上传不要使用 `http://47.97.157.160:3001`。
- 未设置 `STARACHIEVER_API_BASE_URL` 时会使用占位域名 `https://your-domain.example.com`，无法用于正式环境。
- 数据同步是本地优先：本地有数据时直接上传服务器；只有本地没有数据时才从服务器恢复。

当前 API 请求路径：

```text
POST /api/auth/wechat
GET  /api/data
PUT  /api/data
GET  /api/health
```

## 数据迁移

从 Web 版导入数据：
1. 在 Web 版导出 JSON 数据
2. 在小程序的"我的"页面 → "家长模式" → "数据管理" → "导入数据"
3. 粘贴 JSON 数据并确认

## 技术栈

- **框架**：Taro 4.1 + React 18
- **状态管理**：Zustand
- **样式**：SCSS
- **云端同步**：自有 Node.js API
- **类型**：TypeScript

## 待完成功能

- [ ] 家长模式完整实现
- [ ] 任务编辑功能
- [ ] 奖励管理页面
- [ ] 勋章管理页面
- [ ] 分类管理页面
- [ ] 数据导入导出优化
- [ ] 性能优化
- [ ] 错误处理完善

## 许可证

MIT
