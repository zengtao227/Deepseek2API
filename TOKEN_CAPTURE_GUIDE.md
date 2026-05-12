# DeepSeek Token 智能捕获工具 - 使用指南

## 🎯 概览

这个工具可以帮助你为 13 个 DeepSeek 账户自动提取独立的 token，完全替代当前的共享 token 方案。

**核心优势：**
- ✅ 一键启动，无需命令行
- ✅ 浏览器自动填充保存的密码
- ✅ 脚本自动捕获和保存 token
- ✅ 自动更新 VPS 配置
- ✅ 适合所有用户，无技术门槛

## 📋 前置条件

### 必需
- Node.js 14+ （大多数开发机都有）
- 本机已保存 13 个账户的登录信息到浏览器

### 推荐
- Chrome 或 Chromium 浏览器（Playwright 会自动下载）
- VPS 正常运行（frank, tokyo, 或 zurich 中的任意一个）

## 🚀 快速开始

### macOS / Linux：
```bash
# 进入项目目录
cd /path/to/Deepseek2API

# 启动工具
bash scripts/start-capture.sh

# 或使用 npm
npm run start-capture
```

### Windows：
```batch
# 进入项目目录
cd path\to\Deepseek2API

# 双击或运行
scripts\start-capture.bat

# 或使用 npm
npm run capture-tokens
```

## 📝 完整使用步骤

### 步骤 1：启动
- 运行对应系统的启动脚本
- 脚本会自动检查环境、安装依赖、启动浏览器

### 步骤 2：登录账户
浏览器打开后，按照以下流程登录每个账户：
1. 在浏览器中输入或点击第一个账户的邮箱
2. 点击"下一步"
3. 输入密码（浏览器会自动填充）
4. 点击"登录"
5. 脚本显示 `✅ 已捕获: [email]`
6. 自动返回登录页
7. 重复以上步骤登录其他 12 个账户

### 步骤 3：等待完成
- 所有 13 个 token 捕获后，脚本自动：
  - 连接 VPS
  - 更新 config.json
  - 重启 ds2api 服务
- 显示完成消息

## ⚠️ 常见问题

### Q: 浏览器没自动打开？
检查系统安全设置，允许脚本启动浏览器。

### Q: 密码没有自动填充？
确保浏览器已保存该账户密码。手动输入也可以。

### Q: VPS 无法连接？
脚本会自动尝试 frank → tokyo → zurich，确保其中至少一个在线。

### Q: 登录失败了？
按 Ctrl+C 停止脚本，修复问题后重新运行继续。

## 🔒 安全说明

- 密码 **不会** 被保存，仅由浏览器管理
- Token 直接从登录响应提取
- Config.json 中的密码字段自动清除

---

**更多信息** 请查看项目 README 和源代码注释。
