#!/usr/bin/env bash
# phase-logger.sh — Phase 計時 & Token 追蹤
# Usage:
#   bash .claude/hooks/phase-logger.sh start <phase>
#   bash .claude/hooks/phase-logger.sh end <phase>
#
# Token 耗用自動從 .agentic/.session-stats 讀取（由 statusline.sh 寫入）。
# 若 .session-stats 不存在則記為 N/A。

set -euo pipefail

ACTION="${1:?Usage: phase-logger.sh start|end <phase>}"
PHASE="${2:?Phase name required (e.g. P0, P1, P2, P3)}"

AGENTIC_DIR=".agentic"
TIMER_DIR="$AGENTIC_DIR/.timers"
LOG_MD="$AGENTIC_DIR/phase-log.md"
SESSION_STATS="$AGENTIC_DIR/.session-stats"

mkdir -p "$TIMER_DIR"

NOW=$(date +%s)
NOW_HUMAN=$(date '+%Y-%m-%d %H:%M:%S')

format_duration() {
  local secs=$1
  local h=$((secs / 3600))
  local m=$(((secs % 3600) / 60))
  local s=$((secs % 60))
  if [ "$h" -gt 0 ]; then
    printf "%dh %dm %ds" "$h" "$m" "$s"
  elif [ "$m" -gt 0 ]; then
    printf "%dm %ds" "$m" "$s"
  else
    printf "%ds" "$s"
  fi
}

read_session_stats() {
  # Read token/cost from .session-stats (written by statusline.sh)
  if [ -f "$SESSION_STATS" ]; then
    python -c "
import json, sys
with open('$SESSION_STATS') as f:
    d = json.load(f)
total = d.get('total_tokens', 0)
cost = d.get('cost_usd', 0)
inp = d.get('input_tokens', 0)
out = d.get('output_tokens', 0)
# Format tokens with comma separators
def fmt(n):
    return f'{n:,}'
print(f'{fmt(total)}')
print(f'{fmt(inp)}')
print(f'{fmt(out)}')
print(f'{cost:.4f}')
" 2>/dev/null
  fi
}

case "$ACTION" in
  start)
    # Record phase start: epoch|human-readable
    echo "${NOW}|${NOW_HUMAN}" > "$TIMER_DIR/${PHASE}.start"

    # Snapshot current session tokens at phase start (for delta calculation)
    if [ -f "$SESSION_STATS" ]; then
      cp "$SESSION_STATS" "$TIMER_DIR/${PHASE}.stats-start"
    fi

    # Record total start if this is the first phase ever
    if [ ! -f "$TIMER_DIR/total.start" ]; then
      echo "$NOW" > "$TIMER_DIR/total.start"
    fi

    # Initialize log markdown if not exists
    if [ ! -f "$LOG_MD" ]; then
      cat > "$LOG_MD" << 'HEADER'
# Phase Log

| Phase | 開始時間 | 結束時間 | 階段耗時 | 累計耗時 | Token (in/out) | 費用 (USD) |
|-------|---------|---------|---------|---------|---------------|-----------|
HEADER
    fi

    echo "⏱️ ${PHASE} 開始於 ${NOW_HUMAN}"
    ;;

  end)
    START_FILE="$TIMER_DIR/${PHASE}.start"

    if [ ! -f "$START_FILE" ]; then
      echo "❌ 找不到 ${PHASE} 的開始時間，請先執行 start" >&2
      exit 1
    fi

    # Read start time
    IFS='|' read -r PHASE_START START_HUMAN < "$START_FILE"
    TOTAL_START=$(cat "$TIMER_DIR/total.start")

    # Calculate durations
    PHASE_ELAPSED=$((NOW - PHASE_START))
    TOTAL_ELAPSED=$((NOW - TOTAL_START))

    PHASE_DUR=$(format_duration "$PHASE_ELAPSED")
    TOTAL_DUR=$(format_duration "$TOTAL_ELAPSED")

    # Read current session stats
    STATS=$(read_session_stats)
    if [ -n "$STATS" ]; then
      TOTAL_TOKENS=$(echo "$STATS" | sed -n '1p')
      INPUT_TOKENS=$(echo "$STATS" | sed -n '2p')
      OUTPUT_TOKENS=$(echo "$STATS" | sed -n '3p')
      COST_USD=$(echo "$STATS" | sed -n '4p')

      # Calculate delta if we have start snapshot
      STATS_START_FILE="$TIMER_DIR/${PHASE}.stats-start"
      if [ -f "$STATS_START_FILE" ]; then
        DELTA=$(python -c "
import json
with open('$STATS_START_FILE') as f:
    start = json.load(f)
with open('$SESSION_STATS') as f:
    end = json.load(f)
d_in = end.get('input_tokens',0) - start.get('input_tokens',0)
d_out = end.get('output_tokens',0) - start.get('output_tokens',0)
d_cost = end.get('cost_usd',0) - start.get('cost_usd',0)
print(f'{d_in:,}')
print(f'{d_out:,}')
print(f'{d_cost:.4f}')
" 2>/dev/null)
        if [ -n "$DELTA" ]; then
          INPUT_TOKENS=$(echo "$DELTA" | sed -n '1p')
          OUTPUT_TOKENS=$(echo "$DELTA" | sed -n '2p')
          COST_USD=$(echo "$DELTA" | sed -n '3p')
          TOTAL_TOKENS="${INPUT_TOKENS} + ${OUTPUT_TOKENS}"
        fi
        rm -f "$STATS_START_FILE"
      fi

      TOKEN_DISPLAY="${INPUT_TOKENS} / ${OUTPUT_TOKENS}"
      COST_DISPLAY="\$${COST_USD}"
    else
      TOKEN_DISPLAY="N/A"
      COST_DISPLAY="N/A"
    fi

    # Append row to log table
    echo "| ${PHASE} | ${START_HUMAN} | ${NOW_HUMAN} | ${PHASE_DUR} | ${TOTAL_DUR} | ${TOKEN_DISPLAY} | ${COST_DISPLAY} |" >> "$LOG_MD"

    # Cleanup timer file
    rm -f "$START_FILE"

    echo "⏱️ ${PHASE} 結束 — 階段耗時: ${PHASE_DUR} | 累計: ${TOTAL_DUR} | Tokens: ${TOKEN_DISPLAY} | 費用: ${COST_DISPLAY}"
    ;;

  *)
    echo "Unknown action: $ACTION. Use 'start' or 'end'." >&2
    exit 1
    ;;
esac
