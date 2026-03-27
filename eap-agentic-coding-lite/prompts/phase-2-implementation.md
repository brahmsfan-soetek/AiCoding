# Phase 2-lite｜模板驅動實作

**執行者**：同一 session（Demo 版無 Agent 分離）

**目的**：按 P1-lite 的任務清單，逐任務載入 template → 套用 → 寫入檔案。

---

## 必須流程 — 總覽

```
┌─────────────────────────────────────────────────────┐
│ P0  規格衝突檢查                                      │
│   讀取規格書 + HTML + DDL + 邏輯文件                    │
│   → 交叉比對 → 衝突清單 → 人工裁決 → 統一規格            │
│   STOP Gate: 0 個 ⏳                                  │
├─────────────────────────────────────────────────────┤
│ P1  任務拆解                                          │
│   讀取統一規格 → 拆解為 Task（每個 <50 行）              │
│   每個 Task 標記：檔案 + 模板 + 依賴                    │
│   STOP Gate: 使用者確認                                │
├─────────────────────────────────────────────────────┤
│ P2  模板驅動實作（本文件）                               │
│   後端 → 前端 → 驗證                                   │
│   逐 Task 載入 template → 替換 → Write                 │
└─────────────────────────────────────────────────────┘
```

---

## 後端必須流程

**執行順序**：嚴格按依賴關係，不可跳步。

```
Step 1  Entity 定義
  │     載入 backend-entity.md + conventions/db-conventions.md
  │     DDL 欄位 → Java 欄位（型別對應、nullable、Javadoc）
  │     Write: {module}/domain/{EntityName}Entity.java
  │
  ├──→ Step 2  Create Processor
  │     載入 backend-processor-create.md + conventions/code-patterns-backend.md
  │     Thick 版（簡單 CRUD）或 Thin 版（委派 Service）
  │     Write: {module}/processor/{ModuleCode}CreateProcessor.java
  │     若 Thin 版 → 同時寫 Service 方法
  │
  ├──→ Step 3  Update Processor
  │     載入 backend-processor-update.md
  │     Write: {module}/processor/{ModuleCode}UpdateProcessor.java
  │
  ├──→ Step 4  Delete Processor
  │     載入 backend-processor-delete.md
  │     Write: {module}/processor/{ModuleCode}DeleteProcessor.java
  │
  ├──→ Step 5  Query Processor
  │     載入 backend-processor-query.md + conventions/data-access.md
  │     PaginationUtil 分頁 或 原生 SQL（多表 JOIN）
  │     Write: {module}/processor/{ModuleCode}QueryProcessor.java
  │
  ├──→ Step 6  GetById Processor
  │     載入 backend-processor-getbyid.md
  │     Write: {module}/processor/{ModuleCode}GetByIdProcessor.java
  │
  └──→ Step 7  Dropdown Processor（若需要）
        載入 backend-processor-dropdown.md
        先確認是否可用 LOV YAML 配置（不需寫 Processor）
        Write: {module}/processor/{ModuleCode}DropdownProcessor.java

  ★ 驗證: mvn compile -pl backend/{module}
```

### 每個後端 Step 的執行動作

```
1. 讀取 tasks.md 中該 Task 的業務規則
2. 讀取對應的 template 檔案
3. 讀取「替換規則」段落，確認所有 placeholder 的值
4. 複製「完整參考實作」
5. 套用 placeholder 替換：
   - {ModuleCode} → 如 Tm003
   - {moduleCode} → 如 tm003
   - {module}     → 如 tm
   - {EntityName} → 如 TmEmpVacation
   - {tableName}  → 如 TM_EMP_VACATION
   - {pkField}    → 如 empVacationId
   - {PKType}     → 如 Integer
   - {pkColumn}   → 如 EMP_VACATION_ID
6. 依統一規格調整業務邏輯（參考模板「業務邏輯注意點」段落）
7. Write 檔案
```

---

## 前端必須流程

**執行順序**：嚴格按依賴關係，不可跳步。

### ★ 前端預檢（開始前必做）

開始前端實作之前，讀取 tasks.md 頂部的「UI 互動模式決策」，確認：

| 檢查項目 | Dialog 模式 | Page 模式 |
|---------|-------------|-----------|
| 路由數量 | 僅 1 條（主頁面） | 多條（主頁面 + Detail 等） |
| Create/Edit/Batch 模板 | `frontend-dialog.md` | `frontend-page.md` |
| Create/Edit/Batch 檔案位置 | `components/{ModuleCode}XxxDialog.vue` | `{MODULE_CODE}Xxx.vue` |
| 主頁面按鈕行為 | 開啟 Dialog（`showXxxDialog = true`） | 路由跳轉（`router.push()`） |

> **若 tasks.md 使用了 `frontend-page.md` 模板來建立 Create/Edit/Batch 頁面（而 UI 模式應為 Dialog），必須在此修正任務清單後再繼續。不可帶著錯誤的任務清單進入實作。**

### 前端實作步驟

```
Step 1  Types 定義
  │     載入 frontend-types.md
  │     DDL 欄位 → TypeScript interface（Entity / Request / Response）
  │     Write: types/{module}/{moduleCode}.ts
  │
  ├──→ Step 2  Service 層
  │     載入 frontend-service.md + conventions/data-access.md
  │     API endpoints 常數 + 各操作 wrapper function
  │     Write: services/{module}/{moduleCode}Service.ts
  │
  ├──→ Step 3  Store 層
  │     載入 frontend-store.md
  │     Pinia Setup Syntax，整合 Service + useErrorHandler
  │     Write: stores/{module}/{moduleCode}/use{ModuleCode}Store.ts
  │
  ├──→ Step 4  Router 註冊
  │     載入 frontend-router.md
  │     在既有 routes.ts 中追加路由項目
  │     Edit: router/routes.ts（追加，不覆寫）
  │     ★ meta.pid 必須與頁面 setPagePid 一致
  │     ★ Dialog 模式 → 僅 1 條路由；Page 模式 → 含 Detail 路由
  │
  ├──→ Step 5  主頁面
  │     載入 frontend-page.md + conventions/code-patterns-frontend.md
  │     查詢區 + 操作按鈕（permission-id）+ 資料表格
  │     ★ Dialog 模式 → 主頁面底部整合 Dialog 組件（v-model 控制）
  │     ★ Page 模式 → 操作按鈕使用 router.push() 跳轉
  │     Write: pages/{module}/{moduleCode}/{MODULE_CODE}.vue
  │
  ├──→ Step 6a 各 Dialog 組件（Dialog 模式時）
  │     載入 frontend-dialog.md
  │     每種 Dialog 獨立一個檔案（Create / Edit / Batch ...）
  │     使用 SDialog2（@confirm / @cancel），不手動加按鈕
  │     Write: pages/{module}/{moduleCode}/components/{ModuleCode}XxxDialog.vue
  │
  ├── Step 6b 各明細頁面（Page 模式時）
  │     載入 frontend-page.md
  │     Write: pages/{module}/{moduleCode}/{MODULE_CODE}Detail.vue
  │
  └──→ Step 7  i18n Keys
        載入 frontend-i18n.md
        zh-TW + en-US 各一份，key prefix = '{module}.{moduleCode}.'
        Edit: locales/zh-TW/{module}/{module}.json（追加區塊）
        Edit: locales/en-US/{module}/{module}.json（追加區塊）

  ★ 驗證: vue-tsc --noEmit
```

### 每個前端 Step 的執行動作

```
1. 讀取 tasks.md 中該 Task 的業務規則
2. 讀取對應的 template 檔案
3. 讀取「替換規則」段落，確認所有 placeholder 的值
4. 選擇「完整版」或「簡化版 CRUD」變體（依功能複雜度）
5. 套用 placeholder 替換：
   - {ModuleCode}   → 如 Tm003
   - {moduleCode}   → 如 tm003
   - {module}       → 如 tm
   - {MODULE_CODE}  → 如 TM003（用於 permission-id）
   - {EntityName}   → 如 TmEmpVacation
   - {i18nPrefix}   → 如 'tm.tm003.'
6. 依統一規格調整：
   - 欄位增減（查詢條件、表格欄位、表單欄位）
   - Dialog 種類和數量
   - 下拉選單來源（LOV key）
   - 按鈕權限（permission-id）
7. Write / Edit 檔案
```

---

## 前端組件拆分規則

### Dialog 模式（預設）

| 規格描述 | 產出組件 | 檔案位置 | 模板 |
|---------|---------|---------|------|
| 查詢 + 列表頁面 | `{MODULE_CODE}.vue` | `pages/{module}/{moduleCode}/` | `frontend-page.md` |
| 新增功能 | `{ModuleCode}CreateDialog.vue` | `pages/{module}/{moduleCode}/components/` | `frontend-dialog.md` |
| 編輯功能 | `{ModuleCode}EditDialog.vue` | `pages/{module}/{moduleCode}/components/` | `frontend-dialog.md` |
| 批次匯入 | `{ModuleCode}BatchDialog.vue` | `pages/{module}/{moduleCode}/components/` | `frontend-dialog.md` |
| 明細檢視（唯讀） | `{ModuleCode}DetailDialog.vue` | `pages/{module}/{moduleCode}/components/` | `frontend-dialog.md` |
| 子表格 | `{ModuleCode}DetailTable.vue` | `pages/{module}/{moduleCode}/components/` | — |

**Dialog 模式規則**：
- 每個 Dialog 獨立為一個 Task、一個檔案
- 所有 Dialog 使用 `SDialog2` 組件（`@confirm` / `@cancel` 事件）
- 不自己寫確認/取消按鈕（SDialog2 已內建）
- 主頁面 import 並整合所有 Dialog（v-model 控制開關）
- 共用組件（SBtn, SInput, SSelect2, SCard 等）優先，零自訂 CSS

### Page 模式（僅複雜場景）

| 規格描述 | 產出組件 | 檔案位置 | 模板 |
|---------|---------|---------|------|
| 查詢 + 列表頁面 | `{MODULE_CODE}.vue` | `pages/{module}/{moduleCode}/` | `frontend-page.md` |
| 明細/編輯頁面 | `{MODULE_CODE}Detail.vue` | `pages/{module}/{moduleCode}/` | `frontend-page.md` |

**Page 模式規則**：
- 每個獨立頁面有對應的路由，共用 `meta.pid`
- 頁面間使用 `router.push()` 跳轉（query 傳參，如 `?empId=X&year=Y`）

> ⚠️ **不可混用**：同一模組不可同時有 Dialog 和 Page 模式的 CRUD 組件。選定後全部一致。

---

## Placeholder 速查表

所有模板共用的 placeholder：

| Placeholder | 來源 | 範例值 |
|------------|------|--------|
| `{ModuleCode}` | config.json 的 moduleCode（PascalCase） | `Tm003` |
| `{moduleCode}` | config.json 的 moduleCode（camelCase） | `tm003` |
| `{MODULE_CODE}` | config.json 的 moduleCode（大寫） | `TM003` |
| `{module}` | moduleCode 的前綴（小寫） | `tm` |
| `{EntityName}` | 主 Entity 名稱（PascalCase） | `TmAnnualLeaveQuota` |
| `{entityDescription}` | 模組中文名稱 | `員工年度假別額度` |
| `{tableName}` | DDL 主表名 | `TM_ANNUAL_LEAVE_QUOTA` |
| `{pkColumn}` | DDL 主鍵欄名 | `ANNUAL_LEAVE_QUOTA_ID` |
| `{pkField}` | 主鍵 Java/TS 名稱 | `annualLeaveQuotaId` |
| `{PKType}` | 主鍵型別 | `Integer` / `number` |
| `{i18nPrefix}` | i18n key 前綴 | `'tm.tm003.'` |

---

## 驗證清單

### 後端驗證
- [ ] `mvn compile` 通過（無編譯錯誤）
- [ ] Entity 欄位與 DDL 一致（名稱、型別、nullable）
- [ ] 每個 Processor 的 Camel route ID 唯一
- [ ] Service 方法（若有）正確注入 EntityManager

### 前端驗證
- [ ] **UI 互動模式一致性**：Dialog 模式 → 無獨立 Create/Edit/Batch 路由，僅 1 條主頁面路由；Page 模式 → 有 Detail 路由
- [ ] **元件結構正確**：Dialog 模式 → Create/Edit/Batch 在 `components/` 子目錄且使用 SDialog2；Page 模式 → Detail 在頁面目錄且為獨立 .vue 頁面
- [ ] `vue-tsc --noEmit` 通過（無型別錯誤）
- [ ] Router 已註冊，meta.pid 與 setPagePid 一致
- [ ] i18n zh-TW 和 en-US 的 key 結構一致
- [ ] 所有操作按鈕有 `permission-id`
- [ ] Dialog 模式下所有 Dialog 使用 SDialog2（@confirm / @cancel）
- [ ] 無自訂 CSS（使用共用組件樣式）
- [ ] Types 無 `any` 型別

### 整合驗證
- [ ] 啟動應用，頁面可正常載入
- [ ] CRUD 操作可正常執行
