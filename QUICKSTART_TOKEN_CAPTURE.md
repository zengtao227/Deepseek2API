# 🚀 快速开始 - Token 智能捕获

> 一键为 13 个 DeepSeek 账户获取独立 token！

## ⚡ 30 秒快速上手

### macOS / Linux：
```bash
cd /path/to/Deepseek2API
npm run start-capture
```

### Windows：
```batch
cd path\to\Deepseek2API
npm run capture-tokens
```

**就这么简单！** 脚本会自动：
- 检查环境
- 打开浏览器
- 监听你的登录
- 提取 13 个 token
- 更新 VPS 配置

## 📱 使用流程（3 步）

### Step 1: 启动脚本
```bash
npm run start-capture    # macOS/Linux
# 或
npm run capture-tokens   # Windows (如果上面不工作)
```

### Step 2: 在浏览器中登录账户
浏览器自动打开后，依次登录你的 13 个账户：

```
1️⃣ 点击邮箱输入框
2️⃣ 输入账户邮箱
3️⃣ 点击"下一步"
4️⃣ 输入密码（浏览器自动填充）
5️⃣ 点击"登录"
6️⃣ 脚本显示 ✅ 已捕获: [email]
7️⃣ 返回登录页，重复步骤 1-5 登录下一个账户
```

### Step 3: 等待完成
所有 13 个 token 捕获后，脚本自动：
- ✅ 连接到 VPS
- ✅ 更新 config.json
- ✅ 重启 ds2api 服务
- ✅ 显示 "完成！" 消息

**就完成了！** 现在 Continue IDE 会使用 13 个独立 token。

## ❓ 遇到问题？

| 问题 | 解决方案 |
|------|---------|
| 浏览器没打开 | 检查防火墙，允许 Node.js 启动浏览器 |
| `npm: command not found` | 安装 Node.js（https://nodejs.org） |
| `Cannot find module` | 运行 `npm install` |
| VPS 无法连接 | 确保 frank/tokyo/zurich 中至少一个在线 |
| 登录失败 | 按 Ctrl+C 停止，修复后重新运行 |

## 📖 详细文档

查看 `TOKEN_CAPTURE_GUIDE.md` 获取完整说明。

## 🎯 核心要点

- 🔐 **密码安全** - 密码不会被保存，仅由浏览器管理
- 🚀 **完全自动** - 脚本自动监听和提取 token
- ♻️ **可重复使用** - 任何时候都可以重新运行
- 👥 **团队友好** - 所有成员都能使用

---

**准备好了？** 运行 `npm run start-capture` 开始吧！
