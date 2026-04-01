---
name: backend-processor-save
applies_to: "*SaveProcessor.java"
---

## 說明
儲存 Processor（Thin 版），負責參數擷取與驗證後委派 Service 執行 Create + Update 合併邏輯。不在此寫業務邏輯。

## 🔧 依規格調整的部分
- **@Named**: `"{routeId}Processor"`（如 `tm002EmpVacationSaveProcessor`）
- **routeId**: getTemplateParams 中的 routeId（如 `tm002EmpVacationSave`）
- **apiDescription**: API 中文描述（如 `儲存員工假別明細`）
- **requiredFields**: 必填欄位清單（如 `empId,details`）
- **@AuditLog entity**: Entity 名稱（如 `TmEmpVacation`）
- **Service 型別與注入名**: 如 `Tm002EmpVacationService empVacationService`
- **payload 取值 key**: 如 `empId`、`details`

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
@Named("tm002EmpVacationSaveProcessor")                        // 🔧 routeId + "Processor"
@RegisterForReflection                                         // 🔒 固定
public class Tm002EmpVacationSaveProcessor extends ApiRouteProcessor { // 🔒 extends ApiRouteProcessor

    @Inject
    Tm002EmpVacationService empVacationService;                // 🔧 Service 注入

    // 🔒 getTemplateParams 格式固定，值從規格填入
    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "tm002EmpVacationSave",             // 🔧
                "apiDescription", "儲存員工假別明細",            // 🔧
                "requiredFields", "empId,details");            // 🔧
    }

    @Override
    protected String getProcessorType() {                      // 🔒 固定
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext                                     // 🔒 固定
    @AuditLog(
            operation = AuditLog.OperationType.CREATE,         // 🔧 CREATE / UPDATE / QUERY
            entity = "TmEmpVacation",                          // 🔧 Entity 名稱
            description = "儲存員工假別明細",                    // 🔧
            logParameters = true,                              // 🔒 Save 固定 true
            logResult = true)                                  // 🔒 Save 固定 true
    public Object process(Exchange exchange,
                          @Body Map<String, Object> payload,
                          @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers); // 🔒 固定
    }

    @Override
    @SuppressWarnings("unchecked")
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        // 🔧 參數擷取 -- key 名稱從規格取得
        Object empIdObj = payload.get("empId");
        if (empIdObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "empId 為必填欄位");
        }
        Integer empId = ((Number) empIdObj).intValue();

        Object detailsObj = payload.get("details");
        if (detailsObj == null || !(detailsObj instanceof List)
                || ((List<?>) detailsObj).isEmpty()) {
            throw new BusinessException("REQUIRED_FIELD", 400, "details 為必填欄位");
        }
        List<Map<String, Object>> details = (List<Map<String, Object>>) detailsObj;

        // 🔒 委派 Service -- 所有業務邏輯在 Service 內
        List<Map<String, Object>> savedRecords =
                empVacationService.saveEmpVacationDetails(empId, details);

        // 🔒 回傳標準格式
        Map<String, Object> data = new HashMap<>();
        data.put("records", savedRecords);
        data.put("entityId", empId);
        return buildStandardResponse(traceId, data);           // 🔒 固定
    }
}
```

## 已知陷阱
1. **Processor 不寫業務邏輯** -- 所有驗證（重複檢查、員工存在性、CLEAR 判斷）都在 Service 內。Processor 只做 payload 取值和必填檢查。
2. **@AuditLog operation** -- Save 用 `CREATE`（因為涵蓋新增），不要用 `UPDATE`。
3. **details 驗證** -- 必須同時檢查 `null`、`not instanceof List`、`isEmpty()` 三種情況。
4. **Number 轉型** -- payload 中的數字必須用 `((Number) obj).intValue()` 轉型，不可直接 cast 為 `Integer`（JSON 反序列化可能產生 Long 或 Double）。
