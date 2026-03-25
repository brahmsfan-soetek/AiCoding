# Backend: Create Processor 模板

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**結構要點**（待填入範例後驗證）：
- 繼承的基礎 Processor/Controller 類別
- 註解配置（@Named / @RestController 等）
- 必要的 routing/mapping 配置
- `processBusinessLogic()` 或對應的業務邏輯方法
- 流程：驗證唯一性 → 建立 Entity → 持久化 → 回應
- 用 `Entity.toMap()` 或 `Entity.toDTO()` 建回應，不在 Processor 寫轉換邏輯
- 統一錯誤處理方式（BusinessException 或專案的 Exception）
