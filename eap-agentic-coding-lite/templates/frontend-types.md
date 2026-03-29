---
name: frontend-types
applies_to: "src/types/{module}/{moduleCode}.ts"
---

## 說明

TypeScript 型別定義：Entity 介面 + API Request 介面 + API Response 介面 + UI 型別。所有介面以 `I` 前綴命名（EAP 慣例）。欄位從 DDL 及統一規格對應。

## 依規格調整的部分

- Entity 介面名稱與欄位：依 DDL 表結構決定（清單 / 明細 / 預設 / 員工 / 批次驗證）
- Request 介面：查詢條件欄位從統一規格取得
- Response 介面：每個 API 端點的回傳結構獨立定義
- optional `?` 標記：審計欄位、分頁參數、非必填業務欄位
- UI 型別：DialogMode 等前端專用型別

## 完整參考實作

```typescript
// src/types/{module}/{moduleCode}.ts

/**
 * TM002 員工年度假別額度維護 - TypeScript 型別定義
 */

// 🔧 Entity 欄位從 DDL 對應

export interface IEmpVacationListItem {
  quotaId: number
  empId: number
  year: number
  empNo: string
  empNameCh: string
  empNameEn?: string
  deptCode: number
  deptName: string
  vacationCode: string
  vacationName: string
  vacationSubCode: string
  vacationSubName: string
  effectiveStartDate: string
  effectiveEndDate: string
  totalHours: number
  usedHours: number
  remainingHours: number
  settlementStatus: string
  cashOutHours?: number
}

export interface IEmpVacationDetail {
  empVacationId?: number
  empId: number
  vacationSubId: number
  vacationCode?: string
  vacationName?: string
  vacationSubCode?: string
  vacationSubName?: string
  maxHours: number
  usedHours: number
  unusedHours: number
  cashOutHours?: number
  beginDate: string
  endDate: string
  clear: boolean                    // 🔒 結算旗標 — 影響 EditDialog 行是否可編輯
  settlementStatus?: string
}

export interface IDefaultVacationItem {
  vacationCode: string
  vacationName: string
  vacationSubCode: string
  vacationSubName: string
  vacationSubId: number
  minHours: number
  maxHours: number
}

export interface IEmployeeInfo {
  empId: number
  empAccount: string
  empName: string
  empNameEn?: string
  gender?: string
  orgId?: number
  orgName?: string
  leaveDate?: string
  hireDate?: string
  seniority?: string               // 🔒 前端計算欄位，由 Store 填入
}

export interface IBatchValidateResult {
  empAccount: string
  valid: boolean
  errorMessage?: string
  empId?: number
  empName?: string
  orgId?: number
  orgName?: string
}

// 🔧 Request 介面欄位從查詢條件對應
export interface IEmpVacationQueryParams {
  effectiveDate?: string
  deptCode?: number
  empNo?: string
  empName?: string
  currentPage?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IEmpVacationSaveParams {
  empId: number
  details: IEmpVacationDetailSaveItem[]
}

export interface IEmpVacationDetailSaveItem {
  empVacationId?: number
  vacationSubId: number
  maxHours: number
  usedHours: number
  beginDate: string
  endDate: string
}

export interface IBatchImportParams {
  empIds: number[]
  vacationSubId: number
  maxHours: number
  beginDate: string
  endDate: string
}

// Response 介面
export interface IEmpVacationQueryData {
  records: IEmpVacationListItem[]
  totalCount: number
  currentPage?: number
  totalPages?: number
}

export interface IEmpVacationDetailData {
  records: IEmpVacationDetail[]
}

export interface IDefaultVacationData {
  records: IDefaultVacationItem[]
}

export interface IBatchValidateData {
  results: IBatchValidateResult[]
}

export interface IBatchImportData {
  createdCount: number
}

export type Tm002DialogMode = 'create' | 'edit'
```

## 已知陷阱

- **`clear: boolean`** — 此欄位控制 EditDialog 中該行是否可編輯/刪除，遺漏會導致結算資料被誤改
- **`seniority?: string`** — 在 Entity 中定義但由前端 Store 的 `queryEmpInfo` 計算填入，不來自後端
- **介面前綴 `I`** — EAP 慣例，所有介面必須以 `I` 前綴命名
- **Entity 拆分** — TM002 有 5 個 Entity 介面（ListItem / Detail / DefaultItem / EmployeeInfo / BatchValidateResult），數量依規格決定
- **`empVacationId?: number`** — 明細主鍵新增時為 undefined，修改時必填
