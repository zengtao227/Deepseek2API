#!/usr/bin/env node

/**
 * 🔐 DeepSeek Token 自动监听提取脚本（CDP 方式）
 *
 * 原理：
 * - 连接到已运行的 Comet 浏览器（通过 Chrome DevTools Protocol）
 * - 监听 localStorage 变化
 * - 当检测到 token 时自动提取并提交到 DS2API
 * - 密码始终保存在浏览器中，脚本看不到
 *
 * 用法：
 *   # 第 1 步：启动 Comet 浏览器（带 CDP 支持）
 *   /Applications/Comet.app/Contents/MacOS/Comet --remote-debugging-port=9222
 *
 *   # 第 2 步：在另一个终端运行此脚本
 *   node scripts/cdp-token-monitor.mjs
 *
 *   # 第 3 步：在浏览器中逐个登陆账户（只需登陆，其他全自动）
 */

import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// 配置
const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
const DS2API_URL = process.env.DS2API_URL || 'http://localhost:5001';
const ADMIN_KEY = process.env.DS2API_ADMIN_KEY ||
  (await getAdminKeyFromEnv()) ||
  '744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501';

// 所有 13 个账户
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

// 提取的 token 记录
const extractedTokens = new Map();

// ============================================================
// 工具函数
// ============================================================

async function getAdminKeyFromEnv() {
  try {
    const envPath = path.join(projectRoot, '.env');
    const content = await fs.readFile(envPath, 'utf-8');
    const match = content.match(/DS2API_ADMIN_KEY=(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

async function callCDP(method, params = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ method, params });
    const options = {
      hostname: CDP_HOST,
      port: CDP_PORT,
      path: '/json/protocol',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getCDPTargets() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${CDP_HOST}:${CDP_PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Failed to parse CDP targets'));
        }
      });
    });

    req.on('error', () => {
      reject(new Error(`Cannot connect to CDP at ${CDP_HOST}:${CDP_PORT}`));
    });
  });
}

async function submitToken(email, token) {
  try {
    const response = await fetch(`${DS2API_URL}/admin/accounts/capture-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_KEY}`,
      },
      body: JSON.stringify({ email, token }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to submit token: ${error.message}`);
  }
}

async function checkLocalStorage(wsUrl) {
  try {
    // 通过 WebSocket 连接到 DevTools
    const ws = await new Promise((resolve, reject) => {
      const WebSocket = (await import('ws')).default;
      const socket = new WebSocket(wsUrl);

      socket.on('open', () => resolve(socket));
      socket.on('error', reject);
      socket.on('close', reject);

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    return new Promise((resolve, reject) => {
      let messageId = 1;

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);

          // 查找 token
          if (msg.result && msg.result.result && msg.result.result.value) {
            const value = msg.result.result.value;

            // 检查是否是 token（长字符串，通常是 base64 或类似）
            if (typeof value === 'string' && value.length > 20) {
              ws.close();
              resolve(value);
              return;
            }
          }

          // 尝试下一个键
          if (msg.id && msg.id < 100) {
            const nextKeyIndex = msg.id;
            // 继续查询下一个 localStorage 键
          }
        } catch {}
      });

      ws.on('error', reject);
      ws.on('close', () => {
        reject(new Error('WebSocket closed'));
      });

      // 发送查询 localStorage 的命令
      const cmd = {
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (function() {
              const keys = ['userToken', 'token', 'auth_token', 'accessToken', 'deepseek_token', 'ds_token'];
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
                if (key.toLowerCase().includes('token')) {
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
      };

      ws.send(JSON.stringify(cmd));

      setTimeout(() => {
        ws.close();
        resolve(null);
      }, 3000);
    });
  } catch (error) {
    return null;
  }
}

// ============================================================
// 主监听循环
// ============================================================

async function monitorAndExtract() {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🔐 DeepSeek Token 自动监听提取             ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║  等待你在浏览器中登陆账户...                  ║');
  console.log('║  Token 将被自动提取并保存                      ║');
  console.log('║  密码始终保存在浏览器中，脚本看不到           ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  // 验证 CDP 连接
  try {
    log('🔍', '连接到 Comet 浏览器（CDP）...');
    const targets = await getCDPTargets();
    const pages = targets.filter((t) => t.type === 'page');

    if (pages.length === 0) {
      log('❌', 'No browser pages found. Please open DeepSeek in Comet.');
      process.exit(1);
    }

    log('✅', `已连接到 Comet 浏览器（${pages.length} 个页面）`);
  } catch (error) {
    log('❌', `无法连接到 CDP: ${error.message}`);
    log('💡', '请先启动 Comet 浏览器：');
    log('  ', '/Applications/Comet.app/Contents/MacOS/Comet --remote-debugging-port=9222');
    process.exit(1);
  }

  // 验证 DS2API 连接
  try {
    log('🔍', `连接到 DS2API (${DS2API_URL})...`);
    const response = await fetch(`${DS2API_URL}/admin/accounts/capture-token`, {
      method: 'OPTIONS',
      headers: { 'Authorization': `Bearer ${ADMIN_KEY}` },
    }).catch(() => null);

    if (!response) {
      throw new Error('No response from DS2API');
    }

    log('✅', 'DS2API 已连接');
  } catch (error) {
    log('❌', `无法连接到 DS2API: ${error.message}`);
    log('💡', '请确保 DS2API 正在运行：cd /Users/zengtao/ds2api && ./ds2api');
    process.exit(1);
  }

  console.log('');
  log('📋', `监听以下 ${ACCOUNTS.length} 个账户:`);
  ACCOUNTS.forEach((email, i) => {
    log('  ', `${i + 1}. ${email}`);
  });
  console.log('');

  log('⏳', '等待登陆... 按 Ctrl+C 退出');
  console.log('');

  // 主监听循环
  let lastCheckTime = 0;
  const checkInterval = 2000; // 每 2 秒检查一次

  while (true) {
    const now = Date.now();
    if (now - lastCheckTime < checkInterval) {
      await new Promise((r) => setTimeout(r, 100));
      continue;
    }
    lastCheckTime = now;

    try {
      const targets = await getCDPTargets();
      const pages = targets.filter((t) => t.type === 'page');

      for (const page of pages) {
        // 检查页面是否访问 DeepSeek
        if (!page.url.includes('deepseek.com') && !page.url.includes('chat.deepseek')) {
          continue;
        }

        try {
          // 通过 WebSocket 连接到页面
          const ws = await import('ws').then((m) => m.default);
          const socket = new ws(page.webSocketDebuggerUrl);

          socket.on('open', () => {
            // 查询 localStorage 中的 token
            socket.send(
              JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: {
                  expression: `
                    (function() {
                      const keys = ['token', 'auth_token', 'accessToken', 'access_token', 'deepseek_token', 'ds_token'];
                      for (const k of keys) {
                        const v = localStorage.getItem(k);
                        if (v && v.length > 20) return {token: v, key: k};
                      }
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key.toLowerCase().includes('token')) {
                          const val = localStorage.getItem(key);
                          if (val && val.length > 20) return {token: val, key: key};
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

          socket.on('message', async (data) => {
            try {
              const msg = JSON.parse(data);

              if (
                msg.result &&
                msg.result.result &&
                msg.result.result.value &&
                msg.result.result.value.token
              ) {
                const { token } = msg.result.result.value;
                const title = page.title || 'Unknown';

                // 尝试匹配账户（从页面标题或 URL 中提取）
                let matchedEmail = null;
                for (const email of ACCOUNTS) {
                  if (extractedTokens.has(email)) {
                    continue; // 跳过已提取的
                  }
                  // 简单启发式：检查邮箱的前缀是否在标题中
                  const prefix = email.split('@')[0];
                  if (title.toLowerCase().includes(prefix)) {
                    matchedEmail = email;
                    break;
                  }
                }

                // 如果无法匹配，提示用户
                if (!matchedEmail) {
                  log('🔑', `检测到 Token (来自: ${title})`);
                  log('  ', '请告诉我这是哪个账户（或让我自动匹配）');
                  // 在实际应用中，这里可以弹出 UI 让用户选择
                  socket.close();
                  return;
                }

                // 检查是否已提取过这个账户的 token
                if (extractedTokens.has(matchedEmail)) {
                  log('⏭️ ', `${matchedEmail} 已提取过，跳过`);
                  socket.close();
                  return;
                }

                // 提交 token 到 DS2API
                log('🚀', `正在提交 ${matchedEmail} 的 token...`);
                try {
                  await submitToken(matchedEmail, token);
                  extractedTokens.set(matchedEmail, token);
                  log('✅', `${matchedEmail} - 保存成功`);

                  // 检查进度
                  const remaining = ACCOUNTS.length - extractedTokens.size;
                  if (remaining === 0) {
                    log('🎉', '所有账户都已提取！');
                  } else {
                    log('📊', `进度: ${extractedTokens.size}/${ACCOUNTS.length} (剩余 ${remaining} 个)`);
                  }
                } catch (error) {
                  log('❌', `提交失败: ${error.message}`);
                }
              }
            } catch (e) {
              // 忽略解析错误
            }

            socket.close();
          });

          socket.on('error', () => {
            // 忽略 WebSocket 错误
          });

          await new Promise((r) => setTimeout(r, 100));
        } catch {
          // 忽略连接错误
        }
      }
    } catch (error) {
      // 忽略主循环错误，继续监听
    }
  }
}

// ============================================================
// 启动
// ============================================================

monitorAndExtract().catch((error) => {
  log('❌', error.message);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('');
  log('👋', '监听已停止');
  log('📊', `已提取 ${extractedTokens.size}/${ACCOUNTS.length} 个账户的 token`);
  if (extractedTokens.size > 0) {
    log('✅', 'Token 已保存到 config.json');
  }
  process.exit(0);
});
