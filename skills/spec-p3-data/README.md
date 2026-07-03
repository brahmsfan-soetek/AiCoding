# AI Coding Workflow — spec-p3-data (v1.0.0)

權限 SQL + 測試資料 SQL 產出與執行 SKILL。讀 `{程式編號}_規格統計_最終版.md`（抽權限需求）與 `{程式編號}_test_cases.md`（抽前置條件 → 測資需求），產出 permission / seed SQL，PG 審閱 + 授權後執行。

本 SKILL 是 [`spec-p3-backend`](../spec-p3-backend/) + [`spec-p3-frontend`](../spec-p3-frontend/) 完工後的收尾：讓 PG 能直接照 `test_cases.md` 開瀏覽器手測，而非自己逐筆建資料。

---

## 定位

- **輸入：**
  - `{程式編號}_規格統計_最終版.md`（權限定義、Menu / Role 需求）
  - `{程式編號}_test_cases.md`（前置條件 → 測試資料需求）
  - `current_schema_{程式編號}.md`（spec-p2 透過 MCP MySQL 唯讀 DESCRIBE 產出；schema 對齊唯一來源）
- **輸出：**
  - `{程式編號}_PERMISSION.sql`（Menu / Role / MenuRole 等）
  - `{程式編號}_SEED.sql`（依 test_cases 前置條件產 INSERT）
  - 執行結果驗證（COUNT 對帳，透過 MCP read-only SELECT）
- **時機：** P3-backend + P3-frontend 完成後，PG 手測前。非必須（PG 若打算在 UI 一邊建資料一邊測可以跳過）。

---

## 核心原則

1. **權限 + 測資是為手測服務** — 目的是讓 PG 能照 test_cases.md 跑完整流程。
2. **DB infra 由 PG 維護** — dev server / DB / MCP server 啟動維護 AI 不負責。
3. **schema 漂移 STOP 報告** — 不自行修改 DDL（改 Entity 還是補 schema 由 PG 決定；案例史見 `spec-workflow-refs/rationale.md`）。
4. **執行需授權** — SG2 明示授權後才跑 SQL（DB 寫入不可回復）。
5. **特徵碼分離** — seed 資料必須帶特徵碼（如 `creator='e2e_seed'`），與真實資料分離便於日後清理。
6. **MCP 唯讀，寫入走 mysql CLI** — `DESCRIBE` 與 `SELECT COUNT(*)` 對帳走 MCP read-only；PERMISSION / SEED 的 INSERT 走 mysql CLI；production DB 絕對不掛 MCP。
7. **Schema 來源 = `current_schema_{程式編號}.md`** — spec-p2 MCP DESCRIBE 產出，spec-p3-data 不再讀 `Docs/DDL/*.sql`、不推 sibling code。
8. **Scope-lock 動手前必跑** — 步驟 4「讀 schema」末尾為 Scope Statement stop gate（Deliverable / 預期動到 / out-of-scope）；過程發現需超出 scope → STOP 回報。

---

## 觸發方式

- `/data` — 顯示流程說明並開始
- `/data <程式編號>` — 直接帶入程式編號

---

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_test_cases.md` 與 `current_schema_{程式編號}.md`
2. 已完成 `/impl-be` + `/impl-fe`（實作可運行）
3. 專案 `CLAUDE.md` 索引有指向 permission / seed 規範（若有）
4. Dev DB 可連線（PG 啟動與維護）
5. MCP MySQL 唯讀連線已配置（與 spec-p2 共用配置；對帳 / `DESCRIBE` 補驗用，寫入仍走 mysql CLI）

---

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|:-:|
| SG0 | 讀完 schema 後 | **Scope Statement**（Deliverable / 預期動到 / out-of-scope）| **不可省略** |
| SG1 | SQL 產出後 | PG 審權限表設計、seed 覆蓋度、特徵碼設計 | **不可省略** |
| SG2 | 執行 SQL 前 | PG 授權 AI 執行 | **不可省略**（DB 寫入不可回復）|

---

## 流程總覽

```
/data [程式編號]
         ↓
[AI]  讀最終版規格統計 → 抽權限需求
      - Menu 定義 / Role 需求 / MenuRole 對應
         ↓
[AI]  讀 test_cases.md → 抽測資需求
      - 逐條解析「前置條件」
      - 歸納客戶 / 發票 / 等資料
      - 標註依賴順序（主從）
      - 加特徵碼（creator='e2e_seed'）
         ↓
[AI]  讀 current_schema_{程式編號}.md → 對齊欄位
      - schema 來源 = spec-p2 MCP DESCRIBE dump（不再讀 DDL）
      - 缺檔 → STOP 回 P2 補
      - schema 與規格不一致 → STOP 回報
         ↓
[STOP] Scope Statement
      - Deliverable / 預期動到 / out-of-scope
      - PG 確認後才進產 SQL
         ↓
[AI]  產 PERMISSION.sql + SEED.sql
         ↓
[STOP] SG1: PG 審 SQL
         ↓
[STOP] SG2: PG 授權執行
         ↓
[AI]  執行 SQL（若授權）
      - 跑 PERMISSION.sql / SEED.sql：mysql CLI（PG 授權後；MCP 唯讀，寫入不走 MCP）
      - 對帳：MCP read-only SELECT COUNT(*) 每張表（避免 mysql CLI escape 風險）
      - 錯誤 → STOP 回報（不自主修）
         ↓
[AI]  Commit SQL 檔
[AI]  完工報告 → 建議 PG 開瀏覽器手測
```

---

## 輸出範例

### `{程式編號}_PERMISSION.sql`

```sql
-- Menu 定義
INSERT INTO MENU (MENU_CODE, MENU_NAME, PARENT_CODE, ROUTE_PATH, ...)
VALUES ('AR004', '{功能名稱}', 'AR', '/ar004', ...);

-- Role 權限
INSERT INTO MENU_ROLE (MENU_CODE, ROLE_CODE, PERMISSION)
VALUES ('AR004', 'AR_USER', 'READ,WRITE');
```

### `{程式編號}_SEED.sql`

```sql
-- 特徵碼前綴
-- creator='e2e_seed_AR004'

-- 客戶資料（test_cases 的前置條件：C001 / C002 必須存在）
INSERT INTO SO_CUSTOMER (CUSTOMER_CODE, CUSTOMER_NAME, ..., CREATOR)
VALUES
  ('C001', '測試客戶 A', ..., 'e2e_seed_AR004'),
  ('C002', '測試客戶 B', ..., 'e2e_seed_AR004');

-- 發票資料（依賴客戶存在）
INSERT INTO AR_DOC_HEADER (AR_NO, CUSTOMER_CODE, ..., CREATOR)
VALUES
  ('AR-001', 'C001', ..., 'e2e_seed_AR004'),
  ('AR-002', 'C002', ..., 'e2e_seed_AR004');
```

---

## 目錄結構

```
spec-p3-data/
├── README.md      ← 本文件
└── SKILL.md       ← Claude Code Skill 定義
```

---

## 快速開始

### 1. 確認前置都已就緒

- `Docs/spec/{程式編號}/{程式編號}_規格統計_最終版.md` 存在
- `Docs/spec/{程式編號}/plan/{程式編號}_test_cases.md` 存在
- `/impl-be` + `/impl-fe` 均已跑完
- Dev DB 可連線

### 2. 於專案 repo 目錄執行

```
/data AR004
```

### 3. AI 執行步驟

1. 讀規格統計 → 抽權限需求
2. 讀 test_cases.md → 抽測資需求
3. 讀 `current_schema_{程式編號}.md` → 對齊欄位（缺檔 STOP 回 P2 補）
4. 產 PERMISSION.sql + SEED.sql
5. SG1 審 → SG2 授權 → 執行（寫入 mysql CLI / 對帳 MCP）→ 對帳
6. Commit SQL 檔、歸檔

### 4. 後續流程

完工後 PG 開瀏覽器照 `test_cases.md` 逐條勾選：
- ✅ 通過 → 繼續下一條
- ❌ 失敗 → ad hoc 丟給 AI 修（不走本 SKILL）
- ⚠️ 有疑慮 → 跟 SA 或 AI 釐清

---

## 關鍵防護機制

1. **schema 不一致不自主補** — STOP 回報 PG
2. **執行需 SG2 授權** — DB 寫入不可回復
3. **特徵碼分離** — 便於日後清理
4. **執行錯誤不自主修** — DB 錯誤（外鍵 / 權限 / 欄位類型）通常涉及環境，STOP 報告由 PG 決定
5. **MCP 必須唯讀，寫入走 mysql CLI** — INSERT/UPDATE/DELETE 一律走 mysql CLI（即便 dev DB）；對帳 / `DESCRIBE` 補驗走 MCP read-only
6. **Schema 來源唯一化** — `current_schema_{程式編號}.md`（spec-p2 / spec-p3-backend / spec-p3-data 三 SKILL 共用）

---

## 相關連結

- [`spec-p2-tasking`](../spec-p2-tasking/) — 產 test_cases.md（含前置條件）
- [`spec-p3-backend`](../spec-p3-backend/) — /impl-be
- [`spec-p3-frontend`](../spec-p3-frontend/) — /impl-fe
- [主 README](../../README.md) — Skill catalog
