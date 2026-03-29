---
name: frontend-dialog-create
applies_to: "src/pages/{module}/{moduleCode}/components/{ModuleCode}CreateDialog.vue"
---

## 說明

新增 Dialog 元件：員工查詢 + 員工資訊卡片 + 執行預設流程 + 假別額度明細編輯表格。使用 SDialog2 自含式結構（必須自己包 q-card + q-card-actions）。級聯下拉使用統一 LOV 模式。

## 依規格調整的部分

- LOV key（`tm002VacationDetailList`）：從統一規格取得
- 明細表格欄位（detailColumns）：依規格的假別明細欄位
- 表單欄位（年度、員工編號）：依規格的新增條件
- 預設值映射（handleLoadDefault）：依預設資料的欄位結構

## 完整參考實作

```vue
<template>
  <!-- 🔒 SDialog2 自含式結構 — 使用 default slot 時必須自己包 q-card + q-card-actions -->
  <s-dialog2 v-model="dialogVisible" persistent>
    <q-card style="width: 1200px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t(i18nPrefix + 'createDialog.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleCancel" />
      </q-card-section>
      <q-card-section style="max-height: 70vh; overflow-y: auto;">
    <!-- 員工查詢區 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #e3f2fd; border-radius: 6px; border-bottom: 1px solid #90caf9;">
        <div class="row items-center">
          <q-icon name="search" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold" style="color: #1565c0;">{{ $t(i18nPrefix + 'createDialog.empInfo') }}</span>
        </div>
      </div>
      <div class="q-pa-md">
        <div class="row q-col-gutter-md items-start q-mb-md" style="border-bottom: 1px solid #f0f0f0; padding-bottom: 16px;">
          <div class="col-12 col-md-2">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'createDialog.year') }} <span class="text-negative">*</span></div>
            <s-input v-model="form.year" filled dense />
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">{{ $t(i18nPrefix + 'createDialog.empAccount') }} <span class="text-negative">*</span></div>
            <s-input v-model="form.empAccount" filled dense :placeholder="$t(i18nPrefix + 'createDialog.empAccount')" @keyup.enter="searchEmployee" />
          </div>
          <div class="col" :class="{ 'opacity-3': !store.employeeInfo }">
            <div v-if="store.employeeInfo" class="row items-center q-pa-sm" style="background: #e3f2fd; border-radius: 8px; border: 1px solid #90caf9;">
              <q-avatar color="primary" text-color="white" size="40px" class="q-mr-sm">
                {{ store.employeeInfo.empName?.charAt(0) || '?' }}
              </q-avatar>
              <div>
                <div class="text-weight-bold text-primary text-subtitle1">{{ store.employeeInfo.empName }}</div>
                <div class="text-caption text-grey-7"><q-icon name="business" size="xs" /> {{ store.employeeInfo.orgName }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="row items-center justify-between">
          <div class="row q-gutter-lg" :class="{ 'opacity-3': !store.employeeInfo }">
            <!-- 🔒 欄位名稱是 assumeDate（到職日），不是 hireDate -->
            <div><span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'createDialog.hireDate') }}</span><br><span class="text-body2 text-grey-8">{{ formatDisplayDate(store.employeeInfo?.assumeDate) }}</span></div>
            <div><span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'createDialog.seniority') }}</span><br><span class="text-body2 text-grey-8">{{ store.employeeInfo?.seniority || '—' }}</span></div>
          </div>
          <div class="row q-gutter-sm">
            <s-btn :label="$t(i18nPrefix + 'query.clearButton')" color="grey" outline icon="delete_sweep" dense @click="clearForm" />
            <s-btn :label="$t(i18nPrefix + 'createDialog.loadDefault')" color="warning" icon="bolt" dense :disable="!store.employeeInfo" @click="handleLoadDefault" />
          </div>
        </div>
      </div>
    </div>

    <!-- 假別額度設定區塊 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="row items-center justify-between q-pa-sm" style="background: #f5f5f5; border-radius: 6px;">
        <div class="row items-center">
          <q-icon name="event_note" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">{{ $t(i18nPrefix + 'detail.vacationName') }}</span>
        </div>
        <s-btn v-if="store.employeeInfo" :label="$t(i18nPrefix + 'createDialog.addRow')" color="primary" icon="add" dense @click="addEmptyRow" />
      </div>

      <div v-if="details.length === 0" class="text-center q-pa-lg" style="border: 2px dashed #90caf9; border-radius: 8px; background: #e3f2fd30; margin-top: 12px;">
        <q-icon name="auto_fix_high" size="48px" color="blue-3" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-bold text-blue-8 q-mb-xs">{{ $t(i18nPrefix + 'createDialog.title') }}</div>
      </div>

      <!-- 🔒 明細表格 — 統一 LOV 級聯模式 -->
      <q-table v-if="details.length > 0" :rows="details" :columns="detailColumns" row-key="_rowKey" flat bordered dense class="q-mt-sm">
        <!-- 🔒 假別下拉 — vacTypeOptions 從統一 LOV 推導 -->
        <template #body-cell-vacationCode="props">
          <q-td :props="props">
            <s-select2 v-model="props.row.vacationCode" :options="vacTypeOptions" option-label="label" option-value="value" dense emit-value map-options style="min-width: 100px" @update:model-value="onVacTypeChange(props.row)" />
          </q-td>
        </template>
        <!-- 🔒 假別細項 — hasSubTypes 才顯示下拉，否則顯示文字 -->
        <template #body-cell-vacationSubId="props">
          <q-td :props="props">
            <s-select2 v-if="hasSubTypes(props.row.vacationCode)" v-model="props.row.vacationSubId" :options="getSubOptions(props.row.vacationCode)" option-label="label" option-value="value" dense emit-value map-options style="min-width: 100px" @update:model-value="onSubTypeChange(props.row)" />
            <span v-else class="text-grey-7">{{ props.row.vacationSubName || '—' }}</span>
          </q-td>
        </template>
        <template #body-cell-maxHours="props">
          <q-td :props="props"><s-input v-model.number="props.row.maxHours" type="number" dense filled @update:model-value="calcUnused(props.row)" /></q-td>
        </template>
        <!-- 🔒 usedHours 唯讀 — 規格定義「本年度已請（USED_HOURS，唯讀）」 -->
        <template #body-cell-usedHours="props">
          <q-td :props="props">{{ props.row.usedHours ?? 0 }}</q-td>
        </template>
        <template #body-cell-beginDate="props">
          <q-td :props="props"><s-input v-model="props.row.beginDate" type="date" dense filled /></q-td>
        </template>
        <template #body-cell-endDate="props">
          <q-td :props="props"><s-input v-model="props.row.endDate" type="date" dense filled /></q-td>
        </template>
        <template #body-cell-action="props">
          <q-td :props="props"><s-btn flat dense color="negative" icon="delete" @click="removeRow(props.rowIndex)" /></q-td>
        </template>
      </q-table>
    </div>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <s-btn :label="$t(i18nPrefix + 'createDialog.cancel')" color="grey" outline @click="handleCancel" />
        <s-btn :label="$t(i18nPrefix + 'createDialog.confirm')" color="primary" :loading="store.saveLoading" @click="handleSave" />
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
import type { IEmpVacationDetailSaveItem } from 'src/types/tm/tm002'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const { t } = useI18n()
const i18nPrefix = 'tm.tm002.'
const $q = useQuasar()
const store = useTm002Store()

// 🔒 v-model computed get/set pattern — Dialog 開關的標準寫法
const dialogVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

// 🔒 日期格式化 — 統一轉為 YYYY/MM/DD，處理 ISO 格式和 null
function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'YYYY/MM/DD'
  const s = String(dateStr).replace(/-/g, '/').substring(0, 10)
  return /^\d{4}\/\d{2}\/\d{2}$/.test(s) ? s : dateStr
}

interface DetailRow extends IEmpVacationDetailSaveItem {
  _rowKey: number; vacationCode?: string; vacationName?: string; vacationSubName?: string; unusedHours: number
}

const form = reactive({ year: String(new Date().getFullYear()), empAccount: '' })
const details = ref<DetailRow[]>([])
let rowKeyCounter = 0

// 🔒 統一 LOV 模式 — 一次 LOV 呼叫驅動兩層下拉
interface VacDetailOption {
  vacationSubId: number; vacationCode: string; vacationName: string
  vacationSubCode: string | null; vacationSubName: string | null; maxHours: number | null
}
const allDetailOptions = ref<VacDetailOption[]>([])

// 🔒 從統一 LOV 推導假別下拉（按 vacationCode 去重）
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

// 🔒 hasSubTypes — 必須同時檢查 length > 1 且有實際 subCode
/** 是否有真正的假別細項（多筆且有 subCode） */
function hasSubTypes(vacationCode?: string): boolean {
  const details = getDetailsByCode(vacationCode)
  return details.length > 1 && details.some(d => d.vacationSubCode != null)
}

// 🔒 onVacTypeChange — 先檢查 length === 0 提前 return，再用 hasSubTypes 判斷
function onVacTypeChange(row: DetailRow) {
  const found = vacTypeOptions.value.find(o => o.value === row.vacationCode)
  row.vacationName = found?.label || ''
  const subs = getDetailsByCode(row.vacationCode)
  if (subs.length === 0) return
  // 無論有無細項，只有一筆時自動選取
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

// 🔧 LOV key 從統一規格取得
async function loadVacationOptions() {
  try {
    const res = await LovService.loadLovAll('tm002VacationDetailList')
    if (res?.success && res.items) {
      // 🔒 LOV 欄位名大小寫 — JDBC 可能回傳全小寫 key，必須兩者都處理
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
  { name: 'action', label: '', field: 'action', align: 'right' as const }
]

function calcUnused(row: DetailRow) { row.unusedHours = (row.maxHours || 0) - (row.usedHours || 0) }

async function searchEmployee() { if (!form.empAccount) return; await store.queryEmpInfo(form.empAccount) }

function clearForm() { form.empAccount = ''; details.value = []; store.employeeInfo = null }

// 🔒 loadDefaultVacation 不帶參數 — Store/Service 自行處理
async function handleLoadDefault() {
  await store.loadDefaultVacation()
  details.value = store.defaultVacationItems.map(item => ({
    _rowKey: rowKeyCounter++, vacationSubId: item.vacationSubId, vacationCode: item.vacationCode,
    vacationName: item.vacationName, vacationSubName: item.vacationSubName,
    maxHours: item.maxHours, usedHours: 0, unusedHours: item.maxHours,
    beginDate: `${form.year}-01-01`, endDate: `${form.year}-12-31`
  }))
}

function addEmptyRow() {
  details.value.push({
    _rowKey: rowKeyCounter++, vacationSubId: 0, vacationCode: '', vacationName: '', vacationSubName: '',
    maxHours: 0, usedHours: 0, unusedHours: 0, beginDate: `${form.year}-01-01`, endDate: `${form.year}-12-31`
  })
}

function removeRow(index: number) {
  $q.dialog({ title: t(i18nPrefix + 'createDialog.deleteConfirmTitle'), message: t(i18nPrefix + 'createDialog.deleteConfirmMessage'), cancel: true, persistent: true })
    .onOk(() => { details.value.splice(index, 1) })
}

function validateDetails(): boolean {
  for (const row of details.value) {
    if (!row.vacationCode) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationCodeRequired') }); return false }
    if (!row.vacationSubId) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationSubIdRequired') }); return false }
    if (!row.maxHours || row.maxHours <= 0) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.maxHoursPositive') }); return false }
    if (!row.beginDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.beginDateRequired') }); return false }
    if (!row.endDate) { $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.endDateRequired') }); return false }
  }
  return true
}

async function handleSave() {
  if (!store.employeeInfo) return
  if (!validateDetails()) return
  try {
    await store.saveDetails({ empId: store.employeeInfo.empId, details: details.value.map(d => ({ vacationSubId: d.vacationSubId, maxHours: d.maxHours, usedHours: d.usedHours, beginDate: d.beginDate, endDate: d.endDate })) })
    emit('saved'); dialogVisible.value = false
  } catch { /* store handles error */ }
}

function handleCancel() { dialogVisible.value = false }

// 🔒 Dialog 開啟時初始化 + 載入 LOV
watch(dialogVisible, (val) => {
  if (val) {
    form.year = String(new Date().getFullYear()); form.empAccount = ''; details.value = []; store.employeeInfo = null
    if (allDetailOptions.value.length === 0) void loadVacationOptions()
  }
})
</script>
```

## 已知陷阱

- **SDialog2 自含式結構** — 使用 default slot 時，SDialog2 的內建 q-card 不會渲染（源碼 `v-if="!$slots.default"`），必須自己包 `<q-card>` + `<q-card-section>` + `<q-card-actions>`。不可依賴 `:title`/`@confirm`/`@cancel` props
- **關閉按鈕用 `@click="handleCancel"`** — 不可用 `v-close-popup`，必須透過 handleCancel 控制 dialogVisible
- **員工到職日欄位名是 `assumeDate`** — 不是 `hireDate`，但 i18n key 仍用 `createDialog.hireDate`（顯示「到職日」）
- **`formatDisplayDate` 返回 `'YYYY/MM/DD'`** — null 時返回佔位文字（非 `'—'`），有 regex 驗證格式
- **統一 LOV 模式** — 用單一 `tm002VacationDetailList` LOV 呼叫驅動兩層下拉，不可分別呼叫兩個 LOV
- **`hasSubTypes` 判斷** — 必須同時檢查 `length > 1` 且 `some(d => d.vacationSubCode != null)`
- **`onVacTypeChange` 流程** — 先 `subs.length === 0` 提前 return，再用 `!hasSubTypes()` 判斷；多細項時用 `null as unknown as number`
- **`getSubOptions` / `onSubTypeChange` label fallback** — 最後一層 fallback 到 `vacationName`（不是 `'—'`）
- **`onVacTypeChange` 單一細項** — `vacationSubName` fallback 到 `''`（不是 `vacationName`），使模板 `{{ ... || '—' }}` 正確顯示
- **`addEmptyRow` vacationSubId 初值為 `0`** — 不是 `null`
- **`loadDefaultVacation()` 不帶參數** — Store/Service 自行處理年度
- **`usedHours` 唯讀** — 純文字 `{{ props.row.usedHours ?? 0 }}`，不可用 `s-input`
- **`_rowKey`** — 明細表格的 `row-key` 使用自增 counter，不可使用陣列 index
