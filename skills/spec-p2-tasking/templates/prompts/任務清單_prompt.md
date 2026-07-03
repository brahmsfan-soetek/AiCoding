# 任務清單 Prompt 模板

## 用途說明

**何時使用：** 已完成 `spec-p1-digest-flow` S1–S4、取得最終版規格統計，並將規格與 UI 截圖搬入專案 repo 後，於專案目錄內執行。

**如何使用：**
1. 執行前 AI 必須先讀取專案 `CLAUDE.md` 索引並讀取其指向的規範文件（見下方「專案 Context 建立」）。
2. 執行前 AI 必須透過 MCP MySQL 唯讀連線取得真實 DB schema 並落地成 `current_schema_{程式編號}.md`（見下方「DB schema 建立」）。
3. 將所有 `{佔位符}` 替換為實際檔名、程式編號或說明。輸入檔案直接從工作目錄讀取。
4. AI 產出四份檔案，輸出至使用者指定位置（建議 `Docs/spec/{程式編號}/plan/`）。

**注意事項：**
- **業務邏輯權威來源 = 規格統計**；衝突時以規格為準。
- **欄位型別權威來源 = `current_schema_{程式編號}.md`**（透過 MCP 唯讀 DESCRIBE 取得）；衝突時以真實 DB schema 為準。
- UI 截圖僅供參考排版佈局，不得依截圖自行推斷規格統計中未明確定義的欄位或邏輯。
- 任務清單中的 component 名稱、API 命名、目錄結構、測試寫法**必須貼合專案規範文件的定義**，不得憑空發明。
- **類型 tag 是 P3 SKILL 分流測試策略的關鍵**，每個 task 必須正確標註。
- **API 契約清單是 FE / BE 共讀來源**，每支 API 一張，三方（BE Processor / FE service / FE store-map）對齊它而非彼此推測。

---

## 專案 Context 建立（執行 prompt 前必做）

在產出任務清單之前，AI 必須先完成以下步驟：

1. 讀取專案根 `CLAUDE.md`，理解專案整體慣例、禁止事項、技術棧。
2. 依 `CLAUDE.md` 索引，逐一讀取其指向的規範文件，取得：
   - 前端：元件命名規範、目錄結構、共用元件清單、路由慣例、i18n 慣例
   - 後端：Entity / Processor / SQL / Validator 命名規範、目錄結構、業務邏輯寫法
   - 測試：測試框架、撰寫格式、目錄結構（P3 backend 與 P3 frontend 可能不同框架）
3. **不掃 code 歸納 pattern** — 所有 context 來自 `CLAUDE.md` 索引揭露的規範文件（deterministic）。
4. 若專案無 `CLAUDE.md` 或索引不完整：
   - 告知使用者缺少哪些規範
   - 使用通用骨架分類作為 fallback
   - 讓使用者決定是否先補充 `CLAUDE.md` 再繼續

將規範文件的結論作為輸出任務清單時的**命名與結構依據**。遇到規格統計要求與專案規範衝突時，以專案規範為準，並在清單中註記。

---

## DB schema 建立（執行 prompt 前必做）

在產出任務清單與 API 契約之前，AI 必須先取得真實 DB schema：

1. **辨識涉及的表清單**：從規格統計與 UI 截圖中辨識此程式涉及的所有表（含主表、關聯查詢表、LOV 表、權限表）。
2. **與 PG 確認候選表清單**：列出候選表，PG 可增減；確認後才可進行 DESCRIBE。
3. **透過 MCP MySQL（唯讀）執行 DESCRIBE**：對每張確認的表執行 `DESCRIBE {table_name}`；必要時補 `SELECT` 取得 column comment / default 等資訊。**不可走 Bash mysql CLI**（escape 風險）；**不可從 sibling Java/SP code 推測 schema**。
4. **落地成 `Docs/spec/{程式編號}/plan/current_schema_{程式編號}.md`**：每張表一個小節，固定欄位：欄位名 / 真實型別（含長度精度，如 `VARCHAR(20)` / `DECIMAL(13,2)` / `CHAR(1)`）/ Nullable / Default / Key / Comment（若有）。建議格式：

   ```markdown
   ## {TABLE_NAME}

   > 來源：MCP DESCRIBE — {YYYY-MM-DD HH:mm}
   > 用途：{此程式中的角色：主表 / LOV / 關聯表 / ...}

   | 欄位 | 型別 | Null | Key | Default | Comment |
   |------|------|:----:|:---:|---------|---------|
   | {CUSTOMER_CODE} | VARCHAR(20) | NO | PRI | — | 客戶代號 |
   ```

5. **MCP 連線失敗** → **中止流程**，告知 PG 需修復連線；不得自行 fallback。

`current_schema_{程式編號}.md` 是後續所有 schema 檢核（API 契約、後端 Entity / SQL / DDL、前端 mapper）的唯一權威來源。

---

## Prompt 模板

```
請先完成【專案 Context 建立】與【DB schema 建立】兩個前置步驟，讀取 CLAUDE.md 索引及其指向的規範文件、產出 current_schema_{程式編號}.md，再閱讀附件的最終版規格統計，依照前端任務清單模板、後端任務清單模板、API 契約清單模板、測試清單模板的結構，同時產出以下四份可執行的文件：

  1. {程式編號}_frontend_tasks.md
  2. {程式編號}_backend_tasks.md
  3. {程式編號}_api_contract.md
  4. {程式編號}_test_cases.md

（current_schema_{程式編號}.md 已於前置步驟產出，本步驟僅讀取使用）

【輸入檔案】
- {最終版規格統計檔名}（最終版規格統計，業務邏輯權威來源）
- current_schema_{程式編號}.md（真實 DB schema，欄位型別權威來源）
{以下視情況增減}
- {UI 截圖 PNG 檔名或說明}（UI 截圖，僅供排版版面參考）

【輸入優先級說明】
業務邏輯權威來源 = 規格統計：所有欄位名稱、欄位行為、流程邏輯以規格統計文字為準。
欄位型別權威來源 = current_schema：所有 SQL 型別（長度、精度、nullable）以 DESCRIBE 結果為準；規格統計只給「業務型別」（如「金額」「日期」）時，必須交叉 current_schema 補正為真實 SQL 型別。
UI 截圖（PNG）僅供參考版面排版與佈局，不得依截圖自行推斷規格統計中未明確定義的欄位或邏輯。
三者衝突時的優先序：業務邏輯依規格統計、欄位型別依 current_schema、版面佈局依 UI 截圖。

【專案慣例優先級說明】
任務清單中所有 component 名稱、檔案路徑、API 命名、目錄結構、測試寫法，必須與 CLAUDE.md 索引指向的規範文件一致。
若規格統計的要求無法直接對應到專案既有規範，應在任務清單中明確標記「⚠️ 規範未涵蓋，待確認」，而非自行發明新結構。

【輸出要求 — 前端任務清單】
1. 依前端任務清單模板的結構輸出。
2. 分類依據：CLAUDE.md 索引指向的前端規範文件中定義的分類慣例。
3. 若無前端規範文件，fallback 到通用骨架分類：資料層（型別/服務）→ Store 層 → 介面層（頁面/彈窗）→ 業務邏輯 → 整合點 → 驗證。
4. 每個 task 必須包含：task id / **類型 tag** / 描述 / 依賴（若有）/ 驗收條件。
5. **類型 tag 必須從以下集合選擇**：
   - `[service]` — API 服務層（呼叫後端 API 的封裝）
   - `[store-map]` — Store 內的 mapping helper（後端欄位 → 前端欄位）
   - `[store-action]` — Store action（loadXxx / submitXxx）
   - `[types]` — TypeScript interface / type 定義
   - `[page]` — 頁面元件
   - `[dialog]` — 彈窗 / Modal 元件
   - `[i18n]` — 語系檔
   - `[router]` — 路由設定
6. Store 相關 task 應**把 mapping helper 與 action 分開列**（tag 不同、P3 測試策略不同）。

【輸出要求 — 後端任務清單】
1. 依後端任務清單模板的結構輸出。
2. 分類依據：CLAUDE.md 索引指向的後端規範文件中定義的分類慣例。
3. 若無後端規範文件，fallback 到通用骨架分類：資料層（Entity/SPI）→ 介面層（Processor）→ 業務邏輯（Validator）→ 核心流程拆分 → SQL 層 → 整合點。
4. 每個 task 必須包含：task id / **類型 tag** / 描述 / 依賴（若有）/ 驗收條件。
5. **類型 tag 必須從以下集合選擇**：
   - `[validator]` — 驗證器 / 純函式 / 演算法 / 狀態機
   - `[processor]` — API Processor
   - `[sql]` — SQL YAML / DDL
   - `[entity]` — Entity / Domain 物件
   - `[spi]` — SPI 介面 / 抽象類別
6. **`[processor]` 類 task 必須額外填寫「選填欄位」欄**（逗號分隔清單）+ 對應 API 契約小節編號（A##），供 P3 SG2 雙對照表審：
   例：`選填欄位：customerCode, customerName, riskLevel, collector`；`api_contract: A03`
   P3-backend SG2 列 (1) `api_contract A## Response 欄位` ↔ `預計實作 response shape`、(2) `current_schema 表欄位` ↔ `SQL/Entity 引用欄位` 兩張對照表給 PG 審，不寫 mock-based 單元測試；SQL `:param IS NULL OR ... = :param` pattern 的空值未處理 bug 由 PG 手測涵蓋（透過 test_cases.md）。
7. 後端 Processor task 必須對應到 API 契約清單中的某一支 API（在驗收條件或備註中註明對應的 routeId / 契約小節編號，如 `A01`），供 P3-backend SG2 雙對照表審。
8. **帶計算 / 比較 / 彙總規則的 task（不限類型，常見於 `[processor]` / `[validator]`）必須在所屬表格下方附「規則原文」區塊**：
   - **逐字**抄錄規格統計或 api_contract「業務說明」中的規則原文（禁止改寫、濃縮、轉述）+ 出處（A## / §x.y）
   - 純 CRUD task 不附（免文件爆肥）
   - 此區塊的有無即 P3 歧義分流依據：有 → SG2 必走「規則複述」段；無 → 照舊
   - 只給頁碼 / A## 指針而不抄原文 = 不合格（實作端手上只剩幾個字，容錯空間極大）

【輸出要求 — API 契約清單】
1. 依 API 契約清單模板的結構輸出。每支 API（依規格統計列出的 routeId）一個小節（A01 / A02 / ...）。
2. **欄位型別必填且必須為真實 SQL 型別**：所有 Request / Response / 巢狀層欄位的「真實型別」欄必須從 `current_schema_{程式編號}.md` 取得（如 `VARCHAR(20)` / `DECIMAL(13,2)` / `CHAR(1)` / `TIMESTAMP`）。規格只給業務型別（如「金額」「日期」「20 碼客戶代號」）→ 必須交叉 current_schema 補正。
3. **「對應 DB 欄位」欄**：直接 SELECT 自單一表時填 `表名.欄位名`（如 `AR_CUSTOMER.CREDIT_AMT`）；跨表組合或運算結果填 `(計算)` 並在「業務說明」欄說明來源。
4. **「規格出處」欄**：填規格統計的章節編號或表格編號（與規格統計 source-mapping 對接）；若為 DB 有但規格未涵蓋的欄位 → 填 `⚠️ 規格未涵蓋，待 SA 確認` 並列入文末「保留欄位」段。
5. **i18n key 段**：錯誤碼 → i18n key 一對一對應，key 命名必須符合 CLAUDE.md / 規範文件指定的 namespace。
6. **跨層對齊備忘段必填**：每支 API 在「BE Processor」「FE service」「FE store-map」三項填上對應的後端 / 前端 task id，留空只在該層尚未對齊或不需要時可接受（並加註原因）。
7. **保留欄位段**：由 current_schema 反查發現「DB 有但規格未涵蓋」的欄位，列此段待 SA 確認；不主動納入 Response shape。
8. **規則明示**：在檔案開頭使用說明已寫「不一致 → 改 code、不反向改契約」；產出時不需在每支 API 重複，但若 BE/FE task 中有預期會違反此規則的情況（如 Response shape 高度依賴 Processor 實作後才知），需在該 task 的備註中明示「契約待 P3-backend 收尾時 reconcile」。

【輸出要求 — 手測 Checklist（測試清單）】
1. 依測試清單模板的結構輸出。檔名仍為 `{程式編號}_test_cases.md`。
2. **定位：此檔為 PG 手測 checklist，不是自動化測試 script**。P3 實作完、spec-p3-data 產好 permission/seed 後，PG 開瀏覽器照此清單逐條對驗。
3. 每個測試案例格式：`| # | 測試案例 | 前置條件 | 執行步驟 | 預期結果 | 狀態 |`
4. 分類依據：CLAUDE.md 索引指向的測試規範文件中定義的分類慣例。
5. 若無測試規範文件，fallback 到通用骨架分類：基礎 CRUD → 驗證規則 → 業務流程（逐步拆分）→ 整合點 → 邊界/併發。
6. **「執行步驟」必須具體到「點哪個按鈕、填什麼值、看哪個欄位」**，人眼可直接照做，不能只寫「建立客戶」這種抽象動作。
7. **「預期結果」必須具體到「顯示什麼文字 / 數值 / 狀態」**，不可含糊如「成功」「正確」。
8. 「狀態」欄預設填 `☐`（未測），PG 手測時才填 `✅` / `❌` / `⚠️`。

【完成後自檢（請逐項確認）】
1. **四份**文件是否已全部產出，且命名符合 {程式編號}_*.md 格式？（frontend_tasks / backend_tasks / api_contract / test_cases）
2. `current_schema_{程式編號}.md` 是否已於前置步驟產出且 commit？所有 API 契約欄位型別是否都能在 current_schema 找到對應？
3. 規格統計中每個 API 端點，後端清單是否都有對應的 `[processor]` task，且 API 契約清單也有對應的 `A##` 小節？
4. 核心業務邏輯的子步驟，是否與規格統計中描述的完整流程一致，無跳躍或遺漏？
5. 前端連動邏輯，測試清單是否有對應的測試案例？
6. 是否有任何欄位或業務邏輯只出現在 PNG 截圖而未出現在規格統計中？若有，應標記「⚠️ 規格統計未定義，待確認」而非直接實作。
7. 清單中所有檔案路徑、命名是否都與 CLAUDE.md 索引指向的規範文件一致？若有差異是否已標記「⚠️ 規範未涵蓋，待確認」？
8. **每個 task 是否都已正確標註類型 tag？**
9. **每個 `[processor]` task 是否已填寫「選填欄位」清單？**（若該 Processor 無選填欄位，填「無」明示）
9-1. **每個帶計算 / 比較 / 彙總規則的 task 是否已附「規則原文」區塊？**逐條檢查：原文是否逐字（非轉述）、出處是否可回溯（A## / §x.y）？api_contract 中「對應 DB 欄位」填 `(計算)` 的欄位，其所屬 task 必有此區塊。
10. **API 契約清單**每支 API 是否都有：
    - Request shape（Path/Query/Body 三段，無則填「無」）
    - Response shape 的「結構示意」+「欄位逐條對照」兩段
    - 失敗段（HTTP status × 觸發條件 × i18n key × 規格出處）
    - 跨層對齊備忘（對應的 BE Processor / FE service / FE store-map task id）
11. **DB 有但規格未涵蓋的欄位**是否列入 API 契約清單的「保留欄位」段，並標 `⚠️ 規格未涵蓋，待 SA 確認`？
12. 測試清單的每個案例是否都有「前置條件」「執行步驟」「預期結果」「狀態」四欄，且執行步驟具體到可直接照做？

【輸出紀律】
產出一律寫入檔案；console 回覆僅列 ≤10 行摘要（檔名、task 數量統計、⚠️ 待確認項），不得將文件內容整段貼進對話。PG 審檔案，不審 console。
```
