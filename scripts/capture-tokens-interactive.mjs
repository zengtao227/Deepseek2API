#!/usr/bin/env node
/**
 * DeepSeek Token 自动捕获脚本
 *
 * 你的唯一操作：在打开的 Comet 浏览器中，点击「登录」按钮
 * 密码由浏览器自动填充，token 由脚本自动提取并保存
 *
 * 用法: node scripts/capture-tokens-interactive.mjs
 *
 * 环境变量:
 *   Deepseek2API_URL       - Deepseek2API 地址（默认 http://localhost:5001）
 *   Deepseek2API_ADMIN_KEY - Admin Key（默认从 ~/Deepseek2API/.env 读取）
 *
 * 账户来源: 读取 ../accounts.json（不上传到 GitHub）
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============================================================
// 配置
// ============================================================
const Deepseek2API_URL   = process.env.Deepseek2API_URL || 'http://localhost:5001';
const ADMIN_KEY    = process.env.Deepseek2API_ADMIN_KEY || (() => {
  try {
    const envPath = path.join(os.homedir(), 'Deepseek2API', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/Deepseek2API_ADMIN_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}
  return '';
})();

// ============================================================
// 浏览器配置（使用 Comet，保留保存的密码）
// ============================================================

const COMET_EXEC_PATH  = '/Applications/Comet.app/Contents/MacOS/Comet';
const COMET_USER_DATA  = path.join(os.homedir(), 'Library/Application Support/Comet');

const CHROME_EXEC_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');

// ============================================================
// 读取账户列表
// ============================================================

function loadAccounts() {
  // 优先读取项目根目录下的 accounts.json（不上传到 GitHub）
  const localPath = path.join(PROJECT_ROOT, 'accounts.json');
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf-8'));
  }

  // 如果不存在，尝试读取 ~/Deepseek2API/accounts.json
  const homePath = path.join(os.homedir(), 'Deepseek2API', 'accounts.json');
  if (fs.existsSync(homePath)) {
    return JSON.parse(fs.readFileSync(homePath, 'utf-8'));
  }

  // 都不存在则报错
  console.error('❌ 未找到 accounts.json');
  console.error('   请创建 accounts.json 在项目根目录，格式:');
  console.error('   [');
  console.error('     { "alias": "main",   "email": "you@email.com" },');
  console.error('     { "alias": "backup", "email": "backup@email.com" }');
  console.error('   ]');
  console.error('');
  console.error('   或者复制 accounts.example.json 并填入你的邮箱');
  process.exit(1);
}

// ============================================================
// 工具函数
// ============================================================

/** 从 localStorage 中提取 DeepSeek token */
async function findToken(page) {
  return page.evaluate(() => {
    // 常见 token key
    const keys = [
      'token', 'auth_token', 'accessToken', 'access_token', 'authToken',
      'deepseek_token', 'ds_token', 'user_token',
    ];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.length > 20) return v;
    }
    // 扫描所有 key 包含 token 的项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes('token')) {
        const val = localStorage.getItem(key);
        if (val && val.length > 20) return val;
      }
    }
    // 也检查 sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.toLowerCase().includes('token')) {
        const val = sessionStorage.getItem(key);
        if (val && val.length > 20) return val;
      }
    }
    return null;
  });
}

/** 提交 token 到 Deepseek2API */
async function submitToken(email, token) {
  const url = `${Deepseek2API_URL}/admin/accounts/capture-token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_KEY}`,
    },
    body: JSON.stringify({ email, token }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

/** 轮询 localStorage 等待 token 出现（最多 2 分钟） */
async function waitForToken(page, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const token = await findToken(page);
    if (token) return token;
    await new Promise(r => setTimeout(r, 1000));
  }
  return null;
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     🔐 DeepSeek Token 自动捕获脚本             ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  你只需要做：在浏览器中点击「登录」            ║');
  console.log('║  密码由 Comet 自动填充                         ║');
  console.log('║  Token 自动提取并保存到 Deepseek2API                 ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // 检测可用浏览器（Comet 优先）
  const useComet  = fs.existsSync(COMET_EXEC_PATH);
  const useChrome = fs.existsSync(CHROME_EXEC_PATH);

  if (!useComet && !useChrome) {
    console.error('❌ 未找到 Comet 或 Chrome 浏览器');
    process.exit(1);
  }

  const browserName = useComet ? 'Comet' : 'Chrome';
  const execPath    = useComet ? COMET_EXEC_PATH : CHROME_EXEC_PATH;
  const userDataDir = useComet ? COMET_USER_DATA : CHROME_USER_DATA;

  const accounts = loadAccounts();
  console.log(`  📡 Deepseek2API   : ${Deepseek2API_URL}`);
  console.log(`  🌐 浏览器   : ${browserName}`);
  console.log(`  📋 账户数   : ${accounts.length}`);
  console.log('');

  if (!ADMIN_KEY) {
    console.error('❌ 未设置 ADMIN_KEY，请设置环境变量 Deepseek2API_ADMIN_KEY');
    process.exit(1);
  }

  let context;
  let page;
  let successCount = 0;
  const results = [];

  try {
    // 使用 Comet 浏览器的用户数据（保留所有密码、Cookie、历史记录）
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      executablePath: execPath,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-sync',
      ],
      viewport: null,
    });

    page = await context.newPage();

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      console.log(`\n[${i + 1}/${accounts.length}] 📧 ${account.alias} (${account.email})`);

      // 打开新标签页->导航到 DeepSeek 登录页
      const loginPage = await context.newPage();
      try {
        await loginPage.goto('https://chat.deepseek.com/sign_in', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        console.log(`  👆 请点击「登录」按钮 → 等待 token...`);

        const token = await waitForToken(loginPage);

        if (!token) {
          console.log(`  ⚠️  未检测到 token，跳过`);
          results.push({ email: account.email, alias: account.alias, success: false, reason: 'token_not_found' });
          continue;
        }

        await submitToken(account.email, token);
        const preview = token.length > 16 ? token.substring(0, 12) + '...' : token.substring(0, 8);
        console.log(`  ✅ Token 已保存 (${preview})`);
        successCount++;
        results.push({ email: account.email, alias: account.alias, success: true });

      } catch (err) {
        console.log(`  ❌ 错误: ${err.message}`);
        results.push({ email: account.email, alias: account.alias, success: false, reason: err.message });
      } finally {
        await loginPage.close().catch(() => {});
      }

      // 账户间等待，确保清除登录状态
      await new Promise(r => setTimeout(r, 1500));
    }

  } catch (err) {
    console.error('💥 错误:', err.message);
  } finally {
    if (context) await context.close().catch(() => {});
  }

  // 结果汇总
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  ✅ 成功: ${successCount} / ${accounts.length}                             ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.alias} (${r.email}): ${r.success ? '已保存' : r.reason}`);
  });

  const resultPath = path.join(PROJECT_ROOT, 'token-capture-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 结果已保存到: ${resultPath}`);
}

main().catch(err => {
  console.error('💥 致命错误:', err);
  process.exit(1);
});