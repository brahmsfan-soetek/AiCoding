# Frontend: Store 模板（Pinia）

## Setup Syntax（推薦新模組使用）

```typescript
// src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { {moduleCode}Service } from 'src/services/{module}/{moduleCode}/{moduleCode}Service'
import type { I{EntityName}, I{EntityName}QueryParams } from 'src/types/{module}/{moduleCode}Types'
import { useErrorHandler } from 'src/composables/useErrorHandler'

export const use{ModuleCode}Store = defineStore('{moduleCode}', () => {

  const { handleApiError } = useErrorHandler()

  // ==================== State ====================

  const records = ref<I{EntityName}[]>([])
  const totalCount = ref(0)
  const queryLoading = ref(false)
  const saveLoading = ref(false)
  const deleteLoading = ref(false)

  // ==================== Getters (Computed) ====================

  const hasData = computed(() => records.value.length > 0)

  const isAnyLoading = computed(() =>
    queryLoading.value || saveLoading.value || deleteLoading.value
  )

  // ==================== Actions ====================

  async function query(params?: I{EntityName}QueryParams): Promise<boolean> {
    queryLoading.value = true
    try {
      const response = await {moduleCode}Service.query(params)
      if (!handleApiError(response)) return false
      records.value = response.data?.records || []
      totalCount.value = response.data?.totalCount || 0
      return true
    } catch (err: unknown) {
      handleApiError(err)
      return false
    } finally {
      queryLoading.value = false
    }
  }

  async function create(data: Partial<I{EntityName}>): Promise<boolean> {
    saveLoading.value = true
    try {
      const response = await {moduleCode}Service.create(data)
      if (!handleApiError(response)) throw response
      return true
    } catch (err: unknown) {
      handleApiError(err)
      throw err  // 讓 Dialog 層知道失敗
    } finally {
      saveLoading.value = false
    }
  }

  async function update(data: Partial<I{EntityName}>): Promise<boolean> {
    saveLoading.value = true
    try {
      const response = await {moduleCode}Service.update(data)
      if (!handleApiError(response)) throw response
      return true
    } catch (err: unknown) {
      handleApiError(err)
      throw err
    } finally {
      saveLoading.value = false
    }
  }

  async function deleteRecords(params: { ids: number[] }): Promise<boolean> {
    deleteLoading.value = true
    try {
      const response = await {moduleCode}Service.delete(params)
      if (!handleApiError(response)) throw response
      return true
    } catch (err: unknown) {
      handleApiError(err)
      throw err
    } finally {
      deleteLoading.value = false
    }
  }

  function $reset() {
    records.value = []
    totalCount.value = 0
    queryLoading.value = false
    saveLoading.value = false
    deleteLoading.value = false
  }

  // ==================== Return ====================

  return {
    // State
    records, totalCount, queryLoading, saveLoading, deleteLoading,
    // Getters
    hasData, isAnyLoading,
    // Actions
    query, create, update, delete: deleteRecords, $reset
  }
})
```

## Object Syntax（適合大型模組，也合規）

```typescript
// src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts

import { defineStore } from 'pinia'
import { {moduleCode}Service } from 'src/services/{module}/{moduleCode}/{moduleCode}Service'
import type { I{EntityName} } from 'src/types/{module}/{moduleCode}Types'

interface {ModuleCode}State {
  records: I{EntityName}[]
  totalCount: number
  queryLoading: boolean
  saveLoading: boolean
}

export const use{ModuleCode}Store = defineStore('{moduleCode}', {
  state: (): {ModuleCode}State => ({
    records: [],
    totalCount: 0,
    queryLoading: false,
    saveLoading: false
  }),

  getters: {
    hasData: (state): boolean => state.records.length > 0
  },

  actions: {
    async query(params?: Record<string, unknown>) {
      try {
        this.queryLoading = true
        const response = await {moduleCode}Service.query(params)
        if (response.success && response.data) {
          this.records = response.data.records || []
          this.totalCount = response.data.totalCount || 0
        }
      } finally {
        this.queryLoading = false
      }
    },

    async create(data: Partial<I{EntityName}>) {
      try {
        this.saveLoading = true
        const response = await {moduleCode}Service.create(data)
        return response.success
      } finally {
        this.saveLoading = false
      }
    }
  }
})
```

> ⚠️ Object Syntax 無法直接使用 `useErrorHandler` composable（Pinia 限制）。錯誤處理需由呼叫端（Page/Dialog）執行 `handleApiError()`。

## 結構要點

- **兩種語法都合規** — 新模組推薦 Setup，大型模組可用 Object
- **分離 Loading** — `queryLoading`, `saveLoading`, `deleteLoading` 分開
- **錯誤處理** — Setup 語法使用 `useErrorHandler`，不硬編碼錯誤訊息、不直接使用 `response.message`
- **CUD 方法 throw error** — 讓 Dialog/Page 層知道失敗
- **Store 呼叫 Service** — 不直接呼叫 `api.post()`
- **`$reset()`** — 重置所有狀態的方法
- **explicit return** — Setup Syntax 用 return 控制公開介面

## Dropdown/LOV 批次載入（複雜模組）

```typescript
// PM001/RM001/TM001 模式：批次載入下拉選單
import { lovService } from 'src/services/common/lovService'  // ⭐ 共用 LOV Service

const dropdownsLoaded = ref(false)

async function loadDropdowns() {
  if (dropdownsLoaded.value) return
  try {
    const [companies, departments, positions] = await Promise.all([
      lovService.load('companyList'),
      lovService.load('departmentList'),
      lovService.load('positionList')
    ])
    companyOptions.value = companies
    departmentOptions.value = departments
    positionOptions.value = positions
    dropdownsLoaded.value = true
  } catch (err) {
    console.warn('載入下拉選單失敗', err)
  }
}
```

> `lovService` 來源：`src/services/common/lovService.ts`，呼叫 `POST /api/lov { lovType }` 取得下拉選單資料。
