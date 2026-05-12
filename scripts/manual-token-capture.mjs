#!/usr/bin/env node

/**
 * 手动 Token 捕获工具
 * 
 * 使用方法：
 * 1. 在你的 Comet 浏览器中打开 DeepSeek 并登录
 * 2. 打开浏览器控制台（F12）
 * 3. 运行脚本提供的代码
 * 4. 将 token 粘贴到终端
 */

import http from 'http';
import readline from 'readline';

const CONFIG = {
  BACKEND_URL: 'http://localhost:5001',
  ADMIN_KEY: process.env.DS2API_ADMIN_KEY || '744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501',
  ACCOUNTS: [
    'zengtao227@gmail.com',
    'zengtao227.de@gmail.com',
    'leo.rlzeng@gmail.com',
  ],
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function uploadToken(email, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, token });
    const url = new URL('/admin/accounts/capture-token', CONFIG.BACKEND_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${CONFIG.ADMIN_KEY}`,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n='.repeat(60));
  console.log('🔐 DeepSeek Token 手动捕获工具');
  console.log('='.repeat(60));
  console.log('\n📋 需要捕获的账户:');
  CONFIG.ACCOUNTS.forEach((email, i) => {
    console.log(`  ${i + 1}. ${email}`);
  });
  
  console.log('\n📝 操作步骤:');
  console.log('  1. 在 Comet 浏览器中打开 https://chat.deepseek.com');
  console.log('  2. 登录第一个账户');
  console.log('  3. 按 F12 打开控制台');
  console.log('  4. 粘贴以下代码并回车:\n');
  console.log('     localStorage.getItem("token")\n');
  console.log('  5. 复制输出的 token（去掉引号）');
  console.log('  6. 粘贴到下面的提示中\n');
  console.log('='.repeat(60));
  console.log('');

  for (let i = 0; i < CONFIG.ACCOUNTS.length; i++) {
    const email = CONFIG.ACCOUNTS[i];
    console.log(`\n[${i + 1}/${CONFIG.ACCOUNTS.length}] ${email}`);
    console.log('请在 Comet 中登录此账户，然后从控制台复制 token');
    
    const token = await question('粘贴 token: ');
    
    if (!token || token.trim().length < 20) {
      console.log('❌ Token 无效，跳过此账户');
      continue;
    }

    try {
      await uploadToken(email, token.trim());
      console.log(`✅ ${email} - Token 已保存`);
    } catch (err) {
      console.log(`❌ ${email} - 上传失败: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 完成！');
  console.log('='.repeat(60));
  rl.close();
}

main().catch((err) => {
  console.error('❌ 错误:', err.message);
  rl.close();
  process.exit(1);
});
