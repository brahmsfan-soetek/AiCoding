# Frontend: i18n 國際化模板

> 載入時機：Phase 2 前端 Task — 建立頁面或 Dialog 時必須同時設定 i18n keys

## 檔案位置

同模組群共用一個 JSON 檔案，新模組的 key **追加**到既有 JSON 中：

- 繁體中文：`frontend/src/i18n/zh-TW/{module}/{module}.json`
- 英文：`frontend/src/i18n/en-US/{module}/{module}.json`

範例：TM 模組群（TM001, TM002, TM003）共用 `tm/tm.json`。

> **追加，不覆寫**：若 JSON 檔案已存在其他模組的 key，只在最外層追加新模組的 key 區塊。

## 自動載入機制

```typescript
// src/core/locales/i18n.ts — 既有框架代碼，不需修改
const modules = import.meta.glob('src/i18n/**/*.json')
const localesMap = loadLocalesMapFromDir(
  /src\/i18n\/([^/]+)\/(.*)\/(.*)\.json$/,
  modules
)
```

Regex 擷取：`(locale)/(folder)/(fileName).json`
→ `src/i18n/zh-TW/tm/tm.json` 解析為 locale=`zh-TW`, folder=`tm`, fileName=`tm`

**只要 JSON 檔案放在正確路徑，框架自動載入，無需額外註冊。**

## JSON 結構範例

```json
{
  "{moduleCode}": {
    "title": "{模組中文名稱}",
    "pageTitle": "{MODULE_CODE} - {模組中文名稱}",
    "query": {
      "title": "查詢條件",
      "field1": "欄位1中文名",
      "field2": "欄位2中文名"
    },
    "table": {
      "title": "資料列表",
      "totalCount": "共 {count} 筆記錄",
      "col1": "欄位1中文名",
      "col2": "欄位2中文名"
    },
    "form": {
      "field1": "欄位1中文名",
      "field2": "欄位2中文名"
    },
    "createDialog": {
      "title": "新增{功能名稱}"
    },
    "editDialog": {
      "title": "編輯{功能名稱}"
    },
    "batchDialog": {
      "title": "批次匯入"
    },
    "button": {
      "add": "新增",
      "batchImport": "批次匯入"
    },
    "message": {
      "deleteConfirm": "確定要刪除此筆資料嗎？",
      "saveSuccess": "儲存成功",
      "deleteSuccess": "刪除成功"
    },
    "validation": {
      "field1Required": "請輸入欄位1",
      "field2Required": "請選擇欄位2"
    }
  }
}
```

### 真實範例（TM001 片段）

```json
{
  "tm001": {
    "title": "假別維護",
    "pageTitle": "TM001 - 假別維護",
    "query": {
      "title": "查詢條件",
      "codeRange": "假別代碼區間",
      "codeStart": "起始",
      "codeEnd": "結束"
    },
    "table": {
      "title": "假別資料列表",
      "totalCount": "共 {count} 筆記錄",
      "vacationCode": "假別代碼",
      "vacationName": "假別名稱"
    },
    "detail": {
      "createTitle": "新增假別參數設定",
      "editTitle": "修改假別參數設定",
      "fields": {
        "vacationCode": "假別代碼",
        "vacationName": "假別名稱"
      }
    },
    "validation": {
      "codeRequired": "請輸入假別代碼"
    }
  }
}
```

## Key 命名規則

| 層級 | 格式 | 範例 |
|------|------|------|
| 頂層 | `{moduleCode}`（小寫） | `tm002` |
| 第二層 | 功能區塊名稱 | `title`, `query`, `table`, `form`, `createDialog`, `editDialog`, `button`, `message`, `validation` |
| 第三層 | `{camelCaseFieldName}` | `empNo`, `vacationName`, `beginDate` |

## 使用模式

```typescript
// Script setup
const { t } = useI18n()
const i18nPrefix = '{moduleCode}.'

// Template 中使用
<s-input :label="$t(i18nPrefix + 'query.empNo')" />
<s-input :label="$t(i18nPrefix + 'form.vacationName')" />

// Script 中使用（如表格欄位定義）
const columns = [
  { name: 'empNo', label: t(i18nPrefix + 'table.empNo'), field: 'empNo' },
  { name: 'empName', label: t(i18nPrefix + 'table.empName'), field: 'empName' }
]
```

## 已存在的共用 Key（不可重複定義）

以下 key 在 `src/i18n/zh-TW/common/common.json` 中已定義：

- `common.query`、`common.reset`、`common.add`、`common.edit`、`common.delete`
- `common.save`、`common.cancel`、`common.confirm`、`common.actions`
- `common.confirmDelete`、`common.confirmDeleteMessage`、`common.required`

使用方式：`$t('common.save')`（不加 i18nPrefix）

## 多語言

zh-TW 和 en-US 必須**結構完全相同**（相同的 key 路徑），只有 value 不同：

```json
// en-US/tm/tm.json
{
  "tm002": {
    "title": "Employee Annual Vacation Quota",
    "query": {
      "empNo": "Employee No",
      "empName": "Employee Name"
    }
  }
}
```

## 驗證清單

- [ ] JSON 語法正確（無尾隨逗號、引號配對正確）
- [ ] zh-TW 和 en-US 的 key 結構完全一致
- [ ] 頂層 key 為小寫 `{moduleCode}`（如 `tm002`）
- [ ] 每個 Vue 檔案中的 `$t()` / `t()` 調用都有對應 key
- [ ] 未重複定義 `common.*` 共用 key
- [ ] 無硬編碼中文/英文字串出現在 `<template>` 區塊
- [ ] 追加到既有 JSON 時，未破壞其他模組的 key
