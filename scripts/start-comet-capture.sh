#!/bin/bash

# 启动 Comet 浏览器并开启 CDP 端口
# 然后运行 token 捕获脚本

set -e

echo "=== DeepSeek Token 捕获工具 ==="
echo ""

# 检查 Comet 是否已经在运行
if pgrep -f "Comet.*remote-debugging-port=9222" > /dev/null; then
    echo "✅ Comet 已在运行（CDP 模式）"
else
    echo "🚀 启动 Comet 浏览器（CDP 模式）..."
    open -a Comet --args --remote-debugging-port=9222
    echo "⏳ 等待 Comet 启动..."
    sleep 3
fi

# 检查 CDP 端口是否可用
if ! curl -s http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "❌ 无法连接到 Comet CDP 端口"
    echo ""
    echo "请手动启动 Comet："
    echo "  open -a Comet --args --remote-debugging-port=9222"
    echo ""
    echo "然后重新运行此脚本"
    exit 1
fi

echo "✅ CDP 端口已就绪"
echo ""
echo "🔐 启动 token 捕获脚本..."
echo "   脚本会连接到你的 Comet 浏览器"
echo "   请在 Comet 中登录账户，脚本会自动捕获 token"
echo ""

# 运行捕获脚本
BROWSER_CDP_URL=http://localhost:9222 node scripts/smart-token-capture.mjs
