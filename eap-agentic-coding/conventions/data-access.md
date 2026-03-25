# eap 資料存取與回應慣例

> 權威來源：`Docs/EAP_BACKEND_ARCHITECTURE.md` + `Docs/Schema-SQL-Best-Practices.md` + `Docs/backend/LOV下拉式選單開發指南.md`

## ORM 策略

**預設**: Panache Entity 靜態方法（JPQL，Hibernate 自動處理 Schema）

**EntityManager 原生 SQL 限以下場景**:
- 多表 JOIN
- 聚合計算（SUM, COUNT, GROUP BY）
- 跨模組 / 跨 Schema 查詢
- 效能關鍵路徑（批次操作需 `flush()` + `clear()`）
- SQL Server 特定語法（TOP, PIVOT）

**原生 SQL 必須加 Schema Prefix**:
```java
// ✅ 正確
String sql = "SELECT * FROM EAP.AU_CALENDAR WHERE ...";
String sql = "SELECT u.DISP_NAME FROM HRM.AU_USER u WHERE ...";

// ❌ 錯誤
String sql = "SELECT * FROM AU_CALENDAR WHERE ...";
```

## Entity 設計

- **基類**: `AuditableEapEntity`（extends `PanacheEntityBase`，EAP Schema）
- **審計欄位**: `@PrePersist` / `@PreUpdate` 自動設定 creator/createDt/updater/updateDt
- **快取**: 一律加 `@Cacheable` + `@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)`
- **靜態查詢方法**: `findByKey()`, `findByXxx()`, `findAllXxx(criteria)`, `existsByKey()`
- **業務方法**: 簡單判斷放 Entity 內，複雜跨 Entity → Service 層

## 回應格式

### 標準回應（強制使用 `buildStandardResponse`）

```java
Map<String, Object> data = new HashMap<>();
data.put("recordId", entity.recordId);
data.put("entityId", entity.recordId);  // ⭐ 必須
return buildStandardResponse(traceId, data, "CREATE");
```

### 查詢回應（使用 PaginationUtil）

```java
// 1. 解析分頁參數
PaginationParams params = PaginationUtil.parsePaginationParams(payload);

// 2. 查詢全部資料 + 轉 Map
List<Map<String, Object>> recordList = entityList.stream()
        .map(this::convertToMap)
        .toList();

// 3. 分頁
PaginationResult<Map<String, Object>> result = PaginationUtil.paginate(recordList, params);

// 4. 組裝回應（items → records rename）
Map<String, Object> response = new HashMap<>(result.toResponseMap("查詢成功"));
response.put("traceId", traceId);

Map<String, Object> existingData = (Map<String, Object>) response.get("data");
if (existingData != null && existingData.containsKey("items")) {
    Map<String, Object> enhancedData = new HashMap<>(existingData);
    enhancedData.put("records", enhancedData.remove("items"));
    response.put("data", enhancedData);
}
```

### 日期格式化（強制使用 DateFormatUtil）

```java
// ✅ 正確
map.put("createDt", DateFormatUtil.formatDateTime(entity.createDt));
map.put("startDate", DateFormatUtil.formatDate(entity.startDate));

// ❌ 禁止
map.put("startDate", entity.startDate.toString());
```

## LOV 下拉選單機制

**不需要寫 Dropdown Processor** — 使用統一 LOV 機制：

1. 在 YAML 定義 SQL：`backend/{模組}/src/main/resources/sql/{模組}-lov.yml`
2. 前端呼叫：`POST /api/lov { lovType: "typeName" }`
3. `LovProcessor`（core-foundation）統一處理

```yaml
# backend/demo/src/main/resources/sql/demo-lov.yml
Lov:
  companyList: |
    SELECT COMPANY_CODE AS value, FULL_NAME AS label
    FROM EAP.COMPANY
    WHERE IS_ACTIVE = 'Y'
    ORDER BY COMPANY_CODE
```

> 只有 LOV 機制無法滿足的特殊場景（如需要複雜業務邏輯），才需要寫獨立的 Processor。

## 前端統一 API 回應型別

```typescript
// src/types/common/api.ts — 已存在的共用型別
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  traceId?: string
}
```

> Service 回傳 `response.data`（已解包 AxiosResponse），Store 收到的就是 `ApiResponse<T>`。

## 共用組件版本

| 需求 | 使用 | 不使用 |
|------|------|--------|
| 按鈕 | **SBtn** + `permission-id` | q-btn |
| 輸入框 | **SInput** | q-input |
| 下拉選單 | **SSelect2** | SSelect / q-select |
| Dialog | **SDialog2** | SDialog / q-dialog |
| 卡片 | **SCard** | q-card |
| 日期 | **SDatePicker** | q-date |
| LOV | **SLov** / **SLovPopup** | — |
| 檔案上傳 | **FileUpload** / **FileList** | — |

> 共用組件有多版本時，一律用最新版號。
