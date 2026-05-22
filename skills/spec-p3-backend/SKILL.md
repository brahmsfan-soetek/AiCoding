---
name: spec-p3-backend
description: 後端 TDD 驅動實作 SKILL：讀 P2 的 backend_tasks.md + 專案 CLAUDE.md，以 task 類型 tag 分流測試 / 對照策略（validator 完整 TDD；processor 走 api_contract A## + current_schema 雙對照表審，無 mock-based 單元測試；sql/entity/spi 對照 current_schema 後寫實作無測試）。觸發於 /impl-be 或提到後端實作、backend impl 等關鍵字。
---

# Spec P3 Backend — 後端 TDD 實作

在專案 repo 目錄下執行，讀取 P2 產的 `{程式編號}_backend_tasks.md` 與專案 `CLAUDE.md`，依 task 類型 tag 分流測試策略，以 TDD 迴圈實作 + 單元測試。

## 定位

- **輸入：** P2 產的 `{程式編號}_backend_tasks.md` + `{程式編號}_api_contract.md`（FE/BE 共讀契約）+ `current_schema_{程式編號}.md`（真實 DB schema dump）+ 專案 `CLAUDE.md`
- **輸出：** 後端實作 code + git commits（單元測試僅限 `[validator]`；`[processor]` / `[sql]` / `[entity]` / `[spi]` 無單元測試，走 SG2 對照表）
- **測試 / 對照定位：** `[validator]` 單元測試做開發 feedback loop（純函式邊界 + 演算法）；`[processor]` 不寫 mock-based 單元測試（套套邏輯、ROI 低），改走 SG2 雙對照表（api_contract A## + current_schema）作為靜態 feedback loop；真正的整合驗證由 PG 手測涵蓋（`spec-p3-data` 產 seed 後走 test_cases.md）。
- **Schema 與契約來源：** Entity / SQL / DDL 一律以 `current_schema_{程式編號}.md` 為準（不再讀 `Docs/DDL/*.sql`）；Processor response shape 一律以 `{程式編號}_api_contract.md` 對應的 A## 小節為準。
- **與 P3-frontend 的關係：** 本 SKILL 只處理後端 task；前端另起 session 用 `/impl-fe`。兩 session 共用同一份 `progress.md` 與 `session_log.md`（task prefix `B*` / `F*` 區分），共用同一份 `api_contract.md`。
- **SKILL 邊界：** 本 SKILL 結束點 = 後端 task 全部 done + 收尾報告 + 維護期 hand-off append（見步驟 7「完工三條件」）。**不負責**整合手測、手測發現的 bug 修復、UI 微調、上線部署、維運監控；後續 bug 走 ad hoc 派修，**不寫入 progress.md / session_log.md**（避免文件膨脹失焦）。

## 觸發方式

- `/impl-be` — 顯示流程說明並開始
- `/impl-be <task-list-path>` — 直接帶入後端任務清單路徑

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_backend_tasks.md`（每個 task 已標類型 tag、`[processor]` 類已填「選填欄位」清單、Processor task 已對應到 `api_contract.md` 的 A## 小節）
2. P2 同批產出的 `{程式編號}_api_contract.md` 與 `current_schema_{程式編號}.md` 存在於 `Docs/spec/{程式編號}/plan/`（若缺 → 必須回頭執行 `/tasking` 補完，不可自行從 sibling code 推 schema）
3. 專案有 `CLAUDE.md` 索引（指向測試框架、lint、typecheck、commit 規範、backend 目錄結構等）

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[validator]` | **完整 TDD**（JUnit 純或 Mockito，Red-Green 迴圈） | 純函式 / 演算法 / 狀態機 |
| `[processor]` | **無 mock-based 單元測試**；SG2 走 api_contract A## + current_schema 雙對照（靜態檢查） | Processor mock test 是「mock 設成預期再驗自己」的套套邏輯，token 高 ROI 低；整合驗證由 PG 手測涵蓋 |
| `[sql]` | **無 P3 測試**；SG2 對照 current_schema 欄位 / 型別 | SQL 行為由手測涵蓋（PG 照 test_cases.md 對）|
| `[entity]` | **無測試**；SG2 對照 current_schema 欄位 / 型別 / nullable | 純 POJO，無邏輯 |
| `[spi]` | **無測試** | 抽象介面，無邏輯 |

## 設計原則

1. **半自動** — 每個 task 前 stop gate 確認、完成後問要不要繼續。
2. **Subagent 不產出進 git 的檔案** — 前例教訓（session-791acadc）：subagent 寫程式碼時 prompt 與模板矛盾導致全錯。實作 / 測試 code 必須由主 session 撰寫（需要完整 context + 回饋迴圈）。但跑 lint / typecheck / test 指令、搜尋既有程式碼參考等探索性操作可委託 subagent。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。
4. **Artifact 合一 commit** — progress.md / session_log.md 必須跟著實作 code 一起 commit，**不獨立 commit**。task loop 中：code + progress.md 一起；收尾時：最後一個 task 的 commit 範圍納入 session_log.md（在該 task SG3 前寫好），不在所有 task 結束後另開一個 commit。
5. **commit 標題不含 task id** — `B01` / `B40` / `T12` 等私人代號只放 progress.md 與 session_log.md 內部；commit 標題 / PR title / branch 名一律用語意動詞 + 模組（如 `feat(ar003): add credit calculation`）。task id 可放 commit body 描述，不放標題。
6. **類型 tag 驅動** — 不再問「測 Mockito 還是 Quarkus」，tag 決定策略。

## Execution Flow

```
/impl-be [task-list-path]
         ↓
[AI]  讀 backend_tasks.md + CLAUDE.md 索引 → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈（validator N / processor M / sql K / entity J / spi I）
[STOP] SG1: PG 確認 Scope Statement（Deliverable / 預期動到 / out-of-scope）、載入、類型分佈、
            commit-time hook 安裝（未裝 → 提示安裝 spike 3）、起始 task
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
│  │         （契約 + schema 對齊防護，    │  │
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
│  [STOP] SG3: PG 審閱 → 繼續/回修              │
│         （可降密度：每 N task 一次）          │
└──────────────────────────────────────────────┘
         ↓
[AI]  完工判定（三條件全成立才算 SKILL 結束）
      - (1) 後端 task 全 done
      - (2) 收尾報告產出
      - (3) 維護期 hand-off 已 append 至 session_log（含 AI 初稿，於最後一個 task commit 內）
[AI]  收尾報告（純 console，不另開 commit）
      - 完成 task 清單 / 測試通過數 / SG2 偏離 warning
      - hand-off 初稿摘要，提醒 PG 過目
      - 建議：另起 session 執行 /impl-fe（前端）或 /data
[AI]  SKILL 邊界宣示
      - 整合手測 + bug 修復 + UI 微調 → ad hoc 派修
      - 不寫進 progress.md / session_log.md（避免膨脹失焦）
[AI]  Session 歸檔
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單、共讀契約、schema 與專案 context：**
   - 讀取 `{程式編號}_backend_tasks.md`（自動辨識或 PG 指定）
   - 讀取 `{程式編號}_api_contract.md` — Processor response shape 對齊基準（每支 API 一個 A## 小節）
   - 讀取 `current_schema_{程式編號}.md` — Entity / SQL / DDL 檢核的唯一 schema 來源
     - 若這兩份缺失 → 中止流程，告知 PG 需回 `/tasking` 補；**不可從 `Docs/DDL/*.sql` 或 sibling Java/SP code 推 schema**（AR003 BUG-A1 教訓）
   - 讀取專案 `CLAUDE.md` 索引 → 讀取規範文件，取得：
     - 後端測試框架與執行指令（JUnit / Mockito / Testcontainers / etc.）
     - Lint / typecheck 指令
     - Commit 規範
     - 後端目錄結構、Entity / Processor / Validator 命名慣例
   - **不掃 code 歸納 pattern**
4. **檢查 checkpoint（resume 偵測）：**
   - 檢查 `Docs/spec/{程式編號}/log/{程式編號}_progress.md` 是否存在
   - 若存在 → 讀取進度，向 PG 報告已完成 / wip / todo 的 **後端** task 摘要（前綴 `B*`），詢問是否從上次繼續
     - 若有 `F*` task 已在進行中，提示「前端 session 另走 /impl-fe」
   - 若不存在 → 建立空檔（同步建 `session_log.md`）
5. **[STOP] SG1 — Scope Statement + 確認載入 + hook 安裝：**
   - **Scope Statement（首要子段，動手前必跑）：**
     - **Deliverable**（一句話）：本次預計跑完 `backend_tasks.md` 內哪些 task（全部 / `B01–Bxx` 範圍 / 某類型 tag）+ 對應產出（Entity / SQL / Processor / Validator / SPI）
     - **預期動到的範圍**：列實際清單，如 backend 各層目錄下對應 `{程式編號}*` 檔（含 Entity / Mapper / Repository / Processor / Validator / Test 等）+ `progress.md` / `session_log.md`
     - **明示 out-of-scope**：列「本次不會動」的範圍（如「不改 `current_schema_{程式編號}.md` / `api_contract.md`」「不重構 sibling 程式」「不動 `Docs/DDL`」「不擴張到非 `{程式編號}` task」「不寫前端 code」）
     - **規約**：實作中若發現需超出 scope（如要改契約 / schema / 順手重構） → STOP 回報 PG，PG 決定擴張或縮回；AI 不自行擴張（對齊 Insight 報告 35 wrong_approach + 12 excessive_changes 觀察、AR002Q 加 export feature、AR002 / AR003 順手重構相鄰程式碼等事件）
   - 報告：已載入的 backend_tasks.md、api_contract.md（{N} 支 API）、current_schema_{程式編號}.md（{M} 張表）、規範文件清單、測試/lint/typecheck 指令
   - **報告 task 類型分佈**：validator N 支 / processor M 支（含選填欄位總數 + 對應 api_contract A## 清單）/ sql K 支 / entity J 支 / spi I 支
   - **報告 Entity / SQL task 涉及的表是否都在 current_schema 中找到**；若有表缺失 → 告知 PG 需回 `/tasking` 補
   - **檢查 commit-time hook**（切入點 8 A path）：
     - 偵測 target project `.claude/settings.local.json` / `.claude/settings.json` 是否引用 `typecheck-test-on-commit.ps1`（或其他等效 PreToolUse Bash + git commit filter hook）
     - **已裝** → 報告「✓ hook 已安裝」
     - **未裝** → 報告「⚠️ commit-time hook 未安裝；切入點 8 落地：每次 `git commit` 自動跑 `mvn -pl <staged-modules> -am test`，失敗 block commit 並要求 AI 通知 PG（不自動修）」，引用 `<skill-dir>/templates/hooks/README.md` 給 PG 看設計脈絡（含 PostToolUse Edit/Write 撤回理由與三 spike 替代設計），詢問 PG：
       - (a) 安裝 spike 3（typecheck + module test，預設推薦）→ SKILL：
         - 複製 `<skill-dir>/templates/hooks/typecheck-test-on-commit.ps1` 到 target `.claude/hooks/`
         - 讀 target `.claude/settings.local.json`（無則建空 JSON）→ 用 ConvertFrom-Json / ConvertTo-Json 合併 `settings.local.json.tmpl` 的 PreToolUse 區塊（保留現有 `permissions` 等）→ 寫回
         - 報告：file watcher 自動 reload，下次 `git commit` 即觸發；`/hooks` 可確認 load 狀態
       - (b) 跳過 → 本 session 不再詢問；PG 可日後手動裝
       - (c) Spike 1（typecheck only）/ Spike 2（+ checkstyle）替代設計 → 按 README 骨架自行調整
     - **觸發頻率**：只在 AI 跑 `git commit` 時觸發；其他 Bash（grep / ls / mvn / npm 等）不擋；Edit / Write 也不擋（不切碎 AI flow）
     - **block 後 AI 行為**：reason 內含「⚠️ Do NOT auto-fix in-place. Notify PG.」，AI 看 reason 後回報 PG，**不原地反覆嘗試 commit**；PG 決定 retry / rollback / hand off
     - hook 寫入 `.claude/settings.local.json`（gitignored，個人試用），不寫共用 `.claude/settings.json`
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
      - 寫測試 → 跑測試，確認 Red
      - 寫實作 → 跑測試，確認 Green
      - lint + typecheck
      - `git diff` 自檢測試檔：若 Red→Green 過程中斷言被修改 → 明確告知 PG（test-to-fit 風險）

      **若為 `[processor]`（無單元測試，走雙對照）：**
      - **先載入 api_contract.md 對應的 A## 小節**，列出該 API 的 Response shape（含欄位、型別、巢狀層）
      - **再載入 current_schema_{程式編號}.md 涉及表的小節**，列出 SQL/Entity 預計引用的欄位 / 型別 / nullable
      - 產出**兩張對照表**：
        - 對照表 (1)：`api_contract A## Response 欄位` ↔ `預計實作 response shape` — 欄位名、型別、巢狀層級全對齊
        - 對照表 (2)：`current_schema 表欄位` ↔ `SQL / Entity 引用欄位` — 名稱、型別、nullable 全對齊
      - **[STOP] SG2 — 雙對照表審：**
        - 向 PG 展示兩張對照表（契約對齊 + schema 對齊）
        - **不可省略**；偏離行 PG 必須親自核可
        - 不寫 mock-based 單元測試（AR003 BUG-P4b 全是這類測試沒擋到的；mock 設成預期再驗自己是套套邏輯，token 高 ROI 低）
      - 寫實作（無單元測試）
      - lint + typecheck
      - 自檢：實作 response shape 是否與 api_contract 一致 / SQL/Entity 欄位是否與 current_schema 一致；若實作必須偏離 → **不可自行改契約 / schema**，停下來告知 PG 由 PG 決策（改 code 或 reconcile 文件）

      **若為 `[sql]` / `[entity]` / `[spi]`：**
      - **先載入 current_schema_{程式編號}.md 對應的表小節**，對照欄位名、SQL 型別、nullable、default
      - 寫實作時欄位名與型別必須與 current_schema 一致；發現偏離（如 Entity `@Column.name` 在 current_schema 找不到對應）→ 停下來告知 PG，不自行新增 / rename 欄位
      - 寫實作（無測試）
      - lint + typecheck

   c. **更新 progress.md：** 將當前 task 標 `done` + commit hash，寫入 `Docs/spec/{程式編號}/log/{程式編號}_progress.md`
   d. **若為本 session 預期收尾的最後一個 task** → 同步 append `session_log.md`：
      - 本 session 的「關鍵決策」「問題與教訓」「下 session 注意」區塊
      - **若為本 SKILL 全部後端 task 的最後一個** → 同步 append 「## 維護期 hand-off」段（見步驟 7 詳述）；初稿由 AI 從 progress.md 備註欄、本檔「下 session 注意」、SG2 對照表偏離項自動歸納
   e. **commit：** code + progress.md（+ session_log.md，若為最後一個 task）一起 commit
      - **不獨立 commit** progress / session_log；它們必須附在實作 code 的 commit 範圍內
      - commit 標題格式：`{type}({模組}): {動作描述}`（如 `feat(ar003): add cust query validator`、`fix(ar003): correct sale division filter`）
      - **commit 標題禁止含 `B01` / `B40` 等 task id**；task id 可放 commit body 內描述
   f. **[STOP] SG3 — 審閱：**
      - 報告：完成的 task、測試結果、lint/typecheck 結果、git diff 摘要
      - PG 選擇：繼續 / 回修 / 停止
      - 可降密度：PG 可指定「每 N 個 task 停一次」
7. **全部後端 task 完成後（SKILL 完工判定）：**

   **完工三條件**（全部成立才算 SKILL 結束）：
   - (1) 後端 task 全部 `done`（`progress.md` 的 `B*` 沒有 `wip` / `todo`）
   - (2) 收尾報告產出（純 console，不寫檔）
   - (3) 維護期 hand-off 已 append 至 `session_log.md`（含 AI 初稿，PG 修）

   **維護期 hand-off（在最後一個 task 的 commit 範圍內 append session_log.md）：**
   - 寫入固定段「`## 維護期 hand-off`」（格式見下方 Session Log 範例）
   - 兩類分項：
     - **上線前必補（blocker）**：留空殼 / 暫用 stub / 未實作的必要功能
     - **技術債（non-blocker）**：暫用 workaround / 元件限制 / 未來 refactor 候選
   - 初稿來源（AI 自動歸納）：
     - `progress.md` 備註欄出現的 warning / skip
     - 本 session `session_log.md`「下 session 注意」中與「驗收 / 上線 / 維護」相關的條目
     - 各 task 的 SG2 對照表偏離項（PG 過了但仍是 hand-off 候選）
   - 每項註明來源：`{task id 或 session 章節}：{描述}`
   - **若無項目可歸納 → 兩類都列「（無）」，不可省略段落**

   **收尾報告（純 console，不另開 commit）：**
   - 完成的 task 清單（按類型 tag 分類計數）
   - 測試通過數（限 `[validator]`）
   - SG2 偏離 warning（若有）
   - hand-off 初稿摘要（提醒 PG 過目修改）
   - 建議 PG 另起 session：`/impl-fe`（前端）或 `/data`（權限 + 測資）

   **SKILL 邊界**（完工後不入本 SKILL 的事，落到此 SKILL 之外）：
   - 整合手測（PG 開瀏覽器照 `test_cases.md` 跑）
   - 整合手測發現的 bug 修復 → ad hoc 派 AI 修，**不寫入 `progress.md` / `session_log.md`**（避免文件膨脹失焦；ad hoc 修走 git log + commit message 自身紀錄）
   - UI 微調、上線部署、維運監控

8. **Session 歸檔**（見下方）

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | **Scope Statement**（Deliverable / 預期動到 / out-of-scope，切入點 7）+ 確認載入正確、類型分佈、commit-time hook 安裝狀態（PreToolUse Bash + git commit filter；未裝時可由 SKILL 寫入 `.claude/settings.local.json`）、起始 task | 不建議（成本極低）|
| SG2 | `[validator]` 寫測試前 / `[processor]` 寫實作前 | `[validator]` 走測試清單審；`[processor]` 走 api_contract A## + current_schema 雙對照表審 | **不可省略** |
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度（每 N task 一次）|

## 關鍵防護機制

1. **SG2 `[validator]` 測試清單先審、再寫 test code** — 在測試代碼產出之前讓 PG 審「AI 打算測什麼」。
2. **SG2 `[processor]` 雙對照表審** — 寫實作前先列兩張對照表：(1) `api_contract A## Response 欄位` ↔ `預計實作 response shape`；(2) `current_schema 表欄位` ↔ `SQL / Entity 引用欄位`。PG 過了才寫實作。直擊 AR003 BUG-P4b-R4-CONTRACT（4 支 View2 API 欄位與前端不一致 → store 永遠讀 undefined）+ AR003 BUG-A1（規格寫 17 欄、DDL 15 欄、真 DB 也缺 2 欄）。**不寫 mock-based 單元測試**（mock = 預期再驗自己的套套邏輯，AR003 BUG-P4b 全是這類測試沒擋的；用 token 高 ROI 低的安全網換不到實際保護）。
3. **`[sql]` / `[entity]` schema 對齊規則** — 欄位名 / 型別 / nullable 必須對齊 current_schema_{程式編號}.md（對齊 AR003 BUG-A1 教訓）。
4. **契約 / schema 偏離 → 停手** — 實作必須偏離 api_contract 或 current_schema 時，**不可自行改契約 / schema**，必須停下來由 PG 決策。
5. **git diff 對照測試檔 self-check（限 `[validator]`）** — 規避 test-to-fit。`git diff` 是客觀事實，不靠 agent 紀律。
6. **Red-Green 強制順序（限 `[validator]`）** — 寫測試 → 確認失敗 → 寫實作 → 確認通過，不可跳步。
7. **Artifact 合一 commit、commit 標題乾淨** — progress.md / session_log.md 必須與實作 code 同一個 commit；session_log.md 在最後一個 task 的 commit 內 append，不另開 commit。commit 標題禁止 task id（`B01` / `B40` 等）。
8. **SKILL 完工三條件 + hand-off + 邊界** — 完工 = task done + 收尾報告 + hand-off append（三條件缺一不可）。整合手測、bug 修復不入本 SKILL；後續 bug 走 ad hoc 派修，不寫進 progress.md / session_log.md。AR002 主輪後 ad hoc 沒紀錄是健康狀態而非缺失：SKILL 該結束就結束，後面是維護期。
9. **commit-time hook 自動 typecheck + module test（外部化 TDD Red-first 紀律）** — AI 跑 `git commit` 時自動跑 `mvn -pl <staged-modules> -am test`，失敗時透過 stdout JSON `{"decision":"block","reason":"..."}` block commit；reason 內含「⚠️ Do NOT auto-fix in-place. Notify PG.」要求 AI 不自動修、通知 PG。範本：`<skill-dir>/templates/hooks/typecheck-test-on-commit.ps1` + `settings.local.json.tmpl`（PreToolUse + matcher: Bash + script 內過濾 `git commit`）；SG1 提示 PG 安裝（spike 3 預設；spike 1 typecheck only / spike 2 + checkstyle 為替代設計骨架）。對應切入點 8（review/2026-04-09 A path）。設計理由：Edit / Write 每次跑切碎 AI flow；commit 時跑天然對齊 task 收尾（SG3 已是 typecheck stop gate，本 hook 補位「AI 跳過跑」極端），且 spike 3 在 commit 時跑 30-60s 可接受、能擋 AR002 B03 / AR003 B21 / F11「測試該紅而沒紅」這類 typecheck 抓不到的友擦。
10. **Scope-lock 動手前必跑** — SG1 第一個子段為 Scope Statement（Deliverable / 預期動到 / out-of-scope）為 stop gate；實作中發現需超出 scope（改契約 / schema / 重構 sibling）→ STOP 回報 PG，不自行擴張（對齊切入點 7 / Insight 報告 35 wrong_approach + 12 excessive_changes 觀察）。

## 核心原則

1. **讀規範、不掃 code** — 測試框架 / lint / typecheck / commit 規範全讀 `CLAUDE.md`。
2. **Schema 來源 = current_schema** — Entity / SQL / DDL 一律以 `current_schema_{程式編號}.md` 為準；不再讀 `Docs/DDL/*.sql`，不從 sibling Java/SP code 推 schema。
3. **Response 對齊 api_contract** — Processor response shape 對齊 `api_contract.md` 對應 A## 小節；偏離 → 停手由 PG 決策，不自行 reconcile 契約。
4. **Subagent 不產出進 git 的檔案** — 實作 / 測試程式碼由主 session 撰寫；跑指令、搜尋參考可委託 subagent。
5. **類型 tag 驅動測試 / 對照策略** — 不再逐 task 問「要 Mockito 還是 Quarkus」；`[validator]` 走 TDD，`[processor]` 走雙對照表（無 mock test），`[sql]/[entity]/[spi]` 走 current_schema 對照。
6. **`[validator]` 單元測試 + `[processor]` 雙對照表 = 開發 feedback loop** — 真正的整合驗證由 PG 手測涵蓋（透過 `test_cases.md`）。Processor mock-based 單元測試本質是套套邏輯（mock 設成預期再驗自己），AR003 BUG-P4b 全是這類測試沒擋到的；改走靜態對照。
7. **後端與前端分 session** — 共用 progress.md / session_log.md / api_contract.md，但實作不互相影響。

## Checkpoint 格式（`Docs/spec/{程式編號}/log/{程式編號}_progress.md`）

兩 session（p3-backend / p3-frontend）共用此檔。task prefix `B*` 為後端、`F*` 為前端。

```markdown
# {程式編號} — P3 Progress

> 最後更新：{YYYY-MM-DD HH:mm}
> 當前分支：{branch}
> HEAD：{commit-hash}

## Task 清單來源
- backend: Docs/spec/{程式編號}/plan/{程式編號}_backend_tasks.md
- frontend: Docs/spec/{程式編號}/plan/{程式編號}_frontend_tasks.md

## 進度（只列已接觸 task）

| Task ID | 類型 | 狀態 | Commit | 備註 |
|---------|------|:----:|--------|------|
| B01 | [entity] | done | a1b2c3d | |
| B40 | [validator] | done | e4f5g6h | SG2 增加空值邊界測試 |
| B20 | [processor] | wip | — | Red 階段，測試已寫完 |

## 下一 Task 候選
- B21（processor，選填欄位：customerCode, riskLevel）
- B30（sql）

## Resume 指示（new session 啟動後）
1. 讀本檔、確認當前分支、pull 最新
2. 執行 `/impl-be` 或 `/impl-fe`
3. SG1 回報上次進度，PG 確認繼續點
```

**狀態值：** `done` / `wip` / `skip` / `todo`
**更新時機：** 每個 task 的 SG3 之前
**Resume 時機：** SG1 之前偵測到檔案存在時觸發

## Session Log 格式（`Docs/spec/{程式編號}/log/{程式編號}_session_log.md`）

兩 session 共用此檔。每個 session 結束前 append 一個章節，不覆寫。最後一個 session 收工（SKILL 完工）時，額外 append 「## 維護期 hand-off」段。

```markdown
# {程式編號} — P3 Session Log

## Session #1 — 2026-04-17 後端（B01–B40）

### 關鍵決策
- Entity 風格採 record class（專案慣例）
- Validator 採靜態工具類，無 DI

### 問題與教訓
- B40 格式化邏輯在規格中有歧義，跟 SA 確認後採 FIFO

### 下 session 注意
- B20 Processor 實作前,確認 CustomerQuery 的 SQL provider SPI 已就緒

## Session #2 — 2026-04-20 後端（B20–B30）
...

## Session #3 — 2026-04-21 前端（F01–F20）
...

---

## 維護期 hand-off

> 由 SKILL 完工時 AI 從 progress.md 備註欄、本檔「下 session 注意」、SG2 對照表偏離項主動歸納初稿，PG 過目修改。SKILL 結束後新發現的 bug / 微調走 ad hoc 派修，**不再回寫本檔**。

### 上線前必補（blocker）
> 留空殼 / 暫用 stub / 未實作的必要功能。例如：「B52 JasperReports 模板僅留空殼，待設計師補正版」。**無項目時填「（無）」,不省略段落**。

- [ ] {來源 task id 或 session 章節}：{描述}

### 技術債（non-blocker）
> 暫用 workaround / 元件限制 / 未來 refactor 候選。例如：「F05 SLov emit 限制,需 wrap 自訂事件」「B20 CustomerQuery 改走 NativeSqlService,待未來 SPI 補齊後可退回」。**無項目時填「（無）」,不省略段落**。

- [ ] {來源 task id 或 session 章節}：{描述}
```

## Session 歸檔

全部 task 完成後（或本 session 收工時），將當前 session 完整紀錄複製到集中目錄，供 SKILL 維護者日後審視。

### 歸檔流程

1. **決定專案名稱：** 取 git remote origin 的 repo 名；若無 remote 則取當前目錄名。
2. **決定檔名：** `{程式編號}-P3-backend_{yyyyMMdd}_{HHmm}`
3. **定位當前 session 檔案：** 掃描 `~/.claude/projects/{當前專案路徑的 Claude 編碼}/` 下最近修改的 `.jsonl` 檔。
4. **建立目標目錄：** `~/.soetek-ai-coding/{專案名}/`（若不存在則建立）。
5. **複製檔案：**
   - `{uuid}.jsonl` → `~/.soetek-ai-coding/{專案名}/{檔名}.jsonl`
   - `{uuid}/subagents/*` → `~/.soetek-ai-coding/{專案名}/{檔名}/subagents/`（若有）
6. **產出結構化摘要：** `~/.soetek-ai-coding/{專案名}/{檔名}.summary.md`（從 progress.md + session_log.md 取內容）

## SKILL 本身改進建議（給維護者）

PG 使用此 SKILL 發現的改進建議，寫到 `~/.soetek-ai-coding/skill-feedback/spec-p3-backend.md`（repo 外）。此檔不建空殼，僅在有實質內容時 append。
