# Frontend: Store 模板（Pinia Setup API）

```typescript
// src/stores/{module}/{code}/use{Code}Store.ts

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { gl003Service } from 'src/services/gl/gl003Service'

export const useGl003Store = defineStore('gl003', () => {
  // ── State ──
  const records = ref<any[]>([])
  const totalCount = ref(0)
  const queryLoading = ref(false)
  const saveLoading = ref(false)
  const deleteLoading = ref(false)
  const error = ref<string | null>(null)
  const validationErrors = ref<Record<string, string>>({})

  // ── Getters ──
  const hasData = computed(() => records.value.length > 0)

  // ── Actions ──

  /** 查詢 */
  async function query(conditions?: Record<string, any>) {
    queryLoading.value = true
    error.value = null
    try {
      const response = await gl003Service.query(conditions || {})
      if (response.success) {
        records.value = response.data.records || response.data.items || []
        totalCount.value = response.data.totalCount || 0
      }
    } catch (err: any) {
      error.value = err.message || '查詢失敗'
    } finally {
      queryLoading.value = false
    }
  }

  /** 新增（返回 boolean） */
  async function create(formData: Record<string, any>): Promise<boolean> {
    saveLoading.value = true
    error.value = null
    validationErrors.value = {}
    try {
      const response = await gl003Service.create(formData)
      return response.success === true
    } catch (err: any) {
      if (err.isValidationError && err.validationErrors) {
        setValidationErrors(err.validationErrors)
        return false
      }
      error.value = err.message || '新增失敗'
      return false
    } finally {
      saveLoading.value = false
    }
  }

  /** 更新（返回 boolean） */
  async function update(formData: Record<string, any>): Promise<boolean> {
    saveLoading.value = true
    error.value = null
    validationErrors.value = {}
    try {
      const response = await gl003Service.update(formData)
      return response.success === true
    } catch (err: any) {
      if (err.isValidationError && err.validationErrors) {
        setValidationErrors(err.validationErrors)
        return false
      }
      error.value = err.message || '更新失敗'
      return false
    } finally {
      saveLoading.value = false
    }
  }

  /** 刪除（返回 boolean） */
  async function deleteItem(key: string): Promise<boolean> {
    deleteLoading.value = true
    error.value = null
    try {
      const response = await gl003Service.delete(key)
      return response.success === true
    } catch (err: any) {
      error.value = err.message || '刪除失敗'
      return false
    } finally {
      deleteLoading.value = false
    }
  }

  /** 設置後端驗證錯誤 */
  function setValidationErrors(errors: Array<{ field: string; message: string }>) {
    const mapped: Record<string, string> = {}
    for (const e of errors) { mapped[e.field] = e.message }
    validationErrors.value = mapped
  }

  function clearError() { error.value = null }

  /** 完整重置 */
  function $reset() {
    records.value = []
    totalCount.value = 0
    error.value = null
    validationErrors.value = {}
    queryLoading.value = false
    saveLoading.value = false
    deleteLoading.value = false
  }

  return {
    // State
    records, totalCount, queryLoading, saveLoading, deleteLoading,
    error, validationErrors,
    // Getters
    hasData,
    // Actions
    query, create, update, deleteItem, clearError, $reset,
  }
})
```

**結構要點**：
- **Setup API**（`defineStore('id', () => { ... })`）— 專案新 store 標準
- `ref()` + `computed()` 取代 state/getters
- 每個操作獨立 loading：`queryLoading`, `saveLoading`, `deleteLoading`
- **CUD 返回 `Promise<boolean>`** — Page 依據成功/失敗決定後續動作
- `return { }` 明確公開介面，私有函式不暴露
