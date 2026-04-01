---
name: backend-processor-batch-validate
applies_to: "*BatchValidateProcessor.java, *ValidateProcessor.java"
---

## 說明
批次驗證 Processor（Thin 版），接收員工帳號清單後委派 Service 逐一驗證（在職/離職/查無），回傳驗證結果供前端批次匯入前預覽。

## 🔧 依規格調整的部分
- **@Named**: `"{routeId}Processor"`（如 `tm002BatchValidateProcessor`）
- **routeId**: getTemplateParams 中的 routeId（如 `tm002BatchValidate`）
- **apiDescription**: API 中文描述（如 `批次匯入員工驗證`）
- **requiredFields**: 必填欄位清單（如 `empAccounts`）
- **@AuditLog entity**: 驗證對象 Entity（如 `PmEmployee`）
- **Service 型別與注入名**: 如 `Tm002EmpVacationService empVacationService`
- **payload 取值 key**: 如 `empAccounts`

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
@Named("tm002BatchValidateProcessor")                          // 🔧 routeId + "Processor"
@RegisterForReflection                                         // 🔒 固定
public class Tm002BatchValidateProcessor extends ApiRouteProcessor { // 🔒 extends ApiRouteProcessor

    @Inject
    Tm002EmpVacationService empVacationService;                // 🔧 Service 注入

    // 🔒 getTemplateParams 格式固定，值從規格填入
    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "tm002BatchValidate",               // 🔧
                "apiDescription", "批次匯入員工驗證",            // 🔧
                "requiredFields", "empAccounts");              // 🔧
    }

    @Override
    protected String getProcessorType() {                      // 🔒 固定
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext                                     // 🔒 固定
    @AuditLog(
            operation = AuditLog.OperationType.QUERY,          // 🔒 驗證本質是查詢
            entity = "PmEmployee",                             // 🔧 驗證對象
            description = "批次匯入員工驗證",                    // 🔧
            logParameters = true,                              // 🔒 固定
            logResult = true)                                  // 🔒 固定
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

        // 🔧 取清單參數 -- key 名稱從規格取得
        Object accountsObj = payload.get("empAccounts");
        if (accountsObj == null || !(accountsObj instanceof List)
                || ((List<?>) accountsObj).isEmpty()) {
            throw new BusinessException("REQUIRED_FIELD", 400,
                    "empAccounts 為必填欄位");
        }
        List<String> empAccounts = (List<String>) accountsObj;

        // 🔒 委派 Service
        List<Map<String, Object>> results =
                empVacationService.validateEmployees(empAccounts);

        // 🔒 回傳標準格式
        Map<String, Object> data = new HashMap<>();
        data.put("results", results);
        return buildStandardResponse(traceId, data);           // 🔒 固定
    }
}
```

## 已知陷阱
1. **三態驗證在 Service** -- 在職/已離職/查無此員工的判斷邏輯在 Service.validateEmployees() 內，Processor 不處理。
2. **List 驗證三重檢查** -- 必須同時檢查 `null`、`not instanceof List`、`isEmpty()`。JSON 反序列化時 empAccounts 可能是各種型別。
3. **@AuditLog entity** -- 驗證的對象是 `PmEmployee`，不是功能主 Entity。
4. **#15 LEAVE_DATE 判斷離職** -- Service 內用 `LEAVE_DATE IS NOT NULL` 判斷離職，不要用 `ASSUME_DATE` 或 `HIRE_DATE`。
