---
name: frontend-dialog-edit
applies_to: "src/pages/{module}/{moduleCode}/components/{ModuleCode}EditDialog.vue"
---

## 說明

編輯 Dialog 元件：載入既有員工明細 + 假別額度編輯表格。與 CreateDialog 共用統一 LOV 模式，但新增條件編輯邏輯 — 結算（clear）行不可編輯/不可刪除。使用 SDialog2 自含式結構（必須自己包 q-card + q-card-actions）。

## 依規格調整的部分

- LOV key（`tm002VacationDetailList`）：同 CreateDialog
- 明細表格欄位（detailColumns）：同 CreateDialog，但多一個「結算」欄
- rowData prop 型別：依主頁面的清單項目介面
- 員工資訊顯示欄位：依規格

## 完整參考實作

```vue
<template>
  <!-- 🔒 SDialog2 自含式結構 — 使用 default slot 時必須自己包 q-card + q-card-actions -->
  <s-dialog2 v-model="dialogVisible" persistent>
    <q-card style="width: 1200px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t(i18nPrefix + 'editDialog.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleCancel" />
      </q-card-section>
      <q-card-section style="max-height: 70vh; overflow-y: auto;">
    <!-- 員工基本資訊（唯讀） -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #e3f2fd; border-radius: 6px; border-bottom: 1px solid #90caf9;">
        <div class="row items-center">
          <q-icon name="person" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold" style="color: #1565c0;">{{ $t(i18nPrefix + 'editDialog.empInfo') }}</span>
        </div>
      </div>
      <div class="q-pa-md">
        <div class="row q-col-gutter-lg">
          <div class="col-auto">
            <span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'editDialog.empNo') }}</span><br>
            <span class="text-body2 text-grey-8">{{ rowData?.empNo || '—' }}</span>
          </div>
          <div class="col-auto">
            <span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'editDialog.empName') }}</span><br>
            <span class="text-body2 text-grey-8">{{ rowData?.empNameCh || '—' }}</span>
          </div>
          <div class="col-auto">
            <span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'editDialog.department') }}</span><br>
            <span class="text-body2 text-grey-8">{{ rowData?.deptName || '—' }}</span>
          </div>
          <div class="col-auto">
            <span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'editDialog.year') }}</span><br>
            <span class="text-body2 text-grey-8">{{ rowData?.year || '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 假別額度設定 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="row items-center justify-between q-pa-sm" style="background: #f5f5f5; border-radius: 6px;">
        <div class="row items-center">
          <q-icon name="event_note" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">{{ $t(i18nPrefix + 'detail.vacationName') }}</span>
        </div>
        <s-btn :label="$t(i18nPrefix + 'editDialog.addRow')" color="primary" icon="add" dense @click="addEmptyRow" />
      </div>

      <q-table v-if="details.length > 0" :rows="details" :columns="detailColumns" row-key="_rowKey" flat bordered dense class="q-mt-sm">
        <!-- 🔒 假別下拉 — 結算行用文字，未結算行用下拉 -->
        <template #body-cell-vacationCode="props">
          <q-td :props="props">
            <s-select2 v-if="!props.row.clear" v-model="props.row.vacationCode" :options="vacTypeOptions" option-label="label" option-value="value" dense emit-value map-options style="min-width: 100px" @update:model-value="onVacTypeChange(props.row)" />
            <span v-else class="text-grey-7">{{ props.row.vacationName || '—' }}</span>
          </q-td>
        </template>
        <!-- 🔒 假別細項 — 結算行用文字；未結算行依 hasSubTypes 決定 -->
        <template #body-cell-vacationSubId="props">
          <q-td :props="props">
            <template v-if="!props.row.clear">
              <s-select2 v-if="hasSubTypes(props.row.vacationCode)" v-model="props.row.vacationSubId" :options="getSubOptions(props.row.vacationCode)" option-label="label" option-value="value" dense emit-value map-options style="min-width: 100px" @update:model-value="onSubTypeChange(props.row)" />
              <span v-else class="text-grey-7">{{ props.row.vacationSubName || '—' }}</span>
            </template>
            <span v-else class="text-grey-7">{{ props.row.vacationSubName || '—' }}</span>
          </q-td>
        </template>
        <!-- 🔒 數值欄位 — 結算行 :disable="true"，不用 v-if/v-else -->
        <template #body-cell-maxHours="props">
          <q-td :props="props"><s-input v-model.number="props.row.maxHours" type="number" dense filled :disable="props.row.clear" @update:model-value="calcUnused(props.row)" /></q-td>
        </template>
        <!-- 🔒 usedHours 唯讀 — 規格定義「本年度已請（USED_HOURS，唯讀）」 -->
        <template #body-cell-usedHours="props">
          <q-td :props="props">{{ props.row.usedHours ?? 0 }}</q-td>
        </template>
        <template #body-cell-beginDate="props">
          <q-td :props="props"><s-input v-model="props.row.beginDate" type="date" dense filled :disable="props.row.clear" /></q-td>
        </template>
        <template #body-cell-endDate="props">
          <q-td :props="props"><s-input v-model="props.row.endDate" type="date" dense filled :disable="props.row.clear" /></q-td>
        </template>
        <template #body-cell-clear="props">
          <q-td :props="props">
            <q-badge v-if="props.row.clear" color="orange" text-color="white" :label="$t(i18nPrefix + 'detail.clear')" />
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>
        <!-- 🔒 操作欄 — 結算行顯示鎖定圖示，未結算行顯示刪除按鈕 -->
        <template #body-cell-action="props">
          <q-td :props="props">
            <q-icon v-if="props.row.clear" name="lock" color="grey-5" size="sm">
              <q-tooltip>{{ $t(i18nPrefix + 'editDialog.clearLocked') }}</q-tooltip>
            </q-icon>
            <s-btn v-else flat dense color="negative" icon="delete" @click="removeRow(props.rowIndex, props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <s-btn :label="$t(i18nPrefix + 'editDialog.cancel')" color="grey" outline @click="handleCancel" />
        <s-btn :label="$t(i18nPrefix + 'editDialog.confirm')" color="primary" :loading="store.saveLoading" @click="handleSave" />
      </q-card-actions>
    </q-card>
  </s-dialog2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useTm002Store } from 'src/stores/tm/tm002/useTm002Store'
import { LovService } from 'src/services/common/lovService'
import type { IEmpVacationListItem, IEmpVacationDetail } from 'src/types/tm/tm002'

const props = defineProps<{ modelValue: boolean; rowData: IEmpVacationListItem | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const { t } = useI18n()
const i18nPrefix = 'tm.tm002.'
const $q = useQuasar()
const store = useTm002Store()

const dialogVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

interface DetailRow extends IEmpVacationDetail { _rowKey: number }

const details = ref<DetailRow[]>([])
let rowKeyCounter = 0

// 🔒 統一 LOV 模式 — 與 CreateDialog 相同
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

// 🔒 getSubOptions — label fallback 鏈：vacationSubName → vacationSubCode → vacationName
function getSubOptions(vacationCode?: string) {
  return getDetailsByCode(vacationCode).map(d => ({
    value: d.vacationSubId,
    label: d.vacationSubName || d.vacationSubCode || d.vacationName
  }))
}

/** 是否有真正的假別細項（多筆且有 subCode） */
function hasSubTypes(vacationCode?: string): boolean {
  const details = getDetailsByCode(vacationCode)
  return details.length > 1 && details.some(d => d.vacationSubCode != null)
}

function onVacTypeChange(row: DetailRow) {
  const found = vacTypeOptions.value.find(o => o.value === row.vacationCode)
  row.vacationName = found?.label || ''
  const subs = getDetailsByCode(row.vacationCode)
  if (subs.length === 0) return
  if (!hasSubTypes(row.vacationCode)) {
    row.vacationSubId = subs[0].vacationSubId
    row.vacationSubName = subs[0].vacationSubName || ''
  } else {
    row.vacationSubId = null as unknown as number; row.vacationSubName = ''
  }
}

// 🔒 onSubTypeChange — fallback 鏈保留 vacationName
function onSubTypeChange(row: DetailRow) {
  const found = allDetailOptions.value.find(o => o.vacationSubId === row.vacationSubId)
  row.vacationSubName = found?.vacationSubName || found?.vacationName || ''
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

const detailColumns = [
  { name: 'vacationCode', label: '* ' + t(i18nPrefix + 'detail.vacationName'), field: 'vacationCode', align: 'left' as const },
  { name: 'vacationSubId', label: t(i18nPrefix + 'detail.subName'), field: 'vacationSubId', align: 'left' as const },
  { name: 'maxHours', label: '* ' + t(i18nPrefix + 'detail.maxHours'), field: 'maxHours', align: 'right' as const },
  { name: 'usedHours', label: t(i18nPrefix + 'detail.usedHours'), field: 'usedHours', align: 'right' as const },
  { name: 'unusedHours', label: t(i18nPrefix + 'detail.unusedHours'), field: 'unusedHours', align: 'right' as const },
  { name: 'beginDate', label: '* ' + t(i18nPrefix + 'detail.beginDate'), field: 'beginDate', align: 'center' as const },
  { name: 'endDate', label: '* ' + t(i18nPrefix + 'detail.endDate'), field: 'endDate', align: 'center' as const },
  { name: 'clear', label: t(i18nPrefix + 'detail.clear'), field: 'clear', align: 'center' as const },
  { name: 'action', label: '', field: 'action', align: 'right' as const }
]

function calcUnused(row: DetailRow) { row.unusedHours = (row.maxHours || 0) - (row.usedHours || 0) }

function addEmptyRow() {
  const year = props.rowData?.year || new Date().getFullYear()
  details.value.push({
    _rowKey: rowKeyCounter++, empVacationId: undefined, empId: props.rowData?.empId || 0,
    vacationSubId: 0, vacationCode: '', vacationName: '', vacationSubCode: '', vacationSubName: '',
    maxHours: 0, usedHours: 0, unusedHours: 0, cashOutHours: 0,
    beginDate: `${year}-01-01`, endDate: `${year}-12-31`, clear: false
  })
}

function removeRow(index: number, row: DetailRow) {
  if (row.clear) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'editDialog.clearLocked') }); return }
  $q.dialog({ title: t(i18nPrefix + 'editDialog.deleteConfirmTitle'), message: t(i18nPrefix + 'editDialog.deleteConfirmMessage'), cancel: true, persistent: true })
    .onOk(async () => {
      if (row.empVacationId) { try { await store.deleteDetail(row.empVacationId) } catch { return } }
      details.value.splice(index, 1)
    })
}

function validateDetails(): boolean {
  const editableRows = details.value.filter(r => !r.clear)
  for (const row of editableRows) {
    if (!row.vacationCode) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationCodeRequired') }); return false }
    if (!row.vacationSubId) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationSubIdRequired') }); return false }
    if (!row.maxHours || row.maxHours <= 0) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.maxHoursPositive') }); return false }
    if (!row.beginDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.beginDateRequired') }); return false }
    if (!row.endDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.endDateRequired') }); return false }
  }
  return true
}

async function handleSave() {
  if (!props.rowData) return
  if (!validateDetails()) return
  const editableDetails = details.value.filter(r => !r.clear)
  try {
    await store.saveDetails({
      empId: props.rowData.empId,
      details: editableDetails.map(d => ({
        empVacationId: d.empVacationId, vacationSubId: d.vacationSubId,
        maxHours: d.maxHours, usedHours: d.usedHours, cashOutHours: d.cashOutHours,
        beginDate: d.beginDate, endDate: d.endDate
      }))
    })
    emit('saved'); dialogVisible.value = false
  } catch { /* store handles error */ }
}

function handleCancel() { dialogVisible.value = false }

// 🔒 Dialog 開啟時載入明細 + LOV + 日期格式轉換
watch(dialogVisible, async (val) => {
  if (val && props.rowData) {
    if (allDetailOptions.value.length === 0) await loadVacationOptions()
    await store.queryDetail(props.rowData.empId, props.rowData.year)
    // 🔒 日期格式轉換 — 後端回 `/`，HTML date input 需要 `-`
    details.value = store.detailRecords.map(record => ({
      ...record,
      beginDate: String(record.beginDate || '').replace(/\//g, '-'),
      endDate: String(record.endDate || '').replace(/\//g, '-'),
      _rowKey: rowKeyCounter++
    }))
  }
})
</script>
```

## 已知陷阱

- **SDialog2 自含式結構** — 同 CreateDialog
- **日期格式轉換** — watch 中必須 `.replace(/\//g, '-')`，後端回 `/` 格式（如 `2026/01/01`），HTML `type="date"` 需要 `-` 格式（如 `2026-01-01`）
- **handleSave 必須送 `cashOutHours`** — 不可遺漏此欄位，後端需要
- **結算 badge 用 i18n** — `:label="$t(i18nPrefix + 'detail.clear')"` 不可硬編碼
- **條件編輯策略** — 下拉用 `v-if="!props.row.clear"` + `v-else` 文字；輸入框用 `:disable="props.row.clear"`
- **結算行不送出** — `handleSave` 過濾 `!r.clear`
- **刪除行前呼叫 API** — 既有資料（有 empVacationId）先呼叫 `store.deleteDetail`
- **LOV 函式與 CreateDialog 完全相同** — `hasSubTypes`、`getSubOptions`、`onVacTypeChange`、`onSubTypeChange`
