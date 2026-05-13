import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

async function singleAccountFix() {
  console.log('🎯 正在执行“单账号”强行修复...');
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const pages = (await browser.contexts()[0].pages());
    
    let token = null;
    let email = 'zengtao227@gmail.com';

    for (const page of pages) {
      if (page.url().includes('deepseek.com')) {
        token = await page.evaluate(() => {
          function clean(v) {
            if (!v) return null;
            try { const p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
            return (v && v.startsWith('at-')) ? v : null;
          }
          return clean(localStorage.getItem('token')) || clean(localStorage.getItem('userToken'));
        });
        if (token) {
          try { 
            const userEmail = await page.evaluate(() => JSON.parse(localStorage.getItem('user')).email);
            if (userEmail) email = userEmail;
          } catch(e) {}
          break;
        }
      }
    }

    if (!token) {
      console.error('❌ 还是没抓到！请确保 Comet 里开着 https://chat.deepseek.com 并且已经登录。');
      await browser.close();
      return;
    }

    console.log(`✅ 抓到有效 Token: ${token.substring(0, 15)}...`);
    console.log(`📧 对应账号: ${email}`);

    // 直接重写 config.json，只保留这一个账号
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    config.accounts = [{ email, token, password: "" }];

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('💾 本地 config.json 已重置，现在仅包含这一个有效账号。');

    await browser.close();
  } catch (err) {
    console.error(`❌ 连接浏览器失败: ${err.message}`);
  }
}

singleAccountFix();
