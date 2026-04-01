---
name: backend-processor-detail
applies_to: "*DetailProcessor.java"
---

## 說明
明細查詢 Processor（Thin 版），接收查詢條件後委派 Service 執行多表 JOIN 查詢並回傳明細列表。

## 🔧 依規格調整的部分
- **@Named**: `"{routeId}Processor"`（如 `tm002EmpVacationDetailProcessor`）
- **routeId**: getTemplateParams 中的 routeId（如 `tm002EmpVacationDetail`）
- **apiDescription**: API 中文描述（如 `查詢員工假別明細`）
- **requiredFields**: 必填欄位清單（如 `empId,year`）
- **@AuditLog entity**: Entity 名稱（如 `TmEmpVacation`）
- **Service 型別與注入名**: 如 `Tm002EmpVacationService empVacationService`
- **查詢參數**: payload 取值的 key 名稱與型別（如 empId: Integer, year: Integer）

## 完整參考實作
```java
package org.soetek.eap.tm.processor;                           // 🔧 {module}

import io.quarkus.runtime.annotations.RegisterForReflection;   // 🔒 固定
import jakarta.enterprise.context.ApplicationScoped;            // 🔒 固定
import jakarta.enterprise.context.control.ActivateRequestContext; // 🔒 固定
import jakarta.inject.Inject;                                   // 🔒 固定
import jakarta.inject.Named;                                    // 🔒 固定
import lombok.extern.slf4j.Slf4j;                              // 🔒 固定
import org.apache.camel.Body;                                   // 🔒 固定
import org.apache.camel.Exchange;                               // 🔒 固定
import org.apache.camel.Headers;                                // 🔒 固定
import org.soetek.eap.tm.service.Tm002EmpVacationService;      // 🔧 Service import
import org.soetek.foundation.config.annotation.AuditLog;        // 🔒 固定
import org.soetek.foundation.exception.BusinessException;       // 🔒 固定
import org.soetek.foundation.processor.ApiRouteProcessor;       // 🔒 固定
import org.soetek.foundation.util.LogType;                      // 🔒 固定

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j                                                         // 🔒 固定
@ApplicationScoped                                             // 🔒 固定
@Named("tm002EmpVacationDetailProcessor")                      // 🔧 routeId + "Processor"
@RegisterForReflection                                         // 🔒 固定
public class Tm002EmpVacationDetailProcessor extends ApiRouteProcessor { // 🔒 extends ApiRouteProcessor

    @Inject
    Tm002EmpVacationService empVacationService;                // 🔧 Service 注入

    // 🔒 getTemplateParams 格式固定，值從規格填入
    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "tm002EmpVacationDetail",           // 🔧
                "apiDescription", "查詢員工假別明細",            // 🔧
                "requiredFields", "empId,year");               // 🔧
    }

    @Override
    protected String getProcessorType() {                      // 🔒 固定
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext                                     // 🔒 固定
    @AuditLog(
            operation = AuditLog.OperationType.QUERY,          // 🔒 查詢固定 QUERY
            entity = "TmEmpVacation",                          // 🔧 Entity 名稱
            description = "查詢員工假別明細",                    // 🔧
            logParameters = true,                              // 🔒 固定
            logResult = true)                                  // 🔒 Query 固定 true
    public Object process(Exchange exchange,
                          @Body Map<String, Object> payload,
                          @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers); // 🔒 固定
    }

    @Override
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        // 🔧 參數擷取 -- key 名稱從規格取得
        Integer empId = getRequiredInteger(payload, "empId", "員工ID");
        Integer year = getRequiredInteger(payload, "year", "年度");

        // 🔒 委派 Service
        List<Map<String, Object>> records =
                empVacationService.queryEmpVacationDetail(empId, year);

        // 🔒 回傳標準格式
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        return buildStandardResponse(traceId, data);           // 🔒 固定
    }

    // 🔒 整數型必填參數擷取工具方法 -- 支援 Number 和 String 兩種輸入
    private Integer getRequiredInteger(Map<String, Object> data,
                                       String key, String fieldName) {
        Object value = data.get(key);
        if (value == null) {
            throw new BusinessException("REQUIRED_FIELD", 400,
                    fieldName + " 為必填欄位");
        }
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new BusinessException("INVALID_FORMAT", 400,
                    fieldName + " 格式錯誤，必須為整數");
        }
    }
}
```

## 已知陷阱
1. **getRequiredInteger 必須支援 String** -- 前端可能傳字串型數字（如 `"2024"`），必須用 `Integer.parseInt` 兜底，不可只處理 Number。
2. **QUERY 類 Processor 不加 @Transactional** -- 查詢不需要交易，@Transactional 只加在 Service 的寫入方法上。
3. **records 回傳** -- 查詢結果統一放在 `data.put("records", ...)` 中，前端依此 key 取值。
