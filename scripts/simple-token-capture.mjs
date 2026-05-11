#!/usr/bin/env node

/**
 * 极简 Token 捕获脚本
 * 直接从 Comet 已打开的页面中读取 token
 */

import http from 'http';
import https from 'https';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
const DS2API_URL = process.env.DS2API_URL || 'http://localhost:5001';
const ADMIN_KEY = process.env.DS2API_ADMIN_KEY || '744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501';

const ACCOUNTS = [
  'zengtao227@gmail.com',
  'zengtao227.de@gmail.com',
  'zengtao227.ch@gmail.com',
  'zengtao227.us@gmail.com',
  'zengtao227.sg@gmail.com',
  'zengqhxf@gmail.com',
  'liyue828@gmail.com',
  'liyue828.de@gmail.com',
  'mia.rhzeng@gmail.com',
  '9pgyxsfby5@privaterelay.appleid.com',
  'yqrt7tjg85@privaterelay.appleid.com',
  'xhg4h79pph@privaterelay.appleid.com',
  'n6vst2bmsc@privaterelay.appleid.com',
];

const extractedTokens = new Map();

// HTTP 请求辅助函数
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = url.startsWith('https') ? https : http;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        ...headers,
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 获取 CDP 目标
async function getCDPTargets() {
  try {
    return await httpGet(`http://${CDP_HOST}:${CDP_PORT}/json/list`);
  } catch (error) {
    throw new Error(`Cannot connect to CDP: ${error.message}`);
  }
}

// 从页面提取 token
async function extractTokenFromPage(targetId) {
  try {
    const targets = await getCDPTargets();
    const target = targets.find((t) => t.id === targetId);

    if (!target || !target.webSocketDebuggerUrl) {
      return null;
    }

    // 通过原生 fetch 发送命令
    const result = await new Promise(async (resolve) => {
      const WebSocket = (await import('ws')).default;
      const ws = new WebSocket(target.webSocketDebuggerUrl);

      let answered = false;

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (function() {
                  const keys = ['userToken', 'token', 'auth_token', 'accessToken', 'access_token', 'authToken', 'deepseek_token', 'ds_token'];
                  for (const k of keys) {
                    const v = localStorage.getItem(k);
                    if (v && v.length > 20) {
                      try {
                        const parsed = JSON.parse(v);
                        if (parsed.value && parsed.value.length > 20) return parsed.value;
                      } catch {}
                      return v;
                    }
                  }
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.toLowerCase().includes('token')) {
                      const val = localStorage.getItem(key);
                      if (val && val.length > 20) {
                        try {
                          const parsed = JSON.parse(val);
                          if (parsed.value && parsed.value.length > 20) return parsed.value;
                        } catch {}
                        return val;
                      }
                    }
                  }
                  return null;
                })()
              `,
              returnByValue: true,
            },
          })
        );
      });

      ws.on('message', (data) => {
        if (!answered) {
          try {
            const msg = JSON.parse(data);
            if (msg.result && msg.result.result && msg.result.result.value) {
              answered = true;
              ws.close();
              resolve(msg.result.result.value);
            }
          } catch {}
        }
      });

      ws.on('error', () => {
        if (!answered) {
          answered = true;
          ws.close();
          resolve(null);
        }
      });

      setTimeout(() => {
        if (!answered) {
          answered = true;
          ws.close();
          resolve(null);
        }
      }, 3000);
    });

    return result;
  } catch {
    return null;
  }
}

// 提交 token 到 DS2API
async function submitToken(email, token) {
  const body = JSON.stringify({ email, token });
  const headers = {
    'Authorization': `Bearer ${ADMIN_KEY}`,
  };

  try {
    const response = await httpPost(`${DS2API_URL}/admin/accounts/capture-token`, headers, body);
    return response.success ? response : null;
  } catch (error) {
    console.error(`❌ 提交失败: ${error.message}`);
    return null;
  }
}

// 主循环
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🔐 DeepSeek Token 自动监听提取             ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  try {
    console.log('🔍 连接到 Comet 浏览器...');
    const targets = await getCDPTargets();
    const pages = targets.filter((t) => t.type === 'page');
    console.log(`✅ 已连接（${pages.length} 个页面）`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  console.log('');
  console.log('📋 监听账户:');
  ACCOUNTS.forEach((email, i) => console.log(`   ${i + 1}. ${email}`));
  console.log('');
  console.log('⏳ 等待登陆... (每 2 秒检查一次)');
  console.log('');

  // 主监听循环
  while (true) {
    try {
      const targets = await getCDPTargets();
      const pages = targets.filter((t) => t.type === 'page');

      for (const page of pages) {
        if (!page.url.includes('deepseek.com')) continue;

        const token = await extractTokenFromPage(page.id);
        if (!token) continue;

        // 简单的账户匹配（从标题或 URL）
        let matchedEmail = null;
        const title = page.title?.toLowerCase() || '';
        const url = page.url?.toLowerCase() || '';

        for (const email of ACCOUNTS) {
          if (extractedTokens.has(email)) continue;
          const prefix = email.split('@')[0].toLowerCase();
          if (title.includes(prefix) || url.includes(prefix)) {
            matchedEmail = email;
            break;
          }
        }

        if (!matchedEmail) {
          // 如果找不到自动匹配，就分配给第一个未提交的账户
          for (const email of ACCOUNTS) {
            if (!extractedTokens.has(email)) {
              matchedEmail = email;
              break;
            }
          }

          if (!matchedEmail) {
            console.log(`🔑 检测到 Token 但所有账户都已提取`);
            continue;
          }

          console.log(`🔑 检测到 Token，自动分配给: ${matchedEmail}`);
        }

        if (extractedTokens.has(matchedEmail)) continue;

        // 提交 token
        console.log(`🚀 正在提交 ${matchedEmail}...`);
        const result = await submitToken(matchedEmail, token);
        if (result) {
          extractedTokens.set(matchedEmail, token);
          const remaining = ACCOUNTS.length - extractedTokens.size;
          console.log(`✅ ${matchedEmail} - 保存成功`);
          console.log(`📊 进度: ${extractedTokens.size}/${ACCOUNTS.length} (剩余 ${remaining} 个)`);
          console.log('');

          if (remaining === 0) {
            console.log('🎉 所有账户都已提取！');
            process.exit(0);
          }
        }
      }
    } catch (error) {
      // 忽略错误，继续监听
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
}

// 启动
main().catch((error) => {
  console.error(`❌ 错误: ${error.message}`);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('');
  console.log(`👋 监听已停止`);
  console.log(`📊 已提取 ${extractedTokens.size}/${ACCOUNTS.length} 个账户`);
  process.exit(0);
});
