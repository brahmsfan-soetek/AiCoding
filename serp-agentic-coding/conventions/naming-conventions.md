# serp 命名慣例

## Backend
- **Package**: `org.soetek.serp.{module-abbr}.{layer}`（如 `org.soetek.serp.gl.processor`）
- **Class**: PascalCase — `{Module}{Entity}{Operation}Processor`、`{Module}{Entity}Entity`
- **Method**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Processor @Named**: `{routeId}Processor`（如 `glCurrencyCreateProcessor`）
- **Route ID**: @Named 去掉 Processor 後綴（如 `glCurrencyCreate`）
- **API URL**: `/api/{routeId}`

## Frontend
- **頁面**: `{MODULE_CODE}{Action}.vue`（如 `GL003Query.vue`）
- **組件**: PascalCase Vue SFC
- **Service**: `{moduleCode}Service.ts`，export async function 獨立函式
- **Store**: `use{ModuleCode}Store.ts`，Pinia Setup API
- **Composables**: `use{PascalCase}`
- **i18n key**: `{moduleCode}.{camelCaseKey}`

## 目錄結構

### Backend
```
{module}/src/main/java/org/soetek/serp/{abbr}/
  domain/       Entity + 複合主鍵 Id 類別
  processor/    Camel Processor（業務邏輯）
  service/      Service（複雜跨 Entity 業務邏輯）
  repository/   JPA Repository（需要時）
  spi/          SqlProvider（SPI 註冊 SQL 檔）
```

### Frontend
```
src/pages/{module}/{moduleCode}/       頁面組件
src/components/common/                 共用組件
src/components/{module}/{moduleCode}/  業務組件
src/stores/{module}/{moduleCode}/      Pinia stores
src/services/{module}/                 API 服務層
src/types/{module}/                    TypeScript 型別
src/i18n/zh-TW/{module}/              國際化
```
