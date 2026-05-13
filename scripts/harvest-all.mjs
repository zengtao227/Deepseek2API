import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

async function harvestAll() {
  console.log('📡 正在全量收割所有已登录的 DeepSeek 账号...');
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    const capturedAccounts = [];

    for (const context of contexts) {
      for (const page of context.pages()) {
        const url = page.url();
        if (url.includes('deepseek.com')) {
          const data = await page.evaluate(() => {
            function clean(v) {
              if (!v) return null;
              try { const p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
              return (v && v.startsWith('at-')) ? v : null;
            }
            const t = clean(localStorage.getItem('token')) || clean(localStorage.getItem('userToken'));
            let e = null;
            try { e = JSON.parse(localStorage.getItem('user')).email; } catch(err) {}
            return { token: t, email: e };
          });

          if (data.token && data.email) {
            console.log(`✅ 抓到账号: ${data.email} | Token: ${data.token.substring(0, 15)}...`);
            capturedAccounts.push(data);
          }
        }
      }
    }

    if (capturedAccounts.length === 0) {
      console.error('❌ 未发现任何已登录的 DeepSeek 标签页！');
      await browser.close();
      return;
    }

    // 强制写入 config.json
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    // 我们清空旧的 accounts，用抓到的最新的替换，确保全是有效的
    config.accounts = capturedAccounts.map(a => ({
      email: a.email,
      token: a.token,
      password: ""
    }));

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`💾 成功收割 ${capturedAccounts.length} 个账号，并更新到本地 config.json！`);

    await browser.close();
  } catch (err) {
    console.error(`❌ 失败: ${err.message}`);
  }
}

harvestAll();
