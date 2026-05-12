# Deepseek2API Token 认证模式

本改造允许你使用 Token 认证而不是 Password，这样可以避免在配置文件中保存明文密码。

## 工作流程

### 第 1 步：编译改造后的 Deepseek2API

```bash
cd /Users/zengtao/Deepseek2API
go build -o Deepseek2API ./cmd/Deepseek2API
```

如果你没有安装 Go，请先安装：
```bash
brew install go
```

### 第 2 步：启动 Deepseek2API（Admin API 模式）

配置 `.env` 文件：
```bash
cp .env.example .env
# 编辑 .env，设置 Deepseek2API_ADMIN_KEY
echo "Deepseek2API_ADMIN_KEY=your-secure-key" >> .env
```

启动服务：
```bash
# 方式 A：直接运行
./Deepseek2API

# 方式 B：Docker 运行
docker-compose up
```

Deepseek2API 将在 `http://localhost:5001` 启动

### 第 3 步：使用交互式脚本捕获 Tokens

```bash
cd /Users/zengtao/Deepseek2API
npm install playwright  # 首次运行需要
node scripts/capture-tokens-interactive.mjs
```

脚本会：
1. 📌 启动浏览器（非 headless）
2. 📧 逐一导航到 DeepSeek 登陆页面
3. 👤 等待你手动完成登陆（浏览器会自动填充保存的密码）
4. 🔑 自动从浏览器 localStorage 中提取 token
5. 💾 自动提交 token 到 Deepseek2API 的 `/admin/accounts/capture-token` 端点

### 第 4 步：验证配置

访问 http://localhost:5001/admin 查看已配置的账户：
- ✅ 有 Token 的账户可以直接使用
- ⚠️  没有 Token 的账户会在首次使用时自动登陆（需要 password）

## 安全特点

✅ **密码不保存** - 密码始终由浏览器管理  
✅ **Token 有期限** - Token 会定期刷新（可在配置中设置）  
✅ **加密存储** - Token 只保存在本地 config.json 中  
✅ **支持密钥认证** - Deepseek2API 的 `/admin/accounts/capture-token` API 受 Admin Key 保护  

## 配置文件示例

改造后，`config.json` 可以是这样的：

```json
{
  "api_keys": [
    {
      "key": "sk-your-api-key-1",
      "name": "Default Key",
      "remark": "For VSCode Cline"
    }
  ],
  "accounts": [
    {
      "name": "Account 1",
      "email": "zengtao227@gmail.com",
      "token": "sk-token-xxxxx..."
    },
    {
      "name": "Account 2",
      "email": "zengtao227.de@gmail.com",
      "token": "sk-token-yyyyy..."
    }
  ],
  "runtime": {
    "account_max_inflight": 2,
    "account_max_queue": 0,
    "global_max_inflight": 0,
    "token_refresh_interval_hours": 6
  }
}
```

注意：
- 不需要 `password` 字段
- `token` 字段是从登陆时获取的
- 系统会每 6 小时自动刷新一次 token

## Token 刷新机制

Deepseek2API 会自动管理 Token 生命周期：
- 首次使用时：直接使用 config.json 中的 token
- Token 有效期内：继续使用该 token
- Token 过期时：自动刷新（如果配置了 `token_refresh_interval_hours`）
- 如果没有配置 password，刷新时会自动切换到其他账户

## API 端点

### 捕获 Token（新增）

```
POST /admin/accounts/capture-token
Authorization: Bearer {Deepseek2API_ADMIN_KEY}
Content-Type: application/json

{
  "email": "user@gmail.com",
  "token": "sk-token-xxxxx..."
}

Response:
{
  "success": true,
  "email": "user@gmail.com",
  "message": "Token 已保存"
}
```

## 故障排除

### 脚本无法启动浏览器
```bash
# 确保 Google Chrome 已安装
which "Google Chrome"

# 或指定 Chrome 路径
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/capture-tokens-interactive.mjs
```

### Token 无法自动提取
- 登陆后，在 DevTools (F12) > Application > LocalStorage 中手动查找 token
- 查找以下键：`token`, `auth_token`, `accessToken`, `deepseek_token`
- 在脚本提示时手动粘贴

### Deepseek2API 拒绝保存 Token
- 检查 Admin Key 是否设置正确
- 检查 Deepseek2API 日志中的错误信息
- 确保 email 格式正确

## 安全建议

1. **不要分享 config.json** - Token 虽然可以刷新，但仍是敏感信息
2. **定期刷新 Token** - 设置较短的 `token_refresh_interval_hours`
3. **使用强 Admin Key** - 保护 `/admin/accounts/capture-token` 端点
4. **备份配置** - config.json 包含所有账户的 token

## 后续步骤

改造完成后，配置 Cline 使用本地 Deepseek2API：
```
Base URL: http://localhost:5001
Model: deepseek-v4-pro
API Key: {Deepseek2API_ADMIN_KEY}
```

详见 Deepseek2API 的完整文档：https://github.com/CJackHwang/Deepseek2API
