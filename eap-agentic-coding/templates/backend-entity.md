# Backend: Entity 模板

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**結構要點**（待填入範例後驗證）：
- 繼承的基礎類別（如 AuditableEntity 或專案的 BaseEntity）
- `toMap()` 或 `toDTO()` 作為**唯一的 Entity→轉換來源**，Processor/Controller 不重寫
- 審計欄位的日期格式化工具（禁止 `.toString()`）
- Active Record 查詢方法放在 Entity 內（如 findByConditions, isDuplicate）
- 複雜跨 Entity 邏輯 → 放 Service 層
