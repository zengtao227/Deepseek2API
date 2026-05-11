# 法兰克福VPS部署完整规划

## 1. 架构设计

### 1.1 本地 vs VPS部署对比

#### 当前本地方案
```
本地机器 → DS2API (localhost:5001) → DeepSeek API
延迟：<100ms本地 + ~14s网络
成本：CPU/内存开销，机器需要一直运行
```

#### VPS部署方案
```
多个客户端 → VPS中转网关 → DeepSeek API
延迟：网络 + <100ms VPS + ~14s网络
成本：VPS年费
优势：24/7运行，多客户端共享
```

### 1.2 VPS架构图

```
┌─────────────────────────────────────┐
│  法兰克福VPS (24/7 运行)            │
│  ┌──────────────────────────────┐  │
│  │  nginx (反向代理)             │  │
│  │  ├─ HTTPS终点                 │  │
│  │  ├─ 负载均衡                  │  │
│  │  └─ 认证检查                  │  │
│  └─────────┬──────────────────┘  │
│           │                      │
│  ┌────────▼──────────────────┐  │
│  │  DS2API服务 (5001)        │  │
│  │  ├─ 13个账户管理          │  │
│  │  ├─ Token刷新             │  │
│  │  ├─ 轮转算法              │  │
│  │  └─ 日志记录              │  │
│  └────────┬──────────────────┘  │
│           │                      │
│  ┌────────▼──────────────────┐  │
│  │  AIDER (CLI工具)          │  │
│  └──────────────────────────┘  │
│           │                      │
│  ┌────────▼──────────────────┐  │
│  │  Telegram Bot (webhook)   │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
        ↑ HTTPS (安全加密)
        │
    ┌───┴──────┬──────────┬──────────┐
    │          │          │          │
 客户端1   客户端2    AIDER    Telegram
 (Continue) (Cline)   集成      Bot集成
```

## 2. 部署步骤

### 2.1 准备阶段

#### 需要的工具和配置
```bash
# VPS上安装
- Go 1.21+ (编译DS2API)
- Node.js 18+ (运行脚本)
- Nginx (反向代理)
- Supervisor (进程管理)
- 或Docker (容器化)
```

#### 网络配置
```
端口5001: DS2API内部服务
端口443: HTTPS入口 (Nginx)
端口80: HTTP重定向 (Nginx)
```

### 2.2 关键部署配置

#### Nginx配置示例
```nginx
upstream ds2api {
    server 127.0.0.1:5001;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL证书（Let's Encrypt免费）
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    # API路由
    location /v1/ {
        # 认证检查
        if ($http_authorization !~ ^Bearer\ ) {
            return 401 '{"error":"Unauthorized"}';
        }
        
        proxy_pass http://ds2api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 管理接口（仅允许特定IP）
    location /admin/ {
        allow 203.0.113.0;  # 你的家庭IP
        deny all;
        
        proxy_pass http://ds2api;
    }
}
```

#### Supervisor配置示例
```ini
[program:ds2api]
command=/path/to/ds2api
directory=/path/to/ds2api
user=ds2api
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/ds2api.log
environment=DS2API_PORT=5001,DS2API_CONFIG_PATH=/etc/ds2api/config.json
```

## 3. 性能分析和延迟影响

### 3.1 延迟分解

#### 本地方案
```
用户请求 → 本地API (<100ms) → DeepSeek API (~14s) = 总计 ~14.1s
```

#### VPS方案
```
用户请求 
  → 本地网络 (2-5ms)
  → 互联网 (50-100ms)
  → VPS网络 (2-5ms)
  → DS2API (100ms)
  → VPS出站 (2-5ms)
  → 互联网 (50-100ms)
  → DeepSeek API (~14s)
  ──────────────
  总计: ~14.2-14.3s

增加延迟: 0.1-0.2秒 (不显著)
```

### 3.2 吞吐量对比

| 指标 | 本地 | VPS |
|------|------|-----|
| 单机并发 | 2-3个工具 | 受限于网络带宽 |
| 13账户轮转 | 无压力 | 无压力 |
| 网络往返 | 1次 | 2次（出入） |
| 成本 | 电费 | 月费 |
| 可用性 | 99%（依赖本地网络） | 99.5%（VPS托管） |

**结论：延迟增加不显著（<0.2s），完全可接受**

## 4. Fallback机制设计

### 4.1 分层降级方案

```javascript
// API调用优先级
const providers = [
  {
    name: "本地免费API (13账户)",
    endpoint: "https://api.vps.domain/v1",
    apiKey: "sk-continue-...",
    priority: 1,  // 最优先
    timeout: 20s,
    fallback: true
  },
  {
    name: "本地backup (备用账户)",
    endpoint: "https://api.vps2.domain/v1",
    apiKey: "sk-backup-...",
    priority: 2,
    timeout: 20s,
    fallback: true
  },
  {
    name: "官方付费API",
    endpoint: "https://api.deepseek.com/v1",
    apiKey: "user-paid-api-key",
    priority: 3,  // 最后才用
    timeout: 30s,
    fallback: true
  }
];

async function callAPI(messages) {
  for (const provider of providers) {
    try {
      const response = await callWithTimeout(
        provider.endpoint,
        messages,
        provider.apiKey,
        provider.timeout
      );
      return response;
    } catch (error) {
      if (!provider.fallback) {
        throw error;
      }
      console.warn(`Provider ${provider.name} failed, trying next...`);
      continue;
    }
  }
  throw new Error("All providers exhausted");
}
```

### 4.2 健康检查机制

```bash
# 每5分钟检查一次
*/5 * * * * /usr/local/bin/health-check.sh

# health-check.sh
#!/bin/bash
for provider in api1.domain api2.domain; do
  response=$(curl -s -H "Authorization: Bearer $KEY" \
    https://$provider/v1/models \
    --max-time 5)
  
  if [ $? -ne 0 ]; then
    # 发送告警，标记为不健康
    notify_slack "Provider $provider is DOWN"
    mark_unhealthy $provider
  fi
done
```

## 5. 具体应用场景

### 5.1 AIDER集成

```bash
# AIDER配置 (~/.aider.conf.yml)
model: deepseek-v4-pro
api-key: sk-continue-local-...
base-url: https://api.vps.domain/v1

# 启动时
aider --model deepseek-v4-pro --api-key xxx --base-url https://api.vps.domain/v1
```

### 5.2 Telegram Bot集成

```python
# Telegram Bot架构
┌─────────────┐
│ Telegram    │
│ User        │
└─────┬───────┘
      │
┌─────▼──────────────────────────┐
│ Telegram Bot (Python/Node)      │
│ ├─ 消息接收                    │
│ ├─ 用户认证                    │
│ ├─ 消息队列                    │
│ └─ 速率限制                    │
└─────┬──────────────────────────┘
      │
┌─────▼──────────────────────────┐
│ VPS DS2API                      │
│ (带Fallback)                    │
└─────┬──────────────────────────┘
      │
┌─────▼──────────────────────────┐
│ DeepSeek API / 付费API         │
└─────────────────────────────────┘
```

**关键特性：**
- 支持长对话上下文
- 用户速率限制（防止滥用）
- 支持/switch命令切换模型
- 支持/fallback命令配置降级

## 6. VPS成本分析

### 6.1 年度成本对比

| 项目 | 本地 | VPS | 差异 |
|------|------|-----|------|
| 硬件摊销 | 300元 | 0 | -300元 |
| 电费 (24/7) | 200元 | 0 | -200元 |
| VPS费用 | 0 | 300元 | +300元 |
| 网络 (本地) | 50元 | 0 | -50元 |
| **总计** | **550元** | **300元** | **省250元** |

### 6.2 ROI分析
- VPS通常1-2个月回本
- 之后完全赚取无限AI支持

## 7. 实现顺序

```
第一阶段（本周）：
□ VPS购买和初始化
□ DS2API编译和部署
□ Nginx反向代理配置
□ HTTPS证书申请

第二阶段（下周）：
□ Fallback机制实现
□ 健康检查脚本
□ 监控告警系统

第三阶段（两周后）：
□ AIDER集成测试
□ Telegram Bot开发
□ 本地到VPS迁移

第四阶段（持续）：
□ 性能优化
□ 备份和恢复
□ 文档更新
```

## 8. 风险和缓解

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|----------|
| VPS宕机 | 低 | 高 | Fallback到付费API |
| 账户被ban | 中 | 中 | 备用账户池 |
| 网络延迟 | 低 | 低 | 缓存和预处理 |
| DDoS攻击 | 低 | 中 | Nginx限流 + WAF |

## 结论

**VPS部署是完全可行的，延迟影响不显著（<0.2s增加），成本节省250元/年。**

下一步：确认VPS规格和部署时间表。
