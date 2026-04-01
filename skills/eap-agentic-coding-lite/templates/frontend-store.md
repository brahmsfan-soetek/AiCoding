---
name: frontend-store
applies_to: "src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts"
---

## 說明

Pinia Store（Setup Syntax）：管理模組狀態、呼叫 Service、處理錯誤。Store 是 Page 與 Service 之間的唯一橋梁，包含前端計算邏輯（如年資計算）。

## 依規格調整的部分

- State 欄位：依 Types 介面決定（detailRecords / defaultVacationItems / employeeInfo / batchValidateResults）
- Action 方法數量：對應 Service 方法（標準 CRUD 為 4 個，TM002 有 8 個）
- 前端計算邏輯：如 `queryEmpInfo` 中的年資計算，依業務需求決定

## 完整參考實作

```typescript
// src/stores/{module}/{moduleCode}/use{ModuleCode}Store.ts

import { defineStore } from 'pinia'                    // 🔒 Pinia Setup Syntax
import { ref, computed } from 'vue'
import { tm002Service } from 'src/services/tm/tm002Service'
import { useErrorHandler } from 'src/composables/useErrorHandler'  // 🔒 統一錯誤處理
import type {
  IEmpVacationListItem, IEmpVacationQueryParams,
  IEmpVacationDetail, IDefaultVacationItem,
  IEmployeeInfo, IBatchValidateResult,
  IEmpVacationSaveParams, IBatchImportParams
} from 'src/types/tm/tm002'

export const useTm002Store = defineStore('tm002', () => {
  const { showError } = useErrorHandler()

  // 🔧 State — 欄位依 Types 介面對應
  const records = ref<IEmpVacationListItem[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const queryLoading = ref(false)
  const saveLoading = ref(false)
  const deleteLoading = ref(false)
  const detailRecords = ref<IEmpVacationDetail[]>([])
  const defaultVacationItems = ref<IDefaultVacationItem[]>([])
  const employeeInfo = ref<IEmployeeInfo | null>(null)
  const batchValidateResults = ref<IBatchValidateResult[]>([])

  // Getters
  const hasData = computed(() => records.value.length > 0)

  // 🔧 Actions — 每個 action 對應一個 Service 方法
  async function query(params?: IEmpVacationQueryParams): Promise<boolean> {
    queryLoading.value = true
    try {
      const response = await tm002Service.query(params)
      if (response.success && response.data) {
        records.value = response.data.records || []
        totalCount.value = response.data.totalCount || 0
        currentPage.value = response.data.currentPage || 1
        return true
      }
      return false
    } catch (err: unknown) { showError(err); return false }
    finally { queryLoading.value = false }
  }

  // 🔒 queryEmpInfo — 查不到時顯示 warning，不 throw
  async function queryEmpInfo(empAccount: string): Promise<IEmployeeInfo | null> {
    try {
      const response = await tm002Service.queryEmpInfo(empAccount)
      if (response.success && response.data) {
        const info = response.data as unknown as IEmployeeInfo
        // 🔒 欄位名稱是 assumeDate（到職日），不是 hireDate
        if (info.assumeDate) {
          const hire = new Date(String(info.assumeDate).replace(/\//g, '-'))
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
      // 🔒 安全取得 message 屬性
      const msg = ('message' in response ? String(response.message) : '') || '查無此員工'
      import('quasar').then(({ Notify }) => {
        Notify.create({ type: 'warning', message: msg, position: 'top' })
      })
      return null
    } catch (err: unknown) { showError(err); return null }
  }

  // 🔒 loadDefaultVacation 不帶參數 — Service 自行處理
  async function loadDefaultVacation(): Promise<boolean> {
    try {
      const response = await tm002Service.getDefaultVacation()
      if (response.success && response.data) {
        defaultVacationItems.value = response.data.records || []
        return true
      }
      return false
    } catch (err: unknown) { showError(err); return false }
  }

  async function queryDetail(empId: number, year: number): Promise<boolean> {
    queryLoading.value = true
    try {
      const response = await tm002Service.queryDetail(empId, year)
      if (response.success && response.data) {
        detailRecords.value = response.data.records || []
        return true
      }
      return false
    } catch (err: unknown) { showError(err); return false }
    finally { queryLoading.value = false }
  }

  // 🔒 saveDetails / deleteDetail — 只 throw，不呼叫 showError（axios 攔截器已用 Dialog 顯示）
  async function saveDetails(params: IEmpVacationSaveParams): Promise<boolean> {
    saveLoading.value = true
    try {
      const response = await tm002Service.save(params)
      if (response.success) return true
      return false
    } catch (err: unknown) { throw err }
    finally { saveLoading.value = false }
  }

  async function deleteDetail(empVacationId: number): Promise<boolean> {
    deleteLoading.value = true
    try {
      const response = await tm002Service.deleteDetail(empVacationId)
      if (response.success) return true
      return false
    } catch (err: unknown) { throw err }
    finally { deleteLoading.value = false }
  }

  async function batchValidate(empAccounts: string[]): Promise<boolean> {
    try {
      const response = await tm002Service.batchValidate(empAccounts)
      if (response.success && response.data) {
        batchValidateResults.value = response.data.results || []
        return true
      }
      return false
    } catch (err: unknown) { showError(err); return false }
  }

  // 🔒 batchImport — showError + throw（與 saveDetails/deleteDetail 不同）
  async function batchImport(params: IBatchImportParams): Promise<{ createdCount: number; skippedCount: number }> {
    saveLoading.value = true
    try {
      const response = await tm002Service.batchImport(params)
      if (response.success && response.data) {
        return {
          createdCount: response.data.createdCount || 0,
          skippedCount: response.data.skippedCount || 0
        }
      }
      return { createdCount: 0, skippedCount: 0 }
    } catch (err: unknown) { showError(err); throw err }
    finally { saveLoading.value = false }
  }

  // 🔒 Setup Syntax 不自帶 $reset，必須手動實作
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

  return {
    records, totalCount, currentPage,
    queryLoading, saveLoading, deleteLoading,
    detailRecords, defaultVacationItems, employeeInfo, batchValidateResults,
    hasData,
    query, queryEmpInfo, loadDefaultVacation, queryDetail,
    saveDetails, deleteDetail, batchValidate, batchImport, $reset
  }
})
```

## 已知陷阱

- **CUD 錯誤處理分層** — `saveDetails` / `deleteDetail` 只 `throw err`（axios 攔截器已用 Dialog 顯示）；`batchImport` 是 `showError(err); throw err`（兩者不同）；`query` 類只 `showError` 不 throw
- **`queryEmpInfo` 查不到** — 顯示 warning Notify 而非 throw，避免中斷流程
- **年資計算欄位名是 `assumeDate`** — 不是 `hireDate`，且需 `String(info.assumeDate).replace(/\//g, '-')` 處理日期格式
- **`loadDefaultVacation()` 不帶參數** — Service 自行處理年度邏輯
- **`response.data as unknown as IEmployeeInfo`** — queryEmpInfo 需要明確型別轉換
- **`'message' in response`** — 安全取得 message 屬性，不用 `(response as any).message`
- **`$reset()` 必須手動實作** — Setup Syntax 不自帶 `$reset`
- **分離 Loading** — `queryLoading` / `saveLoading` / `deleteLoading` 分開管理
