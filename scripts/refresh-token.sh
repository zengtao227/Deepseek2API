#!/bin/bash
# 一键提取 Comet 浏览器中的 DeepSeek Token 并同步到 VPS
# 用法: ./scripts/refresh-token.sh

set -euo pipefail

CONFIG="/Users/zengtao/Doc/My code/Deepseek2API/config.json"
COMET_DB="$HOME/Library/Application Support/Comet/Default/Local Storage/leveldb"
TMP_COPY="/tmp/ds_ls_copy"

echo "🔍 正在从 Comet 浏览器提取 Token..."

rm -rf "$TMP_COPY"
cp -r "$COMET_DB" "$TMP_COPY"

TOKEN=$(strings "$TMP_COPY"/*.ldb "$TMP_COPY"/*.log 2>/dev/null \
  | grep 'userToken' -A1 \
  | grep -oE '"value":"[^"]+"' \
  | head -1 \
  | sed 's/"value":"//;s/"//')

if [ -z "$TOKEN" ]; then
  # Fallback: search for the token pattern directly
  TOKEN=$(strings "$TMP_COPY"/*.ldb "$TMP_COPY"/*.log 2>/dev/null \
    | grep -oE '"value":"[A-Za-z0-9/+=]{50,70}"' \
    | head -1 \
    | sed 's/"value":"//;s/"//')
fi

rm -rf "$TMP_COPY"

if [ -z "$TOKEN" ]; then
  echo "❌ 未找到 Token。请确认你已在 Comet 浏览器中登录了 DeepSeek。"
  exit 1
fi

echo "✅ Token: ${TOKEN:0:20}...${TOKEN: -10}"

# 更新 config.json
python3 -c "
import json
with open('$CONFIG') as f:
    cfg = json.load(f)
cfg['accounts'][0]['token'] = '$TOKEN'
with open('$CONFIG', 'w') as f:
    json.dump(cfg, f, indent=2)
print('✅ config.json 已更新')
"

echo "🚀 正在同步到 VPS..."
scp "$CONFIG" frank:/opt/deepseek2api/config.json
ssh frank "sudo systemctl restart deepseek2api"

echo "⏳ 等待服务启动..."
sleep 3

echo "🧪 测试中..."
RESULT=$(curl -s https://Deepseek2API.mooo.com/v1/chat/completions \
  -H "Authorization: Bearer sk-continue-local-api-key-deepseek-free" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"say OK"}],"max_tokens":5}' \
  --max-time 30)

if echo "$RESULT" | grep -q '"content"'; then
  echo "🎉 成功！Continue IDE 可以正常使用了。"
else
  echo "⚠️  测试失败。VPS 日志："
  ssh frank "sudo journalctl -u deepseek2api -n 5 --no-pager" 2>/dev/null | grep -E 'WARN|ERROR|failed' || true
  echo ""
  echo "响应: $RESULT"
fi
