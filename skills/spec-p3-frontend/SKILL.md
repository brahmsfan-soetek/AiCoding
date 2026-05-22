---
name: spec-p3-frontend
description: 前端實作 SKILL：讀 P2 的 frontend_tasks.md + 專案 CLAUDE.md，以 task 類型 tag 分流測試 / 對照策略（service/store-map 走 api_contract A## 對照表審，無 mock-based 契約測試；types/store-action/page/dialog/i18n/router 無測試由 PG 完工後整體手測）。觸發於 /impl-fe 或提到前端實作、frontend impl 等關鍵字。
---

# Spec P3 Frontend — 前端實作（契約層對照）

在專案 repo 目錄下執行，讀取 P2 產的 `{程式編號}_frontend_tasks.md` 與專案 `CLAUDE.md`，依 task 類型 tag 分流：**契約層（`[service]` / `[store-map]`）寫測試、UI 層（`[page]` / `[dialog]` 等）無測試由 PG 完工後整體手測**。

## 定位

- **輸入：** P2 產的 `{程式編號}_frontend_tasks.md` + `{程式編號}_api_contract.md`（FE/BE 共讀契約）+ 專案 `CLAUDE.md`
- **輸出：** 前端實作 code + git commits（無 mock-based 契約測試）
- **契約對照的定位：** SG2 強制列「實作意圖 ↔ api_contract A##」對照表給 PG 審，作為「後端傳來的資料有沒有被正確解析 / 轉換」的靜態檢查；不從 sibling FE code 推測 shape，不從 BE Java/Processor code 直接讀。UI 顯示、UX 互動、樣式、文字由 PG 完工後開瀏覽器整體手測（照 `test_cases.md`）。
- **與 P3-backend 的關係：** 本 SKILL 只處理前端 task；後端另起 session 用 `/impl-be`。兩 session 共用同一份 `progress.md` 與 `session_log.md`（task prefix `B*` / `F*` 區分），共用同一份 `api_contract.md`。
- **SKILL 邊界：** 本 SKILL 結束點 = 前端 task 全部 done + 收尾報告 + 維護期 hand-off append（見步驟 7「完工三條件」）。**不負責**整合手測、UI 微調、手測發現的 bug 修復、上線部署、維運監控；後續 bug 走 ad hoc 派修，**不寫入 progress.md / session_log.md**（避免文件膨脹失焦）。

## 觸發方式

- `/impl-fe` — 顯示流程說明並開始
- `/impl-fe <task-list-path>` — 直接帶入前端任務清單路徑

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_frontend_tasks.md`（每個 task 已標類型 tag）
2. P2 同批產出的 `{程式編號}_api_contract.md` 存在於 `Docs/spec/{程式編號}/plan/`（若缺 → 必須回頭執行 `/tasking` 補完，不可從 sibling FE / BE code 推 shape）
3. 專案有 `CLAUDE.md` 索引（指向前端測試框架 Vitest/Jest、lint、typecheck、commit 規範、前端目錄結構等）
4. **與 `/impl-be` 的順序**：本 SKILL 可獨立於 `/impl-be` 執行，因為兩邊都對齊同一份 `api_contract.md`；不必等後端寫完才開始前端。若 P3-backend 已收尾時對 contract 有變動，會以 commit 紀錄通知前端，PG 視情況決定要不要回修。

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[service]` | **無 mock-based 測試**；SG2 對照 api_contract A##（path / method / payload / response shape 靜態檢查） | API 服務層 |
| `[store-map]` | **無 mock-based 測試**；SG2 對照 api_contract A##（後端 shape → 前端 shape mapping 靜態檢查） | Store mapping helper |
| `[store-action]` | **無測試** | ROI 低，手測涵蓋 |
| `[types]` | **無測試** | typecheck 已蓋 |
| `[page]` | **無測試** | UI/UX 由 PG 完工後手測 |
| `[dialog]` | **無測試** | UI/UX 由 PG 完工後手測 |
| `[i18n]` | **無測試** | 靜態資料 |
| `[router]` | **無測試** | 靜態資料 |

**為什麼改為「只做契約對照」而非「契約測試」：** AR003 教訓顯示後端欄位 rename 或 shape 調整時，前端 mapping helper 若無防線，bug 會延到手測階段才被發現（例如 backend 回 `creditAmt`、frontend 讀 `creditLimit` 全空）。但 mock-based contract test 抓 typo OK，**BUG-P4b-R4-CONTRACT 跨層欄位名不一致完全沒擋下**（SO0062 mapper camelCase 同樣是寫完 28 個 contract test 才發現後端落地與測試 fixture 不一致）。本輪改走「SG2 對照 api_contract A##（共讀契約）」這層靜態檢查 — 與寫 mock test 比，省 token、無 fixture 與真實 BE 漂移風險、PG 在 SG2 就能一眼看出對齊問題。UI 類寫測試耗時遠高於 PG 手測 1 秒看出問題的速度。

## 設計原則

1. **半自動** — `[service]` / `[store-map]` task 走 SG2 對照確認 + SG3 純審閱；其他類純走 SG3。
2. **Subagent 不產出進 git 的檔案** — 實作 / 測試 code 必須由主 session 撰寫。跑 lint / typecheck / test 指令、搜尋既有元件參考可委託 subagent。
3. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件。
4. **Artifact 合一 commit** — progress.md / session_log.md 必須跟著實作 code 一起 commit，**不獨立 commit**。task loop 中：code + progress.md 一起；收尾時：最後一個 task 的 commit 範圍納入 session_log.md，不另開 commit。
5. **commit 標題不含 task id** — `F01` / `F02` / `F08` 等私人代號只放 progress.md / session_log.md 內部；commit 標題 / PR title / branch 名一律用語意動詞 + 模組（如 `feat(ar003): wire customer store mapping`）。
6. **完工後整體手測** — 全部前端 task 做完後，PG 開瀏覽器一次照 `test_cases.md` 測完，發現 bug ad hoc 派工（不走本 SKILL 流程）。

## Execution Flow

```
/impl-fe [task-list-path]
         ↓
[AI]  讀 frontend_tasks.md + CLAUDE.md 索引 → 讀規範文件
[AI]  讀 progress.md / session_log.md（若存在）
[AI]  統計 task 類型分佈
      （service N / store-map M / store-action K / types J / page I / dialog H / i18n G / router F）
[STOP] SG1: PG 確認 Scope Statement（Deliverable / 預期動到 / out-of-scope）、載入、類型分佈、
            前端硬守則清單（target CLAUDE.md + memory）、
            commit-time hook 安裝（未裝 → 提示安裝 spike 3）、起始 task
         ↓
┌─── 每個 task loop ───────────────────────────┐
│  [AI]  讀當前 task + 類型 tag                   │
│                                                 │
│  分支依類型 tag：                                │
│  ┌─[service] / [store-map] 分支─────────────┐  │
│  │  [AI]  列「api_contract A## ↔ 預計      │  │
│  │        實作 / mapping shape」對照表       │  │
│  │        (path / method / payload /         │  │
│  │         response → 前端欄位)              │  │
│  │  [STOP] SG2: PG 審對照表                 │  │
│  │         （契約對齊防護，不可省略；        │  │
│  │           不寫 mock-based test）          │  │
│  │  [AI]  寫實作（無 mock test）            │  │
│  │  [AI]  lint + typecheck                   │  │
│  │  [AI]  自檢實作是否偏離 api_contract      │  │
│  │        偏離 → 停手由 PG 決策              │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─其他類（types/store-action/page/dialog/     ┐  │
│  │  i18n/router）分支                          │  │
│  │  [AI]  寫實作（無測試）                     │  │
│  │  [AI]  lint + typecheck                     │  │
│  └─────────────────────────────────────────────┘  │
│                                                 │
│  [AI]  更新 progress.md                          │
│  [AI]  若為最後一個 task → append session_log    │
│  [AI]  commit: code + progress.md                │
│        (+ session_log.md 若為最後一個 task)      │
│  [STOP] SG3: PG 審閱 → 繼續 / 回修 / 停止      │
│         UI 類 task 報告含 grep 守則違規        │
│         （只報不擋；可降密度：每 N task）       │
└────────────────────────────────────────────────┘
         ↓
[AI]  完工判定（三條件全成立才算 SKILL 結束）
      - (1) 前端 task 全 done
      - (2) 收尾報告產出
      - (3) 維護期 hand-off 已 append 至 session_log（含 AI 初稿，於最後一個 task commit 內）
[AI]  收尾報告（純 console，不另開 commit）
      - 完成 task 清單 / SG2 偏離 warning
      - hand-off 初稿摘要,提醒 PG 過目
      - 建議 PG 下一步：
        1. 另起 session 執行 /data（若尚未做）
        2. /data 跑完後開瀏覽器照 test_cases.md 整體手測
[AI]  SKILL 邊界宣示
      - 手測 bug + UI 微調 → ad hoc 派修
      - 不寫進 progress.md / session_log.md（避免膨脹失焦）
[AI]  Session 歸檔
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取任務清單、共讀契約與專案 context：**
   - 讀取 `{程式編號}_frontend_tasks.md`
   - 讀取 `{程式編號}_api_contract.md` — `[service]` / `[store-map]` 契約測試對齊基準（每支 API 一個 A## 小節）
     - 若 api_contract 缺失 → 中止流程，告知 PG 需回 `/tasking` 補；**不可從 sibling FE code 推 response shape，也不可直接讀 BE Java/Processor code**（AR003 BUG-P4b-R4-CONTRACT / SO0062 mapper camelCase 教訓）
   - 讀取專案 `CLAUDE.md` 索引 → 讀取規範文件，取得：
     - 前端測試框架與執行指令（Vitest / Jest / 等）
     - Lint / typecheck 指令
     - Commit 規範
     - 前端目錄結構、元件命名慣例、Store/Service 慣例
4. **檢查 checkpoint：**
   - 檢查 `Docs/spec/{程式編號}/log/{程式編號}_progress.md`
   - 若存在 → 讀取進度，報告前端（`F*`）task 狀態
   - 若不存在 → 建立空檔
5. **[STOP] SG1 — Scope Statement + 確認載入 + hook 安裝：**
   - **Scope Statement（首要子段，動手前必跑）：**
     - **Deliverable**（一句話）：本次預計跑完 `frontend_tasks.md` 內哪些 task（全部 / `F01–Fxx` 範圍 / 某類型 tag）+ 對應產出（service / store-map / page / dialog / i18n 等）
     - **預期動到的範圍**：列實際清單，如 frontend 各層目錄下對應 `{程式編號}*` 檔（含 service / store / types / page / dialog / i18n key 等）+ `progress.md` / `session_log.md`
     - **明示 out-of-scope**：列「本次不會動」的範圍（如「不改 `api_contract.md`」「不重構 sibling 元件」「不改全域 i18n / CSS」「不擴張到非 `{程式編號}` task」「不寫後端 code」「不改 router config 之外的全域設定」）
     - **規約**：實作中若發現需超出 scope（如要改契約 / 全域 i18n / 順手調 dialog width / 順手重構 sibling 元件） → STOP 回報 PG，PG 決定擴張或縮回；AI 不自行擴張（對齊 Insight 報告 35 wrong_approach + 12 excessive_changes 觀察、AR002 dialog width 過度修改、AR003 F20-F27 連跑 8 元件後一次驗收偏移等事件）
   - 報告載入清單（含 frontend_tasks.md + api_contract.md 的 {N} 支 API）、規範文件、測試 / lint / typecheck 指令
   - **報告 task 類型分佈**，並列出每個 `[service]` / `[store-map]` task 對應的 api_contract A## 小節
   - **列前端硬守則清單**（target CLAUDE.md + PG memory 對齊防護，對應切入點 4 動作 1）：
     - 從步驟 3 讀到的 target 前端 `CLAUDE.md` 抽取本次 session 將遵守的前端硬守則；同時參考 PG 個人 memory（若 AI 載入的記憶系統中有與前端規約相關的條目，如「feedback_frontend_style」這類條目）
     - 守則整理成兩類報告：
       - **可 grep 驗證類**（規約寫法明確、可 regex 對應）— 每條附對應 grep pattern，作為 SG3 自動驗證依據。例：禁 inline style → `style="`；禁 `<style>` 自訂 CSS → `<style`；組件命名前綴 → `^export\s+const\s+[特定前綴]`
       - **意圖類**（不可機械驗證，屬 PG 手測階段審）— 例：組件式拆分、樣式參考某 GL 元件、i18n namespace 規範
     - 報告：兩類各列條目，每條註明來源（target `CLAUDE.md` 段落 / PG memory 名稱）
     - **若 target `CLAUDE.md` 無前端硬守則段、PG memory 也無相關條目** → 報告「無前端硬守則，本 session 跳過守則對齊」；SG3 自動 grep 步驟亦跳過
     - **不可預設 / 不可硬編** 任何具體規約（如「零自訂 CSS」）；SKILL 只負責**機制**（讀 + 列 + 驗證），規約**內容**由 target project 提供（對齊切入點 9 撤回啟示：target project CLAUDE.md 才是規約權威）
     - PG 過了清單（或補上漏掉的、移除不適用的、調整 grep pattern 的）才繼續
   - **檢查 commit-time hook**（切入點 8 A path）：
     - 偵測 target project `.claude/settings.local.json` / `.claude/settings.json` 是否引用 `typecheck-test-on-commit.ps1`（或其他等效 PreToolUse Bash + git commit filter hook）
     - **已裝** → 報告「✓ hook 已安裝」
     - **未裝** → 報告「⚠️ commit-time hook 未安裝；切入點 8 落地：每次 `git commit` 自動跑 `npm run typecheck` + `npx vitest related --run <staged>`，失敗 block commit 並要求 AI 通知 PG（不自動修）」，引用 `<skill-dir>/templates/hooks/README.md` 給 PG 看設計脈絡，詢問 PG：
       - (a) 安裝 spike 3（typecheck + vitest related，預設推薦）→ SKILL：
         - 複製 `<skill-dir>/templates/hooks/typecheck-test-on-commit.ps1` 到 target `.claude/hooks/`
         - 讀 target `.claude/settings.local.json`（無則建空 JSON）→ 用 ConvertFrom-Json / ConvertTo-Json 合併 `settings.local.json.tmpl` 的 PreToolUse 區塊（保留現有 `permissions` 等）→ 寫回
         - 報告：file watcher 自動 reload，下次 `git commit` 即觸發；`/hooks` 可確認 load 狀態
       - (b) 跳過 → 本 session 不再詢問；PG 可日後手動裝
       - (c) Spike 1（typecheck only）/ Spike 2（+ eslint）替代設計 → 按 README 骨架自行調整
     - **觸發頻率**：只在 AI 跑 `git commit` 時觸發；Edit / Write 不擋（不切碎 UI 微調的 AI flow）
     - **block 後 AI 行為**：reason 內含「⚠️ Do NOT auto-fix in-place. Notify PG.」，AI 看 reason 後回報 PG，**不原地反覆嘗試 commit**；PG 決定 retry / rollback / hand off
     - **target project package.json 需有 `typecheck` 或 `type-check` script**，否則 hook 自動跳過 typecheck（只跑 vitest）；SKILL 報告若 script 缺則提示 PG 在 package.json 補
     - hook 寫入 `.claude/settings.local.json`（gitignored，個人試用），不寫共用 `.claude/settings.json`
   - 詢問 PG：起始 task
6. **Task Loop（每個 task）：**
   a. 讀取 task + 類型 tag
   b. 分支：

      **`[service]` / `[store-map]` → 契約對照流程（無 mock-based test）：**
      - **先載入 api_contract.md 對應的 A## 小節**，列出該 API 的 path / method / Request shape / Response shape（含巢狀層）
      - 產出對照表：
        - `[service]`：`api_contract A##` ↔ `預計實作的 fetch 呼叫`（path / method / payload 欄位 / response 解析欄位）
        - `[store-map]`：`api_contract A## Response shape` ↔ `預計 mapping 出的前端 shape`；涵蓋三類欄位處理：
          - 正常欄位（依 api_contract 的 type / 巢狀層）→ 對應前端欄位
          - 後端欄位 null / undefined（依 api_contract 標 nullable 的欄位）→ 前端預設值處理
          - 後端有多餘欄位 → 前端忽略
      - **[STOP] SG2 對照表審**：向 PG 展示「實作意圖 ↔ api_contract A##」對照表，PG 一眼確認對齊
        - **不可省略**
        - 不寫 mock-based 契約測試（mock fixture 與真實 BE 落地容易漂移，AR003 BUG-P4b-R4-CONTRACT + SO0062 mapper camelCase 都是 fixture 對但實際 API 已 rename / camelCase 不一致的案例；contract test 抓 typo OK，但這類跨層漂移擋不下來）
      - 寫實作（無 mock test）
      - lint + typecheck
      - 自檢：mapping 出的前端欄位名 / 型別是否與既有 store / page 元件用到的一致；實作是否與 api_contract A## 完全對齊；若實作必須偏離 api_contract → **不可自行改契約**，停下來告知 PG

      **`[types]` / `[store-action]` / `[page]` / `[dialog]` / `[i18n]` / `[router]` → 純實作：**
      - 寫實作（無測試）
      - lint + typecheck

   c. 更新 progress.md
   d. 若為本 session 預期收尾的最後一個 task → 同步 append session_log.md：
      - 本 session 的「關鍵決策」「問題與教訓」「下 session 注意」區塊
      - **若為本 SKILL 全部前端 task 的最後一個** → 同步 append 「## 維護期 hand-off」段（見步驟 7 詳述）；初稿由 AI 從 progress.md 備註欄、本檔「下 session 注意」、SG2 對照表偏離項自動歸納（特別關注：i18n 暫用 namespace、CSS workaround、UI 暫用 stub、組件 emit 限制等）
   e. commit：code + progress.md（+ session_log.md，若為最後一個 task）一起
      - **不獨立 commit** progress / session_log；附在實作 code 的 commit 範圍內
      - commit 標題格式：`{type}({模組}): {動作描述}`（如 `feat(ar003): wire customer store mapping`、`fix(ar003): align credit field rename`）
      - **commit 標題禁止含 `F01` / `F08` 等 task id**；task id 可放 commit body 內描述
   f. **[STOP] SG3：** PG 審閱（繼續 / 回修 / 停止），可降密度
      - **UI 類 task（`[page]` / `[dialog]` 等視覺輸出類）SG3 報告加守則 grep 驗證**（對應切入點 4 動作 3）：
        - 對 SG1 列的「可 grep 驗證類」守則，AI 自動跑 grep 掃本 task commit 範圍內變動的 `.vue` / `.tsx` / 其他相關前端檔（以 `git diff --name-only HEAD~1 HEAD` 或 `git show --stat HEAD` 取檔案清單）
        - 報告每條守則的違規結果：守則名稱 → 違規 0 / N 處（含檔名 + 行號 + 對應原文片段）
        - **只報告、不擋**；PG 看到違規後決定 retry / 修 / 接受（與 commit-time hook 失敗 block 機制不同：grep 屬「審美 / 風格」層面，由 PG 判斷；hook 屬「typecheck / test」層面，自動 block）
        - **SG1 守則清單為空（即「無前端硬守則」） → 跳過 grep，SG3 走原邏輯**
        - **`[service]` / `[store-map]` / `[types]` / `[i18n]` / `[router]` / `[store-action]` 等非視覺輸出類 task → 跳過 grep**（守則主要針對 UI 層；契約層由 SG2 對照、靜態檔由 typecheck 蓋）
        - grep 結果不寫進 progress.md / session_log.md（屬 SG3 即時對話內容，PG 已過則不留檔；若 PG 決定當作技術債 → append 至 session_log 維護期 hand-off 段）
7. **全部前端 task 完成後（SKILL 完工判定）：**

   **完工三條件**（全部成立才算 SKILL 結束）：
   - (1) 前端 task 全部 `done`（`progress.md` 的 `F*` 沒有 `wip` / `todo`）
   - (2) 收尾報告產出（純 console，不寫檔）
   - (3) 維護期 hand-off 已 append 至 `session_log.md`（含 AI 初稿，PG 修）

   **維護期 hand-off（在最後一個 task 的 commit 範圍內 append session_log.md）：**
   - 寫入固定段「`## 維護期 hand-off`」（格式見 `spec-p3-backend` SKILL Session Log 範例）
   - 兩類分項：
     - **上線前必補（blocker）**：留空殼 / 暫用 stub / 未實作的必要 UI 或互動
     - **技術債（non-blocker）**：i18n 暫用 namespace、CSS workaround、組件 emit 限制、未來 refactor 候選
   - 初稿來源（AI 自動歸納）：
     - `progress.md` 備註欄出現的 warning / skip
     - 本 session `session_log.md`「下 session 注意」中與「驗收 / 上線 / 維護」相關的條目
     - 各 task 的 SG2 對照表偏離項（PG 過了但仍是 hand-off 候選）
   - 每項註明來源：`{task id 或 session 章節}：{描述}`
   - **若無項目可歸納 → 兩類都列「（無）」，不可省略段落**

   **收尾報告（純 console，不另開 commit）：**
   - 完成 task 清單（按類型 tag 分類計數）
   - 任何 SG2 偏離 warning
   - hand-off 初稿摘要（提醒 PG 過目修改）
   - 建議 PG 下一步：
     1. 另起 session 執行 `/data`（產權限 + seed SQL）
     2. `/data` 跑完後開瀏覽器照 `test_cases.md` **整體手測**

   **SKILL 邊界**（完工後不入本 SKILL 的事，落到此 SKILL 之外）：
   - 整合手測（PG 開瀏覽器照 `test_cases.md` 跑）
   - 手測發現的 bug 修復 + UI 微調 → ad hoc 派 AI 修，**不寫入 `progress.md` / `session_log.md`**（避免文件膨脹失焦；ad hoc 修走 git log + commit message 自身紀錄）
   - 上線部署、維運監控

8. **Session 歸檔**

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | **Scope Statement**（Deliverable / 預期動到 / out-of-scope，切入點 7）+ 確認載入正確、類型分佈、**前端硬守則清單**（target CLAUDE.md + memory，分可 grep / 意圖兩類；切入點 4 動作 1）、commit-time hook 安裝狀態（PreToolUse Bash + git commit filter；未裝時可由 SKILL 寫入 `.claude/settings.local.json`）、起始 task | 不建議 |
| SG2 | `[service]` / `[store-map]` 寫實作前 | 「實作意圖 ↔ api_contract A##」對照表審（契約對齊防護） | **不可省略**（契約對照 task）|
| SG3 | task 結束 | 審閱繼續/回修；**UI 類 task（`[page]` / `[dialog]`）報告含 grep 守則違規清單**（只報不擋；切入點 4 動作 3） | 可降密度 |

**無 Demo Gate** — UI 類 task 不逐批停，全部前端 task 做完後由 PG 整體手測（見步驟 7）。

## 關鍵防護機制

1. **SG2 「實作意圖 ↔ api_contract A##」對照表審** — `[service]` / `[store-map]` 寫實作前必先列對照表，PG 過了才寫實作。`[store-map]` 對照表必須涵蓋 rename / null / 多餘欄位三類欄位處理（對齊 AR003 BUG-P4b-R4-CONTRACT 教訓）。**不寫 mock-based 契約測試**（fixture 與真實 BE 漂移風險高，SO0062 mapper camelCase 是反例：28 個 contract test fixture 對但實際後端已 camelCase；contract test 抓 typo OK，跨層漂移擋不下來）。
2. **`[service]` / `[store-map]` 對齊 api_contract** — 實作必須以 api_contract A## 小節為基準；不從 sibling FE code 推、不直接讀 BE Java/Processor 推。
3. **契約偏離 → 停手** — 實作必須偏離 api_contract 時，**不可自行改契約**，必須停下來由 PG 決策。
4. **完工後整體手測** — 避免 session 中途頻繁 demo 打斷節奏，讓 AI 一氣呵成做完前端，PG 最後一次看。
5. **Artifact 合一 commit、commit 標題乾淨** — progress.md / session_log.md 與實作 code 同一 commit；session_log.md 在最後一個 task 的 commit 內 append。commit 標題禁止 task id（`F01` / `F08` 等）。
6. **commit-time hook 自動 typecheck + vitest related（外部化 TDD Red-first 紀律）** — AI 跑 `git commit` 時自動跑 `npm run typecheck` + `npx vitest related --run <staged>`，失敗時透過 stdout JSON `{"decision":"block","reason":"..."}` block commit；reason 內含「⚠️ Do NOT auto-fix in-place. Notify PG.」要求 AI 不自動修、通知 PG。範本：`<skill-dir>/templates/hooks/typecheck-test-on-commit.ps1` + `settings.local.json.tmpl`（PreToolUse + matcher: Bash + script 內過濾 `git commit`）；SG1 提示 PG 安裝（spike 3 預設；spike 1 typecheck only / spike 2 + eslint 為替代設計骨架）。對應切入點 8（review/2026-04-09 A path）。設計理由：Edit / Write 每次跑切碎 AI flow（UI 微調如 `class="xxx"` 也卡 vue-tsc）；commit 時跑天然對齊 task 收尾（SG3 已是 typecheck stop gate，本 hook 補位「AI 跳過跑」極端），且 vitest related 在 commit 跑只挑相依 test 速度可接受。
7. **SG1 前端硬守則清單 + SG3 自動 grep 守則驗證（CLAUDE.md 對齊防護）** — SG1 從 target 前端 `CLAUDE.md` + PG memory 抽取本次 session 將遵守的前端硬守則，分「可 grep 驗證類」（附 regex pattern）與「意圖類」（由 PG 手測階段審）兩類列給 PG 確認；UI 類 task（`[page]` / `[dialog]`）SG3 報告附「對 commit 變動檔自動跑 grep pattern」的違規清單（檔名 + 行號 + 原文），**只報不擋**（與 commit-time hook 自動 block 機制互補：grep 屬風格 / 審美層，PG 判斷；hook 屬 typecheck / test 層，自動擋）。對應切入點 4 動作 1 + 動作 3（review/2026-04-09）。**規約內容由 target CLAUDE.md / PG memory 提供，SKILL 只負責「讀 + 列 + 驗證」機制，不預設任何具體規約**（如「零自訂 CSS」這類 PG 個人 / 專案專屬風格，SKILL 不該硬編；對齊切入點 9 撤回啟示）。設計理由：AR003 F20–F27 八個元件 1 commit / AR002 dialog 18+ session 微調這類「連跑後一次驗收 → 全部偏」事件，本機制在 SG1 對齊意圖、SG3 自動驗證落地，攔截擴散；若 target 沒有可 grep 規約 → 兩段都跳過，不增加干擾。
8. **Scope-lock 動手前必跑** — SG1 第一個子段為 Scope Statement（Deliverable / 預期動到 / out-of-scope）為 stop gate；實作中發現需超出 scope（改契約 / 全域 i18n / 順手調 dialog 風格 / 重構 sibling 元件）→ STOP 回報 PG，不自行擴張（對齊切入點 7 / Insight 報告 35 wrong_approach + 12 excessive_changes 觀察、AR002 dialog width 過度修改、AR003 F20-F27 一次驗收偏移）。

## 核心原則

1. **契約層走靜態對照、UI 層走手測** — `[service]` / `[store-map]` 走 SG2 對照 api_contract（無 mock-based test）；UI / UX / 樣式 / 文字由 PG 手測比寫測試快 10 倍。
2. **契約來源 = api_contract.md** — `[service]` / `[store-map]` 對照表與 mapper 實作均對齊 `api_contract.md` 的 A## 小節；不從 sibling code 推、不從 BE Java/Processor 直接讀；偏離 → 停手由 PG 決策。
3. **Subagent 不產出進 git 的檔案**。
4. **讀規範、不掃 code**。
5. **前後端分 session** — 共用 progress.md / session_log.md / api_contract.md，但實作不互相影響。
6. **SKILL 結束 = 完工三條件（task done + 收尾報告 + hand-off append）** — SKILL 結束後仍有 `/data` + PG 整體手測兩步才算真正可上線；整合手測 / UI 微調 / bug 修復走 ad hoc 派修，不寫進 progress.md / session_log.md。AR002 主輪後 ad hoc 沒紀錄是健康狀態而非缺失：SKILL 該結束就結束，後面是維護期。

## Checkpoint / Session Log

共用 `spec-p3-backend` 定義的 `Docs/spec/{程式編號}/log/{程式編號}_progress.md` 與 `{程式編號}_session_log.md` 格式。task prefix `F*` 為前端、`B*` 為後端。

## Session 歸檔

同 p3-backend，檔名改為 `{程式編號}-P3-frontend_{yyyyMMdd}_{HHmm}`。

## SKILL 本身改進建議

PG 使用此 SKILL 發現的改進建議，寫到 `~/.soetek-ai-coding/skill-feedback/spec-p3-frontend.md`。
