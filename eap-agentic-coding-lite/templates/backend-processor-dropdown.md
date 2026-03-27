---
name: backend-processor-dropdown
applies_to: "*DropdownProcessor.java, *DefaultVacationProcessor.java"
---

## 說明
下拉選單 / 預設資料載入 Processor。優先使用 LOV YAML 配置，僅在需要複雜業務邏輯時才寫獨立 Processor。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmVacationDetailSetting）
- `{entityDescription}` -- Entity 中文描述（如 預設假別設定）
- `{MODULE_CODE}` -- 大寫底線格式（如 TM002，用於 log 標籤）
- `{routeId}` -- Camel route ID（如 tm002DefaultVacation）
- `{apiDescription}` -- API 描述（如 執行預設（病假載入））
- `{ServiceName}` -- Service 類別名稱（如 Tm002EmpVacationService）
- `{serviceName}` -- Service 變數名稱（如 empVacationService）

## 方式 1：LOV YAML 配置（推薦，不需要寫 Processor）

### YAML 範例

```yaml
# backend/{module}/src/main/resources/sql/{moduleCode}-lov.yml
#
# 原生 SQL 必須明確指定 Schema prefix

Lov:
  # 公司下拉選單
  companyList: |
    SELECT
      COMPANY_CODE AS value,
      FULL_NAME AS label
    FROM EAP.COMPANY
    WHERE IS_ACTIVE = 'Y'
    ORDER BY COMPANY_CODE

  # 帶額外欄位的下拉選單
  userList: |
    SELECT
      USER_ACCOUNT AS value,
      DISP_NAME AS label,
      EMAIL AS email
    FROM HRM.AU_USER
    WHERE IS_ACTIVE = 'Y'
    ORDER BY DISP_NAME
```

### 必要欄位

| 欄位別名 | 必填 | 說明 |
|----------|------|------|
| `value` | Y | 實際提交值（ID 或 code） |
| `label` | Y | 顯示文字 |
| 其他欄位 | N | 額外業務欄位，前端可直接使用 |

> 前端自動產生 `displayLabel = value + " - " + label`

### SqlProvider SPI 範例（每個模組建立一次）

```java
package org.soetek.eap.{module}.config;

import jakarta.enterprise.context.ApplicationScoped;
import org.soetek.foundation.lov.SqlProvider;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.Map;

@ApplicationScoped
public class {ModuleCode}SqlProvider implements SqlProvider {

    private final Map<String, String> sqlMap;

    public {ModuleCode}SqlProvider() {
        Yaml yaml = new Yaml();
        InputStream is = getClass().getClassLoader()
                .getResourceAsStream("sql/{moduleCode}-lov.yml");
        Map<String, Map<String, String>> root = yaml.load(is);
        this.sqlMap = root.get("Lov");
    }

    @Override
    public String getSql(String lovType) {
        return sqlMap.get(lovType);
    }
}
```

> 建立後，前端呼叫 `POST /api/lov { lovType: "companyList" }` 即可取得資料。

---

## 方式 2：獨立 Processor（TM002 實際模式 -- 適用於複雜場景）

僅在以下場景才需要寫獨立 Processor：
- 需要複雜業務邏輯（如依據當前用戶權限過濾）
- 需要跨多表 JOIN + 計算
- LOV YAML 無法表達的動態邏輯
- 需要特殊的業務規則處理（如 TM002 的病假預設載入，需篩選有效日期範圍）

```java
package org.soetek.eap.{module}.processor;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{module}.service.{ServiceName};
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.LogType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * {MODULE_CODE} {apiDescription} Processor
 * <p>
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}DropdownProcessor extends ApiRouteProcessor {

    @Inject
    {ServiceName} {serviceName};

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "{routeId}",
                "apiDescription", "{apiDescription}",
                "requiredFields", "");
    }

    @Override
    protected String getProcessorType() {
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext
    @AuditLog(
            operation = AuditLog.OperationType.QUERY,
            entity = "{EntityName}",
            description = "{apiDescription}",
            logParameters = false,      // 下拉選單頻繁呼叫，不記錄
            logResult = false
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
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

        log.debug("[{MODULE_CODE} {apiDescription}] 開始 - TraceId: {}", traceId);

        // 委派 Service 執行查詢
        List<Map<String, Object>> records = {serviceName}.getDefaultData();

        log.info("[{MODULE_CODE} {apiDescription}] 完成 - 回傳 {} 筆, TraceId: {}", records.size(), traceId);

        Map<String, Object> data = new HashMap<>();
        data.put("records", records);

        return buildStandardResponse(traceId, data, "QUERY");
    }
}
```

## Service 層查詢方法參考（TM002 實作 -- 病假預設載入）

```java
/**
 * 執行預設 -- 查詢病假設定資料
 * 業務規則：僅回傳病假 1 筆（有效且日期在範圍內）
 */
public List<Map<String, Object>> getDefaultVacation() {
    String sql = """
            SELECT A.VACATION_CODE, A.VACATION_NAME,
                   B.VACATION_SUB_CODE, B.VACATION_SUB_NAME,
                   B.VACATION_SUB_ID,
                   B.MIN_HOURS, B.MAX_HOURS
              FROM EAP.TM_VACATION_SETTING A
              JOIN EAP.TM_VACATION_DETAIL_SETTING B
                ON A.VACATION_CODE = B.VACATION_CODE
             WHERE A.VACATION_NAME = NCHAR(30149) + NCHAR(20551)
               AND GETDATE() BETWEEN B.BEGIN_DATE
                   AND ISNULL(B.END_DATE, CAST('2099-12-31' AS DATE))
               AND B.IS_EFFECTIVE = 1
            """;

    Query query = em.createNativeQuery(sql);
    @SuppressWarnings("unchecked")
    List<Object[]> rows = query.getResultList();

    List<Map<String, Object>> result = new ArrayList<>();
    for (Object[] row : rows) {
        Map<String, Object> record = new HashMap<>();
        record.put("vacationCode", row[0]);
        record.put("vacationName", row[1]);
        record.put("vacationSubCode", row[2]);
        record.put("vacationSubName", row[3]);
        record.put("vacationSubId", row[4]);
        record.put("minHours", row[5]);
        record.put("maxHours", row[6]);
        result.add(record);
    }
    return result;
}
```

## 決策指引

```
需要下拉選單資料？
 |- 純 SQL 可解決 -> LOV YAML（推薦）
 |- 需要業務邏輯 -> 獨立 Processor + Service
```

## 業務邏輯注意點
- **`@AuditLog` logParameters/logResult = false**: 下拉選單頻繁呼叫，不記錄參數和結果以降低日誌量
- **LOV YAML 優先**: 簡單的 value/label 下拉選單直接用 YAML 配置，不寫 Processor
- **原生 SQL 加 Schema**: LOV YAML 和 Service 中的 SQL 都必須加 Schema prefix（`EAP.TABLE`）
- **NCHAR 處理中文**: MSSQL 原生 SQL 中的中文字串建議用 `NCHAR()` 避免編碼問題（如 TM002 的 `NCHAR(30149) + NCHAR(20551)` = "病假"）
- **無 `@Transactional`**: 純查詢不需要
