# Frontend: Dialog 組件模板

> 權威來源：`Docs/EAP_FRONTEND_ARCHITECTURE.md` Dialog 模式 + AU001 ApplicationDialog 範例

## 範例代碼

```vue
<!-- src/pages/{module}/{moduleCode}/{EntityName}Dialog.vue -->
<template>
  <s-dialog2 v-model="dialogVisible" persistent>
    <s-card style="min-width: 500px">
      <!-- 標題 -->
      <q-card-section>
        <div class="text-h6">
          {{ isEdit ? $t('common.edit') : $t('common.add') }}{{ $t(i18nPrefix + 'title') }}
        </div>
      </q-card-section>

      <!-- 表單 -->
      <q-card-section>
        <q-form ref="formRef" greedy>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <s-input
                v-model="formData.field1"
                :label="$t(i18nPrefix + 'field1')"
                :readonly="isEdit"
                :rules="[val => !!val || $t('common.required')]"
              />
            </div>
            <div class="col-12 col-md-6">
              <s-input
                v-model="formData.field2"
                :label="$t(i18nPrefix + 'field2')"
                :rules="[val => !!val || $t('common.required')]"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <!-- 操作按鈕 -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <s-btn
          :label="$t('common.cancel')"
          flat
          @click="dialogVisible = false"
        />
        <s-btn
          :label="$t('common.save')"
          color="primary"
          :loading="store.saveLoading"
          @click="handleSave"
        />
      </q-card-actions>
    </s-card>
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

// ==================== 儲存 ====================

async function handleSave() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  try {
    if (isEdit.value) {
      await store.update(formData.value)
    } else {
      await store.create(formData.value)
    }
    emit('saved')
  } catch (error) {
    // 錯誤由 Store 處理（useErrorHandler）
  }
}
</script>
```

## 結構要點

- **`s-dialog2` + `s-card`** — 使用共用元件，不直接用 `q-dialog` / `q-card`
- **`v-model` 雙向綁定** — `computed` get/set 包裝 `modelValue` + `update:modelValue`
- **`persistent`** — Dialog 不可點外部關閉
- **`q-form ref` + `greedy`** — 統一表單驗證
- **`watch modelValue`** — Dialog 開啟時初始化/重置表單
- **isEdit computed** — 依 `mode` prop 判斷新增/編輯
- **錯誤處理** — Store 層處理，Dialog 不直接處理 API 錯誤
- **loading 狀態** — 使用 `store.saveLoading`，不在 Dialog 維護
