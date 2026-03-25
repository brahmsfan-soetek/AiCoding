# eap 技術棧

## Backend
- **語言**: Java 17+（Quarkus 3.25.4）
- **框架**: Quarkus + Apache Camel 4.4.0
- **建置**: Maven（multi-module）
- **ORM**: Hibernate + Panache (Active Record)
- **安全**: SmallRye JWT + Session Device Binding
- **快取**: Redis（Quarkus Redis Cache）
- **工具庫**: Lombok 1.18.38, Hutool 5.8.39

## Frontend
- **框架**: Vue 3 (3.4.18) + Quasar 2.14.2
- **建置**: Quasar CLI (Vite) + @quasar/app-vite 2.3.0
- **狀態管理**: Pinia 3.0.3（Setup API）+ pinia-plugin-persistedstate
- **語言**: TypeScript 5.9.2
- **HTTP**: Axios 1.11.0
- **i18n**: Vue i18n 11.1.12
- **UI**: Quasar + 專案共用組件（SBtn, SDialog2, SInput, SSelect2, SCard, SLov, SDatePicker, FileUpload）

## Database
- **類型**: Microsoft SQL Server 2019+
- **Schema**: 雙 Schema 架構 — HRM Schema（權限/認證）+ EAP Schema（業務資料）
- **DDL 管理**: SQL 腳本手動管理（`sql/` 目錄）

## 測試
- **後端**: JUnit 5 + REST Assured（`./mvnw test`，單一：`./mvnw test -Dtest={Class}`）
- **前端**: 未配置
- **策略**: AI 從規格寫單元測試，人工做整合測試（網頁實際操作）
