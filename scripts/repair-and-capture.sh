#!/bin/bash

# 1. 退出 Comet
echo "🛑 正在保存并退出 Comet..."
killall "Comet" 2>/dev/null
sleep 2

# 2. 带调试端口重新启动
echo "🚀 正在开启调试模式并重新启动 Comet..."
/Applications/Comet.app/Contents/MacOS/Comet --remote-debugging-port=9222 --restore-last-session &

# 3. 等待启动
echo "⏳ 等待浏览器就绪..."
sleep 5

# 4. 运行抓取脚本
echo "📡 开始自动抓取 Token..."
node scripts/snatch-via-cdp.mjs

echo "✅ 流程结束！"
