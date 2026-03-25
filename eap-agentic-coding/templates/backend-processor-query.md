# Backend: Query Processor 模板

> 權威來源：`Docs/BACKEND_PROCESSOR_SKILL_GUIDE.md` QueryProcessor 範例 + AU011/TM 實際代碼

## 標準版（後端分頁，使用 PaginationUtil）

```java
package org.soetek.eap.{moduleCode}.processor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{moduleCode}.domain.{EntityName}Entity;
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.DateFormatUtil;
import org.soetek.foundation.util.LogType;
import org.soetek.foundation.util.PaginationUtil;
import org.soetek.foundation.util.PaginationUtil.PaginationParams;
import org.soetek.foundation.util.PaginationUtil.PaginationResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class {EntityName}QueryProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "{routeId}",
            "apiDescription", "{查詢描述}",
            "requiredFields", "");
    }

    @Override
    protected String getProcessorType() {
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext
    @AuditLog(
        operation = AuditLog.OperationType.QUERY,
        entity = "{EntityName}",
        description = "{查詢描述}",
        logParameters = true,
        logResult = true
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
            @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    @SuppressWarnings("unchecked")
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{模組} 查詢] 開始 - TraceId: {}, Payload: {}", traceId, payload);

        // 1. 解析分頁參數
        PaginationParams paginationParams = PaginationUtil.parsePaginationParams(payload);

        // 2. 查詢資料
        List<{EntityName}Entity> entityList = {EntityName}Entity.findAllXxx(payload);

        log.debug("[{模組} 查詢] 查詢結果 - 總筆數: {}, TraceId: {}", entityList.size(), traceId);

        // 3. 轉換為 Map
        List<Map<String, Object>> recordList = entityList.stream()
                .map(this::convertToMap)
                .toList();

        // 4. 分頁
        PaginationResult<Map<String, Object>> result = PaginationUtil.paginate(recordList, paginationParams);

        log.info("[{模組} 查詢] 成功 - TotalCount: {}, CurrentPage: {}, TraceId: {}",
                result.getTotalCount(), result.getCurrentPage(), traceId);

        // 5. 組裝回應（items → records rename）
        Map<String, Object> response = new HashMap<>(result.toResponseMap("查詢成功"));
        response.put("traceId", traceId);

        Map<String, Object> existingData = (Map<String, Object>) response.get("data");
        if (existingData != null && existingData.containsKey("items")) {
            Map<String, Object> enhancedData = new HashMap<>(existingData);
            enhancedData.put("records", enhancedData.remove("items"));
            response.put("data", enhancedData);
        }

        return response;
    }

    private Map<String, Object> convertToMap({EntityName}Entity entity) {
        Map<String, Object> map = new HashMap<>();
        map.put("{pkField}", entity.{pkField});
        // map.put("fieldName", entity.fieldName);
        // ⭐ 日期格式化用 DateFormatUtil
        map.put("createDt", DateFormatUtil.formatDateTime(entity.createDt));
        map.put("updateDt", DateFormatUtil.formatDateTime(entity.updateDt));
        return map;
    }
}
```

## 結構要點

- **無 `@Transactional`** — Query 是唯讀操作
- **分頁**: `PaginationUtil.parsePaginationParams()` + `.paginate()` — 後端分頁
- **回應 key**: PaginationUtil 產出 `items`，手動 rename 為 `records`（前端慣例）。⚠️ 此為 Query 分頁場景的例外 — `PaginationUtil.toResponseMap()` 產出的結構需要手動調整，不適用 `buildStandardResponse()`
- **日期**: 使用 `DateFormatUtil.formatDateTime()` / `DateFormatUtil.formatDate()`
- **不回傳 entityId** — Query 不需要

## 何時用 EntityManager 原生查詢

- 多表 JOIN（如查詢時需要跨表取員工姓名）
- 聚合計算（SUM, COUNT, GROUP BY）
- 跨 Schema 查詢（HRM + EAP）
- **原生 SQL 必須加 Schema Prefix**（`EAP.TABLE` 或 `HRM.TABLE`）

## ⚠️ 與現有代碼的差異

AU010 CalendarQuery 不使用 PaginationUtil、回應 key 用 `items` 不 rename `records`、日期用 `.toString()` — 這是特殊場景（日曆按月查詢不需分頁）。**一般 Query 以本模板為準**。
