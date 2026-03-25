# eap 前端代碼模式

> 權威來源：`Docs/EAP_FRONTEND_ARCHITECTURE.md` + `Docs/FRONTEND_ERROR_HANDLING_GUIDE.md`
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

## 禁止模式

- ❌ Page 直接呼叫 API/Service（透過 Store）
- ❌ 硬編碼錯誤訊息（用 `useErrorHandler` + 錯誤碼 i18n）
- ❌ 使用後端 `response.message` 顯示錯誤
- ❌ 使用 `any` 型別
- ❌ 使用 `console.log`（production 只允許 warn/error）
- ❌ 直接 import axios（用 `api` from `src/boot/axios`）
- ❌ 直接操作 DOM
- ❌ 為 CRUD 建獨立路由（用 Dialog）

## ⚠️ 與現有代碼的差異

AU001 Store 範例中直接呼叫 `api.post()` 而非 Service — 這是 Docs 自身範例的瑕疵。實際開發應透過 Service 層。遇到衝突時**以本規範為準**。
