# Frontend: Page 模板（CRUD + Dialog 模式）

> 權威來源：`Docs/EAP_FRONTEND_ARCHITECTURE.md` 開發模式 + AU002/AU010 實際代碼

## 範例代碼

```vue
<!-- src/pages/{module}/{moduleCode}/{ModuleCode}Query.vue -->
<template>
  <q-page padding>
    <!-- 查詢區 -->
    <s-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <s-input
              v-model="searchParams.field1"
              :label="$t(i18nPrefix + 'field1')"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <s-select2
              v-model="searchParams.status"
              :label="$t(i18nPrefix + 'status')"
              :options="statusOptions"
              clearable
            />
          </div>
          <div class="col-12 col-md-auto">
            <s-btn
              :label="$t('common.query')"
              permission-id="btnQuery"
              color="primary"
              @click="handleQuery"
              :loading="store.queryLoading"
            />
            <s-btn
              :label="$t('common.reset')"
              flat
              class="q-ml-sm"
              @click="handleReset"
            />
          </div>
        </div>
      </q-card-section>
    </s-card>

    <!-- 操作按鈕區 -->
    <div class="row q-mb-md justify-end">
      <s-btn
        :label="$t('common.add')"
        permission-id="btnAdd"
        color="primary"
        icon="add"
        @click="handleCreate"
      />
    </div>

    <!-- 資料表格 -->
    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="{pkField}"
      :loading="store.queryLoading"
      v-model:pagination="pagination"
      @request="onTableRequest"
    >
      <!-- 操作欄 -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <s-btn
            flat dense
            icon="edit"
            permission-id="btnEdit"
            @click="handleEdit(props.row)"
          />
          <s-btn
            flat dense
            icon="delete"
            permission-id="btnDelete"
            color="negative"
            @click="handleDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <!-- 新增/編輯 Dialog -->
    <{EntityName}Dialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :record="selectedRecord"
      @saved="handleSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from 'stores/common/session'
import { use{ModuleCode}Store } from 'stores/{module}/{moduleCode}/use{ModuleCode}Store'
import type { I{EntityName} } from 'src/types/{module}/{moduleCode}Types'
import {EntityName}Dialog from './{EntityName}Dialog.vue'

const $q = useQuasar()
const { t } = useI18n()
const sessionStore = useSessionStore()
const store = use{ModuleCode}Store()

const i18nPrefix = '{moduleCode}.'

// ==================== 查詢狀態 ====================

const searchParams = ref({
  field1: '',
  status: null as string | null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// ==================== Dialog 狀態 ====================

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedRecord = ref(null)

// ==================== 表格欄位 ====================

const columns = computed(() => [
  { name: '{pkField}', label: t(i18nPrefix + '{pkField}'), field: '{pkField}', align: 'left', sortable: true },
  { name: 'fieldName', label: t(i18nPrefix + 'fieldName'), field: 'fieldName', align: 'left' },
  { name: 'actions', label: t('common.actions'), field: 'actions', align: 'center' }
])

// ==================== 生命週期 ====================

onMounted(() => {
  sessionStore.setPagePid('{MODULE_CODE}')  // ⭐ 必須 — 權限控制依賴
  handleQuery()
})

// ==================== 方法 ====================

async function handleQuery() {
  await store.query(searchParams.value)
}

function handleReset() {
  searchParams.value = { field1: '', status: null }
}

function handleCreate() {
  dialogMode.value = 'create'
  selectedRecord.value = null
  dialogVisible.value = true
}

function handleEdit(row: I{EntityName}) {
  dialogMode.value = 'edit'
  selectedRecord.value = row
  dialogVisible.value = true
}

async function handleDelete(row: I{EntityName}) {
  $q.dialog({
    title: t('common.confirmDelete'),
    message: t('common.confirmDeleteMessage'),
    cancel: true
  }).onOk(async () => {
    await store.delete({ ids: [row.{pkField}] })
    await handleQuery()
  })
}

function handleSaved() {
  dialogVisible.value = false
  handleQuery()
}

function onTableRequest(props: { pagination: typeof pagination.value }) {
  pagination.value = props.pagination
}
</script>
```

## 結構要點

- **`<script setup lang="ts">`** — 全部頁面統一 Composition API
- **`sessionStore.setPagePid()`** — onMounted 必須設定，SBtn 權限依賴此值
- **Dialog 模式** — 新增/編輯用 Dialog，不用獨立路由頁面
- **三層分離** — Page 呼叫 Store，不直接呼叫 Service/API
- **i18n** — 所有顯示文字用 `$t()` 或 `t()`，不硬編碼
- **permission-id** — 所有操作按鈕必須加
- **Section 組件** — 複雜頁面拆為多個 Section 組件（如 PM001 BasicInfoSection）
