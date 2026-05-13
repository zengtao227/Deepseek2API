import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const COMET_USER_DATA = path.join(os.homedir(), 'Library/Application Support/Comet/Default');
const SNIFFER_DATA = path.join(os.tmpdir(), 'deepseek-sniffer-profile');

async function sniffer() {
  console.log('📡 启动“网络收割机”...');
  
  if (fs.existsSync(SNIFFER_DATA)) {
    try { fs.rmSync(SNIFFER_DATA, { recursive: true, force: true }); } catch(e) {}
  }
  fs.mkdirSync(path.join(SNIFFER_DATA, 'Default'), { recursive: true });

  console.log('📂 正在同步凭证...');
  try {
    const cookiePath = path.join(COMET_USER_DATA, 'Network/Cookies');
    if (fs.existsSync(cookiePath)) {
      fs.mkdirSync(path.join(SNIFFER_DATA, 'Default/Network'), { recursive: true });
      fs.copyFileSync(cookiePath, path.join(SNIFFER_DATA, 'Default/Network/Cookies'));
    }
  } catch (e) {}

  const context = await chromium.launchPersistentContext(SNIFFER_DATA, {
    headless: false,
    viewport: null
  });

  const page = await context.newPage();
  
  // 核心逻辑：拦截所有请求，寻找 Authorization
  console.log('🕵️  正在监控网络请求...');
  page.on('request', request => {
    const headers = request.headers();
    const auth = headers['authorization'];
    if (auth && auth.startsWith('Bearer at-')) {
      const token = auth.replace('Bearer ', '');
      console.log(`\n🎉 成功截获 Token: ${token.substring(0, 20)}...`);
      
      // 写入并同步
      const configPath = path.join(process.cwd(), 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      config.accounts = [{ email: 'zengtao227@gmail.com', token, password: "" }];
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('💾 本地文件已更新！');
      
      try {
        execSync(`scp config.json frank:/opt/deepseek2api/config.json`);
        execSync(`ssh frank "sudo systemctl restart deepseek2api || sudo supervisorctl restart deepseek2api"`);
        console.log('🚀 VPS 已恢复！');
      } catch (err) {}
      
      process.exit(0);
    }
  });

  await page.goto('https://chat.deepseek.com/');
  console.log('👉 如果没有自动抓到，请在打开的窗口里刷新页面或点一下登录。');

  await new Promise(r => setTimeout(r, 60000));
  await context.close();
}

sniffer();
