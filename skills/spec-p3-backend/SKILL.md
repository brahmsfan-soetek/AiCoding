---
name: spec-p3-backend
description: 後端 TDD 驅動實作 SKILL：讀 P2 的 backend_tasks.md + 專案 CLAUDE.md，以 task 類型 tag 分流測試 / 對照策略（validator 完整 TDD；processor 走 api_contract A## + current_schema 雙對照表審,無 mock-based 單元測試；sql/entity/spi 對照 current_schema 後寫實作無測試）。觸發於 /impl-be 或提到後端實作、backend impl 等關鍵字。
---

# Spec P3 Backend — 後端 TDD 實作

在專案 repo 目錄下執行,讀取 P2 產的 `{程式編號}_backend_tasks.md` 與專案 `CLAUDE.md`,依 task 類型 tag 分流測試策略,以 TDD 迴圈實作 + 單元測試。

## 共用規約（動手前必讀）

本 SKILL 與 `spec-p3-frontend` / `spec-p3-data` 共用以下規約,引用自 `<repo>/spec-workflow-refs/p3/`（相對本檔路徑 `../../spec-workflow-refs/p3/`）：

- [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md) — SG1 動手前 scope-lock（切入點 7）
- [`commit-rules.md`](../../spec-workflow-refs/p3/commit-rules.md) — artifact 合一 commit + 標題禁 task id
- [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md) — Subagent 不產 git 檔 + 讀規範不掃 code
- [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md) — 完工三條件 + 維護期 hand-off + SKILL 邊界
- [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md) — progress.md / session_log.md 格式（含維護期 hand-off 範例）
- [`session-archive.md`](../../spec-workflow-refs/p3/session-archive.md) — Session 歸檔流程
- [`commit-hook/README.md`](../../spec-workflow-refs/p3/commit-hook/README.md) — commit-time hook 設計脈絡（切入點 8）

## 定位

- **輸入：** P2 產的 `{程式編號}_backend_tasks.md` + `{程式編號}_api_contract.md`（FE/BE 共讀契約）+ `current_schema_{程式編號}.md`（真實 DB schema dump）+ 專案 `CLAUDE.md`
- **輸出：** 後端實作 code + git commits（單元測試僅限 `[validator]`；`[processor]` / `[sql]` / `[entity]` / `[spi]` 無單元測試,走 SG2 對照表）
- **測試 / 對照定位：** `[validator]` 單元測試做開發 feedback loop（純函式邊界 + 演算法）；`[processor]` 不寫 mock-based 單元測試（套套邏輯、ROI 低）,改走 SG2 雙對照表（api_contract A## + current_schema）作為靜態 feedback loop；真正的整合驗證由 PG 手測涵蓋（`spec-p3-data` 產 seed 後走 test_cases.md）。
- **Schema 與契約來源：** Entity / SQL / DDL 一律以 `current_schema_{程式編號}.md` 為準（不再讀 `Docs/DDL/*.sql`）；Processor response shape 一律以 `{程式編號}_api_contract.md` 對應的 A## 小節為準。
- **與 P3-frontend 的關係：** 本 SKILL 只處理後端 task；前端另起 session 用 `/impl-fe`。兩 session 共用同一份 `progress.md` 與 `session_log.md`（task prefix `B*` / `F*` 區分）,共用同一份 `api_contract.md`。
- **SKILL 邊界：** 詳見共用 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)。本 SKILL 結束點 = 後端 task 全部 done + 收尾報告 + 維護期 hand-off append。

## 觸發方式

- `/impl-be` — 顯示流程說明並開始
- `/impl-be <task-list-path>` — 直接帶入後端任務清單路徑

## 前置條件

1. 已完成 P2 `spec-p2-tasking`,產出 `{程式編號}_backend_tasks.md`（每個 task 已標類型 tag、`[processor]` 類已填「選填欄位」清單、Processor task 已對應到 `api_contract.md` 的 A## 小節）
2. P2 同批產出的 `{程式編號}_api_contract.md` 與 `current_schema_{程式編號}.md` 存在於 `Docs/spec/{程式編號}/plan/`（若缺 → 必須回頭執行 `/tasking` 補完,不可自行從 sibling code 推 schema）
3. 專案有 `CLAUDE.md` 索引（指向測試框架、lint、typecheck、commit 規範、backend 目錄結構等）

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[validator]` | **完整 TDD**（JUnit 純或 Mockito,Red-Green 迴圈） | 純函式 / 演算法 / 狀態機 |
| `[processor]` | **無 mock-based 單元測試**；SG2 走 api_contract A## + current_schema 雙對照（靜態檢查） | Processor mock test 是「mock 設成預期再驗自己」的套套邏輯,token 高 ROI 低；整合驗證由 PG 手測涵蓋 |
| `[sql]` | **無 P3 測試**；SG2 對照 current_schema 欄位 / 型別 | SQL 行為由手測涵蓋（PG 照 test_cases.md 對）|
| `[entity]` | **無測試**；SG2 對照 current_schema 欄位 / 型別 / nullable | 純 POJO,無邏輯 |
| `[spi]` | **無測試** | 抽象介面,無邏輯 |

## 設計原則

1. **半自動** — 每個 task 前 stop gate 確認,完成後問要不要繼續。
2. **類型 tag 驅動** — 不再問「測 Mockito 還是 Quarkus」,tag 決定策略。
3. **其他共用規約** — Subagent 邊界、artifact 合一 commit、commit 標題禁 task id、讀規範不掃 code,詳見上方「共用規約」連結。

## Execution Flow

```
/impl-be [task-list-path]
         ↓
[AI]  讀 backend_tasks.md + CLAUDE.md 索引 → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈（validator N / processor M / sql K / entity J / spi I）
[STOP] SG1: PG 確認 Scope Statement（見 scope-statement.md）、載入、類型分佈、
            commit-time hook 安裝（見 commit-hook/README.md）、起始 task
         ↓
┌─── 每個 task loop ─────────────────────────┐
│  [AI]  讀當前 task + 類型 tag                │
│                                              │
│  分支依類型 tag：                             │
│  ┌─[validator] 分支───────────────────────┐  │
│  │  [AI]  列單元測試清單                 │  │
│  │  [STOP] SG2: PG 快審測試清單         │  │
│  │  [AI]  寫測試 → 跑測試 (Red)          │  │
│  │  [AI]  寫實作 → 跑測試 (Green)        │  │
│  │  [AI]  lint + typecheck               │  │
│  │  [AI]  git diff 自檢測試檔            │  │
│  │        若斷言被改 → 明示 PG           │  │
│  └────────────────────────────────────────┘  │
│  ┌─[processor] 分支───────────────────────┐  │
│  │  [AI]  列雙對照表：                   │  │
│  │        (1) api_contract A## ↔ 預計    │  │
│  │            實作 response shape         │  │
│  │        (2) current_schema 涉及表 ↔    │  │
│  │            SQL/Entity 引用欄位 / 型別 │  │
│  │  [STOP] SG2: PG 審雙對照表           │  │
│  │         （契約 + schema 對齊防護,    │  │
│  │           不可省略）                  │  │
│  │  [AI]  寫實作（無單元測試）           │  │
│  │  [AI]  lint + typecheck               │  │
│  │  [AI]  自檢實作 response shape 是否   │  │
│  │        偏離 api_contract；偏離 → 停手 │  │
│  └────────────────────────────────────────┘  │
│  ┌─[sql] / [entity] / [spi] 分支─────────┐   │
│  │  [AI]  寫實作（無測試）               │   │
│  │        [sql]/[entity] 對照 current_   │   │
│  │        schema 欄位 / 型別 / nullable  │   │
│  │  [AI]  lint + typecheck               │   │
│  └────────────────────────────────────────┘   │
│                                              │
│  [AI]  更新 progress.md（state + commit hash）│
│  [AI]  若為最後一個 task → append session_log │
│  [AI]  commit: code + progress.md             │
│        (+ session_log.md 若為最後一個 task)   │
│        （commit 規約見 commit-rules.md）     │
│  [STOP] SG3: PG 審閱 → 繼續/回修              │
│         （可降密度：每 N task 一次）          │
└──────────────────────────────────────────────┘
         ↓
[AI]  完工判定（見 completion-and-handoff.md 完工三條件）
[AI]  收尾報告（純 console,不另開 commit）
[AI]  Session 歸檔（見 session-archive.md）
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單、共讀契約、schema 與專案 context：**
   - 讀取 `{程式編號}_backend_tasks.md`（自動辨識或 PG 指定）
   - 讀取 `{程式編號}_api_contract.md` — Processor response shape 對齊基準（每支 API 一個 A## 小節）
   - 讀取 `current_schema_{程式編號}.md` — Entity / SQL / DDL 檢核的唯一 schema 來源
     - 若這兩份缺失 → 中止流程,告知 PG 需回 `/tasking` 補；**不可從 `Docs/DDL/*.sql` 或 sibling Java/SP code 推 schema**（AR003 BUG-A1 教訓）
   - 讀取專案 `CLAUDE.md` 索引 → 讀取規範文件,取得：
     - 後端測試框架與執行指令（JUnit / Mockito / Testcontainers / etc.）
     - Lint / typecheck 指令
     - Commit 規範
     - 後端目錄結構、Entity / Processor / Validator 命名慣例
   - **不掃 code 歸納 pattern**（詳見 [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md)）
4. **檢查 checkpoint（resume 偵測）：**
   - 檢查 `Docs/spec/{程式編號}/log/{程式編號}_progress.md` 是否存在（格式見 [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md)）
   - 若存在 → 讀取進度,向 PG 報告已完成 / wip / todo 的 **後端** task 摘要（前綴 `B*`）,詢問是否從上次繼續
     - 若有 `F*` task 已在進行中,提示「前端 session 另走 /impl-fe」
   - 若不存在 → 建立空檔（同步建 `session_log.md`）
5. **[STOP] SG1 — Scope Statement + 確認載入 + hook 安裝：**
   - **Scope Statement（首要子段,動手前必跑）**：依 [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md) 報告 Deliverable / 預期動到 / out-of-scope,PG 確認後才繼續
   - 報告：已載入的 backend_tasks.md、api_contract.md（{N} 支 API）、current_schema_{程式編號}.md（{M} 張表）、規範文件清單、測試/lint/typecheck 指令
   - **報告 task 類型分佈**：validator N 支 / processor M 支（含選填欄位總數 + 對應 api_contract A## 清單）/ sql K 支 / entity J 支 / spi I 支
   - **報告 Entity / SQL task 涉及的表是否都在 current_schema 中找到**；若有表缺失 → 告知 PG 需回 `/tasking` 補
   - **檢查 commit-time hook**：依 [`commit-hook/README.md`](../../spec-workflow-refs/p3/commit-hook/README.md) 偵測 target project `.claude/settings.local.json` / `.claude/settings.json`
     - **已裝** → 報告「✓ hook 已安裝」
     - **未裝** → 報告「⚠️ commit-time hook 未安裝；切入點 8 落地：每次 `git commit` 自動跑 `mvn -pl <staged-modules> -am test`,失敗 block commit 並要求 AI 通知 PG（不自動修）」,引用 `commit-hook/README.md` 給 PG 看設計脈絡（含 PostToolUse Edit/Write 撤回理由與三 spike 替代設計）,詢問 PG：
       - (a) 安裝 spike 3（typecheck + module test,預設推薦）→ SKILL：
         - 複製 `<skill-dir>/templates/hooks/typecheck-test-on-commit.ps1` 到 target `.claude/hooks/`
         - 讀 target `.claude/settings.local.json`（無則建空 JSON）→ 用 ConvertFrom-Json / ConvertTo-Json 合併 `<spec-workflow-refs>/p3/commit-hook/settings.local.json.tmpl` 的 PreToolUse 區塊（保留現有 `permissions` 等）→ 寫回
         - 報告：file watcher 自動 reload,下次 `git commit` 即觸發；`/hooks` 可確認 load 狀態
       - (b) 跳過 → 本 session 不再詢問；PG 可日後手動裝
       - (c) Spike 1（typecheck only）/ Spike 2（+ checkstyle）替代設計 → 按 README 骨架自行調整
     - hook 寫入 `.claude/settings.local.json`（gitignored,個人試用）,不寫共用 `.claude/settings.json`
   - 若為 resume → 額外報告上次進度摘要與未解決 warning
   - 詢問 PG：從哪個 task 開始？
6. **Task Loop（每個 task）：**
   a. 讀取當前 task 內容 + 類型 tag
   b. **依類型 tag 分支：**

      **若為 `[validator]`：**
      - 列出單元測試清單（測什麼、測幾個 case）
      - **[STOP] SG2 — 測試清單快審：**
        - 向 PG 展示「AI 打算測什麼」
        - **不可省略**；PG 可增減測試項目
      - 寫測試 → 跑測試,確認 Red
      - 寫實作 → 跑測試,確認 Green
      - lint + typecheck
      - `git diff` 自檢測試檔：若 Red→Green 過程中斷言被修改 → 明確告知 PG（test-to-fit 風險）

      **若為 `[processor]`（無單元測試,走雙對照）：**
      - **先載入 api_contract.md 對應的 A## 小節**,列出該 API 的 Response shape（含欄位、型別、巢狀層）
      - **再載入 current_schema_{程式編號}.md 涉及表的小節**,列出 SQL/Entity 預計引用的欄位 / 型別 / nullable
      - 產出**兩張對照表**：
        - 對照表 (1)：`api_contract A## Response 欄位` ↔ `預計實作 response shape` — 欄位名、型別、巢狀層級全對齊
        - 對照表 (2)：`current_schema 表欄位` ↔ `SQL / Entity 引用欄位` — 名稱、型別、nullable 全對齊
      - **[STOP] SG2 — 雙對照表審：**
        - 向 PG 展示兩張對照表（契約對齊 + schema 對齊）
        - **不可省略**；偏離行 PG 必須親自核可
        - 不寫 mock-based 單元測試（AR003 BUG-P4b 全是這類測試沒擋到的；mock 設成預期再驗自己是套套邏輯,token 高 ROI 低）
      - 寫實作（無單元測試）
      - lint + typecheck
      - 自檢：實作 response shape 是否與 api_contract 一致 / SQL/Entity 欄位是否與 current_schema 一致；若實作必須偏離 → **不可自行改契約 / schema**,停下來告知 PG 由 PG 決策（改 code 或 reconcile 文件）

      **若為 `[sql]` / `[entity]` / `[spi]`：**
      - **先載入 current_schema_{程式編號}.md 對應的表小節**,對照欄位名、SQL 型別、nullable、default
      - 寫實作時欄位名與型別必須與 current_schema 一致；發現偏離（如 Entity `@Column.name` 在 current_schema 找不到對應）→ 停下來告知 PG,不自行新增 / rename 欄位
      - 寫實作（無測試）
      - lint + typecheck

   c. **更新 progress.md：** 將當前 task 標 `done` + commit hash（格式見 [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md)）
   d. **若為本 session 預期收尾的最後一個 task** → 同步 append `session_log.md`：
      - 本 session 的「關鍵決策」「問題與教訓」「下 session 注意」區塊
      - **若為本 SKILL 全部後端 task 的最後一個** → 同步 append 「## 維護期 hand-off」段（見 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)）；初稿由 AI 從 progress.md 備註欄、本檔「下 session 注意」、SG2 對照表偏離項自動歸納
   e. **commit：** 依 [`commit-rules.md`](../../spec-workflow-refs/p3/commit-rules.md)：code + progress.md（+ session_log.md,若為最後一個 task）一起 commit；**不獨立 commit** progress / session_log；commit 標題禁含 `B01` / `B40` 等 task id
   f. **[STOP] SG3 — 審閱：**
      - 報告：完成的 task、測試結果、lint/typecheck 結果、git diff 摘要
      - PG 選擇：繼續 / 回修 / 停止
      - 可降密度：PG 可指定「每 N 個 task 停一次」
7. **全部後端 task 完成後（SKILL 完工判定）：** 依 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)
   - 確認完工三條件全成立
   - 在最後一個 task 的 commit 範圍內 append 維護期 hand-off 段
   - 產收尾報告（純 console,不另開 commit）：完成 task 清單、`[validator]` 測試通過數、SG2 偏離 warning、hand-off 初稿摘要、建議 PG 另起 session 執行 `/impl-fe`（前端）或 `/data`
8. **Session 歸檔**（見 [`session-archive.md`](../../spec-workflow-refs/p3/session-archive.md),檔名 `{程式編號}-P3-backend_{yyyyMMdd}_{HHmm}`）

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | **Scope Statement**（見 [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md)）+ 確認載入正確、類型分佈、commit-time hook 安裝狀態（見 [`commit-hook/README.md`](../../spec-workflow-refs/p3/commit-hook/README.md)）、起始 task | 不建議（成本極低）|
| SG2 | `[validator]` 寫測試前 / `[processor]` 寫實作前 | `[validator]` 走測試清單審；`[processor]` 走 api_contract A## + current_schema 雙對照表審 | **不可省略** |
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度（每 N task 一次）|

## 關鍵防護機制

1. **SG2 `[validator]` 測試清單先審、再寫 test code** — 在測試代碼產出之前讓 PG 審「AI 打算測什麼」。
2. **SG2 `[processor]` 雙對照表審** — 寫實作前先列兩張對照表：(1) `api_contract A## Response 欄位` ↔ `預計實作 response shape`；(2) `current_schema 表欄位` ↔ `SQL / Entity 引用欄位`。PG 過了才寫實作。直擊 AR003 BUG-P4b-R4-CONTRACT（4 支 View2 API 欄位與前端不一致 → store 永遠讀 undefined）+ AR003 BUG-A1（規格寫 17 欄、DDL 15 欄、真 DB 也缺 2 欄）。**不寫 mock-based 單元測試**（mock = 預期再驗自己的套套邏輯,AR003 BUG-P4b 全是這類測試沒擋的；用 token 高 ROI 低的安全網換不到實際保護）。
3. **`[sql]` / `[entity]` schema 對齊規則** — 欄位名 / 型別 / nullable 必須對齊 current_schema_{程式編號}.md（對齊 AR003 BUG-A1 教訓）。
4. **契約 / schema 偏離 → 停手** — 實作必須偏離 api_contract 或 current_schema 時,**不可自行改契約 / schema**,必須停下來由 PG 決策。
5. **git diff 對照測試檔 self-check（限 `[validator]`）** — 規避 test-to-fit。`git diff` 是客觀事實,不靠 agent 紀律。
6. **Red-Green 強制順序（限 `[validator]`）** — 寫測試 → 確認失敗 → 寫實作 → 確認通過,不可跳步。
7. **共用防護**（artifact 合一 commit、commit 標題乾淨、Scope-lock、commit-time hook、SKILL 完工三條件）— 詳見上方「共用規約」連結;對應 AR002 / AR003 主輪後 ad hoc 維護期模式、Insight 報告 35 wrong_approach + 12 excessive_changes 觀察、AR002 B03 / AR003 B21 / F11「測試該紅而沒紅」事件。

## 核心原則

1. **讀規範、不掃 code** — 詳見 [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md)。
2. **Schema 來源 = current_schema** — Entity / SQL / DDL 一律以 `current_schema_{程式編號}.md` 為準；不再讀 `Docs/DDL/*.sql`,不從 sibling Java/SP code 推 schema。
3. **Response 對齊 api_contract** — Processor response shape 對齊 `api_contract.md` 對應 A## 小節；偏離 → 停手由 PG 決策,不自行 reconcile 契約。
4. **Subagent 不產出進 git 的檔案** — 詳見 [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md)。
5. **類型 tag 驅動測試 / 對照策略** — 不再逐 task 問「要 Mockito 還是 Quarkus」；`[validator]` 走 TDD,`[processor]` 走雙對照表（無 mock test）,`[sql]/[entity]/[spi]` 走 current_schema 對照。
6. **`[validator]` 單元測試 + `[processor]` 雙對照表 = 開發 feedback loop** — 真正的整合驗證由 PG 手測涵蓋（透過 `test_cases.md`）。Processor mock-based 單元測試本質是套套邏輯（mock 設成預期再驗自己）,AR003 BUG-P4b 全是這類測試沒擋到的；改走靜態對照。
7. **後端與前端分 session** — 共用 progress.md / session_log.md / api_contract.md,但實作不互相影響。

## SKILL 本身改進建議

詳見 [`session-archive.md`](../../spec-workflow-refs/p3/session-archive.md) 「SKILL 本身改進建議」段。對應 feedback 檔：`~/.soetek-ai-coding/skill-feedback/spec-p3-backend.md`。
