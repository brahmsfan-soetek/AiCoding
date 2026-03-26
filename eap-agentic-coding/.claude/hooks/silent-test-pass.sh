#!/usr/bin/env bash
# PostToolUse hook — matcher: Bash
# 成功靜默，失敗詳述（跨模組共用）
OUTPUT="${TOOL_OUTPUT:-}"
if echo "$OUTPUT" | grep -qE '(BUILD SUCCESS|Tests run:.*Failures: 0)'; then
  echo "✅ 全部測試通過" >&2
  exit 2  # exit 2 = 將 stderr 作為替換輸出注入 context
fi
# 失敗時原樣輸出，不截斷
