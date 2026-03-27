---
name: backend-entity
applies_to: "*Entity.java"
---

## 說明
JPA Entity 類別，對應單一資料表，使用 Panache Active Record 模式。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmEmpVacation）
- `{entityDescription}` -- Entity 中文描述（如 員工年度假別額度）
- `{tableName}` -- DDL 表名（如 TM_EMP_VACATION）
- `{pkColumn}` -- 主鍵欄位的資料庫欄名（如 EMP_VACATION_ID）
- `{pkField}` -- 主鍵欄位的 Java 名稱（如 empVacationId）
- `{PKType}` -- 主鍵 Java 型別（如 Integer）
- `{FIELDS_BLOCK}` -- 業務欄位區塊（依 DDL 逐一定義）
- `{QUERY_METHODS_BLOCK}` -- 自訂查詢方法區塊（依規格需求）

## 完整參考實作
```java
package org.soetek.eap.{module}.domain;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.soetek.eap.demo.domain.AuditableEapEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * {entityDescription} Entity
 * <p>
 * 對應 EAP.{tableName} 資料表
 *
 * @author SoeTek Team
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "{tableName}")
@RegisterForReflection
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class {EntityName}Entity extends AuditableEapEntity {

    // ==================== 主鍵 ====================

    /**
     * 流水號 (PK)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "{pkColumn}", nullable = false)
    public {PKType} {pkField};

    // ==================== 業務欄位 ====================

    // {FIELDS_BLOCK}
    // 範例：
    // /**
    //  * 員工ID (FK to PM_EMPLOYEE)
    //  */
    // @Column(name = "EMP_ID", nullable = false)
    // public Integer empId;
    //
    // /**
    //  * 可請時數 (8hr = 1日)
    //  */
    // @Column(name = "MAX_HOURS", precision = 5, scale = 1)
    // public BigDecimal maxHours;
    //
    // /**
    //  * 額度生效起始日
    //  */
    // @Column(name = "BEGIN_DATE", nullable = false)
    // public LocalDate beginDate;
    //
    // /**
    //  * 結算狀態 (外部批次設定，本功能唯讀)
    //  */
    // @Column(name = "CLEAR")
    // public Boolean clear;

    // ==================== Panache 查詢方法 ====================

    /**
     * 根據主鍵查詢
     */
    public static {EntityName}Entity findByKey({PKType} {pkField}) {
        return find("{pkField}", {pkField}).firstResult();
    }

    /**
     * 檢查主鍵是否存在
     */
    public static boolean existsByKey({PKType} {pkField}) {
        return count("{pkField}", {pkField}) > 0;
    }

    // {QUERY_METHODS_BLOCK}
    // 若有 Query Processor 使用 Entity 查詢（非原生 SQL），可加：
    // public static List<{EntityName}Entity> findAllXxx(Map<String, Object> criteria) { ... }
}
```

## 業務邏輯注意點
- **繼承**: 一律 `extends AuditableEapEntity`，審計欄位 `@PrePersist`/`@PreUpdate` 自動填充，不手動設定 creator/createDt/updater/updateDt
- **快取**: `@Cacheable` + `@Cache(usage = READ_WRITE)` 一律加上
- **@Table**: 只寫表名，不加 schema -- Hibernate 自動處理
- **主鍵**: `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` -- MSSQL 自增
- **欄位存取**: 使用 `public` 修飾符（Panache 風格）
- **欄位型別對應**: `DECIMAL/NUMERIC` -> `BigDecimal`、`DATE` -> `LocalDate`、`BIT/BOOLEAN` -> `Boolean`、`INT` -> `Integer`、`NVARCHAR` -> `String`
- **查詢方法**: 簡單查詢放 Entity（Panache `find()`/`list()`/`count()`），複雜查詢（多表 JOIN / 原生 SQL）放 Service 用 EntityManager
- **import**: 依實際使用的型別選擇 import，不要留無用的 import
