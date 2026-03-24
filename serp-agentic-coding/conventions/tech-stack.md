# serp 技術棧

## Backend
- **語言**: Java（Quarkus 3.25.4）
- **框架**: Quarkus + Apache Camel
- **建置**: Maven
- **ORM**: Hibernate + Panache (Active Record)

## Frontend
- **框架**: Vue 3 + Quasar 2.14
- **建置**: Quasar CLI (Vite)
- **狀態管理**: Pinia（新 store 用 Setup API，舊有 common store 用 Options API）
- **UI**: Quasar + 專案共用組件（SBtn, SDialog2, SPanel2, SInput2, SSelect2, TablesComponent）

## Database
- **類型**: MySQL
- **Migration**: Flyway

## 測試
- **後端**: JUnit 5（`./mvnw test`，單一：`./mvnw test -Dtest={Class}`）
- **前端**: 未配置（`"test": "echo \"No test specified\" && exit 0"`）
- **策略**: AI 從規格寫單元測試，人工做整合測試（網頁實際操作）
