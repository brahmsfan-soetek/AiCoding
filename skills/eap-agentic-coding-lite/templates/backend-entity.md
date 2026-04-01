---
name: backend-entity
applies_to: "*Entity.java"
---

## 說明
JPA Entity 類別，對應單一資料表，使用 Panache Active Record 模式。每個功能的主要資料表對應一個 Entity。

## 🔧 依規格調整的部分
- **package**: `org.soetek.eap.{module}.domain` -- module 從功能代碼取得（如 tm）
- **Table name**: `@Table(name = "...")` -- 從 DDL 取得，不加 schema
- **PK 欄位**: `@Id` 欄位名、型別、@Column name -- 從 DDL 取得
- **業務欄位**: 每個 @Column 的 name、nullable、precision/scale -- 從 DDL 逐欄對應
- **FK 欄位**: 如 empId、vacationSubId -- 從 DDL FK 定義取得
- **Java 型別對應**: `DECIMAL/NUMERIC` -> `BigDecimal`、`DATE` -> `LocalDate`、`BIT/BOOLEAN` -> `Boolean`、`INT` -> `Integer`、`NVARCHAR` -> `String`
- **import**: 依實際使用的型別選擇 import，不留無用 import

## 完整參考實作
```java
package org.soetek.eap.tm.domain;                          // 🔧 {module} 替換

import io.quarkus.runtime.annotations.RegisterForReflection;  // 🔒 固定
import jakarta.persistence.*;                                  // 🔒 固定
import lombok.AllArgsConstructor;                              // 🔒 固定
import lombok.Data;                                            // 🔒 固定
import lombok.EqualsAndHashCode;                               // 🔒 固定
import lombok.NoArgsConstructor;                               // 🔒 固定
import org.hibernate.annotations.Cache;                        // 🔒 固定
import org.hibernate.annotations.CacheConcurrencyStrategy;     // 🔒 固定
import org.soetek.eap.demo.domain.AuditableEapEntity;          // 🔒 固定：EAP schema 一律用此

import java.math.BigDecimal;                                   // 🔧 依欄位型別決定
import java.time.LocalDate;                                    // 🔧 依欄位型別決定

// 🔒 以下五個 annotation 固定不變
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "TM_EMP_VACATION")                               // 🔧 DDL 表名，不加 schema
@RegisterForReflection                                         // 🔒 固定
@Cacheable                                                     // 🔒 固定
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)            // 🔒 固定
public class TmEmpVacationEntity extends AuditableEapEntity {  // 🔒 一律 extends AuditableEapEntity

    // ==================== 主鍵 ====================

    @Id                                                        // 🔒 固定
    @GeneratedValue(strategy = GenerationType.IDENTITY)        // 🔒 固定：MSSQL 自增
    @Column(name = "EMP_VACATION_ID", nullable = false)        // 🔧 DDL PK 欄名
    public Integer empVacationId;                              // 🔧 PK 型別 + 名稱

    // ==================== 業務欄位 ====================
    // 🔧 以下所有欄位從 DDL 逐一對應

    @Column(name = "EMP_ID", nullable = false)                 // 🔧 FK 欄位
    public Integer empId;

    @Column(name = "VACATION_SUB_ID", nullable = false)        // 🔧 FK 欄位
    public Integer vacationSubId;

    @Column(name = "MAX_HOURS", precision = 5, scale = 1)      // 🔧 precision/scale 從 DDL
    public BigDecimal maxHours;

    @Column(name = "USED_HOURS", precision = 5, scale = 1)
    public BigDecimal usedHours;

    @Column(name = "UNUSED_HOURS", precision = 5, scale = 1)
    public BigDecimal unusedHours;

    @Column(name = "CASH_OUT_HOURS", precision = 5, scale = 1)
    public BigDecimal cashOutHours;

    @Column(name = "BEGIN_DATE", nullable = false)
    public LocalDate beginDate;

    @Column(name = "END_DATE", nullable = false)
    public LocalDate endDate;

    @Column(name = "CLEAR")
    public Boolean clear;

    // ==================== Panache 查詢方法 ====================

    // 🔒 findByKey / existsByKey 格式固定，PK 名稱替換即可
    public static TmEmpVacationEntity findByKey(Integer empVacationId) {
        return find("empVacationId", empVacationId).firstResult();
    }

    public static boolean existsByKey(Integer empVacationId) {
        return count("empVacationId", empVacationId) > 0;
    }
}
```

## 已知陷阱
1. **DDL 欄名打字錯誤** -- DDL 可能有 typo（如 `VACATION_SUN_ID` 應為 `VACATION_SUB_ID`）。務必對照規格書交叉驗證，以規格書語意為準。
2. **@Table 不加 schema** -- 寫 `@Table(name = "TM_EMP_VACATION")`，不寫 `@Table(name = "EAP.TM_EMP_VACATION")`。Hibernate 會自動處理 schema。
3. **繼承 AuditableEapEntity** -- 審計欄位（creator/createDt/updater/updateDt）由 `@PrePersist`/`@PreUpdate` 自動填充，Entity 中不需宣告也不需手動 set。
4. **欄位存取修飾符** -- 使用 `public`（Panache Active Record 風格），不用 `private` + getter/setter。
5. **複雜查詢放 Service** -- Entity 內只放 `findByKey`/`existsByKey` 等簡單查詢；多表 JOIN、原生 SQL 一律放 Service 用 EntityManager。
