# Backend: Update Processor 模板

<!-- TODO: 從 EAP 專案填入完整範例代碼 -->

**結構要點**（待填入範例後驗證）：
- 與 Create 結構相同，差異僅在 operation type 和業務邏輯
- 事務管理（@Transactional）— 寫入操作必須
- **必填欄位含主鍵** — Update 比 Create 多了主鍵驗證
- **查詢存在性** — 不存在拋 404
- **排除自身的重複檢查** — 如 `findDuplicate(key, excludeId)` 排除自己
- 委託 Entity 靜態方法或 Service 更新，不在 Processor 逐一設定欄位
