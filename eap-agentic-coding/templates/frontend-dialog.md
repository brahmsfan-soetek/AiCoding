# Frontend: Dialog 組件模板

## 範例代碼

```vue
<!-- src/pages/{module}/{moduleCode}/components/{EntityName}Dialog.vue -->
<template>
  <s-dialog2
    v-model="dialogVisible"
    :title="isEdit ? $t(i18nPrefix + 'editDialog.title') : $t(i18nPrefix + 'createDialog.title')"
    :confirm-loading="store.saveLoading"
    @confirm="handleSave"
    @cancel="handleCancel"
  >
    <q-form ref="formRef" greedy>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <s-input
            v-model="formData.field1"
            :label="$t(i18nPrefix + 'form.field1')"
            :readonly="isEdit"
            :rules="[val => !!val || $t(i18nPrefix + 'validation.field1Required')]"
          />
        </div>
        <div class="col-12 col-md-6">
          <s-select2
            v-model="formData.field2"
            :label="$t(i18nPrefix + 'form.field2')"
            :options="store.field2Options"
            :rules="[val => !!val || $t(i18nPrefix + 'validation.field2Required')]"
          />
        </div>
      </div>
    </q-form>
  </s-dialog2>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { type QForm } from 'quasar'
import { useI18n } from 'vue-i18n'
import { use{ModuleCode}Store } from 'stores/{module}/{moduleCode}/use{ModuleCode}Store'
import type { I{EntityName} } from 'src/types/{module}/{moduleCode}Types'

const { t } = useI18n()
const store = use{ModuleCode}Store()
const i18nPrefix = '{moduleCode}.'

// ==================== Props / Emits ====================

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  record?: I{EntityName} | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// ==================== Dialog 控制 ====================

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => props.mode === 'edit')

// ==================== 表單 ====================

const formRef = ref<QForm>()

const formData = ref({
  field1: '',
  field2: ''
})

// 當 Dialog 開啟時初始化表單
watch(() => props.modelValue, (visible) => {
  if (visible) {
    if (isEdit.value && props.record) {
      formData.value = { ...props.record }
    } else {
      formData.value = { field1: '', field2: '' }
    }
  }
})

// ==================== 事件處理 ====================

async function handleSave() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  if (isEdit.value) {
    await store.update(formData.value)
  } else {
    await store.create(formData.value)
  }
  emit('saved')
  dialogVisible.value = false
}

function handleCancel() {
  dialogVisible.value = false
}
</script>
```

## SDialog2 真實 API

SDialog2 是 eap 的共用 Dialog 組件，**不可**直接使用 `q-dialog`。

### Props

| Prop | 類型 | 說明 |
|------|------|------|
| `modelValue` / `v-model` | `boolean` | Dialog 顯示/隱藏 |
| `title` | `string` | Dialog 標題 |
| `icon` | `string` | 標題前的圖標（可選） |
| `showCloseBtn` | `boolean` | 是否顯示右上角關閉按鈕 |
| `showActions` | `boolean` | 是否顯示底部操作按鈕列（預設 true） |
| `confirmLabel` | `string` | 確認按鈕文字（預設 `$t('common.save')`） |
| `cancelLabel` | `string` | 取消按鈕文字（預設 `$t('common.cancel')`） |
| `confirmLoading` | `boolean` | 確認按鈕 loading 狀態 |
| `showConfirmBtn` | `boolean` | 是否顯示確認按鈕 |
| `showCancelBtn` | `boolean` | 是否顯示取消按鈕 |

### Events

| Event | 說明 |
|-------|------|
| `@confirm` | 點擊確認按鈕觸發 |
| `@cancel` | 點擊取消按鈕觸發 |
| `@close` | Dialog 關閉觸發 |
| `@update:modelValue` | v-model 更新 |

### Slot 模式

將自訂表單內容放在 `<s-dialog2>` 的 default slot 中。SDialog2 自動提供標題列和底部按鈕列（確認/取消），**不需要手動放置 `q-card-actions` 或 `s-btn`**。

## 結構要點

- **`s-dialog2`** — 使用共用元件，**不**直接用 `q-dialog` + `q-card` + 手動按鈕
- **`@confirm` / `@cancel`** — 使用 SDialog2 的事件，**不**手動放置 Save/Cancel 按鈕
- **`:confirm-loading`** — 綁定 `store.saveLoading`，SDialog2 自動處理按鈕 loading 狀態
- **`v-model` 雙向綁定** — `computed` get/set 包裝 `modelValue` + `update:modelValue`
- **`q-form ref` + `greedy`** — 統一表單驗證，在 `handleSave` 中呼叫 `formRef.value?.validate()`
- **`watch modelValue`** — Dialog 開啟時初始化/重置表單資料
- **`isEdit` computed** — 依 `mode` prop 判斷新增/編輯
- **錯誤處理** — Store 層處理（`useErrorHandler`），Dialog 不直接處理 API 錯誤
- **loading 狀態** — 使用 `store.saveLoading`，不在 Dialog 本地維護

## 禁止模式

- ❌ 直接使用 `q-dialog`、`q-card`、`q-card-section`、`q-card-actions` 組裝 Dialog
- ❌ 在 Dialog 內放置 `s-btn` 作為 Save/Cancel 按鈕（SDialog2 已內建）
- ❌ 使用 `persistent` 屬性（SDialog2 預設行為已處理）
- ❌ 在 Dialog 內維護 `loading` ref（應使用 `store.saveLoading`）
- ❌ 直接呼叫 Service/API（必須透過 Store）
