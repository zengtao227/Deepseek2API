#!/usr/bin/env bash
# DeepSeek Token 智能捕获工具 - macOS/Linux 启动器

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "\n${BLUE}$(printf '=%.0s' {1..60})${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..60})${NC}\n"
}

# ============================================
# 环境检查
# ============================================
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        echo ""
        echo "请先安装 Node.js:"
        echo "  macOS: brew install node"
        echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
        echo "  或访问: https://nodejs.org"
        exit 1
    fi

    local node_version=$(node --version)
    log_success "Node.js 已安装: $node_version"
}

check_playwright() {
    # 检查 package.json 中是否已有 playwright
    if ! grep -q "playwright" package.json 2>/dev/null; then
        log_warn "Playwright 未安装，正在安装..."
        npm install playwright
        log_success "Playwright 已安装"
    else
        log_info "Playwright 已安装"
    fi
}

# ============================================
# 主程序
# ============================================
main() {
    log_header "🔐 DeepSeek Token 智能捕获工具"

    # 确定脚本位置
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

    log_info "项目目录: $PROJECT_ROOT"

    # 进入项目目录
    cd "$PROJECT_ROOT"

    # 环境检查
    log_info "检查运行环境..."
    check_node
    check_playwright

    # 检查 VPS 连接性（可选）
    log_info "检查 VPS 连接..."
    if ! timeout 3 bash -c "echo > /dev/tcp/frank/5001" 2>/dev/null; then
        log_warn "VPS (frank) 暂时无法连接，脚本仍会继续"
    else
        log_success "VPS 连接正常"
    fi

    # 启动 token 捕获
    log_header "启动 Token 捕获工具"
    log_info "这将打开一个浏览器窗口..."
    log_info "请在浏览器中登录每个 DeepSeek 账户（最多 13 个）"
    log_info "脚本会自动捕获 token，无需手动操作"
    echo ""

    # 运行主脚本
    node "$SCRIPT_DIR/smart-token-capture.mjs"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_success "Token 捕获完成！"
    else
        log_error "Token 捕获失败，请检查日志"
        exit 1
    fi
}

# 运行
main "$@"
