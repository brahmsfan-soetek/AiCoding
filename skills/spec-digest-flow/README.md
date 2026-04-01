# AI Coding Workflow

PG 接到 SA 規格書後，透過 AI 輔助完成從規格解析到程式碼交付的標準作業流程。

---

## 核心原則

1. **規格統計 = 唯一權威來源（Single Source of Truth）**
   PNG / HTML 僅參考排版佈局，欄位與邏輯以規格統計為準。

2. **每個 AI Session 獨立**
   避免上下文腐壞。每個 Session 明確定義輸入檔案和期望輸出。

3. **PG 是品質守門人**
   AI 產出的每份文件都需 PG 審閱。釐清清單由 PG 主動篩選——能自己回答的自己答，只把真正不確定的問 SA。

4. **YAGNI**
   不設計用不到的欄位，不增加無價值的步驟。

---

## 流程總覽

```
Step 1  [AI]  規格統計                    ← 新 Session
Step 2  [AI]  釐清清單                    ← 新 Session
Step 3  [PG]  篩選回覆 + 問 SA + 回填清單  ← 手動
Step 4  [AI]  釐清整合 + 二次審查          ← 新 Session
              （若有新問題 → 回 Step 3）
Step 5  [AI]  任務清單                    ← 在 repo 開新 Session
Step 6  [AI]  前端實作                    ← 在 repo 開新 Session
Step 7  [PG]  前端測試 + 調整              ← 手動
Step 8  [AI]  後端實作                    ← 在 repo 開新 Session
Step 9  [PG]  後端測試 + 調整              ← 手動
Step 10 [AI]  前後對接                    ← 在 repo 開新 Session
```

### 流程圖

```
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
┌──────────── 任務拆解階段 ────────────┐
│                                       │
│  [Step 5 · AI · 在 repo]             │
│  輸入：最終版規格統計 + UI 截圖       │
│  輸出：前端清單 + 後端清單 + 測試清單 │
│  存放：spec/ 目錄                     │
│                                       │
└───────────────────────────────────────┘
                  │
                  ▼
┌──────────── 實作階段 ────────────────┐
│                                       │
│  [Step 6 · AI]  前端實作              │
│  [Step 7 · PG]  前端測試 + 調整       │
│  [Step 8 · AI]  後端實作              │
│  [Step 9 · PG]  後端測試 + 調整       │
│  [Step 10 · AI] 前後對接              │
│                                       │
└───────────────────────────────────────┘
```

---

## 各 Step 速查表

| Step | 執行者 | 輸入 | Prompt 模板 | 輸出 |
|------|--------|------|-------------|------|
| 1 | AI | SA 規格書 + HTML + 參考規格 | `step1_規格統計_prompt.md` | `{編號}_規格統計.md` |
| 2 | AI | Step 1 規格統計 + 原始規格書 | `step2_釐清清單_prompt.md` | `{編號}_釐清清單.md` |
| 3 | PG | Step 2 釐清清單 | — | 已填回覆的釐清清單 |
| 4 | AI | 已填回覆的釐清清單 + 規格統計 + 原始規格書 | `step4_釐清整合_prompt.md` | 整合後釐清清單 + 最終版規格統計 |
| 5 | AI | 最終版規格統計 + UI 截圖 | `step5_任務清單_prompt.md` | 前端清單 + 後端清單 + 測試清單 |
| 6 | AI | `spec/` 全部檔案 | `step6_前端實作_prompt.md` | 前端程式碼 |
| 7 | PG | 前端程式碼 | — | 測試通過的前端 |
| 8 | AI | `spec/` 全部檔案 | `step8_後端實作_prompt.md` | 後端程式碼 |
| 9 | PG | 後端程式碼 | — | 測試通過的後端 |
| 10 | AI | 前後端程式碼 + `spec/` | — | 整合完成的系統 |

---

## 目錄結構

```
ai-coding-workflow/
├── README.md                              ← 本文件
│
├── templates/
│   ├── prompts/                           ← AI Session 的 Prompt 模板
│   │   ├── step1_規格統計_prompt.md
│   │   ├── step2_釐清清單_prompt.md
│   │   ├── step4_釐清整合_prompt.md
│   │   ├── step5_任務清單_prompt.md
│   │   ├── step6_前端實作_prompt.md
│   │   └── step8_後端實作_prompt.md
│   │
│   └── outputs/                           ← AI 輸出的格式模板
│       ├── 規格統計模板.md
│       ├── 釐清清單模板.md
│       ├── 前端任務清單模板.md
│       ├── 後端任務清單模板.md
│       └── 測試清單模板.md
│
└── examples/
    └── IM004/                             ← 完整實例（庫存異動單）
        ├── spec/                          ← 最終放入 repo 的檔案
        │   ├── IM004_規格統計.md
        │   ├── IM004_frontend_tasks.md
        │   ├── IM004_backend_tasks.md
        │   ├── IM004_test_cases.md
        │   └── ui/
        ├── process/                       ← 過程產物
        │   ├── IM004_規格統計-30.md
        │   ├── IM004_實作前釐清清單-30.md
        │   ├── 釐清回覆清單.txt
        │   └── IM004_釐清清單_SA回覆整合.md
        └── input/                         ← SA 原始交付物
            ├── SA_IM004_庫存異動單.md
            ├── IM004_庫存異動單.html
            └── 最新規格確認.txt
```

---

## 快速開始

### 1. 拿到 SA 規格書

確認收到以下檔案：
- SA 規格書（MD 格式）
- HTML 原型或 UI 截圖
- 規格修正文件（如果有）
- 相關參考規格（如果規格書提到）

### 2. Step 1 — 規格統計

1. 開啟新的 AI Session
2. 複製 `templates/prompts/step1_規格統計_prompt.md` 中的 Prompt
3. 替換佔位符（`{主規格檔名}` 等）
4. 上傳規格書、HTML、`templates/outputs/規格統計模板.md`
5. AI 產出規格統計 → PG 審閱

### 3. Step 2 — 釐清清單

1. 開啟**新的** AI Session
2. 複製 `templates/prompts/step2_釐清清單_prompt.md` 中的 Prompt
3. 上傳 Step 1 產出的規格統計 + 原始規格書
4. AI 產出釐清清單（含回覆欄位）

### 4. Step 3 — 回覆釐清

1. 逐項閱讀釐清清單
2. 能自己回答的 → 直接填入 `**回覆：**` 欄位
3. 不確定的 → 問 SA 後填入
4. 全部填完後進入 Step 4

### 5. Step 4 — 釐清整合

1. 開啟**新的** AI Session
2. 複製 `templates/prompts/step4_釐清整合_prompt.md` 中的 Prompt
3. 上傳已填回覆的釐清清單 + Step 1 規格統計 + 原始規格書
4. AI 產出整合後釐清清單 + **最終版規格統計**
5. 若 AI 發現新問題 → 回 Step 3

### 6. Step 5 — 任務清單

1. 在專案 repo 中開啟新的 AI Session
2. 複製 `templates/prompts/step5_任務清單_prompt.md` 中的 Prompt
3. 上傳最終版規格統計 + UI 截圖
4. AI 產出三份文件 → 存入 `spec/` 目錄

### 7. Step 6~10 — 實作

1. 每個 Step 開啟新的 AI Session
2. 使用對應的 Prompt 模板
3. 指向 `spec/` 目錄讀取任務清單
4. PG 在 Step 7/9 測試調整

---

## 參考實例

`examples/IM004/` 包含庫存異動單（IM004）的完整流程產物：

| 子目錄 | 說明 | 對應 Step |
|--------|------|-----------|
| `input/` | SA 原始交付的規格書、HTML、規格修正 | 流程輸入 |
| `process/` | 規格統計初版、釐清清單、回覆清單、SA 回覆整合 | Step 1~4 |
| `spec/` | 最終版規格統計、前後端任務清單、測試清單、UI 截圖 | Step 4~5 |

---

## 待改進

| 項目 | 現況 | 改進方向 |
|------|------|---------|
| 測試清單利用 | 產出測試清單但僅手動測試 | 加入自動化測試環節，或讓 AI 同步產出測試程式碼 |
| 流程 Skill 化 | 純文件模板 | 驗證成熟後包裝成 Claude Code Skill |
| Step 10 Prompt | 目前無獨立模板 | 累積經驗後補充前後對接的 Prompt 模板 |
