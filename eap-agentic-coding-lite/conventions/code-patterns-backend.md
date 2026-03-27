# eap 後端代碼模式

> 載入時機：Phase 2 後端 Task

## API 請求完整 Flow

```
HTTP POST /api/{routeId}
  → HandlerApiResource.handleProxy()     // 統一入口（@Path("/api")）
    → JWT / Session 驗證                  // 測試環境已 bypass
    → camelContext.createProducerTemplate()
        .requestBody("direct:{routeId}", payload)
      → BaseApiRouteBuilder 註冊的 route
        → @Named("{routeId}Processor").process()
          → processBusinessLogic(payload, traceId)
            → Service（複雜邏輯）或直接操作 Entity
          → buildStandardResponse(traceId, data, "CREATE")
  → Response 200 / BusinessException → Error Response
```

### 關鍵類別

| 類別 | 位置 | 職責 |
|------|------|------|
| `HandlerApiResource` | `application/.../api/` | JAX-RS 入口，`@POST @Path("/{route}")` 接收所有 API |
| `BaseApiRouteBuilder` | `foundation` 模組 | 提供 `buildApiRoute(routeId)` 快捷方法 |
| `{ModuleCode}RouteBuilder` | `{module}/.../route/` | 每個模組一個，註冊所有 routeId |
| `ApiRouteProcessor` | `foundation` 模組 | Processor 基類，提供 `executeWithErrorHandling`、`buildStandardResponse` |
| `BusinessException` | `foundation` 模組 | 業務異常，建構子 `(errorCode, httpStatus, message)` |

### 新模組要建的檔案

1. **Entity** — `{module}/domain/{Name}Entity.java`
2. **Service**（選用）— `{module}/service/{Name}Service.java`
3. **Processor** — `{module}/processor/{Name}{Action}Processor.java`（每個 API 一個）
4. **RouteBuilder** — `{module}/route/{ModuleCode}RouteBuilder.java`（整個模組一個）

> Processor 透過 `@Named("{routeId}Processor")` 被 Camel 發現，RouteBuilder 透過 `buildApiRoute("{routeId}")` 建立路由。**routeId 必須完全一致**（大小寫敏感）。

## Processor 固定骨架

```java
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class XxxProcessor extends ApiRouteProcessor {
    // 1. getTemplateParams()  — routeId, apiDescription, requiredFields
    // 2. getProcessorType()   — return LogType.API_PROCESSING
    // 3. process()            — @ActivateRequestContext + @AuditLog + return executeWithErrorHandling(...)
    // 4. processBusinessLogic() — 業務邏輯（寫入操作加 @Transactional）
}
```

## 兩種 Processor 架構

| 類型 | 適用場景 | @Transactional 位置 |
|------|---------|---------------------|
| **Thick** | 簡單 CRUD、單 Entity | `processBusinessLogic()` 上 |
| **Thin** | 複雜邏輯、多 Entity | Service 方法上（Processor 不加） |

## 回應建構（強制）

```java
Map<String, Object> data = new HashMap<>();
data.put("recordId", entity.recordId);
data.put("entityId", entity.recordId);  // ⭐ 必須 — AuditLog ENTITY_ID
return buildStandardResponse(traceId, data, "CREATE");
```

## 錯誤處理（強制）

```java
throw new BusinessException("ERROR_CODE", 400, "錯誤訊息");
```

## 參數取值

```java
String value = getRequiredString(payload, "fieldName");       // 必填
String value = getOptionalString(payload, "fieldName", "");   // 選填
```

> 來源：這兩個 helper 定義在各 Processor 的 private method 中（範例見 `templates/backend-processor-create.md`）。每個需要參數驗證的 Processor 須自行包含這兩個方法。

## 審計日誌

```java
@AuditLog(operation = AuditLog.OperationType.CREATE, entity = "Name",
          description = "描述", logParameters = true, logResult = true)
// DELETE: logResult = false; QUERY 高頻: logParameters = false
```

## Entity 註解

```java
@Entity @Table(name = "TABLE_NAME")  // 不加 schema
@RegisterForReflection @Cacheable @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class XxxEntity extends AuditableEapEntity { ... }
```

## SQL 規則

| 查詢方式 | Schema Prefix |
|---------|--------------|
| JPQL | 不需要 |
| 原生 SQL | **必須** `EAP.TABLE` 或 `HRM.TABLE` |
| YAML SQL | **必須** |
| Entity @Table | 不需要 |

## Camel Route 註冊

每個模組有一個 Route 配置類，將 API URL 對應到 `@Named` Processor：

```java
package org.soetek.eap.{moduleCode}.route;

import jakarta.enterprise.context.ApplicationScoped;
import org.soetek.foundation.route.BaseApiRouteBuilder;

@ApplicationScoped
public class {ModuleCode}RouteBuilder extends BaseApiRouteBuilder {

    @Override
    public void configure() throws Exception {
        // routeId 必須與 Processor @Named 值（去掉 Processor 後綴）一致
        buildApiRoute("{routeId}Create");   // → @Named("{routeId}CreateProcessor")
        buildApiRoute("{routeId}Update");
        buildApiRoute("{routeId}Delete");
        buildApiRoute("{routeId}Query");
        buildApiRoute("{routeId}GetById");
    }
}
```

> `buildApiRoute(routeId)` 自動產生 `POST /api/{routeId}` 並路由到 `@Named("{routeId}Processor")`。每個模組一個 RouteBuilder，所有 Processor 集中註冊。

## 禁止模式

- ❌ 手動組裝 response/error Map
- ❌ 回應缺少 `entityId`
- ❌ 原生 SQL 不加 Schema prefix
- ❌ @Table 加 schema 屬性
- ❌ Servlet Filter
- ❌ System.out
- ❌ 日期 `.toString()`（用 `DateFormatUtil`）
- ❌ 手動設定審計欄位
- ❌ DDL 操作

## ⚠️ 與現有代碼的差異

AU010 模組使用手動 LinkedHashMap 組裝回應、buildErrorResponse helper、日期 .toString() — 這些是**早期寫法，不符合現行規範**。遇到衝突時**以本規範為準**。
