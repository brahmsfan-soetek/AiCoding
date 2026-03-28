---
name: frontend-page
applies_to: "src/pages/{module}/{moduleCode}/{MODULE_CODE}.vue"
---

## 說明

主頁面 Vue 元件：查詢條件區 + 操作按鈕區 + 資料表格 + Dialog 整合。遵循三層架構（Page -> Store，不直接呼叫 Service）。Dialog 以 v-model 控制開關，內嵌於頁面底部。

## 依規格調整的部分

- 查詢欄位（searchForm）：從統一規格的查詢條件取得
- 表格欄位（columns）：從統一規格的清單欄位取得
- LOV 下拉選項（如部門）：LOV key 從統一規格取得
- Dialog 組件引入：依頁面功能決定需要哪些 Dialog（Create / Edit / Batch）
- i18nPrefix：格式固定為 `'{module}.{moduleCode}.'`

## 完整參考實作

```vue
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
          <!-- 🔧 查詢欄位從統一規格的查詢條件取得 -->
          <div class="col-12 col-md-2">
            <s-input v-model="searchForm.effectiveDate" :label="$t(i18nPrefix + 'query.year')" filled dense clearable />
          </div>
          <div class="col-12 col-md-2">
            <s-select2 v-model="searchForm.deptCode" :label="$t(i18nPrefix + 'query.department')" :options="deptOptions"
              option-label="label" option-value="value" dense clearable emit-value map-options />
          </div>
          <div class="col-12 col-md-2">
            <s-input v-model="searchForm.empNo" :label="$t(i18nPrefix + 'query.empNo')" filled dense clearable />
          </div>
          <div class="col-12 col-md-2">
            <s-input v-model="searchForm.empName" :label="$t(i18nPrefix + 'query.empName')" filled dense clearable />
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
      <s-btn :label="$t(i18nPrefix + 'action.batchImport')" color="secondary" icon="upload_file" @click="showBatchDialog = true" />
      <s-btn :label="$t(i18nPrefix + 'action.addSingle')" color="primary" icon="add" @click="showCreateDialog = true" />
    </div>

    <!-- 資料表格 -->
    <s-card class="eap-card eap-fade-in eap-card-static">
      <q-card-section>
        <q-table :rows="store.records" :columns="columns" row-key="quotaId" :loading="store.queryLoading"
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

    <!-- 🔒 Dialog 整合 — v-model 控制開關，@saved 觸發重新查詢 -->
    <Tm002CreateDialog v-model="showCreateDialog" @saved="handleQuery" />
    <Tm002EditDialog v-model="showEditDialog" :row-data="selectedRow" @saved="handleQuery" />
    <Tm002BatchDialog v-model="showBatchDialog" @imported="handleQuery" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from 'stores/common/session'
import { useTm002Store } from 'src/stores/tm/tm002/useTm002Store'
import { LovService } from 'src/services/common/lovService'
import type { IEmpVacationListItem, IEmpVacationQueryParams } from 'src/types/tm/tm002'
import Tm002CreateDialog from './components/Tm002CreateDialog.vue'
import Tm002EditDialog from './components/Tm002EditDialog.vue'
import Tm002BatchDialog from './components/Tm002BatchDialog.vue'

const { t } = useI18n()
// 🔒 i18n prefix 格式固定為 '{module}.{moduleCode}.'
const i18nPrefix = 'tm.tm002.'
const sessionStore = useSessionStore()
const store = useTm002Store()

// 🔧 查詢表單欄位從統一規格取得
const searchForm = reactive<IEmpVacationQueryParams>({
  effectiveDate: String(new Date().getFullYear()),
  deptCode: undefined,
  empNo: '',
  empName: '',
  page: 1, perPage: 10, sortBy: 'empNo', sortOrder: 'asc'
})

// 🔧 LOV key 從統一規格取得
const deptOptions = ref<{ value: string; label: string }[]>([])

// 🔧 表格欄位從統一規格取得，align 必須加 as const
const columns = [
  { name: 'year', label: t(i18nPrefix + 'table.year'), field: 'year', align: 'center' as const, sortable: true },
  { name: 'empNo', label: t(i18nPrefix + 'table.empNo'), field: 'empNo', align: 'left' as const, sortable: true },
  { name: 'empNameCh', label: t(i18nPrefix + 'table.empName'), field: 'empNameCh', align: 'left' as const, sortable: true },
  { name: 'vacationName', label: t(i18nPrefix + 'table.vacationName'), field: 'vacationName', align: 'left' as const },
  { name: 'effectiveStartDate', label: t(i18nPrefix + 'table.startDate'), field: 'effectiveStartDate', align: 'center' as const, sortable: true },
  { name: 'effectiveEndDate', label: t(i18nPrefix + 'table.endDate'), field: 'effectiveEndDate', align: 'center' as const, sortable: true },
  { name: 'totalHours', label: t(i18nPrefix + 'table.totalHours'), field: 'totalHours', align: 'right' as const, sortable: true },
  { name: 'usedHours', label: t(i18nPrefix + 'table.usedHours'), field: 'usedHours', align: 'right' as const, sortable: true },
  { name: 'remainingHours', label: t(i18nPrefix + 'table.remainingHours'), field: 'remainingHours', align: 'right' as const, sortable: true },
  { name: 'action', label: t(i18nPrefix + 'table.action'), field: 'action', align: 'center' as const }
]

const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0, sortBy: 'empNo', descending: false })
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showBatchDialog = ref(false)
const selectedRow = ref<IEmpVacationListItem | null>(null)

function clearSearch() {
  searchForm.effectiveDate = ''; searchForm.deptCode = undefined
  searchForm.empNo = ''; searchForm.empName = ''
}

async function handleQuery() {
  searchForm.page = pagination.value.page
  searchForm.perPage = pagination.value.rowsPerPage
  await store.query(searchForm)
  pagination.value.rowsNumber = store.totalCount
}

function onRequest(props: { pagination: typeof pagination.value }) {
  pagination.value = props.pagination
  searchForm.sortBy = props.pagination.sortBy || 'empNo'
  searchForm.sortOrder = props.pagination.descending ? 'desc' : 'asc'
  handleQuery()
}

function openEditDialog(row: IEmpVacationListItem) {
  selectedRow.value = row
  showEditDialog.value = true
}

async function loadDeptOptions() {
  try {
    const res = await LovService.loadLovAll('pmOrgList')
    if (res?.success && res.items) {
      deptOptions.value = res.items.map((i: Record<string, unknown>) => ({
        value: String(i.value || ''), label: String(i.label || '')
      }))
    }
  } catch { /* silent */ }
}

onMounted(async () => {
  // 🔒 必須設定 pageId，需與 router meta.pid 一致
  sessionStore.setPagePid('TM002')
  await loadDeptOptions()
  handleQuery()
})
</script>
```

## 已知陷阱

- **`align: 'center' as const`** — 表格欄位的 align 必須加 `as const`，否則 TypeScript 推斷為 `string` 而非字面型別，導致型別錯誤
- **Dialog v-model** — 使用 `v-model` 控制 Dialog 開關，不使用 `visible` prop；Dialog 放在 template 最底部
- **Page 不直接呼叫 Service** — 所有 API 呼叫透過 Store，唯一例外是 `LovService.loadLovAll`（共用 LOV 服務可直接呼叫）
- **`setPagePid`** — 必須在 `onMounted` 中呼叫，參數必須與 router `meta.pid` 完全一致
- **searchForm 預設年度** — 使用 `String(new Date().getFullYear())` 取得當年
- **`@saved` / `@imported`** — Dialog 儲存/匯入成功後觸發重新查詢，統一使用 `handleQuery`
