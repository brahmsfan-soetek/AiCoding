---
name: backend-processor-query
applies_to: "*QueryProcessor.java, *DetailProcessor.java"
---

## 說明
查詢 Processor，依條件查詢資料清單。支援兩種模式：PaginationUtil 分頁查詢 / Service 委派原生 SQL 查詢。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmEmpVacation）
- `{entityDescription}` -- Entity 中文描述（如 員工假別明細）
- `{MODULE_CODE}` -- 大寫底線格式（如 TM002，用於 log 標籤）
- `{routeId}` -- Camel route ID（如 tm002EmpVacationDetail）
- `{apiDescription}` -- API 描述（如 查詢員工假別明細）
- `{requiredFields}` -- 必填欄位清單（如 empId,year）
- `{ServiceName}` -- Service 類別名稱（如 Tm002EmpVacationService）
- `{serviceName}` -- Service 變數名稱（如 empVacationService）

## 模式 1：Service 委派原生 SQL 查詢（TM002 實際模式）

適用於多表 JOIN、跨 Schema 查詢、需要聚合計算的場景。

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
 * {MODULE_CODE} {entityDescription}查詢 Processor
 * <p>
 * 依條件查詢{entityDescription}
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}DetailProcessor extends ApiRouteProcessor {

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

        Integer empId = getRequiredInteger(payload, "empId", "員工ID");
        Integer year = getRequiredInteger(payload, "year", "年度");

        log.debug("[{MODULE_CODE} 明細查詢] empId: {}, year: {}, TraceId: {}", empId, year, traceId);

        // 委派 Service 執行原生 SQL 查詢
        List<Map<String, Object>> records = {serviceName}.queryDetail(empId, year);

        log.info("[{MODULE_CODE} 明細查詢] 完成 - 回傳 {} 筆, TraceId: {}", records.size(), traceId);

        Map<String, Object> data = new HashMap<>();
        data.put("records", records);

        return buildStandardResponse(traceId, data, "QUERY");
    }

    private Integer getRequiredInteger(Map<String, Object> data, String key, String fieldName) {
        Object value = data.get(key);
        if (value == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, fieldName + " 為必填欄位");
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new BusinessException("INVALID_FORMAT", 400, fieldName + " 格式錯誤，必須為整數");
        }
    }
}
```

## Service 層查詢方法參考（TM002 實作）

```java
/**
 * 查詢員工假別明細 -- 多表 JOIN 原生 SQL
 */
public List<Map<String, Object>> queryDetail(Integer empId, int year) {
    String sql = """
            SELECT
                v.EMP_VACATION_ID,
                v.EMP_ID,
                v.VACATION_SUB_ID,
                vds.VACATION_CODE,
                vs.VACATION_NAME,
                vds.VACATION_SUB_CODE,
                vds.VACATION_SUB_NAME,
                v.MAX_HOURS,
                v.USED_HOURS,
                v.UNUSED_HOURS,
                v.CASH_OUT_HOURS,
                v.BEGIN_DATE,
                v.END_DATE,
                v.CLEAR
            FROM EAP.TM_EMP_VACATION v
            INNER JOIN EAP.TM_VACATION_DETAIL_SETTING vds
                ON vds.VACATION_SUB_ID = v.VACATION_SUB_ID
            INNER JOIN EAP.TM_VACATION_SETTING vs
                ON vs.VACATION_CODE = vds.VACATION_CODE
            WHERE v.EMP_ID = :empId
              AND YEAR(v.BEGIN_DATE) = :year
            ORDER BY v.VACATION_SUB_ID
            """;

    Query query = em.createNativeQuery(sql);
    query.setParameter("empId", empId);
    query.setParameter("year", year);

    @SuppressWarnings("unchecked")
    List<Object[]> rows = query.getResultList();

    List<Map<String, Object>> result = new ArrayList<>();
    for (Object[] row : rows) {
        Map<String, Object> record = new HashMap<>();
        record.put("empVacationId", row[0]);
        record.put("empId", row[1]);
        // ... 逐欄位映射 ...
        record.put("beginDate", formatDate(row[11]));
        record.put("endDate", formatDate(row[12]));
        result.add(record);
    }
    return result;
}
```

## 模式 2：PaginationUtil 分頁查詢（標準 CRUD 模式）

適用於單表查詢、前端帶分頁的場景。

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
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.DateFormatUtil;
import org.soetek.foundation.util.LogType;
import org.soetek.foundation.util.PaginationUtil;
import org.soetek.foundation.util.PaginationUtil.PaginationParams;
import org.soetek.foundation.util.PaginationUtil.PaginationResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * {MODULE_CODE} {entityDescription}查詢 Processor（分頁版）
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}QueryProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "{routeId}",
                "apiDescription", "{apiDescription}",
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

        log.debug("[{MODULE_CODE} 查詢] 開始 - TraceId: {}, Payload: {}", traceId, payload);

        // 1. 解析分頁參數
        PaginationParams paginationParams = PaginationUtil.parsePaginationParams(payload);

        // 2. 查詢資料
        List<{EntityName}Entity> entityList = {EntityName}Entity.findAllXxx(payload);

        log.debug("[{MODULE_CODE} 查詢] 查詢結果 - 總筆數: {}, TraceId: {}", entityList.size(), traceId);

        // 3. 轉換為 Map
        List<Map<String, Object>> recordList = entityList.stream()
                .map(this::convertToMap)
                .toList();

        // 4. 分頁
        PaginationResult<Map<String, Object>> result = PaginationUtil.paginate(recordList, paginationParams);

        log.info("[{MODULE_CODE} 查詢] 成功 - TotalCount: {}, CurrentPage: {}, TraceId: {}",
                result.getTotalCount(), result.getCurrentPage(), traceId);

        // 5. 組裝回應（items -> records rename）
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
        // 日期格式化用 DateFormatUtil
        map.put("createDt", DateFormatUtil.formatDateTime(entity.createDt));
        map.put("updateDt", DateFormatUtil.formatDateTime(entity.updateDt));
        return map;
    }
}
```

## 業務邏輯注意點
- **無 `@Transactional`**: Query 是唯讀操作
- **模式選擇**: 單表簡單查詢 -> PaginationUtil 分頁查詢；多表 JOIN / 原生 SQL -> Service 委派查詢
- **回應 key**: PaginationUtil 版需手動將 `items` rename 為 `records`（前端慣例）；Service 委派版直接組裝 `records`
- **日期格式化**: 使用 `DateFormatUtil.formatDateTime()` / `DateFormatUtil.formatDate()`
- **原生 SQL 必須加 Schema Prefix**: `EAP.TABLE` 或 `HRM.TABLE`
- **`getRequiredInteger` helper**: TM002 實作中提供了整數型必填欄位驗證的 helper，支援 Number 和 String 兩種輸入
- **不回傳 entityId**: Query 不需要
