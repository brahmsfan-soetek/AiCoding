# eap 前端代碼模式

> 載入時機：Phase 2 前端 Task

## 三層架構（強制）

```
Page → Store → Service → API
```

Page 不直接呼叫 Service/API。Store 負責業務邏輯和狀態。

## 組件結構

全部使用 `<script setup lang="ts">` + `<template>` + `<style scoped>`

## import 順序

```typescript
import { ref, computed, onMounted } from 'vue'    // 1. vue/quasar
import { useQuasar } from 'quasar'
import { useSessionStore } from 'stores/...'       // 2. stores
import { xxxService } from 'src/services/...'      // 3. services
import type { IEntity } from 'src/types/...'       // 4. types
import MyComponent from './MyComponent.vue'         // 5. components
```

## 權限控制（雙層）

```typescript
// Page 層：onMounted 設定
onMounted(() => {
  sessionStore.setPagePid('AU010')  // ⭐ 必須
})
```

```vue
<!-- 組件層：permission-id -->
<s-btn permission-id="btnQuery" @click="handleQuery" />
```

## 頁面模式 — Dialog（非路由）

新增/編輯用 Dialog 在同頁內，不建獨立路由頁面。複雜頁面拆為 Section 組件。

## Store 語法

兩種都合規，**新模組推薦 Setup**：

```typescript
// Setup Syntax（推薦）
export const useXxxStore = defineStore('xxx', () => { ... })

// Object Syntax（大型模組可用）
export const useXxxStore = defineStore('xxx', { state, getters, actions })
```

## Service 模式

```typescript
export const xxxService = {
  async query(params) { return (await api.post(ENDPOINT, params)).data }
}
```

## 錯誤處理

```typescript
import { useErrorHandler } from 'src/composables/useErrorHandler'
const { handleApiError, showError } = useErrorHandler()

// 統一處理（不硬編碼訊息、不直接用後端 message）
// ⚠️ Service 已回傳 response.data，Store 收到的就是解包後的資料
if (!handleApiError(response)) return
```

> **useErrorHandler 行為**：檢查 `response.success`，若為 `false` 則以 `response.message` 或錯誤碼查 i18n 顯示 Quasar Notify。回傳 `boolean` 表示是否成功。`showError(msg)` 直接顯示錯誤訊息。

## SDialog2 使用模式（強制）

SDialog2 有兩種模式，業務 Dialog **一律使用 Slot 模式**：

```vue
<!-- ✅ 正確：Slot 模式（業務 Dialog 必用） -->
<s-dialog2 v-model="dialogVisible" title="標題" width="900px"
  :confirm-label="'確定'" :cancel-label="'取消'"
  :loading="store.saveLoading"
  @confirm="handleSave" @cancel="handleCancel">
  <!-- 內容直接放入，SDialog2 自動包裹 q-card + 標題 + 底部按鈕 -->
  <div>你的表單內容</div>
</s-dialog2>
```

**Slot 模式行為**（`$slots.default` 存在時）：
1. SDialog2 **自動**用 `q-card` 包裹全部內容（提供白色背景 + 圓角）
2. SDialog2 **自動**渲染標題區（title + 關閉按鈕）
3. SDialog2 **自動**渲染底部按鈕區（cancel + confirm，受 `showActions` 控制，預設 `true`）
4. 你只需提供 `<slot>` 內容，**不需自己包 `<q-card>`、不需自己放按鈕**

```vue
<!-- ❌ 錯誤：在 SDialog2 內再包 q-card（雙重包裹） -->
<s-dialog2 v-model="show" title="標題">
  <q-card>  <!-- 多餘！SDialog2 已自動包裹 -->
    <q-card-section>...</q-card-section>
    <q-card-actions>  <!-- 多餘！SDialog2 已提供 -->
      <s-btn label="取消" />
      <s-btn label="確定" />
    </q-card-actions>
  </q-card>
</s-dialog2>
```

## 統一 LOV 級聯下拉模式（🔒 固定模式）

當下拉選項有父子關係（如「假別」→「假別細項」）時，使用**統一 LOV 模式**：
一次 LOV 呼叫取得完整清單，前端從中推導兩層下拉。

```typescript
// 🔒 統一 LOV — 一次呼叫取得所有明細項（含父層資訊）
interface VacDetailOption {
  vacationSubId: number
  vacationCode: string      // 父層 code
  vacationName: string      // 父層名稱
  vacationSubCode: string | null
  vacationSubName: string | null
  maxHours: number | null
}
const allDetailOptions = ref<VacDetailOption[]>([])

async function loadVacationOptions() {
  const res = await LovService.loadLovAll('tm002VacationDetailList')
  if (res?.success && res.items) {
    allDetailOptions.value = res.items.map((i: Record<string, unknown>) => ({
      vacationSubId: Number(i.vacationSubId || i.vacationsubid || 0),
      vacationCode: String(i.vacationCode || i.vacationcode || ''),
      vacationName: String(i.vacationName || i.vacationname || ''),
      vacationSubCode: i.vacationSubCode ? String(i.vacationSubCode) : null,
      vacationSubName: i.vacationSubName ? String(i.vacationSubName) : null,
      maxHours: i.maxHours != null ? Number(i.maxHours) : null
    }))
  }
}

// 🔒 從統一 LOV 推導父層下拉（按 vacationCode 去重）
const vacTypeOptions = computed(() => {
  const map = new Map<string, string>()
  for (const d of allDetailOptions.value) {
    if (!map.has(d.vacationCode)) map.set(d.vacationCode, d.vacationName)
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }))
})

// 🔒 取得該父層下的子層選項
function getDetailsByCode(vacationCode?: string): VacDetailOption[] {
  if (!vacationCode) return []
  return allDetailOptions.value.filter(d => d.vacationCode === vacationCode)
}

function getSubOptions(vacationCode?: string) {
  return getDetailsByCode(vacationCode).map(d => ({
    value: d.vacationSubId,
    label: d.vacationSubName || d.vacationName
  }))
}

// 🔒 hasMultipleSubs — >1 才顯示下拉，=1 顯示文字
function hasMultipleSubs(vacationCode?: string): boolean {
  return getDetailsByCode(vacationCode).length > 1
}

// 🔒 onVacTypeChange — =1 自動帶入，>1 清空
function onVacTypeChange(row: DetailRow) {
  const found = vacTypeOptions.value.find(o => o.value === row.vacationCode)
  row.vacationName = found?.label || ''
  const subs = getDetailsByCode(row.vacationCode)
  if (subs.length === 1) {
    row.vacationSubId = subs[0].vacationSubId
    row.vacationSubName = subs[0].vacationSubName || subs[0].vacationName
  } else {
    row.vacationSubId = 0
    row.vacationSubName = ''
  }
}
```

```vue
<!-- 🔒 父層下拉 — 從統一 LOV 推導 -->
<s-select2 v-model="row.vacationCode" :options="vacTypeOptions"
  option-label="label" option-value="value" dense emit-value map-options
  @update:model-value="onVacTypeChange(row)" />

<!-- 🔒 子層：>1 筆顯示下拉，=1 筆顯示文字 -->
<s-select2 v-if="hasMultipleSubs(row.vacationCode)"
  v-model="row.vacationSubId" :options="getSubOptions(row.vacationCode)"
  option-label="label" option-value="value" dense emit-value map-options />
<span v-else class="text-grey-7">{{ row.vacationSubName || '—' }}</span>
```

> **⚠️ 禁止的做法**：
> - ❌ 兩個獨立 LOV 呼叫（`loadParentOptions()` + `loadChildOptions()`）
> - ❌ 無子選項時顯示 `'---'`（正確做法是 =1 筆顯示文字標籤）
> - ❌ 永遠顯示下拉（只有 >1 筆才顯示）

## 禁止模式

- ❌ Page 直接呼叫 API/Service（透過 Store）
- ❌ 硬編碼錯誤訊息（用 `useErrorHandler` + 錯誤碼 i18n）
- ❌ 使用後端 `response.message` 顯示錯誤
- ❌ 使用 `any` 型別
- ❌ 使用 `console.log`（production 只允許 warn/error）
- ❌ 直接 import axios（用 `api` from `src/boot/axios`）
- ❌ 直接操作 DOM
- ❌ 為 CRUD 建獨立路由（用 Dialog）
- ❌ **修改 `src/components/common/` 下的共用組件**（SDialog2, SBtn, SInput, SSelect2, SCard, SLov, SDatePicker, FileUpload 等）— 這些是跨模組共用的基礎設施，任何修改都會破壞所有現有頁面
- ❌ 在 SDialog2 Slot 模式下自己包 `<q-card>` 或自己放確認/取消按鈕（SDialog2 已自動提供）

## ⚠️ 與現有代碼的差異

AU001 Store 範例中直接呼叫 `api.post()` 而非 Service — 這是 Docs 自身範例的瑕疵。實際開發應透過 Service 層。遇到衝突時**以本規範為準**。
