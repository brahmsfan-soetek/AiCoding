# AI Coding Workflow — spec-p3-backend (v1.2.0)

後端 TDD 驅動實作 SKILL。讀 P2 產的 `{程式編號}_backend_tasks.md` + 專案 `CLAUDE.md`，依 task 類型 tag 分流測試策略，逐 task 實作。

本 SKILL 是 [`spec-p2-tasking`](../spec-p2-tasking/) v3.0.0 產出後的後續：後端 session 走 `/impl-be`，前端另起 session 走 [`/impl-fe`](../spec-p3-frontend/)，兩 session 共用同一份 `progress.md` 與 `session_log.md`。

---

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[validator]` | **完整 TDD**（JUnit 純或 Mockito，Red-Green 迴圈）；task 帶規則原文時測試 case 逐條對應 | 純函式 / 演算法 / 狀態機 |
| `[processor]` | **無 mock-based 單元測試**；SG2 走 api_contract A## + current_schema 雙對照 + 規則複述（靜態檢查） | Processor mock test 是「mock 設成預期再驗自己」的套套邏輯；整合驗證由 PG 手測涵蓋 |
| `[sql]` | **無 P3 測試**；SG2 對照 current_schema 欄位 / 型別 | SQL 行為由 PG 手測涵蓋 |
| `[entity]` | **無測試**；SG2 對照 current_schema 欄位 / 型別 / nullable | 純 POJO，無邏輯 |
| `[spi]` | **無測試** | 抽象介面，無邏輯 |

**SG2 `[processor]` 對照表 + 規則複述：** 寫實作前先列 (1) `api_contract A## Response 欄位` ↔ `預計實作 response shape`、(2) `current_schema 表欄位` ↔ `SQL / Entity 引用欄位` 兩張對照表，加 (3) 規則複述（task 規則原文 → 預計實作一句話）給 PG 審。shape 對照擋跨層漂移，規則複述擋語意偏差（`(計算)` 欄位 shape 全對仍可能算錯）。案例史見 [`rationale.md`](../../spec-workflow-refs/rationale.md)。

---

## 核心原則

1. **半自動** — 每個 task 前 stop gate 確認，完成後問要不要繼續。
2. **Subagent 不產出進 git 的檔案** — 實作 / 測試 code 必須由主 session 撰寫。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。
4. **Artifact 即 commit** — progress.md / session_log.md 跟 code 一起 commit。
5. **類型 tag 驅動測試策略** — 不再逐 task 問「要 Mockito 還是 Quarkus」。
6. **Scope-lock 動手前必跑** — SG1 第一個子段為 Scope Statement（Deliverable / 預期動到 / out-of-scope）；實作中發現需超出 scope → STOP 回報，不自行擴張。

---

## 觸發方式

- `/impl-be` — 顯示流程說明並開始
- `/impl-be <task-list-path>` — 直接帶入後端任務清單路徑

---

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_backend_tasks.md`（每個 task 已標類型 tag、`[processor]` 已填「選填欄位」清單）
2. 專案有 `CLAUDE.md` 索引（指向測試框架、lint、typecheck、commit 規範、backend 目錄結構等）

---

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|:-:|
| SG1 | session 啟動後 | **Scope Statement**（Deliverable / 預期動到 / out-of-scope）+ 確認載入、類型分佈、commit-time hook 安裝、起始 task | 不建議 |
| SG2 | `[validator]` 寫測試前 / `[processor]` 寫實作前 | `[validator]` 走測試清單審（含規則原文 ↔ case 對應）；`[processor]` 走雙對照表 + 規則複述審 | **不可省略** |
| SG3 | task 結束（commit 後） | 審閱繼續/回修 | 可降密度（每 N task 一次）|

**`[sql]` / `[entity]` / `[spi]` task** 走簡化版 SG2（對照 current_schema 欄位 / 型別 / nullable），無測試清單。

---

## 流程總覽

```
/impl-be [task-list-path]
         ↓
[AI]  讀 backend_tasks.md + CLAUDE.md → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈
[STOP] SG1: Scope Statement + PG 確認起始 task
         ↓
┌─ 每 task loop ─────────────────────────┐
│  讀 task + 類型 tag                      │
│                                          │
│  [validator]:                           │
│    列單元測試清單                        │
│    [STOP] SG2 測試清單審                 │
│    寫測試 Red → 寫實作 Green             │
│    lint + typecheck + git diff 自檢     │
│                                          │
│  [processor]:                           │
│    列雙對照表（api_contract A## ↔       │
│    response shape / current_schema ↔    │
│    SQL/Entity 欄位）+ 規則複述          │
│    [STOP] SG2 對照表 + 規則複述審        │
│    寫實作（無 mock test）→ lint + tc    │
│                                          │
│  [sql]/[entity]/[spi]:                  │
│    對照 current_schema → 寫實作（無測試）│
│    lint + typecheck                     │
│                                          │
│  更新 progress.md + commit              │
│  [STOP] SG3                             │
└─────────────────────────────────────────┘
         ↓
[AI]  全部 task 完成 → 更新 session_log.md
[AI]  建議：另起 session 執行 /impl-fe
```

---

## Checkpoint / Session Log 格式

完整格式（含 progress.md / session_log.md / 維護期 hand-off 段範例）見 [`<repo>/spec-workflow-refs/p3/progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md)。

- `Docs/spec/{程式編號}/log/{程式編號}_progress.md` — 與 p3-frontend 共用，task prefix `B*` / `F*` 區分
- `Docs/spec/{程式編號}/log/{程式編號}_session_log.md` — 與 p3-frontend / p3-data 共用，每 session append

---

## 目錄結構

```
spec-p3-backend/
├── README.md      ← 本文件
├── SKILL.md       ← Claude Code Skill 定義
└── templates/
    └── hooks/
        └── typecheck-test-on-commit.ps1  ← commit-time hook 腳本（Maven）
```

共用規約（Scope Statement / commit rules / hand-off / progress 格式 / hook 設計脈絡）抽到 `<repo>/spec-workflow-refs/p3/`，與 `spec-p3-frontend` / `spec-p3-data` 共用；歷史教訓集中於 `<repo>/spec-workflow-refs/rationale.md`。

---

## 快速開始

### 1. 確認 P2 產出已就緒

- `Docs/spec/{程式編號}/plan/{程式編號}_backend_tasks.md` 存在
- 每個 task 有類型 tag
- `[processor]` 類有「選填欄位」欄
- 帶計算 / 比較規則的 task 有「規則原文」區塊

### 2. 於專案 repo 目錄執行

```
/impl-be
```

或指定任務清單路徑：

```
/impl-be Docs/spec/AR004/plan/AR004_backend_tasks.md
```

### 3. AI 執行步驟

1. 讀 task list + CLAUDE.md 索引 → 規範文件
2. 檢查 progress.md（resume 偵測）
3. SG1 報告類型分佈，PG 確認起始點
4. Task loop（依 tag 分流）
5. 完工後更新 session_log.md（含維護期 hand-off）

### 4. 後續流程

- **另起 session** 執行 [`/impl-fe`](../spec-p3-frontend/)（前端實作）
- 前後端都做完 → [`/data`](../spec-p3-data/)（權限 + 測資）
- PG 照 `test_cases.md` 手測

---

## 相關連結

- [`spec-p2-tasking`](../spec-p2-tasking/) — 產 backend_tasks.md（含類型 tag、選填欄位）
- [`spec-p3-frontend`](../spec-p3-frontend/) — 前端實作 /impl-fe
- [`spec-p3-data`](../spec-p3-data/) — 權限 + 測資 /data
- [主 README](../../README.md) — Skill catalog
