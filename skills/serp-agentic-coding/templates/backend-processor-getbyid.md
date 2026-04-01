# Backend: GetById Processor 模板

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/processor/GlCurrencyGetByIdProcessor.java

package org.soetek.serp.gl.processor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.foundation.annotation.AuditLog;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.util.JsonUtil;
import org.soetek.serp.gl.domain.GlCurrencyEntity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("glCurrencyGetByIdProcessor")
public class GlCurrencyGetByIdProcessor extends ApiRouteProcessor {

    @Inject
    EntityManager em;

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "glCurrencyGetById",
            "apiDescription", "查詢單筆幣別",
            "requiredFields", "currencyCode");
    }

    @Override
    protected String getProcessorType() {
        return "BIZ_GL_CURRENCY";
    }

    @Override
    @ActivateRequestContext
    @AuditLog(operation = AuditLog.OperationType.QUERY,
              entity = "GlCurrency",
              description = "查詢單筆幣別")
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

        // 2. 查詢單筆
        GlCurrencyEntity entity = GlCurrencyEntity.findById(currencyCode);
        if (entity == null) {
            throw new BusinessException("GL_CURRENCY_NOT_FOUND", 404);
        }

        // 3. 轉換為 Map（使用 Entity.toMap()）
        Map<String, Object> data = GlCurrencyEntity.toMap(entity);

        // 4. (可選) 加入顯示欄位（lookup map 批次查詢）
        // Map<String, String> lookupMap = buildLookupMap("SOME_TYPE");
        // addDisplayFields(data, lookupMap);

        // 5. 回應（單筆 data，非陣列）
        return buildStandardResponse(traceId, data, currencyCode);
    }

    // ========== Lookup 顯示欄位（按需使用）==========

    /**
     * 從 AU_DATA_PROFILE 建立 code → name 對應 Map
     */
    private Map<String, String> buildLookupMap(String pfType) {
        @SuppressWarnings("unchecked")
        List<Object[]> results = em.createNativeQuery(
                "SELECT PF_CODE, PF_VALUE FROM AU_DATA_PROFILE WHERE PF_TYPE = ?1")
                .setParameter(1, pfType)
                .getResultList();
        Map<String, String> map = new HashMap<>();
        for (Object[] row : results) {
            map.put((String) row[0], (String) row[1]);
        }
        return map;
    }

    /**
     * 加入顯示欄位：code → "code(name)" 格式
     */
    private String formatDisplay(String code, Map<String, String> lookupMap) {
        if (code == null) return null;
        String name = lookupMap.get(code);
        return name != null ? code + "(" + name + ")" : code;
    }
}
```

**結構要點**：
- **無 `@Transactional`** — 純查詢
- **回傳單筆 Map，非陣列** — 與 Query 的 `records: [...]` 不同
- **不存在拋 404** — `findById` 查無資料 → BusinessException
- **Lookup 顯示欄位** — 查 AU_DATA_PROFILE 建立 code→name 對應，加入 `xxxDisplay` 欄位
  - 格式：`"code(name)"`（如 `"TWD(新台幣)"`）
  - 批次建 map 後逐欄位套用，避免 N+1 查詢
- **與 Query 的差異**：
  - Query：多筆 + 分頁 + `records` 陣列
  - GetById：單筆 + 不分頁 + 直接回傳 data Map
