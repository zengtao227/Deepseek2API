import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const CHROME_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default');
const GHOST_DATA = path.join(os.tmpdir(), 'chrome-ghost-profile');

async function chromeSnatch() {
  console.log('📡 正在从 Chrome 提取凭证...');
  
  if (fs.existsSync(GHOST_DATA)) {
    try { fs.rmSync(GHOST_DATA, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(path.join(GHOST_DATA, 'Default'), { recursive: true });

  try {
    // 复制 Cookies 和 Local Storage
    execSync(`rsync -a --exclude="Singleton*" "${CHROME_USER_DATA}/" "${path.join(GHOST_DATA, 'Default')}/"`);
  } catch (e) {}

  console.log('🌐 启动影子 Chrome...');
  const context = await chromium.launchPersistentContext(GHOST_DATA, {
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    viewport: null
  });

  const page = await context.newPage();
  await page.goto('https://chat.deepseek.com/');

  console.log('🕵️  正在收割 Token...');
  
  let found = false;
  for (let i = 0; i < 20; i++) {
    const token = await page.evaluate(() => {
      function clean(v) {
        if (!v) return null;
        try { const p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
        return (v && v.length > 20) ? v : null;
      }
      return clean(localStorage.getItem('userToken')) || clean(localStorage.getItem('token'));
    });

    if (token) {
      console.log(`\n✅ 成功！抓到 Token: ${token.substring(0, 20)}...`);
      
      const configPath = path.join(process.cwd(), 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      config.accounts = [{ email: 'zengtao227@gmail.com', token, password: "" }];
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      console.log('💾 本地文件已同步。正在秒传 VPS...');
      try {
        execSync(`scp config.json frank:/opt/deepseek2api/config.json`);
        execSync(`ssh frank "sudo systemctl restart deepseek2api || sudo supervisorctl restart deepseek2api"`);
        console.log('🚀 VPS 已恢复！任务圆满完成。');
      } catch (err) {}
      
      found = true;
      break;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }

  await context.close();
  if (!found) console.log('\n❌ 没抓到，可能 Chrome 里的登录状态也失效了，请在弹出的窗口里手动点一下登录。');
}

chromeSnatch();
