#!/bin/bash
# 一键提取 Comet 浏览器中的 DeepSeek Token 并通过 Admin API 热更新到服务（失败时改用 SCP + 重启）
# 用法: DEEPSEEK2API_URL=https://你的服务地址 DEEPSEEK2API_KEY=你的密钥 DEEPSEEK2API_ADMIN_KEY=管理密钥 \
#       [DEEPSEEK2API_SSH_HOST=ssh主机] ./scripts/refresh-token.sh
# 优势: Admin API 路径不需要重启服务，token 即时生效

set -euo pipefail

BASE_URL="${DEEPSEEK2API_URL:?set DEEPSEEK2API_URL to your service address}"
API_KEY="${DEEPSEEK2API_KEY:?set DEEPSEEK2API_KEY to your API key}"
ADMIN_KEY="${DEEPSEEK2API_ADMIN_KEY:?set DEEPSEEK2API_ADMIN_KEY to your admin key}"
ACCOUNT_ID="comet-account"
COMET_DB="$HOME/Library/Application Support/Comet/Default/Local Storage/leveldb"
TMP_COPY="/tmp/ds_ls_copy"

echo "🔍 正在从 Comet 浏览器提取 Token..."

if [ ! -d "$COMET_DB" ]; then
  echo "❌ 未找到 Comet 浏览器数据目录"
  exit 1
fi

rm -rf "$TMP_COPY"
cp -r "$COMET_DB" "$TMP_COPY"

# We look for 'userToken' and grab the subsequent string that looks like a token value (64 chars)
TOKEN=$(ls -t "$TMP_COPY"/*.ldb "$TMP_COPY"/*.log 2>/dev/null | xargs strings -a 2>/dev/null \
  | grep -A 1 "userToken" \
  | grep -oE '[A-Za-z0-9/+=]{64}' \
  | head -1) || TOKEN=""

# Fallback: Search for the specific JSON pattern {"value":"..."}
if [ -z "$TOKEN" ]; then
  TOKEN=$(ls -t "$TMP_COPY"/*.ldb "$TMP_COPY"/*.log 2>/dev/null | xargs strings -a 2>/dev/null \
    | grep -oE '"[A-Za-z0-9/+=]{64}"' \
    | head -1 \
    | tr -d '"') || TOKEN=""
fi

# Final Fallback: Just look for any 64-char base64 string, excluding the binary junk found earlier
if [ -z "$TOKEN" ]; then
  TOKEN=$(ls -t "$TMP_COPY"/*.ldb "$TMP_COPY"/*.log 2>/dev/null | xargs strings -a 2>/dev/null \
    | grep -oE '[A-Za-z0-9/+=]{64}' \
    | grep -v "atqIKm" \
    | head -1) || TOKEN=""
fi

rm -rf "$TMP_COPY"

if [ -z "$TOKEN" ]; then
  echo "❌ 未找到 Token。请确认你已在 Comet 浏览器中登录了 DeepSeek。"
  exit 1
fi

echo "✅ Token: ${TOKEN:0:15}...${TOKEN: -8}"

# 通过 Admin API 热更新（不需要重启服务）
echo "🚀 正在通过 Admin API 热更新 Token..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/admin/accounts/capture-token" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ACCOUNT_ID\",\"token\":\"$TOKEN\"}" \
  --max-time 10)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "✅ Admin API 更新成功 (HTTP $HTTP_CODE)"
else
  echo "⚠️  Admin API 返回 HTTP $HTTP_CODE，尝试备用方案（SCP + 重启）..."
  # 备用方案：直接更新 config.json 并 SCP
  CONFIG_FILE="$(cd "$(dirname "$0")/.." && pwd)/config.json"
  if [ -f "$CONFIG_FILE" ]; then
    python3 -c "
import json
with open('$CONFIG_FILE') as f:
    cfg = json.load(f)
cfg['accounts'][0]['token'] = '$TOKEN'
with open('$CONFIG_FILE', 'w') as f:
    json.dump(cfg, f, indent=2)
"
    scp "$CONFIG_FILE" "${DEEPSEEK2API_SSH_HOST:?set DEEPSEEK2API_SSH_HOST}:/opt/deepseek2api/config.json"
    ssh "$DEEPSEEK2API_SSH_HOST" "sudo systemctl restart deepseek2api"
    echo "✅ 备用方案完成（已重启服务）"
  fi
fi

# 验证
echo "⏳ 等待生效..."
sleep 2
echo "🧪 测试中..."
RESULT=$(curl -s "$BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"say OK"}],"max_tokens":5}' \
  --max-time 30)

if echo "$RESULT" | grep -q '"content"'; then
  echo "🎉 成功！Continue IDE 可以正常使用了。"
else
  ERROR=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('message','unknown'))" 2>/dev/null || echo "$RESULT")
  echo "⚠️  测试失败: $ERROR"
fi
