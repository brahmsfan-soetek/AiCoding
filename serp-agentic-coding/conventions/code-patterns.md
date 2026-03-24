# serp 代碼模式

## Backend 模式

- Processor 註解: `@Slf4j @ApplicationScoped @Named("{routeId}Processor")`
- Processor 繼承: `extends ApiRouteProcessor`
- 必須實作: `getTemplateParams()`, `getProcessorType()`, `process()`, `processBusinessLogic()`
- JPA 方法: `@ActivateRequestContext`；persist/update: `@Transactional`
- 錯誤處理: `throw new BusinessException("ERROR_CODE", httpStatus)`
- 回應建構: `buildStandardResponse(traceId, data, message)`
- 日誌: 使用基礎類的 `setLogContext`, `logProcessStart`, `logProcessSuccess`

## Frontend 模式

- import 順序: vue/quasar → stores → components → types → relative
- 組件結構: `<script setup lang="ts">` + `<template>` + `<style scoped>`
- API 呼叫: 使用 Service 物件方法，不直接 import axios
- 權限按鈕: `SBtn` + `permission-id`
- i18n: `$t(i18nPrefix + 'key')`
- 頁面 onMounted: `sessionStore.setPagePid('XX001')` — SBtn 權限依賴此值

## 禁止模式

### Backend
- 不在 Processor 中直接寫 SQL（用 Entity 或 NativeSqlService）
- 不使用 Servlet Filter（與 Quarkus + Vert.x 不相容）
- 不使用 System.out（用 @Slf4j logger）
- 日期不使用 .toString()（用 DateFormatUtil）
- Entity 轉換不使用手動 for-loop 映射（用 Entity.toMap()）
- 禁止 DDL 操作

### Frontend
- 不使用 any 型別
- 不使用 console.log（production 只允許 warn/error）
- 不直接 import axios（用封裝的 api instance）
- 不直接操作 DOM
