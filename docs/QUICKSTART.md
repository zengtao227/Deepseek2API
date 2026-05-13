# Deepseek2API 快速上手指南

> 把 DeepSeek 网页版变成 OpenAI 兼容 API，在 VSCode Continue、Cursor 等 IDE 中免费使用 DeepSeek。

## 它能做什么？

```
你的 IDE (Continue/Cursor)
        ↓ OpenAI 格式请求
你的 VPS (Deepseek2API)
        ↓ 转换为 DeepSeek 网页版请求
chat.deepseek.com
```

你只需要一个**免费的 DeepSeek 网页版账号**，不需要购买 API 额度。

---

## 第一步：部署服务端

### 方式 A：Docker 部署（推荐）

在你的 VPS 或本地电脑上：

```bash
# 1. 下载项目
git clone https://github.com/zengtao227/Deepseek2API.git
cd Deepseek2API

# 2. 创建配置文件
cp config.example.json config.json

# 3. 启动服务
docker compose up -d
```

服务默认运行在 `http://localhost:5001`。

### 方式 B：直接运行二进制

从 [Releases](https://github.com/zengtao227/Deepseek2API/releases) 下载对应平台的二进制文件，然后：

```bash
# 创建配置
cp config.example.json config.json

# 启动
./Deepseek2API
```

---

## 第二步：获取 DeepSeek Token

### 前提条件
- 一个 DeepSeek 网页版账号（[注册地址](https://chat.deepseek.com)）
- 使用 **Chromium 内核浏览器**（Chrome、Brave、Edge、Comet 等）

### 获取方法

#### 方法 1：Application 标签页（推荐，纯鼠标操作）

1. 在浏览器中打开 [chat.deepseek.com](https://chat.deepseek.com) 并登录
2. 按 `F12` 打开开发者工具
3. 点击顶部的 **「Application」** 标签（中文版叫「应用程序」或「应用」）
4. 左侧栏展开 **「Local Storage」** → 点击 **`https://chat.deepseek.com`**
5. 在右侧找到 key 为 **`userToken`** 的行
6. 点击该行，在下方面板中复制 `value` 字段的值

> ⚠️ 不要复制整个 JSON，只复制 `value` 后面引号里的那串字符。

#### 方法 2：一键脚本（macOS 限定）

如果你使用 macOS + Comet 浏览器：

```bash
# 先在 Comet 中登录 DeepSeek，然后运行：
./scripts/refresh-token.sh
```

脚本会自动提取 Token、更新配置、同步到 VPS、验证可用性。

#### 方法 3：命令行提取（macOS）

```bash
# Chrome 浏览器
rm -rf /tmp/ds_ls && cp -r ~/Library/Application\ Support/Google/Chrome/Default/Local\ Storage/leveldb /tmp/ds_ls && strings /tmp/ds_ls/*.ldb 2>/dev/null | grep -oE '"value":"[A-Za-z0-9/+=]{50,70}"'

# Brave 浏览器
rm -rf /tmp/ds_ls && cp -r ~/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/Local\ Storage/leveldb /tmp/ds_ls && strings /tmp/ds_ls/*.ldb 2>/dev/null | grep -oE '"value":"[A-Za-z0-9/+=]{50,70}"'

# Edge 浏览器
rm -rf /tmp/ds_ls && cp -r ~/Library/Application\ Support/Microsoft\ Edge/Default/Local\ Storage/leveldb /tmp/ds_ls && strings /tmp/ds_ls/*.ldb 2>/dev/null | grep -oE '"value":"[A-Za-z0-9/+=]{50,70}"'
```

#### Windows / Linux 用户

浏览器 localStorage 路径：
- **Windows Chrome**: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb\`
- **Linux Chrome**: `~/.config/google-chrome/Default/Local Storage/leveldb/`

使用 `strings` 命令（Linux 自带，Windows 需安装）或直接用方法 1（Application 标签页）。

---

## 第三步：配置

编辑 `config.json`：

```json
{
  "accounts": [
    {
      "email": "my-account",
      "token": "粘贴你在第二步获取的 Token"
    }
  ],
  "keys": [
    "sk-your-api-key"
  ],
  "api_keys": [
    {
      "key": "sk-your-api-key",
      "name": "我的 Key"
    }
  ],
  "current_input_file": {
    "enabled": false
  },
  "thinking_injection": {
    "enabled": false
  },
  "auto_delete": {
    "mode": "single"
  },
  "runtime": {
    "token_refresh_interval_hours": 0
  }
}
```

> `email` 字段只是内部标识符，随便填，不需要是真实邮箱。
>
> `keys` 中的值是你自己设定的 API 密钥，用于 IDE 连接时的认证。

配置完成后重启服务：

```bash
docker compose restart
# 或
sudo systemctl restart deepseek2api
```

---

## 第四步：在 IDE 中使用

### VSCode Continue

编辑 `~/.continue/config.json`：

```json
{
  "models": [
    {
      "title": "DeepSeek Flash",
      "model": "deepseek-v4-flash",
      "apiBase": "http://你的服务器IP:5001/v1",
      "provider": "openai",
      "apiKey": "sk-your-api-key"
    }
  ]
}
```

如果你有域名和 HTTPS，把 `apiBase` 改为 `https://你的域名/v1`。

### 其他兼容客户端

任何支持 OpenAI API 的工具都可以使用，只需设置：
- **API Base**: `http://你的服务器IP:5001/v1`
- **API Key**: 你在 config.json 中设定的 key
- **Model**: `deepseek-v4-flash`

---

## Token 过期后怎么办？

Token 会在以下情况失效：
- 你在浏览器中**点击了"退出登录"**（关闭页面不影响）
- 长时间未使用（通常数天后过期）
- DeepSeek 服务端主动刷新

**刷新步骤：**
1. 在浏览器中重新登录 DeepSeek
2. 用上面的方法重新获取 Token
3. 更新 `config.json` 中的 token 值
4. 重启服务

macOS + Comet 用户可以一键完成：`./scripts/refresh-token.sh`

---

## 重要限制

| 限制 | 说明 |
|------|------|
| **仅支持 Flash 模型** | `deepseek-v4-pro` 被 DeepSeek 限速（429），无法通过网页 token 使用 |
| **不要登出浏览器** | 点击"退出登录"会立即作废 token |
| **不要多账号轮转** | 登出会作废之前的 token，导致所有 token 失效 |
| **关闭 current_input_file** | 必须设为 `false`，否则触发 upload 错误 |
| **关闭 thinking_injection** | 必须设为 `false`，网页 token 不支持 |

---

## 常见问题

**Q: 我在中国，需要 VPS 吗？**
A: 如果你在中国大陆可以直接访问 DeepSeek，你可以在本地电脑上运行 Deepseek2API（`localhost:5001`），不需要 VPS。IDE 的 `apiBase` 设为 `http://localhost:5001/v1` 即可。

**Q: 我需要翻墙吗？**
A: DeepSeek 是中国公司，中国大陆可以直接访问。不需要翻墙。

**Q: Token 一般能用多久？**
A: 通常几天到一周。如果你不主动登出，可以用更久。

**Q: 可以多人共用一个服务吗？**
A: 可以，但共用同一个 DeepSeek 账号的 token 会受到速率限制。建议每人用自己的 token。在 `config.json` 的 `accounts` 数组中添加多个账号即可。

**Q: 安全吗？**
A: Token 只存储在你自己的服务器上，不会上传到任何第三方。`config.json` 已加入 `.gitignore`，不会被 Git 追踪。
