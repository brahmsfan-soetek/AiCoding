# Frontend: 頁面模板（薄殼 + 組件組裝）

> 參考：GL002.vue、GL012.vue（使用者調版基準）。頁面只做組裝和路由，不放業務邏輯。

## 模式 A：Dialog 式（查詢 + Dialog 新增/編輯）

適用：簡單 CRUD 頁面，新增/編輯用 Dialog。

```vue
<!-- src/pages/{module}/{code}/{CODE}.vue -->

<template>
  <q-page class="q-pa-md">
    <{Code}ListSection
      @open-create="openCreateDialog"
      @open-edit="openEditDialog"
    />

    <{Code}FormDialog
      v-model="showDialog"
      :mode="dialogMode"
      :edit-data="dialogData"
      @saved="handleSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSessionStore } from 'stores/common/session'
import {Code}ListSection from 'components/{module}/{code}/{Code}ListSection.vue'
import {Code}FormDialog from 'components/{module}/{code}/{Code}FormDialog.vue'

const sessionStore = useSessionStore()

const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogData = ref<any>(null)

const openCreateDialog = () => {
  dialogData.value = null
  dialogMode.value = 'create'
  showDialog.value = true
}

const openEditDialog = (row: any) => {
  dialogData.value = { ...row }
  dialogMode.value = 'edit'
  showDialog.value = true
}

// ListSection 暴露 refresh 方法或由 store 驅動
const handleSaved = () => {
  // ListSection 內部 watch store 或 emit 觸發重查
}

onMounted(() => {
  sessionStore.setPagePid('{CODE}')
})
</script>
```

## 模式 B：List/Editor 切換式（行內編輯）

適用：複雜表單頁面（如 GL002 期間範本、GL012 期間狀態），新增/編輯切換整個視圖。

```vue
<!-- src/pages/{module}/{code}/{CODE}.vue -->

<template>
  <q-page class="q-pa-md">
    <{Code}ListSection
      v-if="currentView === 'list'"
      @switch-to-editor="switchToEditor"
    />
    <{Code}EditorSection
      v-if="currentView === 'editor'"
      :edit-mode="editMode"
      :edit-data="editData"
      @switch-to-list="switchToList"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSessionStore } from 'stores/common/session'
import {Code}ListSection from 'components/{module}/{code}/{Code}ListSection.vue'
import {Code}EditorSection from 'components/{module}/{code}/{Code}EditorSection.vue'

const sessionStore = useSessionStore()

const currentView = ref<'list' | 'editor'>('list')
const editMode = ref<'create' | 'edit'>('create')
const editData = ref<any>(null)

const switchToEditor = (mode: 'create' | 'edit', data?: any) => {
  editMode.value = mode
  editData.value = data || null
  currentView.value = 'editor'
}

const switchToList = () => {
  currentView.value = 'list'
  editMode.value = 'create'
  editData.value = null
}

onMounted(() => {
  sessionStore.setPagePid('{CODE}')
})
</script>
```

**結構要點**：
- **頁面是薄殼** — 只做 `q-page` 容器 + 組件組裝 + 視圖切換，不放查詢/表格/表單邏輯
- **無 `<style>` 區塊** — 頁面層不寫自訂 CSS
- `sessionStore.setPagePid('{CODE}')` — **必須**在 onMounted，SBtn 權限依賴此值
- **模式選擇**：簡單 CRUD 用模式 A（Dialog），複雜表單用模式 B（List/Editor 切換）
- 組件拆分：ListSection（查詢+列表）、FormDialog 或 EditorSection（編輯）各自獨立
