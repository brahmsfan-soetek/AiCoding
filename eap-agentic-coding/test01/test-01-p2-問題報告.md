# Test-01 P2 問題報告

**測試日期**：2026-03-26
**Phase**：P2（Code Agent）
**總耗時**：58 分鐘
**總 Tool Calls**：283 次

## 總覽

| 指標 | 數量 |
|------|------|
| Bash 指令 | 119 (42%) |
| Search 搜尋 | 52 (18%) |
| Read 讀取 | 48 (17%) |
| Write/Update 寫入 | 55 (19%) |
| mvn 相關指令 | 47 次 |

**實際寫 Code 的 Tool Calls 僅 ~31 次（11%），其餘 89% 花在探索、除錯、重試。**

---

## 時間分段

| # | 段落 | 行號 | 呼叫數 | 佔比 | 預估耗時 | 性質 |
|---|------|------|--------|------|---------|------|
| 1 | Context 載入 | 2-17 | 16 | 6% | ~3m | 正常 |
| 2 | 架構探索 | 18-50 | 33 | 12% | ~6m | 浪費 |
| 3 | mvnw 找不到 | 51-63 | 13 | 5% | ~3m | 已修 |
| 4 | Maven 子模組編譯 | 64-69 | 6 | 2% | ~2m | 已修 |
| 5 | **Quarkus 測試基礎建設** | 70-160 | **91** | **32%** | **~19m** | **最大浪費** |
| 6 | 實際寫 Code | 176-182 | 7 | 2% | ~2m | 正常 |
| 7 | **Encoding/Charset 地獄** | 196-259 | **63** | **22%** | **~13m** | **第二大浪費** |
| 8 | 前端實作 | 261-284 | 24 | 8% | ~5m | 正常 |

---

## 問題詳述

### 問題 1：Quarkus 測試基礎建設（91 次呼叫、~19m、32%）

**現象**：Agent 從零摸索如何讓 `@QuarkusTest` 跑起來，反覆失敗重試。

**行為軌跡**：
1. 搜尋 `quarkus-junit5` 依賴位置（lines 70-76）
2. 修改 `application/pom.xml` 加 test dependency（line 76）
3. `mvn test` 仍失敗 → 嘗試 surefire 參數：`-DforkCount=0`、`-DuseModulePath=false`（lines 77-98）
4. 解壓 quarkus-junit5 JAR，用 `javap` 反編譯 `FacadeClassLoader`（lines 119-129）
5. 建立 `MinimalQuarkusTest.java` 做最小測試（line 158）→ 通過
6. 真正的測試仍失敗 → 讀 `HandlerApiResource` 理解 security 機制（lines 162-168）
7. 修改 `test/application.properties` 加 security bypass（line 169）
8. 刪除 `MinimalQuarkusTest.java`（line 170）
9. 建立 `junit-platform.properties`（line 151）
10. 反覆修改 `pom.xml` 和 surefire 設定（lines 113-156，共 ~10 次 Update）

**根因**：`conventions/` 和 `templates/` 沒有提供：
- 可運作的 `src/test/resources/application.properties` 完整模板（含 security bypass、DB 連線）
- 必要的 test dependencies 清單（quarkus-junit5、rest-assured 的 scope/版本）
- `junit-platform.properties` 範本
- surefire plugin 的必要配置

**影響**：Agent 用了 91 次 tool call 做的事情，其實只需要一份文件就能解決。

---

### 問題 2：Encoding/Charset 地獄（63 次呼叫、~13m、22%）

**現象**：中文字元在測試 assertion 與 DB 返回資料不匹配，Agent 無法判斷問題出在哪一層。

**行為軌跡**：
1. 測試 assertion 失敗 — 預期中文 empName 但拿到亂碼（line 196 附近）
2. `xxd` 檢查 `.class` 檔案位元組（lines 201-222，共 12 次）
3. `javap` 反編譯確認字串常量（lines 204-207）
4. 嘗試 `JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"`（line 234）
5. 修改 pom.xml `<encoding>UTF-8</encoding>`（lines 202, 206, 224, 237）
6. 查 Maven compiler 編碼設定（lines 210, 239）
7. 檢查 `import.sql` 的 hex 編碼（lines 241-245）
8. 進 Docker 查 MSSQL collation → 發現是 `SQL_Latin1_General_CP1_CI_AS`（line 249-251）
9. 改 DB collation 為 `Chinese_Taiwan_Stroke_CI_AS`（line 254）
10. 最終通過（line 259）

**根因**：`conventions/` 沒有文件說明：
- Docker 測試 DB 的 collation 需求（必須支援中文）
- `docker-compose.yml` 中 MSSQL 的初始化 collation 設定
- Maven 的 `<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>` 要求
- `import.sql` 必須以 UTF-8 without BOM 儲存

**影響**：即使下次開發不同模組，如果 Docker DB 被重建，同樣的問題會再次發生。

---

### 問題 3：架構探索（33 次呼叫、~6m、12%）

**現象**：Agent 不知道 eap 的 API routing 如何運作，花大量時間搜尋。

**行為軌跡**：
1. 搜尋 `RouteBuilder`、`BaseApiRouteBuilder`、`buildApiRoute`（lines 24-29，共 6 次）
2. 搜尋 `HandlerApiResource`（lines 31-32）
3. 搜尋 `TmEmployeeQueryService`（lines 20, 23, 25, 38-40，共 6 次）— 因為不存在
4. 搜尋 `direct://` Camel route 模式（lines 183-188）
5. 搜尋 `ApiRouteProcessor`（line 30）
6. 讀取多個現有 Processor 理解模式（lines 17, 22, 36）

**根因**：`code-patterns-backend.md` 缺少 API routing 的完整 flow 說明：
- Request → `HandlerApiResource` → Camel Route → Processor → Service → Response
- Processor 如何被 Camel 發現（`@Named` + route 配置）
- 查詢 vs CRUD 的路由差異

**影響**：每開發一個新模組，Agent 都會重新探索同樣的架構問題。

---

### 問題 4：mvnw 找不到（13 次呼叫、~3m、5%）— 已修

**現象**：Agent 執行 `./mvnw test` 失敗，花時間搜尋 wrapper 位置。

**已修正**：`tech-stack.md` 中 `./mvnw` → `mvn`。

---

### 問題 5：Maven 子模組未編譯（6 次呼叫、~2m、2%）— 已修

**現象**：Agent 自行執行 `mvn install -DskipTests` 編譯子模組。

**已修正**：Phase 2 前置條件明確要求使用者先執行 `mvn clean install -DskipTests`。

---

## 已修 vs 未修

| 問題 | 狀態 | 修正方式 | 節省預估 |
|------|------|---------|---------|
| mvnw 找不到 | **已修** | `tech-stack.md` 修正 | ~3m |
| Maven 子模組未編譯 | **已修** | P2 前置條件 | ~2m |
| Quarkus 測試基礎建設 | **未修** | 需新增測試基礎建設文件 | **~19m** |
| Encoding/Charset | **未修** | 需補充 DB 編碼文件 | **~13m** |
| 架構探索 | **未修** | 需補充 API routing 文件 | **~6m** |

**已修項目預計節省 ~5m。未修項目仍浪費 ~38m（佔總時間 66%）。**

---

## 建議修正方向

### 優先級 1：測試基礎建設文件（解決問題 1，節省 ~19m）

新增 `templates/test-infrastructure.md`，包含：
- 完整的 `src/test/resources/application.properties` 模板（DB 連線、security bypass、Hibernate 設定）
- 必要 test dependencies（pom.xml 片段）
- `junit-platform.properties` 內容
- surefire plugin 配置

### 優先級 2：DB 編碼文件（解決問題 2，節省 ~13m）

`conventions/db-conventions.md` 或 `conventions/tech-stack.md` 補充：
- Docker MSSQL 測試 DB 的 collation 要求（`Chinese_Taiwan_Stroke_CI_AS`）
- `docker-compose.yml` 的 `MSSQL_COLLATION` 環境變數
- Maven encoding 設定（`<project.build.sourceEncoding>`）
- `import.sql` 的 UTF-8 要求

### 優先級 3：API Routing 文件（解決問題 3，節省 ~6m）

`conventions/code-patterns-backend.md` 補充：
- 完整的 Request flow（HandlerApiResource → Camel → Processor → Service）
- Processor 註冊機制（`@Named` + route ID）
- Query vs CRUD 的路由差異
