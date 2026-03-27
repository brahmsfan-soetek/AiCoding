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
  │
  ├──→ Step 5  主頁面
  │     載入 frontend-page.md + conventions/code-patterns-frontend.md
  │     查詢區 + 操作按鈕（permission-id）+ 資料表格 + Dialog 整合
  │     Write: pages/{module}/{moduleCode}/{ModuleCode}.vue
  │
  ├──→ Step 6  各 Dialog 組件
  │     載入 frontend-dialog.md
  │     每種 Dialog 獨立一個檔案（Create / Edit / Batch ...）
  │     使用 SDialog2（@confirm / @cancel），不手動加按鈕
  │     Write: pages/{module}/{moduleCode}/components/{ModuleCode}XxxDialog.vue
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

依規格的畫面需求決定需要哪些組件：

| 規格描述 | 產出組件 | 說明 |
|---------|---------|------|
| 查詢 + 列表頁面 | `{ModuleCode}.vue` | 主頁面，必要 |
| 新增功能（按鈕 / Dialog） | `{ModuleCode}CreateDialog.vue` | 新增表單 |
| 編輯功能（點擊列 / Dialog） | `{ModuleCode}EditDialog.vue` | 編輯表單 |
| 批次匯入（上傳 Excel） | `{ModuleCode}BatchDialog.vue` | 檔案上傳 + 預覽 |
| 明細檢視（唯讀） | `{ModuleCode}DetailDialog.vue` | 唯讀展示 |
| 子表格（Master-Detail） | `{ModuleCode}DetailTable.vue` | 嵌入主頁面 |

**規則**：
- 每個 Dialog 獨立為一個 Task、一個檔案
- 所有 Dialog 使用 `SDialog2` 組件（`@confirm` / `@cancel` 事件）
- 不自己寫確認/取消按鈕（SDialog2 已內建）
- 共用組件（SBtn, SInput, SSelect2, SCard 等）優先，零自訂 CSS

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
- [ ] `vue-tsc --noEmit` 通過（無型別錯誤）
- [ ] Router 已註冊，meta.pid 與 setPagePid 一致
- [ ] i18n zh-TW 和 en-US 的 key 結構一致
- [ ] 所有操作按鈕有 `permission-id`
- [ ] Dialog 使用 SDialog2（@confirm / @cancel）
- [ ] 無自訂 CSS（使用共用組件樣式）
- [ ] Types 無 `any` 型別

### 整合驗證
- [ ] 啟動應用，頁面可正常載入
- [ ] CRUD 操作可正常執行
