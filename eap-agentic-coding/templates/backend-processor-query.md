# Backend: Query Processor 模板

<!-- TODO: 確認 EAP 的分頁策略後選擇對應版本 -->

## pagination_strategy: frontend（前端分頁排序）

後端回傳全部資料，不做分頁和排序。

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**結構要點**（待填入範例後驗證）：
- Query 不加事務註解（只讀）
- **前端分頁** — 不做後端分頁和排序
- Entity ORM 查詢優先
- `Entity::toMap` 或 `Entity::toDTO` — 串流轉換，不手寫迴圈
- 回應使用 `records` key（或專案約定的 key）

---

## pagination_strategy: backend（後端分頁排序）

後端處理分頁和排序，回傳指定頁資料。

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**差異**：多了分頁參數解析 + 分頁處理。

---

## 何時用原生 SQL

<!-- TODO: 從 EAP 專案填入 — 原生 SQL 使用場景（多表 JOIN、聚合計算、跨模組查詢等） -->
