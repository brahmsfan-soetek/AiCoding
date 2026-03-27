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

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `v-model` | `boolean` | — | Dialog 顯示/隱藏 |
| `title` | `string` | — | Dialog 標題（自動渲染在標題區） |
| `width` | `string` | — | Dialog 寬度（如 `'900px'`、`'1200px'`） |
| `content-style` | `string` | — | 內容區樣式（如 `'max-height: 80vh; overflow-y: auto;'`） |
| `show-actions` | `boolean` | `true` | 是否顯示底部按鈕區 |
| `confirm-label` | `string` | `'確定'` | 確認按鈕文字 |
| `cancel-label` | `string` | `'取消'` | 取消按鈕文字 |
| `loading` | `boolean` | `false` | 確認按鈕 loading 狀態（綁定 `store.saveLoading`） |
| `@confirm` | event | — | 點擊確認按鈕觸發 |
| `@cancel` | event | — | 點擊取消按鈕觸發 |

### Slot 模式行為（業務 Dialog 必用）

當 `$slots.default` 存在時，SDialog2 **自動**：
1. 用 `<q-card>` 包裹全部內容（白色背景 + 圓角）
2. 渲染標題區（`title` prop + 關閉按鈕）
3. 將 slot 內容放入 `<q-card-section>`
4. 渲染底部按鈕區 `<q-card-actions>`（cancel + confirm）

**你只需提供內容，不需自己包 `<q-card>`、不需自己放確認/取消按鈕。**

### 禁止模式

- ❌ 直接使用 `q-dialog` / `q-card` / `q-card-actions` 組裝 Dialog
- ❌ 在 SDialog2 Slot 模式下自己再包 `<q-card>`（會雙重包裹）
- ❌ 在 Dialog 內放 `s-btn` 作為 Save/Cancel 按鈕（SDialog2 已自動提供）
- ❌ **修改 `SDialog2.vue` 組件原始碼**（共用組件，修改會破壞所有頁面）

---

## 完整參考實作：CreateDialog

### ⚠️ 關鍵模式：級聯下拉 + 欄位完整性

CreateDialog 的明細表格必須：
1. **級聯下拉**：父層選項變更時自動篩選子層選項（如假別→假別細項）
2. **欄位完整性**：DDL 中每個業務欄位都必須出現在表格中（可編輯或唯讀）
3. **欄位可編輯性**：依業務規則決定哪些欄位可編輯、哪些唯讀顯示

```vue
<!-- src/pages/{module}/{moduleCode}/components/{ModuleCode}CreateDialog.vue -->
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'createDialog.title')" width="1200px"
    content-style="max-height: 80vh; max-width: 90vw; overflow-y: auto;"
    :confirm-label="$t(i18nPrefix + 'createDialog.confirm')" :cancel-label="$t(i18nPrefix + 'createDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleSave" @cancel="handleCancel">

    <!-- 員工查詢區 -->
    <div class="q-mb-md q-pa-sm" style="border: 1px solid #e0e0e0; border-radius: 8px;">
      <div class="q-pa-sm" style="background: #e3f2fd; border-radius: 6px; border-bottom: 1px solid #90caf9;">
        <div class="row items-center">
          <q-icon name="search" color="primary" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold" style="color: #1565c0;">{{ $t(i18nPrefix + 'createDialog.empSearch') }}</span>
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
            <s-input v-model="form.empAccount" filled dense :placeholder="$t(i18nPrefix + 'createDialog.empAccountPlaceholder')"
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
              <span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'createDialog.hireDate') }}</span><br>
              <span class="text-body2 text-grey-8">{{ store.employeeInfo?.hireDate || 'YYYY/MM/DD' }}</span>
            </div>
            <div>
              <span class="text-caption text-weight-bold text-grey-5">{{ $t(i18nPrefix + 'createDialog.seniority') }}</span><br>
              <span class="text-body2 text-grey-8">{{ store.employeeInfo?.seniority || '—' }}</span>
            </div>
          </div>
          <div class="row q-gutter-sm">
            <s-btn :label="$t(i18nPrefix + 'createDialog.clear')" color="grey" outline icon="delete_sweep" dense @click="clearForm" />
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
          <span class="text-weight-bold">{{ $t(i18nPrefix + 'createDialog.detailTitle') }}</span>
        </div>
        <s-btn v-if="store.employeeInfo" :label="$t(i18nPrefix + 'createDialog.addRow')" color="primary" icon="add" dense
          @click="addEmptyRow" />
      </div>

      <div v-if="details.length === 0" class="text-center q-pa-lg" style="border: 2px dashed #90caf9; border-radius: 8px; background: #e3f2fd30; margin-top: 12px;">
        <q-icon name="auto_fix_high" size="48px" color="blue-3" class="q-mb-sm" />
        <div class="text-subtitle1 text-weight-bold text-blue-8 q-mb-xs">{{ $t(i18nPrefix + 'createDialog.emptyHint') }}</div>
        <div class="text-body2 text-blue-6">{{ $t(i18nPrefix + 'createDialog.emptyHintDetail') }}</div>
      </div>

      <!-- ★ 明細表格：所有 DDL 業務欄位都必須出現 -->
      <q-table v-if="details.length > 0" :rows="details" :columns="detailColumns" row-key="_rowKey"
        flat bordered dense class="q-mt-sm">

        <!-- ★ 級聯下拉：父層（假別） -->
        <template #body-cell-vacationCode="props">
          <q-td :props="props">
            <s-select2 v-model="props.row.vacationCode" :options="vacationRefOptions"
              option-label="label" option-value="value" dense emit-value map-options
              @update:model-value="onVacationCodeChange(props.row)" />
          </q-td>
        </template>

        <!-- ★ 級聯下拉：子層（假別細項），無子選項時顯示 '---' -->
        <template #body-cell-vacationSubId="props">
          <q-td :props="props">
            <s-select2 v-if="getSubOptions(props.row.vacationCode).length > 0"
              v-model="props.row.vacationSubId"
              :options="getSubOptions(props.row.vacationCode)"
              option-label="label" option-value="value" dense emit-value map-options />
            <span v-else class="text-grey-5">---</span>
          </q-td>
        </template>

        <!-- 可編輯欄位：給假時數 -->
        <template #body-cell-maxHours="props">
          <q-td :props="props">
            <s-input v-model.number="props.row.maxHours" type="number" dense filled
              style="max-width: 100px;" />
          </q-td>
        </template>

        <!-- 唯讀欄位：已請時數 -->
        <template #body-cell-usedHours="props">
          <q-td :props="props">{{ props.row.usedHours ?? 0 }}</q-td>
        </template>

        <!-- 唯讀欄位：剩餘時數（自動計算） -->
        <template #body-cell-unusedHours="props">
          <q-td :props="props">{{ (props.row.maxHours || 0) - (props.row.usedHours || 0) }}</q-td>
        </template>

        <!-- 可編輯欄位：生效起始日 -->
        <template #body-cell-beginDate="props">
          <q-td :props="props">
            <s-input v-model="props.row.beginDate" type="date" dense filled />
          </q-td>
        </template>

        <!-- 可編輯欄位：生效結束日 -->
        <template #body-cell-endDate="props">
          <q-td :props="props">
            <s-input v-model="props.row.endDate" type="date" dense filled />
          </q-td>
        </template>

        <!-- 唯讀欄位：結算狀態 -->
        <template #body-cell-clear="props">
          <q-td :props="props">
            <q-badge :color="props.row.clear ? 'positive' : 'grey'" :label="props.row.clear ? 'Y' : 'N'" />
          </q-td>
        </template>

        <!-- 操作：刪除列 -->
        <template #body-cell-action="props">
          <q-td :props="props">
            <s-btn flat dense color="negative" icon="delete" @click="removeRow(props.rowIndex)" />
          </q-td>
        </template>
      </q-table>

      <!-- 提示文字 -->
      <div v-if="details.length > 0" class="text-caption text-grey-6 q-mt-xs q-ml-sm">
        {{ $t(i18nPrefix + 'createDialog.tableHint') }}
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

interface DetailRow {
  _rowKey: number
  vacationCode: string
  vacationSubId: number
  maxHours: number
  usedHours: number
  unusedHours: number
  cashOutHours: number
  beginDate: string
  endDate: string
  clear: boolean
  // {其他業務欄位：依 DDL 調整}
}

const form = reactive({ year: String(new Date().getFullYear()), empAccount: '' })
const details = ref<DetailRow[]>([])
let rowKeyCounter = 0

// ==================== ★ 級聯 LOV 選項 ====================

/** 父層：假別（vacationCode → vacationName） */
const vacationRefOptions = ref<{ value: string; label: string }[]>([])

/** 子層全量：假別細項（vacationSubId → vacationSubName，含 parentCode） */
const allVacationSubOptions = ref<{ value: number; label: string; parentCode: string }[]>([])

async function loadVacationOptions() {
  // 載入父層
  const refRes = await LovService.loadLovAll('{parentLovType}')
  if (refRes?.success && refRes.items) {
    vacationRefOptions.value = refRes.items.map((i: Record<string, unknown>) => ({
      value: String(i.value || ''),
      label: String(i.label || '')
    }))
  }
  // 載入子層全量
  const subRes = await LovService.loadLovAll('{childLovType}')
  if (subRes?.success && subRes.items) {
    allVacationSubOptions.value = subRes.items.map((i: Record<string, unknown>) => ({
      value: Number(i.value || 0),
      label: String(i.label || ''),
      parentCode: String(i.parentCode || i.vacationCode || '')
    }))
  }
}

/** 依父層 code 篩選子層選項 */
function getSubOptions(parentCode: string) {
  return allVacationSubOptions.value.filter(s => s.parentCode === parentCode)
}

/** 父層變更時：清空子層值，如無子選項則自動帶入唯一的 subId */
function onVacationCodeChange(row: DetailRow) {
  const subs = getSubOptions(row.vacationCode)
  if (subs.length === 0) {
    row.vacationSubId = 0 // 無子選項，後端可能需特殊處理
  } else if (subs.length === 1) {
    row.vacationSubId = subs[0].value // 只有一個子選項，自動選中
  } else {
    row.vacationSubId = 0 // 多個子選項，清空讓使用者選
  }
}

// ==================== ★ 表格欄位（必須涵蓋所有 DDL 業務欄位） ====================

const detailColumns = [
  { name: 'vacationCode', label: t(i18nPrefix + 'detail.vacationName'), field: 'vacationCode', align: 'left' as const },
  { name: 'vacationSubId', label: t(i18nPrefix + 'detail.subName'), field: 'vacationSubId', align: 'left' as const },
  { name: 'maxHours', label: t(i18nPrefix + 'detail.maxHours'), field: 'maxHours', align: 'right' as const },
  { name: 'usedHours', label: t(i18nPrefix + 'detail.usedHours'), field: 'usedHours', align: 'right' as const },
  { name: 'unusedHours', label: t(i18nPrefix + 'detail.unusedHours'), field: 'unusedHours', align: 'right' as const },
  { name: 'beginDate', label: t(i18nPrefix + 'detail.beginDate'), field: 'beginDate', align: 'center' as const },
  { name: 'endDate', label: t(i18nPrefix + 'detail.endDate'), field: 'endDate', align: 'center' as const },
  { name: 'clear', label: t(i18nPrefix + 'detail.clear'), field: 'clear', align: 'center' as const },
  { name: 'action', label: t(i18nPrefix + 'table.action'), field: 'action', align: 'center' as const }
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
  // {執行預設邏輯：依規格調整，呼叫 store 的預設 API}
}

function addEmptyRow() {
  details.value.push({
    _rowKey: ++rowKeyCounter,
    vacationCode: '',
    vacationSubId: 0,
    maxHours: 0,
    usedHours: 0,
    unusedHours: 0,
    cashOutHours: 0,
    beginDate: '',
    endDate: '',
    clear: false
  })
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
  for (const row of details.value) {
    if (!row.vacationCode) {
      $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.vacationCodeRequired') })
      return false
    }
    if (!row.beginDate) {
      $q.notify({ type: 'warning', message: t(i18nPrefix + 'validation.beginDateRequired') })
      return false
    }
  }
  return true
}

async function handleSave() {
  if (!store.employeeInfo) return
  if (!validateDetails()) return
  try {
    await store.saveDetails({
      empId: store.employeeInfo.empId,
      details: details.value.map(d => ({
        vacationSubId: d.vacationSubId,
        maxHours: d.maxHours,
        beginDate: d.beginDate,
        endDate: d.endDate
        // {其他儲存欄位：依規格調整}
      }))
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

watch(dialogVisible, async (val) => {
  if (val) {
    form.year = String(new Date().getFullYear())
    form.empAccount = ''
    details.value = []
    store.employeeInfo = null
    // ★ 載入級聯 LOV 選項
    await loadVacationOptions()
  }
})
</script>
```

---

## 完整參考實作：EditDialog

### ⚠️ 關鍵模式：條件編輯（結算鎖定）

EditDialog 的明細表格必須支援**條件編輯**：
- `clear = false`（未結算）：假別/細項顯示為**可編輯下拉**，時數為**可編輯輸入**，操作欄顯示**刪除按鈕**
- `clear = true`（已結算）：假別/細項顯示為**唯讀文字**，時數為**唯讀數字**，操作欄顯示**鎖定圖示**

```vue
<!-- src/pages/{module}/{moduleCode}/components/{ModuleCode}EditDialog.vue -->
<template>
  <s-dialog2 v-model="dialogVisible" :title="$t(i18nPrefix + 'editDialog.title')" width="1200px"
    content-style="max-height: 80vh; max-width: 90vw; overflow-y: auto;"
    :confirm-label="$t(i18nPrefix + 'editDialog.confirm')" :cancel-label="$t(i18nPrefix + 'editDialog.cancel')"
    :loading="store.saveLoading" @confirm="handleSave" @cancel="handleCancel">

    <!-- 唯讀資訊區 -->
    <div v-if="rowData" class="q-mb-md q-pa-sm" style="background: #f5f5f5; border-radius: 8px;">
      <div class="text-subtitle2 q-mb-sm">{{ $t(i18nPrefix + 'editDialog.empInfo') }}</div>
      <div class="row q-col-gutter-md">
        <div class="col-3"><span class="text-grey-7">{{ $t(i18nPrefix + 'editDialog.empNo') }}:</span> {{ rowData.empNo }}</div>
        <div class="col-3"><span class="text-grey-7">{{ $t(i18nPrefix + 'editDialog.empName') }}:</span> {{ rowData.empNameCh }}</div>
        <div class="col-3"><span class="text-grey-7">{{ $t(i18nPrefix + 'editDialog.department') }}:</span> {{ rowData.deptName }}</div>
        <div class="col-3"><span class="text-grey-7">{{ $t(i18nPrefix + 'editDialog.year') }}:</span> {{ rowData.year }}</div>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="row justify-end q-mb-md">
      <s-btn :label="$t(i18nPrefix + 'editDialog.addRow')" color="primary" icon="add" dense @click="addEmptyRow" />
    </div>

    <!-- ★ 明細表格（條件編輯模式） -->
    <q-table v-if="details.length > 0" :rows="details" :columns="detailColumns" row-key="{pkField}" flat bordered dense>

      <!-- ★ 假別：未結算=可編輯下拉，已結算=唯讀文字 -->
      <template #body-cell-vacationCode="props">
        <q-td :props="props">
          <s-select2 v-if="!props.row.clear" v-model="props.row.vacationCode" :options="vacationRefOptions"
            option-label="label" option-value="value" dense emit-value map-options
            @update:model-value="onVacationCodeChange(props.row)" />
          <span v-else>{{ getVacationLabel(props.row.vacationCode) }}</span>
        </q-td>
      </template>

      <!-- ★ 假別細項：未結算=可編輯下拉（級聯），已結算=唯讀文字 -->
      <template #body-cell-vacationSubId="props">
        <q-td :props="props">
          <template v-if="!props.row.clear">
            <s-select2 v-if="getSubOptions(props.row.vacationCode).length > 0"
              v-model="props.row.vacationSubId"
              :options="getSubOptions(props.row.vacationCode)"
              option-label="label" option-value="value" dense emit-value map-options />
            <span v-else class="text-grey-5">---</span>
          </template>
          <span v-else>{{ getSubLabel(props.row.vacationSubId) }}</span>
        </q-td>
      </template>

      <!-- ★ 給假時數：未結算=可編輯，已結算=唯讀 -->
      <template #body-cell-maxHours="props">
        <q-td :props="props">
          <s-input v-if="!props.row.clear" v-model.number="props.row.maxHours" type="number" dense filled
            style="max-width: 100px;" />
          <span v-else>{{ props.row.maxHours }}</span>
        </q-td>
      </template>

      <!-- 唯讀欄位 -->
      <template #body-cell-usedHours="props">
        <q-td :props="props">{{ props.row.usedHours ?? 0 }}</q-td>
      </template>

      <template #body-cell-unusedHours="props">
        <q-td :props="props">{{ (props.row.maxHours || 0) - (props.row.usedHours || 0) }}</q-td>
      </template>

      <!-- ★ 日期：未結算=可編輯，已結算=唯讀 -->
      <template #body-cell-beginDate="props">
        <q-td :props="props">
          <s-input v-if="!props.row.clear" v-model="props.row.beginDate" type="date" dense filled />
          <span v-else>{{ props.row.beginDate }}</span>
        </q-td>
      </template>

      <template #body-cell-endDate="props">
        <q-td :props="props">
          <s-input v-if="!props.row.clear" v-model="props.row.endDate" type="date" dense filled />
          <span v-else>{{ props.row.endDate }}</span>
        </q-td>
      </template>

      <!-- 結算狀態 -->
      <template #body-cell-clear="props">
        <q-td :props="props">
          <q-badge :color="props.row.clear ? 'positive' : 'grey'" :label="props.row.clear ? 'Y' : 'N'" />
        </q-td>
      </template>

      <!-- ★ 操作：未結算=刪除按鈕，已結算=鎖定圖示 -->
      <template #body-cell-action="props">
        <q-td :props="props">
          <s-btn v-if="!props.row.clear" flat dense color="negative" icon="delete"
            @click="handleDeleteRow(props.row)" />
          <q-icon v-else name="lock" color="grey" size="sm">
            <q-tooltip>{{ $t(i18nPrefix + 'editDialog.clearLocked') }}</q-tooltip>
          </q-icon>
        </q-td>
      </template>
    </q-table>

    <!-- 提示文字 -->
    <div v-if="details.length > 0" class="text-caption text-grey-6 q-mt-xs q-ml-sm">
      {{ $t(i18nPrefix + 'editDialog.tableHint') }}
    </div>
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

// ==================== ★ 級聯 LOV 選項（同 CreateDialog） ====================

const vacationRefOptions = ref<{ value: string; label: string }[]>([])
const allVacationSubOptions = ref<{ value: number; label: string; parentCode: string }[]>([])

async function loadVacationOptions() {
  // {同 CreateDialog 的 loadVacationOptions，載入父層+子層 LOV}
}

function getSubOptions(parentCode: string) {
  return allVacationSubOptions.value.filter(s => s.parentCode === parentCode)
}

function onVacationCodeChange(row: I{DetailType}) {
  const subs = getSubOptions(row.vacationCode)
  row.vacationSubId = subs.length === 1 ? subs[0].value : 0
}

/** 反查 label（已結算列唯讀顯示用） */
function getVacationLabel(code: string): string {
  return vacationRefOptions.value.find(o => o.value === code)?.label || code
}

function getSubLabel(subId: number): string {
  return allVacationSubOptions.value.find(o => o.value === subId)?.label || '---'
}

// ==================== 表格欄位 ====================

const detailColumns = [
  { name: 'vacationCode', label: t(i18nPrefix + 'detail.vacationName'), field: 'vacationCode', align: 'left' as const },
  { name: 'vacationSubId', label: t(i18nPrefix + 'detail.subName'), field: 'vacationSubId', align: 'left' as const },
  { name: 'maxHours', label: t(i18nPrefix + 'detail.maxHours'), field: 'maxHours', align: 'right' as const },
  { name: 'usedHours', label: t(i18nPrefix + 'detail.usedHours'), field: 'usedHours', align: 'right' as const },
  { name: 'unusedHours', label: t(i18nPrefix + 'detail.unusedHours'), field: 'unusedHours', align: 'right' as const },
  { name: 'beginDate', label: t(i18nPrefix + 'detail.beginDate'), field: 'beginDate', align: 'center' as const },
  { name: 'endDate', label: t(i18nPrefix + 'detail.endDate'), field: 'endDate', align: 'center' as const },
  { name: 'clear', label: t(i18nPrefix + 'detail.clear'), field: 'clear', align: 'center' as const },
  { name: 'action', label: t(i18nPrefix + 'table.action'), field: 'action', align: 'center' as const }
]

// ==================== 方法 ====================

function addEmptyRow() {
  if (!props.rowData) return
  details.value.push({
    vacationCode: '',
    vacationSubId: 0,
    maxHours: 0,
    usedHours: 0,
    unusedHours: 0,
    cashOutHours: 0,
    beginDate: '',
    endDate: '',
    clear: false
  } as I{DetailType})
}

function handleDeleteRow(row: I{DetailType}) {
  $q.dialog({
    title: t(i18nPrefix + 'editDialog.deleteConfirmTitle'),
    message: t(i18nPrefix + 'editDialog.deleteConfirmMessage'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    if (row.{pkField}) {
      await store.deleteDetail(row.{pkField})
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
      empId: props.rowData.empId,
      details: details.value.map(d => ({
        {pkField}: d.{pkField} || undefined,
        vacationSubId: d.vacationSubId,
        maxHours: d.maxHours,
        beginDate: d.beginDate,
        endDate: d.endDate
        // {其他儲存欄位：依規格調整}
      }))
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
    // ★ 載入級聯 LOV 選項
    await loadVacationOptions()
    // 查詢明細資料
    await store.queryDetail(props.rowData.empId, props.rowData.year)
    details.value = store.detailRecords.map(d => ({
      ...d,
      // 日期格式轉換：後端回 '/' 分隔，前端 type="date" 需要 '-' 分隔
      beginDate: d.beginDate ? d.beginDate.replaceAll('/', '-') : '',
      endDate: d.endDate ? d.endDate.replaceAll('/', '-') : ''
    }))
  }
})
</script>
```

---

## 完整參考實作：BatchDialog

### ⚠️ 關鍵模式：狀態欄第一欄 + icon 顯示

- 預覽表格的**「狀態」欄必須放第一欄**（使用者一眼判斷哪些有問題）
- 狀態用 **`q-icon`**（非 `q-badge`）：`check_circle`（綠色）/ `error`（紅色）+ `q-tooltip` 顯示錯誤訊息

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
        <div class="text-body2 text-weight-bold q-mb-xs">{{ $t(i18nPrefix + 'batchDialog.dropHint') }}</div>
        <div class="text-caption text-grey-6 q-mb-md">{{ $t(i18nPrefix + 'batchDialog.formatHint') }}</div>
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
            <q-icon name="check_circle" size="xs" /> {{ $t(i18nPrefix + 'batchDialog.valid') }}: {{ validCount }}
          </span>
          <span class="text-negative text-weight-bold">
            <q-icon name="warning" size="xs" /> {{ $t(i18nPrefix + 'batchDialog.error') }}: {{ errorCount }}
          </span>
        </div>
      </div>

      <q-banner v-if="errorCount > 0" class="bg-red-1 text-negative q-mt-sm" rounded dense>
        <template #avatar><q-icon name="error" color="negative" /></template>
        {{ $t(i18nPrefix + 'batchDialog.errorBanner', { count: errorCount }) }}
      </q-banner>

      <q-table v-if="store.batchValidateResults.length > 0"
        :rows="store.batchValidateResults" :columns="previewColumns" row-key="empAccount"
        flat bordered dense class="q-mt-sm" style="max-height: 300px;">

        <!-- ★ 狀態欄：用 icon（非 badge），錯誤時有 tooltip 顯示錯誤訊息 -->
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-icon
              :name="props.row.valid ? 'check_circle' : 'error'"
              :color="props.row.valid ? 'positive' : 'negative'"
              size="sm" />
            <q-tooltip v-if="!props.row.valid" class="bg-dark">
              {{ props.row.errorMessage }}
            </q-tooltip>
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
        {{ $t(i18nPrefix + 'batchDialog.emptyPreview') }}
      </div>
    </div>

    <!-- Step 3: 批次套用條件 -->
    <div class="q-pa-md q-mb-md" style="background: #fff8e1; border: 1px solid #ffe0b2; border-left: 4px solid #ff9800; border-radius: 8px;">
      <div class="text-weight-bold q-mb-sm" style="color: #e65100;">
        <q-icon name="auto_fix_high" class="q-mr-xs" /> {{ $t(i18nPrefix + 'batchDialog.applyConditions') }}
      </div>
      <div class="row q-col-gutter-md">
        <!-- {批次套用欄位：依規格調整，使用級聯 LOV 下拉} -->
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

const batchForm = reactive({
  // {批次套用欄位：依規格調整}
})

// ==================== ★ 預覽表格欄位（狀態欄必須第一欄） ====================

const previewColumns = [
  // ★ 狀態放第一欄 — 使用者一眼看出哪些有問題
  { name: 'status', label: t(i18nPrefix + 'batchDialog.status'), field: 'valid', align: 'center' as const, style: 'width: 60px' },
  { name: 'empAccount', label: t(i18nPrefix + 'batchDialog.empAccount'), field: 'empAccount', align: 'left' as const },
  { name: 'empName', label: t(i18nPrefix + 'batchDialog.empName'), field: 'empName', align: 'left' as const },
  { name: 'orgName', label: t(i18nPrefix + 'batchDialog.department'), field: 'orgName', align: 'left' as const },
  { name: 'action', label: t(i18nPrefix + 'table.action'), field: 'action', align: 'center' as const, style: 'width: 60px' }
]

// ==================== 方法 ====================

function downloadTemplate() {
  const csvContent = '\uFEFF' + t(i18nPrefix + 'batchDialog.empAccountHeader') + '\n'
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'import_template.csv'
  link.click()
}

async function handleFileUpload(file: File | null) {
  if (!file) return
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
  if (store.batchValidateResults.length === 0) {
    $q.notify({ type: 'warning', message: t(i18nPrefix + 'batchDialog.noDataWarning') })
    return
  }
  const hasError = store.batchValidateResults.some(r => !r.valid)
  if (hasError) {
    $q.notify({ type: 'warning', message: t(i18nPrefix + 'batchDialog.hasErrorWarning') })
    return
  }
  try {
    const result = await store.batchImport({
      // {匯入參數：依規格調整}
    })
    $q.notify({ type: 'positive', message: t(i18nPrefix + 'batchDialog.importSuccess', { count: result.createdCount }) })
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

watch(dialogVisible, async (val) => {
  if (val) {
    uploadFile.value = null
    store.batchValidateResults = []
    // {重置批次套用表單}
    // {載入 LOV 選項}
  }
})
</script>
```

---

## 業務邏輯注意點

### SDialog2 規則（最重要）
- **SDialog2 Slot 模式自動提供**：q-card 背景包裹 + 標題區 + 底部按鈕區
- **不可修改 `SDialog2.vue` 原始碼** — 這是共用組件，任何修改會破壞所有現有頁面
- **不可在 Dialog 內自己包 `<q-card>` 或放確認/取消 `<s-btn>`** — SDialog2 已提供
- **`:loading="store.saveLoading"`** — 必須綁定 store 的 loading 狀態

### 級聯下拉（Cascading LOV）
- **父子下拉必須分別載入**：父層 + 子層全量各一次 LOV 呼叫
- **子層篩選**：`getSubOptions(parentCode)` 即時篩選，父層變更時清空子層值
- **無子選項**：當父層選項沒有子分類時，顯示 `'---'` 而非空下拉
- **載入時機**：`watch(dialogVisible)` 中 Dialog 開啟時載入

### 條件編輯（EditDialog）
- **結算鎖定**：`clear = true` 的列，所有可編輯欄位變為唯讀文字，刪除按鈕變鎖定圖示
- **反查 label**：已結算列的下拉欄位需用 `getVacationLabel()` / `getSubLabel()` 反查顯示文字

### 批次預覽（BatchDialog）
- **狀態欄放第一欄** — 使用者一眼看出哪些資料有問題
- **狀態用 icon** — `check_circle`（positive）/ `error`（negative）+ `q-tooltip` 顯示錯誤訊息，不用 `q-badge` 文字

### 欄位完整性
- **DDL 中的每個業務欄位都必須出現**在 Dialog 明細表格中（可編輯或唯讀）
- **不可省略「看起來不重要」的欄位** — 如 `cashOutHours`、`unusedHours` 等，即使規格書沒特別強調

### 通用規則
- **`v-model` computed get/set** — Dialog 開關一律用 `computed({ get, set })` 包裝
- **`watch(dialogVisible)`** — Dialog 開啟時初始化/重置表單資料；EditDialog 在此時載入明細
- **CreateDialog vs EditDialog vs BatchDialog** — 不一定需要三種都有，依規格決定
- **XLSX 依賴** — BatchDialog 使用 `import * as XLSX from 'xlsx'` 解析 Excel 檔案
- **日期格式** — EditDialog 載入時需將 `'/'` 替換為 `'-'`（後端回 `/`，前端 `type="date"` 需要 `-`）
- **i18n** — `<template>` 中所有使用者可見文字必須使用 `$t()` / `t()`，不可硬編碼中文
