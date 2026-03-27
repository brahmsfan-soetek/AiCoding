---
name: eap-agentic-coding-lite
description: >
  eap 規格驅動開發 Demo 版 — 快速從規格書（DOCX 或 MD+圖片）+ HTML 畫面 + DDL + 邏輯文件產出可運行程式碼。
  涵蓋規格衝突檢查、任務拆解、模板驅動實作。
  不適用於單檔修正、純重構、無規格書的探索式開發。
---

# eap-agentic-coding-lite

> Demo 專用精簡版。目標 30 分鐘內完成一個模組從規格到可運行程式碼。
> 同一 session 連續執行 P0 → P1-lite → P2-lite，無需切換 Agent。

**專案**：eap（Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL）

## 適用條件

**適用**：eap 的規格驅動功能開發（規格書 DOCX 或 MD+圖片 + HTML 畫面 + DDL/CSV + 邏輯文件）
**不適用**：輕量 bug 修正、純重構、無規格書的探索式開發、單檔小改動

---

## 流程總覽

```
P0（規格衝突檢查）→ P1-lite（任務拆解）→ P2-lite（模板驅動實作）
```

同一 session 連續執行，無需切換 Agent。不寫測試、不跑測試、無 hooks。

---

## Setup（首次使用）

首次啟動時檢查 eap 專案根目錄下是否已有 `.agentic/config.json`。若不存在，詢問使用者以下資訊並建立：

| 資訊 | 說明 | 範例 |
|------|------|------|
| 模組代號 | 決定 package、檔案命名、路由前綴 | `TM003` |
| 模組名稱 | 用於日誌和 API 描述 | `員工年度假別額度維護` |
| 規格書路徑 | SA 文件 DOCX 或 MD | `specs/TM-員工年度假別額度維護.md` |
| 規格書圖片目錄 | MD 格式時引用的圖片目錄（DOCX 不需要） | `specs/images/` |
| HTML 目錄 | 畫面 mockup（可多個 .html） | `specs/html/` |
| DDL 目錄 | 資料表結構 CSV | `specs/ddl_csv/` |
| 邏輯文件目錄 | 業務邏輯補充/覆寫 | `specs/logic_txt_md/` |

確認後存入 `.agentic/config.json`。Phase 產出物也存放在 `.agentic/{moduleCode}/` 下：

```
{projectRoot}/
  .agentic/
    config.json          ← Setup 建立
    {moduleCode}/
      conflicts.md       ← P0 產出
      unified-spec.md    ← P0 產出（統一規格）
      tasks.md           ← P1 產出
```

---

## 專案規範（按需載入）

各 Phase 按需載入相關的規範，不一次全載。

| 規範檔案 | 內容 | 載入時機 |
|---------|------|---------|
| [conventions/tech-stack.md](conventions/tech-stack.md) | 技術棧 | P1（技術限制）、P2（實作） |
| [conventions/naming-conventions.md](conventions/naming-conventions.md) | 命名 + 目錄結構 | P1（檔案規劃）、P2（建檔） |
| [conventions/db-conventions.md](conventions/db-conventions.md) | 資料庫慣例 | P1（任務設計）、P2（Entity） |
| [conventions/code-patterns-backend.md](conventions/code-patterns-backend.md) | 後端代碼模式 + 禁止模式 | P2（後端 Task） |
| [conventions/code-patterns-frontend.md](conventions/code-patterns-frontend.md) | 前端代碼模式 + 禁止模式 | P2（前端 Task） |
| [conventions/data-access.md](conventions/data-access.md) | ORM 策略 + 回應格式 + 共用組件 | P2（實作） |

---

## 程式碼模板（按 Task 類型載入）

P2-lite 按 Task 涉及的檔案類型，只載入對應的 1-2 個模板。

**★ 模板是「含 TM002 完整實作的參考程式碼」，P2 套用時做變數替換 + 業務邏輯微調。**

### 後端模板

| Task 涉及的檔案 | 模板 |
|----------------|------|
| `*Entity.java` | [templates/backend-entity.md](templates/backend-entity.md) |
| `*CreateProcessor.java` | [templates/backend-processor-create.md](templates/backend-processor-create.md)（含 Thick/Thin 兩版） |
| `*UpdateProcessor.java` | [templates/backend-processor-update.md](templates/backend-processor-update.md) |
| `*DeleteProcessor.java` | [templates/backend-processor-delete.md](templates/backend-processor-delete.md) |
| `*QueryProcessor.java` | [templates/backend-processor-query.md](templates/backend-processor-query.md)（PaginationUtil 分頁） |
| 下拉選單需求 | [templates/backend-processor-dropdown.md](templates/backend-processor-dropdown.md)（LOV YAML 優先） |
| `*GetByIdProcessor.java` | [templates/backend-processor-getbyid.md](templates/backend-processor-getbyid.md) |

### 前端模板

| Task 涉及的檔案 | 模板 |
|----------------|------|
| `*Types.ts` | [templates/frontend-types.md](templates/frontend-types.md) |
| `*Service.ts` | [templates/frontend-service.md](templates/frontend-service.md) |
| `*Store.ts` | [templates/frontend-store.md](templates/frontend-store.md)（Setup + Object 兩版） |
| `routes.ts`（路由註冊） | [templates/frontend-router.md](templates/frontend-router.md) |
| `{moduleCode}.json`（i18n） | [templates/frontend-i18n.md](templates/frontend-i18n.md) |
| `*Page.vue` | [templates/frontend-page.md](templates/frontend-page.md)（CRUD + Dialog） |
| `*Dialog.vue` | [templates/frontend-dialog.md](templates/frontend-dialog.md)（SDialog2 `@confirm`/`@cancel`） |

**前端整合規則**：當任何 `*.vue` 檔案出現在 Task 中，必須同時載入 `frontend-router.md` 和 `frontend-i18n.md` 作為伴隨模板。

**不可一次載入所有模板。**

---

## Phase 0｜規格衝突檢查

**目的**：交叉比對規格書、HTML 畫面、DDL Schema、邏輯文件，消除矛盾。

**詳細指令**：讀取 [prompts/phase-0-spec-check.md](prompts/phase-0-spec-check.md)

**產出**：`conflicts.md` + `unified-spec.md`（存入 `.agentic/{moduleCode}/`）

**STOP Gate**：所有衝突項解決（0 個 ⏳）後才可進入 P1-lite。

---

## Phase 1-lite｜任務拆解

**目的**：理解統一規格，拆解為小任務，每個任務標記對應的 template。

**詳細指令**：讀取 [prompts/phase-1-task-breakdown.md](prompts/phase-1-task-breakdown.md)

**產出**：`tasks.md`（存入 `.agentic/{moduleCode}/`）

**STOP Gate**：使用者確認任務清單後進入 P2-lite。

---

## Phase 2-lite｜模板驅動實作

**目的**：逐任務執行——載入 template → 套用變數替換 → Write 檔案。

**流程**：

```
for each Task in tasks.md:
    1. 載入該 Task 標記的 template（1-2 個）
    2. 載入對應的 conventions 檔案
    3. 讀取統一規格中該 Task 的段落
    4. 套用 placeholder 替換 + 業務邏輯微調
    5. Write 檔案
    next Task
```

**驗證**：
- 後端全部完成 → `mvn compile`（只確認編譯，不跑測試）
- 前端全部完成 → `vue-tsc --noEmit`（只確認型別，不跑測試）
- 全部完成 → 啟動應用人工驗證

---

## 編輯規則

| 做 | 不做 |
|----|------|
| 從 template 替換產生代碼 | 從零開始寫代碼 |
| 按 conventions 調整風格 | 自創新風格 |
| 一致性 > 優雅 | 為「更優雅」而偏離模板 |

| 不產出 | 原因 |
|--------|------|
| 測試檔案 | Demo 版省略 |
| `sa_pending.md` | Demo 假設 SA 問題已在 P0 衝突清單中處理 |
| `review_notes.md` / `test_spec_map.md` | 無 P3 審查 |

---

## Gotchas

- Phase 0 看起來沒有衝突 ≠ 真的沒有衝突。跑完比對流程才能確認。
- `templates/` 中沒有對應模板不代表可以隨便寫 — 參考 `code-patterns-{backend,frontend}.md`「禁止模式」，風格必須一致。
- 「這個 API 應該存在」不等於「這個 API 存在」— 驗證再使用。
- 不要為「讓代碼更優雅」而偏離模板結構 — 一致性 > 優雅。
