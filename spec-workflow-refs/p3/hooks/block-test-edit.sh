#!/usr/bin/env bash
# PreToolUse hook — matcher: Edit|Write
# 測試檔案唯讀強制：實作階段結構性阻擋 AI 修改測試檔案（不靠 agent 自律）
# ⚠️ 設計範本（抽救自 eap-agentic-coding，commit 81cbd5e^）：
#    使用 eap 時代的環境變數介面（TOOL_INPUT_file_path）。
#    現行 Claude Code hook 介面為 stdin JSON — 接線前必須依 hooks/README.md 改寫，
#    否則 FILE_PATH 永遠為空 → hook 永不攔截（靜默失效）。
FILE_PATH="${TOOL_INPUT_file_path:-}"
if echo "$FILE_PATH" | grep -qiE '(Test|\.test\.|\.spec\.|_test\.)'; then
  echo "❌ 實作階段禁止修改測試檔案 — 記錄疑問供 PG 裁決" >&2
  exit 2
fi
