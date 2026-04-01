# Frontend: Service 模板（export const 物件 + API_ENDPOINTS）

```typescript
// src/services/{module}/{code}Service.ts

import { api } from 'src/boot/axios'
import type { ListResponse, SingleResponse } from 'src/types/common'
import type { Currency } from 'src/types/gl/gl003Types'

/** API 端點常數 */
const API_ENDPOINTS = {
  QUERY: '/glCurrencyQuery',
  CREATE: '/glCurrencyCreate',
  UPDATE: '/glCurrencyUpdate',
  DELETE: '/glCurrencyDelete',
  DROPDOWN: '/gl003Dropdown',
} as const

/**
 * GL003 幣別設定 Service
 * 所有 API 呼叫統一走 POST
 */
export const gl003Service = {

  /** 查詢幣別 */
  async query(params: Record<string, any> = {}) {
    const response = await api.post<ListResponse<Currency>>(API_ENDPOINTS.QUERY, params)
    return response.data
  },

  /** 新增幣別 */
  async create(data: Record<string, any>) {
    const response = await api.post<SingleResponse<Currency>>(API_ENDPOINTS.CREATE, data)
    return response.data
  },

  /** 更新幣別 */
  async update(data: Record<string, any>) {
    const response = await api.post<SingleResponse<Currency>>(API_ENDPOINTS.UPDATE, data)
    return response.data
  },

  /** 刪除幣別 */
  async delete(currencyCode: string) {
    const response = await api.post(API_ENDPOINTS.DELETE, { currencyCode })
    return response.data
  },

  /** 下拉選單 */
  async getDropdownData(params: Record<string, any> = {}) {
    const response = await api.post(API_ENDPOINTS.DROPDOWN, params)
    return response.data
  },
}
```

**結構要點**：
- **`export const` 物件**（非 class），無需 new
- **`API_ENDPOINTS` 常數**集中管理路由名
- 一律 `api.post()`（所有 API 都走 POST）
- 返回 `response.data`（已經是 API 回應格式）
- TypeScript 泛型標註回應型別
