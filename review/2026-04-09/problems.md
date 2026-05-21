# spec-workflow Review — 問題紀錄

> 日期：2026-05-21
> 範圍：spec-workflow bundle（spec-p1-digest-flow / spec-p2-tasking / spec-p3-backend / spec-p3-frontend / spec-p3-data）
> 來源：AR002 / SO0062 / AR003 三個專案實作 log + PG 親身使用體感

## 三專案概覽

| 專案 | 進 SKILL 的 session 數 | bug round | 整體工程體感 |
|------|:---:|:---:|------|
| **AR002** | 2（前/後端各一）；主輪後 ad hoc 修無紀錄 | 0 | 順 — SKILL 內兩 session 收 32+27 task |
| **SO0062** | 3（後/前端/data） | 0 | 中間 spec 變更（員工 LOV → 手動輸入）；其他順 |
| **AR003** | 11 | 4 輪 BUG + SA 11 項需求補充 | 一路踩雷，P4b 才暴露 schema/契約/i18n 三層的洞 |

差距集中在 AR003，正好是 skill 早期試用版本。後續兩個專案在 SKILL 改版後跑得相對乾淨，痛點主要從 AR003 沉澱。

**注意**：AR002 實際 session 數遠超兩個（這是花最久時間的程式）；只是「主輪 SKILL 跑完後就改 ad hoc，沒進 SKILL 流程所以沒紀錄」。代表 SKILL 在「主輪實作」表現可以，但「手測收尾 / bug 修復」整段沒涵蓋。

---

## PG 提出的 5 個觀察點

### 1. SKILL 範圍邊界沒劃清楚

**現象**：AR002 主輪 SKILL 跑完後就退到 ad hoc 派工，沒進 SKILL 流程也沒紀錄。

**反映的問題**：
- SKILL 沒明確定義「什麼時候該結束」
- 結束後遺留的洞（bug 修復、UI 微調、整合手測）由誰補、是否進 SKILL 都不清楚
- AR003「P3 標完工 → P4b 全爆」的落差就是這個邊界沒劃好的後果

### 2. 規格文件轉統計時容易出錯（**最重要**）

PG 描述三種失效模式：

| 失效模式 | log 對應 |
|---|---|
| 漏看 | AR003 規則 A 整段被漏，到 SA 補充才補（→ N01-N09 11 項修復 commit `e5ab948` / 規格統計 §2 翻轉 B31-3 原則）|
| 靜默誤解 | AR003 SA §10「第 1 名催收專員」一開始解讀成 `CREATE_DT DESC LIMIT 1`，後來才改 `CREATOR ASC`（規格沒明示「第 1 名」是哪種排序）|
| 規格某一小段被誤植帶出不存在的功能（hallucination） | AR003 早期「爭議原因下拉」F01 後才拔；AR002 早期「員工 LOV」也是這種誤植，後改回手動輸入 |

**目前 SKILL 缺什麼**：
- 規格統計沒有「source 出處」欄位 → 規格爭執時無法逆查原文
- 釐清清單只列「我看不懂的」，不主動列「我這樣解讀對嗎」型問題
- S4 整合沒做「每個規格章節 → 至少一個統計項」的反向 coverage 檢查

### 3. 前後端變數名 / 後端 DB 欄位沒對上

PG 點出根因：**專案內的 DDL 文件不即時，正確的在實際 DB**。

**log 對應**：

| 案例 | 內容 |
|---|---|
| AR003 BUG-A1（schema 漂移）| 規格統計寫 17 欄 / `Docs/DDL/AR_RECORDS.sql` 只 15 欄 / 實 DB schema 也缺 2 欄 → MySQL `Unknown column 'r2.CUSTOMER_CODE'` → P4b 整批 SYS004。Entity 結構測試只驗 `@Column` annotation，沒驗真 DB 或 DDL 檔 |
| AR003 BUG-P4b-R4-CONTRACT | 4 支 View2 API 回傳欄位名與前端型別全不一致（後端回 `creditAmt` / 前端讀 `creditLimit`、後端回 `info` / 前端讀某層巢狀）→ Store 誤讀 `d.info` 永遠取到 undefined → 客戶卡空、帳齡 NaN、Tab 列全錯 |
| AR003 BUG-P4b-R3（normalize 不對齊）| customerQuery 4 個選填欄位只修了 collector 一個，其他 3 個沒修 → 前端送 `riskLevel=""` 觸發 SQL `c.CREDIT_LEVEL = ''` 永遠無匹配 → 37 條 spec 全 fail |
| SO0062 mapper 寫完才發現後端是 camelCase | 寫完 28 個 contract test 後才意識到沒先讀後端 processor 確認 mapping 落地點，緊急修 type/mapper/test 三邊 |

**反映的問題**：
- spec-p3-backend 啟動時假設 DDL 檔（或規格統計）就是 schema 來源，沒去查真 DB
- spec-p2 不產 API contract 一級文件（routeId × request × response），FE/BE 各自寫 task，無共同基準
- spec-p3-frontend 沒「開寫 mapper 前先 grep 後端 processor 落地」的硬閘
- spec-p3-data 的 「schema 漂移 STOP 不自主補」太晚（要 P3-data 才觸發），應前置到 spec-p2

### 4. UI 出來常需大量微調，CLAUDE.md 規範被忽略

對應已存在的記憶條目：`feedback_frontend_style.md`（前端必須組件式 / CSS 參考 GL002/GL012 / 零自訂 CSS）、`feedback_template_extraction.md`、`feedback_no_subagent_for_templates.md`。

**反映的問題**：
- spec-p3-frontend 沒「第一個元件 milestone stop」，連跑 27 個元件後一次驗收，差距已大
- CLAUDE.md 規範被忽略通常兩個根因：
  - sub-agent 拿不到 CLAUDE.md 的完整上下文（與 `feedback_no_subagent_for_templates.md` session-791acadc 根因吻合）
  - 連跑模式下 AI 自己內部漂移，沒外部驗證
- 沒自動化的「禁止自訂 CSS / inline style」regex 守則 — 規範違反靠肉眼

### 5. 寫測試感受不到好處，反而拖慢實作、佔 token、稀釋規範

PG 自問：「這是設計測試不佳嗎？」

**直接答**：是設計策略不佳，不是「寫測試」本質不好。

**從 3 個專案抓真正抓到 bug 的測試類型反推**：

| 測試類型 | 範例 | 真正抓到 bug 的比例 |
|---|---|:---:|
| 純函式邊界（純 static） | ArNumberFormatter 21 碼、DateRangeValidator、InvoiceStatusResolver、PromiseDateValidator | **高**（邊界、null、空字串、emoji 真在抓）|
| Processor mock-based 單元測試 | mock NativeSqlService → 驗 Processor 把參數丟對 | **低**（mock 設成自己預期再驗自己，套套邏輯）|
| Contract test（FE service / mapper） | 驗 routeId 字串、payload shape、欄位 rename | **中低**（抓 typo OK，但 BUG-P4b-R4-CONTRACT 跨層欄位名不一致完全沒擋）|
| 跨層 schema 一致性 | AR003 後補的 `ArRecordsDdlConsistencyTest`、`arNamespaceParity.test.ts` | **高**（治本，目前 SKILL 沒系統性產出）|
| Testcontainers 整合測試 | （目前 SKILL 沒做） | **理論上最高**（真 DB 跑真 SQL，無 mock 套套邏輯）|

也就是說：**SG2 大量產出的 117 / 324 / 134 個單元測試，真正攔到 bug 的比例可能不到三成**。其餘是「mock 行為 = 規格本身」的套套邏輯，token 成本高、規範稀釋、實作拖慢，符合 PG 體感。

memory `feedback_integration_test_tool.md` 已記載 PG 對 Testcontainers 的傾向，但目前 SKILL 沒落地。

---

## 五個 skill 的洞（對照 log）

### spec-p1-digest-flow

- **現況**：S0–S4 純文件作業，靠 step1/step2/step4 三份 prompt 帶整套流程；模板表格無「規格出處」欄
- **洞 1**（漏看 / 誤解 / 誤植）：規格統計沒 source map；釐清清單偏被動「我看不懂的」
- **洞 2**（章節 coverage）：S4 整合沒做反向 mapping（每個原始章節 → 至少一個統計項）→ AR003 規則 A 整段被漏
- **洞 3**（變更回流）：SA 後續補新需求（AR003 N01-N09 / SO0062 員工 LOV → 手動輸入）時無 mini-loop，直接撞進 P3

### spec-p2-tasking

- **現況**：產三份 task 清單（frontend_tasks / backend_tasks / test_cases），類型 tag 已分流
- **洞 1**（FE↔BE 契約沒一級產出）：BUG-P4b-R4-CONTRACT 根因；4 支 API response shape 沒共讀來源
- **洞 2**（DDL/schema 沒被當輸入）：spec-p2 完全不碰 DB schema，要 spec-p3-data 才出現「schema 漂移 STOP 報告」這條防線

### spec-p3-backend

- **現況**：SG2 強制 Processor 選填欄位 null/""/空白；artifact 即 commit；session_log 區分「決策 / 教訓」
- **洞 1**（mock-based test 套套邏輯）：Processor mock NativeSqlService = 把 mock 設成預期再驗自己；AR003 BUG-P4b 全是這類測試沒擋的
- **洞 2**（DDL ↔ Entity 一致性沒測）：B01 Entity 結構測試只驗 `@Column` annotation；AR003 BUG-A1 才暴露要驗 DDL 檔 + 真 DB schema
- **洞 3**（沒 BE-first 真 DB DESCRIBE）：DDL 文件不即時是 PG 點明的問題，目前 SKILL 不對應

### spec-p3-frontend

- **現況**：只測 service / store-map 契約層，其他不寫測試由 PG 手測
- **洞 1**（無第一元件 milestone）：CLAUDE.md 規範被忽略是「連跑 N 個元件再驗收」的後果
- **洞 2**（i18n parity / locale 沒測）：AR003 BUG-B1（en-US/ar/ 不存在）、BUG-C1（Playwright 預設 en-US）都不在 contract test 範圍
- **洞 3**（mapper 沒 BE-first 讀碼）：SO0062 寫完 28 個 contract test 才發現後端是 camelCase；SKILL 沒「開寫 mapper 前先 grep 後端 processor」的硬閘

### spec-p3-data

- **現況**：「schema 漂移 STOP 不自主補」、「SG2 授權後才執行 SQL」已寫，這兩條對
- **洞 1**（特徵碼 vs 既有殘留沒對接）：SO0062 G01/G02/G03 殘留差點誤判；特徵碼只擋自己塞的，不擋既有資料
- **洞 2**（schema 漂移檢查太晚）：應前置到 spec-p2 / spec-p3-backend

---

## 觀察點 → skill 影響矩陣

| 觀察點 | spec-p1 | spec-p2 | spec-p3-be | spec-p3-fe | spec-p3-data | 其他 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1. SKILL 範圍邊界沒劃 | — | — | ✓ | ✓ | ✓ | 全體收尾流程 |
| 2. 規格統計三種失效 | **✓✓** | ✓ | — | — | — | — |
| 3. FE↔BE 變數 / DDL 漂移 | — | **✓✓** | **✓✓** | ✓ | ✓ | — |
| 4. UI 微調 / CLAUDE.md 被忽略 | — | — | — | **✓✓** | — | sub-agent 流程 |
| 5. 測試 ROI 低 | — | — | **✓✓** | ✓ | — | — |

---

## 外部 Insight Report 補強

> 來源：`log/report-2026-05-20-172026.md`（Claude Code Insights，分析 2026-04-09 到 2026-05-20 期間 2,586 messages / 146 sessions / 205 commits）

### 友擦類型統計（model-estimated）

| 友擦類型 | 次數 | 對應 PG 觀察點 |
|---|:---:|---|
| Wrong Approach | 35 | 觀察 1 / 4 |
| Buggy Code | 24 | — |
| Misunderstood Request | 19 | 觀察 1 / 4 |
| Excessive Changes | 12 | 觀察 1 / 4 |
| User Rejected Action | 9 | — |
| Output Token Limit Exceeded | 2 | — |

整體滿意度：likely_satisfied 299 / dissatisfied 36（8:1），但 35 wrong_approach 是可消除的痛點。

### 補新觀察點 6：Premature solutioning + Unauthorized inferences（Claude 行為模式層）

PG 的 5 個觀察是現象層；Insight 把根因往上推一層 — 這三條是「Claude 自身行為模式」的問題，與 SKILL 流程設計可正交補強：

| 根因 | Insight 列舉的案例 |
|---|---|
| Premature solutioning before clarifying scope | Claude 把 business Selects 渲成 static table 而非 live demos；Claude 開始產生 test seed data 而非 SP syntax test script |
| Unauthorized inferences / scope creep | AR002Q spec 加未要求的 export feature；dialog width 過度修改（PG 只要拔 body padding） |
| Wrong source of truth for verification | Claude 從 GL010 code 推 SP signature 而非直查 DB；用 `standardPrice` 而非 `avgPrice` |

這三條跟 PG 觀察 3「DDL 不即時」/ 觀察 4「UI 微調 / CLAUDE.md 被忽略」高度重疊，但提供了更上游的角度：不是 SKILL 沒設計好，而是 Claude **預設行為傾向先動手 / 先推測 / 先擴張範圍**。SKILL 改造可以擋部分，但根治需要 CLAUDE.md 規約 + MCP + Hooks 三層配合。

### Insight 揭露的高頻活動

- **205 commits / 58 sessions**：高 commit 密度反映「iterative 修正」與 commit consolidation（20 → 7）是常態
- **UI styling refinement 88 sessions**：PG 觀察 4「UI 大量微調」是真正的高頻事件，不是個案
- **session-by-day**：morning 665 / afternoon 1,703 / evening 218 / night 0
- **multi-clauding 11% messages**：經常多 session 平行
- **top tools**：Bash 3,772 / Edit 3,274 / Read 2,724 — 重 Bash 反映「實際操作 DB / 跑測試 / 跑 lint」的頻次

### Insight 建議的 3 個 CC Feature（給切入點補來源）

| Feature | 解決什麼 | 對應 PG 觀察 / Insight 根因 |
|---|---|---|
| Custom Skills（已用 spec-workflow）| 把 scope-lock + source-of-truth 規約內建 | 觀察 1 / Premature solutioning |
| MCP Servers（MySQL）| 解決「DB-first 驗證」靠 PG 口頭提醒的問題 | 觀察 3 / Wrong source of truth |
| Hooks（PostToolUse）| 自動跑 typecheck / mvn test 在 Edit / Write 之後 | 觀察 5 測試 ROI + TDD Red-first 紀律 |

---

## 附錄：本次 review 主要引用的 log 事件

| 事件代號 | 簡述 | log 出處 |
|---|---|---|
| AR003 BUG-A1 | AR_RECORDS schema 漂移 17 欄 vs DDL 15 欄 | `log/AR003_progress.md` BUG-A1 / Session 10 |
| AR003 BUG-B1 | en-US/ar/ 整個資料夾不存在 | `log/AR003_progress.md` BUG-B1 |
| AR003 BUG-C1 | Playwright 預設 locale=en-US + i18n key 不對齊 | `log/AR003_progress.md` BUG-C1 |
| AR003 BUG-P4b-R3 | customerQuery 4 個選填欄位只修 1 個 | `log/AR003_progress.md` BUG-P4b-R3 |
| AR003 BUG-P4b-R4-CONTRACT | 4 支 View2 API 回傳欄位與前端型別不一致 | `log/AR003_progress.md` BUG-P4b-R4-CONTRACT |
| AR003 N01-N09 | SA 需求補充 11 項修復（規則 A / HIS 無狀態 / 可修改 REC_STATUS / 第 1 名催收 / collector 欄可清） | `log/AR003_progress.md` Session 11 |
| AR002 B03 違反 Red-first | LoadOpenItems 直接寫實作沒先跑 Red | `log/ar002_session_log.md` Session 2 |
| AR003 B40 SG2 筆誤 | 22 碼 vs 21 碼預期值人為筆誤 | `log/AR003_session_log.md` Session 2 |
| SO0062 mapper camelCase 緊急修 | 寫完 28 個 contract test 才發現後端已轉 camelCase | `log/so0062_session_log.md` Session #2 |
| SO0062 G01-G03 殘留差點誤判 | 對帳 query 沒帶 SALE_DIVISION='00' 過濾 | `log/so0062_session_log.md` Session #3 |
