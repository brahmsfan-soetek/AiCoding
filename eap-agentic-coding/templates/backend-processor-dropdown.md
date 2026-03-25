# Backend: 下拉選單 — LOV 機制（推薦）vs 獨立 Processor

## 方式 1：LOV YAML 配置（推薦，不需要寫 Processor）

### 步驟

1. **建立 YAML 檔案**: `backend/{模組}/src/main/resources/sql/{模組}-lov.yml`
2. **實作 SqlProvider SPI**（只需建立一次，模組內通用，見下方範例）
3. **前端呼叫**: `POST /api/lov { lovType: "typeName" }`

### YAML 範例

```yaml
# backend/au012/src/main/resources/sql/au012-lov.yml
#
# ⚠️ 原生 SQL 必須明確指定 Schema prefix

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
package org.soetek.eap.{moduleCode}.config;

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

## 方式 2：獨立 Processor（僅限特殊場景）

僅在以下場景才需要寫獨立的 Dropdown Processor：
- 需要複雜業務邏輯（如依據當前用戶權限過濾）
- 需要跨多表 JOIN + 計算
- LOV YAML 無法表達的動態邏輯

```java
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
public class {EntityName}DropdownProcessor extends ApiRouteProcessor {

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
            "routeId", "{routeId}",
            "apiDescription", "查詢{實體}下拉選單",
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
        description = "查詢{實體}下拉選單",
        logParameters = false,      // 下拉選單頻繁呼叫，不記錄
        logResult = false
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
            @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    protected Object processBusinessLogic(
            Exchange exchange, Map<String, Object> payload,
            Map<String, Object> headers, String traceId, String routeId) throws Exception {

        List<{EntityName}Entity> entities = {EntityName}Entity.findActive();

        List<Map<String, Object>> items = entities.stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("value", e.code);
                    map.put("label", e.name);
                    return map;
                })
                .toList();

        Map<String, Object> data = new HashMap<>();
        data.put("items", items);
        data.put("totalCount", items.size());

        return buildStandardResponse(traceId, data, "QUERY");
    }
}
```

## 決策指引

```
需要下拉選單資料？
├─ 純 SQL 可解決 → LOV YAML（推薦）
└─ 需要業務邏輯 → 獨立 Processor
```
