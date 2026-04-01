---
name: frontend-dialog-batch
applies_to: "src/pages/{module}/{moduleCode}/components/{ModuleCode}BatchDialog.vue"
---

## 說明

批次匯入 Dialog 元件：三步驟流程 -- 上傳員工清單(CSV/XLSX) -> 預覽驗證結果 -> 設定批次套用條件並匯入。使用 SDialog2 自含式結構（必須自己包 q-card + q-card-actions）。級聯下拉使用統一 LOV 模式。

## 依規格調整的部分

- LOV key（`tm002VacationDetailList`）：同 CreateDialog / EditDialog
- 批次套用條件欄位（假別、假別細項、可請時數、起迄日）：依規格
- CSV/XLSX 欄位名稱映射：依範本格式
- 匯入結果回饋訊息：依業務需求

## 前置條件

> ⚠️ **xlsx 套件**：此模板使用 `import('xlsx')` 動態載入。P2 實作前必須確認 `frontend/package.json` 已包含 `xlsx` 依賴，否則需執行 `cd frontend && npm install xlsx`。

## 完整參考實作

```vue
<template>
  <!-- 🔒 SDialog2 自含式結構 — 使用 default slot 時必須自己包 q-card + q-card-actions -->
  <s-dialog2 v-model="dialogVisible" persistent>
    <q-card style="width: 1200px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t(i18nPrefix + 'batchDialog.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleCancel" />
      </q-card-section>

      <q-card-section style="max-height: 70vh; overflow-y: auto;">
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
                <!-- 🔒 顯示格式：有效數 / 總數 -->
                <span v-if="previewRows.length > 0" class="text-caption text-positive">
                  <q-icon name="check_circle" size="xs" /> {{ validCount }} / {{ previewRows.length }} {{ $t(i18nPrefix + 'batchDialog.records') }}
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
          <!-- 🔒 row-key 使用 _idx（自增 index），不用 empAccount（可能重複） -->
          <q-table :rows="previewRows" :columns="previewColumns" row-key="_idx" flat bordered dense class="q-mt-sm" :pagination="{ rowsPerPage: 10 }">
            <!-- 🔒 狀態欄 — icon + tooltip，不用 badge -->
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-icon v-if="props.row.valid" name="check_circle" color="positive" size="sm" />
                <q-icon v-else name="error" color="negative" size="sm">
                  <q-tooltip>{{ props.row.errorMessage || 'Error' }}</q-tooltip>
                </q-icon>
              </q-td>
            </template>
            <!-- 🔒 操作欄 — 逐列刪除，用 removePreviewRow 函式 -->
            <template #body-cell-action="props">
              <q-td :props="props">
                <s-btn flat dense color="negative" icon="delete" @click="removePreviewRow(props.rowIndex)" />
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
              <!-- 🔒 假別細項 — hasSubTypes 時顯示下拉，否則顯示 disabled input -->
              <div class="col-12 col-md-3">
                <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.vacationSub') }}</div>
                <s-select2 v-if="hasSubTypes(batchForm.vacationCode)" v-model="batchForm.vacationSubId" :options="getSubOptions(batchForm.vacationCode)" option-label="label" option-value="value" dense emit-value map-options />
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
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <s-btn :label="$t(i18nPrefix + 'batchDialog.cancel')" color="grey" outline @click="handleCancel" />
        <s-btn :label="$t(i18nPrefix + 'batchDialog.confirm')" color="primary" :loading="store.saveLoading" @click="handleImport" />
      </q-card-actions>
    </q-card>
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
// 🔒 previewRows 型別帶 _idx — 用於 row-key 穩定性
const previewRows = ref<(IBatchValidateResult & { _idx: number })[]>([])

const validCount = computed(() => previewRows.value.filter(r => r.valid).length)
const hasErrors = computed(() => previewRows.value.some(r => !r.valid))

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

// 🔒 批次用 function 不用 computed — 與 CreateDialog/EditDialog 一致
/** 是否有真正的假別細項（多筆且有 subCode） */
function hasSubTypes(vacationCode?: string): boolean {
  const details = getDetailsByCode(vacationCode)
  return details.length > 1 && details.some(d => d.vacationSubCode != null)
}

// 🔒 getSubOptions — label fallback 鏈：vacationSubName → vacationSubCode → vacationName
function getSubOptions(vacationCode?: string) {
  return getDetailsByCode(vacationCode).map(d => ({
    value: d.vacationSubId,
    label: d.vacationSubName || d.vacationSubCode || d.vacationName
  }))
}

// 🔒 batchSingleSubName — fallback 到 vacationName，最後 '—'
const batchSingleSubName = computed(() => {
  const subs = getDetailsByCode(batchForm.vacationCode)
  if (subs.length === 1) return subs[0].vacationSubName || subs[0].vacationName || '—'
  return '—'
})

// 🔒 onBatchVacTypeChange — 用 hasSubTypes 判斷，非 length === 1
function onBatchVacTypeChange() {
  const subs = getDetailsByCode(batchForm.vacationCode)
  if (!hasSubTypes(batchForm.vacationCode)) {
    // 無細項或僅一筆：自動帶入
    batchForm.vacationSubId = subs[0]?.vacationSubId || 0
  } else {
    // 多個細項：清空讓使用者選擇
    batchForm.vacationSubId = null as unknown as number
  }
}

async function loadVacationOptions() {
  try {
    const res = await LovService.loadLovAll('tm002VacationDetailList')
    if (res?.success && res.items) {
      allDetailOptions.value = res.items.map((i: Record<string, unknown>) => ({
        vacationSubId: Number(i.vacationSubId || i.vacationsubid || 0),
        vacationCode: String(i.vacationCode || i.vacationcode || ''),
        vacationName: String(i.vacationName || i.vacationname || ''),
        vacationSubCode: (i.vacationSubCode || i.vacationsubcode) ? String(i.vacationSubCode || i.vacationsubcode) : null,
        vacationSubName: (i.vacationSubName || i.vacationsubname) ? String(i.vacationSubName || i.vacationsubname) : null,
        maxHours: i.maxHours != null ? Number(i.maxHours) : (i.maxhours != null ? Number(i.maxhours) : null)
      }))
    }
  } catch { /* silent */ }
}

const previewColumns = [
  { name: 'status', label: '', field: 'valid', align: 'center' as const, style: 'width: 40px' },
  { name: 'empAccount', label: t(i18nPrefix + 'batchDialog.empAccountHeader'), field: 'empAccount', align: 'left' as const },
  { name: 'empName', label: t(i18nPrefix + 'batchDialog.empName'), field: 'empName', align: 'left' as const },
  { name: 'orgName', label: t(i18nPrefix + 'batchDialog.department'), field: 'orgName', align: 'left' as const },
  { name: 'action', label: '', field: 'action', align: 'center' as const, style: 'width: 40px' }
]

// 🔒 CSV/XLSX 解析 — xlsx 需用 (await import('xlsx' as string)) as any 繞過建置工具
async function handleFileUpload(file: File | null) {
  if (!file) { previewRows.value = []; return }
  try {
    const empAccounts: string[] = []
    if (file.name.endsWith('.csv')) {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',')
        const val = cols[0]?.trim()
        if (val) empAccounts.push(val)
      }
    } else {
      // 🔒 XLSX import 必須用 as string + as any 繞過靜態分析和型別檢查
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (await import('xlsx' as string)) as any
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      // 🔒 { raw: false } — 強制所有欄位為字串，防止前導零被截斷（如 001 → 1）
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { raw: false })
      for (const row of rows) {
        // 🔒 欄位映射順序：英文優先，中文最後
        const val = String(row['EMP_NO'] || row['EMP_ACCOUNT'] || row['empNo'] || row['EMP_ID'] || row['empId'] || row['員工編號'] || row['員工ID'] || '').trim()
        if (val) empAccounts.push(val)
      }
    }

    if (empAccounts.length === 0) {
      $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationCodeRequired') }); return
    }

    // 去重
    const unique = [...new Set(empAccounts)]
    await store.batchValidate(unique)
    // 🔒 previewRows 加入 _idx 作為 row-key
    previewRows.value = store.batchValidateResults.map((r, i) => ({ ...r, _idx: i }))
  } catch (err) {
    $q.notify({ type: 'negative', message: String(err) })
  }
}

// 🔒 刪除預覽列 — 獨立函式，不在模板內 inline splice
function removePreviewRow(index: number) {
  previewRows.value.splice(index, 1)
}

function downloadTemplate() {
  // 🔒 CSV 標題用 EMP_NO（與 XLSX 欄位映射優先順序一致）
  const csv = 'EMP_NO\nEMP001\nEMP002\n'
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
  return true
}

// 🔒 匯入 — 先驗表單，再檢查錯誤列，回饋 created + skipped
async function handleImport() {
  if (!validateBatchForm()) return
  // 🔒 有錯誤員工時阻擋
  if (hasErrors.value) {
    $q.notify({ type: 'warning', message: '員工清單中有錯誤資料，請先移除後再匯入' })
    return
  }
  const validEmpIds = previewRows.value.filter(r => r.valid && r.empId).map(r => r.empId!)
  if (validEmpIds.length === 0) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationSubIdRequired') }); return }
  try {
    const result = await store.batchImport({
      empIds: validEmpIds,
      vacationSubId: batchForm.vacationSubId,
      maxHours: batchForm.maxHours,
      beginDate: batchForm.beginDate,
      endDate: batchForm.endDate
    })
    // 🔒 skippedCount 防禦性判斷 + warning timeout 5秒
    if (result.skippedCount && result.skippedCount > 0) {
      $q.notify({ type: 'warning', message: `匯入完成：新增 ${result.createdCount} 筆，重複跳過 ${result.skippedCount} 筆（同員工同年度同假別已存在）`, position: 'top', timeout: 5000 })
    } else {
      $q.notify({ type: 'positive', message: `匯入成功：共新增 ${result.createdCount} 筆`, position: 'top' })
    }
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

- **SDialog2 自含式結構** — 同 CreateDialog
- **xlsx import 寫法** — 必須用 `(await import('xlsx' as string)) as any` 繞過建置工具靜態分析，不可直接 `await import('xlsx')`
- **`{ raw: false }`** — `sheet_to_json` 必須傳此選項，否則前導零（如 `001`）會被截斷為數字 `1`
- **XLSX 欄位映射順序** — 英文優先：`EMP_NO` → `EMP_ACCOUNT` → `empNo` → `EMP_ID` → `empId` → `員工編號` → `員工ID`
- **CSV 範本標題用 `EMP_NO`** — 與 XLSX 欄位映射優先順序一致
- **previewRows 帶 `_idx`** — `.map((r, i) => ({ ...r, _idx: i }))`，row-key 用 `_idx` 不用 `empAccount`（可能重複）
- **`removePreviewRow` 獨立函式** — 不在模板內 inline splice
- **驗證順序** — 先 `validateBatchForm()`（表單驗證），再 `hasErrors`（資料驗證）
- **`skippedCount` 防禦性判斷** — `result.skippedCount && result.skippedCount > 0`（處理 undefined/null）
- **warning timeout** — 跳過通知用 `timeout: 5000`（5 秒，讓長訊息有時間閱讀）
- **LOV 函式用 function** — 批次不用 computed，用 `hasSubTypes()` 和 `getSubOptions()` function，與 CreateDialog/EditDialog 一致
- **`batchSingleSubName` fallback** — `vacationSubName || vacationName || '—'`
- **`batchForm.vacationSubId` 初值和重置值都是 `0`** — 不是 `null`
