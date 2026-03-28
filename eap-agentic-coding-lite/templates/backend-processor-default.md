---
name: backend-processor-default
applies_to: "*DefaultProcessor.java, *Default*Processor.java"
---

## 說明
「執行預設」Processor（Thin 版），無需參數即可載入預設資料（如下拉選單的預設選項、預設假別清單等）。委派 Service 執行查詢並回傳結果。

## 🔧 依規格調整的部分
- **@Named**: `"{routeId}Processor"`（如 `tm002DefaultVacationProcessor`）
- **routeId**: getTemplateParams 中的 routeId（如 `tm002DefaultVacation`）
- **apiDescription**: API 中文描述（如 `執行預設（病假載入）`）
- **requiredFields**: 通常為空字串 `""`（執行預設不需要參數）
- **@AuditLog entity**: 查詢的目標 Entity（如 `TmVacationDetailSetting`）
- **Service 型別與注入名**: 如 `Tm002EmpVacationService empVacationService`
- **Service 方法名**: 如 `getDefaultVacation`

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
import org.soetek.foundation.processor.ApiRouteProcessor;       // 🔒 固定
import org.soetek.foundation.util.LogType;                      // 🔒 固定

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j                                                         // 🔒 固定
@ApplicationScoped                                             // 🔒 固定
@Named("tm002DefaultVacationProcessor")                        // 🔧 routeId + "Processor"
@RegisterForReflection                                         // 🔒 固定
public class Tm002DefaultVacationProcessor extends ApiRouteProcessor { // 🔒 extends ApiRouteProcessor

    @Inject
    Tm002EmpVacationService empVacationService;                // 🔧 Service 注入

    // 🔒 getTemplateParams 格式固定，值從規格填入
    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "tm002DefaultVacation",             // 🔧
                "apiDescription", "執行預設（病假載入）",        // 🔧
                "requiredFields", "");                         // 🔧 執行預設通常無必填
    }

    @Override
    protected String getProcessorType() {                      // 🔒 固定
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext                                     // 🔒 固定
    @AuditLog(
            operation = AuditLog.OperationType.QUERY,          // 🔒 查詢固定 QUERY
            entity = "TmVacationDetailSetting",                // 🔧 查詢的目標 Entity
            description = "執行預設（病假載入）",                // 🔧
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

        // 🔒 委派 Service -- 無需從 payload 取參數
        List<Map<String, Object>> records =
                empVacationService.getDefaultVacation();        // 🔧 Service 方法名

        // 🔒 回傳標準格式
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        return buildStandardResponse(traceId, data);           // 🔒 固定
    }
}
```

## 已知陷阱
1. **requiredFields 空字串** -- 執行預設通常不需要前端傳參數，`requiredFields` 填 `""`。不要填 `null`，Map.of 不接受 null value。
2. **@AuditLog entity 是查詢目標** -- 不一定是主 Entity。如 TM002 的執行預設查的是 `TmVacationDetailSetting`，不是 `TmEmpVacation`。
3. **processBusinessLogic 最簡形式** -- 這是所有 Processor 中最簡單的，只有「呼叫 Service + 包裝回傳」兩步。
