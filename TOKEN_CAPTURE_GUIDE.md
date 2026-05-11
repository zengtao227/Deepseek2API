# 🎯 DS2API Token 自动捕获完整指南

## 核心理念

**你只需做一件事：在浏览器中登陆账户**  
**其他一切（密码管理、token 提取、配置保存）完全自动化**

---

## 📋 前置准备（3 分钟）

### 1️⃣ 确保 DS2API 已改造并编译

```bash
cd /Users/zengtao/ds2api

# 如果还没编译过，编译现在
go build -o ds2api ./cmd/ds2api

# 如果 go 没装过
brew install go
```

### 2️⃣ 配置 DS2API 的 Admin Key

```bash
cd /Users/zengtao/ds2api

# 创建 .env 文件
cp .env.example .env

# 编辑 .env，设置一个强密钥
# 或者直接添加
echo "DS2API_ADMIN_KEY=your-very-secure-key-at-least-32-characters" >> .env
```

### 3️⃣ 安装依赖

```bash
cd /Users/zengtao/ds2api
npm install  # 包括 playwright 和 ws
```

---

## 🚀 一键启动（推荐）

### 方式 A：使用启动脚本（最简单）

```bash
cd /Users/zengtao/ds2api
./scripts/start-token-capture.sh
```

脚本会：
1. ✅ 检查所有前置条件
2. ✅ 自动启动 Comet（CDP 模式）
3. ✅ 自动启动监听脚本
4. ✅ 等待你在浏览器中登陆

### 方式 B：手动启动（如果脚本有问题）

**终端 1：启动 Comet（CDP 模式）**
```bash
/Applications/Comet.app/Contents/MacOS/Comet --remote-debugging-port=9222
```

**终端 2：启动 DS2API**
```bash
cd /Users/zengtao/ds2api
./ds2api
```

**终端 3：启动监听脚本**
```bash
cd /Users/zengtao/ds2api
node scripts/cdp-token-monitor.mjs
```

---

## 💻 使用流程（13 个账户）

### 第一个账户示例

1. **打开浏览器**：在 Comet 中访问 https://chat.deepseek.com

2. **点击登陆**：点击"Continue with Google"或直接登陆

3. **输入邮箱**：输入 `zengtao227@gmail.com`

4. **浏览器自动填充密码**：点击确认（或让浏览器自动填充）

5. **完成登陆**：进入 DeepSeek 主界面

6. **脚本自动开始工作**：
   ```
   🚀 正在提交 zengtao227@gmail.com 的 token...
   ✅ zengtao227@gmail.com - 保存成功
   📊 进度: 1/13 (剩余 12 个)
   ```

### 重复 12 次

登出，重复上述步骤，每次登陆不同的账户：

```
2. zengtao227.de@gmail.com
3. zengtao227.ch@gmail.com
4. zengtao227.us@gmail.com
5. zengtao227.sg@gmail.com
6. zengqhxf@gmail.com
7. liyue828@gmail.com
8. liyue828.de@gmail.com
9. mia.rhzeng@gmail.com
10. 9pgyxsfby5@privaterelay.appleid.com
11. yqrt7tjg85@privaterelay.appleid.com
12. xhg4h79pph@privaterelay.appleid.com
13. n6vst2bmsc@privaterelay.appleid.com
```

---

## 🔐 安全保证

```
你的操作           脚本的操作            数据流向
─────────────────────────────────────────────────
输入邮箱 ──────→ 100% 留在浏览器 ──────→ Comet 保存
           浏览器自动填充密码（脚本看不到）
                                          ↓
进入 DeepSeek ──→ 登陆成功 ──────→ localStorage 中有 token
                  脚本通过 CDP 协议检测

                  ↓
                  脚本提取 token（从 localStorage）
                  ✅ 密码不暴露
                  ✅ token 是可刷新的（比密码更安全）
                  ↓
                  提交到 DS2API /admin/accounts/capture-token
                  ↓
                  保存到 config.json
```

**关键特点**：
- ✅ 密码 **100% 保存在浏览器中**，脚本完全无法访问
- ✅ Token 是**临时可刷新的**，比密码更安全
- ✅ 即使有人拿到 config.json，也只能看到 token 而非密码
- ✅ Token 会自动刷新，过期后需要重新登陆

---

## ✅ 完成后

所有 13 个账户的 token 都被保存到 `config.json`：

```json
{
  "accounts": [
    {
      "email": "zengtao227@gmail.com",
      "token": "sk-xxxxxxxxxxxxxxxx...",
      "name": "Tao"
    },
    {
      "email": "zengtao227.de@gmail.com",
      "token": "sk-yyyyyyyyyyyyyyyy...",
      "name": "Tao.de"
    },
    ...
  ]
}
```

### 验证配置

```bash
cd /Users/zengtao/ds2api

# 检查 config.json
cat config.json | grep token | head -3

# 应该看到类似：
#   "token": "sk-xxxxx...",
#   "token": "sk-yyyyy...",
```

### 配置 Cline 使用本地 DS2API

1. 打开 VS Code
2. 打开 Cline 扩展设置
3. 选择"Custom API"
4. 填写以下信息：
   ```
   Base URL: http://localhost:5001
   Model: deepseek-v4-pro
   API Key: {你在 .env 中设置的 DS2API_ADMIN_KEY}
   ```

5. ✅ 测试连接

现在你就可以在 VS Code 中使用 Cline，它会自动轮转使用你的 13 个 DeepSeek 账户！🎉

---

## 🐛 故障排除

### ❌ 错误：Cannot connect to CDP

**解决**：
```bash
# 完全关闭 Comet
pkill -9 Comet
killall Comet

# 重新启动（带 CDP）
/Applications/Comet.app/Contents/MacOS/Comet --remote-debugging-port=9222
```

### ❌ 错误：无法连接到 DS2API

**解决**：
```bash
# 确保 DS2API 正在运行
cd /Users/zengtao/ds2api
./ds2api

# 或用 Docker
docker-compose up
```

### ❌ 脚本卡住了

**解决**：
```bash
# 按 Ctrl+C 停止脚本
# 检查 .env 中是否设置了 DS2API_ADMIN_KEY
# 重新运行
node scripts/cdp-token-monitor.mjs
```

### ❌ Token 不被提取

**可能原因**：
1. Comet 不是以 CDP 模式启动
2. 页面还没完全加载
3. Token 的键名与脚本预期不同

**调试**：
```javascript
// 在浏览器 F12 Console 中运行
Object.keys(localStorage).forEach(k => {
  if (k.toLowerCase().includes('token')) {
    console.log(`${k}: ${localStorage.getItem(k).substring(0, 50)}...`);
  }
});
```

---

## 📚 技术细节

### Token 刷新机制

DS2API 会自动管理 token 生命周期：

```json
{
  "runtime": {
    "token_refresh_interval_hours": 6
  }
}
```

- 每 6 小时自动刷新一次 token
- Token 过期时自动切换到其他账户
- 无需手动干预

### CDP (Chrome DevTools Protocol)

脚本使用 CDP 来：
- 连接到已运行的浏览器
- 监听 localStorage 变化
- 读取页面 JavaScript 对象（但**不能访问密码**）

这是安全的，因为 CDP 只能访问公开的 API，密码存储在浏览器的安全区域。

---

## 📞 需要帮助？

### 快速检查

```bash
cd /Users/zengtao/ds2api
./scripts/start-token-capture.sh --check
```

### 查看日志

脚本会输出详细的日志，显示每个步骤的进度。

### 手动提交 token

如果自动提取失败，可以手动提交：

```bash
./scripts/submit-token.sh zengtao227@gmail.com "your-token-here"
```

---

## 🎉 预期结果

完成后，你将拥有：

✅ **13 个 DeepSeek 账户的完整配置**  
✅ **自动轮转负载均衡**  
✅ **密码安全地保存在浏览器中**  
✅ **Token 会自动刷新**  
✅ **可在 VS Code Cline 中使用**  
✅ **24/7 不间断的 AI 协助**  

---

**现在就开始吧！** 🚀

```bash
cd /Users/zengtao/ds2api
./scripts/start-token-capture.sh
```

然后在浏览器中登陆你的 13 个 DeepSeek 账户。仅此而已！
