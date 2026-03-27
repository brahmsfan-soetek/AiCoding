---
name: frontend-store
applies_to: "src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts"
---

## 說明

Pinia Store（Setup Syntax）：管理模組狀態、呼叫 Service、處理錯誤。TM002 使用 Setup Syntax + `useErrorHandler`。

## 替換規則

- `{ModuleCode}` → PascalCase 模組代碼（如 `Tm002`）
- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{EntityName}` → 清單項目介面名（如 `EmpVacationListItem`）
- `{QueryParamsType}` → 查詢參數介面名（如 `EmpVacationQueryParams`）
- `{DetailType}` → 明細介面名（如 `EmpVacationDetail`）

## 完整參考實作

```typescript
// src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts

/**
 * {MODULE_CODE} {moduleTitle} - Store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { {moduleCode}Service } from 'src/services/{module}/{moduleCode}Service'
import { useErrorHandler } from 'src/composables/useErrorHandler'
import type {
  I{EntityName},
  I{QueryParamsType},
  I{DetailType},
  I{DefaultVacationItemType},
  I{EmployeeInfoType},
  I{BatchValidateResultType},
  I{SaveParamsType},
  I{BatchImportParamsType}
} from 'src/types/{module}/{moduleCode}'

export const use{ModuleCode}Store = defineStore('{moduleCode}', () => {

  const { showError } = useErrorHandler()

  // ==================== State ====================

  const records = ref<I{EntityName}[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const queryLoading = ref(false)
  const saveLoading = ref(false)
  const deleteLoading = ref(false)

  // Dialog 相關 state
  // {依規格調整：明細記錄、預設資料、員工資訊、批次驗證結果等}
  const detailRecords = ref<I{DetailType}[]>([])
  const defaultVacationItems = ref<I{DefaultVacationItemType}[]>([])
  const employeeInfo = ref<I{EmployeeInfoType} | null>(null)
  const batchValidateResults = ref<I{BatchValidateResultType}[]>([])

  // ==================== Getters ====================

  const hasData = computed(() => records.value.length > 0)
  const isAnyLoading = computed(() =>
    queryLoading.value || saveLoading.value || deleteLoading.value
  )

  // ==================== Actions ====================

  /** 清單查詢 */
  async function query(params?: I{QueryParamsType}): Promise<boolean> {
    queryLoading.value = true
    try {
      const response = await {moduleCode}Service.query(params)
      if (response.success && response.data) {
        records.value = response.data.records || []
        totalCount.value = response.data.totalCount || 0
        currentPage.value = response.data.currentPage || 1
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      return false
    } finally {
      queryLoading.value = false
    }
  }

  /** 員工資訊查詢 */
  async function queryEmpInfo(empAccount: string): Promise<I{EmployeeInfoType} | null> {
    try {
      const response = await {moduleCode}Service.queryEmpInfo(empAccount)
      if (response.success && response.data) {
        const info = response.data
        // {前端計算邏輯：如年資計算}
        if (info.hireDate) {
          const hire = new Date(info.hireDate.replace(/\//g, '-'))
          const now = new Date()
          let years = now.getFullYear() - hire.getFullYear()
          let months = now.getMonth() - hire.getMonth()
          if (now.getDate() < hire.getDate()) months--
          if (months < 0) { years--; months += 12 }
          info.seniority = `${years}年${months}月`
        }
        employeeInfo.value = info
        return info
      }
      employeeInfo.value = null
      const msg = (response as any).message || '查無此員工'
      import('quasar').then(({ Notify }) => {
        Notify.create({ type: 'warning', message: msg, position: 'top' })
      })
      return null
    } catch (err: unknown) {
      showError(err)
      return null
    }
  }

  /** 執行預設 */
  async function loadDefaultVacation(year: number): Promise<boolean> {
    try {
      const response = await {moduleCode}Service.getDefaultVacation(year)
      if (response.success && response.data) {
        defaultVacationItems.value = response.data.records || []
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      return false
    }
  }

  /** 明細查詢 */
  async function queryDetail(empId: number, year: number): Promise<boolean> {
    queryLoading.value = true
    try {
      const response = await {moduleCode}Service.queryDetail(empId, year)
      if (response.success && response.data) {
        detailRecords.value = response.data.records || []
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      return false
    } finally {
      queryLoading.value = false
    }
  }

  /** 儲存明細 */
  async function saveDetails(params: I{SaveParamsType}): Promise<boolean> {
    saveLoading.value = true
    try {
      const response = await {moduleCode}Service.save(params)
      if (response.success) {
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      throw err  // 讓 Dialog 層知道失敗
    } finally {
      saveLoading.value = false
    }
  }

  /** 刪除明細 */
  async function deleteDetail(empVacationId: number): Promise<boolean> {
    deleteLoading.value = true
    try {
      const response = await {moduleCode}Service.deleteDetail(empVacationId)
      if (response.success) {
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      throw err
    } finally {
      deleteLoading.value = false
    }
  }

  /** 批次驗證 */
  async function batchValidate(empAccounts: string[]): Promise<boolean> {
    try {
      const response = await {moduleCode}Service.batchValidate(empAccounts)
      if (response.success && response.data) {
        batchValidateResults.value = response.data.results || []
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      return false
    }
  }

  /** 批次匯入 */
  async function batchImport(params: I{BatchImportParamsType}): Promise<{ createdCount: number; skippedCount: number }> {
    saveLoading.value = true
    try {
      const response = await {moduleCode}Service.batchImport(params)
      if (response.success && response.data) {
        return {
          createdCount: response.data.createdCount || 0,
          skippedCount: (response.data as any).skippedCount || 0
        }
      }
      return { createdCount: 0, skippedCount: 0 }
    } catch (err: unknown) {
      showError(err)
      throw err
    } finally {
      saveLoading.value = false
    }
  }

  /** 重置 */
  function $reset() {
    records.value = []
    totalCount.value = 0
    currentPage.value = 1
    queryLoading.value = false
    saveLoading.value = false
    deleteLoading.value = false
    detailRecords.value = []
    defaultVacationItems.value = []
    employeeInfo.value = null
    batchValidateResults.value = []
  }

  // ==================== Return ====================

  return {
    // State
    records, totalCount, currentPage,
    queryLoading, saveLoading, deleteLoading,
    detailRecords, defaultVacationItems, employeeInfo, batchValidateResults,
    // Getters
    hasData, isAnyLoading,
    // Actions
    query, queryEmpInfo, loadDefaultVacation, queryDetail,
    saveDetails, deleteDetail, batchValidate, batchImport, $reset
  }
})
```

## 簡化版（標準 CRUD 模組）

若模組只有基本 CRUD（無批次、無明細），可簡化為：

```typescript
// src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { {moduleCode}Service } from 'src/services/{module}/{moduleCode}Service'
import { useErrorHandler } from 'src/composables/useErrorHandler'
import type { I{EntityName}, I{EntityName}QueryParams } from 'src/types/{module}/{moduleCode}'

export const use{ModuleCode}Store = defineStore('{moduleCode}', () => {

  const { showError } = useErrorHandler()

  // State
  const records = ref<I{EntityName}[]>([])
  const totalCount = ref(0)
  const queryLoading = ref(false)
  const saveLoading = ref(false)
  const deleteLoading = ref(false)

  // Getters
  const hasData = computed(() => records.value.length > 0)
  const isAnyLoading = computed(() =>
    queryLoading.value || saveLoading.value || deleteLoading.value
  )

  // Actions
  async function query(params?: I{EntityName}QueryParams): Promise<boolean> {
    queryLoading.value = true
    try {
      const response = await {moduleCode}Service.query(params)
      if (response.success && response.data) {
        records.value = response.data.records || []
        totalCount.value = response.data.totalCount || 0
        return true
      }
      return false
    } catch (err: unknown) {
      showError(err)
      return false
    } finally {
      queryLoading.value = false
    }
  }

  async function create(data: Partial<I{EntityName}>): Promise<boolean> {
    saveLoading.value = true
    try {
      const response = await {moduleCode}Service.create(data)
      if (response.success) return true
      return false
    } catch (err: unknown) {
      showError(err)
      throw err
    } finally {
      saveLoading.value = false
    }
  }

  async function update(data: Partial<I{EntityName}>): Promise<boolean> {
    saveLoading.value = true
    try {
      const response = await {moduleCode}Service.update(data)
      if (response.success) return true
      return false
    } catch (err: unknown) {
      showError(err)
      throw err
    } finally {
      saveLoading.value = false
    }
  }

  async function deleteRecords(params: { ids: number[] }): Promise<boolean> {
    deleteLoading.value = true
    try {
      const response = await {moduleCode}Service.delete(params)
      if (response.success) return true
      return false
    } catch (err: unknown) {
      showError(err)
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

  return {
    records, totalCount, queryLoading, saveLoading, deleteLoading,
    hasData, isAnyLoading,
    query, create, update, delete: deleteRecords, $reset
  }
})
```

## 業務邏輯注意點

- **Setup Syntax** — TM002 使用 Setup Syntax（推薦），不是 Object Syntax
- **`useErrorHandler`** — 透過 `const { showError } = useErrorHandler()` 取得錯誤處理函數，Setup Syntax 才能使用
- **分離 Loading** — `queryLoading` / `saveLoading` / `deleteLoading` 分開管理
- **CUD 方法 throw error** — `saveDetails` / `deleteDetail` / `batchImport` 在 catch 後 `throw err`，讓 Dialog 知道失敗
- **`query` 不 throw** — 查詢失敗只回傳 `false`，不影響 UI 流程
- **Store 呼叫 Service** — 不直接呼叫 `api.post()`
- **`$reset()`** — 必須實作，重置所有 state（Setup Syntax 不自帶 $reset）
- **explicit return** — Setup Syntax 用 return 精確控制公開介面
- **Dialog 相關 state** — `detailRecords` / `employeeInfo` / `batchValidateResults` 等放在 Store，不在 Dialog 本地維護
- **前端計算邏輯** — 如年資計算放在 `queryEmpInfo` 中（資料轉換在 Store，不在 Service）
- **Action 數量** — 依規格決定：標準 CRUD 為 4 個（query/create/update/delete）；TM002 有 8 個 Action
