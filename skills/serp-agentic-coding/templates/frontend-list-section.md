# Frontend: ListSection 組件模板（查詢條件 + 列表）

> 參考：Gl002ListSection.vue、Gl012ListSection.vue（使用者調版基準）。
> 查詢條件卡和列表卡為兩張獨立 `<s-card>`，外層用 `q-gutter-md` 控制間距。

```vue
<!-- src/components/{module}/{code}/{Code}ListSection.vue -->

<template>
  <div class="q-gutter-md">
    <!-- 查詢條件卡 -->
    <s-card>
      <q-card-section class="bg-blue-grey-1">
        <div class="row items-center text-h6 no-wrap">
          <q-icon name="filter_alt" class="q-mr-sm" />
          <span>查詢條件</span>
        </div>
      </q-card-section>

      <q-card-section class="row q-gutter-sm justify-between items-center">
        <!-- 左側：輸入欄位 -->
        <div class="row q-gutter-sm items-center">
          <s-input
            v-model="searchName"
            label="名稱"
            clearable
            @keyup.enter="handleQuery"
          />
          <s-select2
            v-model="statusFilter"
            label="狀態"
            :options="statusOptions"
            emit-value
            map-options
            :use-input="false"
            :enable-smart-search="false"
            style="min-width: 120px"
          />
        </div>

        <!-- 右側：操作按鈕 -->
        <div class="q-gutter-sm">
          <s-btn
            label="查詢"
            color="primary"
            icon="search"
            permission-id="btnQuery"
            @click="handleQuery"
          />
          <s-btn
            label="新增"
            color="green-9"
            icon="add"
            permission-id="btnAdd"
            @click="handleAdd"
          />
        </div>
      </q-card-section>
    </s-card>

    <!-- 列表卡 -->
    <s-card>
      <q-card-section class="bg-blue-grey-1">
        <div class="row items-center text-h6 no-wrap">
          <q-icon name="list" class="q-mr-sm" />
          <span>資料清單</span>
        </div>
      </q-card-section>

      <TablesComponent
        v-model:columns="columns"
        v-model:tableData="tableData"
        v-model:loading="loading"
        v-model:pagination="tablePagination"
        :show-filter="false"
        :show-pagination="false"
        separator="cell"
        row-key="id"
      >
        <!-- 狀態欄（badge） -->
        <template #body-cell-isActive="props">
          <q-td :props="props" class="text-center">
            <q-badge
              :color="props.row.isActive === 'Y' ? 'positive' : 'negative'"
              :label="props.row.isActive === 'Y' ? '啟用' : '停用'"
            />
          </q-td>
        </template>

        <!-- 操作欄 -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <s-btn
              label="編輯"
              dense
              outline
              icon="edit"
              color="primary"
              class="q-pr-sm"
              permission-id="btnEdit"
              @click="handleEdit(props.row)"
            />
            <s-btn
              label="刪除"
              dense
              outline
              icon="delete"
              color="negative"
              permission-id="btnDelete"
              @click="handleDelete(props.row)"
            />
          </q-td>
        </template>

        <!-- 無資料 -->
        <template #no-data>
          <div class="full-width text-center q-pa-md text-grey-6">
            <q-icon name="inbox" size="3em" />
            <div class="q-mt-sm">無資料</div>
          </div>
        </template>
      </TablesComponent>
    </s-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useErrorHandler } from 'src/composables/useErrorHandler'
import { xxxService } from 'src/services/{module}/{code}Service'
import TablesComponent from 'components/common/TablesComponent.vue'

const emit = defineEmits<{
  'open-create': []
  'open-edit': [row: any]
  // 或 List/Editor 模式：
  // 'switch-to-editor': [mode: 'create' | 'edit', data?: any]
}>()

const $q = useQuasar()
const { showError } = useErrorHandler()

// ── 查詢條件 ──
const searchName = ref('')
const statusFilter = ref('Y')

const statusOptions = [
  { value: 'ALL', label: '全部', displayLabel: '全部' },
  { value: 'Y', label: '啟用', displayLabel: '啟用' },
  { value: 'N', label: '停用', displayLabel: '停用' },
]

// ── 表格 ──
const loading = ref(false)
const tableData = ref<any[]>([])
const tablePagination = ref({ rowsPerPage: 0 })

const columns = [
  { name: 'name', label: '名稱', field: 'name', align: 'left' as const, sortable: true },
  { name: 'isActive', label: '狀態', field: 'isActive', align: 'center' as const },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
]

// ── 查詢 ──
const handleQuery = async () => {
  loading.value = true
  try {
    const result = await xxxService.query({
      searchName: searchName.value || undefined,
      statusFilter: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
    })
    if (result.success && result.data) {
      tableData.value = result.data.records || result.data.items || []
    }
  } catch (error: any) {
    showError(error)
  } finally {
    loading.value = false
  }
}

// ── 新增 ──
const handleAdd = () => {
  emit('open-create')
  // 或 List/Editor 模式：emit('switch-to-editor', 'create')
}

// ── 編輯 ──
const handleEdit = (row: any) => {
  emit('open-edit', row)
  // 或 List/Editor 模式：emit('switch-to-editor', 'edit', row)
}

// ── 刪除 ──
const handleDelete = (row: any) => {
  $q.dialog({
    title: '確認刪除',
    message: '確定要刪除此筆資料？',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const result = await xxxService.delete(row.id)
      if (result.success) {
        $q.notify({ type: 'positive', message: '刪除成功' })
        await handleQuery()
      }
    } catch (error: any) {
      showError(error)
    }
  })
}

// ── 初始化 ──
onMounted(() => {
  handleQuery()
})
</script>
```

**結構要點**：

### 排版規則（參考 GL002/GL012）
- **外層容器** `<div class="q-gutter-md">` — 子元素自動間距，不用手動加 `q-mt-md`
- **兩張獨立 `<s-card>`** — 查詢條件卡 + 列表卡，不合併為一張
- **卡片標題** `<q-card-section class="bg-blue-grey-1">` + `<div class="row items-center text-h6 no-wrap">` + `<q-icon>` + `<span>`
- **查詢條件區** `<q-card-section class="row q-gutter-sm justify-between items-center">` — 左輸入、右按鈕
- **輸入欄位間距** 用 `row q-gutter-sm items-center`，不用 `q-col-gutter-md` + `col-md-N`
- **下拉選單寬度** 用 inline `style="min-width: 120px"`
- **無 `<style>` 區塊** — 全部用 Quasar utility class，不寫自訂 CSS

### 表格規則
- **TablesComponent**（不用原生 q-table），搭配 `separator="cell"` + `:show-filter="false"` + `:show-pagination="false"`
- `tablePagination = { rowsPerPage: 0 }` — 顯示全部列
- 操作按鈕用 `s-btn dense outline` + `permission-id`
- 狀態欄用 `q-badge` + `:color="positive/negative"`
- 無資料用 `#no-data` slot + `inbox` icon

### 組件通訊
- **Dialog 模式**：emit `open-create` / `open-edit` 給頁面，由頁面控制 Dialog
- **List/Editor 模式**：emit `switch-to-editor` 給頁面，由頁面切換視圖
- **不在 ListSection 中引入 Dialog** — Dialog 由頁面層管理

### 共用組件版本規則

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
