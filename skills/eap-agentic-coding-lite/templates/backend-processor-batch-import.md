---
name: backend-processor-batch-import
applies_to: "*BatchImportProcessor.java, *ImportProcessor.java"
---

## 說明
批次匯入 Processor（Thin 版），接收員工ID清單與假別設定後委派 Service 批次建立額度。已有記錄的員工 skip 不報錯，回傳建立筆數與跳過清單。

## 🔧 依規格調整的部分
- **@Named**: `"{routeId}Processor"`（如 `tm002BatchImportProcessor`）
- **routeId**: getTemplateParams 中的 routeId（如 `tm002BatchImport`）
- **apiDescription**: API 中文描述（如 `批次匯入建立假別額度`）
- **requiredFields**: 必填欄位清單（如 `empIds,vacationSubId,maxHours,beginDate,endDate`）
- **@AuditLog entity**: Entity 名稱（如 `TmEmpVacation`）
- **Service 型別與注入名**: 如 `Tm002EmpVacationService empVacationService`

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
@Named("tm002BatchImportProcessor")                            // 🔧 routeId + "Processor"
@RegisterForReflection                                         // 🔒 固定
public class Tm002BatchImportProcessor extends ApiRouteProcessor { // 🔒 extends ApiRouteProcessor

    @Inject
    Tm002EmpVacationService empVacationService;                // 🔧 Service 注入

    // 🔒 getTemplateParams 格式固定，值從規格填入
    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "tm002BatchImport",                 // 🔧
                "apiDescription", "批次匯入建立假別額度",        // 🔧
                "requiredFields",                              // 🔧
                "empIds,vacationSubId,maxHours,beginDate,endDate");
    }

    @Override
    protected String getProcessorType() {                      // 🔒 固定
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext                                     // 🔒 固定
    @AuditLog(
            operation = AuditLog.OperationType.CREATE,         // 🔒 匯入 = 批次建立
            entity = "TmEmpVacation",                          // 🔧 Entity 名稱
            description = "批次匯入建立假別額度",                // 🔧
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

        // 🔒 直接將整個 payload 委派 Service -- 必填驗證在 Service 內
        Map<String, Object> importResult =
                empVacationService.batchImport(payload);        // 🔧 Service 方法名

        // 🔒 回傳格式：將 Service 回傳的統計合併進 data
        Map<String, Object> data = new HashMap<>(importResult);
        data.put("entityId", "batch");
        return buildStandardResponse(traceId, data);           // 🔒 固定
    }
}
```

## 已知陷阱
1. **必填驗證在 Service** -- 批次匯入的必填欄位較多（empIds, vacationSubId, maxHours, beginDate, endDate），驗證全部在 Service.batchImport() 內集中處理，Processor 不重複驗證。
2. **payload 直接傳** -- 不像 Save Processor 需要拆解 payload，BatchImport 直接把整個 payload 傳給 Service，由 Service 自行取值。
3. **skip 不報錯** -- Service 內對已有記錄的員工做 skip 並加入 skippedEmpIds，不拋 BusinessException。這與單筆新增的行為不同。
4. **entityId = "batch"** -- 批次操作無單一 entityId，統一用字串 `"batch"` 標記。
5. **@AuditLog operation = CREATE** -- 批次匯入本質是批次新增，用 CREATE 不用 UPDATE。
