---
name: backend-processor-delete
applies_to: "*DeleteProcessor.java"
---

## 說明
刪除 Processor（Thin 版），接收主鍵後委派 Service 執行硬刪除。Service 內含業務規則檢查（如結算列不可刪除）。

## 🔧 依規格調整的部分
- **@Named**: `"{routeId}Processor"`（如 `tm002EmpVacationDeleteProcessor`）
- **routeId**: getTemplateParams 中的 routeId（如 `tm002EmpVacationDelete`）
- **apiDescription**: API 中文描述（如 `刪除員工假別明細`）
- **requiredFields**: 必填欄位清單（如 `empVacationId`）
- **@AuditLog entity**: Entity 名稱（如 `TmEmpVacation`）
- **Service 型別與注入名**: 如 `Tm002EmpVacationService empVacationService`
- **pkField**: 主鍵欄位名（如 `empVacationId`）
- **Service 方法名**: 如 `deleteEmpVacation`

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
import java.util.Map;

@Slf4j                                                         // 🔒 固定
@ApplicationScoped                                             // 🔒 固定
@Named("tm002EmpVacationDeleteProcessor")                      // 🔧 routeId + "Processor"
@RegisterForReflection                                         // 🔒 固定
public class Tm002EmpVacationDeleteProcessor extends ApiRouteProcessor { // 🔒 extends ApiRouteProcessor

    @Inject
    Tm002EmpVacationService empVacationService;                // 🔧 Service 注入

    // 🔒 getTemplateParams 格式固定，值從規格填入
    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "tm002EmpVacationDelete",           // 🔧
                "apiDescription", "刪除員工假別明細",            // 🔧
                "requiredFields", "empVacationId");            // 🔧
    }

    @Override
    protected String getProcessorType() {                      // 🔒 固定
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext                                     // 🔒 固定
    @AuditLog(
            operation = AuditLog.OperationType.DELETE,          // 🔒 Delete 固定
            entity = "TmEmpVacation",                          // 🔧 Entity 名稱
            description = "刪除員工假別明細",                    // 🔧
            logParameters = true,                              // 🔒 固定
            logResult = false)                                 // 🔒 Delete 固定 false
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

        // 🔧 取主鍵值 -- key 名稱從規格取得
        Object idObj = payload.get("empVacationId");
        if (idObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400,
                    "empVacationId 為必填欄位");
        }
        Integer empVacationId = ((Number) idObj).intValue();

        // 🔒 委派 Service -- 業務規則檢查（如 CLEAR 不可刪除）在 Service 內
        empVacationService.deleteEmpVacation(empVacationId);

        // 🔒 回傳標準格式
        Map<String, Object> data = new HashMap<>();
        data.put("empVacationId", empVacationId);
        data.put("entityId", empVacationId);
        return buildStandardResponse(traceId, data);           // 🔒 固定
    }
}
```

## 已知陷阱
1. **@AuditLog logResult = false** -- Delete 操作不記錄回傳結果，固定 `logResult = false`。
2. **業務規則在 Service** -- 結算列不可刪除（`CLEAR = true`）的檢查在 Service.deleteXxx() 內，Processor 不重複檢查。
3. **硬刪除** -- 使用 `entity.delete()` + `em.flush()`，不是軟刪除（更新狀態欄位）。若規格要求軟刪除，需改 Service 實作。
4. **Number 轉型** -- 主鍵值必須用 `((Number) idObj).intValue()`，不可直接 cast `Integer`。
