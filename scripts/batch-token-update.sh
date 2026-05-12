#!/usr/bin/env bash
# 批量为每个账户获取并更新独立 Token 的脚本
# 使用方式: ./scripts/batch-token-update.sh <VPS_HOST> <ADMIN_KEY>

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "使用方式: $0 <VPS_HOST> <ADMIN_KEY>"
    echo "示例: $0 frank 744160e5987847bacc0031b8b862420a0a3dd6e9e14a794a8f6891c9c65a2501"
    exit 1
fi

VPS_HOST="$1"
ADMIN_KEY="$2"
Deepseek2API_URL="http://${VPS_HOST}:5001"

# 账户列表
ACCOUNTS=(
    "zengtao227@gmail.com"
    "zengtao227.de@gmail.com"
    "zengtao227.ch@gmail.com"
    "zengtao227.us@gmail.com"
    "zengtao227.sg@gmail.com"
    "zengqhxf@gmail.com"
    "liyue828@gmail.com"
    "liyue828.de@gmail.com"
    "mia.rhzeng@gmail.com"
    "9pgyxsfby5@privaterelay.appleid.com"
    "yqrt7tjg85@privaterelay.appleid.com"
    "xhg4h79pph@privaterelay.appleid.com"
    "n6vst2bmsc@privaterelay.appleid.com"
)

echo "📋 DeepSeek2API 批量 Token 更新工具"
echo "=========================================="
echo "VPS 地址: $Deepseek2API_URL"
echo "待更新账户数: ${#ACCOUNTS[@]}"
echo ""
echo "⚠️  重要提示："
echo "1. 需要在本机运行: npm install playwright"
echo "2. 需要在浏览器中手动登录每个账户"
echo "3. 脚本将自动提取 token 并更新到 VPS"
echo ""
read -p "按 Enter 开始，或 Ctrl+C 退出... " -r

echo ""
echo "开始捕获 Token..."
echo ""

# 检查 npm/node
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装"
    exit 1
fi

# 确保 playwright 已安装
if ! npm list playwright &>/dev/null; then
    echo "📦 正在安装 Playwright..."
    npm install playwright
fi

# 启动 token 捕获
echo "🌐 启动交互式 Token 捕获..."
node scripts/simple-token-capture.mjs
