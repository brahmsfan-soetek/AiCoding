# Backend: Dropdown Processor 模板

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**結構要點**（待填入範例後驗證）：
- **無事務註解** — 純查詢，不寫入
- **`dropdownType` switch 分派** — 骨架 100% 一致，只有 case 內容不同
- **回應格式統一 `{items, totalCount}`** — 不是 `records`（與 Query 不同）
- 每個 dropdown item 標準格式：`{value, label, displayLabel}`
- **三種資料來源**：
  1. Entity 查詢
  2. 權限/資料配置 Service（如 DataProfileService）
  3. JPQL / 原生 SQL（跨表取 code + name）
- 某些 case 可能需要額外參數，在 switch 內驗證
