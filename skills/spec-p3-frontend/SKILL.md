---
name: spec-p3-frontend
description: 前端實作 SKILL：讀 P2 的 frontend_tasks.md + 專案 CLAUDE.md，以 task 類型 tag 分流測試策略（service/store-map 寫契約測試，types/store-action/page/dialog/i18n/router 無測試由 PG 完工後整體手測）。觸發於 /impl-fe 或提到前端實作、frontend impl 等關鍵字。
---

# Spec P3 Frontend — 前端實作（契約層測試）

在專案 repo 目錄下執行，讀取 P2 產的 `{程式編號}_frontend_tasks.md` 與專案 `CLAUDE.md`，依 task 類型 tag 分流：**契約層（`[service]` / `[store-map]`）寫測試、UI 層（`[page]` / `[dialog]` 等）無測試由 PG 完工後整體手測**。

## 定位

- **輸入：** P2 產的 `{程式編號}_frontend_tasks.md` + 專案 `CLAUDE.md`
- **輸出：** 前端實作 code + 契約測試 + git commits
- **契約測試的定位：** 只測「後端傳來的資料有沒有被正確解析 / 轉換」這一層。UI 顯示、UX 互動、樣式、文字由 PG 完工後開瀏覽器整體手測（照 `test_cases.md`）。
- **與 P3-backend 的關係：** 本 SKILL 只處理前端 task；後端另起 session 用 `/impl-be`。兩 session 共用同一份 `progress.md` 與 `session_log.md`（task prefix `B*` / `F*` 區分）。

## 觸發方式

- `/impl-fe` — 顯示流程說明並開始
- `/impl-fe <task-list-path>` — 直接帶入前端任務清單路徑

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_frontend_tasks.md`（每個 task 已標類型 tag）
2. 專案有 `CLAUDE.md` 索引（指向前端測試框架 Vitest/Jest、lint、typecheck、commit 規範、前端目錄結構等）
3. 建議已完成 `/impl-be`（後端 API 規格確定後前端契約測試才能對準欄位）

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[service]` | **契約測試**（mock fetch，驗 path / method / payload / response shape） | API 服務層 |
| `[store-map]` | **契約測試**（輸入後端 shape → 輸出前端 shape） | Store mapping helper |
| `[store-action]` | **無測試** | ROI 低，手測涵蓋 |
| `[types]` | **無測試** | typecheck 已蓋 |
| `[page]` | **無測試** | UI/UX 由 PG 完工後手測 |
| `[dialog]` | **無測試** | UI/UX 由 PG 完工後手測 |
| `[i18n]` | **無測試** | 靜態資料 |
| `[router]` | **無測試** | 靜態資料 |

**為什麼只測契約層：** AR003 教訓顯示後端欄位 rename 或 shape 調整時，前端 mapping helper 若無測試，bug 會延到手測階段才被發現（例如 backend 回 `creditAmt`、frontend 讀 `creditLimit` 全空）。契約測試是前端唯一 ROI 夠高的測試範圍。UI 類寫測試耗時遠高於 PG 手測 1 秒看出問題的速度。

## 設計原則

1. **半自動** — 有測試的 task 走 SG2/SG3、無測試的 task 只走 SG3 純審閱。
2. **Subagent 不產出進 git 的檔案** — 實作 / 測試 code 必須由主 session 撰寫。跑 lint / typecheck / test 指令、搜尋既有元件參考可委託 subagent。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。
4. **Artifact 即 commit** — progress.md / session_log.md 產出後立即 commit。
5. **完工後整體手測** — 全部前端 task 做完後，PG 開瀏覽器一次照 `test_cases.md` 測完，發現 bug ad hoc 派工（不走本 SKILL 流程）。

## Execution Flow

```
/impl-fe [task-list-path]
         ↓
[AI]  讀 frontend_tasks.md + CLAUDE.md 索引 → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈
      （service N / store-map M / store-action K / types J / page I / dialog H / i18n G / router F）
[STOP] SG1: PG 確認載入、類型分佈、起始 task
         ↓
┌─── 每個 task loop ───────────────────────────┐
│  [AI]  讀當前 task + 類型 tag                   │
│                                                 │
│  分支依類型 tag：                                │
│  ┌─[service] / [store-map] 分支─────────────┐  │
│  │  [AI]  列契約測試清單                      │  │
│  │  [STOP] SG2: PG 快審測試清單               │  │
│  │  [AI]  寫測試 → Red → 寫實作 → Green        │  │
│  │  [AI]  lint + typecheck + git diff 自檢     │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─其他類（types/store-action/page/dialog/     ┐  │
│  │  i18n/router）分支                          │  │
│  │  [AI]  寫實作（無測試）                     │  │
│  │  [AI]  lint + typecheck                     │  │
│  └─────────────────────────────────────────────┘  │
│                                                 │
│  [AI]  更新 progress.md + commit                │
│  [STOP] SG3: PG 審閱 → 繼續 / 回修 / 停止      │
│         （可降密度：每 N task 一次）            │
└────────────────────────────────────────────────┘
         ↓
[AI]  全部前端 task 完成 → 更新 session_log.md → commit
[AI]  完工報告：
      - 契約測試通過數
      - 建議 PG 下一步：
        1. 另起 session 執行 /data（若尚未做）
        2. 確認 /data 跑完後，開瀏覽器照 test_cases.md 整體手測
        3. 手測發現 bug → ad hoc 派 AI 修（不走 SKILL）
[AI]  Session 歸檔
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單與專案 context：**
   - 讀取 `{程式編號}_frontend_tasks.md`
   - 讀取專案 `CLAUDE.md` 索引 → 讀取規範文件，取得：
     - 前端測試框架與執行指令（Vitest / Jest / 等）
     - Lint / typecheck 指令
     - Commit 規範
     - 前端目錄結構、元件命名慣例、Store/Service 慣例
4. **檢查 checkpoint：**
   - 檢查 `Docs/spec/{程式編號}/log/{程式編號}_progress.md`
   - 若存在 → 讀取進度，報告前端（`F*`）task 狀態
   - 若不存在 → 建立空檔
5. **[STOP] SG1：**
   - 報告載入清單、規範文件、測試 / lint / typecheck 指令
   - **報告 task 類型分佈**
   - 詢問 PG：起始 task
6. **Task Loop（每個 task）：**
   a. 讀取 task + 類型 tag
   b. 分支：

      **`[service]` / `[store-map]` → 契約測試流程：**
      - 列出契約測試清單：
        - `[service]`：測 API path 對、HTTP method 對、payload shape 對、response 解析對
        - `[store-map]`：測輸入後端 shape 的三類 case：
          - 正常欄位 → 轉成前端欄位
          - 後端欄位 null / undefined → 前端預設值
          - 後端有多餘欄位 → 前端忽略
      - **[STOP] SG2 測試清單快審**
      - 寫測試 → Red → 寫實作 → Green
      - lint + typecheck
      - `git diff` 自檢測試檔

      **`[types]` / `[store-action]` / `[page]` / `[dialog]` / `[i18n]` / `[router]` → 純實作：**
      - 寫實作（無測試）
      - lint + typecheck

   c. 更新 progress.md + commit
   d. **[STOP] SG3：** PG 審閱（繼續 / 回修 / 停止），可降密度
7. **全部前端 task 完成後：**
   - 更新 `session_log.md` 本 session 區塊
   - 彙總報告：完成 task 清單、契約測試通過數
   - 建議 PG 下一步：
     1. 另起 session 執行 `/data`（產權限 + seed SQL）
     2. `/data` 跑完後開瀏覽器照 `test_cases.md` **整體手測**
     3. 手測發現 bug → ad hoc 派 AI 修（不走本 SKILL 流程）
8. **Session 歸檔**

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | 確認載入正確、類型分佈、起始 task | 不建議 |
| SG2 | `[service]` / `[store-map]` 寫測試前 | 契約覆蓋度防護 | **不可省略**（有測試的 task）|
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度 |

**無 Demo Gate** — UI 類 task 不逐批停，全部前端 task 做完後由 PG 整體手測（見步驟 7）。

## 關鍵防護機制

1. **SG2 契約測試清單審** — 特別是 `[store-map]` 必須覆蓋 rename / null / 多餘欄位三類 case（對齊 AR003 BUG-P4b-R4-CONTRACT 教訓）。
2. **完工後整體手測** — 避免 session 中途頻繁 demo 打斷節奏，讓 AI 一氣呵成做完前端，PG 最後一次看。
3. **Artifact 即 commit**。

## 核心原則

1. **只測契約層** — UI / UX / 樣式 / 文字由 PG 手測比寫測試快 10 倍。
2. **Subagent 不產出進 git 的檔案**。
3. **讀規範、不掃 code**。
4. **前後端分 session** — 共用 progress.md / session_log.md，但實作不互相影響。
5. **SKILL 結束 ≠ 驗證結束** — 本 SKILL 結束後仍有 `/data` + PG 手測兩步才算真正完工。

## Checkpoint / Session Log

共用 `spec-p3-backend` 定義的 `Docs/spec/{程式編號}/log/{程式編號}_progress.md` 與 `{程式編號}_session_log.md` 格式。task prefix `F*` 為前端、`B*` 為後端。

## Session 歸檔

同 p3-backend，檔名改為 `{程式編號}-P3-frontend_{yyyyMMdd}_{HHmm}`。

## SKILL 本身改進建議

PG 使用此 SKILL 發現的改進建議，寫到 `~/.soetek-ai-coding/skill-feedback/spec-p3-frontend.md`。
