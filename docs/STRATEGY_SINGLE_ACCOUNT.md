# Deepseek2API 稳定性与简化策略

## 核心发现

1. **Token 失效原因**：DeepSeek 的 Web Token 在用户主动登出（Logout）或 Session 冲突时会立即失效。
2. **自动化误区**：试图通过外部脚本（Playwright, CDP, LevelDB）实时抓取 Token 过于复杂且不可靠。
3. **原生优势**：项目 Go 后端本身支持 `password` 登录模式。当 Token 失效时，若配置了密码，后端会自动重新登录并刷新 Token。

## 推荐方案：单账号 + 密码模式

### 1. 配置简化
只在 `config.json` 中保留一个主力账号，并提供 `password`。删除所有 `token` 字段，让系统在启动时自动获取。

### 2. 优势
- **零手动操作**：无需 F12，无需运行任何捕获脚本。
- **永久在线**：Token 过期自动刷新，不再出现 401 错误。
- **工作区整洁**：删除了 20+ 个冗余的抓取脚本。

## 遗留清理计划
- [x] 删除所有 `scripts/*.mjs` 捕获类脚本。
- [x] 移除 `package.json` 中的 `playwright` 依赖。
- [x] 恢复 `package.json` 的 CommonJS 兼容性（已完成）。
- [ ] 确保 VPS 上的 `config.json` 与本地同步。
