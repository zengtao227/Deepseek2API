#!/bin/bash
# Aider 包装脚本 - 支持自动 fallback 到付费 API
# 使用方式: ./aider-with-fallback.sh [aider args...]

set -e

# 配置
FREE_API_BASE="${FREE_API_BASE:-https://Deepseek2API.mooo.com/v1}"
FREE_API_KEY="${FREE_API_KEY:-sk-continue-local-api-key-deepseek-free}"
PAID_API_BASE="${PAID_API_BASE:-https://api.deepseek.com/v1}"
PAID_API_KEY="${DEEPSEEK_PAID_API_KEY:-$DEEPSEEK_API_KEY}"
MAX_RETRIES=2
RETRY_DELAY=5

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2
}

# 检查 API 健康状态
check_api_health() {
    local api_base="$1"
    local api_key="$2"
    local timeout=10

    if ! curl -s -m "$timeout" \
        -H "Authorization: Bearer $api_key" \
        "$api_base/models" > /dev/null 2>&1; then
        return 1
    fi
    return 0
}

# 启动 Aider
start_aider() {
    local api_base="$1"
    local api_key="$2"
    local use_free=$3
    shift 3

    if [ "$use_free" = "true" ]; then
        log "使用免费 API: $api_base"
    else
        log "使用付费 API: $api_base"
    fi

    export AIDER_MODEL="deepseek/deepseek-chat"
    export AIDER_API_BASE="$api_base"
    export AIDER_API_KEY="openai=$api_key"

    exec aider-real "$@"
}

# 主逻辑
main() {
    # 首先尝试免费 API
    log "检测免费 API 状态..."
    if check_api_health "$FREE_API_BASE" "$FREE_API_KEY"; then
        log "✅ 免费 API 正常，启动 Aider"
        start_aider "$FREE_API_BASE" "$FREE_API_KEY" "true" "$@"
    fi

    # 免费 API 失败，尝试付费 API
    log "⚠️ 免费 API 不可用，尝试切换到付费 API..."

    if [ -z "$PAID_API_KEY" ]; then
        log "❌ 错误：未设置 DEEPSEEK_PAID_API_KEY 环境变量"
        log "请设置: export DEEPSEEK_PAID_API_KEY=your-api-key"
        exit 1
    fi

    if check_api_health "$PAID_API_BASE" "$PAID_API_KEY"; then
        log "✅ 付费 API 正常，启动 Aider"
        start_aider "$PAID_API_BASE" "$PAID_API_KEY" "false" "$@"
    else
        log "❌ 付费 API 也不可用，无法启动 Aider"
        exit 1
    fi
}

main "$@"
