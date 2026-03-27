---
name: frontend-i18n
applies_to: "src/i18n/{locale}/{module}/{module}.json"
---

## 說明

i18n 國際化 JSON：同模組群共用一個 JSON 檔案，新模組的 key 追加到既有 JSON 中。zh-TW 和 en-US 結構必須完全相同。

## 替換規則

- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{moduleTitle}` → 模組中文名稱（如 `員工年度假別額度維護`）
- `{moduleTitleEn}` → 模組英文名稱（如 `Employee Annual Vacation Quota Management`）

## 完整參考實作：zh-TW

```json
{
  "{moduleCode}": {
    "title": "{moduleTitle}",
    "query": {
      "title": "查詢條件",
      "{queryField1}": "{queryField1Label}",
      "{queryField2}": "{queryField2Label}",
      "{queryField3}": "{queryField3Label}",
      "{queryField4}": "{queryField4Label}",
      "searchButton": "查詢",
      "clearButton": "清除"
    },
    "table": {
      "{col1}": "{col1Label}",
      "{col2}": "{col2Label}",
      "{col3}": "{col3Label}",
      "action": "操作"
    },
    "action": {
      "addSingle": "單筆新增",
      "batchImport": "批次新增",
      "edit": "修改"
    },
    "detail": {
      "{detailField1}": "{detailField1Label}",
      "{detailField2}": "{detailField2Label}",
      "{detailField3}": "{detailField3Label}",
      "{detailField4}": "{detailField4Label}",
      "{detailField5}": "{detailField5Label}",
      "{detailField6}": "{detailField6Label}",
      "{detailField7}": "{detailField7Label}",
      "clear": "結算"
    },
    "createDialog": {
      "title": "單筆新增",
      "confirm": "確定",
      "cancel": "取消",
      "loadDefault": "執行預設",
      "addRow": "新增其他列",
      "deleteConfirmTitle": "確認刪除",
      "deleteConfirmMessage": "確定要刪除此筆記錄嗎？"
    },
    "editDialog": {
      "title": "修改明細",
      "empInfo": "員工基本資訊",
      "empNo": "員工編號",
      "empName": "姓名",
      "department": "部門",
      "year": "年度",
      "addRow": "新增其他列",
      "clearLocked": "結算記錄不可刪除",
      "deleteConfirmTitle": "確認刪除",
      "deleteConfirmMessage": "確定要刪除此筆記錄嗎？此操作不可撤銷。",
      "confirm": "確定儲存",
      "cancel": "取消修改"
    },
    "validation": {
      "{validationKey1}": "{validationMessage1}",
      "{validationKey2}": "{validationMessage2}"
    },
    "batchDialog": {
      "title": "批次匯入",
      "uploadTitle": "上傳員工清單",
      "downloadTemplate": "下載範本",
      "selectFile": "選擇檔案",
      "previewTitle": "預覽清單",
      "records": "筆",
      "valid": "有效",
      "applyConditions": "批次套用條件",
      "{batchField1}": "{batchField1Label}",
      "{batchField2}": "{batchField2Label}",
      "empAccount": "員工編號",
      "empAccountHeader": "員工編號",
      "empName": "姓名",
      "department": "部門",
      "status": "狀態",
      "confirm": "確定匯入",
      "cancel": "取消"
    }
  }
}
```

## TM002 真實範例：zh-TW

```json
{
  "tm002": {
    "title": "員工年度假別額度維護",
    "query": {
      "title": "查詢條件",
      "year": "年度",
      "department": "部門",
      "empNo": "員工編號",
      "empName": "員工姓名",
      "searchButton": "查詢",
      "clearButton": "清除"
    },
    "table": {
      "year": "年度",
      "empNo": "員工編號",
      "empName": "姓名",
      "vacationName": "假別名稱",
      "startDate": "生效日",
      "endDate": "失效日",
      "totalHours": "可請額度",
      "usedHours": "已用額度",
      "remainingHours": "剩餘額度",
      "action": "操作"
    },
    "action": {
      "addSingle": "單筆新增",
      "batchImport": "批次新增",
      "edit": "修改"
    },
    "detail": {
      "vacationName": "假別",
      "subName": "假別細項",
      "maxHours": "給假時數",
      "usedHours": "本年度已請",
      "unusedHours": "剩餘時數",
      "beginDate": "額度生效起始日",
      "endDate": "額度生效結束日",
      "clear": "結算"
    },
    "createDialog": {
      "title": "單筆新增",
      "year": "年度",
      "empAccount": "員工編號",
      "searchEmp": "查詢",
      "empInfo": "員工資訊",
      "empName": "姓名",
      "department": "部門",
      "loadDefault": "執行預設",
      "addRow": "新增其他列",
      "confirm": "確定",
      "cancel": "取消",
      "deleteConfirmTitle": "確認刪除",
      "deleteConfirmMessage": "確定要刪除此假別額度記錄嗎？"
    },
    "editDialog": {
      "title": "修改明細",
      "empInfo": "員工基本資訊",
      "empNo": "員工編號",
      "empName": "姓名",
      "department": "部門",
      "year": "年度",
      "addRow": "新增其他列",
      "clearLocked": "結算記錄不可刪除",
      "deleteConfirmTitle": "確認刪除",
      "deleteConfirmMessage": "確定要刪除此假別額度記錄嗎？此操作不可撤銷。",
      "confirm": "確定儲存",
      "cancel": "取消修改"
    },
    "validation": {
      "vacationCodeRequired": "請選擇假別",
      "vacationSubIdRequired": "假別細項不可為空",
      "maxHoursPositive": "給假時數必須為正數",
      "beginDateRequired": "額度生效起始日不可為空",
      "endDateRequired": "額度生效結束日不可為空",
      "endDateBeforeBeginDate": "額度生效結束日不可早於起始日"
    },
    "batchDialog": {
      "title": "批次匯入",
      "uploadTitle": "上傳員工清單",
      "downloadTemplate": "下載範本",
      "selectFile": "選擇檔案",
      "previewTitle": "預覽清單",
      "records": "筆",
      "valid": "有效",
      "applyConditions": "批次套用條件",
      "vacationType": "假別",
      "vacationSub": "假別細項",
      "maxHours": "可請時數",
      "beginDate": "起始日",
      "endDate": "結束日",
      "empAccount": "員工編號",
      "empAccountHeader": "員工編號",
      "empName": "姓名",
      "department": "部門",
      "status": "狀態",
      "confirm": "確定匯入",
      "cancel": "取消"
    }
  }
}
```

## TM002 真實範例：en-US

```json
{
  "tm002": {
    "title": "Employee Annual Vacation Quota Management",
    "query": {
      "title": "Search Criteria",
      "year": "Year",
      "department": "Department",
      "empNo": "Employee No.",
      "empName": "Employee Name",
      "searchButton": "Search",
      "clearButton": "Clear"
    },
    "table": {
      "year": "Year",
      "empNo": "Employee No.",
      "empName": "Name",
      "vacationName": "Leave Type",
      "startDate": "Effective From",
      "endDate": "Effective To",
      "totalHours": "Total Hours",
      "usedHours": "Used Hours",
      "remainingHours": "Remaining Hours",
      "action": "Action"
    },
    "action": {
      "addSingle": "Add Single",
      "batchImport": "Batch Import",
      "edit": "Edit"
    },
    "detail": {
      "vacationName": "Leave Type",
      "subName": "Leave Sub-type",
      "maxHours": "Quota Hours",
      "usedHours": "Used Hours",
      "unusedHours": "Remaining Hours",
      "beginDate": "Effective From",
      "endDate": "Effective To",
      "clear": "Settled"
    },
    "createDialog": {
      "title": "Add Single Record",
      "year": "Year",
      "empAccount": "Employee No.",
      "searchEmp": "Search",
      "empInfo": "Employee Info",
      "empName": "Name",
      "department": "Department",
      "loadDefault": "Load Default",
      "addRow": "Add Row",
      "confirm": "Confirm",
      "cancel": "Cancel",
      "deleteConfirmTitle": "Confirm Delete",
      "deleteConfirmMessage": "Are you sure to delete this vacation quota record?"
    },
    "editDialog": {
      "title": "Edit Details",
      "empInfo": "Employee Info",
      "empNo": "Employee No.",
      "empName": "Name",
      "department": "Department",
      "year": "Year",
      "addRow": "Add Row",
      "clearLocked": "Settlement record cannot be deleted",
      "deleteConfirmTitle": "Confirm Delete",
      "deleteConfirmMessage": "Are you sure to delete this vacation quota record? This action cannot be undone.",
      "confirm": "Save",
      "cancel": "Cancel"
    },
    "validation": {
      "vacationCodeRequired": "Please select a leave type",
      "vacationSubIdRequired": "Leave sub-type is required",
      "maxHoursPositive": "Quota hours must be a positive number",
      "beginDateRequired": "Effective start date is required",
      "endDateRequired": "Effective end date is required",
      "endDateBeforeBeginDate": "Effective end date cannot be earlier than start date"
    },
    "batchDialog": {
      "title": "Batch Import",
      "uploadTitle": "Upload Employee List",
      "downloadTemplate": "Download Template",
      "selectFile": "Select File",
      "previewTitle": "Preview",
      "records": "records",
      "valid": "Valid",
      "applyConditions": "Batch Apply Conditions",
      "vacationType": "Leave Type",
      "vacationSub": "Leave Sub Type",
      "maxHours": "Max Hours",
      "beginDate": "Start Date",
      "endDate": "End Date",
      "empAccount": "Employee No.",
      "empAccountHeader": "Employee No.",
      "empName": "Name",
      "department": "Department",
      "status": "Status",
      "confirm": "Confirm Import",
      "cancel": "Cancel"
    }
  }
}
```

## 檔案位置

- 繁體中文：`frontend/src/i18n/zh-TW/{module}/{module}.json`
- 英文：`frontend/src/i18n/en-US/{module}/{module}.json`

範例：TM 模組群（TM001, TM002, TM003）共用 `tm/tm.json`。

## 自動載入機制

```typescript
// src/core/locales/i18n.ts — 既有框架代碼，不需修改
const modules = import.meta.glob('src/i18n/**/*.json')
```

只要 JSON 檔案放在正確路徑，框架自動載入，無需額外註冊。

## Key 命名規則

| 層級 | 格式 | 範例 |
|------|------|------|
| 頂層 | `{moduleCode}`（小寫） | `tm002` |
| 第二層 | 功能區塊名稱 | `title`, `query`, `table`, `action`, `detail`, `createDialog`, `editDialog`, `validation`, `batchDialog` |
| 第三層 | `{camelCaseFieldName}` | `empNo`, `vacationName`, `beginDate` |

## 使用模式

```typescript
// Script setup
const { t } = useI18n()
const i18nPrefix = '{module}.{moduleCode}.'

// Template 中使用
<s-input :label="$t(i18nPrefix + 'query.empNo')" />

// Script 中使用（如表格欄位定義）
const columns = [
  { name: 'empNo', label: t(i18nPrefix + 'table.empNo'), field: 'empNo' }
]
```

**注意**：TM002 的 `i18nPrefix` 為 `'tm.tm002.'`（含模組群前綴），因為 JSON 結構為 `tm.json > tm002 > ...`。

## 已存在的共用 Key（不可重複定義）

以下 key 在 `src/i18n/zh-TW/common/common.json` 中已定義：

- `common.query`、`common.reset`、`common.add`、`common.edit`、`common.delete`
- `common.save`、`common.cancel`、`common.confirm`、`common.actions`
- `common.confirmDelete`、`common.confirmDeleteMessage`、`common.required`

使用方式：`$t('common.save')`（不加 i18nPrefix）

## 業務邏輯注意點

- **追加不覆寫** — 若 JSON 檔案已存在其他模組的 key，只在最外層追加新模組的 `{moduleCode}` key 區塊
- **zh-TW 和 en-US 結構一致** — 兩個語言檔案的 key 路徑必須完全相同，只有 value 不同
- **功能區塊依規格增減** — TM002 有 `batchDialog` 區塊（批次匯入），標準 CRUD 模組可能不需要
- **validation key** — 對應前端驗證邏輯中的 `$q.notify` 或 `rules` 中使用的 key
- **無硬編碼** — `<template>` 區塊中不可出現硬編碼中文/英文字串
- **JSON 語法** — 無尾隨逗號、引號配對正確
- **i18nPrefix 格式** — `'{module}.{moduleCode}.'`，包含模組群前綴和尾端的點號

## 驗證清單

- [ ] JSON 語法正確
- [ ] zh-TW 和 en-US 的 key 結構完全一致
- [ ] 頂層 key 為小寫 `{moduleCode}`
- [ ] 每個 Vue 檔案中的 `$t()` / `t()` 調用都有對應 key
- [ ] 未重複定義 `common.*` 共用 key
- [ ] 無硬編碼中文/英文字串出現在 `<template>` 區塊
- [ ] 追加到既有 JSON 時，未破壞其他模組的 key
