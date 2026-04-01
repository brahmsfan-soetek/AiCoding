# Frontend: Service 模板

## 範例代碼

```typescript
// src/services/{module}/{moduleCode}/{moduleCode}Service.ts

import { api } from 'src/boot/axios'
import type { ApiResponse } from 'src/types/common/api'
import type {
  I{EntityName},
  I{EntityName}QueryParams,
  I{EntityName}QueryData,
  I{EntityName}CreateData,
  I{EntityName}DeleteData
} from 'src/types/{module}/{moduleCode}Types'

// ==========================================
// API 端點常數
// ==========================================

const API_ENDPOINTS = {
  QUERY: '/{routePrefix}Query',
  CREATE: '/{routePrefix}Create',
  UPDATE: '/{routePrefix}Update',
  DELETE: '/{routePrefix}Delete',
  GET_BY_ID: '/{routePrefix}GetById'
} as const

// ==========================================
// Service 實作
// ==========================================

export const {moduleCode}Service = {

  /**
   * 查詢列表
   */
  async query(params?: I{EntityName}QueryParams): Promise<ApiResponse<I{EntityName}QueryData>> {
    const response = await api.post<ApiResponse<I{EntityName}QueryData>>(
      API_ENDPOINTS.QUERY,
      params || {}
    )
    return response.data
  },

  /**
   * 新增
   */
  async create(data: Partial<I{EntityName}>): Promise<ApiResponse<I{EntityName}CreateData>> {
    const response = await api.post<ApiResponse<I{EntityName}CreateData>>(
      API_ENDPOINTS.CREATE,
      data
    )
    return response.data
  },

  /**
   * 更新
   */
  async update(data: Partial<I{EntityName}>): Promise<ApiResponse<I{EntityName}CreateData>> {
    const response = await api.post<ApiResponse<I{EntityName}CreateData>>(
      API_ENDPOINTS.UPDATE,
      data
    )
    return response.data
  },

  /**
   * 刪除（批次）
   */
  async delete(params: { ids: number[] }): Promise<ApiResponse<I{EntityName}DeleteData>> {
    const response = await api.post<ApiResponse<I{EntityName}DeleteData>>(
      API_ENDPOINTS.DELETE,
      params
    )
    return response.data
  },

  /**
   * 查詢單筆
   */
  async getById(id: number): Promise<ApiResponse<I{EntityName}>> {
    const response = await api.post<ApiResponse<I{EntityName}>>(
      API_ENDPOINTS.GET_BY_ID,
      { {pkField}: id }
    )
    return response.data
  }
}

export default {moduleCode}Service
```

## 結構要點

- **物件模式** — `export const xxxService = { ... }`（不是 class、不需要 new）
- **API_ENDPOINTS 常數** — 集中管理端點路徑，`as const` 確保不可變
- **全部 POST** — EAP 統一 POST 入口 `/api/{routeId}`
- **型別安全** — `api.post<ApiResponse<T>>()` 泛型回應
- **return response.data** — Service 回傳解包後的資料（不是 AxiosResponse）
- **import api** — 從 `src/boot/axios` 引入封裝好的 axios instance
- **無業務邏輯** — Service 只做 API 呼叫，資料轉換在 Store
- **參數轉換**（如需要）— 前端欄位名 → 後端欄位名的映射放在 Service（見 AU010 region→location）
