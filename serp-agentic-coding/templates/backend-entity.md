# Backend: Entity 模板（Panache Active Record + toMap）

```java
// {module}/src/main/java/org/soetek/serp/{abbr}/domain/GlCurrencyEntity.java

package org.soetek.serp.gl.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.soetek.foundation.domain.AuditableEntity;
import org.soetek.foundation.util.DateFormatUtil;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "GL_CURRENCY")
public class GlCurrencyEntity extends AuditableEntity {

    @Id
    @Column(name = "CURRENCY_CODE", length = 10, nullable = false)
    public String currencyCode;

    @Column(name = "CURRENCY_NAME", length = 100, nullable = false)
    public String currencyName;

    @Column(name = "DECIMAL_PLACES")
    public Integer decimalPlaces;

    @Column(name = "IS_ACTIVE", length = 1)
    public String isActive;

    // ========== toMap（單一來源：Entity → Map 轉換）==========
    // Processor 可擴展此結果，但不應重寫完整轉換邏輯

    public static Map<String, Object> toMap(GlCurrencyEntity e) {
        Map<String, Object> m = new HashMap<>();
        m.put("currencyCode", e.currencyCode);
        m.put("currencyName", e.currencyName);
        m.put("decimalPlaces", e.decimalPlaces);
        m.put("isActive", e.isActive);
        // 審計欄位統一用 DateFormatUtil
        m.put("creator", e.creator);
        m.put("createDt", DateFormatUtil.format(e.createDt));
        m.put("updater", e.updater);
        m.put("updateDt", DateFormatUtil.format(e.updateDt));
        return m;
    }

    // ========== Active Record 查詢方法 ==========

    public static List<GlCurrencyEntity> findByConditions(Map<String, Object> params) {
        StringBuilder query = new StringBuilder("1=1");
        Map<String, Object> queryParams = new HashMap<>();

        if (params.containsKey("currencyCode")) {
            query.append(" AND currencyCode = :currencyCode");
            queryParams.put("currencyCode", params.get("currencyCode"));
        }
        if (params.containsKey("isActive")) {
            query.append(" AND isActive = :isActive");
            queryParams.put("isActive", params.get("isActive"));
        }

        return list(query.toString(), queryParams);
    }

    // ========== Active Record 驗證方法 ==========

    public static boolean isDuplicate(String currencyCode) {
        return count("currencyCode", currencyCode) > 0;
    }
}
```

**結構要點**：
- 繼承 `AuditableEntity`（自動取得 CREATOR, CREATE_DT, UPDATER, UPDATE_DT）
- `toMap()` 是**唯一的 Entity→Map 轉換來源**，Processor 不重寫
- 審計欄位用 `DateFormatUtil.format()`，**禁止 .toString()**
- Active Record 查詢方法（findByConditions, isDuplicate）放在 Entity 內
- 複雜跨 Entity 邏輯 → 放 Service 層
