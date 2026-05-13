import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const CHROME_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default');
const GHOST_DATA = path.join(os.tmpdir(), 'chrome-ghost-profile-v2');

async function chromeSnatchV2() {
  console.log('📡 正在重启 Chrome 深度收割机...');
  
  if (fs.existsSync(GHOST_DATA)) {
    try { fs.rmSync(GHOST_DATA, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(path.join(GHOST_DATA, 'Default'), { recursive: true });

  try {
    execSync(`rsync -a --exclude="Singleton*" "${CHROME_USER_DATA}/" "${path.join(GHOST_DATA, 'Default')}/"`);
  } catch (e) {}

  const context = await chromium.launchPersistentContext(GHOST_DATA, {
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    viewport: null
  });

  const page = await context.newPage();
  await page.goto('https://chat.deepseek.com/');

  console.log('🕵️  正在进行二次深度收割...');
  
  let found = false;
  for (let i = 0; i < 30; i++) {
    const token = await page.evaluate(() => {
      function clean(v) {
        if (!v) return null;
        try { const p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
        // 严格要求 at- 开头
        return (v && v.startsWith('at-')) ? v : null;
      }
      return clean(localStorage.getItem('userToken')) || clean(localStorage.getItem('token'));
    });

    if (token) {
      console.log(`\n🎉 真正抓到啦！有效 Token: ${token.substring(0, 20)}...`);
      
      const configPath = path.join(process.cwd(), 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      config.accounts = [{ email: 'zengtao227@gmail.com', token, password: "" }];
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      console.log('💾 本地文件已物理更新。正在秒传 VPS...');
      try {
        execSync(`scp config.json frank:/opt/deepseek2api/config.json`);
        execSync(`ssh frank "sudo systemctl restart deepseek2api || sudo supervisorctl restart deepseek2api"`);
        console.log('🚀 VPS 已恢复！这次是真的稳了。');
      } catch (err) {}
      
      found = true;
      break;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }

  await context.close();
}

chromeSnatchV2();
