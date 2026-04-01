# serp 資料存取與回應慣例

## ORM 策略

**預設**: Entity ORM（Panache Active Record）
**NativeSqlService 限以下場景**:
- 多表 JOIN
- 聚合計算（SUM, COUNT, GROUP BY）
- 跨模組查詢
- 效能關鍵路徑
- 下拉選單（跨表取 code + name）

## Entity 設計

- **模式**: Panache Active Record（Entity 自帶查詢方法）
- **靜態方法**: findByConditions / findAll / findByCompositeKey（查詢）、create / update / delete（CUD，需 @Transactional）、isDuplicate / existsByUniqueKey（驗證）
- **toMap()**: Entity → Map 基礎轉換，**唯一來源**。Processor 可擴展但不重寫
- **複雜邏輯**: 跨 Entity 業務邏輯 → Service 層

## 回應格式

- **分頁查詢結果**: `records`
- **下拉選單/LOV**: `items`
- **日期格式化**: `DateFormatUtil`，禁止 `.toString()`
- **分頁策略**: **前端分頁排序** — 後端回傳全部資料，不做分頁和排序

## 共用組件版本

| 需求 | 使用 | 不使用 |
|------|------|--------|
| 表格 | **TablesComponent** | s-table / q-table |
| Dialog | **SDialog2** | SDialog / q-dialog |
| Panel | **SPanel2** | SPanel |
| 輸入框 | **SInput2** | SInput |
| 下拉選單 | **SSelect2** | SSelect |
| 按鈕 | **SBtn** + `permission-id` | q-btn |
| 卡片 | **SCard** | q-card |
| 日期 | **SDatePicker** | — |
| LOV | **SLov** / **SLovSelect** | — |

> 共用組件有多版本時，一律用最新版號。
