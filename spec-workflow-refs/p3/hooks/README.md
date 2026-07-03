# 結構性 hook 範本 — 測試唯讀強制 + 成功靜默

> **來源：** 抽救自 eap-agentic-coding（G3 2026-05-29 優先序 3：「砍 eap 前必先抽救 2 hook」；原檔位於 commit `81cbd5e^` 的 `skills/eap-agentic-coding/.claude/hooks/`）。
> **定位：** 這兩個 hook 是整套 skills 裡唯一完整落實 03 P6（hooks 確定性控制）+ P7（成功靜默、失敗詳述）的範例。抽救的是**設計**，不是 eap 流程架構（架構已依 G3 砍除）。
> **與 commit-hook 的關係：** [`../commit-hook/`](../commit-hook/README.md) 屬 typecheck/test 層（commit 時擋）；本目錄兩個 hook 屬「工具呼叫層」（Edit/Write 當下擋、Bash 輸出當下瘦身），互補不重疊。

## 兩個範本

| Hook | 事件 | 作用 | 對應原則 |
|---|---|---|---|
| `block-test-edit.sh` | PreToolUse（Edit\|Write） | 實作階段**結構性阻擋**修改測試檔（檔名含 `Test` / `.test.` / `.spec.` / `_test.`），不靠 agent 自律 | 03 P6：主線目前只有 `git diff` 事後自檢（`[validator]` test-to-fit 防護），本 hook 是**事前阻擋**的升級選項 |
| `silent-test-pass.sh` | PostToolUse（Bash） | 測試全過 → 吞掉全量輸出只留一行「✅ 全部測試通過」；失敗 → 原樣輸出不截斷 | 03 P7 / 反模式 #8：數千行通過輸出灌 context 會誘發幻覺；成功應靜默 |

## ⚠️ 接線前必讀（不可直接安裝）

兩個 script 保留 eap 時代的**環境變數介面**（`TOOL_INPUT_file_path` / `TOOL_OUTPUT`）。**現行 Claude Code hook 介面是 stdin JSON**（參考 [`../commit-hook/README.md`](../commit-hook/README.md) 的框架：script 從 stdin 讀 JSON、取 `tool_input.file_path` / `tool_response`）。

直接照抄的後果是**靜默失效**：環境變數不存在 → 變數為空 → 條件永不成立 → hook 看似安裝成功但從不攔截。改寫時的驗收方式：故意 Edit 一個測試檔，確認真的被 block。

Windows 環境亦可比照 `commit-hook/settings.local.json.tmpl` 的模式改寫成 PowerShell（`.ps1`）。

## 註冊片段（eap 原始設計，供改寫參考）

```jsonc
// .claude/settings.local.json（gitignored，個人試用）
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/block-test-edit.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/silent-test-pass.sh" }] }
    ]
  }
}
```

## 使用時機（可選，未排入主線流程）

- `block-test-edit.sh`：適合 `[validator]` TDD 的 Green 階段（測試已定案、只准改實作）。注意 Red 階段**本來就要寫測試檔**，若全程開啟會擋掉正常流程——eap 原設計是「Phase 2 啟動時加入、結束後移除」，主線若採用需比照「進 Green 前開、task 收尾關」的開關時機，或只在 PG 懷疑 test-to-fit 時開。
- `silent-test-pass.sh`：無時機限制，任何跑測試的 session 都受益；grep pattern（`BUILD SUCCESS` / `Tests run:.*Failures: 0`）是 Maven 格式，vitest/jest 需另配 pattern。
