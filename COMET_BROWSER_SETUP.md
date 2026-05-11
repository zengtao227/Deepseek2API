# Comet Browser 设置指南

本指南说明如何配置和使用 Comet 浏览器进行 DeepSeek token 捕获。

## ⚠️ 重要提示

**推荐方式：手动 Token 提取**

为了最大化安全性，我们**强烈推荐**使用手动 token 提取方式，而不是自动化脚本：

- ✅ **手动提取**：密码只保存在你的浏览器中，安全性最高
- ⚠️ **自动化脚本**：需要启动新浏览器实例，可能需要重新保存密码

详细的手动提取指南请参阅：[手动 Token 提取指南](MANUAL_TOKEN_EXTRACTION.md)

---

## 自动化方式（高级用户）

以下内容适用于需要批量处理大量账户的高级用户。如果你只有少量账户，请使用上面推荐的手动提取方式。

## 快速开始

### 1. 安装 Comet 浏览器

确保 Comet 浏览器已安装在默认位置：
```bash
/Applications/Comet.app/Contents/MacOS/Comet
```

验证安装：
```bash
ls -la /Applications/Comet.app/Contents/MacOS/Comet
```

### 2. 配置环境变量（可选）

如果 Comet 浏览器安装在非默认位置，设置环境变量：

**临时设置（当前终端会话）：**
```bash
export COMET_BROWSER_PATH="/path/to/your/Comet"
```

**永久设置（添加到 shell 配置文件）：**

对于 zsh (macOS 默认)：
```bash
echo 'export COMET_BROWSER_PATH="/path/to/your/Comet"' >> ~/.zshrc
source ~/.zshrc
```

对于 bash：
```bash
echo 'export COMET_BROWSER_PATH="/path/to/your/Comet"' >> ~/.bash_profile
source ~/.bash_profile
```

### 3. 验证配置

运行验证命令检查配置是否正确：
```bash
node scripts/capture-tokens-interactive.mjs --validate
```

预期输出：
```
🔍 验证配置...

  检查 Comet 浏览器: /Applications/Comet.app/Contents/MacOS/Comet
  ✅ 已找到

  检查 DS2API 端点: http://localhost:5001
  ✅ 可达

  检查管理员密钥
  ✅ 已配置

✅ 配置验证通过
```

### 4. 运行 Token 捕获

启动 DS2API 服务（如果尚未运行）：
```bash
./ds2api
```

在另一个终端运行 token 捕获：
```bash
node scripts/capture-tokens-interactive.mjs
```

脚本将：
1. 启动 Comet 浏览器
2. 导航到 DeepSeek 登录页面
3. 等待你点击「登录」按钮
4. 自动提取并提交 token

## 环境变量参考

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `COMET_BROWSER_PATH` | Comet 浏览器可执行文件路径 | `/Applications/Comet.app/Contents/MacOS/Comet` |
| `DS2API_URL` | DS2API 服务地址 | `http://localhost:5001` |
| `DS2API_ADMIN_KEY` | DS2API 管理员密钥 | 从 `.env` 或 `~/ds2api/.env` 读取 |

## 故障排除

### 问题：Comet 浏览器未找到

**症状：**
```
❌ Comet 浏览器未找到: /Applications/Comet.app/Contents/MacOS/Comet
```

**解决方案：**
1. 确认 Comet 已安装：`ls -la /Applications/Comet.app`
2. 如果安装在其他位置，设置 `COMET_BROWSER_PATH`
3. 检查文件权限：`ls -la /Applications/Comet.app/Contents/MacOS/Comet`

### 问题：DS2API 端点不可达

**症状：**
```
❌ DS2API 端点不可达: fetch failed
```

**解决方案：**
1. 确认 DS2API 正在运行：`curl http://localhost:5001/healthz`
2. 如果未运行，启动服务：`./ds2api`
3. 检查端口是否被占用：`lsof -i :5001`

### 问题：管理员密钥未配置

**症状：**
```
❌ ADMIN_KEY 未配置或长度不足 32 字符
```

**解决方案：**
1. 检查 `.env` 文件：`cat .env | grep DS2API_ADMIN_KEY`
2. 如果不存在，从示例复制：`cp .env.example .env`
3. 编辑 `.env` 并设置强密码（至少 32 字符）
4. 生成随机密钥：`openssl rand -hex 32`

### 问题：浏览器启动但无法登录

**可能原因：**
- Comet 浏览器未保存密码
- 网络连接问题
- DeepSeek 网站变更

**解决方案：**
1. 手动在 Comet 浏览器中登录一次并保存密码
2. 检查网络连接
3. 查看浏览器控制台是否有错误

## 与 Chrome 的区别

| 特性 | Chrome (旧) | Comet (新) |
|------|-------------|-----------|
| 浏览器路径 | `/Applications/Google Chrome.app/...` | `/Applications/Comet.app/...` |
| 密码管理 | Chrome 密码管理器 | Comet 密码管理器 |
| 配置方式 | 硬编码路径 | 环境变量 + 默认路径 |
| 验证模式 | 不支持 | 支持 `--validate` 标志 |

## 高级用法

### CI/CD 环境

在 CI/CD 环境中，可以通过环境变量配置：

```yaml
# GitHub Actions 示例
env:
  COMET_BROWSER_PATH: /usr/local/bin/comet
  DS2API_URL: http://localhost:5001
  DS2API_ADMIN_KEY: ${{ secrets.DS2API_ADMIN_KEY }}

steps:
  - name: Validate Configuration
    run: node scripts/capture-tokens-interactive.mjs --validate
```

### Docker 环境

在 Docker 中使用：

```dockerfile
ENV COMET_BROWSER_PATH=/usr/local/bin/comet
ENV DS2API_URL=http://ds2api:5001
```

### 多账户配置

脚本支持批量处理多个账户。编辑 `scripts/capture-tokens-interactive.mjs` 中的 `accounts` 数组：

```javascript
const accounts = [
  { alias: 'Account1', email: 'user1@example.com' },
  { alias: 'Account2', email: 'user2@example.com' },
  // 添加更多账户...
];
```

## 安全注意事项

⚠️ **重要：** 
- 永远不要将 `config.json` 或 `.env` 提交到版本控制
- 使用强密码（至少 32 字符）作为管理员密钥
- 定期更新 token
- 不要在公共网络上运行 token 捕获

## 相关文档

- [迁移检查清单](MIGRATION_CHECKLIST.md) - 完整迁移步骤
- [README.MD](README.MD) - 项目主文档
- [API.md](API.md) - API 接口文档
