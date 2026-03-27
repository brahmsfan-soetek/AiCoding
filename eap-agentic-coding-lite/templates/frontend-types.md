---
name: frontend-types
applies_to: "src/types/{module}/{moduleCode}.ts"
---

## 說明

TypeScript 型別定義：Entity 介面 + API Request 介面 + API Response 介面 + UI 型別。依規格調整欄位。

## 替換規則

- `{ModuleCode}` → PascalCase 模組代碼（如 `Tm002`）
- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{MODULE_CODE}` → 大寫格式（如 `TM002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{moduleTitle}` → 模組中文名稱（如 `員工年度假別額度維護`）
- `{pkField}` → 主鍵欄位名（如 `quotaId`）

## 完整參考實作

```typescript
// src/types/{module}/{moduleCode}.ts

/**
 * {MODULE_CODE} {moduleTitle} - TypeScript 型別定義
 */

// ==========================================
// Entity 介面
// ==========================================

/** {主要清單項目中文名稱} */
export interface I{ListItemName} {
  /** 主鍵 */
  {pkField}: number
  /** 員工ID */
  empId: number
  /** 年度 */
  year: number
  /** 員工編號 */
  empNo: string
  /** 員工姓名（中文） */
  empNameCh: string
  /** 員工姓名（英文） */
  empNameEn?: string
  /** 部門代碼 */
  deptCode: number
  /** 部門名稱 */
  deptName: string
  // {其他業務欄位：依規格調整}
  /** 建立者 */
  creator?: string
  /** 建立時間 */
  createDt?: string
  /** 更新者 */
  updater?: string
  /** 更新時間 */
  updateDt?: string
}

/** {明細項目中文名稱} */
export interface I{DetailName} {
  /** 流水號（新增時為 undefined） */
  {detailPkField}?: number
  /** 員工ID */
  empId: number
  // {明細業務欄位：依規格調整}
  /** 可請時數 */
  maxHours: number
  /** 已用時數 */
  usedHours: number
  /** 剩餘時數 */
  unusedHours: number
  /** 生效起始日 */
  beginDate: string
  /** 生效結束日 */
  endDate: string
  /** 結算 */
  clear: boolean
}

/** {預設資料項目中文名稱} */
export interface I{DefaultItemName} {
  // {預設資料欄位：依規格調整}
}

/** 員工資訊 */
export interface I{EmployeeInfoName} {
  /** 員工ID */
  empId: number
  /** 員工編號 */
  empAccount: string
  /** 員工姓名 */
  empName: string
  /** 員工英文姓名 */
  empNameEn?: string
  /** 性別 */
  gender?: string
  /** 部門ID */
  orgId?: number
  /** 部門名稱 */
  orgName?: string
  /** 離職日期 */
  leaveDate?: string
  /** 到職日期 */
  hireDate?: string
  /** 年資（前端計算） */
  seniority?: string
}

/** 批次驗證結果項目 */
export interface I{BatchValidateResultName} {
  /** 員工編號 */
  empAccount: string
  /** 是否有效 */
  valid: boolean
  /** 錯誤訊息 */
  errorMessage?: string
  /** 員工ID */
  empId?: number
  /** 員工姓名 */
  empName?: string
  /** 部門ID */
  orgId?: number
  /** 部門名稱 */
  orgName?: string
}

// ==========================================
// API Request 介面
// ==========================================

/** 清單查詢參數 */
export interface I{QueryParamsName} {
  // {查詢欄位：依規格調整}
  /** 分頁：頁碼 */
  page?: number
  /** 分頁：每頁筆數 */
  perPage?: number
  /** 排序欄位 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/** 明細儲存參數 */
export interface I{SaveParamsName} {
  /** 員工ID */
  empId: number
  /** 明細列表 */
  details: I{DetailSaveItemName}[]
}

/** 明細儲存項目 */
export interface I{DetailSaveItemName} {
  /** 流水號（修改時必填） */
  {detailPkField}?: number
  // {儲存欄位：依規格調整}
}

/** 批次匯入參數 */
export interface I{BatchImportParamsName} {
  /** 員工ID列表 */
  empIds: number[]
  // {批次匯入欄位：依規格調整}
}

// ==========================================
// API Response 介面
// ==========================================

/** 清單查詢回應資料 */
export interface I{QueryDataName} {
  records: I{ListItemName}[]
  totalCount: number
  currentPage?: number
  totalPages?: number
}

/** 明細查詢回應資料 */
export interface I{DetailDataName} {
  records: I{DetailName}[]
}

/** 預設資料回應 */
export interface I{DefaultDataName} {
  records: I{DefaultItemName}[]
}

/** 批次驗證回應資料 */
export interface I{BatchValidateDataName} {
  results: I{BatchValidateResultName}[]
}

/** 批次匯入回應資料 */
export interface I{BatchImportDataName} {
  createdCount: number
}

// ==========================================
// UI 相關型別
// ==========================================

/** Dialog 模式 */
export type {ModuleCode}DialogMode = 'create' | 'edit'
```

## 簡化版（標準 CRUD 模組）

若模組只有基本 CRUD：

```typescript
// src/types/{module}/{moduleCode}.ts

// Entity
export interface I{EntityName} {
  {pkField}: number
  // {業務欄位：依規格調整}
  creator?: string
  createDt?: string
  updater?: string
  updateDt?: string
}

// Request
export interface I{EntityName}QueryParams {
  // {查詢欄位}
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Response
export interface I{EntityName}QueryData {
  records: I{EntityName}[]
  totalCount: number
  currentPage?: number
  totalPages?: number
}

export interface I{EntityName}CreateData {
  {pkField}: number
}

export interface I{EntityName}DeleteData {
  deletedCount: number
  deletedIds: number[]
}

// UI
export type DialogMode = 'create' | 'edit'
```

## 業務邏輯注意點

- **檔案命名** — `{moduleCode}.ts`（如 `tm002.ts`），不加 `Types` 後綴；TM002 實際路徑為 `src/types/tm/tm002.ts`
- **前綴 `I`** — 介面一律用 `I` 前綴（EAP 慣例），如 `IEmpVacationListItem`
- **分區** — Entity → Request → Response → UI 型別，用分隔線標註
- **optional `?`** — 審計欄位（creator/createDt 等）、分頁參數、非必填業務欄位用 optional
- **JSDoc 註解** — 每個欄位加 `/** 中文說明 */` 註解
- **Entity 拆分** — TM002 有多個 Entity（ListItem / Detail / DefaultItem / EmployeeInfo / BatchValidateResult），依規格決定數量
- **Request 拆分** — TM002 有 QueryParams / SaveParams / DetailSaveItem / BatchImportParams，依規格決定
- **Response 拆分** — 每個 API 端點的回應資料獨立定義介面
- **前端計算欄位** — 如 `seniority`（年資）在 Entity 中定義，但由前端 Store 計算填入
- **結算欄位** — `clear: boolean` 影響 EditDialog 中行是否可編輯/刪除
