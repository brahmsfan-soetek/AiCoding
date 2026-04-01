# Frontend: Types 模板

## 範例代碼

```typescript
// src/types/{module}/{moduleCode}Types.ts

// ==========================================
// Entity 介面
// ==========================================

/** {Entity 中文名稱} */
export interface I{EntityName} {
  /** 主鍵 */
  {pkField}: number
  /** 欄位 1 */
  field1: string
  /** 欄位 2 */
  field2?: string
  /** 建立者 */
  creator?: string
  /** 建立時間 */
  createDt?: string
  /** 更新者 */
  updater?: string
  /** 更新時間 */
  updateDt?: string
}

// ==========================================
// API Request 介面
// ==========================================

/** 查詢參數 */
export interface I{EntityName}QueryParams {
  field1?: string
  status?: string
  /** 分頁：頁碼 */
  page?: number
  /** 分頁：每頁筆數 */
  perPage?: number
  /** 排序欄位 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

// ==========================================
// API Response 介面
// ==========================================

/** 查詢回應資料 */
export interface I{EntityName}QueryData {
  records: I{EntityName}[]
  totalCount: number
  currentPage?: number
  totalPages?: number
}

/** 新增/更新回應資料 */
export interface I{EntityName}CreateData {
  {pkField}: number
  entityId: number
}

/** 刪除回應資料 */
export interface I{EntityName}DeleteData {
  deletedCount: number
  deletedIds: number[]
}

// ==========================================
// UI 相關型別
// ==========================================

/** Dialog 模式 */
export type DialogMode = 'create' | 'edit'

/** 下拉選項 */
export interface SelectOption {
  value: string | number
  label: string
  displayLabel?: string  // value + " - " + label
}

// ==========================================
// 常數
// ==========================================

/** 狀態選項 */
export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Y', label: '啟用' },
  { value: 'N', label: '停用' }
]
```

## 結構要點

- **檔案命名**: `{moduleCode}Types.ts`（如 `au010Types.ts`）
- **前綴 `I`**: 介面用 `I` 前綴（如 `ICalendarItem`）— EAP 慣例
- **分區**: Entity → Request → Response → UI 型別 → 常數
- **optional `?`**: 審計欄位、分頁參數等用 optional
- **`SelectOption`**: 下拉選單統一型別 `{value, label, displayLabel?}`
- **常數 export**: 狀態選項等常數直接在 Types 檔案中定義
- **Helper 函數**（如需要）: `getRegionName()`, `formatYearMonth()` 等可放在 Types 檔案
