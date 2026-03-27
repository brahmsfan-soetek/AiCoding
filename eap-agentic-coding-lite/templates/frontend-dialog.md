---
name: frontend-dialog
applies_to: "src/pages/{module}/{moduleCode}/components/{ModuleCode}*Dialog.vue"
---

## 說明

Dialog 組件模板：使用 SDialog2 共用組件，含表單驗證、v-model 雙向綁定、watch 初始化。TM002 有三種 Dialog（Create / Edit / Batch），以下分別提供參考實作。

## 替換規則

- `{ModuleCode}` → PascalCase 模組代碼（如 `Tm002`）
- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{EntityName}` → 主要實體介面名（如 `EmpVacationListItem`）

## SDialog2 API 速查

| Prop | 類型 | 說明 |
|------|------|------|
| `v-model` | `boolean` | Dialog 顯示/隱藏 |
| `title` | `string` | Dialog 標題 |
| `width` | `string` | Dialog 寬度（如 `'900px'`、`'1200px'`） |
| `content-style` | `string` | 內容區樣式（如 `'max-height: 80vh; overflow-y: auto;'`） |
| `confirm-label` | `string` | 確認按鈕文字 |
| `cancel-label` | `string` | 取消按鈕文字 |
| `loading` | `boolean` | 確認按鈕 loading 狀態（綁定 `store.saveLoading`） |
| `@confirm` | event | 點擊確認按鈕觸發 |
| `@cancel` | event | 點擊取消按鈕觸發 |

**禁止模式**：不可直接使用 `q-dialog` / `q-card` / `q-card-actions` 組裝 Dialog；不可在 Dialog 內放 `s-btn` 作為 Save/Cancel 按鈕。

## 完整參考實作：CreateDialog

```vue
<!-- src/pages/{module}/{moduleCode}/components/{ModuleCode}CreateDialog.vue -->
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'createDialog.title')" width="1200px"
    content-style="max-height: 80vh; max-width: 90vw; overflow-y: auto;"
    :confirm-label="$t(i18nPrefix + 'createDialog.confirm')" :cancel-label="$t(i18nPrefix + 'createDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleSave" @cancel="handleCancel">

    <!-- {Dialog 內容：依規格調整} -->
    <!-- TM002 範例：員工查詢區 + 假別額度設定區 -->

    <!-- 員工查詢區 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #e3f2fd; border-radius: 6px; border-bottom: 1px solid #90caf9;">
        <div class="row items-center">
          <q-icon name="search" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold" style="color: #1565c0;">員工查詢</span>
        </div>
      </div>
      <div class="q-pa-md">
        <div class="row q-col-gutter-md items-start q-mb-md" style="border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
          <div class="col-12 col-md-2">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">年度 <span class="text-negative">*</span></div>
            <s-input v-model="form.year" filled dense />
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">員工編號 <span class="text-negative">*</span></div>
            <s-input v-model="form.empAccount" filled dense placeholder="輸入員工編號 (按 Enter 查詢)"
              @keyup.enter="searchEmployee" />
          </div>
          <div class="col" :class="{ 'opacity-3': !store.employeeInfo }">
            <div v-if="store.employeeInfo" class="row items-center q-pa-sm" style="background: #e3f2fd; border-radius: 8px; border: 1px solid #90caf9;">
              <q-avatar color="primary" text-color="white" size="40px" class="q-mr-sm">
                {{ store.employeeInfo.empName?.charAt(0) || '?' }}
              </q-avatar>
              <div>
                <div class="text-weight-bold text-primary text-subtitle1">{{ store.employeeInfo.empName }}</div>
                <div class="text-caption text-grey-7">
                  <q-icon name="business" size="xs" /> {{ store.employeeInfo.orgName }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row items-center justify-between">
          <div class="row q-gutter-lg" :class="{ 'opacity-3': !store.employeeInfo }">
            <div>
              <span class="text-caption text-weight-bold text-grey-5">到職日</span><br>
              <span class="text-body2 text-grey-8">{{ store.employeeInfo?.hireDate || 'YYYY/MM/DD' }}</span>
            </div>
            <div>
              <span class="text-caption text-weight-bold text-grey-5">年資</span><br>
              <span class="text-body2 text-grey-8">{{ store.employeeInfo?.seniority || '—' }}</span>
            </div>
          </div>
          <div class="row q-gutter-sm">
            <s-btn label="清除" color="grey" outline icon="delete_sweep" dense @click="clearForm" />
            <s-btn :label="$t(i18nPrefix + 'createDialog.loadDefault')" color="warning" icon="bolt" dense
              :disable="!store.employeeInfo" @click="handleLoadDefault" />
          </div>
        </div>
      </div>
    </div>

    <!-- 明細表格區 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="row items-center justify-between q-pa-sm" style="background: #f5f5f5; border-radius: 6px;">
        <div class="row items-center">
          <q-icon name="event_note" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">假別額度設定</span>
        </div>
        <s-btn v-if="store.employeeInfo" :label="$t(i18nPrefix + 'createDialog.addRow')" color="primary" icon="add" dense
          @click="addEmptyRow" />
      </div>

      <div v-if="details.length === 0" class="text-center q-pa-lg" style="border: 2px dashed #90caf9; border-radius: 8px; background: #e3f2fd30; margin-top: 12px;">
        <q-icon name="auto_fix_high" size="48px" color="blue-3" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-bold text-blue-8 q-mb-xs">尚未產生休假明細</div>
        <div class="text-body2 text-blue-6">請先在上方輸入員工編號進行查詢，確認資訊無誤後點擊「<strong style="color: #e65100;">執行預設</strong>」按鈕。</div>
      </div>

      <!-- {明細表格：依規格調整欄位} -->
      <q-table v-if="details.length > 0" :rows="details" :columns="detailColumns" row-key="_rowKey"
        flat bordered dense class="q-mt-sm">
        <!-- {可編輯欄位 slot：依規格調整} -->
        <template #body-cell-action="props">
          <q-td :props="props">
            <s-btn flat dense color="negative" icon="delete" @click="removeRow(props.rowIndex)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </s-dialog2>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { use{ModuleCode}Store } from 'src/stores/{module}/{moduleCode}/use{ModuleCode}Store'
import { LovService } from 'src/services/common/lovService'
// {Types import：依規格調整}
import type { I{DetailSaveItemType} } from 'src/types/{module}/{moduleCode}'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const { t } = useI18n()
const i18nPrefix = '{module}.{moduleCode}.'
const $q = useQuasar()
const store = use{ModuleCode}Store()

// ==================== Dialog 控制 ====================

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// ==================== 表單 / 明細 ====================
// {表單與明細結構：依規格調整}

const form = reactive({ year: String(new Date().getFullYear()), empAccount: '' })
const details = ref<DetailRow[]>([])
let rowKeyCounter = 0

// ==================== LOV 選項 ====================
// {LOV 選項載入：依規格調整}

// ==================== 表格欄位 ====================

const detailColumns = [
  // {明細欄位：依規格調整}
  { name: 'action', label: '操作', field: 'action', align: 'right' as const }
]

// ==================== 方法 ====================

async function searchEmployee() {
  if (!form.empAccount) return
  await store.queryEmpInfo(form.empAccount)
}

function clearForm() {
  form.empAccount = ''
  details.value = []
  store.employeeInfo = null
}

async function handleLoadDefault() {
  // {執行預設邏輯：依規格調整}
}

function addEmptyRow() {
  // {新增空白列邏輯：依規格調整}
}

function removeRow(index: number) {
  $q.dialog({
    title: t(i18nPrefix + 'createDialog.deleteConfirmTitle'),
    message: t(i18nPrefix + 'createDialog.deleteConfirmMessage'),
    cancel: true,
    persistent: true
  }).onOk(() => {
    details.value.splice(index, 1)
  })
}

function validateDetails(): boolean {
  // {驗證邏輯：依規格調整必填欄位}
  return true
}

async function handleSave() {
  if (!store.employeeInfo) return
  if (!validateDetails()) return
  try {
    await store.saveDetails({
      // {儲存參數：依規格調整}
    })
    emit('saved')
    dialogVisible.value = false
  } catch {
    // store 內部已處理錯誤提示
  }
}

function handleCancel() {
  dialogVisible.value = false
}

// ==================== Watch：Dialog 開啟時初始化 ====================

watch(dialogVisible, (val) => {
  if (val) {
    // {初始化邏輯：依規格調整，重置表單、清空明細、載入 LOV 等}
    form.year = String(new Date().getFullYear())
    form.empAccount = ''
    details.value = []
    store.employeeInfo = null
  }
})
</script>
```

## 完整參考實作：EditDialog

```vue
<!-- src/pages/{module}/{moduleCode}/components/{ModuleCode}EditDialog.vue -->
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'editDialog.title')" width="900px"
    :confirm-label="$t(i18nPrefix + 'editDialog.confirm')" :cancel-label="$t(i18nPrefix + 'editDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleSave" @cancel="handleCancel">

    <!-- 唯讀資訊區 -->
    <div v-if="rowData" class="q-mb-md">
      <div class="text-subtitle2 q-mb-xs">{{ $t(i18nPrefix + 'editDialog.empInfo') }}</div>
      <div class="row q-col-gutter-sm">
        <!-- {唯讀欄位：依規格調整} -->
        <div class="col-3">{{ $t(i18nPrefix + 'editDialog.empNo') }}: {{ rowData.empNo }}</div>
        <div class="col-3">{{ $t(i18nPrefix + 'editDialog.empName') }}: {{ rowData.empNameCh }}</div>
        <div class="col-3">{{ $t(i18nPrefix + 'editDialog.department') }}: {{ rowData.deptName }}</div>
        <div class="col-3">{{ $t(i18nPrefix + 'editDialog.year') }}: {{ rowData.year }}</div>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="row justify-end q-mb-md">
      <s-btn :label="$t(i18nPrefix + 'editDialog.addRow')" color="primary" icon="add" dense @click="addEmptyRow" />
    </div>

    <!-- 明細表格 -->
    <q-table v-if="details.length > 0" :rows="details" :columns="detailColumns" row-key="empVacationId" flat bordered dense>
      <!-- {可編輯欄位 slot：依規格調整} -->
      <template #body-cell-action="props">
        <q-td :props="props">
          <s-btn v-if="!props.row.clear" flat dense color="negative" icon="delete"
            @click="handleDeleteRow(props.row)" />
          <q-icon v-else name="lock" color="grey" size="sm" :title="$t(i18nPrefix + 'editDialog.clearLocked')" />
        </q-td>
      </template>
    </q-table>
  </s-dialog2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { use{ModuleCode}Store } from 'src/stores/{module}/{moduleCode}/use{ModuleCode}Store'
import { LovService } from 'src/services/common/lovService'
import type { I{EntityName}, I{DetailType} } from 'src/types/{module}/{moduleCode}'

const props = defineProps<{ modelValue: boolean; rowData: I{EntityName} | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const { t } = useI18n()
const i18nPrefix = '{module}.{moduleCode}.'
const $q = useQuasar()
const store = use{ModuleCode}Store()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const details = ref<I{DetailType}[]>([])

// ==================== LOV 選項 ====================
// {LOV 選項：依規格調整}

// ==================== 表格欄位 ====================

const detailColumns = [
  // {明細欄位：依規格調整}
]

// ==================== 方法 ====================

function addEmptyRow() {
  if (!props.rowData) return
  // {新增空白列：依規格調整}
}

function handleDeleteRow(row: I{DetailType}) {
  $q.dialog({
    title: t(i18nPrefix + 'editDialog.deleteConfirmTitle'),
    message: t(i18nPrefix + 'editDialog.deleteConfirmMessage'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    if (row.empVacationId) {
      await store.deleteDetail(row.empVacationId)
    }
    const idx = details.value.indexOf(row)
    if (idx >= 0) details.value.splice(idx, 1)
  })
}

function validateDetails(): boolean {
  // {驗證邏輯：依規格調整}
  return true
}

async function handleSave() {
  if (!props.rowData) return
  if (!validateDetails()) return
  try {
    await store.saveDetails({
      // {儲存參數：依規格調整}
    })
    emit('saved')
    dialogVisible.value = false
  } catch {
    // store 內部已處理錯誤提示
  }
}

function handleCancel() {
  dialogVisible.value = false
}

// ==================== Watch：Dialog 開啟時載入明細 ====================

watch(dialogVisible, async (val) => {
  if (val && props.rowData) {
    // {載入 LOV 選項（如尚未載入）}
    // {查詢明細資料}
    await store.queryDetail(props.rowData.empId, props.rowData.year)
    details.value = store.detailRecords.map(d => ({
      ...d,
      // {日期格式轉換：把 / 替換為 -}
      beginDate: d.beginDate ? d.beginDate.replaceAll('/', '-') : '',
      endDate: d.endDate ? d.endDate.replaceAll('/', '-') : ''
    }))
  }
})
</script>
```

## 完整參考實作：BatchDialog

```vue
<!-- src/pages/{module}/{moduleCode}/components/{ModuleCode}BatchDialog.vue -->
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'batchDialog.title')" width="1200px"
    content-style="max-height: 80vh; max-width: 90vw; overflow-y: auto;"
    :confirm-label="$t(i18nPrefix + 'batchDialog.confirm')" :cancel-label="$t(i18nPrefix + 'batchDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleImport" @cancel="handleCancel">

    <!-- Step 1: 上傳匯入檔案 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="row items-center justify-between q-pa-sm" style="background: #f5f5f5; border-radius: 6px;">
        <div class="row items-center">
          <q-badge color="primary" rounded class="q-mr-sm">1</q-badge>
          <span class="text-weight-bold">{{ $t(i18nPrefix + 'batchDialog.uploadTitle') }}</span>
        </div>
        <s-btn flat dense color="primary" icon="download" :label="$t(i18nPrefix + 'batchDialog.downloadTemplate')"
          @click="downloadTemplate" />
      </div>
      <div class="q-pa-lg text-center" style="border: 2px dashed #90caf9; border-radius: 8px; background: #e3f2fd30; margin-top: 12px;">
        <q-icon name="cloud_upload" size="48px" color="blue-3" class="q-mb-sm" />
        <div class="text-body2 text-weight-bold q-mb-xs">拖曳檔案至此處，或點擊選擇檔案</div>
        <div class="text-caption text-grey-6 q-mb-md">支援格式：.xlsx, .xls, .csv（最大限制 5MB）</div>
        <q-file v-model="uploadFile" :label="$t(i18nPrefix + 'batchDialog.selectFile')" filled dense accept=".xlsx,.xls,.csv" :max-file-size="5242880"
          style="max-width: 300px; margin: 0 auto;" @update:model-value="handleFileUpload" />
      </div>
    </div>

    <!-- Step 2: 資料預覽與驗證 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="row items-center justify-between q-pa-sm" style="background: #f5f5f5; border-radius: 6px;">
        <div class="row items-center">
          <q-badge color="primary" rounded class="q-mr-sm">2</q-badge>
          <span class="text-weight-bold">{{ $t(i18nPrefix + 'batchDialog.previewTitle') }}</span>
        </div>
        <div v-if="store.batchValidateResults.length > 0" class="row q-gutter-md text-caption">
          <span class="text-positive text-weight-bold">
            <q-icon name="check_circle" size="xs" /> 驗證通過: {{ validCount }}
          </span>
          <span class="text-negative text-weight-bold">
            <q-icon name="warning" size="xs" /> 錯誤資料: {{ errorCount }}
          </span>
        </div>
      </div>

      <q-banner v-if="errorCount > 0" class="bg-red-1 text-negative q-mt-sm" rounded dense>
        <template #avatar><q-icon name="error" color="negative" /></template>
        系統偵測到 <strong>{{ errorCount }}</strong> 筆資料存在錯誤，請移除後再執行匯入。
      </q-banner>

      <q-table v-if="store.batchValidateResults.length > 0"
        :rows="store.batchValidateResults" :columns="previewColumns" row-key="empAccount"
        flat bordered dense class="q-mt-sm" style="max-height: 300px;">
        <template #body-cell-valid="props">
          <q-td :props="props">
            <q-badge :color="props.row.valid ? 'positive' : 'negative'">
              {{ props.row.valid ? $t(i18nPrefix + 'batchDialog.valid') : props.row.errorMessage }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-action="props">
          <q-td :props="props">
            <s-btn flat dense color="negative" icon="delete"
              @click="removePreviewRow(props.rowIndex)" />
          </q-td>
        </template>
      </q-table>

      <div v-else class="text-center q-pa-md text-grey-5 q-mt-sm" style="border: 1px dashed #ccc; border-radius: 8px;">
        尚無匯入資料，請先上傳檔案
      </div>
    </div>

    <!-- Step 3: 批次套用條件 -->
    <div class="q-pa-md q-mb-md" style="background: #fff8e1; border: 1px solid #ffe0b2; border-left: 4px solid #ff9800; border-radius: 8px;">
      <div class="text-weight-bold q-mb-sm" style="color: #e65100;">
        <q-icon name="auto_fix_high" class="q-mr-xs" /> {{ $t(i18nPrefix + 'batchDialog.applyConditions') }}
      </div>
      <div class="row q-col-gutter-md">
        <!-- {批次套用欄位：依規格調整} -->
      </div>
    </div>
  </s-dialog2>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { use{ModuleCode}Store } from 'src/stores/{module}/{moduleCode}/use{ModuleCode}Store'
import { LovService } from 'src/services/common/lovService'
import * as XLSX from 'xlsx'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'imported'): void }>()

const { t } = useI18n()
const i18nPrefix = '{module}.{moduleCode}.'
const $q = useQuasar()
const store = use{ModuleCode}Store()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const uploadFile = ref<File | null>(null)

// ==================== 預覽統計 ====================

const validCount = computed(() => store.batchValidateResults.filter(r => r.valid).length)
const errorCount = computed(() => store.batchValidateResults.filter(r => !r.valid).length)

// ==================== 批次套用表單 ====================
// {批次套用欄位：依規格調整}

const batchForm = reactive({
  // {表單欄位：依規格調整}
})

// ==================== 預覽表格欄位 ====================

const previewColumns = [
  // {預覽欄位：依規格調整}
  { name: 'action', label: '操作', field: 'action', align: 'right' as const }
]

// ==================== 方法 ====================

function downloadTemplate() {
  // {下載範本：依規格調整}
  const csvContent = '\uFEFF' + t(i18nPrefix + 'batchDialog.empAccountHeader') + '\n'
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'import_template.csv'
  link.click()
}

async function handleFileUpload(file: File | null) {
  if (!file) return
  // {檔案解析：支援 xlsx/xls/csv}
  let empAccounts: string[] = []
  const fileName = file.name.toLowerCase()
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
    empAccounts = rows.slice(1).map(row => (row[0] != null ? String(row[0]).trim() : '')).filter(v => v.length > 0)
  } else {
    let text = await file.text()
    if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
    empAccounts = lines.slice(1)
  }
  if (empAccounts.length > 0) {
    await store.batchValidate(empAccounts)
  }
}

function removePreviewRow(index: number) {
  store.batchValidateResults.splice(index, 1)
}

async function handleImport() {
  // {驗證 + 匯入邏輯：依規格調整}
  if (store.batchValidateResults.length === 0) {
    $q.notify({ type: 'warning', message: '請先上傳員工清單' })
    return
  }
  const hasError = store.batchValidateResults.some(r => !r.valid)
  if (hasError) {
    $q.notify({ type: 'warning', message: '請先移除錯誤資料後再匯入' })
    return
  }
  // {驗證批次套用條件}
  // {呼叫 store.batchImport()}
  try {
    const result = await store.batchImport({
      // {匯入參數：依規格調整}
    })
    $q.notify({ type: 'positive', message: `成功匯入 ${result.createdCount} 筆資料` })
    emit('imported')
    dialogVisible.value = false
  } catch {
    // store 內部已處理錯誤提示
  }
}

function handleCancel() {
  dialogVisible.value = false
}

// ==================== Watch：Dialog 開啟時初始化 ====================

watch(dialogVisible, (val) => {
  if (val) {
    uploadFile.value = null
    store.batchValidateResults = []
    // {重置批次套用表單}
    // {載入 LOV 選項}
  }
})
</script>
```

## 業務邏輯注意點

- **SDialog2 獨佔按鈕** — 確認/取消按鈕由 SDialog2 自動提供，不可在 Dialog 內手動放置 `s-btn`
- **`:loading="store.saveLoading"`** — 必須綁定 store 的 loading 狀態
- **`v-model` computed get/set** — Dialog 開關一律用 `computed({ get, set })` 包裝 `modelValue` + `update:modelValue`
- **`watch(dialogVisible)`** — Dialog 開啟時初始化/重置表單資料；EditDialog 在此時載入明細
- **CreateDialog vs EditDialog vs BatchDialog** — 不一定需要三種都有，依規格決定
- **驗證** — CreateDialog/EditDialog 共用 `validateDetails()` 模式；BatchDialog 有額外的檔案上傳驗證
- **XLSX 依賴** — BatchDialog 使用 `import * as XLSX from 'xlsx'` 解析 Excel 檔案
- **錯誤處理** — `handleSave` / `handleImport` 的 catch 區塊不做額外處理，store 已處理
- **日期格式** — EditDialog 載入時需將 `'/'` 替換為 `'-'`（後端回 `/`，前端 `type="date"` 需要 `-`）
