---
name: backend-processor-create
applies_to: "*CreateProcessor.java, *SaveProcessor.java"
---

## 說明
新增（或新增+修改合併）Processor，接收前端 payload 後建立 Entity 並持久化。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmEmpVacation）
- `{entityDescription}` -- Entity 中文描述（如 員工假別明細）
- `{MODULE_CODE}` -- 大寫底線格式（如 TM002，用於 log 標籤）
- `{routeId}` -- Camel route ID（如 tm002EmpVacationSave）
- `{apiDescription}` -- API 描述（如 儲存員工假別明細）
- `{requiredFields}` -- 必填欄位清單（如 empId,details）
- `{pkField}` -- 主鍵欄位名（如 empVacationId）
- `{ServiceName}` -- Service 類別名稱（如 Tm002EmpVacationService）
- `{serviceName}` -- Service 變數名稱（如 empVacationService）

## Thick Processor 版（簡單 CRUD，業務邏輯在 Processor 內）

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
 * {MODULE_CODE} {entityDescription}新增 Processor
 * <p>
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}CreateProcessor extends ApiRouteProcessor {

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
            operation = AuditLog.OperationType.CREATE,
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

        log.debug("[{MODULE_CODE} 新增] 開始 - TraceId: {}", traceId);

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

        log.info("[{MODULE_CODE} 新增] 成功 - PK: {}, TraceId: {}", entity.{pkField}, traceId);

        // 4. 組裝回應（必須包含 entityId）
        Map<String, Object> data = new HashMap<>();
        data.put("{pkField}", entity.{pkField});
        data.put("entityId", entity.{pkField});  // 必須 -- 用於 AuditLog

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

## Thin Processor 版（複雜邏輯，委派 Service -- 推薦）

TM002 實際使用此模式：Save Processor 接收 empId + details 陣列，委派 Service 處理新增+修改。

```java
package org.soetek.eap.{module}.processor;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{module}.service.{ServiceName};
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.LogType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * {MODULE_CODE} {entityDescription}儲存 Processor
 * <p>
 * 新增或修改{entityDescription}
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}SaveProcessor extends ApiRouteProcessor {

    @Inject
    {ServiceName} {serviceName};

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
            operation = AuditLog.OperationType.CREATE,
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
    @SuppressWarnings("unchecked")
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        // 驗證必填欄位
        Object empIdObj = payload.get("empId");
        if (empIdObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "empId 為必填欄位");
        }
        Integer empId = ((Number) empIdObj).intValue();

        Object detailsObj = payload.get("details");
        if (detailsObj == null || !(detailsObj instanceof List) || ((List<?>) detailsObj).isEmpty()) {
            throw new BusinessException("REQUIRED_FIELD", 400, "details 為必填欄位");
        }
        List<Map<String, Object>> details = (List<Map<String, Object>>) detailsObj;

        log.debug("[{MODULE_CODE} 儲存] empId: {}, details: {} 筆, TraceId: {}", empId, details.size(), traceId);

        // 委派 Service（@Transactional 在 Service 上）
        List<Map<String, Object>> savedRecords = {serviceName}.saveEmpVacationDetails(empId, details);

        log.info("[{MODULE_CODE} 儲存] 完成 - 儲存 {} 筆, TraceId: {}", savedRecords.size(), traceId);

        Map<String, Object> data = new HashMap<>();
        data.put("records", savedRecords);
        data.put("entityId", empId);  // 必須 -- 用於 AuditLog

        return buildStandardResponse(traceId, data, "CREATE");
    }
}
```

## 業務邏輯注意點
- **Thick vs Thin**: 簡單單表 CRUD 用 Thick（`@Transactional` 在 `processBusinessLogic` 上）；複雜業務邏輯 / 多表操作 / 批次新增+修改合併 用 Thin（`@Transactional` 在 Service 上）
- **entityId 必填**: 回應中必須包含 `entityId`，AuditLog 需要使用
- **`@RegisterForReflection`**: TM002 實際程式碼有加，模板一律加上
- **回應格式**: 使用 `buildStandardResponse(traceId, data, "CREATE")`
- **驗證模式**: Number 型別用 `((Number) obj).intValue()`；String 型別用 `getRequiredString`；List 型別先檢查 `instanceof List` 再強轉
- **新增+修改合併**: TM002 Save Processor 同時處理新增和修改（payload 中有 `empVacationId` 時為修改，否則為新增），Service 內部區分。此模式適用於前端以「儲存」按鈕提交整批明細的場景
- **重複性檢查**: 在 Service 層做，用原生 SQL 查詢 COUNT，避免主鍵衝突
