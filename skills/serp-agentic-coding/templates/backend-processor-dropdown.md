# Backend: Dropdown Processor 模板

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/processor/Gl004DropdownProcessor.java

package org.soetek.serp.gl.processor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.foundation.annotation.AuditLog;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.util.JsonUtil;
import org.soetek.authorize.service.DataProfileService;
import org.soetek.serp.gl.domain.GlCurrencyEntity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ApplicationScoped
@Named("gl004DropdownProcessor")
public class Gl004DropdownProcessor extends ApiRouteProcessor {

    @Inject
    DataProfileService dataProfileService;

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "gl004Dropdown",
            "apiDescription", "查詢下拉選單",
            "requiredFields", "dropdownType");
    }

    @Override
    protected String getProcessorType() {
        return "BIZ_GL_ACCOUNT_COMPANY";
    }

    @Override
    @ActivateRequestContext
    @AuditLog(operation = AuditLog.OperationType.QUERY,
              entity = "GlAccountCompany",
              description = "查詢下拉選單")
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

        // 1. 驗證必要參數
        validateRequiredFields(payload, "dropdownType");

        String dropdownType = JsonUtil.getStringFromMap(payload, "dropdownType");
        String roleCode = getRoleCode(exchange, payload, headers);

        // 2. 根據類型分派查詢
        List<Map<String, Object>> items;

        switch (dropdownType) {
            case "currencyList":
                items = getCurrencyList();
                break;

            case "accountTypeList":
                // DataProfileService 查 AU_DATA_PROFILE
                items = dataProfileService.getDropdownOptions(
                    "GL004", "accountTypeList", roleCode);
                break;

            case "chartCodeList":
                items = getChartCodeList();
                break;

            default:
                throw new BusinessException("GL_PARAM_DROPDOWN_TYPE_UNSUPPORTED", 400)
                        .addParam("dropdownType", dropdownType);
        }

        // 3. 組裝回應（統一 items + totalCount）
        Map<String, Object> data = Map.of(
            "items", items,
            "totalCount", items.size());

        return buildStandardResponse(traceId, data, dropdownType);
    }

    // ========== 各類型的 private 查詢方法 ==========

    private List<Map<String, Object>> getCurrencyList() {
        List<GlCurrencyEntity> entities = GlCurrencyEntity.findActiveCurrencies();
        List<Map<String, Object>> options = new ArrayList<>();
        for (GlCurrencyEntity e : entities) {
            Map<String, Object> option = new HashMap<>();
            option.put("value", e.currencyCode);
            option.put("label", e.currencyName);
            option.put("displayLabel", e.currencyCode + " - " + e.currencyName);
            options.add(option);
        }
        return options;
    }

    private List<Map<String, Object>> getChartCodeList() {
        @SuppressWarnings("unchecked")
        List<String> codes = (List<String>) GlCurrencyEntity.getEntityManager()
            .createQuery("SELECT DISTINCT a.chartCode FROM GlAccountEntity a ORDER BY a.chartCode")
            .getResultList();

        List<Map<String, Object>> options = new ArrayList<>();
        for (String code : codes) {
            Map<String, Object> option = new HashMap<>();
            option.put("value", code);
            option.put("label", code);
            option.put("displayLabel", code);
            options.add(option);
        }
        return options;
    }
}
```

**結構要點**：
- **無 `@Transactional`** — 純查詢，不寫入
- **`dropdownType` switch 分派** — 骨架 100% 一致，只有 case 內容不同
- **回應格式統一 `{items, totalCount}`** — 不是 `records`（與 Query 不同）
- 每個 dropdown item 標準格式：`{value, label, displayLabel}`
- **三種資料來源**：
  1. Entity 查詢（如 `findActiveCurrencies()`）
  2. `DataProfileService`（查 AU_DATA_PROFILE 權限控制的選項）
  3. JPQL / NativeSqlService（跨表取 code + name）
- 某些 case 可能需要額外參數（如 `chartCode`），在 switch 內驗證
