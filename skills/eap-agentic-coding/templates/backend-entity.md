# Backend: Entity 模板

## 範例代碼

```java
package org.soetek.eap.{moduleCode}.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.soetek.eap.demo.domain.AuditableEapEntity; // ⚠️ 路徑以 eap 專案實際位置為準

/**
 * {Entity 中文名稱} Entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "{TABLE_NAME}")              // 不加 schema — Hibernate 自動處理
@RegisterForReflection
@Cacheable                                  // ⭐ 必加
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)  // ⭐ 必加
public class {EntityName}Entity extends AuditableEapEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "{PK_COLUMN}", nullable = false)
    public Integer {pkField};

    @Column(name = "{COLUMN_NAME}", length = 100, nullable = false)
    public String {fieldName};

    // ==================== Panache 查詢方法 ====================

    public static {EntityName}Entity findByKey({PKType} {pkField}) {
        return find("{pkField}", {pkField}).firstResult();
    }

    public static boolean existsByKey({PKType} {pkField}) {
        return count("{pkField}", {pkField}) > 0;
    }

    public static List<{EntityName}Entity> findAllXxx(Map<String, Object> criteria) {
        StringBuilder query = new StringBuilder("FROM {EntityName}Entity e WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (criteria.containsKey("fieldName") && criteria.get("fieldName") != null) {
            String val = criteria.get("fieldName").toString().trim();
            if (!val.isEmpty()) {
                query.append(" AND e.fieldName LIKE ?").append(params.size() + 1);
                params.add("%" + val + "%");
            }
        }

        query.append(" ORDER BY e.{sortField}");
        PanacheQuery<{EntityName}Entity> panacheQuery = find(query.toString(), params.toArray());
        return panacheQuery.list();
    }
}
```

## 結構要點

- **繼承**: `extends AuditableEapEntity` — 審計欄位 `@PrePersist`/`@PreUpdate` 自動填充
- **快取**: `@Cacheable` + `@Cache(usage = READ_WRITE)` — 一律加上
- **@Table**: 只寫表名，**不加 schema** — Hibernate 自動處理
- **主鍵**: `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` — MSSQL 自增
- **欄位**: `public` 存取（Panache 風格）
- **查詢方法**: `findByKey()`, `existsByKey()`, `findAllXxx(criteria)` — Panache `find()` / `list()` / `count()`
- **不手動設定審計欄位** — `@PrePersist`/`@PreUpdate` 自動處理 creator/createDt/updater/updateDt

## ⚠️ 與現有代碼的差異

AU010 AuCalendarEntity 和 AU011 EmpAgentEntity 缺少 `@Cacheable` + `@Cache` — 是**早期遺漏，以本模板為準**。
