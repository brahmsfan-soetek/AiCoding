---
name: frontend-page
applies_to: "src/pages/{module}/{moduleCode}/{MODULE_CODE}.vue"
---

## 說明

主頁面組件：查詢區 + 操作按鈕區 + 資料表格 + Dialog 整合。含分頁排序、LOV 下拉載入、permission-id 標記。

> **⚠️ 此模板僅用於主頁面（清單查詢頁面）**，不用於 Create/Edit/Batch 組件。
> - **Dialog 模式**（預設）：Create/Edit/Batch 使用 `frontend-dialog.md` 模板，產出 `components/{ModuleCode}XxxDialog.vue`，由主頁面以 `v-model` 整合
> - **Page 模式**（僅複雜場景）：Detail 頁面可用此模板產出 `{MODULE_CODE}Detail.vue`，需配合獨立路由
>
> 若你正在為 Create/Edit/Batch 功能選擇模板，請使用 `frontend-dialog.md` 而非本模板。

## 替換規則

- `{ModuleCode}` → PascalCase 模組代碼（如 `Tm002`）
- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{MODULE_CODE}` → 大寫格式（如 `TM002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{moduleTitle}` → 模組中文名稱（如 `員工年度假別額度維護`）
- `{pkField}` → 主鍵欄位名（如 `quotaId`）
- `{EntityName}` → 主要實體介面名（如 `EmpVacationListItem`）
- `{queryParamsType}` → 查詢參數介面名（如 `EmpVacationQueryParams`）
- `{defaultSortField}` → 預設排序欄位（如 `empNo`）

## 完整參考實作

```vue
<!-- src/pages/{module}/{moduleCode}/{MODULE_CODE}.vue -->
<template>
  <q-page padding class="eap-page-background">
    <!-- 查詢條件區 -->
    <s-card class="eap-card eap-fade-in q-mb-md eap-card-static">
      <q-card-section>
        <div class="row items-center q-mb-sm">
          <q-icon name="search" size="20px" color="primary" class="q-mr-sm" />
          <span class="text-subtitle1 text-weight-bold">{{ $t(i18nPrefix + 'query.title') }}</span>
        </div>
        <div class="row q-col-gutter-md items-end">
          <!-- {查詢欄位：依規格調整欄位數量與類型} -->
          <div class="col-12 col-md-2">
            <s-input v-model="searchForm.{field1}" :label="$t(i18nPrefix + 'query.{field1}')" filled dense clearable />
          </div>
          <div class="col-12 col-md-2">
            <s-select2 v-model="searchForm.{field2}" :label="$t(i18nPrefix + 'query.{field2}')" :options="{field2Options}"
              option-label="label" option-value="value" dense clearable emit-value map-options />
          </div>
          <div class="col-12 col-md-2">
            <s-input v-model="searchForm.{field3}" :label="$t(i18nPrefix + 'query.{field3}')" filled dense clearable />
          </div>
          <div class="col-12 col-md-2">
            <s-input v-model="searchForm.{field4}" :label="$t(i18nPrefix + 'query.{field4}')" filled dense clearable />
          </div>
          <div class="col-auto">
            <div class="row no-wrap q-gutter-sm">
              <s-btn :label="$t(i18nPrefix + 'query.clearButton')" color="grey" outline @click="clearSearch" />
              <s-btn :label="$t(i18nPrefix + 'query.searchButton')" color="primary" icon="search" @click="handleQuery" />
            </div>
          </div>
        </div>
      </q-card-section>
    </s-card>

    <!-- 操作按鈕區 -->
    <div class="row justify-end q-mb-md q-gutter-sm">
      <!-- {操作按鈕：依規格調整，如批次匯入、單筆新增等} -->
      <s-btn :label="$t(i18nPrefix + 'action.batchImport')" color="secondary" icon="upload_file" @click="showBatchDialog = true" />
      <s-btn :label="$t(i18nPrefix + 'action.addSingle')" color="primary" icon="add" @click="showCreateDialog = true" />
    </div>

    <!-- 資料表格 -->
    <s-card class="eap-card eap-fade-in eap-card-static">
      <q-card-section>
        <q-table :rows="store.records" :columns="columns" row-key="{pkField}" :loading="store.queryLoading"
          :pagination="pagination" flat bordered @request="onRequest">
          <template #body-cell-action="props">
            <q-td :props="props">
              <s-btn flat dense color="primary" icon="edit" :label="$t(i18nPrefix + 'action.edit')"
                @click="openEditDialog(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </s-card>

    <!-- Dialogs -->
    <!-- {Dialog 組合：依規格調整，可能有 Create / Edit / Batch 等} -->
    <{ModuleCode}CreateDialog v-model="showCreateDialog" @saved="handleQuery" />
    <{ModuleCode}EditDialog v-model="showEditDialog" :row-data="selectedRow" @saved="handleQuery" />
    <{ModuleCode}BatchDialog v-model="showBatchDialog" @imported="handleQuery" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from 'stores/common/session'
import { use{ModuleCode}Store } from 'src/stores/{module}/{moduleCode}/use{ModuleCode}Store'
import { LovService } from 'src/services/common/lovService'
import type { I{EntityName}, I{queryParamsType} } from 'src/types/{module}/{moduleCode}'
import {ModuleCode}CreateDialog from './components/{ModuleCode}CreateDialog.vue'
import {ModuleCode}EditDialog from './components/{ModuleCode}EditDialog.vue'
import {ModuleCode}BatchDialog from './components/{ModuleCode}BatchDialog.vue'

const { t } = useI18n()
const i18nPrefix = '{module}.{moduleCode}.'
const sessionStore = useSessionStore()
const store = use{ModuleCode}Store()

// ==================== 查詢表單 ====================

const searchForm = reactive<I{queryParamsType}>({
  // {查詢欄位：依規格調整}
  {field1}: '',
  {field2}: undefined,
  {field3}: '',
  {field4}: '',
  page: 1,
  perPage: 10,
  sortBy: '{defaultSortField}',
  sortOrder: 'asc'
})

// ==================== 下拉選項 ====================
// {LOV 下拉：依規格調整，使用 LovService.loadLovAll() 載入}

const {field2Options} = ref<{ value: string; label: string }[]>([])

// ==================== 表格欄位 ====================

const columns = [
  // {表格欄位：依規格調整，align 使用 as const}
  { name: '{col1}', label: t(i18nPrefix + 'table.{col1}'), field: '{col1}', align: 'center' as const, sortable: true },
  { name: '{col2}', label: t(i18nPrefix + 'table.{col2}'), field: '{col2}', align: 'left' as const, sortable: true },
  { name: '{col3}', label: t(i18nPrefix + 'table.{col3}'), field: '{col3}', align: 'left' as const, sortable: true },
  { name: 'action', label: t(i18nPrefix + 'table.action'), field: 'action', align: 'center' as const }
]

// ==================== 分頁 ====================

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: '{defaultSortField}',
  descending: false
})

// ==================== Dialog 狀態 ====================

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showBatchDialog = ref(false)
const selectedRow = ref<I{EntityName} | null>(null)

// ==================== 方法 ====================

function clearSearch() {
  // {清除邏輯：依查詢欄位調整}
  searchForm.{field1} = ''
  searchForm.{field2} = undefined
  searchForm.{field3} = ''
  searchForm.{field4} = ''
}

async function handleQuery() {
  searchForm.page = pagination.value.page
  searchForm.perPage = pagination.value.rowsPerPage
  await store.query(searchForm)
  pagination.value.rowsNumber = store.totalCount
}

function onRequest(props: { pagination: typeof pagination.value }) {
  pagination.value = props.pagination
  searchForm.sortBy = props.pagination.sortBy || '{defaultSortField}'
  searchForm.sortOrder = props.pagination.descending ? 'desc' : 'asc'
  handleQuery()
}

function openEditDialog(row: I{EntityName}) {
  selectedRow.value = row
  showEditDialog.value = true
}

async function load{Field2}Options() {
  try {
    const res = await LovService.loadLovAll('{lovType}')
    if (res?.success && res.items) {
      {field2Options}.value = res.items.map((i: Record<string, unknown>) => ({
        value: String(i.value || ''),
        label: String(i.label || '')
      }))
    }
  } catch {
    // LOV loading failed silently
  }
}

// ==================== 生命週期 ====================

onMounted(async () => {
  sessionStore.setPagePid('{MODULE_CODE}')  // 必須 — 權限控制依賴
  await load{Field2}Options()
  handleQuery()
})
</script>
```

## 業務邏輯注意點

- **`sessionStore.setPagePid('{MODULE_CODE}')`** — onMounted 中必須呼叫，SBtn 權限機制依賴此值
- **`i18nPrefix`** — 格式為 `'{module}.{moduleCode}.'`，TM002 實際值為 `'tm.tm002.'`
- **查詢欄位** — 依規格調整 `searchForm` 內的欄位、`s-input` / `s-select2` 元件、和 `clearSearch()` 邏輯
- **表格欄位** — `columns` 陣列依規格增減，每個 `align` 必須加 `as const` 避免 TypeScript 報錯
- **LOV 下拉** — 使用 `LovService.loadLovAll('{lovType}')` 載入，在 `onMounted` 呼叫
- **Dialog 組合** — 依規格可能有 CreateDialog、EditDialog、BatchDialog；不一定三個都有
- **分頁排序** — `onRequest` 同步 `pagination` 與 `searchForm` 的排序參數，再重新查詢
- **操作按鈕** — 依規格調整按鈕，批次匯入非必要功能
- **三層分離** — Page 只呼叫 Store，不直接呼叫 Service/API
- **types 引用** — 從 `src/types/{module}/{moduleCode}` 引入（不加 `Types` 後綴），TM002 實際路徑為 `src/types/tm/tm002`
