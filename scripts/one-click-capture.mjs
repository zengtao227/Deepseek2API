import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const COMET_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Comet');
const TEMP_USER_DATA = path.join(os.tmpdir(), 'deepseek-shadow-profile');

async function main() {
  console.log('🚀 启动“影子捕获”模式...');
  
  if (fs.existsSync(TEMP_USER_DATA)) {
    try { fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(TEMP_USER_DATA, { recursive: true });
  
  console.log('📂 正在同步登录状态...');
  try {
    execSync(`rsync -a --exclude="Singleton*" --exclude="Lock" --exclude="*.log" "${COMET_USER_DATA}/" "${TEMP_USER_DATA}/"`);
  } catch (e) {
    console.log('⚠️  同步完成（部分锁定文件已跳过）。');
  }

  const context = await chromium.launchPersistentContext(TEMP_USER_DATA, {
    headless: false,
    executablePath: '/Applications/Comet.app/Contents/MacOS/Comet',
    args: ['--disable-blink-features=AutomationControlled', '--no-first-run'],
    viewport: null
  });

  const page = await context.newPage();
  await page.goto('https://chat.deepseek.com/');

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ✅ 影子浏览器已就绪！                ║');
  console.log('║  请确保页面已登录，并刷新一次页面     ║');
  console.log('╚════════════════════════════════════════╝\n');

  while (true) {
    try {
      const result = await page.evaluate(() => {
        function clean(v) {
          if (!v) return null;
          try {
            const p = JSON.parse(v);
            if (p && p.value) v = p.value;
          } catch(e) {}
          return (v && v.startsWith('at-')) ? v : null;
        }

        const keys = [];
        for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
        
        const token = clean(localStorage.getItem('token')) || 
                      clean(localStorage.getItem('userToken')) ||
                      clean(localStorage.getItem('ls_token'));
        
        let email = null;
        try { email = JSON.parse(localStorage.getItem('user')).email; } catch(e) {}
        
        return { token, email, keys };
      });

      if (result.token && result.email) {
        console.log(`\n🎊 抓到啦！`);
        console.log(`📧 账户: ${result.email}`);
        console.log(`🔑 Token: ${result.token.substring(0, 15)}...`);

        const res = await fetch('http://localhost:5001/admin/accounts/capture-token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501'
          },
          body: JSON.stringify({ email: result.email, token: result.token })
        });

        if (res.ok) {
          console.log('🚀 已经成功同步到系统！');
        }
        // 抓到后可以继续抓下一个，或者等待用户操作
      } else {
        process.stdout.write('.'); // 打印进度点
      }
    } catch (e) {
      // 页面关闭或导航中
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(err => console.error('💥 脚本崩溃:', err));
