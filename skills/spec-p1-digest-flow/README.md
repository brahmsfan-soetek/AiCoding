# AI Coding Workflow — spec-p1-digest-flow

PG 接到 SA 規格書後，透過 AI 輔助完成從規格解析到最終版規格統計的標準作業流程（S0–S4）。

> 任務清單階段（原 S5）已獨立為 **`spec-p2-tasking`** SKILL，於專案 repo 內執行以貼合專案既有慣例。完成本流程 S4 後，將最終規格與 UI 截圖複製到專案 repo，切換目錄後使用 `/tasking` 繼續。

---

## 核心原則

1. **規格統計 = 唯一權威來源（Single Source of Truth）**
   PNG / HTML 僅參考排版佈局，欄位與邏輯以規格統計為準。

2. **直接讀檔、直接做**
   輸入檔案就在工作目錄，AI 直接讀取，不需反覆詢問路徑。各步驟可在同一 Session 內連續執行。

3. **PG 是品質守門人**
   AI 產出的每份文件都需 PG 審閱。釐清清單由 PG 主動篩選——能自己回答的自己答，只把真正不確定的問 SA。

4. **YAGNI**
   不設計用不到的欄位，不增加無價值的步驟。

---

## 流程總覽

```
Step 0  [AI]  DOCX → MD 轉換              ← docx2md.py（收到 .docx 時使用）
Step 1  [AI]  規格統計                    ← 接續執行
Step 2  [AI]  釐清清單                    ← 接續執行
Step 3  [PG]  篩選回覆 + 問 SA + 回填清單  ← 手動
Step 4  [AI]  釐清整合 + 二次審查          ← 接續執行
              （若有新問題 → 回 Step 3）

── 切換到專案 repo ──

[spec-p2-tasking SKILL]  任務清單（前端+後端+測試）
```

### 流程圖

```
┌──────────── DOCX 前處理（選用）───────┐
│                                       │
│  [SA 交付物]         [Step 0 · AI]    │
│  規格書(.docx)     → docx2md.py      │
│  產出：規格書(MD) + images/           │
│  歸檔：.docx → SA document/          │
│                                       │
└───────────────────────────────────────┘
                  │
                  ▼
┌──────────── 規格解析階段 ────────────┐
│                                       │
│  [SA 交付物]         [Step 1 · AI]    │
│  規格書(MD) + HTML  → 規格統計        │
│  + 參考規格(視需要)                    │
│                                       │
└───────────────────────────────────────┘
                  │
                  ▼
┌──────────── 釐清對齊階段 ────────────┐
│                                       │
│  [Step 2 · AI]                        │
│  → 產出釐清清單（含預留回覆欄位）      │
│                                       │
│  [Step 3 · PG]                        │
│  → PG 自行回覆 + 問 SA + 回填至清單   │
│                                       │
│  [Step 4 · AI]                        │
│  → 整合回覆 + 二次審查                │
│  → 合併至規格統計 → 最終版            │
│  （若有新問題 → 回 Step 3）           │
│                                       │
└───────────────────────────────────────┘
                  │
                  ▼
┌──────────── 任務拆解階段（spec-p2-tasking SKILL）────────┐
│                                                         │
│  於專案 repo 目錄執行 /tasking                          │
│  輸入：最終版規格統計 + UI 截圖（複製進專案）           │
│  先讀：CLAUDE.md 索引 → 規範文件                        │
│  輸出：前端/後端清單（含類型 tag）+ 手測 checklist      │
│  存放：建議 Docs/spec/{程式編號}/plan/                  │
│  歸檔：SA 原始材料 → SA document/（留在原 SA 資料夾）   │
│                                                         │
│  → P3-backend spec-p3-backend（/impl-be，tag 分流 TDD）│
│  → P3-frontend spec-p3-frontend（/impl-fe，契約測試）  │
│  → P3-data spec-p3-data（/data，權限 + 測資 SQL）      │
│  → PG 手測（照 test_cases.md 勾選）                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 各 Step 速查表

| Step | 執行者 | 輸入 | Prompt 模板 | 輸出 |
|------|--------|------|-------------|------|
| 0 | AI | SA 規格書 (.docx) | — (`docx2md.py`) | `{檔名}.md` + `images/` |
| 1 | AI | SA 規格書 + HTML + 參考規格 | `step1_規格統計_prompt.md` | `{編號}_規格統計.md` |
| 2 | AI | Step 1 規格統計 + 原始規格書 | `step2_釐清清單_prompt.md` | `{編號}_釐清清單.md` |
| 3 | PG | Step 2 釐清清單 | — | 已填回覆的釐清清單 |
| 4 | AI | 已填回覆的釐清清單 + 規格統計 + 原始規格書 | `step4_釐清整合_prompt.md` | 更新釐清清單 + 最終版規格統計 |

> 所有輸出檔案皆放在工作目錄根，不另建子資料夾。
>
> **任務清單階段請改用 `spec-p2-tasking` SKILL**（`/tasking`），於專案 repo 目錄執行。

---

## 目錄結構

```
spec-p1-digest-flow/
├── README.md                              ← 本文件
├── SKILL.md                               ← Claude Code Skill 定義
├── .claude-plugin/
│   └── plugin.json                        ← Plugin 清單檔
├── docx2md.py                             ← DOCX → MD 轉換腳本（Step 0）
│
└── templates/
    ├── prompts/                           ← AI 的 Prompt 模板
    │   ├── step1_規格統計_prompt.md
    │   ├── step2_釐清清單_prompt.md
    │   └── step4_釐清整合_prompt.md
    │
    └── outputs/                           ← AI 輸出的格式模板
        ├── 規格統計模板.md
        └── 釐清清單模板.md
```

### 執行時的工作目錄結構

```
{SA 工作目錄}/
├── SA_XXXX.md                 ← SA 規格書（轉換後）
├── XXXX.html                  ← HTML 原型
├── {編號}_規格統計.md          ← Step 1 產出
├── {編號}_釐清清單.md          ← Step 2 產出
├── {編號}_規格統計_最終版.md   ← Step 4 產出 ★ 之後複製到專案 repo
├── images/                    ← 圖片（Step 0 提取）
└── SA document/               ← 歸檔：原始 SA 交付材料
    ├── SA_XXXX.docx
    ├── SA_XXXX.md
    ├── XXXX.html
    └── ...
```

> `{編號}_frontend_tasks.md`、`{編號}_backend_tasks.md`、`{編號}_test_cases.md` 由 spec-p2-tasking SKILL 於**專案 repo 目錄**產出，不在此流程內。

---

## 快速開始

### 1. 拿到 SA 規格書

確認收到以下檔案，放到工作目錄：
- SA 規格書（MD 或 DOCX 格式）
- HTML 原型或 UI 截圖
- 規格修正文件（如果有）
- 相關參考規格（如果規格書提到）

### 1.5 收到 DOCX？先轉 MD（Step 0）

若 SA 交付的是 `.docx` 格式，先用 `docx2md.py` 轉換為 Markdown，避免 LLM 直接讀取 DOCX 造成表格結構與欄位名稱失真：

```bash
# 安裝依賴（首次）
pip install python-docx Pillow

# 轉換（輸出至當前目錄）
python docx2md.py SA_IM009_XXXX.docx -o .
```

轉換完成後，原始 `.docx` 移至 `SA document/` 資料夾歸檔。

### 2. Step 1 — 規格統計

1. AI 自動讀取工作目錄下的規格書、HTML 等檔案
2. AI 依照模板產出規格統計 → PG 審閱

### 3. Step 2 — 釐清清單

1. AI 讀取 Step 1 產出的規格統計 + 原始規格書
2. AI 產出釐清清單（含回覆欄位）

### 4. Step 3 — 回覆釐清

1. 逐項閱讀釐清清單
2. 能自己回答的 → 直接填入 `**回覆：**` 欄位
3. 不確定的 → 問 SA 後填入
4. 全部填完後進入 Step 4

### 5. Step 4 — 釐清整合

1. AI 讀取已填回覆的釐清清單 + Step 1 規格統計 + 原始規格書
2. AI 直接更新釐清清單（補上狀態與實作決策）+ 產出**最終版規格統計**
3. 若 AI 發現新問題 → 回 Step 3

### 6. 接續：通用型 SKILL P2–P3（於專案 repo 執行）

1. 將 `{編號}_規格統計_最終版.md` 與 UI 截圖複製到專案 repo
2. 切換工作目錄至專案 repo 後，依序執行：
   - **P2** `/tasking` — 讀 CLAUDE.md 索引 → 產出前後端清單（含類型 tag）+ 手測 checklist
   - **P3-backend** `/impl-be` — 另起 session，tag 分流（validator/processor TDD，sql/entity/spi 無測試）
   - **P3-frontend** `/impl-fe` — 另起 session，契約測試（service/store-map），UI 類 task 無測試
   - **P3-data** `/data` — 產 permission + seed SQL，PG 授權後執行
   - **PG 手測** — 開瀏覽器照 `test_cases.md` 逐條勾選，發現 bug ad hoc 派 AI 修
3. 完成後將 SA 工作目錄的原始材料移至 `SA document/` 歸檔

---

## 已完成的改進

| 項目 | 狀態 |
|------|------|
| ~~流程 Skill 化~~ | ✅ 已完成，可透過 `/spec` 觸發 |
| ~~測試清單利用~~ | ✅ 已完成 — P3-backend / P3-frontend 讀 task list 實作；test_cases.md 作為手測 checklist 由 PG 照對 |
