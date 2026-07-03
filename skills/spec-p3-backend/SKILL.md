---
name: spec-p3-backend
description: 依 backend_tasks.md 類型 tag 分流後端實作：validator TDD、processor 雙對照＋規則複述、其餘無測試。
---

# Spec P3 Backend — 後端 TDD 實作

在專案 repo 目錄下執行,讀取 P2 產的 `{程式編號}_backend_tasks.md` 與專案 `CLAUDE.md`,依 task 類型 tag 分流測試策略,以 TDD 迴圈實作 + 單元測試。

## 共用規約（動手前必讀）

本 SKILL 與 `spec-p3-frontend` / `spec-p3-data` 共用以下規約,引用自 `<repo>/spec-workflow-refs/p3/`（相對本檔路徑 `../../spec-workflow-refs/p3/`）：

- [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md) — SG1 動手前 scope-lock
- [`commit-rules.md`](../../spec-workflow-refs/p3/commit-rules.md) — artifact 合一 commit + 標題禁 task id
- [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md) — Subagent 不產 git 檔 + 規範權威與 grep 查證邊界
- [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md) — 完工三條件 + 維護期 hand-off + SKILL 邊界
- [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md) — progress.md / session_log.md 格式（含維護期 hand-off 範例）

選配參考（不在必讀範圍）：[`commit-hook/README.md`](../../spec-workflow-refs/p3/commit-hook/README.md)（hook 安裝步驟與替代設計）、[`lightweight-review-prompt.md`](../../spec-workflow-refs/p3/lightweight-review-prompt.md)（邏輯類 task 獨立 review，預設關）、[`hooks/README.md`](../../spec-workflow-refs/p3/hooks/README.md)（測試唯讀 / 成功靜默 hook 範本，未接線）。
各規則的歷史教訓與案例對應集中於 [`rationale.md`](../../spec-workflow-refs/rationale.md)——執行 session 不需讀，維護者查閱用。

## 定位

- **輸入：** P2 產的 `{程式編號}_backend_tasks.md` + `{程式編號}_api_contract.md`（FE/BE 共讀契約）+ `current_schema_{程式編號}.md`（真實 DB schema dump）+ 專案 `CLAUDE.md`
- **輸出：** 後端實作 code + git commits（單元測試僅限 `[validator]`；`[processor]` / `[sql]` / `[entity]` / `[spi]` 無單元測試,走 SG2 對照表）
- **測試 / 對照定位：** `[validator]` 單元測試做開發 feedback loop（純函式邊界 + 演算法）；`[processor]` 不寫 mock-based 單元測試（套套邏輯、ROI 低）,改走 SG2 雙對照表（api_contract A## + current_schema）+ 規則複述（帶規則原文的 task）作為靜態 feedback loop；真正的整合驗證由 PG 手測涵蓋（`spec-p3-data` 產 seed 後走 test_cases.md）。
- **Schema 與契約來源：** Entity / SQL / DDL 一律以 `current_schema_{程式編號}.md` 為準（不再讀 `Docs/DDL/*.sql`）；Processor response shape 一律以 `{程式編號}_api_contract.md` 對應的 A## 小節為準。
- **與 P3-frontend 的關係：** 本 SKILL 只處理後端 task；前端另起 session 用 `/impl-fe`。兩 session 共用同一份 `progress.md` 與 `session_log.md`（task prefix `B*` / `F*` 區分）,共用同一份 `api_contract.md`。
- **SKILL 邊界：** 詳見共用 [`completion-and-handoff.md`](../../spec-workflow-refs/p3/completion-and-handoff.md)。本 SKILL 結束點 = 後端 task 全部 done + 收尾報告 + 維護期 hand-off append。

## 觸發方式

- `/impl-be` — 顯示流程說明並開始
- `/impl-be <task-list-path>` — 直接帶入後端任務清單路徑

## 前置條件

1. 已完成 P2 `spec-p2-tasking`,產出 `{程式編號}_backend_tasks.md`（每個 task 已標類型 tag、`[processor]` 類已填「選填欄位」清單、Processor task 已對應到 `api_contract.md` 的 A## 小節、帶計算 / 比較規則的 task 已附「規則原文」區塊）
2. P2 同批產出的 `{程式編號}_api_contract.md` 與 `current_schema_{程式編號}.md` 存在於 `Docs/spec/{程式編號}/plan/`（若缺 → 必須回頭執行 `/tasking` 補完,不可自行從 sibling code 推 schema）
3. 專案有 `CLAUDE.md` 索引（指向測試框架、lint、typecheck、commit 規範、backend 目錄結構等）

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[validator]` | **完整 TDD**（JUnit 純或 Mockito,Red-Green 迴圈）；task 帶規則原文時測試 case 逐條對應 | 純函式 / 演算法 / 狀態機 |
| `[processor]` | **無 mock-based 單元測試**；SG2 走 api_contract A## + current_schema 雙對照 + 規則複述（靜態檢查） | Processor mock test 是「mock 設成預期再驗自己」的套套邏輯,token 高 ROI 低；整合驗證由 PG 手測涵蓋 |
| `[sql]` | **無 P3 測試**；SG2 對照 current_schema 欄位 / 型別 | SQL 行為由手測涵蓋（PG 照 test_cases.md 對）|
| `[entity]` | **無測試**；SG2 對照 current_schema 欄位 / 型別 / nullable | 純 POJO,無邏輯 |
| `[spi]` | **無測試** | 抽象介面,無邏輯 |

## 設計原則

1. **半自動** — 每個 task 前 stop gate 確認,完成後問要不要繼續。
2. **類型 tag 驅動** — 不再問「測 Mockito 還是 Quarkus」,tag 決定策略。
3. **Session 長度軟提示** — 每完成數個 task 或 session 明顯變長（回應變慢、出錯率升）時,建議 PG `/clear` 後依 progress.md + api_contract / current_schema（SSOT）resume；不設硬性 N、不是 stop gate。
4. **其他共用規約** — Subagent 邊界、artifact 合一 commit、commit 標題禁 task id、規範權威與 grep 查證,詳見上方「共用規約」連結。

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
│  │  [AI]  列兩張對照表 + 規則複述：      │  │
│  │        (1) api_contract A## ↔ 預計    │  │
│  │            實作 response shape         │  │
│  │        (2) current_schema 涉及表 ↔    │  │
│  │            SQL/Entity 引用欄位 / 型別 │  │
│  │        (3) 規則複述（task 帶規則原文  │  │
│  │            或 A## 有「(計算)」欄位時  │  │
│  │            必做）：規則原文 → 預計    │  │
│  │            實作一句話                 │  │
│  │  [STOP] SG2: PG 審對照表 + 規則複述  │  │
│  │         （契約 + schema + 語意對齊,  │  │
│  │           不可省略）                  │  │
│  │  [AI]  寫實作（無單元測試）           │  │
│  │  [AI]  lint + typecheck               │  │
│  │  [AI]  自檢 response shape 與計算邏輯 │  │
│  │        是否偏離；偏離 → 停手          │  │
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
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單、共讀契約、schema 與專案 context：**
   - 讀取 `{程式編號}_backend_tasks.md`（自動辨識或 PG 指定）
   - 讀取 `{程式編號}_api_contract.md` — Processor response shape 對齊基準（每支 API 一個 A## 小節）
   - 讀取 `current_schema_{程式編號}.md` — Entity / SQL / DDL 檢核的唯一 schema 來源
     - 若這兩份缺失 → 中止流程,告知 PG 需回 `/tasking` 補；**不可從 `Docs/DDL/*.sql` 或 sibling Java/SP code 推 schema**
   - 讀取專案 `CLAUDE.md` 索引 → 讀取規範文件,取得：
     - 後端測試框架與執行指令（JUnit / Mockito / Testcontainers / etc.）
     - Lint / typecheck 指令
     - Commit 規範
     - 後端目錄結構、Entity / Processor / Validator 命名慣例
   - **規範權威＝CLAUDE.md 索引；容許 grep/glob 查證既有 code 落地細節，禁止盲目複製歷史 anti-pattern；schema / 契約兩個 SSOT 不可從 code 推**（詳見 [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md)）
4. **檢查 checkpoint（resume 偵測）：**
   - 檢查 `Docs/spec/{程式編號}/log/{程式編號}_progress.md` 是否存在（格式見 [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md)）
   - 若存在 → 讀取進度,向 PG 報告已完成 / wip / todo 的 **後端** task 摘要（前綴 `B*`）,詢問是否從上次繼續
     - 若有 `F*` task 已在進行中,提示「前端 session 另走 /impl-fe」
     - **Resume 錨定 SSOT**：resume 的依據除 progress.md / session_log.md 外,必須重讀 `api_contract.md` 與 `current_schema_{程式編號}.md` 中與待續 task 相關的小節作錨定——不可只基於上次 AI 的產出接著做（防衍生文件取代源頭的語義漂移）
   - 若不存在 → 依 [`progress-and-session-log.md`](../../spec-workflow-refs/p3/progress-and-session-log.md) 的格式建立骨架檔（含表頭與欄位,非空白檔；同步建 `session_log.md`）
5. **[STOP] SG1 — Scope Statement + 確認載入 + hook 安裝：**
   - **Scope Statement（首要子段,動手前必跑）**：依 [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md) 報告 Deliverable / 預期動到 / out-of-scope,PG 確認後才繼續
   - 報告：已載入的 backend_tasks.md、api_contract.md（{N} 支 API）、current_schema_{程式編號}.md（{M} 張表）、規範文件清單、測試/lint/typecheck 指令
   - **報告 task 類型分佈**：validator N 支 / processor M 支（含選填欄位總數 + 對應 api_contract A## 清單）/ sql K 支 / entity J 支 / spi I 支
   - **報告 Entity / SQL task 涉及的表是否都在 current_schema 中找到**；若有表缺失 → 告知 PG 需回 `/tasking` 補
   - **檢查 commit-time hook**（每專案一次性設定,非每 session 重談）：偵測 target `.claude/settings.local.json` 是否已註冊
     - **已裝** → 一行報告「✓ commit-time hook 已安裝」
     - **未裝** → 一行詢問：「安裝 commit-time hook？（commit 時自動跑 staged module 的 typecheck + test,失敗 block 並通知 PG,不自動修;預設裝）」
       - PG 同意（預設）→ 依 [`commit-hook/README.md`](../../spec-workflow-refs/p3/commit-hook/README.md)「安裝」節執行：複製 `<skill-dir>/templates/hooks/typecheck-test-on-commit.ps1` 到 target `.claude/hooks/`,合併 `settings.local.json.tmpl` 的 PreToolUse 區塊到 `.claude/settings.local.json`（gitignored;保留現有 permissions）
       - PG 跳過 → 本 session 不再詢問;替代設計（typecheck-only 等 spike）見同一 README,PG 需要時自行調整
   - 若為 resume → 額外報告上次進度摘要與未解決 warning
   - 詢問 PG：從哪個 task 開始？
6. **Task Loop（每個 task）：**
   a. 讀取當前 task 內容 + 類型 tag
      - **Tag 防呆**：task 無 tag、或 tag 不在集合（validator / processor / sql / entity / spi）→ **STOP 回報 PG**（由 PG 現場補 tag 或回 `/tasking` 修清單）；**不可自行推斷該走哪個分支**
   b. **依類型 tag 分支：**

      **若為 `[validator]`：**
      - 列出單元測試清單（測什麼、測幾個 case）
        - **task 帶「規則原文」區塊時,測試清單必須逐條對應規則原文**（每條規則至少一個 case;對不上的規則明示「未涵蓋」讓 PG 決定）
      - **[STOP] SG2 — 測試清單快審：**
        - 向 PG 展示「AI 打算測什麼」（含規則原文 ↔ 測試 case 對應）
        - **不可省略**；PG 可增減測試項目
      - 寫測試 → 跑測試,確認 Red
        - **Red 的合法失敗原因＝斷言失敗或「未實作」例外**（如 `UnsupportedOperationException`）；**編譯錯誤不算 Red**（測試根本沒跑到,驗證不了任何東西）——先修到可編譯,再確認 Red
      - 寫實作 → 跑測試,確認 Green
        - 若發現實作已先寫完才要補測試（順序顛倒）→ 暫時把 method body 換成 `throw new UnsupportedOperationException()` 補走 Red 再恢復,不可直接跳過 Red
      - lint + typecheck
      - `git diff` 自檢測試檔：若 Red→Green 過程中斷言被修改 → 明確告知 PG（test-to-fit 風險）
      - （選配,預設關）PG 可另開乾淨 session 依 [`lightweight-review-prompt.md`](../../spec-workflow-refs/p3/lightweight-review-prompt.md) 對本 task 做獨立 review

      **若為 `[processor]`（無單元測試,走對照 + 規則複述）：**
      - **先載入 api_contract.md 對應的 A## 小節**,列出該 API 的 Response shape（含欄位、型別、巢狀層）
      - **再載入 current_schema_{程式編號}.md 涉及表的小節**,列出 SQL/Entity 預計引用的欄位 / 型別 / nullable
      - 產出**兩張對照表 + 一段規則複述**：
        - 對照表 (1)：`api_contract A## Response 欄位` ↔ `預計實作 response shape` — 欄位名、型別、巢狀層級全對齊
        - 對照表 (2)：`current_schema 表欄位` ↔ `SQL / Entity 引用欄位` — 名稱、型別、nullable 全對齊
        - **規則複述 (3)**：task 帶「規則原文」區塊、或 A## 有「對應 DB 欄位 = `(計算)`」的欄位時**必做**——逐條列「規則原文（引 task 規則原文欄或 A## 業務說明,逐字）→ 預計實作一句話（**比什麼 key、算什麼式、彙總到哪層**）」。shape 對照對 `(計算)` 欄位是空檢查,語意偏差只能在這段擋
      - **[STOP] SG2 — 對照表 + 規則複述審：**
        - 向 PG 展示兩張對照表與規則複述（契約 + schema + 語意三重對齊）
        - **不可省略**；偏離行與每條規則複述 PG 必須親自核可
        - 不寫 mock-based 單元測試（mock 設成預期再驗自己是套套邏輯,擋不到跨層漂移）
      - 寫實作（無單元測試）
      - lint + typecheck
      - 自檢：實作 response shape 是否與 api_contract 一致 / SQL/Entity 欄位是否與 current_schema 一致 / 計算邏輯是否與 SG2 核可的規則複述一致；若實作必須偏離 → **不可自行改契約 / schema / 規則**,停下來告知 PG 由 PG 決策（改 code 或 reconcile 文件）
      - （選配,預設關）PG 可另開乾淨 session 依 [`lightweight-review-prompt.md`](../../spec-workflow-refs/p3/lightweight-review-prompt.md) 對本 task 做獨立 review

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

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | **Scope Statement**（見 [`scope-statement.md`](../../spec-workflow-refs/p3/scope-statement.md)）+ 確認載入正確、類型分佈、commit-time hook 狀態（一行）、起始 task | 不建議（成本極低）|
| SG2 | `[validator]` 寫測試前 / `[processor]` 寫實作前 | `[validator]` 走測試清單審（含規則原文 ↔ case 對應）；`[processor]` 走雙對照表 + 規則複述審 | **不可省略** |
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度（每 N task 一次）|

## 關鍵防護機制

1. **SG2 `[validator]` 測試清單先審、再寫 test code** — 在測試代碼產出之前讓 PG 審「AI 打算測什麼」；task 帶規則原文時,測試 case 逐條對應規則。
2. **SG2 `[processor]` 對照表 + 規則複述審** — 寫實作前先列 (1) `api_contract A## Response 欄位` ↔ `預計實作 response shape`、(2) `current_schema 表欄位` ↔ `SQL / Entity 引用欄位` 兩張對照表,加 (3) 規則複述（規則原文 → 預計實作一句話）。PG 過了才寫實作。**shape 對照擋跨層漂移,規則複述擋語意偏差**——`(計算)` 欄位 shape 全對仍可能算錯,只有複述能暴露。**不寫 mock-based 單元測試**（mock 設成預期再驗自己是套套邏輯）。
3. **`[sql]` / `[entity]` schema 對齊規則** — 欄位名 / 型別 / nullable 必須對齊 current_schema_{程式編號}.md。
4. **契約 / schema / 規則偏離 → 停手** — 實作必須偏離 api_contract、current_schema 或 SG2 核可的規則複述時,**不可自行改文件**,必須停下來由 PG 決策。
5. **git diff 對照測試檔 self-check（限 `[validator]`）** — 規避 test-to-fit。`git diff` 是客觀事實,不靠 agent 紀律。
6. **Red-Green 強制順序（限 `[validator]`）** — 寫測試 → 確認失敗 → 寫實作 → 確認通過,不可跳步。
7. **共用防護**（artifact 合一 commit、commit 標題乾淨、Scope-lock、commit-time hook、SKILL 完工三條件）— 詳見上方「共用規約」連結；各機制的歷史案例見 [`rationale.md`](../../spec-workflow-refs/rationale.md)。

## 核心原則

1. **規範權威＝CLAUDE.md 索引；容許 grep 查證落地細節** — 禁止盲目複製歷史 anti-pattern；schema / 契約兩個 SSOT 不可從 code 推。詳見 [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md)。
2. **Schema 來源 = current_schema** — Entity / SQL / DDL 一律以 `current_schema_{程式編號}.md` 為準；不再讀 `Docs/DDL/*.sql`,不從 sibling Java/SP code 推 schema。
3. **Response 對齊 api_contract** — Processor response shape 對齊 `api_contract.md` 對應 A## 小節；偏離 → 停手由 PG 決策,不自行 reconcile 契約。
4. **Subagent 不產出進 git 的檔案** — 詳見 [`subagent-boundary.md`](../../spec-workflow-refs/p3/subagent-boundary.md)。
5. **類型 tag 驅動測試 / 對照策略** — 不再逐 task 問「要 Mockito 還是 Quarkus」；`[validator]` 走 TDD,`[processor]` 走對照表 + 規則複述（無 mock test）,`[sql]/[entity]/[spi]` 走 current_schema 對照。
6. **`[validator]` 單元測試 + `[processor]` 對照與複述 = 開發 feedback loop** — 真正的整合驗證由 PG 手測涵蓋（透過 `test_cases.md`）；Processor mock-based 單元測試是套套邏輯,改走靜態對照。
7. **後端與前端分 session** — 共用 progress.md / session_log.md / api_contract.md,但實作不互相影響。
8. **模型分層** — P2 已把判斷寫進清單（tag、規則原文、契約、schema）,本 SKILL 預設 **Sonnet 級模型即可執行**；帶「規則原文」的高歧義 task（`[validator]` / `[processor]`）可升最強可用模型,或維持 Sonnet 並由 PG 在 SG2 規則複述段加倍留意。

## SKILL 回饋

使用中發現的流程問題,記錄到 target repo `.user/SPEC_WORKFLOW_IMPROVEMENTS.md`（格式：問題 → 證據 → 建議 → 目標 skill）,累積後統一 review 落地,不即時改 SKILL。
