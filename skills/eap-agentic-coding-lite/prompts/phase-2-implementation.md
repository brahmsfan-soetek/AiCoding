# Phase 2-lite｜模板驅動實作

**執行者**：同一 session（Demo 版無 Agent 分離）

**目的**：按 P1-lite 的任務清單，逐任務載入 template → 套用 → 寫入檔案。

---

## ★★★ 禁止 Subagent 委派（最高優先級）

> **所有模板驅動的檔案必須在主 session 中逐檔建立，嚴禁使用 Agent tool 委派給 subagent。**

### 為什麼禁止

Subagent 收到的是主 Agent 的摘要 prompt，不是模板原文。摘要必然丟失 🔒 標記的結構細節，
甚至可能與模板矛盾（歷史案例：subagent prompt 寫 "SDialog2 handles buttons"，模板實際要求自含式 `<q-card-actions>`）。

### 禁止範圍

- **後端**：Entity、Service、所有 Processor — 禁止 subagent
- **前端**：Types、Service、Store、Router、主頁面、CreateDialog、EditDialog、BatchDialog、i18n — 禁止 subagent
- **唯一允許 subagent 的場景**：Explore 型 agent 用於查找現有檔案路徑/結構（不產生程式碼）

### 正確做法

```
每個 Step：
1. 自己讀 template .md 檔案（Read tool）
2. 自己從「完整參考實作」複製程式碼
3. 自己替換 🔧 部分
4. 自己用 Write tool 寫入檔案
```

---

## ★ 模板優先級規則（最重要）

```
模板的程式碼結構（🔒 固定模式） > 規格的實作建議
規格的業務規則（🔧 依規格調整） > 模板的預設值
```

- **🔒 固定模式**：模板中標記為 🔒 的程式碼結構**原樣使用**，不可依規格「改良」
- **🔧 依規格調整**：模板中標記為 🔧 的值（欄位名、Label、SQL WHERE、LOV key）從統一規格帶入

**違反此規則是前端錯誤的根本原因。** 即使規格描述暗示不同的做法，仍以模板的 🔒 結構為準。

---

## 後端必須流程

**執行順序**：嚴格按依賴關係，不可跳步。

```
Step 1  Entity 定義
  │     載入 backend-entity.md + conventions/db-conventions.md
  │     DDL 欄位 → Java 欄位（型別對應、nullable、Javadoc）
  │     Write: tm/domain/{EntityName}Entity.java
  │
  ├──→ Step 2  Service（核心邏輯）
  │     載入 backend-service.md + conventions/data-access.md
  │     ★ 這是最關鍵的檔案 — 所有業務邏輯集中於此
  │     🔒 保留：Save 合併 Create+Update、重複檢查、CLEAR 保護、日期解析
  │     🔧 調整：SQL 中的表名/欄位名/JOIN 結構、WHERE 條件
  │     Write: tm/service/{ModuleCode}EmpVacationService.java
  │
  ├──→ Step 3  Save Processor
  │     載入 backend-processor-save.md
  │     Thin Processor — 委派 Service
  │     Write: tm/processor/{ModuleCode}EmpVacationSaveProcessor.java
  │
  ├──→ Step 4  Delete Processor
  │     載入 backend-processor-delete.md
  │     Write: tm/processor/{ModuleCode}EmpVacationDeleteProcessor.java
  │
  ├──→ Step 5  Detail Processor
  │     載入 backend-processor-detail.md
  │     Write: tm/processor/{ModuleCode}EmpVacationDetailProcessor.java
  │
  ├──→ Step 6  DefaultVacation Processor
  │     載入 backend-processor-default.md
  │     Write: tm/processor/{ModuleCode}DefaultVacationProcessor.java
  │
  ├──→ Step 7  BatchValidate Processor（若需要）
  │     載入 backend-processor-batch-validate.md
  │     Write: tm/processor/{ModuleCode}BatchValidateProcessor.java
  │
  └──→ Step 8  BatchImport Processor（若需要）
        載入 backend-processor-batch-import.md
        Write: tm/processor/{ModuleCode}BatchImportProcessor.java

  ★ 驗證: mvn compile -pl backend/tm

  ★ Step 9  SQL Provider 註冊（必做）
        確認 {Module}SqlProvider.java（如 TmSqlProvider.java）的 getSqlConfigPaths()
        已包含新模組的 SQL 設定檔（如 "sql/tm002.yml"）。若未包含則 LOV 會報
        「不支援的 LOV 類型」錯誤。
```

### 每個後端 Step 的執行動作（禁止委派 Subagent）

> **以下步驟必須由主 session 自己執行（Read → Write），不可使用 Agent tool 委派。**

```
1. 讀取 tasks.md 中該 Task 的業務規則
2. 用 Read tool 讀取對應的 template 檔案（取得「完整參考實作」原文）
3. 以模板的「完整參考實作」為基礎，逐段複製
4. 只替換 🔧 標記的部分（從統一規格取值）
5. 保留所有 🔒 標記的結構不變
6. 用 Write tool 寫入檔案
```

---

## 前端必須流程

**執行順序**：嚴格按依賴關係，不可跳步。

### ★ 前端預檢（開始前必做）

確認 tasks.md 的 UI 互動模式為 Dialog，確認：
- 路由只需 1 條（主頁面）
- Create/Edit/Batch 使用 `frontend-dialog-*.md` 模板
- Create/Edit/Batch 檔案在 `components/` 子目錄
- **xlsx 套件**：若有 BatchDialog，確認 `frontend/package.json` 已包含 `xlsx` 依賴，否則先執行 `cd frontend && npm install xlsx`

### 前端實作步驟

```
Step 1  Types 定義
  │     載入 frontend-types.md
  │     DDL 欄位 → TypeScript interface
  │     Write: types/tm/{moduleCode}.ts
  │
  ├──→ Step 2  Service 層
  │     載入 frontend-service.md + conventions/data-access.md
  │     🔧 端點名稱從後端 routeId 對應
  │     Write: services/tm/{moduleCode}Service.ts
  │
  ├──→ Step 3  Store 層
  │     載入 frontend-store.md
  │     🔒 保留：Pinia Setup 語法、useErrorHandler、年資計算、查不到顯示 warning
  │     Write: stores/tm/{moduleCode}/use{ModuleCode}Store.ts
  │
  ├──→ Step 4  Router 註冊
  │     載入 frontend-router.md
  │     Edit: router/routes.ts（追加，不覆寫）
  │     ★ meta.pid 必須與 setPagePid 一致
  │     ★ Dialog 模式 → 僅 1 條路由
  │
  ├──→ Step 5  主頁面
  │     載入 frontend-page.md + conventions/code-patterns-frontend.md
  │     🔧 查詢欄位、表格欄位、LOV key 從規格取
  │     🔒 保留：Dialog 整合方式（v-model 控制）、三層分離
  │     Write: pages/tm/{moduleCode}/{MODULE_CODE}.vue
  │
  ├──→ Step 6  CreateDialog
  │     載入 frontend-dialog-create.md
  │     🔒 保留（最重要）：
  │       - 統一 LOV 模式（一次 LOV 呼叫驅動兩層下拉）
  │       - hasMultipleSubs（>1 才顯示下拉，=1 顯示文字）
  │       - onVacTypeChange（=1 自動帶入，>1 清空）
  │       - 員工查詢 + 執行預設流程
  │     🔧 調整：LOV key、明細欄位、驗證規則
  │     Write: pages/tm/{moduleCode}/components/{ModuleCode}CreateDialog.vue
  │
  ├──→ Step 7  EditDialog
  │     載入 frontend-dialog-edit.md
  │     🔒 保留（最重要）：
  │       - 同 CreateDialog 的統一 LOV 模式
  │       - 條件編輯：:disable="props.row.clear"（非 v-if/v-else）
  │       - 下拉例外：v-if="!props.row.clear" 控制下拉/文字切換
  │       - 鎖定圖示：結算列操作欄顯示 lock icon
  │     Write: pages/tm/{moduleCode}/components/{ModuleCode}EditDialog.vue
  │
  ├──→ Step 8  BatchDialog（若需要）
  │     載入 frontend-dialog-batch.md
  │     🔒 保留（最重要）：
  │       - 3 步驟流程（上傳 → 預覽驗證 → 批次套用）
  │       - 同統一 LOV 模式的級聯下拉
  │       - hasMultipleSubs computed 控制單/多細項顯示
  │       - CSV/XLSX 解析
  │     Write: pages/tm/{moduleCode}/components/{ModuleCode}BatchDialog.vue
  │
  └──→ Step 9  i18n Keys
        載入 frontend-i18n.md
        zh-TW + en-US 各一份
        Edit: i18n/zh-TW/tm/tm.json（追加區塊）
        Edit: i18n/en-US/tm/tm.json（追加區塊）

  ★ 驗證: vue-tsc --noEmit
```

### 每個前端 Step 的執行動作（禁止委派 Subagent）

> **以下步驟必須由主 session 自己執行（Read → Write），不可使用 Agent tool 委派。**
> Subagent 會收到摘要 prompt 而非模板原文，導致 🔒 結構丟失、SDialog2 用法錯誤、LOV 模式遺漏。

```
1. 讀取 tasks.md 中該 Task 的業務規則
2. 用 Read tool 讀取對應的 template 檔案（取得「完整參考實作」原文）
3. 以模板的「完整參考實作」為基礎，逐段複製
4. 只替換 🔧 標記的部分（從統一規格取值）
5. 保留所有 🔒 標記的結構不變 — 不可「改良」、不可用自己的理解重寫
6. ★ Dialog 結構自檢（CreateDialog / EditDialog / BatchDialog）：
   - SDialog2 自含式：<s-dialog2 v-model persistent> 內包 <q-card>，不可傳 :title / @confirm / @cancel
   - 按鈕在 footer：<q-card-actions align="right"> 在 q-card 底部，不在 header
   - 關閉按鈕：header 用 <q-btn icon="close" flat round dense @click="handleCancel" />
   - 統一 LOV：使用 LovService.loadLovAll()，不是 store 方法
   - hasSubTypes 函式存在且邏輯正確（length > 1 && some(d => d.vacationSubCode != null)）
   - onVacTypeChange 邏輯存在
7. ★ 主頁面自檢：
   - 年度欄位有 :rules 驗證（接受 YYYY 或 YYYY-MM-DD）、maxlength、placeholder、hide-bottom-space
   - searchForm 用 reactive（不是 ref），handleQuery 建構 plain object
8. 用 Write tool 寫入檔案
```

---

## Placeholder 速查表

| Placeholder | 來源 | TM002 值 |
|------------|------|----------|
| `{ModuleCode}` | config.json（PascalCase） | `Tm002` |
| `{moduleCode}` | config.json（camelCase） | `tm002` |
| `{MODULE_CODE}` | config.json（大寫） | `TM002` |
| `{module}` | 模組群前綴（小寫） | `tm` |
| `{EntityName}` | 主 Entity 名稱 | `TmEmpVacation` |
| `{tableName}` | DDL 主表名 | `TM_EMP_VACATION` |
| `{pkColumn}` | DDL 主鍵欄名 | `EMP_VACATION_ID` |
| `{pkField}` | 主鍵 Java/TS 名 | `empVacationId` |
| `{PKType}` | 主鍵型別 | `Integer` / `number` |
| `{i18nPrefix}` | i18n key 前綴 | `'tm.tm002.'` |

---

## 驗證清單

### 後端驗證
- [ ] `mvn compile` 通過
- [ ] Entity 欄位與 DDL 一致
- [ ] Service 中的 SQL 使用 Schema prefix（`EAP.TM_EMP_VACATION`）
- [ ] Save 合併了 Create + Update
- [ ] Delete 有 CLEAR 檢查（結算列不可刪）
- [ ] 重複檢查存在（同員工 + 同假別細項 + 同年度）
- [ ] 日期解析支援 `/` 和 `-` 兩種格式

### 前端驗證
- [ ] **統一 LOV 模式**：CreateDialog / EditDialog / BatchDialog 都使用同一個 LOV key（`tm002VacationDetailList`）
- [ ] **hasMultipleSubs**：>1 才顯示下拉，=1 顯示文字
- [ ] **onVacTypeChange**：=1 自動帶入 vacationSubId，>1 清空
- [ ] **條件編輯**：EditDialog 使用 `:disable="props.row.clear"`（非 v-if/v-else）
- [ ] **下拉切換**：EditDialog 的 vacationCode/vacationSubId 用 `v-if="!props.row.clear"` 控制下拉/文字
- [ ] **SDialog2 自含式結構**：必須自己包 `<q-card>` + `<q-card-section>` + `<q-card-actions>`（SDialog2 使用 default slot 時不渲染內建 q-card）
- [ ] **日期格式轉換**：EditDialog watch 中 `.replaceAll('/', '-')`
- [ ] **usedHours 唯讀**：明細表格的「本年度已請」用純文字顯示（不可用 s-input）
- [ ] **Store CUD 不呼叫 showError**：saveDetails / deleteDetail / batchImport 只 throw err（axios 攔截器已處理錯誤顯示）
- [ ] **SQL Provider 已註冊**：新模組的 SQL yml 已加入 SqlProvider.getSqlConfigPaths()
- [ ] **xlsx 已安裝**：若有 BatchDialog，`package.json` 含 `xlsx` 依賴
- [ ] **後端錯誤碼翻譯**：`common/errors.json` 包含後端自訂錯誤碼的翻譯
- [ ] `vue-tsc --noEmit` 通過
- [ ] Router meta.pid 與 setPagePid 一致
- [ ] i18n prefix 為 `'tm.tm002.'`（不是 `'tm002.'`）
- [ ] `<template>` 中無硬編碼中文（全部使用 `$t()` / `t()`）

### 整合驗證
- [ ] 啟動應用，頁面可正常載入
- [ ] CRUD 操作可正常執行
