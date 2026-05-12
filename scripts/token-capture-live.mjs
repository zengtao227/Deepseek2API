#!/usr/bin/env node

/**
 * DeepSeek Token 实时捕获工具（改进版）
 *
 * 改进点：
 * 1. 保留网络监听方式（从登录响应中提取 token）
 * 2. 每捕获一个 token 立即单独上传到后端
 * 3. 避免批量上传导致的 token 覆盖问题
 */

import { chromium } from 'playwright';
import https from 'https';
import http from 'http';

// 配置
const CONFIG = {
  DEEPSEEK_LOGIN_URL: 'https://chat.deepseek.com/sign_in',
  BACKEND_URL: process.env.Deepseek2API_URL || 'http://localhost:5001',
  ADMIN_KEY: process.env.Deepseek2API_ADMIN_KEY || '744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501',
  ACCOUNTS: [
    'zengtao227@gmail.com',
    'zengtao227.de@gmail.com',
    'zengtao227.fr@gmail.com',
    'zengtao227.it@gmail.com',
    'zengtao227.es@gmail.com',
    'zengtao227.nl@gmail.com',
    'zengtao227.pl@gmail.com',
    'zengtao227.se@gmail.com',
    'zengtao227.no@gmail.com',
    'zengtao227.dk@gmail.com',
    'zengtao227.fi@gmail.com',
    'zengtao227.pt@gmail.com',
    'zengtao227.gr@gmail.com',
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
async function launchBrowser() {
  try {
    log.info('启动浏览器...');
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
      ],
    });
    log.success('浏览器启动成功');
    return browser;
  } catch (err) {
    log.error(`浏览器启动失败: ${err.message}`);
    throw err;
  }
}

// ============================================
// 立即上传单个 token 到后端
// ============================================
async function uploadTokenImmediately(email, token) {
  const data = JSON.stringify({ email, token });
  const url = new URL('/admin/accounts/capture-token', CONFIG.BACKEND_URL);
  
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${CONFIG.ADMIN_KEY}`,
      },
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(responseData);
            log.success(`${email} - Token 已保存到后端`);
            resolve(response);
          } catch (err) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
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
                // 检查是否已经捕获过
                if (capturedTokens.has(email)) {
                  log.warn(`${email} 已捕获过，跳过`);
                  return;
                }

                capturedTokens.set(email, token);
                log.success(`已捕获: ${email}`);
                log.progress(capturedTokens.size, totalAccounts);

                // 立即上传到后端（关键改进！）
                try {
                  await uploadTokenImmediately(email, token);
                } catch (uploadErr) {
                  log.error(`上传失败: ${uploadErr.message}`);
                  log.warn('Token 已保存在本地，稍后可手动上传');
                }

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
    log.header('🔐 DeepSeek Token 实时捕获工具 v3.0');

    log.info(`待捕获账户数: ${totalAccounts}`);
    log.info(`后端地址: ${CONFIG.BACKEND_URL}`);

    // 启动浏览器
    browser = await launchBrowser();
    const page = await browser.newPage();

    // 设置视口
    await page.setDefaultNavigationTimeout(30000);
    await page.setViewportSize({ width: 1280, height: 800 });

    log.info('打开登录页面: ' + CONFIG.DEEPSEEK_LOGIN_URL);
    await page.goto(CONFIG.DEEPSEEK_LOGIN_URL, { waitUntil: 'networkidle' });

    log.header('📱 请在打开的浏览器中登录账户');
    log.info('脚本会自动监听你的登录请求');
    log.info('每次登录成功后，token 会立即保存到后端');
    log.info('');
    log.info('登录流程:');
    console.log('  1. 输入邮箱');
    console.log('  2. 输入密码');
    console.log('  3. 点击登录');
    console.log('  4. 等待脚本提示"已捕获"');
    console.log('  5. 退出登录');
    console.log('  6. 重复以上步骤登录其他账户\n');

    // 启动网络监听
    const captureComplete = setupNetworkListener(page);

    // 等待所有账户完成
    await captureComplete;

    log.success(`✨ 已成功捕获全部 ${totalAccounts} 个账户的 token！`);

    // 关闭浏览器
    log.info('关闭浏览器...');
    await browser.close();

    log.header('✅ 完成！');
    log.success('所有 token 已保存到后端');
    log.info('Continue IDE 现在可以使用新的独立 token 了');

  } catch (err) {
    log.error(`${err.message}`);
    console.error(err);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// 启动
main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
