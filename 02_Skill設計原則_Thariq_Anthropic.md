# 參考文獻摘要｜Lessons from Building Claude Code: How We Use Skills

> 作者：Thariq Shihipar（Anthropic 工程師）
> 日期：2026-03-18
> 來源：https://www.linkedin.com/pulse/lessons-from-building-claude-code-how-we-use-skills-thariq-shihipar-iclmc

---

## 核心主張

Skills 不是「就是 markdown 檔案」— 它們是**資料夾**，可以包含腳本、資產、資料和配置（含動態 hooks）。最強大的 skills 充分利用這個資料夾結構和配置面。Anthropic 內部有數百個 skills 在使用中。

---

## 9 類 Skill 分類

| # | 類型 | 說明 | 範例 |
|---|------|------|------|
| 1 | **Library & API Reference** | 如何正確使用某個 library/CLI/SDK。含參考代碼片段和 gotchas | `billing-lib`, `frontend-design` |
| 2 | **Product Verification** | 如何測試/驗證代碼正常運作。搭配 Playwright、tmux | `signup-flow-driver`, `checkout-verifier` |
| 3 | **Data Fetching & Analysis** | 連接資料/監控堆疊。含 credentials、dashboard ID、常見查詢流程 | `funnel-query`, `grafana` |
| 4 | **Business Process & Team** | 將重複工作流程自動化為單一命令。保存歷史結果供一致性和反思 | `standup-post`, `weekly-recap` |
| 5 | **Code Scaffolding & Templates** | 生成框架樣板。搭配可組合腳本 | `new-migration`, `create-app` |
| 6 | **Code Quality & Review** | 強化組織代碼品質。可含確定性腳本。透過 hooks 或 GitHub Actions 自動運行 | `adversarial-review`, `code-style` |
| 7 | **CI/CD & Deployment** | 取、推、部署代碼。可引用其他 skills | `babysit-pr`, `deploy-service` |
| 8 | **Runbooks** | 從症狀（Slack 線程、警報、錯誤）出發，逐步調查，產出結構化報告 | `oncall-runner`, `log-correlator` |
| 9 | **Infrastructure Operations** | 例行維護 + 破壞性操作護欄 | `dependency-management`, `cost-investigation` |

---

## 9 項設計原則

### P1：Don't State the Obvious（不要說顯而易見的事）

Claude 已經知道很多關於編碼和你的 codebase 的事。**專注在把 Claude 推離正常思考方式的資訊**。

範例：`frontend-design` skill 是透過和客戶反覆迭代而建的，避免 Claude 預設的陳腔套路（Inter 字體、紫色漸層）。

### P2：Build a Gotchas Section（建立 Gotchas 區塊）

Skill 中**最高信號的內容**就是 Gotchas 區塊。從 Claude 遇到的**常見失敗點**建立，隨時間更新。

### P3：Use the File System & Progressive Disclosure（利用檔案系統做漸進揭露）

Skill 是資料夾，不只是 markdown 檔案。整個檔案系統就是一種 **context 工程和漸進揭露**。告訴 Claude 有哪些檔案，它會在正確的時機讀取。

- 詳細的函式簽名拆到 `references/api.md`
- 輸出模板放 `assets/`
- 包含 references、scripts、examples 資料夾

### P4：Avoid Railroading Claude（避免過度限制 Claude）

因為 skills 是可重用的，避免太具體。給 Claude 需要的資訊但**保留適應情境的彈性**。不要過度約束。

### P5：Think Through the Setup（考慮設定流程）

Skills 可能需要使用者特定的設定（如哪個 Slack 頻道）。將設定資訊存在 skill 目錄的 `config.json` 中。如果 config 缺失，讓 agent 詢問使用者。

### P6：The Description Field Is for the Model（描述欄位是給模型看的）

Claude Code 啟動時會建立所有 skill 的清單及其描述。描述**不是摘要 — 是觸發描述**，告訴模型何時啟用此 skill。

### P7：Memory & Storing Data（記憶與資料儲存）

Skills 可以儲存持久資料（append-only 文字日誌、JSON、甚至 SQLite）。

範例：`standup-post` skill 保存 `standups.log`，Claude 可以和昨天的做 diff。

注意：skill 目錄中的資料可能在升級時被刪除，使用穩定的 `${CLAUDE_PLUGIN_DATA}` 資料夾。

### P8：Store Scripts & Generate Code（儲存腳本並生成代碼）

給 Claude 腳本和函式庫，讓它**組合**而非重建樣板。

範例：資料科學 skill 含 helper functions 用於取事件資料。Claude 即時生成腳本來組合這些函式進行複雜分析。

### P9：On-Demand Hooks（按需 Hooks）

Skills 可以註冊只在 skill 被調用時啟動、持續到 session 結束的 hooks。用於你不想一直運行的帶有偏見的 hooks。

範例：
- `/careful` — 阻擋 `rm -rf`、`DROP TABLE`、force-push、`kubectl delete`（透過 PreToolUse matcher）
- `/freeze` — 阻擋指定目錄外的 Edit/Write（除錯時有用）

---

## 分發與管理

- **兩種分享方式**：check 進 repo（`./.claude/skills`）或透過內部 plugin marketplace 分發
- **規模問題**：每個 check-in 的 skill 都加到模型 context。規模化後 marketplace 讓使用者選擇安裝哪些
- **有機策展**：沒有中央團隊決定。Skills 從 GitHub sandbox 資料夾開始 → 透過 Slack 牽引力獲推廣 → 經 PR 移至 marketplace。發布前策展很重要 — 壞的/重複的 skills 很容易產生
- **組合 Skills**：用名稱引用其他 skills，模型會調用它們（如果已安裝）
- **衡量 Skills**：用 `PreToolUse` hook 記錄全公司的 skill 使用情況

---

## 反模式

- 跨多類別的 skills 容易混淆；最好的 skills 清楚歸入單一類別
- 指令太具體（railroading）讓 skill 在不同 context 下變脆弱
- 發布前不策展 → 壞的/重複 skills 擴散
- 不持續更新 gotchas 區塊 = 浪費 skill 最高價值的內容
- 將持久資料存在 skill 目錄（升級時會被刪）而非 `${CLAUDE_PLUGIN_DATA}`
