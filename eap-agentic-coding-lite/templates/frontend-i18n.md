---
name: frontend-i18n
applies_to: "src/i18n/{locale}/{module}/{module}.json"
---

## 說明

i18n 國際化 JSON：同模組群共用一個 JSON 檔案，新模組的 key 追加到既有 JSON 中。zh-TW 和 en-US 的 key 結構必須完全相同。框架自動載入（`import.meta.glob`），無需額外註冊。

## 依規格調整的部分

- 頂層 key：`{moduleCode}`（小寫，如 `tm002`）
- query 區塊：依統一規格的查詢條件欄位
- table 區塊：依統一規格的清單欄位
- detail 區塊：依統一規格的明細欄位
- validation 區塊：對應前端驗證邏輯中的 `$q.notify` 調用
- batchDialog 區塊：依是否有批次匯入功能決定是否需要
- i18nPrefix 格式：`'{module}.{moduleCode}.'`（含模組群前綴和尾端點號）

## 完整參考實作

### zh-TW (`src/i18n/zh-TW/{module}/{module}.json`)

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
      "hireDate": "到職日",
      "seniority": "年資",
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

### en-US (`src/i18n/en-US/{module}/{module}.json`)

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
      "hireDate": "Hire Date",
      "seniority": "Seniority",
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

## 已知陷阱

- **追加不覆寫** — 若 JSON 檔案已存在其他模組的 key（如 `tm001`），只在最外層追加新的 `tm002` key 區塊，不可覆蓋整個檔案
- **zh-TW 和 en-US 結構一致** — 兩個語言檔案的 key 路徑必須完全相同，只有 value 不同；遺漏 key 會導致顯示 key path 而非翻譯文字
- **JSON 語法** — 無尾隨逗號、引號配對正確；JSON 不支持註解
- **i18nPrefix 格式** — `'tm.tm002.'`（包含模組群前綴 `tm.` 和尾端的點號），因為 JSON 結構為 `tm.json > tm002 > ...`
- **validation key 對應** — 每個 key 必須與前端 `$q.notify` / `validateDetails` 中的 `t()` 調用一一對應
- **不重複定義 common key** — `common.save` / `common.cancel` 等已在 `common.json` 中定義，模組內的按鈕文字若需自訂才在此定義
- **後端錯誤碼翻譯** — 後端 Service 拋出的自訂錯誤碼（如 `DUPLICATE_RECORD`、`CLEAR_CANNOT_DELETE`、`DATE_INVALID`）需在 `common/errors.json`（非模組 JSON）新增對應翻譯，否則前端 `useErrorHandler` 會顯示原始錯誤碼
