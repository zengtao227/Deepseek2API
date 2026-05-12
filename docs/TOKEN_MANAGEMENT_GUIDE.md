# 🔐 DeepSeek Token 管理与捕获指南

本文档记录了在 **Deepseek2API** 项目开发和使用过程中总结出的核心经验，旨在防止数据丢失和操作失效。

## ⚠️ 核心警示：不要点击“退出登录” (Logout)

> [!IMPORTANT]
> **在网页端（chat.deepseek.com）点击“退出登录”会立即导致该账号所有已捕获的 Token 失效。**

### 现象
如果您在浏览器中点击了 Logout，服务器会向后端发送撤销指令。此时，即使您本地 `config.json` 中保存了 Token，再次调用 API 时也会收到 `401 Unauthorized` 或 `invalid token` 错误。

### 正确做法
1. **登录后捕获 Token**。
2. **直接关闭标签页或整个浏览器窗口**。
3. 只要不点击“退出登录”，Session 就会在服务器端保持激活状态（通常可维持 7-14 天）。

---

## 🚀 自动化脚本使用指南

### 推荐工具：`scripts/capture-tokens-interactive.mjs`

这是本项目最成功的 Token 捕获方案，因为它能复用 Comet 浏览器中保存的密码。

#### 运行前提（关键！）
> [!CAUTION]
> **运行脚本前，必须彻底退出 Comet 浏览器 (Command + Q)。**

如果浏览器正在运行，脚本会报以下错误：
`Error: browserType.launchPersistentContext: Opening in existing browser session.`
这是因为 Chromium 限制同一时间只有一个进程能访问用户配置文件 (User Data)。

#### 操作流程
1. 彻底退出 Comet。
2. 在终端运行：`node scripts/capture-tokens-interactive.mjs`。
3. 脚本会自动打开一个新窗口。
4. 逐个账号点击“登录”按钮（密码会自动填充）。
5. 看到终端显示 `✅ Token 已保存` 后，继续下一个账号。

---

## 🛠️ 常见问题排查 (Troubleshooting)

### 1. Continue IDE 报 401 错误
- **原因**：Token 已过期或您之前点击了 Logout。
- **解决**：使用上述交互式脚本重新捕获 Token，并同步到 VPS。

### 2. 账号池轮转失效
- **现象**：14 个账号只有 1 个在工作。
- **解决**：检查 `config.json`，确保每个账号的 `token` 字段都是唯一的且有效的。如果所有 Token 都一样，说明迁移时出现了覆盖，需要重新捕获。

---

## 🔒 安全说明
* **密码保护**：本项目的脚本不会读取或保存您的明文密码。
* **本地优先**：Token 优先保存在本地 `config.json`，通过加密隧道同步到 VPS。
