---
name: spec-p3-data
description: 權限 SQL + 測試資料 SQL 產出與執行 SKILL：讀最終版規格統計 + test_cases.md 前置條件 + DB schema，產 permission SQL 和 seed SQL，PG 授權後執行。觸發於 /data 或提到 permission、seed、測試資料、權限 SQL 等關鍵字。
---

# Spec P3 Data — 權限與測試資料準備

在專案 repo 目錄下執行，讀取 `{程式編號}_規格統計_最終版.md`（抽權限需求）與 `{程式編號}_test_cases.md`（抽前置條件 → 測試資料需求），產出 permission SQL 與 seed SQL，PG 審閱後執行。

## 定位

- **輸入：**
  - `{程式編號}_規格統計_最終版.md`（權限定義、Menu / Role 需求）
  - `{程式編號}_test_cases.md`（前置條件 → 測試資料需求）
  - DB schema（欄位對齊）
- **輸出：**
  - `{程式編號}_PERMISSION.sql`（Menu / Role / MenuRole 等）
  - `{程式編號}_SEED.sql`（依 test_cases 前置條件產 INSERT）
  - 執行結果驗證（COUNT 對帳）
- **時機：** P3 實作完成後、PG 手測前。非必須（若 PG 打算在 UI 一邊建資料一邊測可以跳過）。
- **SKILL 邊界：** 本 SKILL 結束點 = SQL 產出 + PG 授權執行 + COUNT 對帳通過 + 維護期 hand-off append（見步驟 11「完工三條件」）。**不負責**整合手測、手測發現的 bug 修復、seed 資料殘留 cleanup、上線部署；後續發現的 bug 走 ad hoc 派修，**不寫入 `progress.md` / `session_log.md`**（避免文件膨脹失焦）。

## 觸發方式

- `/data` — 顯示流程說明並開始
- `/data <程式編號>` — 直接帶入程式編號

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_test_cases.md`
2. 已完成 P3 `spec-p3-backend` + `spec-p3-frontend`（實作可運行）
3. 專案 `CLAUDE.md` 索引有指向 permission / seed 規範（若有）
4. Dev DB 可連線（PG 啟動與維護，本 SKILL 不負責 infra）

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
[AI]  讀 DB schema → 對齊欄位
      - 確認每張表的必填欄位
      - 確認外鍵依賴
      - 發現 schema 與規格不一致時 STOP 回報（如 AR003 踩過的 AR_RECORDS 只有 15 欄但 Entity 假設 17 欄）
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
      - 跑 PERMISSION.sql
      - 跑 SEED.sql
      - 對帳：SELECT COUNT(*) 每張表，驗證筆數符合預期
      - 任何錯誤 → STOP 回報 PG，不自主修
         ↓
[AI]  append session_log（artifact 合一）
      - 本 session 章節（決策 / 教訓 / 下 session 注意）
      - 若為 P3 最後一段 → 同步 append「## 維護期 hand-off」段
        （AI 歸納初稿：上線前必補 / 技術債兩類，PG 修）
[AI]  commit: SQL 檔 + session_log.md（不 commit 執行結果）
         ↓
[AI]  完工報告（純 console，不寫檔）
      - 完工三條件：SQL 產出 / 對帳通過 / hand-off append
      - hand-off 初稿摘要，提醒 PG 過目
      - 建議 PG：開瀏覽器照 test_cases.md 逐條手測
      - SKILL 邊界：手測發現 bug → ad hoc 派修，不寫 progress / session_log
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取輸入材料：**
   - `Docs/spec/{程式編號}/{程式編號}_規格統計_最終版.md`
   - `Docs/spec/{程式編號}/plan/{程式編號}_test_cases.md`
   - 專案 `CLAUDE.md` 索引 → 讀權限 / seed 規範（若有）
4. **讀 DB schema：**
   - 讀專案 DDL 檔案（路徑由 `CLAUDE.md` 指向）
   - 確認每張相關表的欄位、必填、外鍵
   - **若 schema 與規格不一致 → STOP 回報 PG**（不自主補 schema）
5. **抽權限需求：**
   - 從規格統計抽 Menu / Role / MenuRole 定義
   - 產出 `{程式編號}_PERMISSION.sql`
6. **抽測試資料需求：**
   - 逐條解析 test_cases.md 的「前置條件」欄位
   - 歸納客戶 / 產品 / 訂單 / 發票 / 等業務資料
   - 確認資料之間的依賴順序（先主後從）
   - 加上特徵碼（createdBy / creator 等），便於日後清理
   - 產出 `{程式編號}_SEED.sql`
7. **[STOP] SG1 — 審 SQL：**
   - 報告：權限筆數、seed 覆蓋的 test_cases 數、特徵碼設計
   - PG 審閱後可修 SQL 內容
8. **[STOP] SG2 — 授權執行：**
   - AI 明示「請 PG 授權執行 PERMISSION.sql + SEED.sql」
   - PG 可選擇：自己跑 / AI 跑
   - 若 AI 跑，需 PG 明確授權
9. **執行 SQL（若授權）：**
   - 跑 PERMISSION.sql
   - 跑 SEED.sql
   - 對帳：`SELECT COUNT(*) FROM 每張表 WHERE 特徵碼`
   - 報告筆數 vs 預期
   - **任何錯誤 → STOP 回報 PG，不自主修**（可能是 DB schema 漂移、權限不足、外鍵失敗等）
10. **Append session_log + Commit SQL 檔（artifact 合一）：**
    - **先 append** `Docs/spec/{程式編號}/log/{程式編號}_session_log.md`：
      - 本 session 章節（關鍵決策 / 問題與教訓 / 下 session 注意）
      - **若為 P3 完整流程的最後一段**（backend / frontend / data 都跑完）→ 同步 append 「## 維護期 hand-off」段（見步驟 11 詳述）；初稿由 AI 自動歸納
    - **再 commit**：SQL 檔 + session_log.md 一起
      - `docs({程式編號}): add permission + seed SQL`
      - SQL 檔放專案慣例位置（如 `Docs/Permission/` 與 `Docs/spec/{程式編號}/log/` 或依 CLAUDE.md 指引）
      - **不獨立 commit** session_log
11. **完工報告（SKILL 完工判定）：**

    **完工三條件**（全部成立才算 SKILL 結束）：
    - (1) `PERMISSION.sql` + `SEED.sql` 已產出
    - (2) PG 已授權執行 + COUNT 對帳通過（若 PG 選自己跑，則 PG 回報「跑完且對帳 OK」）
    - (3) 維護期 hand-off 已 append 至 `session_log.md`（若本批為 P3 最後一段）

    **維護期 hand-off**（在步驟 10 的 commit 範圍內 append，**已於步驟 10 完成**）：
    - 寫入固定段「`## 維護期 hand-off`」（格式見 `spec-p3-backend` SKILL Session Log 範例）
    - 兩類分項（data 常見內容）：
      - **上線前必補（blocker）**：未產的 PERMISSION 角色待 PG 與 SA 確認後補、seed 覆蓋不到的 test_cases 條目（PG 需手動建）、執行錯誤未解項目
      - **技術債（non-blocker）**：seed 特徵碼 cleanup 指令、依賴的外部資料（如 GL 設定）未驗、未來 seed 量擴充候選
    - 初稿來源：SG1 報告中提到的「seed 覆蓋率」「schema 不一致」、執行錯誤、PG 在 SG1/SG2 提出但本批未處理的擴充項
    - 每項註明來源：`{步驟 / SQL 區段}：{描述}`
    - **若無項目可歸納 → 兩類都列「（無）」，不可省略段落**

    **收尾報告（純 console，不另開 commit）：**
    - 權限筆數、seed 覆蓋的 test_cases 數
    - COUNT 對帳結果（每張表筆數 vs 預期）
    - hand-off 初稿摘要（提醒 PG 過目修改）
    - 建議 PG：開瀏覽器照 `{程式編號}_test_cases.md` 逐條手測

    **SKILL 邊界**（完工後不入本 SKILL 的事，落到此 SKILL 之外）：
    - 整合手測（PG 開瀏覽器跑 test_cases）
    - 手測發現的 bug 修復 → ad hoc 派 AI 修，**不寫入 `progress.md` / `session_log.md`**
    - seed 資料殘留 cleanup（特徵碼提供，cleanup 由 PG 或 ad hoc 自行執行）
    - 上線部署、生產 DB 權限佈署

12. **Session 歸檔**

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | SQL 產出後 | PG 審權限設計 + seed 覆蓋度 | **不可省略** |
| SG2 | 執行前 | PG 授權執行 SQL | **不可省略**（DB 寫入不可回復）|

## 關鍵防護機制

1. **schema 不一致不自主補** — 若 DB schema 與規格不符，STOP 回報 PG，不自行 ALTER TABLE（對齊 AR003 教訓：Entity 假設 17 欄但 DDL 只有 15 欄的事件，必須 PG 決定是改 Entity 還是補 schema）。
2. **執行需 SG2 授權** — DB 寫入不可回復，AI 不自主執行。
3. **特徵碼分離** — seed 資料必須帶特徵碼（如 `creator='e2e_seed'` 或 `createdBy='AI_SEED_{程式編號}'`），與 spec 寫入資料分離，便於日後清理。
4. **執行錯誤不自主修** — DB 錯誤（外鍵失敗、權限不足、欄位類型不符）通常牽涉環境 / schema 設計，STOP 報告由 PG 決定。

## 核心原則

1. **權限 + 測資是為手測服務** — 目的是讓 PG 能照 test_cases.md 跑完整流程。
2. **DB infra 由 PG 維護** — dev server / DB 啟動維護 AI 不負責。
3. **schema 漂移 STOP 報告** — 不自行修改 DDL。
4. **執行需授權** — SG2 明示授權後才跑 SQL。

## Session 歸檔

檔名：`{程式編號}-P3-data_{yyyyMMdd}_{HHmm}`
同 p3-backend / p3-frontend 的歸檔流程。

## SKILL 本身改進建議

PG 使用此 SKILL 發現的改進建議，寫到 `~/.soetek-ai-coding/skill-feedback/spec-p3-data.md`。
