#!/bin/bash

# 🔐 一键启动 Token 自动捕获
# 使用方法: ./scripts/start-token-capture.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     🔐 DeepSeek Token 自动捕获启动             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# 检查前置条件
check_prerequisites() {
    echo -e "${BLUE}检查前置条件...${NC}"
    echo ""

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        echo "请运行: brew install node"
        exit 1
    fi
    print_step "Node.js 已安装"

    # 检查 Comet 浏览器
    if [ ! -d "/Applications/Comet.app" ]; then
        print_error "Comet 浏览器未安装"
        echo "请从 https://comet.genesisapp.ai 下载并安装"
        exit 1
    fi
    print_step "Comet 浏览器已安装"

    # 检查 DS2API
    if [ ! -f "$PROJECT_ROOT/ds2api" ] && [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_warn "DS2API 可能未编译或配置"
        print_info "请确保已运行:"
        echo "  cd $PROJECT_ROOT"
        echo "  go build -o ds2api ./cmd/ds2api"
        echo "  echo 'DS2API_ADMIN_KEY=your-key' > .env"
    fi
    print_step "DS2API 配置已检查"

    # 检查必要的 npm 包
    if [ ! -d "$PROJECT_ROOT/node_modules/ws" ]; then
        print_warn "需要安装 ws 包"
        npm install ws --silent
    fi
    print_step "npm 依赖已检查"

    echo ""
}

# 启动 Comet（带 CDP）
start_comet() {
    echo -e "${BLUE}启动 Comet 浏览器（带 CDP 支持）...${NC}"

    # 检查 Comet 是否已运行
    if pgrep -f "Comet.*remote-debugging-port" > /dev/null; then
        print_step "Comet 已在运行（CDP 模式）"
        return
    fi

    # 启动 Comet
    /Applications/Comet.app/Contents/MacOS/Comet --remote-debugging-port=9222 >/dev/null 2>&1 &
    COMET_PID=$!

    print_info "启动中... (PID: $COMET_PID)"
    sleep 3

    # 验证 CDP 端口
    if netstat -an 2>/dev/null | grep -q ":9222"; then
        print_step "Comet 已启动，CDP 端口 9222 可用"
    else
        print_error "Comet 启动失败或 CDP 端口未开放"
        kill $COMET_PID 2>/dev/null || true
        exit 1
    fi

    echo ""
}

# 启动监听脚本
start_listener() {
    echo -e "${BLUE}启动 Token 监听脚本...${NC}"
    echo ""

    # 检查 DS2API 连接
    if ! curl -s -m 2 "http://localhost:5001/healthz" > /dev/null 2>&1; then
        print_error "无法连接到 DS2API (http://localhost:5001)"
        echo ""
        print_info "请在另一个终端启动 DS2API:"
        echo "  cd $PROJECT_ROOT"
        echo "  ./ds2api"
        echo ""
        return 1
    fi

    print_step "DS2API 已连接"
    echo ""

    # 运行监听脚本
    node "$PROJECT_ROOT/scripts/cdp-token-monitor.mjs"
}

# 主流程
main() {
    print_header

    # 检查参数
    case "${1:-}" in
        --help|-h)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --help, -h      显示此帮助信息"
            echo "  --check         只检查配置，不启动"
            echo ""
            echo "示例:"
            echo "  $0              启动完整流程"
            echo "  $0 --check      检查配置"
            exit 0
            ;;
        --check)
            check_prerequisites
            echo -e "${GREEN}✅ 所有配置检查通过！${NC}"
            exit 0
            ;;
    esac

    # 检查前置条件
    check_prerequisites

    # 启动 Comet
    start_comet

    # 启动监听脚本
    if ! start_listener; then
        print_error "监听脚本启动失败"
        exit 1
    fi
}

# 捕获退出信号
cleanup() {
    echo ""
    print_info "清理资源..."
    # 不关闭 Comet，用户可能还在用
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动
main "$@"
