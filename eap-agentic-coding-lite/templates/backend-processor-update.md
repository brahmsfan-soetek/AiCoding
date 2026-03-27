---
name: backend-processor-update
applies_to: "*UpdateProcessor.java"
---

## 說明
更新 Processor，接收前端 payload 後查詢既有 Entity 並更新欄位。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmEmpVacation）
- `{entityDescription}` -- Entity 中文描述（如 員工假別明細）
- `{MODULE_CODE}` -- 大寫底線格式（如 TM002，用於 log 標籤）
- `{routeId}` -- Camel route ID（如 tm002EmpVacationUpdate）
- `{apiDescription}` -- API 描述（如 更新員工假別明細）
- `{requiredFields}` -- 必填欄位清單（如 empVacationId）
- `{pkField}` -- 主鍵欄位名（如 empVacationId）
- `{PKType}` -- 主鍵 Java 型別（如 Integer）

## 完整參考實作（Thick 版）

```java
package org.soetek.eap.{module}.processor;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{module}.domain.{EntityName}Entity;
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.LogType;

import java.util.HashMap;
import java.util.Map;

/**
 * {MODULE_CODE} {entityDescription}更新 Processor
 * <p>
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}UpdateProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "{routeId}",
                "apiDescription", "{apiDescription}",
                "requiredFields", "{requiredFields}");
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
            description = "{apiDescription}",
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

        log.debug("[{MODULE_CODE} 更新] 開始 - TraceId: {}, Payload: {}", traceId, payload);

        // 1. 驗證主鍵
        Object pkObj = payload.get("{pkField}");
        if (pkObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "{pkField} 為必填欄位");
        }
        {PKType} pkValue = (({PKType}) pkObj instanceof Number ? ((Number) pkObj).intValue() : {PKType}.valueOf(pkObj.toString()));

        // 2. 查詢並驗證存在性
        {EntityName}Entity entity = {EntityName}Entity.findByKey(pkValue);
        if (entity == null) {
            throw new BusinessException("NOT_FOUND", 404, "資料不存在: " + pkValue);
        }

        // 3. 只更新有提供的欄位（部分更新模式）
        boolean hasChanges = false;

        // 範例：更新可請時數
        // if (payload.containsKey("maxHours")) {
        //     BigDecimal newValue = toBigDecimal(payload.get("maxHours"));
        //     if (!Objects.equals(newValue, entity.maxHours)) {
        //         entity.maxHours = newValue;
        //         hasChanges = true;
        //     }
        // }

        // 4. 有變更才持久化
        if (hasChanges) {
            entity.persist();
        }

        log.info("[{MODULE_CODE} 更新] 成功 - PK: {}, TraceId: {}", pkValue, traceId);

        // 5. 回應（必須包含 entityId）
        Map<String, Object> data = new HashMap<>();
        data.put("{pkField}", entity.{pkField});
        data.put("entityId", entity.{pkField});  // 必須 -- 用於 AuditLog

        return buildStandardResponse(traceId, data, "UPDATE");
    }
}
```

## Thin Processor 版

TM002 實際採用 Save Processor 合併新增+修改（見 backend-processor-create.md Thin 版），
Service 內部根據 `empVacationId` 是否存在來區分新增或修改。
若模組需要獨立的 Update Processor，委派 Service 的結構如下：

```java
    @Inject
    {ServiceName} {serviceName};

    @Override
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{MODULE_CODE} 更新] 開始 - TraceId: {}", traceId);

        // 委派 Service（@Transactional 在 Service 上）
        Map<String, Object> result = {serviceName}.update(payload);

        log.info("[{MODULE_CODE} 更新] 成功 - TraceId: {}", traceId);

        result.put("entityId", result.get("{pkField}"));
        return buildStandardResponse(traceId, result, "UPDATE");
    }
```

## 業務邏輯注意點
- **`@Transactional`**: Thick 加在 `processBusinessLogic()` 上；Thin 加在 Service 方法上
- **存在性檢查**: `findByKey()` 返回 null 時拋 `BusinessException("NOT_FOUND", 404)`
- **部分更新**: 只更新 payload 中有提供的欄位，用 `containsKey()` 檢查，並比對新舊值避免無效寫入
- **entityId 必填**: 回應中必須包含 `entityId`
- **主鍵型別**: Integer 用 `((Number) obj).intValue()`；String 用 `.toString().trim()`
- **不可修改欄位**: 若某些欄位為唯讀（如 TM002 的 CLEAR 結算欄位），不在更新邏輯中處理
- **Save 合併模式**: TM002 使用 Save Processor 同時處理新增+修改，此為常見模式。如果前端畫面是「儲存整批明細」（而非獨立新增/修改按鈕），建議使用 Save 合併模式（見 backend-processor-create.md）
