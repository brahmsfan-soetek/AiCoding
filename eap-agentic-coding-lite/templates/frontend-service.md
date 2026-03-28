---
name: frontend-service
applies_to: "src/services/{module}/{moduleCode}Service.ts"
---

## 說明

API Service 層：集中管理 API 端點常數，每個方法對應一個後端 Camel Route。全部使用 POST 方法，回傳 `response.data`（即解包後的 `ApiResponse<T>`）。Service 不含業務邏輯，資料轉換在 Store。

## 依規格調整的部分

- `API_ENDPOINTS` 端點名稱：從後端 routeId 對應（注意 QUERY 端點可能不以 moduleCode 為前綴）
- import 的型別名稱：從 frontend-types 對應
- 方法數量：依規格的 API 端點數量決定（標準 CRUD 為 5 個，TM002 有 8 個）

## 完整參考實作

```typescript
// src/services/{module}/{moduleCode}Service.ts

import { api } from 'boot/axios'                      // 🔒 必須使用封裝的 axios instance
import type { ApiResponse } from 'src/types/common/api'
import type {
  IEmpVacationQueryParams, IEmpVacationQueryData,
  IEmpVacationDetailData, IDefaultVacationData,
  IEmpVacationSaveParams, IBatchValidateData,
  IBatchImportParams, IBatchImportData, IEmployeeInfo
} from 'src/types/tm/tm002'

// 🔧 端點名稱從後端 routeId 對應
const API_ENDPOINTS = {
  QUERY: '/empVacationQuery',
  EMP_INFO: '/tmEmpInfoQuery',
  DEFAULT_VACATION: '/tm002DefaultVacation',
  DETAIL: '/tm002EmpVacationDetail',
  SAVE: '/tm002EmpVacationSave',
  DELETE: '/tm002EmpVacationDelete',
  BATCH_VALIDATE: '/tm002BatchValidate',
  BATCH_IMPORT: '/tm002BatchImport'
} as const

// 🔒 Service 使用 object literal 模式，每個方法回傳 response.data
export const tm002Service = {
  async query(params?: IEmpVacationQueryParams): Promise<ApiResponse<IEmpVacationQueryData>> {
    return (await api.post<ApiResponse<IEmpVacationQueryData>>(API_ENDPOINTS.QUERY, params || {})).data
  },
  async queryEmpInfo(empAccount: string): Promise<ApiResponse<IEmployeeInfo>> {
    return (await api.post<ApiResponse<IEmployeeInfo>>(API_ENDPOINTS.EMP_INFO, { empAccount })).data
  },
  async getDefaultVacation(year: number): Promise<ApiResponse<IDefaultVacationData>> {
    return (await api.post<ApiResponse<IDefaultVacationData>>(API_ENDPOINTS.DEFAULT_VACATION, { year })).data
  },
  async queryDetail(empId: number, year: number): Promise<ApiResponse<IEmpVacationDetailData>> {
    return (await api.post<ApiResponse<IEmpVacationDetailData>>(API_ENDPOINTS.DETAIL, { empId, year })).data
  },
  async save(params: IEmpVacationSaveParams): Promise<ApiResponse<IEmpVacationDetailData>> {
    return (await api.post<ApiResponse<IEmpVacationDetailData>>(API_ENDPOINTS.SAVE, params)).data
  },
  async deleteDetail(empVacationId: number): Promise<ApiResponse<{ empVacationId: number }>> {
    return (await api.post<ApiResponse<{ empVacationId: number }>>(API_ENDPOINTS.DELETE, { empVacationId })).data
  },
  async batchValidate(empAccounts: string[]): Promise<ApiResponse<IBatchValidateData>> {
    return (await api.post<ApiResponse<IBatchValidateData>>(API_ENDPOINTS.BATCH_VALIDATE, { empAccounts })).data
  },
  async batchImport(params: IBatchImportParams): Promise<ApiResponse<IBatchImportData>> {
    return (await api.post<ApiResponse<IBatchImportData>>(API_ENDPOINTS.BATCH_IMPORT, params)).data
  }
}
export default tm002Service
```

## 已知陷阱

- **`return response.data`** 不是 `return response` — Service 回傳解包後的 `ApiResponse<T>`，不是 `AxiosResponse`
- **全部 POST** — EAP 統一 POST 入口 `/api/{routeId}`，不使用 GET/PUT/DELETE
- **`import { api } from 'boot/axios'`** — 不可直接 import axios
- **QUERY 端點名** — TM002 的 QUERY 為 `/empVacationQuery`（非 `/tm002Query`），需對照後端 Camel Route
- **object literal** — `export const xxxService = { ... }`，不是 class，不需要 new
