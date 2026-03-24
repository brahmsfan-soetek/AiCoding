# Frontend: Query Page 模板（Vue 3 + Quasar + TablesComponent）

> 前端參考作者：henry_wang。表格統一用 TablesComponent。共用組件用最新版號（SDialog2, SPanel2, SInput2, SSelect2）。

```vue
<!-- src/pages/{module}/{code}/{Code}Query.vue -->

<template>
  <q-page class="q-pa-md">
    <!-- 查詢條件 -->
    <s-card>
      <q-card-section class="bg-blue-grey-1">
        <div class="text-h6">
          <q-icon name="search" />
          {{ $t(i18nPrefix + 'queryTitle') }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <s-input
              v-model="queryForm.currencyCode"
              :label="$t(i18nPrefix + 'currencyCode')"
              filled dense
            />
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <s-btn color="primary" :label="$t(commonPrefix + 'query')"
               permission-id="btnQuery" @click="handleQuery" />
        <s-btn flat color="grey" :label="$t(commonPrefix + 'reset')"
               @click="handleReset" class="q-ml-sm" />
      </q-card-section>
    </s-card>

    <!-- 表格（統一用 TablesComponent） -->
    <s-card class="q-mt-md">
      <q-card-section>
        <s-btn color="positive" icon="add" :label="$t(commonPrefix + 'add')"
               permission-id="btnAdd" @click="openCreateDialog" />
      </q-card-section>
      <tables-component
        v-model:columns="columns"
        v-model:table-data="store.records"
        v-model:loading="store.queryLoading"
        v-model:pagination="pagination"
        row-key="currencyCode"
      >
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <s-btn icon="edit" flat round size="sm" color="warning"
                   permission-id="btnEdit" @click="openEditDialog(props.row)" />
            <s-btn icon="delete" flat round size="sm" color="negative"
                   permission-id="btnDelete" @click="handleDelete(props.row)" />
          </q-td>
        </template>
      </tables-component>
    </s-card>

    <!-- Dialog（用 SDialog2 或獨立 Dialog 組件） -->
    <CurrencyDialogComponent
      v-model="showDialog"
      :mode="dialogMode"
      :data="dialogFormData"
      @saved="handleQuery"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from 'src/stores/common/session'
import { useGl003Store } from 'src/stores/gl/gl003/useGl003Store'
import { useErrorHandler } from 'src/composables/useErrorHandler'
import CurrencyDialogComponent from 'src/components/gl/gl003/CurrencyDialogComponent.vue'

const { t: $t } = useI18n()
const $q = useQuasar()
const sessionStore = useSessionStore()
const store = useGl003Store()
const { showError } = useErrorHandler()

const i18nPrefix = 'gl.gl003.'
const commonPrefix = 'common.'

// ── 查詢表單 ──
const queryForm = ref({ currencyCode: '', isActive: '' })

// ── Dialog 狀態 ──
const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogFormData = ref({})

// ── 表格欄位 ──
const columns = computed(() => [
  { name: 'currencyCode', label: $t(i18nPrefix + 'currencyCode'), field: 'currencyCode', align: 'center' as const },
  { name: 'currencyName', label: $t(i18nPrefix + 'currencyName'), field: 'currencyName', align: 'left' as const },
  { name: 'actions', label: $t(commonPrefix + 'actions'), field: '', align: 'center' as const },
])

// ── 生命週期 ──
onMounted(async () => {
  sessionStore.setPagePid('GL003')  // ★ 必須：SBtn 權限依賴此值
  await handleQuery()
})

onUnmounted(() => {
  store.clearError()
})

// ── 方法 ──
const handleQuery = async () => {
  await store.query(queryForm.value)
}

const handleReset = () => {
  queryForm.value = { currencyCode: '', isActive: '' }
}

const openCreateDialog = () => {
  dialogFormData.value = {}
  dialogMode.value = 'create'
  showDialog.value = true
}

const openEditDialog = (row: any) => {
  dialogFormData.value = { ...row }
  dialogMode.value = 'edit'
  showDialog.value = true
}

const handleDelete = async (row: any) => {
  $q.dialog({
    title: $t(commonPrefix + 'confirmDelete'),
    message: $t(commonPrefix + 'deleteConfirmMessage'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const success = await store.deleteItem(row.currencyCode)
    if (success) {
      $q.notify({ type: 'positive', message: $t(commonPrefix + 'deleteSuccess') })
      await handleQuery()
    }
  })
}
</script>
```

**結構要點**：
- **TablesComponent** 統一用於表格（非 s-table / q-table）
- `sessionStore.setPagePid('XX001')` — **必須**在 onMounted 設置，SBtn 權限依賴此值
- `onUnmounted` 清理 store error
- 共用組件用最新版號：SDialog2, SPanel2, SInput2, SSelect2
- `s-btn` + `permission-id` — 權限控制
- i18n：`i18nPrefix` + `commonPrefix` 模式
- Dialog 用獨立組件 + v-model 雙向綁定

---

## 共用組件版本規則

| 組件需求 | 使用 | 不使用 |
|---------|------|--------|
| 表格 | **TablesComponent** | s-table / q-table |
| Dialog | **SDialog2** | SDialog / q-dialog（除非需要底層控制） |
| Panel | **SPanel2** | SPanel |
| 輸入框 | **SInput2** | SInput（如有 v2） |
| 下拉選單 | **SSelect2** | SSelect（如有 v2） |
| 按鈕 | **SBtn** + `permission-id` | q-btn |
| 卡片 | **SCard** | q-card |
| 日期 | **SDatePicker** | — |
| LOV | **SLov** / **SLovSelect** | — |

> 規則：共用組件有多版本時，**一律用最新版號**。
