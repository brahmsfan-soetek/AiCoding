#!/usr/bin/env bash
# statusline.sh — 透明包裝器
# 功能：從 Claude Code statusline JSON 擷取 session stats 存入 .agentic/.session-stats，
#       然後透傳給使用者原本的 statusline command（若有）。
#
# 設計原則：不搶佔使用者的 statusline 顯示，僅在旁邊多記一份 log。
# Phase 0 進場時會備份使用者原本的 statusline command 到 .agentic/.original-statusline-cmd，
# 並將本腳本設為 statusline command。

set -euo pipefail

INPUT=$(cat)

# 靜默寫入 session stats（供 phase-logger.sh 讀取）
echo "$INPUT" | python -c "
import sys, json, os

d = json.load(sys.stdin)
cw = d.get('context_window', {})
cost = d.get('cost', {})

stats = {
    'input_tokens': cw.get('total_input_tokens', 0) or 0,
    'output_tokens': cw.get('total_output_tokens', 0) or 0,
    'total_tokens': (cw.get('total_input_tokens', 0) or 0) + (cw.get('total_output_tokens', 0) or 0),
    'cost_usd': cost.get('total_cost_usd', 0) or 0,
    'duration_ms': cost.get('total_duration_ms', 0) or 0,
    'api_duration_ms': cost.get('total_api_duration_ms', 0) or 0,
    'used_percentage': round(cw.get('used_percentage', 0) or 0, 1)
}

os.makedirs('.agentic', exist_ok=True)
with open('.agentic/.session-stats', 'w') as f:
    json.dump(stats, f)
" 2>/dev/null

# 透傳給使用者原本的 statusline command（若有備份）
ORIGINAL_CMD_FILE=".agentic/.original-statusline-cmd"
if [ -f "$ORIGINAL_CMD_FILE" ]; then
    ORIGINAL_CMD=$(cat "$ORIGINAL_CMD_FILE")
    if [ -n "$ORIGINAL_CMD" ]; then
        echo "$INPUT" | eval "$ORIGINAL_CMD"
    fi
fi
