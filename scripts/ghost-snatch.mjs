import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const COMET_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Comet/Default');
const GHOST_DATA = path.join(os.tmpdir(), 'deepseek-ghost-profile');

async function ghostSnatch() {
  console.log('👻 正在启动“幽灵收割”模式...');
  
  // 1. 创建临时的 Profile 目录
  if (fs.existsSync(GHOST_DATA)) {
    try { fs.rmSync(GHOST_DATA, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(path.join(GHOST_DATA, 'Default'), { recursive: true });

  // 2. 只同步最核心的登录数据（Cookies 和 Local Storage）
  console.log('📂 正在克隆登录凭证...');
  try {
    // 复制 Cookies
    const cookiePath = path.join(COMET_USER_DATA, 'Network/Cookies');
    if (fs.existsSync(cookiePath)) {
      fs.mkdirSync(path.join(GHOST_DATA, 'Default/Network'), { recursive: true });
      fs.copyFileSync(cookiePath, path.join(GHOST_DATA, 'Default/Network/Cookies'));
    }
    // 复制 Local Storage
    const lsPath = path.join(COMET_USER_DATA, 'Local Storage');
    if (fs.existsSync(lsPath)) {
      execSync(`rsync -a "${lsPath}/" "${path.join(GHOST_DATA, 'Default/Local Storage')}/"`);
    }
  } catch (e) {
    console.log('⚠️  凭证同步中...');
  }

  // 3. 启动 Playwright 自带的 Chromium（不是 Comet，不会冲突）
  console.log('🌐 启动幽灵浏览器...');
  const context = await chromium.launchPersistentContext(GHOST_DATA, {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    viewport: null
  });

  const page = await context.newPage();
  console.log('🚀 正在直达 DeepSeek...');
  await page.goto('https://chat.deepseek.com/');

  // 4. 循环抓取
  let count = 0;
  while (count < 10) {
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

    if (data.token) {
      const email = data.email || 'zengtao227@gmail.com';
      console.log(`\n✅ 抓到啦！账户: ${email}`);
      console.log(`🔑 Token: ${data.token.substring(0, 15)}...`);

      // 写入本地并同步
      const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf-8'));
      config.accounts = [{ email, token: data.token, password: "" }];
      fs.writeFileSync(path.join(process.cwd(), 'config.json'), JSON.stringify(config, null, 2));
      
      console.log('💾 本地 config.json 已更新！');
      
      // 自动同步到 VPS
      try {
        execSync(`scp config.json frank:/opt/deepseek2api/config.json`);
        execSync(`ssh frank "sudo systemctl restart deepseek2api || sudo supervisorctl restart deepseek2api"`);
        console.log('🚀 VPS 同步成功！Continue 应该已经恢复！');
      } catch (err) {
        console.log('❌ VPS 同步失败，但本地已更新。');
      }
      
      break;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
    count++;
  }

  await context.close();
  console.log('\n🏁 任务完成！');
}

ghostSnatch();
