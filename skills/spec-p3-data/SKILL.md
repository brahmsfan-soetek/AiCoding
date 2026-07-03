---
name: spec-p3-data
description: 讀規格統計 + test_cases.md + DB schema，產 permission SQL + seed SQL，PG 授權後執行。
---

# Spec P3 Data — 權限與測試資料準備

在專案 repo 目錄下執行,讀取 `{程式編號}_規格統計_最終版.md`（抽權限需求）與 `{程式編號}_test_cases.md`（抽前置條件 → 測試資料需求）,產出 permission SQL 與 seed SQL,PG 審閱後執行。

## 共用規約（動手前必讀）

本 SKILL 與 `spec-p3-backend` / `spec-p3-frontend` 共用以下規約,引用自 `<repo>/spec-workflow-refs/p3/`：

- [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md) — SG1 動手前 scope-lock
- [`commit-rules.md`](../../spec-workflow-refs/p3/commit-rules.md) — artifact 合一 commit + 標題禁 task id
- [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md) — Subagent 不產 git 檔 + 規範權威與 grep 查證邊界
- [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md) — 完工三條件 + 維護期 hand-off + SKILL 邊界
- [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md) — session_log.md 格式（含維護期 hand-off 範例；P3-data 不寫 progress.md）

各規則的歷史教訓與案例對應集中於 [`rationale.md`](../../spec-workflow-refs/rationale.md)——執行 session 不需讀,維護者查閱用。

（**P3-data 無 commit-time hook**：純 SQL 一次性產出,無 Maven / npm 編譯流程）

## 定位

- **輸入：**
  - `{程式編號}_規格統計_最終版.md`（權限定義、Menu / Role 需求）
  - `{程式編號}_test_cases.md`（前置條件 → 測試資料需求）
  - `current_schema_{程式編號}.md`（spec-p2 透過 MCP MySQL 唯讀 DESCRIBE 產出的真實 DB schema dump；欄位對齊唯一來源,不再讀 `Docs/DDL/*.sql`）
- **輸出：**
  - `{程式編號}_PERMISSION.sql`（Menu / Role / MenuRole 等）
  - `{程式編號}_SEED.sql`（依 test_cases 前置條件產 INSERT）
  - 執行結果驗證（COUNT 對帳,透過 MCP 唯讀 SELECT）
- **時機：** P3 實作完成後、PG 手測前。非必須（若 PG 打算在 UI 一邊建資料一邊測可以跳過）。
- **SKILL 邊界：** 詳見共用 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)。本 SKILL 結束點 = SQL 產出 + PG 授權執行 + COUNT 對帳通過 + 維護期 hand-off append。

## 觸發方式

- `/data` — 顯示流程說明並開始
- `/data <程式編號>` — 直接帶入程式編號

## 前置條件

1. 已完成 P2 `spec-p2-tasking`,產出 `{程式編號}_test_cases.md` 與 `current_schema_{程式編號}.md`
2. 已完成 P3 `spec-p3-backend` + `spec-p3-frontend`（實作可運行）
3. 專案 `CLAUDE.md` 索引有指向 permission / seed 規範（若有）
4. Dev DB 可連線（PG 啟動與維護,本 SKILL 不負責 infra）
5. **MCP MySQL 唯讀連線已配置**：PG 預先設定指向 dev DB 的 MCP server,帳號僅可 `DESCRIBE` / `SELECT`,無寫入權限。production DB 絕對不可掛 MCP。本 SKILL 用 MCP 做 schema 補驗（若 `current_schema` 對齊有疑慮時）與執行後 COUNT 對帳；PERMISSION / SEED 寫入仍走 mysql CLI（PG 授權後）。

## Execution Flow

```
/data [程式編號]
         ↓
[AI]  讀最終版規格統計 → 抽權限需求
      - Menu 定義（程式編號、名稱、路徑、上層 Menu）
      - Role 需求（哪些角色可存取）
      - MenuRole 對應
      - 其他權限表（依專案慣例）
         ↓
[AI]  讀 test_cases.md → 抽測試資料需求
      - 逐條解析「前置條件」欄位
      - 歸納需要的客戶 / 產品 / 訂單 / 發票等資料
      - 標註資料之間的依賴（如 C001 要先存在才能建 AR-001）
      - 用特徵碼區分手測資料（如 creator='e2e_seed' 或 createdBy='AI_SEED_{程式編號}'）
         ↓
[AI]  讀 current_schema_{程式編號}.md → 對齊欄位
      - schema 來源 = spec-p2 MCP DESCRIBE 產出的 dump（不再讀 Docs/DDL/*.sql）
      - 確認每張表的必填欄位、外鍵依賴
      - 缺檔 → STOP 回報 PG,回 P2 補 current_schema（不可自行 fallback 讀 DDL 或從 sibling code 推）
      - 發現 schema 與規格不一致時 STOP 回報
         ↓
[STOP] Scope Statement（見 scope-statement.md）
      - Deliverable / 預期動到 / out-of-scope
      - PG 確認 scope 後才進產 SQL
         ↓
[AI]  產出 SQL 檔案
      - Docs/Permission/{程式編號}_PERMISSION.sql
      - Docs/spec/{程式編號}/log/{程式編號}_SEED.sql （或專案慣例位置）
         ↓
[STOP] SG1: PG 審 SQL
      - 權限表設計合不合理
      - seed 資料量是否足以涵蓋 test_cases 每條 case
      - 特徵碼是否便於 cleanup
      - 欄位對齊是否正確
         ↓
[STOP] SG2: PG 授權執行
      - PG 明示「可執行」才進下一步
      - AI 不自主執行 SQL
         ↓
[AI]  執行 SQL
      - 跑 PERMISSION.sql / SEED.sql：走 mysql CLI（PG 授權後；INSERT/UPDATE/DELETE 不走 MCP,MCP 唯讀）
      - 對帳：走 MCP read-only SELECT COUNT(*),驗證筆數符合預期（避免 mysql CLI escape 風險）
      - 任何錯誤 → STOP 回報 PG,不自主修
         ↓
[AI]  append session_log（artifact 合一,見 commit-rules.md）
      - 本 session 章節（決策 / 教訓 / 下 session 注意）
      - 若為 P3 最後一段 → 同步 append「## 維護期 hand-off」段（見 completion-and-handoff.md）
[AI]  commit: SQL 檔 + session_log.md（不 commit 執行結果）
         ↓
[AI]  完工報告（純 console,不寫檔,見 completion-and-handoff.md）
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取輸入材料：**
   - `Docs/spec/{程式編號}/{程式編號}_規格統計_最終版.md`
   - `Docs/spec/{程式編號}/plan/{程式編號}_test_cases.md`
   - 專案 `CLAUDE.md` 索引 → 讀權限 / seed 規範（若有）
4. **讀 DB schema（來源 = `current_schema_{程式編號}.md`）：**
   - 載入 `Docs/spec/{程式編號}/plan/current_schema_{程式編號}.md`（spec-p2 透過 MCP MySQL 唯讀 DESCRIBE 產出）
   - 確認每張相關表的欄位、必填、外鍵；以此檔為唯一 schema 權威來源
   - **不再讀 `Docs/DDL/*.sql`**；不可從 sibling code 推 schema（對齊 spec-p2 / spec-p3-backend）
   - **若 `current_schema_{程式編號}.md` 缺檔 → STOP 回報 PG**,回 P2 跑 `/tasking` 補（不可自行 fallback）
   - 若 PG 懷疑 dump stale（P2 後 DB 有變動）→ 可透過 MCP 對特定表重跑 `DESCRIBE` 確認,發現差異 → STOP 由 PG 決定（更新 dump 或改實作）
   - **若 schema 與規格不一致 → STOP 回報 PG**（不自主補 schema）
   - **[STOP] Scope Statement（動手前必跑）**：依 [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md) 報告 Deliverable / 預期動到 / out-of-scope,PG 確認後才進入步驟 5 抽權限需求
5. **抽權限需求：**
   - 從規格統計抽 Menu / Role / MenuRole 定義
   - 產出 `{程式編號}_PERMISSION.sql`
6. **抽測試資料需求：**
   - 逐條解析 test_cases.md 的「前置條件」欄位
   - 歸納客戶 / 產品 / 訂單 / 發票 / 等業務資料
   - 確認資料之間的依賴順序（先主後從）
   - 加上特徵碼（createdBy / creator 等）,便於日後清理
   - 產出 `{程式編號}_SEED.sql`
7. **[STOP] SG1 — 審 SQL：**
   - 報告：權限筆數、seed 覆蓋的 test_cases 數、特徵碼設計
   - PG 審閱後可修 SQL 內容
8. **[STOP] SG2 — 授權執行：**
   - AI 明示「請 PG 授權執行 PERMISSION.sql + SEED.sql」
   - PG 可選擇：自己跑 / AI 跑
   - 若 AI 跑,需 PG 明確授權
9. **執行 SQL（若授權）：**
   - **寫入路徑（PERMISSION.sql / SEED.sql）走 mysql CLI**：MCP 唯讀,INSERT/UPDATE/DELETE 不可走 MCP；PG 授權後 AI 透過 `mysql ... < {程式編號}_PERMISSION.sql` / `< {程式編號}_SEED.sql` 執行
   - **對帳路徑走 MCP read-only**：每張表跑 `SELECT COUNT(*) FROM {table} WHERE {特徵碼條件}`,避免 mysql CLI 對中文 / 特殊字元 escape 出錯
   - 報告筆數 vs 預期
   - **任何錯誤 → STOP 回報 PG,不自主修**（可能是 DB schema 漂移、權限不足、外鍵失敗等）
   - **MCP 連線失敗時**：對帳 fallback 走 mysql CLI（明示告知 PG,記錄於 session_log「下 session 注意」）；寫入本來就走 mysql CLI 不受影響
10. **Append session_log + Commit SQL 檔（artifact 合一,見 [`commit-rules.md`](../../spec-workflow-refs/p3/commit-rules.md)）：**
    - **先 append** `Docs/spec/{程式編號}/log/{程式編號}_session_log.md`（格式見 [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md)）：
      - 本 session 章節（關鍵決策 / 問題與教訓 / 下 session 注意）
      - **若為 P3 完整流程的最後一段**（backend / frontend / data 都跑完）→ 同步 append 「## 維護期 hand-off」段（見 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)）
    - **再 commit**：SQL 檔 + session_log.md 一起
      - `docs({程式編號}): add permission + seed SQL`
      - SQL 檔放專案慣例位置（如 `Docs/Permission/` 與 `Docs/spec/{程式編號}/log/` 或依 CLAUDE.md 指引）
      - **不獨立 commit** session_log
11. **完工報告（SKILL 完工判定）：** 依 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)
    - 確認完工三條件全成立（SQL 產出 + 對帳通過 + hand-off append）
    - 產收尾報告（純 console,不另開 commit）：權限筆數、seed 覆蓋的 test_cases 數、COUNT 對帳結果（每張表筆數 vs 預期）、hand-off 初稿摘要、建議 PG 開瀏覽器照 `{程式編號}_test_cases.md` 逐條手測

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG0 | 步驟 4「讀 schema」末尾 | **Scope Statement**（見 [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md)）| **不可省略** |
| SG1 | SQL 產出後 | PG 審權限設計 + seed 覆蓋度 + schema 對齊（讀 `current_schema_{程式編號}.md`） | **不可省略** |
| SG2 | 執行前 | PG 授權執行 SQL（**寫入走 mysql CLI**；**對帳走 MCP read-only**）| **不可省略**（DB 寫入不可回復）|

## 關鍵防護機制

1. **schema 不一致不自主補** — 若 DB schema 與規格不符,STOP 回報 PG,不自行 ALTER TABLE（改 Entity 還是補 schema 由 PG 決定）。
2. **執行需 SG2 授權** — DB 寫入不可回復,AI 不自主執行。
3. **特徵碼分離** — seed 資料必須帶特徵碼（如 `creator='e2e_seed'` 或 `createdBy='AI_SEED_{程式編號}'`）,與 spec 寫入資料分離,便於日後清理。
4. **執行錯誤不自主修** — DB 錯誤（外鍵失敗、權限不足、欄位類型不符）通常牽涉環境 / schema 設計,STOP 報告由 PG 決定。
5. **MCP 必須唯讀** — MCP MySQL server 僅可 `DESCRIBE` / `SELECT`；production DB 絕對不掛 MCP；INSERT/UPDATE/DELETE **一律走 mysql CLI**,不可透過 MCP 嘗試寫入（即便 dev DB）。
6. **Schema 來源 = `current_schema_{程式編號}.md`** — 此檔由 spec-p2 MCP DESCRIBE 產出；spec-p3-data 不再讀 `Docs/DDL/*.sql`,不從 sibling code 推 schema；缺檔 STOP 回 P2 補（對齊 spec-p2 / spec-p3-backend 跨 SKILL 一致原則）。
7. **對帳走 MCP,寫入走 mysql CLI** — 兩條路徑分明：`SELECT COUNT(*)` 對帳走 MCP read-only（避免 mysql CLI 對中文 / 特殊字元 escape）；INSERT 寫入走 mysql CLI（MCP 無寫權限）。
8. **共用防護**（artifact 合一 commit、Scope-lock、SKILL 完工三條件）— 詳見上方「共用規約」連結。

## 核心原則

1. **權限 + 測資是為手測服務** — 目的是讓 PG 能照 test_cases.md 跑完整流程。
2. **DB infra 由 PG 維護** — dev server / DB 啟動維護 AI 不負責。
3. **schema 漂移 STOP 報告** — 不自行修改 DDL。
4. **執行需授權** — SG2 明示授權後才跑 SQL。
5. **MCP 唯讀,寫入走 mysql CLI** — `DESCRIBE` 補驗與 `SELECT COUNT(*)` 對帳走 MCP read-only；PERMISSION / SEED 的 INSERT 走 mysql CLI（PG 授權後）；production DB 絕對不掛 MCP。
6. **Schema 來源唯一化** — `current_schema_{程式編號}.md` 為 schema 對齊權威來源（spec-p2 / spec-p3-backend / spec-p3-data 三 SKILL 共用）；不讀 `Docs/DDL/*.sql`、不推 sibling code。
7. **模型分層** — 預設 **Sonnet 級模型即可執行**（SG1 審 SQL + SG2 授權執行兩道 gate 已擋）；跨表外鍵依賴複雜時 PG 可升最強可用模型。

## SKILL 回饋

使用中發現的流程問題,記錄到 target repo `.user/SPEC_WORKFLOW_IMPROVEMENTS.md`（格式：問題 → 證據 → 建議 → 目標 skill）,累積後統一 review 落地,不即時改 SKILL。
