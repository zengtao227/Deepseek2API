# DS2API 使用指南

## 重要说明

### 当前实现的工作方式

当前的 token 捕获脚本会**启动一个新的 Comet 浏览器实例**，这意味着：
- ✅ 可以自动化控制浏览器
- ❌ 无法访问你主浏览器中保存的密码
- ❌ 需要手动输入密码或使用浏览器的密码管理器

### 正确的使用流程

#### 步骤 1: 确保在项目目录中

```bash
# 导航到项目目录
cd /Users/zengtao/ds2api

# 验证你在正确的目录
pwd
# 应该输出: /Users/zengtao/ds2api
```

#### 步骤 2: 首次设置 - 在 Comet 浏览器中保存密码

1. **手动打开 Comet 浏览器**
2. **访问** https://chat.deepseek.com/sign_in
3. **登录并保存密码** - 确保 Comet 浏览器的密码管理器保存了你的凭证
4. **关闭浏览器**

#### 步骤 3: 运行 Token 捕获

```bash
# 在项目目录中运行
cd /Users/zengtao/ds2api
node scripts/capture-tokens-interactive.mjs
```

脚本会：
1. 启动一个新的 Comet 浏览器实例
2. 导航到 DeepSeek 登录页面
3. 等待你点击「登录」按钮
4. **Comet 浏览器应该自动填充密码**（如果你之前保存过）
5. 自动提取并提交 token

## 常见问题

### Q1: 为什么脚本启动新的浏览器实例？

**A:** 这是 Playwright 的工作方式。它需要完全控制浏览器实例才能自动化操作。

### Q2: 如何让 Comet 浏览器自动填充密码？

**A:** 
1. 首次手动在 Comet 浏览器中登录
2. 当浏览器提示"保存密码"时，点击"保存"
3. 下次脚本启动 Comet 时，密码管理器应该会自动填充

### Q3: 密码没有自动填充怎么办？

**可能的原因：**
- Comet 浏览器的密码管理器未启用
- 密码未正确保存
- 网站域名不匹配

**解决方案：**
1. 检查 Comet 浏览器设置 → 密码管理器
2. 确认 `chat.deepseek.com` 的密码已保存
3. 手动输入密码并再次保存

### Q4: 错误 "Execution context was destroyed"

**原因：** 页面导航或刷新导致上下文丢失

**解决方案：**
- 这是正常的，脚本会继续处理下一个账户
- 如果频繁出现，可能是网络问题或页面加载超时

### Q5: 错误 "fetch failed"

**原因：** 无法连接到 DS2API 服务

**解决方案：**
```bash
# 检查 DS2API 是否运行
curl http://localhost:5001/healthz

# 如果未运行，启动服务
cd /Users/zengtao/ds2api
./ds2api
```

## 替代方案：手动 Token 提取

如果自动化脚本不适合你的工作流程，可以手动提取 token：

### 方法 1: 使用浏览器开发者工具

1. 在你的 Comet 浏览器中打开 https://chat.deepseek.com
2. 登录你的账户
3. 打开开发者工具（F12 或 Cmd+Option+I）
4. 切换到 Console 标签
5. 运行以下代码：

```javascript
// 查找 token
const token = localStorage.getItem('token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('accessToken');
console.log('Token:', token);
```

6. 复制 token
7. 手动添加到 `config.json`：

```json
{
  "accounts": [
    {
      "email": "your-email@example.com",
      "password": "your-password",
      "token": "粘贴你的token"
    }
  ]
}
```

### 方法 2: 使用 curl 手动提交

```bash
# 提取 token 后，使用 curl 提交
curl -X POST http://localhost:5001/admin/accounts/capture-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -d '{
    "email": "your-email@example.com",
    "token": "your-extracted-token"
  }'
```

## 推荐工作流程

### 选项 A: 使用自动化脚本（推荐用于多账户）

适合场景：
- 有多个 DeepSeek 账户
- 需要定期更新 token
- 愿意在新浏览器实例中输入密码

步骤：
1. 确保 Comet 浏览器已保存所有账户密码
2. 运行脚本：`node scripts/capture-tokens-interactive.mjs`
3. 在浏览器中点击登录（密码应自动填充）
4. 等待脚本完成

### 选项 B: 手动提取（推荐用于单账户）

适合场景：
- 只有一个或少数账户
- 不想使用自动化脚本
- 已经在浏览器中登录

步骤：
1. 在你的主 Comet 浏览器中登录 DeepSeek
2. 使用开发者工具提取 token
3. 手动更新 `config.json`

## 项目迁移说明

### 当前位置
```
/Users/zengtao/ds2api
```

### 目标位置
```
/Users/zengtao/Doc/My code/DS2api
```

### 迁移步骤

```bash
# 1. 在当前位置运行迁移脚本
cd /Users/zengtao/ds2api
./scripts/relocate-project.sh

# 2. 导航到新位置
cd "/Users/zengtao/Doc/My code/DS2api"

# 3. 验证功能
./ds2api

# 4. 设置 GitHub（如果需要）
./scripts/setup-github.sh
```

## 安全提示

⚠️ **重要：**
- 永远不要将 `config.json` 提交到 Git
- 永远不要将 `.env` 提交到 Git
- 使用强密码作为 `DS2API_ADMIN_KEY`
- 定期更新 token
- 不要在公共网络上运行 token 捕获

## 获取帮助

如果遇到问题：

1. **检查日志**：查看控制台输出的错误信息
2. **验证配置**：运行 `node scripts/capture-tokens-interactive.mjs --validate`
3. **查看文档**：
   - [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)
   - [COMET_BROWSER_SETUP.md](COMET_BROWSER_SETUP.md)
   - [README.MD](README.MD)

## 总结

**关键点：**
1. ✅ 必须在项目目录 `/Users/zengtao/ds2api` 中运行命令
2. ✅ 脚本会启动新的 Comet 浏览器实例（这是正常的）
3. ✅ 需要在 Comet 浏览器中预先保存密码
4. ✅ 或者选择手动提取 token 的方式

**下一步：**
- 如果要继续使用自动化：确保 Comet 浏览器已保存密码
- 如果要手动提取：使用开发者工具方法
- 如果要迁移项目：运行 `./scripts/relocate-project.sh`
