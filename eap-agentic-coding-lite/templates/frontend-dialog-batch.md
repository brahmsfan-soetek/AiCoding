---
name: frontend-dialog-batch
applies_to: "src/pages/{module}/{moduleCode}/components/{ModuleCode}BatchDialog.vue"
---

## 說明

批次匯入 Dialog 元件：三步驟流程 -- 上傳員工清單(CSV/XLSX) -> 預覽驗證結果 -> 設定批次套用條件並匯入。使用 SDialog2 Slot 模式。級聯下拉使用統一 LOV 模式。

## 依規格調整的部分

- LOV key（`tm002VacationDetailList`）：同 CreateDialog / EditDialog
- 批次套用條件欄位（假別、假別細項、可請時數、起迄日）：依規格
- CSV/XLSX 欄位名稱映射：依範本格式
- 匯入結果回饋訊息：依業務需求

## 完整參考實作

```vue
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'batchDialog.title')" width="1200px"
    content-style="max-height: 80vh; max-width: 90vw; overflow-y: auto;"
    :confirm-label="$t(i18nPrefix + 'batchDialog.confirm')" :cancel-label="$t(i18nPrefix + 'batchDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleImport" @cancel="handleCancel">

    <!-- Step 1: 上傳區 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #e3f2fd; border-radius: 6px; border-bottom: 1px solid #90caf9;">
        <div class="row items-center justify-between">
          <div class="row items-center">
            <q-icon name="upload_file" color="primary" size="sm" class="q-mr-sm" />
            <span class="text-weight-bold" style="color: #1565c0;">{{ $t(i18nPrefix + 'batchDialog.uploadTitle') }}</span>
          </div>
          <s-btn :label="$t(i18nPrefix + 'batchDialog.downloadTemplate')" color="primary" flat dense icon="download" @click="downloadTemplate" />
        </div>
      </div>
      <div class="q-pa-md">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-6">
            <q-file v-model="uploadFile" :label="$t(i18nPrefix + 'batchDialog.selectFile')" filled dense accept=".csv,.xlsx,.xls" @update:model-value="handleFileUpload">
              <template #prepend><q-icon name="attach_file" /></template>
            </q-file>
          </div>
          <div class="col-auto">
            <span v-if="previewRows.length > 0" class="text-caption text-positive">
              <q-icon name="check_circle" size="xs" /> {{ previewRows.length }} {{ $t(i18nPrefix + 'batchDialog.records') }}，{{ validCount }} {{ $t(i18nPrefix + 'batchDialog.valid') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: 預覽表格 -->
    <div v-if="previewRows.length > 0" class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #f5f5f5; border-radius: 6px;">
        <div class="row items-center">
          <q-icon name="preview" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">{{ $t(i18nPrefix + 'batchDialog.previewTitle') }}</span>
        </div>
      </div>
      <q-table :rows="previewRows" :columns="previewColumns" row-key="empAccount" flat bordered dense class="q-mt-sm" :pagination="{ rowsPerPage: 10 }">
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge v-if="props.row.valid" color="positive" label="OK" />
            <q-badge v-else color="negative" :label="props.row.errorMessage || 'Error'" />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Step 3: 批次套用條件 -->
    <div v-if="previewRows.length > 0" class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #fff3e0; border-radius: 6px; border-bottom: 1px solid #ffcc80;">
        <div class="row items-center">
          <q-icon name="tune" color="orange-8" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold" style="color: #e65100;">{{ $t(i18nPrefix + 'batchDialog.applyConditions') }}</span>
        </div>
      </div>
      <div class="q-pa-md">
        <div class="row q-col-gutter-md items-end">
          <!-- 🔒 假別下拉 — 同統一 LOV 模式 -->
          <div class="col-12 col-md-3">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.vacationType') }} <span class="text-negative">*</span></div>
            <s-select2 v-model="batchForm.vacationCode" :options="vacTypeOptions" option-label="label" option-value="value" dense emit-value map-options @update:model-value="onBatchVacTypeChange" />
          </div>
          <!-- 🔒 假別細項 — hasMultipleSubs 時顯示下拉，否則顯示 disabled input -->
          <div class="col-12 col-md-3">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.vacationSub') }}</div>
            <s-select2 v-if="batchHasMultipleSubs" v-model="batchForm.vacationSubId" :options="batchSubOptions" option-label="label" option-value="value" dense emit-value map-options />
            <s-input v-else :model-value="batchSingleSubName" dense filled disable />
          </div>
          <div class="col-12 col-md-2">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.maxHours') }} <span class="text-negative">*</span></div>
            <s-input v-model.number="batchForm.maxHours" type="number" dense filled />
          </div>
          <div class="col-12 col-md-2">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.beginDate') }} <span class="text-negative">*</span></div>
            <s-input v-model="batchForm.beginDate" type="date" dense filled />
          </div>
          <div class="col-12 col-md-2">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.endDate') }} <span class="text-negative">*</span></div>
            <s-input v-model="batchForm.endDate" type="date" dense filled />
          </div>
        </div>
      </div>
    </div>
  </s-dialog2>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useTm002Store } from 'src/stores/tm/tm002/useTm002Store'
import { LovService } from 'src/services/common/lovService'
import type { IBatchValidateResult } from 'src/types/tm/tm002'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'imported'): void }>()

const { t } = useI18n()
const i18nPrefix = 'tm.tm002.'
const $q = useQuasar()
const store = useTm002Store()

const dialogVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const uploadFile = ref<File | null>(null)
const previewRows = ref<IBatchValidateResult[]>([])
const validCount = computed(() => previewRows.value.filter(r => r.valid).length)

const batchForm = reactive({
  vacationCode: '',
  vacationSubId: 0,
  maxHours: 0,
  beginDate: `${new Date().getFullYear()}-01-01`,
  endDate: `${new Date().getFullYear()}-12-31`
})

// 🔒 統一 LOV 模式 — 與 CreateDialog / EditDialog 相同
interface VacDetailOption {
  vacationSubId: number; vacationCode: string; vacationName: string
  vacationSubCode: string | null; vacationSubName: string | null; maxHours: number | null
}
const allDetailOptions = ref<VacDetailOption[]>([])

const vacTypeOptions = computed(() => {
  const map = new Map<string, string>()
  for (const d of allDetailOptions.value) { if (!map.has(d.vacationCode)) map.set(d.vacationCode, d.vacationName) }
  return [...map.entries()].map(([value, label]) => ({ value, label }))
})

function getDetailsByCode(vacationCode?: string): VacDetailOption[] {
  if (!vacationCode) return []
  return allDetailOptions.value.filter(d => d.vacationCode === vacationCode)
}

// 🔒 批次表單的 hasMultipleSubs computed
const batchHasMultipleSubs = computed(() => getDetailsByCode(batchForm.vacationCode).length > 1)
const batchSubOptions = computed(() => getDetailsByCode(batchForm.vacationCode).map(d => ({ value: d.vacationSubId, label: d.vacationSubName || d.vacationName })))
const batchSingleSubName = computed(() => {
  const subs = getDetailsByCode(batchForm.vacationCode)
  return subs.length === 1 ? (subs[0].vacationSubName || subs[0].vacationName) : ''
})

// 🔒 onBatchVacTypeChange — =1 自動帶入，>1 清空
function onBatchVacTypeChange() {
  const subs = getDetailsByCode(batchForm.vacationCode)
  if (subs.length === 1) { batchForm.vacationSubId = subs[0].vacationSubId }
  else { batchForm.vacationSubId = 0 }
}

async function loadVacationOptions() {
  try {
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
  } catch { /* silent */ }
}

const previewColumns = [
  { name: 'empAccount', label: t(i18nPrefix + 'batchDialog.empAccountHeader'), field: 'empAccount', align: 'left' as const },
  { name: 'empName', label: t(i18nPrefix + 'batchDialog.empName'), field: 'empName', align: 'left' as const },
  { name: 'orgName', label: t(i18nPrefix + 'batchDialog.department'), field: 'orgName', align: 'left' as const },
  { name: 'status', label: t(i18nPrefix + 'batchDialog.status'), field: 'valid', align: 'center' as const }
]

// 🔒 CSV/XLSX 解析 — 支持 xlsx library
async function handleFileUpload(file: File | null) {
  if (!file) { previewRows.value = []; return }
  try {
    const empAccounts: string[] = []
    if (file.name.endsWith('.csv')) {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',')
        const account = cols[0]?.trim()
        if (account) empAccounts.push(account)
      }
    } else {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
      for (const row of rows) {
        const account = String(row['員工編號'] || row['empAccount'] || row['EmpAccount'] || '').trim()
        if (account) empAccounts.push(account)
      }
    }

    if (empAccounts.length === 0) {
      $q.notify({ type: 'warning', message: '檔案中未找到有效的員工編號' }); return
    }

    // 去重
    const unique = [...new Set(empAccounts)]
    await store.batchValidate(unique)
    previewRows.value = store.batchValidateResults
  } catch (err) {
    $q.notify({ type: 'negative', message: '檔案解析失敗：' + String(err) })
  }
}

function downloadTemplate() {
  const csv = '員工編號\nEMP001\nEMP002\n'
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'batch_import_template.csv'; a.click()
  URL.revokeObjectURL(url)
}

function validateBatchForm(): boolean {
  if (!batchForm.vacationCode) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationCodeRequired') }); return false }
  if (!batchForm.vacationSubId) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationSubIdRequired') }); return false }
  if (!batchForm.maxHours || batchForm.maxHours <= 0) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.maxHoursPositive') }); return false }
  if (!batchForm.beginDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.beginDateRequired') }); return false }
  if (!batchForm.endDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.endDateRequired') }); return false }
  if (batchForm.endDate < batchForm.beginDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.endDateBeforeBeginDate') }); return false }
  return true
}

// 🔒 匯入 — 只送有效員工，回饋 created + skipped 數量
async function handleImport() {
  if (!validateBatchForm()) return
  const validEmpIds = previewRows.value.filter(r => r.valid && r.empId).map(r => r.empId!)
  if (validEmpIds.length === 0) {
    $q.notify({ type: 'warning', message: '無有效員工可匯入' }); return
  }
  try {
    const result = await store.batchImport({
      empIds: validEmpIds,
      vacationSubId: batchForm.vacationSubId,
      maxHours: batchForm.maxHours,
      beginDate: batchForm.beginDate,
      endDate: batchForm.endDate
    })
    // 🔒 結果回饋 — 包含跳過(重複)數量
    const msg = `匯入完成：新增 ${result.createdCount} 筆` + (result.skippedCount > 0 ? `，跳過 ${result.skippedCount} 筆（已存在）` : '')
    $q.notify({ type: 'positive', message: msg, position: 'top' })
    emit('imported'); dialogVisible.value = false
  } catch { /* store handles error */ }
}

function handleCancel() { dialogVisible.value = false }

// 🔒 Dialog 開啟時重置 + 載入 LOV
watch(dialogVisible, (val) => {
  if (val) {
    uploadFile.value = null; previewRows.value = []
    batchForm.vacationCode = ''; batchForm.vacationSubId = 0; batchForm.maxHours = 0
    batchForm.beginDate = `${new Date().getFullYear()}-01-01`; batchForm.endDate = `${new Date().getFullYear()}-12-31`
    if (allDetailOptions.value.length === 0) void loadVacationOptions()
  }
})
</script>
```

## 已知陷阱

- **三步驟流程** — 上傳 -> 預覽/驗證 -> 批次套用條件，三個區塊依序顯示；預覽和套用條件只在有 previewRows 時出現
- **統一 LOV 模式** — 與 CreateDialog / EditDialog 完全相同的 LOV 載入邏輯；批次表單的假別級聯用 `batchHasMultipleSubs` computed 而非函數
- **`hasMultipleSubs` 在批次中用 computed** — 因為批次表單只有一組假別選擇（非表格行），所以用 computed 而非函數
- **CSV 首行為標題** — 解析從第 2 行開始（`i = 1`），首行是欄位名稱
- **XLSX 欄位映射** — 支持中文欄位名（`員工編號`）和英文欄位名（`empAccount` / `EmpAccount`）
- **去重** — 上傳的員工編號自動去重後再驗證
- **只送有效員工** — `handleImport` 過濾 `r.valid && r.empId`，無效員工不送後端
- **跳過回饋** — 匯入結果包含 `skippedCount`（後端已存在的額度被跳過），Notify 中顯示
- **BOM 標記** — 下載 CSV 範本時加 `\uFEFF` BOM，確保 Excel 開啟不會中文亂碼
