# eap 技術棧

## Backend
- **語言**: Java 17+（Quarkus 3.25.4）
- **框架**: Quarkus + Apache Camel 4.4.0
- **建置**: Maven（multi-module）
- **ORM**: Hibernate + Panache (Active Record)
- **安全**: SmallRye JWT + Session Device Binding
- **快取**: Redis（Quarkus Redis Cache）
- **工具庫**: Lombok 1.18.38, Hutool 5.8.39

## Frontend
- **框架**: Vue 3 (3.4.18) + Quasar 2.14.2
- **建置**: Quasar CLI (Vite) + @quasar/app-vite 2.3.0
- **狀態管理**: Pinia 3.0.3（Setup API）+ pinia-plugin-persistedstate
- **語言**: TypeScript 5.9.2
- **HTTP**: Axios 1.11.0
- **i18n**: Vue i18n 11.1.12
- **UI**: Quasar + 專案共用組件（SBtn, SDialog2, SInput, SSelect2, SCard, SLov, SDatePicker, FileUpload）

## Database
- **類型**: Microsoft SQL Server 2019+
- **Schema**: 雙 Schema 架構 — HRM Schema（權限/認證）+ EAP Schema（業務資料）
- **DDL 管理**: SQL 腳本手動管理（`sql/` 目錄）

## 測試
- **後端**: JUnit 5 + REST Assured + `@QuarkusTest`（`mvn test`，單一：`mvn test -Dtest={Class}`）
- **前端**: 未配置
- **策略**: AI 從規格寫整合測試（`@QuarkusTest` + REST Assured 打 API），人工做驗收測試（網頁實際操作）

> **為什麼是整合測試而非單元測試？** eap 的業務邏輯主要在 SQL（Native Query / YAML LOV），Java 層是薄膠水（Processor → Service → EntityManager）。Mock DB 的單元測試只驗證 `Object[]→Map` 轉換，測不到 SQL 正確性、JOIN 邏輯、WHERE 條件——這些才是真正出 bug 的地方。整合測試打真實 DB 才能驗證完整路徑。

### 測試資料庫隔離（必遵守）

測試使用 Docker Compose 提供的**獨立本地 MSSQL 實例**，與遠端共用開發資料庫完全隔離。

| 規則 | 說明 |
|------|------|
| `drop-and-create` **只能放在** `src/test/resources/application.properties` | 此檔案的連線指向 Docker 本地 DB，確保 drop-and-create 不會影響遠端 |
| 主 `application.properties` 中 **禁止** 出現 `%test.*.database.generation=drop-and-create` | 避免 test profile 意外 fallback 到遠端共用資料庫時清掉所有資料表 |
| 測試連線 URL **必須指向 Docker 本地** (`localhost:11434`) | 不可指向遠端 IP（如 `192.168.x.x`） |
| `import.sql`（種子資料）放在 `src/test/resources/` | Hibernate 啟動後自動載入 |

```
# src/test/resources/application.properties 的結構
# 1. 覆寫連線 → Docker 本地 MSSQL/Redis
# 2. 設定 drop-and-create（只在此檔案）
# 3. 測試專用配置（如 auth bypass）
```

**為什麼這樣設計？** 如果 `src/test/resources/application.properties` 未載入（路徑錯誤、建構異常等），Quarkus 會 fallback 到主 `application.properties`。此時若主設定有 `drop-and-create`，就會用遠端共用 DB 的連線執行 drop-and-create，**清掉整個遠端資料庫**。
