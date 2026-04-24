---
name: spec-p3-backend
description: 後端 TDD 驅動實作 SKILL：讀 P2 的 backend_tasks.md + 專案 CLAUDE.md，以 task 類型 tag 分流測試策略（validator/processor 完整 TDD，sql/entity/spi 不寫測試）。SG2 強制 Processor 類覆蓋每個選填欄位的 null/空字串/空白。觸發於 /impl-be 或提到後端實作、backend impl 等關鍵字。
---

# Spec P3 Backend — 後端 TDD 實作

在專案 repo 目錄下執行，讀取 P2 產的 `{程式編號}_backend_tasks.md` 與專案 `CLAUDE.md`，依 task 類型 tag 分流測試策略，以 TDD 迴圈實作 + 單元測試。

## 定位

- **輸入：** P2 產的 `{程式編號}_backend_tasks.md` + 專案 `CLAUDE.md`
- **輸出：** 後端實作 code + 單元測試 + git commits
- **單元測試定位：** 開發 feedback loop（基本程式邏輯 + 瑣碎邊界測試），真正的整合驗證由 PG 手測涵蓋（`spec-p3-data` 產 seed 後走 test_cases.md）。
- **與 P3-frontend 的關係：** 本 SKILL 只處理後端 task；前端另起 session 用 `/impl-fe`。兩 session 共用同一份 `progress.md` 與 `session_log.md`（task prefix `B*` / `F*` 區分）。

## 觸發方式

- `/impl-be` — 顯示流程說明並開始
- `/impl-be <task-list-path>` — 直接帶入後端任務清單路徑

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_backend_tasks.md`（每個 task 已標類型 tag、`[processor]` 類已填「選填欄位」清單）
2. 專案有 `CLAUDE.md` 索引（指向測試框架、lint、typecheck、commit 規範、backend 目錄結構等）

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[validator]` | **完整 TDD**（JUnit 純或 Mockito，Red-Green 迴圈） | 純函式 / 演算法 / 狀態機 |
| `[processor]` | **完整 TDD**（Mockito）+ **SG2 覆蓋度強制規則** | 見下方 SG2 強化 |
| `[sql]` | **無 P3 測試** | SQL 行為由手測涵蓋（PG 照 test_cases.md 對）|
| `[entity]` | **無測試** | 純 POJO，無邏輯 |
| `[spi]` | **無測試** | 抽象介面，無邏輯 |

## 設計原則

1. **半自動** — 每個 task 前 stop gate 確認、完成後問要不要繼續。
2. **Subagent 不產出進 git 的檔案** — 前例教訓（session-791acadc）：subagent 寫程式碼時 prompt 與模板矛盾導致全錯。實作 / 測試 code 必須由主 session 撰寫（需要完整 context + 回饋迴圈）。但跑 lint / typecheck / test 指令、搜尋既有程式碼參考等探索性操作可委託 subagent。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。
4. **Artifact 即 commit** — progress.md / session_log.md 產出後立即 commit，避免 working tree 丟失。
5. **類型 tag 驅動** — 不再問「測 Mockito 還是 Quarkus」，tag 決定策略。

## Execution Flow

```
/impl-be [task-list-path]
         ↓
[AI]  讀 backend_tasks.md + CLAUDE.md 索引 → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈（validator N / processor M / sql K / entity J / spi I）
[STOP] SG1: PG 確認載入、類型分佈、起始 task
         ↓
┌─── 每個 task loop ─────────────────────────┐
│  [AI]  讀當前 task + 類型 tag                │
│                                              │
│  分支依類型 tag：                             │
│  ┌─[validator] / [processor] 分支───────┐   │
│  │  [AI]  列單元測試清單                 │   │
│  │        若為 [processor]：             │   │
│  │        必須覆蓋「選填欄位」每欄       │   │
│  │        的 null / "" / 空白三種 case   │   │
│  │  [STOP] SG2: PG 快審測試清單         │   │
│  │         （覆蓋度防護，不可省略）      │   │
│  │  [AI]  寫測試 → 跑測試 (Red)          │   │
│  │  [AI]  寫實作 → 跑測試 (Green)        │   │
│  │  [AI]  lint + typecheck               │   │
│  │  [AI]  git diff 自檢測試檔            │   │
│  │        若斷言被改 → 明示 PG           │   │
│  └────────────────────────────────────────┘   │
│  ┌─[sql] / [entity] / [spi] 分支─────────┐   │
│  │  [AI]  寫實作（無測試）               │   │
│  │  [AI]  lint + typecheck               │   │
│  └────────────────────────────────────────┘   │
│                                              │
│  [AI]  更新 progress.md（state + commit hash）│
│  [AI]  commit code + progress.md              │
│  [STOP] SG3: PG 審閱 → 繼續/回修              │
│         （可降密度：每 N task 一次）          │
└──────────────────────────────────────────────┘
         ↓
[AI]  全部 task 完成 → 更新 session_log.md → commit
[AI]  建議：另起 session 執行 /impl-fe（前端）
[AI]  Session 歸檔
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單與專案 context：**
   - 讀取 `{程式編號}_backend_tasks.md`（自動辨識或 PG 指定）
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
5. **[STOP] SG1 — 確認載入：**
   - 報告：已載入的 backend_tasks.md、規範文件清單、測試/lint/typecheck 指令
   - **報告 task 類型分佈**：validator N 支 / processor M 支（含選填欄位總數）/ sql K 支 / entity J 支 / spi I 支
   - 若為 resume → 額外報告上次進度摘要與未解決 warning
   - 詢問 PG：從哪個 task 開始？
6. **Task Loop（每個 task）：**
   a. 讀取當前 task 內容 + 類型 tag
   b. **依類型 tag 分支：**

      **若為 `[validator]` 或 `[processor]`：**
      - 列出單元測試清單（測什麼、測幾個 case）
      - 若為 `[processor]`：從 task 的「選填欄位」清單，**強制產生每欄三種測試**：
        - `欄位=null` → 預期 SQL 不以此欄位 filter
        - `欄位=""` → 預期 SQL 不以此欄位 filter（避免 AR003 教訓：`collector=""` / `riskLevel=""` 讓 `:param IS NULL OR col = :param` 永遠無匹配）
        - `欄位="   "` → 預期 SQL 不以此欄位 filter
      - **[STOP] SG2 — 測試清單快審：**
        - 向 PG 展示「AI 打算測什麼」，特別標示選填欄位覆蓋項
        - **不可省略**
        - PG 可增減測試項目
      - 寫測試 → 跑測試，確認 Red
      - 寫實作 → 跑測試，確認 Green
      - lint + typecheck
      - `git diff` 自檢測試檔：
        - 若 Red→Green 過程中斷言被修改 → 明確告知 PG（test-to-fit 風險）

      **若為 `[sql]` / `[entity]` / `[spi]`：**
      - 直接寫實作（無測試）
      - lint + typecheck

   c. **更新 progress.md：** 將當前 task 標 `done` + commit hash，寫入 `Docs/spec/{程式編號}/log/{程式編號}_progress.md`
   d. **commit：** code + progress.md 一起 commit
   e. **[STOP] SG3 — 審閱：**
      - 報告：完成的 task、測試結果、lint/typecheck 結果、git diff 摘要
      - PG 選擇：繼續 / 回修 / 停止
      - 可降密度：PG 可指定「每 N 個 task 停一次」
7. **全部後端 task 完成後：**
   - 更新 `session_log.md` 本 session 的「關鍵決策」「問題與教訓」區塊
   - 彙總報告：完成的 task 清單、測試通過數、任何警告
   - 建議 PG 另起 session：
     - `/impl-fe` — 前端實作
     - 或若前端已完成 → `/data` 產權限 + 測資
8. **Session 歸檔**（見下方）

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | 確認載入正確、類型分佈、起始 task | 不建議（成本極低）|
| SG2 | `[validator]` / `[processor]` 寫測試前 | 覆蓋度防護（Processor 強制選填欄位空值覆蓋）| **不可省略** |
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度（每 N task 一次）|

## 關鍵防護機制

1. **SG2 測試清單先審、再寫 test code** — 在測試代碼產出之前讓 PG 審「AI 打算測什麼」。
2. **SG2 `[processor]` 覆蓋度強制規則** — 每個選填欄位必須有 null / `""` / 空白三種測試（對齊 AR003 F7 教訓）。
3. **git diff 對照測試檔 self-check** — 規避 test-to-fit。`git diff` 是客觀事實，不靠 agent 紀律。
4. **Red-Green 強制順序** — 寫測試 → 確認失敗 → 寫實作 → 確認通過，不可跳步。
5. **Artifact 即 commit** — progress.md / session_log.md 跟 code 一起 commit，避免丟失。

## 核心原則

1. **讀規範、不掃 code** — 測試框架 / lint / typecheck / commit 規範全讀 `CLAUDE.md`。
2. **Subagent 不產出進 git 的檔案** — 實作 / 測試程式碼由主 session 撰寫；跑指令、搜尋參考可委託 subagent。
3. **類型 tag 驅動測試策略** — 不再逐 task 問「要 Mockito 還是 Quarkus」。
4. **單元測試 = 開發 feedback loop** — 真正的整合驗證由 PG 手測涵蓋（透過 `test_cases.md`）。
5. **後端與前端分 session** — 共用 progress.md / session_log.md，但實作不互相影響。

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

兩 session 共用此檔。每個 session 結束前 append 一個章節，不覆寫。

```markdown
# {程式編號} — P3 Session Log

## Session #1 — 2026-04-17 後端（B01–B40）

### 關鍵決策
- Entity 風格採 record class（專案慣例）
- Validator 採靜態工具類，無 DI

### 問題與教訓
- B40 格式化邏輯在規格中有歧義，跟 SA 確認後採 FIFO

### 下 session 注意
- B20 Processor 實作前，確認 CustomerQuery 的 SQL provider SPI 已就緒

## Session #2 — 2026-04-20 後端（B20–B30）
...

## Session #3 — 2026-04-21 前端（F01–F20）
...
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
