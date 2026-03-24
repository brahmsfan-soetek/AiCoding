# Backend: Delete Processor 模板

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/processor/GlCurrencyDeleteProcessor.java

package org.soetek.serp.gl.processor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Named;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.foundation.annotation.AuditLog;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.util.JsonUtil;
import org.soetek.serp.gl.domain.GlCurrencyEntity;

import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("glCurrencyDeleteProcessor")
public class GlCurrencyDeleteProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "glCurrencyDelete",
            "apiDescription", "刪除幣別",
            "requiredFields", "currencyCode");
    }

    @Override
    protected String getProcessorType() {
        return "BIZ_GL_CURRENCY";
    }

    @Override
    @ActivateRequestContext
    @Transactional
    @AuditLog(operation = AuditLog.OperationType.DELETE,
              entity = "GlCurrency",
              description = "刪除幣別")
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

        // 1. 驗證必要參數（主鍵）
        validateRequiredFields(payload, "currencyCode");

        String currencyCode = JsonUtil.getStringFromMap(payload, "currencyCode");

        // 2. 刪除（Entity 內部驗證存在性，不存在拋 404）
        GlCurrencyEntity.deleteCurrency(currencyCode);

        // 3. 回應
        Map<String, Object> data = Map.of("currencyCode", currencyCode);
        return buildStandardResponse(traceId, data, currencyCode);
    }
}
```

**結構要點**：
- **最簡潔的 Processor 類型** — 驗證 → 刪除 → 回應，三步完成
- `@Transactional` — 寫入操作必須
- **存在性驗證委託 Entity** — `Entity.deleteXxx()` 內部驗證，不存在拋 BusinessException 404
- **(可選) 業務規則檢查** — 部分場景需刪除前檢查（如有子表引用則不可刪），在步驟 1 和 2 之間加入
- 回應只需回傳已刪除的主鍵
