---
name: spec-p1-digest-flow
description: DOCX 規格書 → 規格統計 → 釐清清單 → 整合 SA 回覆。
---

# Spec Digest Flow — SA 規格書消化流程

PG 接到 SA 規格書後，透過 AI 輔助完成從規格解析到最終版規格統計的標準作業流程。本 SKILL 涵蓋 S0–S4，任務清單階段（原 S5）已獨立為 `spec-p2-tasking` SKILL，於專案 repo 內執行以貼合專案既有慣例。

## 觸發方式

- `/spec` — 顯示流程總覽與步驟選單
- `/spec <step>` — 直接執行指定步驟（如 `/spec 1`、`/spec step1`）

## 流程步驟

| Step | 執行者 | 說明 | Prompt 模板 |
|------|--------|------|-------------|
| 0 | AI | DOCX → MD 轉換（收到 .docx 時使用） | — (腳本 `docx2md.py`) |
| 1 | AI | 規格統計 | `step1_規格統計_prompt.md` |
| 2 | AI | 釐清清單 | `step2_釐清清單_prompt.md` |
| 3 | PG | 篩選回覆 + 問 SA + 回填清單 | — |
| 4 | AI | 釐清整合 + 二次審查 | `step4_釐清整合_prompt.md` |

完成 S4 後，請切換到**專案 repo 目錄**，改用 `spec-p2-tasking` SKILL 產出前後端與測試任務清單。

## Execution Flow

1. Determine the skill's base directory (this file's location) — referred to as `<skill-dir>` below.
2. Parse user arguments:
   - No args → show the overview table above and ask user which step to run.
   - `0` or `docx` → run Step 0 (DOCX conversion).
   - A number (1–4) or `stepN` → jump to that step directly.
   - `5` or `step5` → 告知使用者：S5 已獨立為 `spec-p2-tasking` SKILL，請切換到專案 repo 目錄後改用 `/tasking`。
3. For the requested step:
   a. Read the corresponding prompt template from `<skill-dir>/templates/prompts/`.
   b. Read the corresponding output template(s) from `<skill-dir>/templates/outputs/` if applicable.
   c. **直接讀取當前工作目錄下的檔案**來辨識輸入材料（規格書、HTML、規格統計等），不要詢問使用者檔案路徑。若目錄下有多個可能的候選檔案，再向使用者確認。
   d. Ask the user to provide or confirm:
      - The 程式編號 (program ID) — if not already apparent from the file names
   e. Once confirmed, execute the prompt with the user's files as context.
4. Output the results directly to the **current working directory root** (not into any subdirectory).
5. After completion, suggest the next step in the workflow. **步驟以檔案為介面**：每步的輸入輸出都是工作目錄下的檔案,不依賴對話記憶。S2 / S4 開始前建議 PG `/clear`（或另開 session）再繼續——避免整本規格書與前步對話滯留 context（實測 P1 單 session 峰值 context 286K、每輪重吃;長規格尤其必要）。
6. **輸出紀律（全步驟適用）**：產出一律寫入檔案；console 回覆僅 ≤10 行摘要（檔名、章節 / 項目統計、⚠️ 警告項）,不得將文件內容整段貼進對話。PG 審檔案,不審 console。

## Step Details

### Step 0 — DOCX → MD 轉換
- **何時使用：** SA 交付的規格書為 `.docx` 格式時，在 Step 1 之前先執行此步驟，將 DOCX 無損轉換為 Markdown。
- **為何需要：** 直接透過 LLM 讀取 DOCX 會造成表格結構、欄位名稱、圖片等資訊失真。使用 `docx2md.py` 腳本以 python-docx 解析，確保轉換結果與原始規格書完全一致。
- **Script:** `<skill-dir>/docx2md.py`
- **Dependencies:** `python-docx`, `Pillow`（選用，EMF/WMF 轉 PNG）
- **Execution:**
  ```bash
  python <skill-dir>/docx2md.py <input.docx> [-o .]
  ```
- **Input:** SA 規格書 `.docx` 檔案（位於當前工作目錄）
- **Output:** 轉換產物直接輸出至當前工作目錄：
  - `{檔名}.md` — 轉換後的 Markdown 規格書
  - `images/` — 提取的圖片檔案（若有）
- **Post-processing:** 轉換完成後，將原始 `.docx` 檔案移至 `SA document/` 資料夾歸檔。
- **Features:**
  - 保留標題層級、粗體/斜體、超連結
  - 表格完整轉換為 Markdown 表格（含合併儲存格處理）
  - 單欄表格自動識別為 SQL 程式碼區塊
  - 自動提取嵌入圖片（PNG/JPG/EMF/WMF）
  - 文字方塊內容以程式碼區塊呈現
  - 自動跳過目錄段落、提取版本與日期 metadata
- **Next:** 轉換完成後，使用產出的 `.md` 檔案直接接續 Step 1。

### Step 1 — 規格統計
- **Input:** SA 規格書 (MD) + HTML/截圖 + 參考規格(若有) + `規格統計模板.md`（直接從工作目錄讀取）
- **Output:** `{程式編號}_規格統計.md`（輸出至工作目錄根）
- **Prompt:** `<skill-dir>/templates/prompts/step1_規格統計_prompt.md`
- **Output template:** `<skill-dir>/templates/outputs/規格統計模板.md`
- **執行方式（子 agent 化,必用）：** 規格統計是機械抽取（欄位 / 表格 / 邏輯從規格書逐項抄錄）,不需最強模型、更不該讓規格書全文佔據主 session context：
  1. 主 session 派一個 subagent：prompt = step1 prompt 模板全文（含自檢清單）+ 輸入檔案路徑清單；子 agent 自行讀規格書 + 截圖 + 模板,直接寫出 `{程式編號}_規格統計.md`,回傳僅檔名 + 章節統計 + ⚠️ 標記數
  2. 規格書全文只進子 agent context（用完即棄）；主 session **不整本讀入規格書**
  3. 主 session 收檔後做覆核：讀產出檔,對照 prompt 自檢清單,以**定點** Grep / Read 抽查原規格書對應段落（欄位對照完整性、規格出處欄、⚠️ 未定義標記）；發現遺漏 → 派子 agent 補,不在主 session 重做
- **產出品質責任不變：** 子 agent 化只搬「讀與抄」的 context 位置,自檢清單與 PG 審閱照舊。

### Step 2 — 釐清清單
- **Input:** Step 1 規格統計 + 原始規格書 + `釐清清單模板.md`（直接從工作目錄讀取）
- **Output:** `{程式編號}_釐清清單.md`（輸出至工作目錄根）
- **Prompt:** `<skill-dir>/templates/prompts/step2_釐清清單_prompt.md`
- **Output template:** `<skill-dir>/templates/outputs/釐清清單模板.md`

### Step 3 — PG 手動回覆（無 AI prompt）
PG 逐項審閱釐清清單，自行回答或問 SA 後回填 `**回覆：**` 欄位。

### Step 4 — 釐清整合 + 二次審查
- **Input:** 已填回覆的釐清清單 + Step 1 規格統計 + 原始規格書（直接從工作目錄讀取）
- **Output:** 直接更新 `{程式編號}_釐清清單.md` + 產出 `{程式編號}_規格統計_最終版.md`（輸出至工作目錄根）
- **Prompt:** `<skill-dir>/templates/prompts/step4_釐清整合_prompt.md`
- **Note:** 若產出含 NEW-n 新問題，需回到 Step 3 取得 SA 回覆後重新執行。
- **Next:** 將 `{程式編號}_規格統計_最終版.md` 與 UI 截圖複製到專案 repo，然後切換到專案目錄執行 `spec-p2-tasking` SKILL 產出任務清單。原始 SA 材料（規格書 MD、HTML、截圖等）於此步完成後可移至 `SA document/` 歸檔。

## 核心原則

1. **規格統計 = 唯一權威來源 (Single Source of Truth)** — PNG / HTML 僅參考排版佈局，欄位與邏輯以規格統計為準。
2. **直接讀檔、直接做** — 輸入檔案就在工作目錄，直接讀取即可，不需反覆詢問路徑。
3. **步驟以檔案為介面、context 換手即丟** — 每步輸入輸出都是檔案，不依賴對話記憶；規格書全文只進子 agent context（Step 1）；S2 / S4 前建議 `/clear`。
4. **輸出紀律** — 產出寫檔，console 只留 ≤10 行摘要；PG 審檔案不審 console。
5. **PG 是品質守門人** — AI 產出的每份文件都需 PG 審閱。
6. **YAGNI** — 不設計用不到的欄位，不增加無價值的步驟。
