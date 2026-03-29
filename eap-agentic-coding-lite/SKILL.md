---
name: eap-agentic-coding-lite
description: >
  eap 規格驅動開發 Demo 版 — 從規格書（DOCX 或 MD+圖片）+ UI 截圖 + DDL + 邏輯文件產出 TM002 可運行程式碼。
  涵蓋規格衝突檢查、任務拆解、模板驅動實作。
  不適用於單檔修正、純重構、無規格書的探索式開發。
---

# eap-agentic-coding-lite

> Demo 專用精簡版。目標：TM002 員工年度假別額度維護，從規格到可運行程式碼。
> 同一 session 連續執行 P0 → P1-lite → P2-lite，無需切換 Agent。

**專案**：eap（Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL）

## 適用條件

**適用**：eap 的 TM002 規格驅動功能開發（規格書 + UI 截圖 + DDL/CSV + 邏輯文件）
**不適用**：輕量 bug 修正、純重構、無規格書的探索式開發、單檔小改動

---

## 流程總覽

```
P0（規格衝突檢查）→ P1-lite（任務拆解）→ P2-lite（模板驅動實作）
```

同一 session 連續執行，無需切換 Agent。不寫測試、不跑測試、無 hooks。

> **⚠️ UI 規格來源**：使用 **UI 截圖（PNG 圖片）** 而非 HTML wireframe。圖片比 HTML 更能準確傳達畫面佈局。
> **⚠️ 前端 UI 互動模式**：eap 專案預設使用 **Dialog 模式**（新增/編輯/批次用 SDialog2 彈窗，不為 CRUD 建獨立路由頁面）。

---

## Setup（首次使用）

首次啟動時檢查 eap 專案根目錄下是否已有 `.agentic/config.json`。若不存在，詢問使用者以下資訊並建立：

| 資訊 | 說明 | 範例 |
|------|------|------|
| 模組代號 | 決定 package、檔案命名、路由前綴 | `TM002` |
| 模組名稱 | 用於日誌和 API 描述 | `員工年度假別額度維護` |
| 規格書路徑 | SA 文件 DOCX 或 MD | `Docs/spec/tm002/TM差勤管理系統-員工年度假別額度維護作業.md` |
| 規格書圖片目錄 | MD 格式時引用的圖片目錄 | `Docs/spec/tm002/images/` |
| UI 截圖目錄 | 畫面截圖 PNG（取代 HTML） | `Docs/spec/tm002/images/` |
| DDL 目錄 | 資料表結構 CSV | `Docs/spec/tm002/ddl_csv/` |
| 邏輯文件目錄 | 業務邏輯補充/覆寫 | `Docs/spec/tm002/logic_txt_md/` |

確認後存入 `.agentic/config.json`。Phase 產出物也存放在 `.agentic/{moduleCode}/` 下。

---

## 專案規範（按需載入）

| 規範檔案 | 內容 | 載入時機 |
|---------|------|---------|
| [conventions/tech-stack.md](conventions/tech-stack.md) | 技術棧 | P1、P2 |
| [conventions/naming-conventions.md](conventions/naming-conventions.md) | 命名 + 目錄結構 | P1、P2 |
| [conventions/db-conventions.md](conventions/db-conventions.md) | 資料庫慣例 | P1、P2 |
| [conventions/code-patterns-backend.md](conventions/code-patterns-backend.md) | 後端代碼模式 | P2 |
| [conventions/code-patterns-frontend.md](conventions/code-patterns-frontend.md) | 前端代碼模式 + 統一 LOV 模式 | P1、P2 |
| [conventions/data-access.md](conventions/data-access.md) | ORM 策略 + 回應格式 | P2 |

---

## 程式碼模板

**★ P2 模板優先級規則**：
```
模板的程式碼結構（🔒 固定模式） > 規格的實作建議
規格的業務規則（🔧 依規格調整） > 模板的預設值
```

模板中標註：
- 🔒 = 不可依規格改變的架構模式（如 LOV 級聯、條件編輯）
- 🔧 = 需從統一規格帶入的值（如欄位名、Label、SQL WHERE）

### 後端模板

| Task 涉及的檔案 | 模板 |
|----------------|------|
| `*Entity.java` | [templates/backend-entity.md](templates/backend-entity.md) |
| `*Service.java`（核心邏輯） | [templates/backend-service.md](templates/backend-service.md) |
| `*SaveProcessor.java` | [templates/backend-processor-save.md](templates/backend-processor-save.md) |
| `*DeleteProcessor.java` | [templates/backend-processor-delete.md](templates/backend-processor-delete.md) |
| `*DetailProcessor.java` | [templates/backend-processor-detail.md](templates/backend-processor-detail.md) |
| `*DefaultVacationProcessor.java` | [templates/backend-processor-default.md](templates/backend-processor-default.md) |
| `*BatchValidateProcessor.java` | [templates/backend-processor-batch-validate.md](templates/backend-processor-batch-validate.md) |
| `*BatchImportProcessor.java` | [templates/backend-processor-batch-import.md](templates/backend-processor-batch-import.md) |

### 前端模板

| Task 涉及的檔案 | 模板 |
|----------------|------|
| `*Types.ts` | [templates/frontend-types.md](templates/frontend-types.md) |
| `*Service.ts` | [templates/frontend-service.md](templates/frontend-service.md) |
| `*Store.ts` | [templates/frontend-store.md](templates/frontend-store.md) |
| 主頁面 `{MODULE_CODE}.vue` | [templates/frontend-page.md](templates/frontend-page.md) |
| `*CreateDialog.vue` | [templates/frontend-dialog-create.md](templates/frontend-dialog-create.md) |
| `*EditDialog.vue` | [templates/frontend-dialog-edit.md](templates/frontend-dialog-edit.md) |
| `*BatchDialog.vue` | [templates/frontend-dialog-batch.md](templates/frontend-dialog-batch.md) |
| `routes.ts`（路由註冊） | [templates/frontend-router.md](templates/frontend-router.md) |
| i18n（zh-TW + en-US） | [templates/frontend-i18n.md](templates/frontend-i18n.md) |

**不可一次載入所有模板。** P2 按 Task 逐個載入。

---

## Phase 0｜規格衝突檢查

**目的**：交叉比對規格書、UI 截圖、DDL Schema、邏輯文件，消除矛盾。

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

**目的**：逐任務執行——載入 template → 套用 🔧 替換 → 保留 🔒 結構 → Write 檔案。

**詳細指令**：讀取 [prompts/phase-2-implementation.md](prompts/phase-2-implementation.md)

**必須流程**（後端 → 前端 → 驗證）：

```
後端：Entity → Service → Save → Delete → Detail → DefaultVacation → [BatchValidate] → [BatchImport]
      ★ mvn compile

前端：Types → Service → Store → Router → 主頁面 → CreateDialog → EditDialog → [BatchDialog] → i18n
      ★ vue-tsc --noEmit

整合：啟動應用 → 人工驗證 CRUD
```

---

## 編輯規則

| 做 | 不做 |
|----|------|
| 主 session 自己 Read template → Write 檔案 | 用 Agent tool 委派 subagent 寫程式碼 |
| 從 template 替換產生代碼（保留 🔒） | 從零開始寫代碼 |
| 只替換 🔧 標記的部分 | 「改良」🔒 標記的架構模式 |
| 按 conventions 調整風格 | 自創新風格 |

| 不產出 | 原因 |
|--------|------|
| 測試檔案 | Demo 版省略 |
| `sa_pending.md` | Demo 假設問題已在 P0 處理 |
| `review_notes.md` / `test_spec_map.md` | 無 P3 審查 |

---

## Gotchas

- **★ 禁止 Subagent 委派程式碼檔案** — 模板驅動的檔案（Entity、Service、Processor、Vue、Store、Types 等）必須在**主 session** 中逐檔建立。禁止使用 Agent tool 委派給 subagent 寫程式碼。Subagent 收到的是摘要 prompt，不是模板原文，必然丟失 🔒 結構、LOV 模式、SDialog2 自含式結構等關鍵細節。唯一允許的 subagent 是 Explore 型（不產生程式碼）。
- Phase 0 看起來沒有衝突 ≠ 真的沒有衝突。跑完比對流程才能確認。
- **模板的 🔒 標記不可依規格改變** — 即使規格描述看起來需要不同做法。🔒 模式是從正確實作驗證過的。
- **SDialog2 自含式結構** — 使用 default slot 時，SDialog2 內建 q-card 不渲染。**必須**自己包 `<q-card>` + `<q-card-section>` + `<q-card-actions>`。不可依賴 `:title`/`@confirm`/`@cancel` props。關閉按鈕用 `@click="handleCancel"`（不用 `v-close-popup`）。
- **統一 LOV 模式** — 前端假別/假別細項用**一次** LOV 呼叫（`tm002VacationDetailList`），不可拆成兩次。
- **`hasSubTypes`** — 函式名 `hasSubTypes`（非 `hasMultipleSubs`）。必須同時檢查 `length > 1` 且有實際 `vacationSubCode`。
- **LOV label fallback 鏈** — `getSubOptions` 和 `onSubTypeChange`：`vacationSubName → vacationSubCode → vacationName`（最後保留 `vacationName`）。`onVacTypeChange` 單一細項時：`vacationSubName || ''`（不 fallback 到 `vacationName`，讓模板 `|| '—'` 生效）。
- **`onVacTypeChange` 流程** — 先 `subs.length === 0` 提前 return → 再 `!hasSubTypes()` 判斷。多細項用 `null as unknown as number`。
- **`addEmptyRow` vacationSubId 初值 `0`** — 不是 `null`。`batchForm.vacationSubId` 初值和重置值也是 `0`。
- **條件編輯用 `:disable`** — 不用 `v-if/v-else` 隱藏/顯示不同元件（下拉除外，因為 disabled dropdown UX 差）。
- **usedHours 唯讀** — 規格定義「本年度已請」為唯讀，模板用純文字顯示，不可用 `s-input`。
- **Store 錯誤處理分層** — `saveDetails`/`deleteDetail` 只 `throw err`；`batchImport` 是 `showError(err); throw err`（兩者不同）。
- **員工到職日欄位名 `assumeDate`** — 不是 `hireDate`。Store 年資計算和 CreateDialog 日期顯示都用此欄位。
- **`loadDefaultVacation()` 不帶參數** — Store/Service 自行處理年度。
- **EditDialog 日期格式轉換** — watch 中 `.replace(/\//g, '-')`，後端回 `/`，HTML date input 需 `-`。
- **EditDialog handleSave 送 `cashOutHours`** — 不可遺漏。
- **handleQuery 建構 plain object** — 不可直接傳 reactive searchForm（proxy 問題），空值轉 `undefined`。
- **SQL Provider 註冊** — 後端新增 LOV SQL yml 後，必須在 SqlProvider 的 `getSqlConfigPaths()` 加入路徑。
- **xlsx 套件** — `(await import('xlsx' as string)) as any` 繞過建置工具。`sheet_to_json` 必須傳 `{ raw: false }` 防止前導零截斷。CSV 範本標題用 `EMP_NO`。
- **日期格式** — 後端回 `/`，前端 `type="date"` 需要 `-`，載入時 `.replaceAll('/', '-')`。
- DDL 可能有 typo（如 `VACATION_SUN_ID` 實為 `VACATION_SUB_ID`）— 以邏輯文件或統一規格為準。
- 規格書的「頁面」≠ 前端路由頁面 — SA 習慣把子功能都叫「頁面」，但前端預設用 Dialog。
- **FK 關係是前端下拉的根源** — 必須從 DDL 分析 FK 層級，規格書通常省略。
