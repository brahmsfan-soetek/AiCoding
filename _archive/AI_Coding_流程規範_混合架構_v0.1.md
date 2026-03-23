# AI Coding 流程規範（混合架構 Draft v0.1）

## 核心原則

```
AI 做執行，人做判斷。
所有需要判斷的點，都必須在 AI 介入之前由人類完成。
```

---

## 三層架構

```
Layer 3 — 知識管理（持續維護）
  Context Package：維護無矛盾、可按需組裝的 context 模組
  ↓ 提供乾淨的輸入

Layer 2 — 任務品質（每個功能/修改）
  Quality Gate：人類守門，確保必要的判斷不被跳過
  ↓ 確認可以開始

Layer 1 — 互動品質（每次 AI 對話）
  Checklist：確保這次互動是「純執行」而非要求 AI 判斷
```

---

## Layer 3：Context Package

### 目錄結構

```
{project}-planning/
├── rules/                    ← 業務規則（按功能域分檔）
│   ├── validation.md         ← 驗證規則 BR-VL*
│   ├── calculation.md        ← 計算規則 BR-CA*
│   ├── conditional.md        ← 條件顯示 BR-CD*
│   └── posting.md            ← 過帳規則 BR-PO*
│
├── requirements/             ← 需求清單（帶追溯欄位）
│   ├── query.md              ← REQ-Q* 查詢功能
│   ├── edit.md               ← REQ-E* 新增編輯
│   └── posting.md            ← REQ-P* 過帳
│
├── contracts/                ← 介面契約
│   ├── api.md                ← API endpoint 定義
│   ├── components.md         ← 元件 props/events
│   └── data-model.md         ← 資料表 schema
│
├── tests/                    ← 測試錨點
│   ├── unit-specs.md         ← 單元測試規格（人類審核過）
│   └── acceptance.md         ← 人工驗收腳本（TC 清單）
│
├── standards/                ← 專案規範
│   └── CLAUDE.md             ← Agent 原生格式
│
├── decisions/                ← 決策紀錄
│   └── clarifications.md     ← 釐清紀錄、待確認項目
│
└── _sources/                 ← 原始文件（僅保留，不餵 AI）
    ├── SA_IM004.md
    └── IM004.html
```

### 維護鐵則

| 鐵則 | 說明 |
|------|------|
| 單一定義 | 每個事實只在一個檔案中定義 |
| 無矛盾 | 模組之間不能有互相矛盾的定義 |
| 變更回源 | 任何需求變更先更新對應模組，再寫碼 |
| 原始保留 | _sources 只看不餵，所有 AI 消費的內容都在模組中 |

### 組裝原則

每次 AI 互動只載入任務需要的模組，不多不少：

```
任務：實作儲存驗證
載入：rules/validation.md + contracts/api.md + standards/CLAUDE.md
不載入：其他所有

任務：修 D01 條件顯示 bug
載入：rules/conditional.md + contracts/components.md + decisions/clarifications.md
不載入：validation, calculation, api, tests
```

---

## Layer 2：Quality Gate（人類守門）

### Gate 定義

```
Gate 1 — 矛盾消除
  問題：我要用的 context 模組之間有沒有矛盾？
  誰守：人類（AI 可協助比對，但人類做最終判斷）
  觸發：新功能、需求變更、規格更新
  跳過：Bug fix（已有明確的現狀 vs 預期）
  產出：更新後的 context 模組 + decisions/clarifications.md

Gate 2 — 需求可驗證
  問題：這次任務的每條需求能不能轉成 true/false？
  誰守：人類
  觸發：新功能、需求變更
  跳過：Bug fix、純樣式調整
  產出：requirements/*.md 中的新增/更新條目

Gate 3 — 架構對齊
  問題：技術方案會不會跟專案既有架構衝突？
  誰守：人類（定向取樣專案，不全盤掃描）
  觸發：新增 API、新元件、新資料表
  跳過：修改既有元件內部邏輯
  產出：contracts/*.md 中的新增/更新條目

Gate 4 — 測試先行
  問題：可執行的單元測試規格是否存在且由人類審核？
  誰守：人類寫規格 → AI 產生測試碼 → 人類審核測試碼
  觸發：任何涉及業務邏輯的程式碼生成
  跳過：純 UI 樣式調整
  產出：tests/unit-specs.md 中的新增條目

Gate 5 — 追溯回填
  問題：產出的程式碼是否對應到具體的 REQ/BR 編號？
  誰守：AI 回填 + 人類抽查
  觸發：每次 AI 產出後，立即執行
  跳過：探索性 prototype（標記為不進主分支）
  產出：requirements/*.md 中追溯欄位的更新
```

### 任務類型 vs Gate 觸發矩陣

| 任務類型 | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Gate 5 |
|---------|--------|--------|--------|--------|--------|
| 大型新功能 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 中型需求變更 | ✅ | ✅ | 視情況 | ✅ | ✅ |
| 小型邏輯修改 | — | — | — | ✅ | ✅ |
| Bug fix | — | — | — | 視情況 | ✅ |
| 純 UI 樣式 | — | — | — | — | — |
| 探索性 prototype | — | — | — | — | — |

### 預設全觸發規則

以下情況強制觸發所有 Gate，不允許自行判斷跳過：
- 工程師對該業務領域不熟悉
- 跨模組修改（改 A 可能影響 B）
- 第一次用 AI 做的功能類型

---

## Layer 1：互動 Checklist

### 每次 AI 互動前

```
□ 範圍：這次任務能用一句話說清嗎？
  → 不能 = 任務太大，先拆分

□ Context：載入的檔案只包含這次任務需要的嗎？
  → 載了不相關的 = 移除，提高信噪比

□ 判斷：有沒有需要 AI「選擇」或「猜測」的地方？
  → 有 = 停下來，先由人類做完判斷，寫進 context 模組

□ 測試：有沒有可驗證的預期結果？
  → 沒有 = 先補（單元測試規格或人工驗收條件）

□ 邊界：有沒有「不要做的事」需要明確告知？
  → 有 = 寫進 prompt（例如「不要新增 API」「不要改 schema」）
```

### 每次 AI 產出後

```
□ 幻覺：有沒有呼叫不存在的 API / 使用不存在的 props？
□ 命名：與專案慣例一致嗎？
□ 作弊：AI 有沒有刪除或修改既有測試？
□ 殘留：有沒有留下除錯用的變體檔案或 console.log？
□ 追溯：對應的 REQ/BR 編號已回填到 requirements/*.md？
```

---

## 測試粒度分工

```
AI 負責小粒度（單元測試）
  驗證規則 → AI 寫單元測試 + AI 寫實作
  計算規則 → AI 寫單元測試 + AI 寫實作
  條件邏輯 → AI 寫單元測試 + 人工確認畫面

人工負責大粒度（業務驗收）
  過帳流程 → 人工按 TC 清單操作
  查詢功能 → 人工按 TC 清單操作
  跨元件互動 → 人工操作確認
  視覺正確性 → 人工目視確認
```

前提：單元測試規格由人類撰寫或審核，AI 不得自行修改已通過審核的測試。

---

## 與原五階段的對應關係

| 原階段 | 混合架構中對應的位置 | 差異 |
|-------|-------------------|------|
| Phase 0 文件整備 | Gate 1 + Context Package 維護 | 不是「先做完才進下一步」，而是「發現矛盾隨時觸發」 |
| Phase 1 需求定義 | Gate 2 + requirements/ + rules/ + tests/ | 產出物相同，但按功能域分檔而非單一大文件 |
| Phase 2 技術設計 | Gate 3 + contracts/ + standards/ | 產出物相同，但強調定向取樣而非全面設計 |
| Phase 3 AI Coding | Layer 1 Checklist + Context 組裝 | 從「載入全部 Phase 1/2」變為「按需載入相關模組」 |
| Phase 4 驗證收斂 | Gate 5 + 測試粒度分工 | 從「最後統一驗證」變為「邊做邊驗 + 最終人工驗收」 |

核心變化：**內容沒丟，從「先後順序」重構為「品質維度」。**
