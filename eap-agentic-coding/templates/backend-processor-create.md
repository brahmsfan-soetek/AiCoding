# Backend: Create Processor 模板

## Thick Processor 版（簡單 CRUD，業務邏輯在 Processor 內）

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

import java.util.HashMap;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class {EntityName}CreateProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "{routeId}",
            "apiDescription", "{API 描述}",
            "requiredFields", "{field1},{field2}");
    }

    @Override
    protected String getProcessorType() {
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext
    @AuditLog(
        operation = AuditLog.OperationType.CREATE,
        entity = "{EntityName}",
        description = "{操作描述}",
        logParameters = true,
        logResult = true
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
            @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    @Transactional
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        log.debug("[{模組} 新增] 開始 - TraceId: {}", traceId);

        // 1. 必填欄位驗證
        String field1 = getRequiredString(payload, "field1");

        // 2. 業務規則驗證（重複性檢查）
        if ({EntityName}Entity.existsByKey(field1)) {
            throw new BusinessException("RECORD_EXISTS", 409, "資料已存在: " + field1);
        }

        // 3. 建立 Entity 並持久化
        {EntityName}Entity entity = new {EntityName}Entity();
        entity.field1 = field1;
        entity.persist();

        log.info("[{模組} 新增] 成功 - PK: {}, TraceId: {}", entity.{pkField}, traceId);

        // 4. 組裝回應（必須包含 entityId）
        Map<String, Object> data = new HashMap<>();
        data.put("{pkField}", entity.{pkField});
        data.put("entityId", entity.{pkField});  // ⭐ 必須 — 用於 AuditLog

        return buildStandardResponse(traceId, data, "CREATE");
    }

    private String getRequiredString(Map<String, Object> payload, String fieldName) {
        if (!payload.containsKey(fieldName) || payload.get(fieldName) == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "必填欄位缺失: " + fieldName);
        }
        String value = payload.get(fieldName).toString().trim();
        if (value.isEmpty()) {
            throw new BusinessException("REQUIRED_FIELD", 400, "必填欄位不可為空: " + fieldName);
        }
        return value;
    }

    private String getOptionalString(Map<String, Object> payload, String fieldName, String defaultValue) {
        if (!payload.containsKey(fieldName) || payload.get(fieldName) == null) {
            return defaultValue;
        }
        String value = payload.get(fieldName).toString().trim();
        return value.isEmpty() ? defaultValue : value;
    }
}
```

## Thin Processor 版（複雜邏輯，委派 Service）

```java
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {EntityName}CreateProcessor extends ApiRouteProcessor {

    @Inject
    {EntityName}CreateService createService;

    // ... getTemplateParams(), getProcessorType(), process() 同上 ...

    @Override
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{模組} 新增] 開始 - TraceId: {}", traceId);

        // 委派 Service（@Transactional 在 Service 上）
        Integer pkValue = createService.create(payload);

        log.info("[{模組} 新增] 成功 - PK: {}, TraceId: {}", pkValue, traceId);

        Map<String, Object> data = new HashMap<>();
        data.put("{pkField}", pkValue);
        data.put("entityId", pkValue);  // ⭐ 必須

        return buildStandardResponse(traceId, data, "CREATE");
    }
}
```

## 結構要點

- **繼承**: `extends ApiRouteProcessor`
- **process()**: 固定 `return executeWithErrorHandling(exchange, payload, headers);`
- **回應**: `buildStandardResponse(traceId, data, "CREATE")` + `entityId` 必填
- **錯誤**: `throw new BusinessException(code, httpStatus, msg)` — 不手動組裝 error Map
- **@Transactional**: Thick 在 `processBusinessLogic()`、Thin 在 Service

## ⚠️ 與現有代碼的差異

若參考到 AU010 的 Processor，會看到手動 LinkedHashMap 回應、buildErrorResponse helper、無 entityId — 這些是**早期寫法，以本模板為準**。
