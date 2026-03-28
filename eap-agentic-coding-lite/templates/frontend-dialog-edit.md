---
name: frontend-dialog-edit
applies_to: "src/pages/{module}/{moduleCode}/components/{ModuleCode}EditDialog.vue"
---

## 說明

編輯 Dialog 元件：載入既有員工明細 + 假別額度編輯表格。與 CreateDialog 共用統一 LOV 模式，但新增條件編輯邏輯 — 結算（clear）行不可編輯/不可刪除。使用 SDialog2 Slot 模式。

## 依規格調整的部分

- LOV key（`tm002VacationDetailList`）：同 CreateDialog
- 明細表格欄位（detailColumns）：同 CreateDialog，但多一個「結算」欄
- rowData prop 型別：依主頁面的清單項目介面
- 員工資訊顯示欄位：依規格

## 完整參考實作

```vue
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'editDialog.title')" width="1200px"
    content-style="max-height: 80vh; max-width: 90vw; overflow-y: auto;"
    :confirm-label="$t(i18nPrefix + 'editDialog.confirm')" :cancel-label="$t(i18nPrefix + 'editDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleSave" @cancel="handleCancel">

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
          <span class="text-weight-bold">假別額度設定</span>
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
        <!-- 🔒 假別細項 — 結算行用文字；未結算行依 hasMultipleSubs 決定 -->
        <template #body-cell-vacationSubId="props">
          <q-td :props="props">
            <template v-if="!props.row.clear">
              <s-select2 v-if="hasMultipleSubs(props.row.vacationCode)" v-model="props.row.vacationSubId" :options="getSubOptions(props.row.vacationCode)" option-label="label" option-value="value" dense emit-value map-options style="min-width: 100px" @update:model-value="onSubTypeChange(props.row)" />
              <span v-else class="text-grey-7">{{ props.row.vacationSubName || '—' }}</span>
            </template>
            <span v-else class="text-grey-7">{{ props.row.vacationSubName || '—' }}</span>
          </q-td>
        </template>
        <!-- 🔒 數值欄位 — 結算行 :disable="true"，不用 v-if/v-else -->
        <template #body-cell-maxHours="props">
          <q-td :props="props"><s-input v-model.number="props.row.maxHours" type="number" dense filled :disable="props.row.clear" @update:model-value="calcUnused(props.row)" /></q-td>
        </template>
        <template #body-cell-usedHours="props">
          <q-td :props="props"><s-input v-model.number="props.row.usedHours" type="number" dense filled :disable="props.row.clear" @update:model-value="calcUnused(props.row)" /></q-td>
        </template>
        <template #body-cell-beginDate="props">
          <q-td :props="props"><s-input v-model="props.row.beginDate" type="date" dense filled :disable="props.row.clear" /></q-td>
        </template>
        <template #body-cell-endDate="props">
          <q-td :props="props"><s-input v-model="props.row.endDate" type="date" dense filled :disable="props.row.clear" /></q-td>
        </template>
        <template #body-cell-clear="props">
          <q-td :props="props">
            <q-badge v-if="props.row.clear" color="orange" text-color="white" label="已結算" />
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

interface DetailRow extends IEmpVacationDetail {
  _rowKey: number
}

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

function getSubOptions(vacationCode?: string) {
  return getDetailsByCode(vacationCode).map(d => ({ value: d.vacationSubId, label: d.vacationSubName || d.vacationName, vacationCode: d.vacationCode }))
}

function hasMultipleSubs(vacationCode?: string): boolean { return getDetailsByCode(vacationCode).length > 1 }

function onVacTypeChange(row: DetailRow) {
  const found = vacTypeOptions.value.find(o => o.value === row.vacationCode)
  row.vacationName = found?.label || ''
  const subs = getDetailsByCode(row.vacationCode)
  if (subs.length === 1) { row.vacationSubId = subs[0].vacationSubId; row.vacationSubName = subs[0].vacationSubName || subs[0].vacationName }
  else { row.vacationSubId = 0; row.vacationSubName = '' }
}

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
        vacationSubCode: i.vacationSubCode ? String(i.vacationSubCode) : null,
        vacationSubName: i.vacationSubName ? String(i.vacationSubName) : null,
        maxHours: i.maxHours != null ? Number(i.maxHours) : null
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
  { name: 'action', label: '操作', field: 'action', align: 'right' as const }
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
  // 🔒 結算行不可刪除
  if (row.clear) {
    $q.notify({ type: 'warning', message: t(i18nPrefix + 'editDialog.clearLocked') })
    return
  }
  $q.dialog({ title: t(i18nPrefix + 'editDialog.deleteConfirmTitle'), message: t(i18nPrefix + 'editDialog.deleteConfirmMessage'), cancel: true, persistent: true })
    .onOk(async () => {
      if (row.empVacationId) {
        try { await store.deleteDetail(row.empVacationId) } catch { return }
      }
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
    if (row.endDate < row.beginDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.endDateBeforeBeginDate') }); return false }
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
        maxHours: d.maxHours, usedHours: d.usedHours, beginDate: d.beginDate, endDate: d.endDate
      }))
    })
    emit('saved'); dialogVisible.value = false
  } catch { /* store handles error */ }
}

function handleCancel() { dialogVisible.value = false }

// 🔒 Dialog 開啟時載入明細 + LOV
watch(dialogVisible, async (val) => {
  if (val && props.rowData) {
    if (allDetailOptions.value.length === 0) await loadVacationOptions()
    await store.queryDetail(props.rowData.empId, props.rowData.year)
    details.value = store.detailRecords.map(record => ({
      ...record,
      _rowKey: rowKeyCounter++
    }))
  }
})
</script>
```

## 已知陷阱

- **條件編輯策略** — 下拉元件（vacationCode / vacationSubId）使用 `v-if="!props.row.clear"` + `v-else` 文字；數值/日期輸入元件使用 `:disable="props.row.clear"`。下拉不能只 disable（視覺效果差），輸入框可以
- **結算行不送出** — `handleSave` 時過濾 `!r.clear`，只送出未結算行的資料
- **validateDetails 只驗未結算行** — 同上，結算行資料不可編輯也不需驗證
- **刪除行前呼叫 API** — 若 `empVacationId` 存在（既有資料），先呼叫 `store.deleteDetail` 刪除後端資料；新增行（無 empVacationId）直接從陣列移除
- **操作欄結算行** — 顯示 lock 圖示 + tooltip 提示，不顯示刪除按鈕
- **統一 LOV 模式** — 與 CreateDialog 完全相同的 LOV 載入和級聯邏輯，不可簡化
