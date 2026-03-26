#!/usr/bin/env bash
# PreToolUse hook — matcher: Edit|Write
# Phase 2 禁止 Code Agent 修改測試檔案（跨模組共用）
FILE_PATH="${TOOL_INPUT_file_path:-}"
if echo "$FILE_PATH" | grep -qiE '(Test|\.test\.|\.spec\.|_test\.)'; then
  echo "❌ Phase 2 禁止修改測試檔案 — 記到 review_notes.md 供 P3 裁決" >&2
  exit 2
fi
