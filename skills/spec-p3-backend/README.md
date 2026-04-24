# AI Coding Workflow — spec-p3-backend (v1.0.0)

後端 TDD 驅動實作 SKILL。讀 P2 產的 `{程式編號}_backend_tasks.md` + 專案 `CLAUDE.md`，依 task 類型 tag 分流測試策略，逐 task 實作。

本 SKILL 是 [`spec-p2-tasking`](../spec-p2-tasking/) v3.0.0 產出後的後續：後端 session 走 `/impl-be`，前端另起 session 走 [`/impl-fe`](../spec-p3-frontend/)，兩 session 共用同一份 `progress.md` 與 `session_log.md`。

---

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[validator]` | **完整 TDD**（JUnit 純或 Mockito，Red-Green 迴圈） | 純函式 / 演算法 / 狀態機 |
| `[processor]` | **完整 TDD**（Mockito）+ **SG2 覆蓋度強制規則** | 每個選填欄位必須覆蓋 null / `""` / 空白 |
| `[sql]` | **無 P3 測試** | SQL 行為由 PG 手測涵蓋 |
| `[entity]` | **無測試** | 純 POJO，無邏輯 |
| `[spi]` | **無測試** | 抽象介面，無邏輯 |

**SG2 `[processor]` 空值覆蓋強制規則的由來：** AR003 F7 教訓 — `:param IS NULL OR col = :param` SQL pattern 在選填欄位傳 `""` 時會讓所有 row 不 match（因為 `"" != NULL`），導致查詢永遠空結果。強制產生 null / `""` / 空白三種測試案例可在 P3 階段抓住此類 bug。

---

## 核心原則

1. **半自動** — 每個 task 前 stop gate 確認，完成後問要不要繼續。
2. **Subagent 不產出進 git 的檔案** — 實作 / 測試 code 必須由主 session 撰寫。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。
4. **Artifact 即 commit** — progress.md / session_log.md 跟 code 一起 commit。
5. **類型 tag 驅動測試策略** — 不再逐 task 問「要 Mockito 還是 Quarkus」。

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
| SG1 | session 啟動後 | 確認載入、類型分佈、起始 task | 不建議 |
| SG2 | `[validator]` / `[processor]` 寫測試前 | 覆蓋度防護（Processor 強制選填欄位空值覆蓋）| **不可省略** |
| SG3 | task 結束（commit 後） | 審閱繼續/回修 | 可降密度（每 N task 一次）|

**`[sql]` / `[entity]` / `[spi]` task** 跳過 SG2（無測試可審），只走 SG1 / SG3。

---

## 流程總覽

```
/impl-be [task-list-path]
         ↓
[AI]  讀 backend_tasks.md + CLAUDE.md → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈
[STOP] SG1: PG 確認起始 task
         ↓
┌─ 每 task loop ─────────────────────────┐
│  讀 task + 類型 tag                      │
│                                          │
│  [validator]/[processor]:               │
│    列測試清單（Processor 強制空值覆蓋）  │
│    [STOP] SG2                           │
│    寫測試 Red → 寫實作 Green             │
│    lint + typecheck + git diff 自檢     │
│                                          │
│  [sql]/[entity]/[spi]:                  │
│    寫實作（無測試）                      │
│    lint + typecheck                     │
│                                          │
│  更新 progress.md + commit              │
│  [STOP] SG3                             │
└─────────────────────────────────────────┘
         ↓
[AI]  全部 task 完成 → 更新 session_log.md
[AI]  建議：另起 session 執行 /impl-fe
[AI]  Session 歸檔 → ~/.soetek-ai-coding/
```

---

## Checkpoint 格式

`Docs/spec/{程式編號}/log/{程式編號}_progress.md`（與 p3-frontend 共用，task prefix `B*` / `F*` 區分）

```markdown
# {程式編號} — P3 Progress

> 最後更新：2026-04-25 14:30
> 當前分支：feature/ar004
> HEAD：a1b2c3d

## Task 清單來源
- backend: Docs/spec/{程式編號}/plan/{程式編號}_backend_tasks.md
- frontend: Docs/spec/{程式編號}/plan/{程式編號}_frontend_tasks.md

## 進度（只列已接觸 task）

| Task ID | 類型 | 狀態 | Commit | 備註 |
|---------|------|:----:|--------|------|
| B01 | [entity] | done | a1b2c3d | |
| B40 | [validator] | done | e4f5g6h | SG2 增加空值邊界測試 |
| B20 | [processor] | wip | — | Red 階段，測試已寫完 |

## 下一 Task 候選
- B21（processor，選填欄位：customerCode, riskLevel）
- B30（sql）
```

---

## Session Log 格式

`Docs/spec/{程式編號}/log/{程式編號}_session_log.md`（與 p3-frontend 共用，每 session append）

```markdown
## Session #1 — 2026-04-20 後端（B01–B40）

### 關鍵決策
- Entity 風格採 record class（專案慣例）

### 問題與教訓
- B40 格式化邏輯在規格中有歧義，跟 SA 確認後採 FIFO

### 下 session 注意
- B20 Processor 實作前，確認 CustomerQuery 的 SQL provider SPI 已就緒
```

---

## 目錄結構

```
spec-p3-backend/
├── README.md      ← 本文件
└── SKILL.md       ← Claude Code Skill 定義
```

本 SKILL 無 templates/，所有內容直接在 SKILL.md 內。

---

## 快速開始

### 1. 確認 P2 產出已就緒

- `Docs/spec/{程式編號}/plan/{程式編號}_backend_tasks.md` 存在
- 每個 task 有類型 tag
- `[processor]` 類有「選填欄位」欄

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
5. 完工後更新 session_log.md、歸檔

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
