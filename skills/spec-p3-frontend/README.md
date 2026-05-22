# AI Coding Workflow — spec-p3-frontend (v1.0.0)

前端實作 SKILL。讀 P2 產的 `{程式編號}_frontend_tasks.md` + 專案 `CLAUDE.md`，依 task 類型 tag 分流：**契約層（`[service]` / `[store-map]`）走 SG2 對照 api_contract A##（無 mock-based 測試）、UI 層（`[page]` / `[dialog]` 等）無測試由 PG 完工後整體手測**。

本 SKILL 是 [`spec-p2-tasking`](../spec-p2-tasking/) v3.0.0 產出後的後續：前端 session 走 `/impl-fe`，後端另起 session 走 [`/impl-be`](../spec-p3-backend/)，兩 session 共用同一份 `progress.md` 與 `session_log.md`。

---

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[service]` | **無 mock-based 測試**；SG2 對照 api_contract A##（path / method / payload / response shape 靜態檢查） | API 服務層 |
| `[store-map]` | **無 mock-based 測試**；SG2 對照 api_contract A##（後端 shape → 前端 shape mapping 靜態檢查） | Store mapping helper |
| `[store-action]` | **無測試** | ROI 低，手測涵蓋 |
| `[types]` | **無測試** | typecheck 已蓋 |
| `[page]` / `[dialog]` | **無測試** | UI/UX 由 PG 完工後手測 |
| `[i18n]` / `[router]` | **無測試** | 靜態資料 |

**為什麼改為「只做契約對照」而非「契約測試」：** AR003 BUG-P4b-R4-CONTRACT 教訓（後端 `creditAmt` vs 前端 `creditLimit`）+ SO0062 mapper camelCase 教訓（28 個 contract test fixture 都對，但實際後端已 camelCase 不一致）證明 **mock-based contract test 抓 typo OK，但跨層欄位漂移完全擋不下**。改走 SG2 對照 api_contract A##（共讀契約）這層靜態檢查 — 省 token、無 fixture 與真實 BE 漂移風險、PG 在 SG2 就能一眼看出對齊問題。UI / UX / 樣式 / 文字類 bug 人眼 1 秒看出，寫測試 ROI 極低。

---

## 核心原則

1. **契約層走靜態對照、UI 層走手測** — `[service]` / `[store-map]` 走 SG2 對照 api_contract（無 mock-based test）；UI / UX / 樣式 / 文字由 PG 手測比寫測試快 10 倍。
2. **半自動** — 契約對照 task 走 SG2/SG3、其他 task 只走 SG3。
3. **完工後整體手測** — 全部 task 做完後 PG 一次開瀏覽器照 `test_cases.md` 逐條勾選，bug ad hoc 派工（不走 SKILL）。
4. **其他共用規約** — Subagent 邊界、artifact 合一 commit、commit 標題禁 task id、讀規範不掃 code、Scope-lock 動手前必跑，詳見 `<repo>/spec-workflow-refs/p3/` 各 reference 檔。

---

## 觸發方式

- `/impl-fe` — 顯示流程說明並開始
- `/impl-fe <task-list-path>` — 直接帶入前端任務清單路徑

---

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_frontend_tasks.md`（每個 task 已標類型 tag）
2. 專案有 `CLAUDE.md` 索引（指向前端測試框架 Vitest/Jest、lint、typecheck、commit 規範、前端目錄結構等）
3. 建議已完成 `/impl-be`（後端 API 規格確定後，前端契約測試才能對準欄位）

---

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|:-:|
| SG1 | session 啟動後 | **Scope Statement**（Deliverable / 預期動到 / out-of-scope）+ 載入 + 類型分佈 + 前端硬守則清單（target CLAUDE.md + memory）+ commit-time hook 安裝 + 起始 task | 不建議 |
| SG2 | `[service]` / `[store-map]` 寫實作前 | 「實作意圖 ↔ api_contract A##」對照表審（契約對齊防護） | **不可省略**（契約對照 task）|
| SG3 | task 結束 | 審閱繼續/回修；**UI 類 task（`[page]` / `[dialog]`）報告含 grep 守則違規清單**（只報不擋） | 可降密度 |

**UI 類 task（`[page]` / `[dialog]` / `[i18n]` / `[router]` / `[types]` / `[store-action]`）** 跳過 SG2（無契約對照需求），只走 SG1 / SG3。

**無 Demo Gate** — 整個 SKILL 完工後由 PG 整體手測，SKILL 內不逐批停。

---

## 流程總覽

```
/impl-fe [task-list-path]
         ↓
[AI]  讀 frontend_tasks.md + CLAUDE.md → 讀規範文件
[AI]  讀 progress.md / session_log.md
[AI]  統計 task 類型分佈
[STOP] SG1: Scope Statement + PG 確認起始 task
         ↓
┌─ 每 task loop ─────────────────────────┐
│  讀 task + 類型 tag                      │
│                                          │
│  [service]/[store-map]:                 │
│    列「api_contract A## ↔ 預計實作 /    │
│    mapping shape」對照表                │
│    [STOP] SG2 對照表審（不寫 mock test）│
│    寫實作 → lint + typecheck            │
│    自檢偏離 → 停手由 PG 決策             │
│                                          │
│  其他類（types/store-action/page/        │
│  dialog/i18n/router）:                  │
│    寫實作（無測試）                      │
│    lint + typecheck                     │
│                                          │
│  更新 progress.md + commit              │
│  [STOP] SG3（UI 類報 grep 守則違規）    │
└─────────────────────────────────────────┘
         ↓
[AI]  全部 task 完成 → 更新 session_log.md
[AI]  建議下一步：
      1. /data 產權限 + 測資
      2. PG 照 test_cases.md 整體手測
      3. bug ad hoc 派修
[AI]  Session 歸檔
```

---

## SG2 對照表範例

### `[service]` 對照表

| api_contract A## | 預計實作 |
|---|---|
| Path: `/api/ar003CustomerInfo` | `fetch('/api/ar003CustomerInfo', ...)` |
| Method: POST | `method: 'POST'` |
| Request: `{ customerCode: string }` | `body: JSON.stringify({ customerCode })` |
| Response: `{ customerCode, creditAmt: number \| null }` | `await res.json()` 取 `customerCode` / `creditAmt` |

### `[store-map]` 對照表

| api_contract A## Response 欄位 | 預計 mapping 出的前端欄位 | 處理方式 |
|---|---|---|
| `customerCode: string` | `customerCode: string` | 直接對應 |
| `creditAmt: number \| null` | `creditLimit: number` | rename + null 預設 0 |
| `deprecated_field`（後端多餘） | （前端忽略） | 不進入前端 shape |

對照表覆蓋三類欄位處理：正常欄位（type / 巢狀層對齊）、後端 null / undefined 欄位（前端預設值）、後端多餘欄位（前端忽略）。PG 在 SG2 一眼看出對齊問題，比寫 mock fixture 跑 vitest 更省 token。

---

## 目錄結構

```
spec-p3-frontend/
├── README.md      ← 本文件
├── SKILL.md       ← Claude Code Skill 定義
└── templates/
    └── hooks/
        └── typecheck-test-on-commit.ps1  ← commit-time hook 腳本（npm + vitest）
```

共用規約（Scope Statement / commit rules / hand-off / progress 格式 / 歸檔 / hook 設計脈絡）抽到 `<repo>/spec-workflow-refs/p3/`，與 `spec-p3-backend` / `spec-p3-data` 共用。

---

## 快速開始

### 1. 確認 P2 產出已就緒且 backend session 已完成

- `Docs/spec/{程式編號}/plan/{程式編號}_frontend_tasks.md` 存在
- 每個 task 有類型 tag
- 建議後端 `/impl-be` 已完成（API shape 確定）

### 2. 於專案 repo 目錄執行

```
/impl-fe
```

### 3. AI 執行步驟

1. 讀 task list + CLAUDE.md 索引 → 規範文件
2. 檢查 progress.md（resume 偵測，讀 `F*` 相關進度）
3. SG1 報告類型分佈
4. Task loop（依 tag 分流）
5. 完工後更新 session_log.md、歸檔

### 4. 後續流程

- [`/data`](../spec-p3-data/) — 權限 + 測資 SQL
- PG 照 `test_cases.md` 整體手測
- bug → ad hoc 派 AI 修

---

## 相關連結

- [`spec-p2-tasking`](../spec-p2-tasking/) — 產 frontend_tasks.md（含類型 tag）
- [`spec-p3-backend`](../spec-p3-backend/) — 後端實作 /impl-be
- [`spec-p3-data`](../spec-p3-data/) — 權限 + 測資 /data
- [主 README](../../README.md) — Skill catalog
