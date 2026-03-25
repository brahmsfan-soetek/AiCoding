# Backend: GetById Processor 模板

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**結構要點**（待填入範例後驗證）：
- **無事務註解** — 純查詢
- **回傳單筆 Map/DTO，非陣列** — 與 Query 的 `records: [...]` 不同
- **不存在拋 404** — `findById` 查無資料 → Exception
- **Lookup 顯示欄位** — 查配置表建立 code→name 對應，加入 `xxxDisplay` 欄位
  - 格式：`"code(name)"`
  - 批次建 map 後逐欄位套用，避免 N+1 查詢
- **與 Query 的差異**：
  - Query：多筆 + 分頁 + `records` 陣列
  - GetById：單筆 + 不分頁 + 直接回傳 data
