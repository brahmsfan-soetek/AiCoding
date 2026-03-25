# Backend: Delete Processor 模板

> 權威來源：`Docs/BACKEND_PROCESSOR_SKILL_GUIDE.md` DeleteProcessor 範例 + AU011 `EmpAgentDeleteProcessor`

## 範例代碼

```java
package org.soetek.eap.{moduleCode}.processor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{moduleCode}.domain.{EntityName}Entity;
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.LogType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class {EntityName}DeleteProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "{routeId}",
            "apiDescription", "{刪除描述}",
            "requiredFields", "ids");
    }

    @Override
    protected String getProcessorType() {
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext
    @AuditLog(
        operation = AuditLog.OperationType.DELETE,
        entity = "{EntityName}",
        description = "{刪除描述}",
        logParameters = true,
        logResult = false           // ⭐ Delete 不記錄回傳結果
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
            @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{模組} 刪除] 開始 - TraceId: {}", traceId);

        // 1. 驗證 ids 必填
        if (!payload.containsKey("ids") || payload.get("ids") == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "請選擇要刪除的資料");
        }

        List<?> rawIds = (List<?>) payload.get("ids");
        if (rawIds.isEmpty()) {
            throw new BusinessException("REQUIRED_FIELD", 400, "請選擇要刪除的資料");
        }

        // 2. (可選) 業務規則檢查 — 如有子表引用則不可刪
        // long relatedCount = RelatedEntity.count("parentId", id);
        // if (relatedCount > 0) {
        //     throw new BusinessException("HAS_DEPENDENCIES", 400, "資料被引用中，無法刪除");
        // }

        // 3. 逐筆刪除
        List<Long> deletedIds = new ArrayList<>();
        for (Object rawId : rawIds) {
            Long id = Long.valueOf(rawId.toString());
            {EntityName}Entity entity = {EntityName}Entity.findByKey(id);
            if (entity != null) {
                entity.delete();
                deletedIds.add(id);
            }
        }

        log.info("[{模組} 刪除] 完成 - 刪除筆數: {}, TraceId: {}", deletedIds.size(), traceId);

        // 4. 回應
        Map<String, Object> data = new HashMap<>();
        data.put("deletedCount", deletedIds.size());
        data.put("deletedIds", deletedIds);

        return buildStandardResponse(traceId, data, "DELETE");
    }
}
```

## 結構要點

- **`@Transactional`** — 寫入操作必須
- **`@AuditLog` logResult = false** — 刪除不記錄回傳結果
- **批次刪除**: 前端傳 `ids` 陣列，逐筆 `findByKey()` + `entity.delete()`
- **容錯**: `findByKey()` 返回 null 時靜默跳過
- **回應**: `buildStandardResponse(traceId, data, "DELETE")`
- **(可選) 依賴檢查**: 有子表引用時 `throw BusinessException("HAS_DEPENDENCIES")`
