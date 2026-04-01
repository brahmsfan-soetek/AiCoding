# Backend: Query Processor 模板

> serp 使用前端分頁排序，預設用 frontend 版本。如需後端分頁見下方 backend 版本。

## pagination_strategy: frontend（前端分頁排序）

後端回傳全部資料，不做分頁和排序。

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/processor/GlCurrencyQueryProcessor.java

package org.soetek.serp.gl.processor;

// ... imports

@Slf4j
@ApplicationScoped
@Named("glCurrencyQueryProcessor")
public class GlCurrencyQueryProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "glCurrencyQuery",
            "apiDescription", "查詢幣別",
            "requiredFields", "");
    }

    @Override
    protected String getProcessorType() {
        return "BIZ_GL_CURRENCY";
    }

    @Override
    @ActivateRequestContext
    @AuditLog(operation = AuditLog.OperationType.QUERY,
              entity = "GlCurrency",
              description = "查詢幣別")
    public Object process(Exchange exchange,
                          @Body Map<String, Object> payload,
                          @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        // 1. 查詢（Entity ORM 優先）
        List<GlCurrencyEntity> entities = GlCurrencyEntity.findByConditions(payload);

        // 2. 轉換（用 Entity.toMap，不手寫轉換）
        List<Map<String, Object>> records = entities.stream()
            .map(GlCurrencyEntity::toMap)
            .toList();

        // 3. 回應（直接回傳全部，分頁排序由前端處理）
        return buildStandardResponse(traceId,
            Map.of("records", records), "查詢成功");
    }
}
```

**結構要點**：
- Query 不加 `@Transactional`（只讀）
- **不做後端分頁和排序** — 前端 TablesComponent 處理
- `Entity.findByConditions()` — ORM 優先
- `Entity::toMap` — 串流轉換，不手寫迴圈
- 回應直接用 `records` key

---

## pagination_strategy: backend（後端分頁排序）

後端處理分頁和排序，回傳指定頁資料。

```java
    @Override
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        // 1. 解析分頁參數
        PaginationParams params = PaginationUtil.parsePaginationParams(payload);

        // 2. 查詢
        List<GlCurrencyEntity> entities = GlCurrencyEntity.findByConditions(payload);

        // 3. 轉換
        List<Map<String, Object>> results = entities.stream()
            .map(GlCurrencyEntity::toMap)
            .toList();

        // 4. 分頁
        PaginationResult<Map<String, Object>> result =
            PaginationUtil.paginate(results, params);

        // 5. 回應（items → records 語義轉換）
        Map<String, Object> response = result.toResponseMap("查詢成功");
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        Map<String, Object> enhancedData = new HashMap<>(data);
        enhancedData.put("records", enhancedData.remove("items"));
        response.put("data", enhancedData);

        return response;
    }
```

**差異**：多了 PaginationUtil 解析 + 分頁處理。

---

## 何時用 NativeSqlService

```java
// 僅限：多表 JOIN、聚合計算、跨模組查詢、下拉選單

@Inject
NativeSqlService nativeSqlService;

// 下拉選單（跨表取 code + name）
List<Map<String, Object>> items = nativeSqlService.executeQuery(
    "Lov.currencyList", Map.of());

// 多表 JOIN 報表
List<Map<String, Object>> results = nativeSqlService.executeQuery(
    "GL017.valuationReport", params);
```
