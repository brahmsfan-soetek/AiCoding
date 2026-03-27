# Phase 0｜規格衝突檢查

**執行者**：同一 session（Demo 版無 Agent 分離）

**目的**：在開始任何開發工作之前，交叉比對所有規格來源，消除矛盾。
矛盾 context → LLM 100% 靜默混合而非報錯。矛盾消除必須在開發之前完成。

## 輸入

從 `.agentic/config.json` 讀取路徑：

| 來源 | 說明 | 格式 |
|------|------|------|
| 規格書 | SA 文件，含功能需求、Use Case、業務邏輯、SQL | DOCX 或 MD（可含圖片） |
| HTML 畫面 | UI mockup，每頁一個檔案 | 目錄（多個 .html） |
| DDL/CSV | 資料表結構定義（欄位名、型態、約束） | 目錄（多個 .csv） |
| 邏輯文件 | 業務邏輯補充、SA 口頭澄清的書面化 | 目錄（.txt/.md） |

## 步驟

### Step 0：輸入前處理

根據規格書格式執行對應的前處理：

| 格式 | 處理方式 |
|------|---------|
| **DOCX** | 執行 `python docx2md.py {specPath}` 轉為 MD + 圖片，更新 `config.json` 的 `specPath` 和 `specImageDir` |
| **MD + 圖片** | 確認 `config.json` 的 `specImageDir` 指向圖片目錄，MD 中的圖片引用路徑正確 |

> LLM 無法可靠讀取 DOCX。MD 中引用的圖片須以 Read 工具讀取確認內容。

### Step 1：讀取所有來源

列出每個來源的關鍵資訊：
- 規格書：功能清單、欄位定義、狀態值、業務規則、SQL
- HTML：每頁的欄位、按鈕、流程、狀態顯示
- DDL/CSV：每張表的欄位名、型態、長度、nullable、預設值、鍵別
- 邏輯文件：覆寫或釐清的條目

### Step 2：規格書 ↔ HTML 比對

| 比對維度 | 常見衝突 |
|---------|---------|
| 欄位名稱與數量 | 規格書列 5 個欄位，HTML 顯示 7 個 |
| 狀態碼與列舉值 | 規格書寫 A/P，HTML 顯示 DRAFT/POSTED/CANCELLED |
| 按鈕與操作流程 | 規格書寫「刪除」，HTML 無對應按鈕 |
| 頁面跳轉邏輯 | 規格書的 Use Case 流程 vs HTML 的實際連結 |
| 必填/選填標記 | 規格書標為選填，HTML 有 required 標記 |
| **UI 互動模式** | **規格書寫「跳轉頁面」，但 HTML 實際呈現為 Dialog 彈窗（或反之）。此維度決定前端使用 Dialog 模式還是 Page 模式，必須比對。** |

> **⚠️ UI 互動模式判斷**：規格書常用「頁面」一詞描述所有子功能畫面（如 detail、detail2），但這**不代表**前端必須建立獨立路由頁面。必須觀察 HTML mockup 的實際呈現：
> - HTML 以彈窗/overlay/modal 呈現 → **Dialog 模式**（前端使用 SDialog2 組件，不建立獨立路由）
> - HTML 以完整獨立頁面呈現（有獨立 URL、頁面標題、返回導航） → **Page 模式**（前端建立獨立路由）
> - 若 HTML 不明確，依複雜度判斷：表單欄位少（<20 個）且操作流程簡單 → Dialog 模式

### Step 3：規格書 ↔ DDL/CSV 比對

| 比對維度 | 常見衝突 |
|---------|---------|
| 資料表名稱 | 規格書寫 `TM_EMP_VACATION`，DDL 寫 `TM_EMPLOYEE_VACATION` |
| 欄位名稱 | 規格書寫 `MAX_DAYS`，DDL 寫 `MAX_HOURS` |
| 欄位型態與長度 | 規格書寫 INT，DDL 寫 DECIMAL(5,1) |
| 必填約束 | 規格書未標，DDL 為 NOT NULL |
| Schema 歸屬 | DDL 標 `hrm` 還是 `eap`（決定 Entity 基類） |
| **FK 關係與表層級** | **DDL 中的外鍵欄位揭示父子表層級，規格書常省略此關係** |

### Step 3-b：DDL FK 關係分析（必做）

> **⚠️ 規格書通常不會完整描述資料表之間的 FK 關係和層級結構。這些關係必須直接從 DDL 分析。**
> **遺漏 FK 分析會導致前端下拉邏輯錯誤（如級聯下拉選項空白），是最常見的前端問題根因。**

逐張 DDL 表，標記疑似 FK 的欄位（欄名含 `_ID`、`_CODE` 且指向另一張表的 PK），建立表層級圖：

```
範例（TM002）：
TM_VACATION_SETTING (PK: VACATION_CODE)
  └── TM_VACATION_DETAIL_SETTING (PK: VACATION_SUB_ID, FK: VACATION_CODE)
        └── TM_EMP_VACATION (PK: EMP_VACATION_ID, FK: VACATION_SUB_ID)
```

**必須在統一規格中記錄**：
1. 表層級圖（父→子關係）
2. 每個 FK 的語意（如「EMP_VACATION 透過 VACATION_SUB_ID 連結到假別細項，非直接連結到假別」）
3. 前端下拉選單的**級聯邏輯**：哪個下拉是父層、哪個是子層、子層如何篩選
4. 沒有子分類時的處理方式（如假別無細項時 VACATION_SUB_CODE 為 NULL 但仍有 VACATION_SUB_ID）

> **統一規格必須包含「資料表關係」段落**，格式範例：
> ```
> ## 資料表關係
> | 父表 | 子表 | FK 欄位 | 語意 |
> |------|------|---------|------|
> | TM_VACATION_SETTING | TM_VACATION_DETAIL_SETTING | VACATION_CODE | 假別→假別細項 |
> | TM_VACATION_DETAIL_SETTING | TM_EMP_VACATION | VACATION_SUB_ID | 假別細項→員工額度 |
>
> ## 級聯下拉邏輯
> | 父層下拉 | 子層下拉 | 篩選方式 | 無子選項處理 |
> |---------|---------|---------|------------|
> | 假別 (VACATION_CODE) | 假別細項 (VACATION_SUB_ID) | 子層按父層 code 篩選 | 顯示 '---'，使用 VACATION_SUB_CODE IS NULL 的記錄 |
> ```

### Step 4：HTML ↔ DDL/CSV 比對

| 比對維度 | 常見衝突 |
|---------|---------|
| 欄位對應 | HTML 顯示的欄位在 DDL 中不存在 |
| 資料型態 | HTML 顯示為文字輸入，DDL 為 INT/BIT |
| 下拉選項 | HTML 的選項與 DDL 備註的 LOOKUP 不一致 |

### Step 5：套用邏輯文件

邏輯文件中的條目**覆寫**其他來源的矛盾。逐條處理：
- 若邏輯文件明確指定做法 → 以邏輯文件為準，自動裁決該衝突
- 若邏輯文件提到但未給出明確做法 → 仍列為待人工裁決

### Step 6：產出衝突清單

格式見 [examples/conflict-list-example.md](../examples/conflict-list-example.md)。

每個衝突項必須包含：
- 項目名稱
- 來源 A 描述（標明出處：規格書/HTML/DDL）
- 來源 B 描述（標明出處）
- 建議（哪個版本為準、或需要 SA 釐清）
- 狀態：⏳ 待人工裁決 / ✅ 已由邏輯文件裁決

### Step 7：等待人工裁決

所有衝突項解決後，產出**統一規格**（以裁決結果為準的單一版本）。

> **統一規格必須包含「UI 互動模式」段落**：針對每個子功能，明確標註使用 Dialog 模式或 Page 模式。格式範例：
> ```
> ## UI 互動模式
> | 子功能 | 模式 | 說明 |
> |--------|------|------|
> | 修改明細 | Dialog | HTML mockup 顯示為彈窗，表單欄位 <20 |
> | 單筆新增 | Dialog | HTML mockup 顯示為彈窗 |
> | 批次匯入 | Dialog | HTML mockup 顯示為彈窗 |
> ```
> 此段落為 Phase 1 任務拆解的必要輸入。

## 約束

| 約束 | 原因 |
|------|------|
| **不可猜測裁決結果** | 資訊不足時 AI 會編造合理但錯誤的內容 |
| **不可跳過此 Phase** | 即使各來源看起來一致，仍需跑完比對流程確認 |
| **邏輯文件為最高優先** | 邏輯文件是 SA 的最新口頭釐清，覆寫其他來源的舊描述 |

## 產出

- `conflicts.md` — 衝突清單 + 裁決結果（存入 `.agentic/{moduleCode}/`）
- `unified-spec.md` — 統一規格：衝突已解決的版本，後續 Phase 的**唯一輸入源**（存入 `.agentic/{moduleCode}/`）

## STOP Gate

| 條件 | 動作 |
|------|------|
| 衝突=0（全部 ✅） | 進入 Phase 1-lite |
| 任何項目仍為 ⏳ | **STOP** — 呈現清單給使用者，等待裁決 |

## Gotchas

- 「各來源看起來一樣」不等於「沒有衝突」— 細微差異（如列舉值順序、欄位型別）很容易忽略
- 狀態碼的數量差異特別重要 — 多出或缺少的狀態碼影響整個流程設計
- 不要把「SA 沒寫」歸類為衝突 — 這是規格模糊，應在衝突清單中標明需 SA 釐清
- DDL/CSV 的 Schema 欄位（hrm/eap）決定 Entity 基類 — 搞錯會導致 Panache 衝突
- HTML 畫面中展示用的假資料不代表業務規則 — 以規格書和邏輯文件為準
- 邏輯文件可能用口語化描述 — 要精確對應到具體的規格條目和 DDL 欄位
- 規格書中的「頁面」≠ 前端的獨立路由頁面 — SA 文件習慣把每個子功能都稱為「頁面」，但前端實作可能是 Dialog 彈窗。必須以 HTML mockup 的實際呈現方式為準，並在統一規格中明確標註 UI 互動模式
- **FK 關係是前端下拉邏輯的根源** — 規格書幾乎不會描述 FK 層級（如「假別細項透過 VACATION_SUB_ID 連結，不是直接連 VACATION_CODE」），但這決定了前端級聯下拉的整個架構。遺漏 FK 分析 = 前端下拉必定出錯
- **DDL 中某些記錄有雙重身份** — 如 `VACATION_SUB_CODE IS NULL` 的記錄既是「沒有細項的假別」，也是 `VACATION_SUB_ID` 的有效值。這種設計需要在統一規格中明確記錄
