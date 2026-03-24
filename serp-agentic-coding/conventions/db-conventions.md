# serp 資料庫慣例

- **表名**: UPPER_SNAKE_CASE（如 `GL_JOURNAL`）
- **欄位**: UPPER_SNAKE_CASE
- **主鍵**: 依業務定義（複合主鍵 / 單一主鍵）
- **必備欄位**: CREATOR, CREATE_DT, UPDATER, UPDATE_DT
- **刪除**: 依規格定義（軟刪除 / 硬刪除）
- **MySQL 特殊**: UTF-8mb4 編碼
- **DDL**: 禁止 — schema 變更由 Flyway migration 管理
