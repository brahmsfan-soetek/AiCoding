# 測試基礎建設模板

> 載入時機：Phase 1 建立測試檔案時（一次性設定），Phase 2 需要除錯測試環境時

## 1. 測試 application.properties

路徑：`backend/application/src/test/resources/application.properties`

此檔案**完全覆蓋**主 `application.properties` 的連線設定，確保測試只連 Docker 本地 DB。

```properties
# =============================================================
# Test Profile 資料源覆寫
# =============================================================
# Docker MSSQL (port 11433)，連到 EAP_TEST Database
# drop-and-create 只影響 EAP_TEST，dev 的 EAP Database 不受影響
# =============================================================

# ----- MSSQL (Docker: localhost:11433, Database: EAP_TEST) -----
quarkus.datasource.jdbc.url=jdbc:sqlserver://localhost:11433;databaseName=EAP_TEST;encrypt=false;trustServerCertificate=true;sendStringParametersAsUnicode=true
quarkus.datasource.password=EapLocal@2026

quarkus.datasource.eap.jdbc.url=jdbc:sqlserver://localhost:11433;databaseName=EAP_TEST;encrypt=false;trustServerCertificate=true;sendStringParametersAsUnicode=true;characterEncoding=UTF-8
quarkus.datasource.eap.password=EapLocal@2026

# ----- Redis (Docker: localhost:16379) -----
quarkus.redis.hosts=redis://localhost:16379/0

# ----- Hibernate Schema Generation -----
quarkus.hibernate-orm.database.generation=drop-and-create
quarkus.hibernate-orm.sql-load-script=no-file
quarkus.hibernate-orm.sql-load-script-filter=false
quarkus.hibernate-orm.eap.database.generation=drop-and-create

# ----- import.sql（drop-and-create 後自動載入種子資料）-----
quarkus.hibernate-orm.eap.sql-load-script=import.sql
quarkus.hibernate-orm.eap.scripts.charset=UTF-8

# ----- 認證繞過：測試不經過 JWT / Session 驗證 -----
quarkus.http.auth.permission.public.paths=/api/*
quarkus.http.auth.permission.public.policy=permit
quarkus.http.auth.permission.authenticated.enabled=false

# ----- JWT 關閉 -----
quarkus.smallrye-jwt.enabled=false
smallrye.jwt.verify.key.location=
mp.jwt.verify.publickey.location=

# ----- Quarkus Test -----
quarkus.test.flat-class-path=true
```

### 關鍵配置說明

| 配置 | 用途 | 不設會怎樣 |
|------|------|-----------|
| `sendStringParametersAsUnicode=true` | MSSQL 以 NVARCHAR 處理中文參數 | 中文查詢條件可能匹配失敗 |
| `characterEncoding=UTF-8` | JDBC 連線的字元編碼 | 中文資料寫入/讀出可能亂碼 |
| `quarkus.hibernate-orm.eap.scripts.charset=UTF-8` | import.sql 的讀取編碼 | 種子資料中文變亂碼 |
| `quarkus.http.auth.permission.public.paths=/api/*` | 測試不走認證 | 所有 API 呼叫返回 401 |
| `quarkus.smallrye-jwt.enabled=false` | 關閉 JWT 驗證 | 啟動時找不到 JWT key 會報錯 |
| `quarkus.test.flat-class-path=true` | Quarkus Test classloader 模式 | `@QuarkusTest` 啟動失敗 |

## 2. junit-platform.properties

路徑：`backend/application/src/test/resources/junit-platform.properties`

```properties
junit.jupiter.testclass.order.default=org.junit.jupiter.api.ClassOrderer$DisplayName
junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$OrderAnnotation
```

## 3. pom.xml 測試依賴

以下依賴必須存在於 `backend/application/pom.xml` 的 `<dependencies>` 中：

```xml
<!-- ===== 測試依賴 ===== -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-jdbc-mssql</artifactId>
    <scope>test</scope>
</dependency>
```

> 版本由 parent pom 的 Quarkus BOM 統一管理，不須指定 `<version>`。

## 4. pom.xml Plugin 配置（編碼 + Surefire）

以下 plugin 配置必須存在於 `backend/application/pom.xml` 的 `<build><plugins>` 中：

```xml
<plugin>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>${compiler-plugin.version}</version>
    <configuration>
        <parameters>true</parameters>
        <encoding>UTF-8</encoding>
        <compilerArgs>
            <arg>-J-Dfile.encoding=UTF-8</arg>
        </compilerArgs>
    </configuration>
</plugin>

<plugin>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>${surefire-plugin.version}</version>
    <configuration>
        <systemPropertyVariables>
            <java.util.logging.manager>org.jboss.logmanager.LogManager</java.util.logging.manager>
            <maven.home>${maven.home}</maven.home>
            <quarkus.test.flat-class-path>true</quarkus.test.flat-class-path>
        </systemPropertyVariables>
        <argLine>-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8</argLine>
    </configuration>
</plugin>
```

### 為什麼需要這些編碼設定？

Windows 環境下 JVM 預設編碼是 MS950（Big5），不是 UTF-8。如果不在三個層級都強制 UTF-8：
1. **compiler** — `.java` 原始碼中的中文字串常量會被錯誤編碼到 `.class`
2. **surefire argLine** — 測試 JVM 的 `file.encoding` 影響 String 比對
3. **application.properties scripts.charset** — Hibernate 讀取 `import.sql` 的編碼

三層缺一不可，否則測試中的中文 assertion 會與 DB 返回值不匹配。

## 5. import.sql 規範

路徑：`backend/application/src/test/resources/import.sql`

| 規則 | 說明 |
|------|------|
| 檔案編碼 **必須 UTF-8 without BOM** | BOM 會導致第一行 SQL 語法錯誤 |
| 中文字串用 `N'前綴'` | MSSQL NVARCHAR 插入需要 N prefix |
| Schema prefix `EAP.TABLE_NAME` | 種子資料插入 EAP Schema |
| 使用 `IF NOT EXISTS` 建備案 DDL | Entity 未建立時的 fallback |
| 每個 INSERT 獨立一行 | Hibernate 逐行執行，不支援多行 INSERT |

## 6. 測試執行指令

```bash
# 執行全部測試
cd backend && mvn test -pl application

# 執行單一測試類別
cd backend && mvn test -pl application -Dtest="{TestClassName}"

# 執行巢狀測試類別
cd backend && mvn test -pl application -Dtest="{OuterClass}\${InnerClass}"
```

## 7. Docker 前置條件

測試前確認 Docker 服務已啟動：

```bash
docker compose up -d
```

MSSQL 初始化腳本（`docker/mssql/init-db.sql`）會自動建立 `EAP_TEST` database。若 DB collation 不支援中文（`SQL_Latin1_General_CP1_CI_AS`），需手動修正：

```sql
ALTER DATABASE EAP_TEST COLLATE Chinese_Taiwan_Stroke_CI_AS;
```

> 建議在 `init-db.sql` 中直接指定 collation，避免每次重建 Docker 都要手動修正。
