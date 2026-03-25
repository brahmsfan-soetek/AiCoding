# Backend: GetById Processor 模板

## 範例代碼

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
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.DateFormatUtil;
import org.soetek.foundation.util.LogType;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class {EntityName}GetByIdProcessor extends ApiRouteProcessor {

    // 如需複雜邏輯（header+details），注入 Service
    // @Inject {ModuleCode}Service service;

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "{routeId}",
            "apiDescription", "查詢單筆{功能}資料",
            "requiredFields", "{pkField}");
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
        description = "查詢單筆{功能}資料",
        logParameters = true,
        logResult = true
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
            @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{模組} 查詢單筆] 開始 - TraceId: {}", traceId);

        // 1. 驗證主鍵
        String pkValue = getRequiredString(payload, "{pkField}");

        // 2. 查詢（直接 Entity 或透過 Service）
        {EntityName}Entity entity = {EntityName}Entity.findByKey(pkValue);
        if (entity == null) {
            throw new BusinessException("NOT_FOUND", 404, "資料不存在: " + pkValue);
        }

        // 3. 轉換
        Map<String, Object> data = convertToDetailMap(entity);

        log.info("[{模組} 查詢單筆] 成功 - PK: {}, TraceId: {}", pkValue, traceId);

        return buildStandardResponse(traceId, data, "QUERY");
    }

    private Map<String, Object> convertToDetailMap({EntityName}Entity entity) {
        Map<String, Object> map = new HashMap<>();
        map.put("{pkField}", entity.{pkField});
        // map.put("fieldName", entity.fieldName);
        map.put("creator", entity.creator);
        map.put("createDt", DateFormatUtil.formatDateTime(entity.createDt));
        map.put("updater", entity.updater);
        map.put("updateDt", DateFormatUtil.formatDateTime(entity.updateDt));
        return map;
    }

    // getRequiredString → 同 backend-processor-create.md 的 helper
}
```

## 結構要點

- **無 `@Transactional`** — 純查詢
- **不存在拋 404** — `throw new BusinessException("NOT_FOUND", 404)`
- **回傳單筆 data，非陣列** — 與 Query 的 `records: [...]` 不同
- **日期**: `DateFormatUtil.formatDateTime()` / `DateFormatUtil.formatDate()`
- **複雜場景**: header + details 結構 → 注入 Service 處理
