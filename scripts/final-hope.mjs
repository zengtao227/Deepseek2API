import { chromium } from 'playwright';
import { execSync } from 'child_process';

async function finalHope() {
  console.log('🛑 正在强制清理浏览器环境...');
  try {
    execSync('killall "Comet"');
  } catch(e) {}
  
  console.log('🚀 正在以【上帝模式】启动 Comet...');
  // 使用全新的临时端口，确保不冲突
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    executablePath: '/Applications/Comet.app/Contents/MacOS/Comet',
    args: ['--remote-debugging-port=9333', '--no-first-run'],
    viewport: null
  });

  const page = await context.newPage();
  console.log('📂 正在打开 DeepSeek...');
  await page.goto('https://chat.deepseek.com/sign_in');

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🔑 请在此窗口登录一次                ║');
  console.log('║  登录成功后，我会立刻为您同步 VPS     ║');
  console.log('╚════════════════════════════════════════╝\n');

  while (true) {
    const token = await page.evaluate(() => {
      function clean(v) {
        if (!v) return null;
        try { const p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
        return (v && v.startsWith('at-')) ? v : null;
      }
      return clean(localStorage.getItem('userToken')) || clean(localStorage.getItem('token'));
    });

    if (token) {
      console.log('🎊 抓到了！');
      console.log('Token: ' + token);
      
      // 直接写入文件
      import('fs').then(fs => {
        const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
        config.accounts = [{ email: 'zengtao227@gmail.com', token, password: '' }];
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        console.log('💾 本地文件已修好！');
        
        // 自动同步 VPS
        console.log('📡 正在秒传 VPS...');
        try {
          execSync('scp config.json frank:/opt/deepseek2api/config.json');
          execSync('ssh frank "sudo systemctl restart deepseek2api || sudo supervisorctl restart deepseek2api"');
          console.log('✅ VPS 已恢复！您现在可以关掉所有窗口去写代码了。');
        } catch(e) { console.log('❌ 同步失败，请检查网络'); }
      });
      break;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

finalHope();
