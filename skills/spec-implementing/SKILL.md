---
name: spec-implementing
description: TDD 驅動實作 SKILL：讀 P2 任務清單 + 專案 CLAUDE.md，以 Red-Green 迴圈逐 task 實作 + 單元測試。三道 stop gate 確保品質。觸發於 /impl 或提到實作、implementing、TDD 等關鍵字。
---

# Spec Implementing — TDD 驅動實作

在專案 repo 目錄下執行，根據 P2 產出的任務清單與專案 `CLAUDE.md` 規範，以 TDD 迴圈逐 task 實作程式碼並撰寫單元測試。

## 定位

- **輸入：** P2 產的 `{程式編號}_frontend_tasks.md` / `{程式編號}_backend_tasks.md` + 專案 `CLAUDE.md`
- **輸出：** 實作 code + 單元測試 + git commits
- **單元測試定位：** 開發 feedback loop（基本程式邏輯 + 瑣碎邊界測試），不是 QA 驗證。真正的 QA 在 P4。

## 觸發方式

- `/impl` — 顯示流程說明並開始
- `/impl <task-list-path>` — 直接帶入任務清單路徑

## 前置條件

1. 已完成 P2 `spec-tasking`，產出前端/後端任務清單
2. 專案有 `CLAUDE.md` 索引（指向測試框架、lint、typecheck、commit 規範等）

## 設計原則

1. **半自動** — 每個 task 前 stop gate 確認、完成後問要不要繼續。不是全自動（context rot + 品質漂移風險），不是手動輔助（失去 SKILL 價值）。
2. **不使用 subagent 寫程式碼** — 前例教訓：session-791acadc 中 subagent 收到的 prompt 與模板嚴重矛盾。回饋迴路（test pass/fail、lint、typecheck）> multi-agent 複雜度。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。

## Execution Flow

```
/impl [task-list-path]
         ↓
[AI]  讀 task list + CLAUDE.md 索引 → 讀規範文件
      （測試框架、lint 指令、typecheck 指令、commit 規範、目錄結構）
[STOP] SG1: PG 確認載入正確、指定起始 task
         ↓
┌─── 每個 task loop ─────────────────┐
│  [AI]  讀當前 task                   │
│  [AI]  列單元測試清單                │
│  [STOP] SG2: PG 快審測試清單        │
│         （覆蓋度防護，不可省略）     │
│                                      │
│  [AI]  寫測試 → 跑測試 (Red)         │
│  [AI]  寫實作 → 跑測試 (Green)       │
│  [AI]  lint + typecheck              │
│  [AI]  git diff 自檢測試檔           │
│        若斷言被改 → 明示 PG          │
│  [STOP] SG3: PG 審閱 → 繼續/回修    │
│         （可降密度：每 N task 一次） │
└──────────────────────────────────────┘
         ↓
[AI]  全部 task 完成 → 建議進入 P4
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單與專案 context：**
   - 讀取使用者指定的 task list 檔案（或自動辨識 `{程式編號}_frontend_tasks.md` / `{程式編號}_backend_tasks.md`）
   - 讀取專案 `CLAUDE.md` 索引 → 讀取規範文件，取得：
     - 測試框架與執行指令
     - Lint / typecheck 指令
     - Commit 規範
     - 測試目錄結構
   - **不掃 code 歸納 pattern**
4. **[STOP] SG1 — 確認載入：**
   - 向 PG 報告：已載入的任務清單、已讀取的規範文件清單、測試/lint/typecheck 指令
   - 詢問 PG：從哪個 task 開始？
   - PG 確認後才進入 task loop
5. **Task Loop（每個 task）：**
   a. 讀取當前 task 內容
   b. 依 task 內容列出單元測試清單（測什麼、測幾個 case）
   c. **[STOP] SG2 — 測試清單快審：**
      - 向 PG 展示「AI 打算測什麼」
      - **不可省略** — 覆蓋度遺漏在這關抓
      - PG 可增減測試項目
   d. 寫測試程式碼 → 跑測試，確認 Red（測試失敗）
   e. 寫實作程式碼 → 跑測試，確認 Green（測試通過）
   f. 執行 lint + typecheck
   g. `git diff` 自檢測試檔：
      - 若 Red→Green 過程中斷言被修改 → **明確告知 PG**（test-to-fit 風險）
      - 若未修改 → 正常通過
   h. **[STOP] SG3 — 審閱：**
      - 向 PG 報告：完成的 task、測試結果、lint/typecheck 結果、git diff 摘要
      - PG 選擇：繼續下一個 task / 回修 / 停止
      - **可降密度：** PG 可指定「每 N 個 task 停一次」
6. **全部 task 完成後：**
   - 彙總報告：完成的 task 清單、測試通過數、any 警告
   - 建議 PG 另起 session 進入 P4（spec-uat 或 spec-e2e）

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | 確認載入正確、起始 task | 不建議（成本極低）|
| SG2 | 寫 test code 之前 | 覆蓋度防護 | **不可省略**（單 session TDD 關鍵防護）|
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度（每 N task 一次）|

## 關鍵防護機制

1. **測試清單先審、再寫 test code** — 在測試代碼產出之前讓 PG 審「AI 打算測什麼」，覆蓋度遺漏在這關抓。
2. **git diff 對照測試檔 self-check** — 規避 test-to-fit。`git diff` 是客觀事實，不靠 agent 紀律。
3. **Red-Green 強制順序** — 寫測試 → 確認失敗 → 寫實作 → 確認通過，不可跳步。

## 核心原則

1. **讀規範、不掃 code** — 測試框架 / lint / typecheck / commit 規範全讀 `CLAUDE.md`。
2. **不使用 subagent 寫程式碼** — 回饋迴路 > multi-agent 複雜度。
3. **單元測試 = 開發 feedback loop** — 基本程式邏輯 + 瑣碎邊界，真正 QA 在 P4。
4. **P4 做裁判** — P3 完工後另起 session 跑 P4，天然獨立觀點。
