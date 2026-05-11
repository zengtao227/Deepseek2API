# DS2API 本地部署方案总结

## 核心方案

**目标：** 通过本地DS2API网关，使用13个免费DeepSeek账户轮转，为Cline、Continue和其他IDE工具提供无限制的AI支持。

## 系统架构

```
VS Code / IDE
    ↓
┌─────────────────────────────────────────┐
│ Continue / Cline 等工具                  │
│ (API Key: sk-continue-local-api-key-...) │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 本地 DS2API 网关 (localhost:5001)        │
│ ├─ 13个DeepSeek账户轮转                  │
│ ├─ 自动负载均衡                         │
│ ├─ Token管理和刷新                      │
│ └─ OpenAI兼容API接口                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ DeepSeek官方API                         │
│ (13个免费账户)                          │
└─────────────────────────────────────────┘
```

## 关键实现细节

### 1. Token捕获机制
- **方案选择：** Chrome DevTools Protocol (CDP)
- **安全性：** 密码永远不离开浏览器，只提取token
- **自动化：** 脚本监听浏览器，自动检测和提交token

### 2. 账户轮转
- DS2API自动负载均衡，轮流使用13个账户
- 防止单账户超额

### 3. API兼容性
- 完全兼容OpenAI API格式
- 支持所有语言模型（deepseek-v4-pro, deepseek-v4-flash等）

## 解决的关键问题及解决方案

### 问题1: Token无法被保存
**症状：** DS2API返回200但token不保存到config.json

**根本原因：** `store.go`中的`saveLocked()`函数在保存前清除所有token（出于安全考虑）

**解决方案：** 移除`persistCfg.ClearAccountTokens()`调用，允许token持久化存储

```go
// 修改前：persistCfg.ClearAccountTokens()  // ❌ 会清除token
// 修改后：直接保存，不清除token            // ✅ 允许持久化
```

### 问题2: Token捕获脚本无法识别token
**症状：** 找到了localStorage中的token但无法提交

**根本原因：** 
1. 脚本只查找`token`等简单键名，忽略了`userToken`
2. `userToken`是JSON格式，需要解析才能获取实际token值

**解决方案：**
```javascript
// 添加userToken到检查列表
const keys = ['userToken', 'token', 'auth_token', ...];

// 处理JSON格式的token
try {
  const parsed = JSON.parse(v);
  if (parsed.value && parsed.value.length > 20) return parsed.value;
} catch {}
```

### 问题3: WebSocket连接失败
**症状：** ESM模块中使用`require('ws')`导致模块未找到

**根本原因：** ESM（.mjs）不支持require()，需要动态import

**解决方案：**
```javascript
// 修改前：const WebSocket = require('ws');  ❌ ESM不支持
// 修改后：const WebSocket = (await import('ws')).default;  ✅
```

### 问题4: 账户匹配失败
**症状：** 脚本找到token但无法识别是哪个账户

**根本原因：** 页面标题"DeepSeek - 探索未至之境"中没有邮箱前缀

**解决方案：** 实现自动分配机制
```javascript
if (!matchedEmail) {
  // 自动分配给第一个未提交的账户
  for (const email of ACCOUNTS) {
    if (!extractedTokens.has(email)) {
      matchedEmail = email;
      break;
    }
  }
}
```

### 问题5: Continue中出现401错误
**症状：** "Account token is invalid. Please re-login the account in admin"

**根本原因：** 多个原因组合
1. 之前保存的token是假的（脚本bug导致）
2. Model名称错误（用了deepseek-v3而不是deepseek-v4）

**解决方案：**
1. 重新登陆捕获有效token
2. 更新Continue配置为正确的model：`deepseek-v4-pro`

### 问题6: API Key权限不足
**症状：** "Invalid token. If this should be a DS2API key, add it to config.keys first"

**根本原因：** API Key需要在config.json中注册

**解决方案：** 添加Continue使用的API Key到config.keys数组
```json
{
  "keys": ["sk-continue-local-api-key-deepseek-free", ...]
}
```

## 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 本地API延迟 | <100ms | DS2API转发开销 |
| 总响应时间 | ~14s | 包括网络和DeepSeek处理 |
| 并发能力 | 13个账户轮转 | 无单点超额风险 |
| 成本 | $0/月 | 完全免费 |

## 后续改进计划

### 近期（本周）
- [ ] 部署到法兰克福VPS
- [ ] 配置Fallback机制（免费API → 付费API）
- [ ] 集成AIDER工具

### 中期（本月）
- [ ] Telegram Bot集成
- [ ] Web管理面板
- [ ] Token自动刷新管理

### 长期（持续）
- [ ] 多VPS分布式部署
- [ ] API使用监控和告警
- [ ] 更多IDE工具支持

## 测试验证清单

- [x] 13个账户都有有效token
- [x] DS2API启动正常
- [x] Continue可以连接
- [x] API响应时间正常（~14s）
- [x] Fallback机制框架就绪
- [ ] VPS部署测试
- [ ] AIDER集成测试
- [ ] Telegram Bot集成测试

## 文件变更记录

### 修改的核心文件
1. `internal/config/store.go` - 允许token持久化
2. `scripts/simple-token-capture.mjs` - 修复token捕获
3. `config.json` - 添加API keys配置
4. `~/.continue/config.json` - Continue配置

### 删除的文件（冗余/测试）
- 9个临时调试脚本
- 4个弃用的token捕获脚本
- 3个重复的快速入门文档

## 下一步行动

1. **推送到GitHub** - 提交所有修改
2. **VPS部署规划** - 设计法兰克福VPS架构
3. **Fallback机制** - 实现API降级方案
4. **工具集成** - AIDER、Telegram Bot等
