---
name: frontend-service
applies_to: "src/services/{module}/{moduleCode}Service.ts"
---

## 說明

API Service 層：集中管理 API 端點常數，每個方法對應一個後端 Camel Route。全部使用 POST 方法，回傳 `ApiResponse<T>` 泛型。

## 替換規則

- `{ModuleCode}` → PascalCase 模組代碼（如 `Tm002`）
- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{routePrefix}` → API 路由前綴（如 `empVacation`、`tm002`）

## 完整參考實作

```typescript
// src/services/{module}/{moduleCode}Service.ts

/**
 * {MODULE_CODE} {moduleTitle} - API 服務層
 */

import { api } from 'boot/axios'
import type { ApiResponse } from 'src/types/common/api'
import type {
  I{QueryParamsType},
  I{QueryDataType},
  I{DetailDataType},
  I{DefaultDataType},
  I{SaveParamsType},
  I{BatchValidateDataType},
  I{BatchImportParamsType},
  I{BatchImportDataType},
  I{EmployeeInfoType}
} from 'src/types/{module}/{moduleCode}'

// ==========================================
// API 端點常數
// ==========================================

const API_ENDPOINTS = {
  /** 清單查詢 */
  QUERY: '/{routePrefix}Query',
  /** 員工資訊查詢 */
  EMP_INFO: '/tmEmpInfoQuery',
  /** 執行預設 */
  DEFAULT_VACATION: '/{moduleCode}DefaultVacation',
  /** 明細查詢 */
  DETAIL: '/{moduleCode}EmpVacationDetail',
  /** 明細儲存 */
  SAVE: '/{moduleCode}EmpVacationSave',
  /** 明細刪除 */
  DELETE: '/{moduleCode}EmpVacationDelete',
  /** 批次驗證 */
  BATCH_VALIDATE: '/{moduleCode}BatchValidate',
  /** 批次匯入 */
  BATCH_IMPORT: '/{moduleCode}BatchImport'
} as const

// ==========================================
// Service 實作
// ==========================================

export const {moduleCode}Service = {

  /**
   * 清單查詢
   */
  async query(params?: I{QueryParamsType}): Promise<ApiResponse<I{QueryDataType}>> {
    const response = await api.post<ApiResponse<I{QueryDataType}>>(
      API_ENDPOINTS.QUERY,
      params || {}
    )
    return response.data
  },

  /**
   * 員工資訊查詢
   */
  async queryEmpInfo(empAccount: string): Promise<ApiResponse<I{EmployeeInfoType}>> {
    const response = await api.post<ApiResponse<I{EmployeeInfoType}>>(
      API_ENDPOINTS.EMP_INFO,
      { empAccount }
    )
    return response.data
  },

  /**
   * 執行預設
   */
  async getDefaultVacation(year: number): Promise<ApiResponse<I{DefaultDataType}>> {
    const response = await api.post<ApiResponse<I{DefaultDataType}>>(
      API_ENDPOINTS.DEFAULT_VACATION,
      { year }
    )
    return response.data
  },

  /**
   * 明細查詢
   */
  async queryDetail(empId: number, year: number): Promise<ApiResponse<I{DetailDataType}>> {
    const response = await api.post<ApiResponse<I{DetailDataType}>>(
      API_ENDPOINTS.DETAIL,
      { empId, year }
    )
    return response.data
  },

  /**
   * 明細儲存
   */
  async save(params: I{SaveParamsType}): Promise<ApiResponse<I{DetailDataType}>> {
    const response = await api.post<ApiResponse<I{DetailDataType}>>(
      API_ENDPOINTS.SAVE,
      params
    )
    return response.data
  },

  /**
   * 明細刪除
   */
  async deleteDetail(empVacationId: number): Promise<ApiResponse<{ empVacationId: number }>> {
    const response = await api.post<ApiResponse<{ empVacationId: number }>>(
      API_ENDPOINTS.DELETE,
      { empVacationId }
    )
    return response.data
  },

  /**
   * 批次驗證
   */
  async batchValidate(empAccounts: string[]): Promise<ApiResponse<I{BatchValidateDataType}>> {
    const response = await api.post<ApiResponse<I{BatchValidateDataType}>>(
      API_ENDPOINTS.BATCH_VALIDATE,
      { empAccounts }
    )
    return response.data
  },

  /**
   * 批次匯入
   */
  async batchImport(params: I{BatchImportParamsType}): Promise<ApiResponse<I{BatchImportDataType}>> {
    const response = await api.post<ApiResponse<I{BatchImportDataType}>>(
      API_ENDPOINTS.BATCH_IMPORT,
      params
    )
    return response.data
  }
}

export default {moduleCode}Service
```

## 簡化版（標準 CRUD 模組）

若模組只有基本 CRUD（無批次匯入、無員工查詢、無明細），可簡化為：

```typescript
// src/services/{module}/{moduleCode}Service.ts

import { api } from 'boot/axios'
import type { ApiResponse } from 'src/types/common/api'
import type {
  I{EntityName},
  I{EntityName}QueryParams,
  I{EntityName}QueryData,
  I{EntityName}CreateData,
  I{EntityName}DeleteData
} from 'src/types/{module}/{moduleCode}'

const API_ENDPOINTS = {
  QUERY: '/{routePrefix}Query',
  CREATE: '/{routePrefix}Create',
  UPDATE: '/{routePrefix}Update',
  DELETE: '/{routePrefix}Delete',
  GET_BY_ID: '/{routePrefix}GetById'
} as const

export const {moduleCode}Service = {

  async query(params?: I{EntityName}QueryParams): Promise<ApiResponse<I{EntityName}QueryData>> {
    const response = await api.post<ApiResponse<I{EntityName}QueryData>>(
      API_ENDPOINTS.QUERY, params || {}
    )
    return response.data
  },

  async create(data: Partial<I{EntityName}>): Promise<ApiResponse<I{EntityName}CreateData>> {
    const response = await api.post<ApiResponse<I{EntityName}CreateData>>(
      API_ENDPOINTS.CREATE, data
    )
    return response.data
  },

  async update(data: Partial<I{EntityName}>): Promise<ApiResponse<I{EntityName}CreateData>> {
    const response = await api.post<ApiResponse<I{EntityName}CreateData>>(
      API_ENDPOINTS.UPDATE, data
    )
    return response.data
  },

  async delete(params: { ids: number[] }): Promise<ApiResponse<I{EntityName}DeleteData>> {
    const response = await api.post<ApiResponse<I{EntityName}DeleteData>>(
      API_ENDPOINTS.DELETE, params
    )
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<I{EntityName}>> {
    const response = await api.post<ApiResponse<I{EntityName}>>(
      API_ENDPOINTS.GET_BY_ID, { {pkField}: id }
    )
    return response.data
  }
}

export default {moduleCode}Service
```

## 業務邏輯注意點

- **物件模式** — `export const xxxService = { ... }`，不是 class，不需要 new
- **API_ENDPOINTS 常數** — 集中管理，`as const` 確保不可變；端點名稱對應後端 Camel Route ID
- **全部 POST** — EAP 統一 POST 入口 `/api/{routeId}`
- **`import { api } from 'boot/axios'`** — 使用封裝好的 axios instance，不可直接 import axios
- **`return response.data`** — Service 回傳解包後的 `ApiResponse<T>`，不是 `AxiosResponse`
- **型別引用** — 從 `src/types/{module}/{moduleCode}` 引入（TM002 實際路徑為 `src/types/tm/tm002`）
- **無業務邏輯** — Service 只做 API 呼叫，資料轉換在 Store
- **API 端點數量** — 依規格決定：標準 CRUD 為 5 個（Query/Create/Update/Delete/GetById）；TM002 有 8 個端點因為含批次匯入和員工查詢
- **`routePrefix` 映射** — TM002 的 `QUERY` 端點為 `/empVacationQuery`（非 `/tm002Query`），需對照後端 Camel Route 設定
