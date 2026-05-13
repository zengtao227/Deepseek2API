# Deepseek2API 个人部署运维手册

## 架构概览

```
Continue IDE → https://Deepseek2API.mooo.com (法兰克福 VPS)
                          ↓
                   config.json (token)
                          ↓
                  chat.deepseek.com (官方 API)
```

## 当前配置

| 项目 | 值 |
|------|-----|
| VPS 地址 | `https://Deepseek2API.mooo.com` |
| 可用模型 | `deepseek-v4-flash` |
| API Key | `sk-continue-local-api-key-deepseek-free` |
| 认证方式 | 网页版 Token（无密码） |

> [!WARNING]
> **`deepseek-v4-pro` 模型不可用。** DeepSeek 对免费网页 token 的深度思考模型有严格速率限制，持续返回 429。不要在 Continue 或其他客户端配置 pro 模型。

## Token 管理

### 获取 Token（自动提取）

在本地 Mac 终端运行：

```bash
# 从 Brave 浏览器提取
rm -rf /tmp/ds_ls_copy && \
cp -r ~/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/Local\ Storage/leveldb /tmp/ds_ls_copy && \
strings /tmp/ds_ls_copy/*.ldb /tmp/ds_ls_copy/*.log 2>/dev/null | \
grep -oE '"value":"[A-Za-z0-9/+=]{50,70}"'
```

```bash
# 从 Comet 浏览器提取
rm -rf /tmp/ds_ls_copy && \
cp -r ~/Library/Application\ Support/Comet/Default/Local\ Storage/leveldb /tmp/ds_ls_copy && \
strings /tmp/ds_ls_copy/*.ldb /tmp/ds_ls_copy/*.log 2>/dev/null | \
grep -oE '"value":"[A-Za-z0-9/+=]{50,70}"'
```

输出格式为 `"value":"xxxxxx"`，其中 `xxxxxx` 就是你的 token。

### 一键刷新 Token（推荐）

在 Comet 浏览器里登录 DeepSeek 后，运行：

```bash
./scripts/refresh-token.sh
```

脚本会自动：提取 Token → 更新 config.json → 同步 VPS → 重启服务 → 验证可用性。

### 手动更新 Token

1. 编辑 `config.json`，替换 `token` 字段
2. 同步到 VPS：

```bash
scp config.json frank:/opt/deepseek2api/config.json
ssh frank "sudo systemctl restart deepseek2api"
```

### Token 生命周期规则

| 操作 | Token 是否失效 |
|------|----------------|
| 关闭浏览器标签页 | ❌ 不失效 |
| 关闭整个浏览器 | ❌ 不失效 |
| 电脑重启 | ❌ 不失效 |
| 长时间不用（数天） | ⚠️ 可能过期 |
| **点击"退出登录"** | **✅ 立即失效** |
| 在另一设备登录同一账号 | ⚠️ 可能导致冲突 |

> [!CAUTION]
> **绝对不要在浏览器里点"退出登录"！** 这会立即在服务端作废 token，导致 VPS 上的服务返回 401。

## 禁止方案清单

以下方案已验证**不可行**，请勿再尝试：

| 方案 | 失败原因 |
|------|----------|
| F12 Console 粘贴 | Chrome 安全限制，需先输入 `allow pasting` |
| CDP 远程调试抓取 | 浏览器进程锁，无法连接 |
| Playwright 影子 Profile | Google 登录检测到不安全浏览器 |
| AppleScript 注入 | 需手动开启权限，默认关闭 |
| 多账号轮转 | 登出会作废 token，互相冲突 |
| LevelDB 直接读取 (Go) | 需要额外依赖，且 token 格式不确定 |

**唯一可靠的方案：** `strings` 命令扫描浏览器 LevelDB 文件（见上方"获取 Token"部分）。

## Continue IDE 配置

`~/.continue/config.json`：

```json
{
  "models": [
    {
      "title": "DeepSeek-V4-Flash (VPS)",
      "model": "deepseek-v4-flash",
      "apiBase": "https://Deepseek2API.mooo.com/v1",
      "provider": "openai",
      "apiKey": "sk-continue-local-api-key-deepseek-free"
    }
  ],
  "tabAutocompleteModel": {
    "title": "DeepSeek-V4-Flash (VPS)",
    "model": "deepseek-v4-flash",
    "apiBase": "https://Deepseek2API.mooo.com/v1",
    "provider": "openai",
    "apiKey": "sk-continue-local-api-key-deepseek-free"
  },
  "editModel": {
    "title": "DeepSeek-V4-Flash (VPS)",
    "model": "deepseek-v4-flash",
    "apiBase": "https://Deepseek2API.mooo.com/v1",
    "provider": "openai",
    "apiKey": "sk-continue-local-api-key-deepseek-free"
  }
}
```

## 快速诊断

```bash
# 测试 VPS 是否在线
curl -s https://Deepseek2API.mooo.com/

# 测试 Token 是否有效
curl -s https://Deepseek2API.mooo.com/v1/chat/completions \
  -H "Authorization: Bearer sk-continue-local-api-key-deepseek-free" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"say OK"}],"max_tokens":5}' \
  | python3 -m json.tool

# 查看 VPS 日志
ssh frank "sudo journalctl -u deepseek2api -n 30 --no-pager"
```
