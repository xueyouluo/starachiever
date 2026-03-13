# StarAchiever Kids 小程序 - 快速开始指南

## 开发环境准备

### 1. 安装必要工具
- Node.js (v14+)
- 微信开发者工具
- Git

### 2. 克隆项目
```bash
git clone <repository-url>
cd starachiever-kids/miniprogram
```

### 3. 安装依赖
```bash
npm install --legacy-peer-deps
```

## 开发流程

### 启动开发服务器
```bash
npm run dev:weapp
```

### 微信开发者工具配置
1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择：`starachiever-kids/miniprogram/dist`
4. AppID：使用"测试号"或自己的 AppID
5. 点击"导入"

## 云开发配置

### 方案 A：不使用云开发（快速测试）

如果暂时不需要云开发功能，可以直接运行，所有数据会保存在本地。

### 方案 B：配置云开发

1. **开通云开发**
   - 在微信小程序管理后台
   - 点击"云开发" → "开通"
   - 创建环境，记录环境 ID

2. **配置环境 ID**
   ```typescript
   // src/services/cloud.ts
   Taro.cloud.init({
     env: 'your-env-id' // 替换为实际环境 ID
   })
   ```

3. **部署云函数**
   - 在微信开发者工具中
   - 右键 `cloudfunctions/login` → "上传并部署：云端安装依赖"
   - 右键 `cloudfunctions/gemini` → "上传并部署：云端安装依赖"

4. **创建数据库集合**
   - 在云开发控制台
   - 数据库 → 新建集合 `users`

## 项目结构说明

```
miniprogram/
├── src/                    # 源代码
│   ├── pages/              # 页面
│   │   ├── index/          # 任务主页
│   │   ├── calendar/       # 日历
│   │   ├── profile/        # 个人档案
│   │   ├── select-child/   # 孩子选择
│   │   └── parent/         # 家长模式
│   ├── components/         # 组件
│   ├── services/           # 服务（存储、云数据库）
│   ├── store/              # 状态管理
│   └── utils/              # 工具函数
├── cloudfunctions/         # 云函数
├── config/                 # 配置
└── dist/                   # 编译输出（开发者工具导入此目录）
```

## 开发命令

```bash
# 开发模式（监听文件变化）
npm run dev:weapp

# 构建生产版本
npm run build:weapp

# 构建 H5 版本（可选）
npm run dev:h5
```

## 功能测试

### 1. 创建孩子档案
1. 打开小程序
2. 进入"我的" → "家长模式"
3. 输入密码（首次使用设置密码）
4. 在"成员"标签页添加孩子

### 2. 完成任务
1. 在"任务"页面查看任务列表
2. 点击任务卡片完成任务
3. 查看积分变化

### 3. 查看日历
1. 切换到"日历"标签
2. 查看完成记录和统计

### 4. 数据导出
1. 进入"我的" → "家长模式"
2. 切换到"数据"标签
3. 点击"导出"复制 JSON 数据

## 常见问题

### Q: 编译失败怎么办？
A: 删除 `node_modules` 和 `package-lock.json`，重新安装依赖：
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Q: 云函数调用失败？
A: 检查：
1. 环境ID是否正确配置
2. 云函数是否成功部署
3. 小程序是否开通云开发

### Q: TabBar 图标不显示？
A: 当前图标文件缺失，有两种解决方案：
1. 在 `src/assets/icons/` 添加图标文件
2. 修改 `app.config.ts`，移除 `iconPath` 和 `selectedIconPath` 配置

### Q: 数据不同步？
A: 检查：
1. 云开发环境是否正常
2. 网络连接是否正常
3. 查看控制台错误信息

## 发布流程

### 1. 构建生产版本
```bash
npm run build:weapp
```

### 2. 上传代码
- 在微信开发者工具中
- 点击"上传"按钮
- 填写版本号和备注

### 3. 提交审核
- 登录微信公众平台
- 版本管理 → 开发版本
- 点击"提交审核"
- 填写审核信息

### 4. 发布
- 审核通过后
- 版本管理 → 审核版本
- 点击"发布"

## 技术栈

- **框架**: Taro 4.1 + React 18
- **状态管理**: Zustand
- **样式**: SCSS
- **云开发**: 微信云开发
- **类型**: TypeScript

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
