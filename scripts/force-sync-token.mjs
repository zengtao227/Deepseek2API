import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

async function forceSync() {
  console.log('📡 正在抓取最新 Token 并强制写入文件...');
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    let token = null;
    let email = 'zengtao227@gmail.com';

    for (const context of contexts) {
      for (const page of context.pages()) {
        if (page.url().includes('deepseek.com')) {
          token = await page.evaluate(() => {
            function clean(v) {
              if (!v) return null;
              try { const p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
              return (v && v.startsWith('at-')) ? v : null;
            }
            return clean(localStorage.getItem('token')) || clean(localStorage.getItem('userToken'));
          });
          if (token) break;
        }
      }
      if (token) break;
    }

    if (!token) {
      console.error('❌ 未在浏览器中找到 at- 开头的有效 Token！请确保 DeepSeek 页面已登录并刷新。');
      await browser.close();
      return;
    }

    console.log(`✅ 抓到 Token: ${token.substring(0, 20)}...`);

    // 直接修改文件
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    if (!config.accounts) config.accounts = [];
    
    // 更新或添加账号
    const idx = config.accounts.findIndex(a => a.email === email);
    if (idx !== -1) {
      config.accounts[idx].token = token;
    } else {
      config.accounts.push({ email, token, password: "" });
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('💾 本地 config.json 已强行更新！');

    await browser.close();
    console.log('🎉 请稍等，我正在为您同步到 VPS...');
  } catch (err) {
    console.error(`❌ 失败: ${err.message}`);
  }
}

forceSync();
