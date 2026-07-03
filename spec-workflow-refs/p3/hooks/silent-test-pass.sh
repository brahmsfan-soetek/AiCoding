#!/usr/bin/env bash
# PostToolUse hook — matcher: Bash
# 成功靜默，失敗詳述：測試通過時吞掉全量輸出，只留一行；失敗時原樣輸出不截斷
# ⚠️ 設計範本（抽救自 eap-agentic-coding，commit 81cbd5e^）：
#    使用 eap 時代的環境變數介面（TOOL_OUTPUT）。
#    現行 Claude Code hook 介面為 stdin JSON — 接線前必須依 hooks/README.md 改寫，
#    否則 OUTPUT 永遠為空 → hook 永不生效（靜默失效）。
OUTPUT="${TOOL_OUTPUT:-}"
if echo "$OUTPUT" | grep -qE '(BUILD SUCCESS|Tests run:.*Failures: 0)'; then
  echo "✅ 全部測試通過" >&2
  exit 2  # exit 2 = 將 stderr 作為替換輸出注入 context
fi
# 失敗時原樣輸出，不截斷
