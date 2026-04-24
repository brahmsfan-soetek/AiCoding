# AI Coding Workflow — spec-p2-tasking (v3.0.0)

在專案 repo 目錄下執行，根據最終版規格統計與 `CLAUDE.md` 索引指向的規範文件，產出三份 artifact：

1. **`{編號}_frontend_tasks.md`** — 前端任務清單，每個 task 標類型 tag（`[service]` / `[store-map]` / `[store-action]` / `[types]` / `[page]` / `[dialog]` / `[i18n]` / `[router]`）
2. **`{編號}_backend_tasks.md`** — 後端任務清單，每個 task 標類型 tag（`[validator]` / `[processor]` / `[sql]` / `[entity]` / `[spi]`），`[processor]` 類額外填「選填欄位」清單
3. **`{編號}_test_cases.md`** — 手測 checklist（含「狀態」欄供 PG 勾選 ☐/✅/❌/⚠️）

本 SKILL 接續 [`spec-p1-digest-flow`](../spec-p1-digest-flow/) S0–S4 之後：在 SA 資料夾完成規格消化後，把最終規格與 UI 截圖搬到專案 repo，切換目錄執行 `/tasking`。

---

## 為何獨立於 spec-p1-digest-flow

S1–S4（規格統計、釐清、整合）是純文件作業，在隔離的 SA 資料夾就能完成。
但任務清單必須貼合專案既有規範——這些資訊記錄在專案 `CLAUDE.md` 索引指向的規範文件中。因此把任務清單階段從原流程拆出，改於專案目錄下執行。

---

## 類型 tag 的用途

類型 tag 是 **P3 分流測試策略的唯一依據**。

### 後端 tag

| Tag | 含義 | P3-backend 測試策略 |
|---|---|---|
| `[validator]` | 驗證器 / 純函式 / 演算法 / 狀態機 | 完整 TDD |
| `[processor]` | API Processor | 完整 TDD + SG2 強制覆蓋選填欄位 null/""/空白 |
| `[sql]` | SQL YAML / DDL | 無 P3 測試（手測涵蓋） |
| `[entity]` | Entity / Domain | 無測試 |
| `[spi]` | SPI 介面 | 無測試 |

### 前端 tag

| Tag | 含義 | P3-frontend 測試策略 |
|---|---|---|
| `[service]` | API 服務層 | 契約測試（mock fetch） |
| `[store-map]` | Store mapping helper | 契約測試（後端 shape → 前端 shape） |
| `[store-action]` | Store action | 無測試 |
| `[types]` | TypeScript type | 無測試（typecheck 已蓋） |
| `[page]` / `[dialog]` | UI 元件 | 無測試（PG 手測） |
| `[i18n]` / `[router]` | 靜態資料 | 無測試 |

---

## 核心原則

1. **規格統計 = 唯一權威來源** — UI 截圖僅供排版參考，衝突時以規格統計為準。
2. **讀規範、不掃 code** — 專案 context 來自 CLAUDE.md 索引（deterministic），不掃 code 歸納 pattern。
3. **類型 tag 必填** — 每個 task 必須標 tag。
4. **Processor 必列選填欄位** — 供 P3-backend SG2 覆蓋度檢核。
5. **test_cases.md = 手測 checklist** — 不是自動化 spec，而是 PG 照著對的清單。
6. **Artifact 即 commit** — 產出後立即 commit，避免 working tree 丟失。
7. **PG 是品質守門人** — AI 產出後需 PG 審閱再進入實作。

---

## 觸發方式

- `/tasking` — 顯示流程說明並開始
- `/tasking <程式編號>` — 直接帶入程式編號

---

## 前置條件

1. 在 SA 資料夾透過 `spec-p1-digest-flow` 完成 S0–S4，產出 `{程式編號}_規格統計_最終版.md`
2. 將最終規格 + UI 截圖（PNG）搬入當前專案目錄
3. 當前工作目錄為**專案 repo**（非 SA 資料夾）

---

## 流程總覽

```
┌──────────── 專案 Context 建立（不可省略）────────────┐
│  [AI] 讀 CLAUDE.md 索引 + 規範文件                   │
│       前端規範 / 後端規範 / 測試規範                 │
│  [AI] 不掃 code 歸納 pattern                         │
│                                                       │
│  若無 CLAUDE.md → fallback 通用骨架分類              │
└───────────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────── 辨識輸入材料 ────────────┐
│  [AI] 讀取當前目錄的：                │
│       - {編號}_規格統計_最終版.md     │
│       - UI 截圖 PNG                   │
└───────────────────────────────────────┘
                      │
                      ▼
┌──────────── PG 確認 ─────────────────┐
│  [PG] 確認程式編號                    │
│  [PG] 確認輸出位置                    │
│       （建議預設 Docs/spec/{程式編號}/plan/）│
└───────────────────────────────────────┘
                      │
                      ▼
┌──────────── 任務清單產出 ────────────┐
│  [AI] 同時產出三份 artifact：          │
│       - frontend_tasks.md（含 tag）   │
│       - backend_tasks.md（含 tag +    │
│         Processor 選填欄位）          │
│       - test_cases.md（手測 checklist │
│         含「狀態」欄）                 │
└───────────────────────────────────────┘
                      │
                      ▼
       Commit artifact → PG 審閱 → 
       另起 session：/impl-be → /impl-fe → /data → PG 手測
```

---

## 輸出產物

| 檔名 | 內容 |
|------|------|
| `{編號}_frontend_tasks.md` | 前端清單，每個 task 標類型 tag |
| `{編號}_backend_tasks.md` | 後端清單，每個 task 標類型 tag，`[processor]` 類額外填「選填欄位」 |
| `{編號}_test_cases.md` | 手測 checklist，6 欄：# / 測試案例 / 前置條件 / 執行步驟 / 預期結果 / 狀態 |

建議放 `Docs/spec/{程式編號}/plan/` 子目錄（對齊 P3 的 `log/` 子目錄結構）。

---

## 目錄結構

```
spec-p2-tasking/
├── README.md                              ← 本文件
├── SKILL.md                               ← Claude Code Skill 定義
├── .claude-plugin/
│   └── plugin.json
│
└── templates/
    ├── prompts/
    │   └── 任務清單_prompt.md
    │
    └── outputs/
        ├── 前端任務清單模板.md
        ├── 後端任務清單模板.md
        └── 測試清單模板.md
```

---

## 快速開始

### 1. 從 SA 資料夾搬材料進專案 repo

- 複製 `{編號}_規格統計_最終版.md`
- 複製 UI 截圖 PNG

### 2. 於專案 repo 目錄執行

```
/tasking AR004
```

### 3. AI 執行步驟

1. 讀取專案 `CLAUDE.md` 索引
2. 依索引讀取前端 / 後端 / 測試規範文件
3. 辨識當前目錄的規格統計檔與 UI 截圖
4. 詢問輸出位置（建議預設 `Docs/spec/{程式編號}/plan/`）
5. 一次產出三份 artifact，每個 task 標類型 tag

### 4. PG 審閱 → Commit → 另起 session 進入 P3

審閱重點：
- 每個 task 是否都正確標註類型 tag
- 每個 `[processor]` 是否都列出「選填欄位」清單（無選填欄位時填「無」明示）
- 測試清單每個案例的執行步驟是否具體到可直接照做
- 任何標記 ⚠️ 的項目是否已確認

### 5. 後續流程

- **P3-backend** [`spec-p3-backend`](../spec-p3-backend/)  `/impl-be`
- **P3-frontend** [`spec-p3-frontend`](../spec-p3-frontend/) `/impl-fe`
- **P3-data** [`spec-p3-data`](../spec-p3-data/) `/data`
- **PG 手測** — 開瀏覽器照 `test_cases.md` 勾選，ad hoc 派修

---

## 版本歷史

### v3.0.0（2026-04-24）

- **新增類型 tag** — 每個 task 必標，供 P3 分流測試策略
- **Processor 新增「選填欄位」欄** — 供 P3-backend SG2 覆蓋度檢核，對齊 AR003 F7 教訓
- **test_cases.md 改為手測 checklist 格式** — 新增「狀態」欄供 PG 勾選（配合廢除 P4a/P4b）
- **輸出位置建議改為 `Docs/spec/{程式編號}/plan/`** — 配合 P3 `log/` 子目錄
- **artifact 即 commit 原則**

### v2.0.0（2026-04-16）

- 專案 context 改讀 CLAUDE.md 索引，不再掃 code
- 通用五層骨架分類取代 eap 特化的 A-F / A-E / A-I 分類
- 測試清單 5 欄格式（# / 案例 / 前置條件 / 執行步驟 / 結果）
- task 欄位含依賴 + 驗收條件

---

## 相關連結

- [`spec-p1-digest-flow`](../spec-p1-digest-flow/) — P1 規格消化流程
- [`spec-p3-backend`](../spec-p3-backend/) — P3 後端 tag 分流 TDD
- [`spec-p3-frontend`](../spec-p3-frontend/) — P3 前端契約測試 + demo
- [`spec-p3-data`](../spec-p3-data/) — P3 權限 + 測資 SQL
- [主 README](../../README.md) — Skill catalog 與設計原則
