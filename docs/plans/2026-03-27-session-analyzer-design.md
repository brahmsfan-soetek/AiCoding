# Session Analyzer Skill — Design Document

**Date**: 2026-03-27
**Status**: Approved

---

## Overview

在 AiCoding marketplace 新增第三個 plugin `session-analyzer`，用途是分析 Claude Code session 的 token 用量、時間、sub-agent 明細等資訊。

## Skill 定位

- **名稱**: `session-analyzer`
- **位置**: `session-analyzer/` 目錄，註冊在 `.claude-plugin/marketplace.json`
- **觸發**: `/session-analyzer` slash command

## 目錄結構

```
session-analyzer/
├── .claude-plugin/
│   └── plugin.json
├── SKILL.md
└── scripts/
    └── analyze.mjs
```

## 參數設計

### 用戶參數（slash command）

| 用法 | 說明 |
|------|------|
| `/session-analyzer` | 預設：分析當前 session（摘要版） |
| `/session-analyzer -list` | 列出最近 N 筆 session 供選擇 |
| `/session-analyzer -d` | 當前 session 完整版（含 per-turn 明細） |
| `/session-analyzer -list -d` | 選擇 session + 完整版 |

### 腳本 CLI 參數

| 腳本參數 | 說明 |
|----------|------|
| `--session=current` | 分析當前 session（自動定位最新 JSONL） |
| `--session=<uuid>` | 分析指定 session |
| `--list` | 列出最近 sessions |
| `--detail` | 輸出完整版 |
| `--cwd=<path>` | 指定專案路徑（預設 process.cwd()） |

## 資料來源

### 定位流程

```
1. 當前 session：
   ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl      ← 主對話
   ~/.claude/projects/<encoded-cwd>/<sessionId>/subagents/*.jsonl  ← 子代理

2. -list 模式：
   掃描 ~/.claude/projects/<encoded-cwd>/*.jsonl
   → 按修改時間排序，列出最近 N 筆
   → 用戶選擇後，走同樣的解析路徑
```

### 解析欄位

| 欄位 | 來源 |
|------|------|
| session ID | 檔名（UUID.jsonl） |
| model | assistant entry → `message.model` 或 usage 區塊 |
| 起止時間 | 首/末 entry 的 `timestamp` |
| input_tokens | `message.usage.input_tokens` |
| output_tokens | `message.usage.output_tokens` |
| cache_creation_input_tokens | `message.usage.cache_creation_input_tokens` |
| cache_read_input_tokens | `message.usage.cache_read_input_tokens` |
| agent 派發 | assistant content 中 `tool_use` name=Agent → description, subagent_type, model |
| tool 使用 | assistant content 中所有 `tool_use` → 統計各 tool 呼叫次數 |
| 檔案讀寫 | Read/Write/Edit tool_use → 收集路徑 |

**子代理對應**：主對話的 Agent tool_use 出現時 → 用 `subagents/` 目錄下的 JSONL 按時間戳匹配。

## 輸出格式

### 摘要版（預設）

```markdown
# Session Analysis

- **Session ID**: `xxxxxxxx-xxxx-...`
- **Model**: claude-opus-4-6 (1M context)
- **CLI Version**: 2.1.84
- **Start**: 2026-03-26T03:52:48Z
- **End**: 2026-03-26T05:45:14Z
- **Wall-Clock**: 112m 26s  [估算] 首末訊息時間差

## Token Summary

| Role | Turns | Output | Cache Create | Cache Read | Total |
|------|------:|-------:|------------:|-----------:|------:|
| Main | 131 | 31,191 | 279,341 | 9,548,310 | 9,858,842 |
| Sub: ... | ... | ... | ... | ... | ... |
| **TOTAL** | **1041** | ... | ... | ... | ... |

## Sub-Agent Overview

| # | Time | Description | Type | Turns | Duration | Output Tokens |
|---|------|-------------|------|------:|----------|--------------|
| 1 | 03:55 | Explore TM Module | Explore | 58 | 1m18s | 8,212 |
| ... |

## Tool Usage

| Tool | Count |
|------|------:|
| Read | 87 |
| Edit | 77 |
| ... |
```

### 完整版（`-d`）額外加上

- **Timeline**（ASCII 樹狀時間線）
- **每個 Agent 的 Per-Turn Detail**（每 turn token 明細 + 動作摘要）
- **Files Created / Modified 清單**
- **Key Observations**（腳本根據數據自動產生）

## 附註規則

凡非直接從 JSONL 欄位讀取的數值，都要標註來源：

| 項目 | 來源 | 附註 |
|------|------|------|
| Wall-Clock | 末 timestamp - 首 timestamp | `[估算] 首末訊息時間差` |
| Duration（子代理） | 子代理 JSONL 首末 timestamp 差 | `[估算] 子代理首末訊息時間差` |
| Cache Read 佔比 % | cache_read / total 計算 | `[計算]` |
| 各 agent token 佔比 % | agent total / grand total | `[計算]` |
| Key Observations | 腳本根據數據產生 | `[自動產生] 由腳本根據數據推導` |

直接讀取的欄位（input_tokens, output_tokens, cache_*, timestamp, model 等）不加附註。

## SKILL.md 職責

SKILL.md 不做解析，只負責：

1. **解讀用戶參數** → 轉成腳本 CLI 參數
2. **執行腳本** → `node <skill-dir>/scripts/analyze.mjs [args]`
3. **呈現結果** → 將腳本 stdout（markdown）直接輸出給用戶
4. **-list 模式互動** → 腳本印出清單，Claude 問用戶選哪個，再帶 session ID 重新執行

## Claude 行為流程

```
用戶: /session-analyzer [-list] [-d]
  │
  ├─ 無 -list → node analyze.mjs --session=current [--detail]
  │              → 輸出 markdown 給用戶
  │
  └─ 有 -list → node analyze.mjs --list
               → 印出 session 清單（編號 + 時間 + cwd 摘要）
               → Claude 問用戶選哪個
               → node analyze.mjs --session=<uuid> [--detail]
               → 輸出 markdown 給用戶
```

## 技術選型

- **方案**: Node.js 腳本（方案 A）
- **理由**: Claude Code 自帶 Node 環境、JSONL 解析邏輯清楚、參考範例 `full-analysis.mjs` 已驗證可行
