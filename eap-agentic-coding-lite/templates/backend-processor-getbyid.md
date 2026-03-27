---
name: backend-processor-getbyid
applies_to: "*GetByIdProcessor.java, *DetailProcessor.java"
---

## 說明
查詢單筆資料 Processor，依主鍵查詢單筆 Entity 並回傳完整欄位。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmEmpVacation）
- `{entityDescription}` -- Entity 中文描述（如 員工假別明細）
- `{MODULE_CODE}` -- 大寫底線格式（如 TM002，用於 log 標籤）
- `{routeId}` -- Camel route ID（如 tm002EmpVacationGetById）
- `{apiDescription}` -- API 描述（如 查詢單筆員工假別明細）
- `{requiredFields}` -- 必填欄位清單（如 empVacationId）
- `{pkField}` -- 主鍵欄位名（如 empVacationId）
- `{PKType}` -- 主鍵 Java 型別（如 Integer）
- `{ServiceName}` -- Service 類別名稱（如 Tm002EmpVacationService，複雜場景用）
- `{serviceName}` -- Service 變數名稱（如 empVacationService）

## 完整參考實作（Thick 版 -- 直接查 Entity）

```java
package org.soetek.eap.{module}.processor;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{module}.domain.{EntityName}Entity;
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.DateFormatUtil;
import org.soetek.foundation.util.LogType;

import java.util.HashMap;
import java.util.Map;

/**
 * {MODULE_CODE} 查詢單筆{entityDescription} Processor
 * <p>
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}GetByIdProcessor extends ApiRouteProcessor {

    // 如需複雜邏輯（header+details），注入 Service
    // @Inject {ServiceName} {serviceName};

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
            operation = AuditLog.OperationType.QUERY,
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
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        log.debug("[{MODULE_CODE} 查詢單筆] 開始 - TraceId: {}", traceId);

        // 1. 驗證主鍵
        Object pkObj = payload.get("{pkField}");
        if (pkObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "{pkField} 為必填欄位");
        }
        {PKType} pkValue = ((Number) pkObj).intValue();

        // 2. 查詢
        {EntityName}Entity entity = {EntityName}Entity.findByKey(pkValue);
        if (entity == null) {
            throw new BusinessException("NOT_FOUND", 404, "資料不存在: " + pkValue);
        }

        // 3. 轉換為回應 Map
        Map<String, Object> data = convertToDetailMap(entity);

        log.info("[{MODULE_CODE} 查詢單筆] 成功 - PK: {}, TraceId: {}", pkValue, traceId);

        return buildStandardResponse(traceId, data, "QUERY");
    }

    private Map<String, Object> convertToDetailMap({EntityName}Entity entity) {
        Map<String, Object> map = new HashMap<>();
        map.put("{pkField}", entity.{pkField});
        // map.put("empId", entity.empId);
        // map.put("maxHours", entity.maxHours);
        // map.put("beginDate", DateFormatUtil.formatDate(entity.beginDate));
        // map.put("endDate", DateFormatUtil.formatDate(entity.endDate));
        map.put("creator", entity.creator);
        map.put("createDt", DateFormatUtil.formatDateTime(entity.createDt));
        map.put("updater", entity.updater);
        map.put("updateDt", DateFormatUtil.formatDateTime(entity.updateDt));
        return map;
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
}
```

## Thin 版（委派 Service -- 適用於 header+details 或多表 JOIN 場景）

```java
    @Inject
    {ServiceName} {serviceName};

    @Override
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        log.debug("[{MODULE_CODE} 查詢單筆] 開始 - TraceId: {}", traceId);

        Object pkObj = payload.get("{pkField}");
        if (pkObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "{pkField} 為必填欄位");
        }
        {PKType} pkValue = ((Number) pkObj).intValue();

        // 委派 Service（可能需要 JOIN 多表取得完整資料）
        Map<String, Object> data = {serviceName}.getById(pkValue);

        log.info("[{MODULE_CODE} 查詢單筆] 成功 - PK: {}, TraceId: {}", pkValue, traceId);

        return buildStandardResponse(traceId, data, "QUERY");
    }
```

## 業務邏輯注意點
- **無 `@Transactional`**: 純查詢操作
- **不存在拋 404**: `findByKey()` 返回 null 時拋 `BusinessException("NOT_FOUND", 404)`
- **回傳單筆 data，非陣列**: 與 Query 的 `records: [...]` 不同，GetById 直接回傳扁平 Map
- **日期格式化**: `DateFormatUtil.formatDateTime()` 格式化 `LocalDateTime`；`DateFormatUtil.formatDate()` 格式化 `LocalDate`
- **審計欄位**: 回傳 `creator`/`createDt`/`updater`/`updateDt` 供前端顯示
- **複雜場景**: header + details 結構 -> 注入 Service 處理，Service 內用原生 SQL JOIN 多表
- **不回傳 entityId**: GetById/Query 不需要
