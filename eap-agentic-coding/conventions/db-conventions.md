# eap 資料庫慣例

## 基礎資訊

- **資料庫**: Microsoft SQL Server 2019+
- **架構**: 同一個資料庫 (EAP)，區分為兩個 Schema (HRM + EAP)
- **表名**: UPPER_SNAKE_CASE（如 `AU_CALENDAR`、`SALARY_RANK_HEADER`）
- **欄位**: UPPER_SNAKE_CASE（如 `CALENDAR_ID`、`WORK_DATE`）
- **主鍵**: `IDENTITY(1,1)` 自增
- **必備欄位**: `CREATOR`(NVARCHAR 20), `CREATE_DT`(DATETIME2), `UPDATER`(NVARCHAR 20), `UPDATE_DT`(DATETIME2)
- **刪除策略**: 依規格定義（硬刪除為主，部分使用 `DELETE_FLAG` CHAR(1) 軟刪除）
- **編碼**: NVARCHAR（Unicode 支援中日越多語系）
- **外鍵**: 無 FOREIGN KEY 約束（應用層強制）
- **DDL 管理**: SQL 腳本手動管理（`sql/` 目錄），禁止程式內 DDL 操作

## 雙 Schema 架構（最重要）

| 持久化單元 | Schema | Entity 基類 | 掃描 package | 用途 |
|-----------|--------|------------|-------------|------|
| 預設 | HRM | `AuditableEntity` | `org.soetek.foundation.domain`, `org.soetek.authorize.domain` | 權限/認證 |
| `eap`（命名） | EAP | `AuditableEapEntity` | `org.soetek.eap.*` | 業務資料 |

### 禁止跨持久化單元繼承

```java
// ✅ 正確
public class BusinessEntity extends AuditableEapEntity { }  // EAP Schema

// ❌ 錯誤：會導致 Panache 衝突
public class BusinessEntity extends AuditableEntity { }      // 不可以！
```

## SQL 撰寫規則

| 查詢方式 | Schema Prefix | 說明 |
|---------|--------------|------|
| **JPQL** | 不需要 | Hibernate 自動處理 |
| **原生 SQL** | **必須** `EAP.TABLE` 或 `HRM.TABLE` | Hibernate 不處理原生 SQL |
| **YAML SQL** | **必須** | YAML 中的 SQL 是原生 SQL |
| **Entity @Table** | **不加** | `@Table(name = "TABLE_NAME")` — Hibernate 用 default-schema |

## EntityManager 注入

```java
@Inject EntityManager hrmEM;                              // HRM Schema
@Inject @PersistenceUnit("eap") EntityManager eapEM;      // EAP Schema
```

> 業務模組的 Entity 一律繼承 `AuditableEapEntity`。需要 EntityManager 時用 `@PersistenceUnit("eap")`。
