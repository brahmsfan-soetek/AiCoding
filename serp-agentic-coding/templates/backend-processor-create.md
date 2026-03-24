# Backend: Create Processor 模板

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/processor/GlCurrencyCreateProcessor.java

package org.soetek.serp.gl.processor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Exchange;
import org.apache.camel.component.bean.BeanConstants;
import org.soetek.foundation.annotation.AuditLog;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.util.JsonUtil;
import org.soetek.serp.gl.domain.GlCurrencyEntity;

import io.quarkus.narayana.jta.runtime.TransactionConfiguration;
import jakarta.transaction.Transactional;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("glCurrencyCreateProcessor")
public class GlCurrencyCreateProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "glCurrencyCreate",
            "apiDescription", "新增幣別",
            "requiredFields", "currencyCode,currencyName,decimalPlaces");
    }

    @Override
    protected String getProcessorType() {
        return "BIZ_GL_CURRENCY";
    }

    @Override
    @ActivateRequestContext
    @Transactional
    @AuditLog(operation = AuditLog.OperationType.CREATE,
              entity = "GlCurrency",
              description = "新增幣別")
    public Object process(Exchange exchange,
                          @Body Map<String, Object> payload,
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

        String currencyCode = (String) payload.get("currencyCode");

        // 1. 驗證唯一性
        if (GlCurrencyEntity.isDuplicate(currencyCode)) {
            throw new BusinessException("GL_CURRENCY_ALREADY_EXISTS", 409);
        }

        // 2. 建立 Entity
        GlCurrencyEntity entity = new GlCurrencyEntity();
        entity.currencyCode = currencyCode;
        entity.currencyName = (String) payload.get("currencyName");
        entity.decimalPlaces = JsonUtil.getInteger(payload, "decimalPlaces", 2);
        entity.isActive = JsonUtil.getString(payload, "isActive", "Y");

        // 3. 持久化
        entity.persist();

        // 4. 回應（使用 Entity.toMap() 作為基礎）
        return buildStandardResponse(traceId,
            GlCurrencyEntity.toMap(entity), "新增成功");
    }
}
```

**結構要點**：
- `extends ApiRouteProcessor`（**不是** implements Processor）
- `@Named("{routeId}Processor")` — API URL = `/api/glCurrencyCreate`
- `getTemplateParams()` 定義路由參數
- `processBusinessLogic()` 放實際邏輯
- 用 `Entity.toMap()` 建回應，**不在 Processor 寫 convertToResponseMap()**
- `BusinessException` 統一錯誤處理

> Update / Delete Processor 結構相同，差異僅在 `@AuditLog` operation 和 `processBusinessLogic()` 內容。
