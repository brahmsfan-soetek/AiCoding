# eap 命名慣例

## Backend
- **Package**: `org.soetek.eap.{module-code}.{layer}`（如 `org.soetek.eap.au010.processor`）
- **Class**: PascalCase — `{Entity}{Operation}Processor`、`{Entity}Entity`
- **Method**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Processor @Named**: `{camelCaseRouteName}Processor`（如 `auCalendarCreateProcessor`）
- **Route ID**: @Named 去掉 Processor 後綴（如 `auCalendarCreate`）
- **API URL**: `/api/{routeId}`（如 `/api/au010CalendarCreate`，模組前綴可選）
- **Service**: `{ModuleCode}Service`（如 `Au012Service`）

## Frontend
- **頁面**: `{MODULE_CODE}{Action}.vue`（如 `AU010Query.vue`）
- **組件**: PascalCase Vue SFC（如 `CalendarHeader.vue`）
- **Service**: `{moduleCode}Service.ts`，export const 物件模式（如 `au010Service`）
- **Store**: `use{ModuleCode}Store.ts`，Pinia Setup API（如 `useAu010Store.ts`）
- **Types**: `{moduleCode}Types.ts`（如 `au010Types.ts`）
- **Composables**: `use{PascalCase}`
- **i18n key**: `{moduleCode}.{camelCaseKey}`

## 目錄結構

### Backend
```
{module-code}/src/main/java/org/soetek/eap/{module-code}/
  domain/       Entity（繼承 AuditableEapEntity）
  processor/    Camel Processor（業務邏輯入口）
  service/      Service（複雜跨 Entity 業務邏輯）
```

### Frontend
```
src/pages/{module}/{moduleCode}/                    主頁面（{MODULE_CODE}.vue）
src/pages/{module}/{moduleCode}/components/         Dialog 組件（{ModuleCode}XxxDialog.vue）— Dialog 模式
src/pages/{module}/{moduleCode}/{MODULE_CODE}Detail.vue  明細頁面 — Page 模式（僅複雜場景）
src/components/common/                              共用組件（SBtn, SInput, SDialog2 等）
src/stores/{module}/{moduleCode}/                   Pinia stores
src/services/{module}/                              API 服務層
src/types/{module}/                                 TypeScript 型別
src/i18n/zh-TW/{module}/                            國際化
```

> **Dialog 模式目錄範例**（TM002）：
> ```
> src/pages/tm/tm002/
>   TM002.vue                            ← 主頁面（清單查詢 + Dialog 整合）
>   components/
>     Tm002CreateDialog.vue              ← 新增 Dialog（SDialog2）
>     Tm002EditDialog.vue                ← 編輯 Dialog（SDialog2）
>     Tm002BatchDialog.vue               ← 批次匯入 Dialog（SDialog2）
> ```
