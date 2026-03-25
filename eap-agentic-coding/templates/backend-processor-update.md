# Backend: Update Processor 模板

> 權威來源：`Docs/BACKEND_PROCESSOR_SKILL_GUIDE.md` UpdateProcessor 範例

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

import java.util.HashMap;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class {EntityName}UpdateProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "{routeId}",
            "apiDescription", "{更新描述}",
            "requiredFields", "{pkField}");
    }

    @Override
    protected String getProcessorType() {
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext
    @AuditLog(
        operation = AuditLog.OperationType.UPDATE,
        entity = "{EntityName}",
        description = "{更新描述}",
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
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{模組} 更新] 開始 - TraceId: {}, Payload: {}", traceId, payload);

        // 1. 驗證主鍵
        String pkValue = getRequiredString(payload, "{pkField}");

        // 2. 查詢並驗證存在性
        {EntityName}Entity entity = {EntityName}Entity.findByKey(pkValue);
        if (entity == null) {
            throw new BusinessException("NOT_FOUND", 404, "資料不存在: " + pkValue);
        }

        // 3. 只更新有提供的欄位（部分更新模式）
        boolean hasChanges = false;

        if (payload.containsKey("fieldName")) {
            String newValue = payload.get("fieldName").toString().trim();
            if (!newValue.equals(entity.fieldName)) {
                entity.fieldName = newValue;
                hasChanges = true;
            }
        }

        // 4. 有變更才持久化
        if (hasChanges) {
            entity.persist();
        }

        log.info("[{模組} 更新] 成功 - PK: {}, TraceId: {}", pkValue, traceId);

        // 5. 回應（必須包含 entityId）
        Map<String, Object> data = new HashMap<>();
        data.put("{pkField}", entity.{pkField});
        data.put("entityId", entity.{pkField});  // ⭐ 必須

        return buildStandardResponse(traceId, data, "UPDATE");
    }

    // getRequiredString / getOptionalString → 同 backend-processor-create.md 的 helper
}
```

## 結構要點

- **`@Transactional`** — 寫入操作必須
- **必填主鍵** — Update 比 Create 多了主鍵驗證
- **存在性檢查** — `findByKey()` → null 則 `throw BusinessException("NOT_FOUND", 404)`
- **部分更新** — 只更新 payload 中有提供的欄位，檢測是否有變更
- **回應**: `buildStandardResponse()` + `entityId` 必填
- **Thin 版**: 委派 Service，`@Transactional` 移到 Service 上

## ⚠️ 與現有代碼的差異

AU010 CalendarUpdate 使用手動 Map 回應和 buildErrorResponse — **以本模板為準**。
