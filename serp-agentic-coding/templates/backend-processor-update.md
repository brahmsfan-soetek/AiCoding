# Backend: Update Processor 模板

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/processor/GlCurrencyUpdateProcessor.java

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
import java.util.Optional;

@Slf4j
@ApplicationScoped
@Named("glCurrencyUpdateProcessor")
public class GlCurrencyUpdateProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "glCurrencyUpdate",
            "apiDescription", "更新幣別",
            "requiredFields", "currencyCode,currencyName,decimalPlaces");
    }

    @Override
    protected String getProcessorType() {
        return "BIZ_GL_CURRENCY";
    }

    @Override
    @ActivateRequestContext
    @Transactional
    @AuditLog(operation = AuditLog.OperationType.UPDATE,
              entity = "GlCurrency",
              description = "更新幣別")
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

        // 1. 驗證必要參數（含主鍵）
        validateRequiredFields(payload, "currencyCode,currencyName,decimalPlaces");

        String currencyCode = JsonUtil.getStringFromMap(payload, "currencyCode");
        String userId = getUserId(exchange, payload, headers);

        // 2. 查詢實體是否存在
        GlCurrencyEntity entity = GlCurrencyEntity.findById(currencyCode);
        if (entity == null) {
            throw new BusinessException("GL_CURRENCY_NOT_FOUND", 404);
        }

        // 3. (可選) 額外業務驗證 / 排除自身的重複檢查

        // 4. 更新（委託 Entity 靜態方法，或直接設定欄位）
        GlCurrencyEntity updated = GlCurrencyEntity.updateCurrency(currencyCode, payload, userId);

        // 5. 回應（使用 Entity.toMap() 作為基礎）
        Map<String, Object> data = Map.of("currencyCode", updated.currencyCode);
        return buildStandardResponse(traceId, data, updated.currencyCode);
    }
}
```

**結構要點**：
- 與 Create 結構相同，差異僅在 `@AuditLog` operation 和 `processBusinessLogic()` 內容
- `@Transactional` — 寫入操作必須
- **必填欄位含主鍵** — Update 比 Create 多了主鍵驗證
- **查詢存在性** — 不存在拋 404，Create 則不需要此步
- **排除自身的重複檢查** — 如 `findDuplicateRule(companyCode, ..., excludeId)` 排除自己
- 委託 Entity 靜態方法更新（`Entity.updateXxx(id, payload, userId)`），不在 Processor 逐一設定欄位
