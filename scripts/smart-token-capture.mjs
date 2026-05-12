#!/usr/bin/env node

/**
 * DeepSeek Token 智能捕获工具
 *
 * 工作流程：
 * 1. 启动浏览器到登录页面
 * 2. 监听网络请求（CDP）
 * 3. 用户手动登录每个账户
 * 4. 脚本自动从登录响应中提取 token
 * 5. 完成后自动更新 VPS config.json
 */

import { chromium } from 'playwright';
import https from 'https';

// 配置
const CONFIG = {
  DEEPSEEK_LOGIN_URL: 'https://chat.deepseek.com/sign_in',
  VPS_HOSTS: ['frank', 'tokyo', 'zurich'],
  VPS_PORT: 5001,
  VPS_ADMIN_KEY: process.env.DS2API_ADMIN_KEY || '744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501',
  ACCOUNTS: [
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
  ],
};

// 全局状态
let capturedTokens = new Map();
let totalAccounts = CONFIG.ACCOUNTS.length;

// ============================================
// 日志工具
// ============================================
const log = {
  header: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}\n`),
  success: (msg) => console.log(`✅ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  progress: (current, total) => {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    console.log(`\n📊 进度: [${bar}] ${percent}% (${current}/${total})\n`);
  },
};

// ============================================
// 浏览器控制
// ============================================
async function getBrowser() {
  const cdpUrl = process.env.BROWSER_CDP_URL;
  try {
    if (cdpUrl) {
      log.info(`正在连接到现有浏览器 (CDP): ${cdpUrl}...`);
      // 增加超时时间到 60秒，并添加重试
      const browser = await chromium.connectOverCDP(cdpUrl, { timeout: 60000 });
      log.success('成功连接到现有浏览器');
      return browser;
    } else {
      log.info('启动新浏览器窗口...');
      const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled'],
      });
      log.success('新浏览器启动成功');
      return browser;
    }
  } catch (err) {
    log.error(`浏览器连接/启动失败: ${err.message}`);
    if (err.message.includes('Timeout')) {
      log.warn('提示: 请尝试彻底退出 Comet (Cmd+Q) 然后重新运行脚本。');
    }
    throw err;
  }
}

// ============================================
// 网络监听 (CDP)
// ============================================
async function setupNetworkListener(page) {
  return new Promise((resolve) => {
    page.on('response', async (response) => {
      try {
        const url = response.url();

        // 监听登录请求
        if (url.includes('/api/v0/users/login')) {
          const status = response.status();
          if (status === 200 || status === 201) {
            try {
              const data = await response.json();
              const token = data?.data?.biz_data?.user?.token;
              const email = data?.data?.biz_data?.user?.email;

              if (token && email) {
                capturedTokens.set(email, token);
                log.success(`已捕获: ${email}`);
                
                // 实时保存到本地文件
                await saveTokenLocally(email, token);
                
                log.progress(capturedTokens.size, totalAccounts);

                // 检查是否完成所有账户
                if (capturedTokens.size === totalAccounts) {
                  resolve();
                }
              }
            } catch (parseErr) {
              // JSON 解析失败，跳过
            }
          }
        }
      } catch (err) {
        // 某些响应可能不是 JSON，忽略错误
      }
    });
  });
}

// ============================================
// 主流程
// ============================================
async function main() {
  let browser;

  try {
    log.header('🔐 DeepSeek Token 智能捕获工具 v1.0');

    log.info(`待捕获账户数: ${totalAccounts}`);
    log.info(`账户列表: ${CONFIG.ACCOUNTS.join(', ')}`);

    // 获取浏览器（优先连接已有的 Comet）
    browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();

    // 关闭弹窗、通知等
    await page.setDefaultNavigationTimeout(30000);
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
    } catch (err) {
      // 忽略 viewport 错误
    }

    log.info('打开登录页面: ' + CONFIG.DEEPSEEK_LOGIN_URL);
    await page.goto(CONFIG.DEEPSEEK_LOGIN_URL, { waitUntil: 'networkidle' });

    log.header('📱 请在打开的浏览器中登录账户');
    log.info('脚本会自动监听你的登录请求，无需手动操作');
    log.info('登录流程:');
    console.log('  1. 点击邮箱输入框');
    console.log('  2. 输入第一个账户邮箱');
    console.log('  3. 点击下一步');
    console.log('  4. 输入密码（浏览器会自动填充）');
    console.log('  5. 点击登录');
    console.log('  6. 脚本会自动提取 token，然后返回到登录页');
    console.log('  7. 重复以上步骤登录剩余 12 个账户');
    console.log('  8. 完成后脚本会自动关闭浏览器并更新 VPS\n');

    // 启动网络监听
    const captureComplete = setupNetworkListener(page);

    // 【新增】立即扫描已有的 Token（无需重新登录）
    log.info('正在扫描已打开的页面...');
    await snatchExistingToken(browser);

    // 等待所有账户完成
    await captureComplete;

    log.success(`✨ 已成功捕获全部 ${totalAccounts} 个账户的 token！`);

    // 关闭浏览器
    log.info('关闭浏览器...');
    await browser.close();

    // 更新 VPS
    log.header('🚀 正在更新 VPS 配置');
    await updateVPSConfig();

    log.header('✅ 完成！');
    log.success('所有 token 已成功保存到 VPS');
    log.info('ds2api 服务已重启，Continue IDE 现在可以使用新的独立 token 了');

  } catch (err) {
    log.error(`${err.message}`);
    console.error(err);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// ============================================
// VPS 更新
// ============================================
async function updateVPSConfig() {
  const tokens = Array.from(capturedTokens.entries()).map(([email, token]) => ({
    email,
    token,
  }));

  log.info(`准备更新 ${tokens.length} 个账户的 token...`);

  // 尝试连接到每个 VPS
  for (const vpsHost of CONFIG.VPS_HOSTS) {
    try {
      log.info(`尝试连接到 VPS: ${vpsHost}`);

      // 调用 VPS API 更新 token
      await updateTokensOnVPS(vpsHost, tokens);

      log.success(`${vpsHost} 已成功更新`);
      return; // 成功就返回

    } catch (err) {
      log.warn(`${vpsHost} 更新失败: ${err.message}`);
      // 继续尝试下一个 VPS
    }
  }

  throw new Error('所有 VPS 都无法连接');
}

async function updateTokensOnVPS(vpsHost, tokens) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(tokens);

    const options = {
      hostname: vpsHost,
      port: CONFIG.VPS_PORT,
      path: '/admin/accounts/batch-update-tokens',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${CONFIG.VPS_ADMIN_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const response = JSON.parse(responseData);
            log.info(`VPS 响应: ${response.message}`);
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// ============================================
// 扫描现有标签页中的 Token
// ============================================
async function snatchExistingToken(browser) {
  for (const context of browser.contexts()) {
    for (const p of context.pages()) {
      try {
        const url = p.url();
        if (url.includes('deepseek.com')) {
          log.info(`发现 DeepSeek 页面: ${url}，尝试提取 Token...`);
          const result = await p.evaluate(() => {
            const t = localStorage.getItem('token');
            // 获取邮箱（如果能拿到）
            let e = '';
            try {
              const userStr = localStorage.getItem('user');
              if (userStr) e = JSON.parse(userStr).email;
            } catch {}
            return { token: t, email: e };
          });

          if (result.token && result.token.length > 20) {
            let email = result.email;
            if (!email) {
              // 如果拿不到邮箱，提示用户手动指定或通过脚本逻辑匹配
              log.warn('拿到 Token 但未识别到邮箱，请在该页面保持登录状态。');
              continue;
            }
            if (!capturedTokens.has(email)) {
              capturedTokens.set(email, result.token);
              log.success(`成功从现有页面“偷取”到 Token: ${email}`);
              await saveTokenLocally(email, result.token);
            }
          }
        }
      } catch (err) {
        // 忽略单个页面的错误
      }
    }
  }
}

// ============================================
// 本地保存逻辑
// ============================================
async function saveTokenLocally(email, token) {
  const fs = await import('fs/promises');
  const path = await import('path');
  const configPath = path.join(process.cwd(), 'config.json');

  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    
    let found = false;
    if (config.accounts) {
      for (let acc of config.accounts) {
        if (acc.email === email) {
          acc.token = token;
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      if (!config.accounts) config.accounts = [];
      config.accounts.push({ email, token });
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    log.success(`本地 config.json 已更新: ${email}`);
  } catch (err) {
    log.warn(`本地保存失败: ${err.message}`);
  }
}

// 启动
main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
