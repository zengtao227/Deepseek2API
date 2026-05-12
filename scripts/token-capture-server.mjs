#!/usr/bin/env node

/**
 * DeepSeek Token 捕获服务器
 * 
 * 工作原理：
 * 1. 启动本地 HTTP 服务器监听 token
 * 2. 打开系统默认浏览器（Comet/Chrome/Safari 等）
 * 3. 用户在浏览器中登录账户
 * 4. 浏览器扩展或书签脚本捕获 token 并发送到服务器
 * 5. 服务器保存 token 到文件
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============================================
// 配置
// ============================================
const CONFIG = {
  PORT: 18227,
  OUTPUT_FILE: path.join(PROJECT_ROOT, 'captured_tokens.json'),
  ACCOUNTS: [
    'zengtao227@gmail.com',
    'zengtao227.de@gmail.com',
    'zengtao227.fr@gmail.com',
    'zengtao227.it@gmail.com',
    'zengtao227.es@gmail.com',
    'zengtao227.nl@gmail.com',
    'zengtao227.pl@gmail.com',
    'zengtao227.se@gmail.com',
    'zengtao227.no@gmail.com',
    'zengtao227.dk@gmail.com',
    'zengtao227.fi@gmail.com',
    'zengtao227.pt@gmail.com',
    'zengtao227.gr@gmail.com',
  ],
};

// ============================================
// 日志工具
// ============================================
const log = {
  header: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
};

// ============================================
// Token 存储
// ============================================
const capturedTokens = new Map();

function saveTokensToFile() {
  const data = Array.from(capturedTokens.entries()).map(([email, token]) => ({
    email,
    token,
    captured_at: new Date().toISOString(),
  }));
  
  fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(data, null, 2));
  log.success(`已保存 ${data.length} 个 token 到: ${CONFIG.OUTPUT_FILE}`);
}

// ============================================
// 书签脚本生成
// ============================================
function generateBookmarkletCode() {
  return `javascript:(function(){
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email') || 'unknown';
  
  if (!token) {
    alert('未找到 token，请先登录 DeepSeek');
    return;
  }
  
  fetch('http://localhost:${CONFIG.PORT}/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('✅ Token 已捕获！\\n邮箱: ' + email + '\\n进度: ' + data.progress);
    } else {
      alert('❌ ' + data.message);
    }
  })
  .catch(err => alert('❌ 发送失败: ' + err.message));
})();`;
}

// ============================================
// HTTP 服务器
// ============================================
function startServer() {
  const server = http.createServer((req, res) => {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // 捕获 token
    if (req.method === 'POST' && req.url === '/capture') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { email, token } = JSON.parse(body);
          
          if (!email || !token) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: '缺少 email 或 token' }));
            return;
          }
          
          capturedTokens.set(email, token);
          saveTokensToFile();
          
          const progress = `${capturedTokens.size}/${CONFIG.ACCOUNTS.length}`;
          log.success(`捕获 token: ${email} (${progress})`);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            progress,
            total: CONFIG.ACCOUNTS.length,
            captured: capturedTokens.size,
          }));
          
          // 如果全部完成，提示用户
          if (capturedTokens.size >= CONFIG.ACCOUNTS.length) {
            log.header('🎉 全部完成！');
            log.success(`已捕获全部 ${CONFIG.ACCOUNTS.length} 个账户的 token`);
            log.info('按 Ctrl+C 停止服务器');
          }
        } catch (err) {
          log.error(`解析请求失败: ${err.message}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
      return;
    }
    
    // 状态页面
    if (req.method === 'GET' && req.url === '/') {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DeepSeek Token 捕获工具</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    .bookmarklet { 
      display: inline-block; 
      padding: 10px 20px; 
      background: #007bff; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px;
      margin: 20px 0;
    }
    .bookmarklet:hover { background: #0056b3; }
    .code { 
      background: #f5f5f5; 
      padding: 15px; 
      border-radius: 5px; 
      overflow-x: auto;
      font-family: monospace;
      font-size: 12px;
    }
    .status { margin: 20px 0; padding: 15px; background: #e7f3ff; border-radius: 5px; }
    .progress { font-size: 24px; font-weight: bold; color: #007bff; }
    .instructions { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .instructions ol { margin: 10px 0; padding-left: 20px; }
    .instructions li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>🔐 DeepSeek Token 捕获工具</h1>
  
  <div class="status">
    <div class="progress">进度: ${capturedTokens.size}/${CONFIG.ACCOUNTS.length}</div>
    <p>已捕获账户: ${Array.from(capturedTokens.keys()).join(', ') || '无'}</p>
  </div>
  
  <div class="instructions">
    <h2>📋 使用说明</h2>
    <ol>
      <li>将下面的<strong>捕获按钮</strong>拖到浏览器书签栏（或右键添加到书签）</li>
      <li>在新标签页打开 <a href="https://chat.deepseek.com" target="_blank">https://chat.deepseek.com</a></li>
      <li>登录你的第一个账户</li>
      <li>登录成功后，点击书签栏中的<strong>捕获 Token</strong>按钮</li>
      <li>看到"✅ Token 已捕获"提示后，退出登录</li>
      <li>重复步骤 3-5，登录并捕获其他账户</li>
    </ol>
  </div>
  
  <h2>📌 捕获按钮（拖到书签栏）</h2>
  <a href="${generateBookmarkletCode()}" class="bookmarklet">📥 捕获 Token</a>
  
  <h2>💡 提示</h2>
  <ul>
    <li>使用你的默认浏览器（Comet），可以利用已保存的登录信息</li>
    <li>每次登录后点击书签按钮即可自动捕获 token</li>
    <li>本页面会实时显示捕获进度</li>
    <li>完成后按 Ctrl+C 停止服务器</li>
  </ul>
  
  <h2>🔧 手动方式（如果书签不工作）</h2>
  <p>在 DeepSeek 页面打开浏览器控制台（F12），粘贴以下代码：</p>
  <div class="code">
const token = localStorage.getItem('token');
const email = localStorage.getItem('email') || 'unknown';

fetch('http://localhost:${CONFIG.PORT}/capture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, token })
})
.then(r => r.json())
.then(data => console.log('✅ 捕获成功:', data))
.catch(err => console.error('❌ 捕获失败:', err));
  </div>
  
  <script>
    // 每 2 秒刷新一次进度
    setInterval(() => location.reload(), 2000);
  </script>
</body>
</html>
      `;
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
  });
  
  server.listen(CONFIG.PORT, () => {
    log.header('🚀 Token 捕获服务器已启动');
    log.info(`服务器地址: http://localhost:${CONFIG.PORT}`);
    log.info(`待捕获账户数: ${CONFIG.ACCOUNTS.length}`);
    log.info(`输出文件: ${CONFIG.OUTPUT_FILE}`);
    log.info('');
    log.info('正在打开浏览器...');
    
    // 打开默认浏览器
    openBrowser(`http://localhost:${CONFIG.PORT}`);
  });
}

// ============================================
// 打开默认浏览器
// ============================================
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (err) => {
    if (err) {
      log.warn(`无法自动打开浏览器: ${err.message}`);
      log.info(`请手动访问: ${url}`);
    } else {
      log.success('已打开默认浏览器');
    }
  });
}

// ============================================
// 主函数
// ============================================
function main() {
  startServer();
}

main();
