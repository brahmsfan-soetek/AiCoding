# 04 — 通用型 SKILL 架構設計

> 設計日期：2026-04-16
> 狀態：已實作（2026-04-16）

## 背景與動機

AiCoding 專案已有 2 個 SKILL（spec-p1-digest-flow v1.2.0、spec-p2-tasking v1.0.0），以及 3 個暫停的特化 SKILL（eap-agentic-coding、eap-agentic-coding-lite、serp-agentic-coding）。

特化 SKILL 的問題：
- 模板寫死了技術棧（Vue 3 + Quarkus + MSSQL + LOV Processor）
- 換專案就要重寫模板
- eap-agentic-coding-lite 走「一個大 SKILL 包所有 Phase」路線後標記暫停

本次設計決定：將整體工作流程拆為 **5 個通用型 SKILL**，規範和實作細節寫在各自專案的 `CLAUDE.md` 內。

---

## 設計原則

### 通用化路線：(a) 流程骨架通用

- SKILL 只定義 MUST-DO checklist、stop gate、角色分工
- 具體的 entity / component / test 寫法**全讀專案 `CLAUDE.md`**
- `CLAUDE.md` 作為索引，指向各類規範文件
- **不掃 code 歸納 pattern**（AI 行為、會漂移），改讀明確寫好的規範（deterministic）

### 自動化程度：半自動

- 每個 task 前 stop gate 確認、完成後問要不要繼續
- 不是全自動（context rot + 品質漂移風險）
- 不是手動輔助（失去 SKILL 價值）

### 獨立性：session 分離取代 multi-agent

- Subagent 不產出進 git 的檔案（實作 / 測試程式碼必須由主 session 撰寫）
  - 前例教訓：session-791acadc 中 subagent 寫程式碼時 prompt 與模板矛盾，4 個 Vue 檔案全錯
  - 可委託 subagent 的操作：跑 lint / typecheck / test 指令、搜尋既有程式碼參考、P4b 分析失敗原因歸類
- P3 完工後另起 session 跑 P4，天然獨立觀點
- 回饋迴路（test pass/fail、lint、typecheck）> multi-agent 複雜度

---

## 架構總覽

### 5 個 SKILL

| # | SKILL 名 | 定位 | 觸發 | 工作目錄 | 狀態 |
|---|---------|------|------|---------|------|
| P1 | spec-p1-digest-flow | 規格消化 S0–S4 | `/spec` | SA 資料夾 | 現有，已通用，不動 |
| P2 | spec-p2-tasking | 任務清單產出 | `/tasking` | 專案 repo | 現有，需通用化改造 |
| P3 | spec-p3-implementing | TDD 實作 + 單元測試 | `/impl` | 專案 repo | 新建 |
| P4a | spec-p4a-uat | 人工驗收測試 | `/uat` | 專案 repo | 新建 |
| P4b | spec-p4b-e2e | Playwright 自動化驗證 | `/e2e` | 專案 repo | 新建 |

### 銜接圖

```
┌── P1 spec-p1-digest-flow（SA 資料夾）
│   S0→S4，輸出規格統計最終版
└───┬──── 把規格 + UI 搬進專案 repo
    ▼
┌── P2 spec-p2-tasking（專案 repo）
│   讀 CLAUDE.md 索引 → 讀規範文件 → 產 3 份清單
└───┬──── 另起 session
    ▼
┌── P3 spec-p3-implementing（專案 repo）
│   TDD 迴圈 + stop gates
└───┬──── 另起 session（裁判）
    ▼
┌── P4a spec-p4a-uat  或  P4b spec-p4b-e2e（專案 repo）
│   讀 test_cases.md → 人工 UAT 或 Playwright
└───
```

---

## 各 SKILL 詳細設計

### P1 — spec-p1-digest-flow（現有，不動）

| 欄位 | 內容 |
|------|------|
| 輸入 | SA 規格書（.docx / .md）+ HTML / 截圖 |
| 輸出 | `{編號}_規格統計_最終版.md` |
| 通用邊界 | 純文件處理，不需專案 context |

Workflow: S0 DOCX→MD → S1 規格統計 → S2 釐清清單 → S3 PG 回覆 → S4 整合+二審

### P2 — spec-p2-tasking（需通用化改造）

| 欄位 | 內容 |
|------|------|
| 輸入 | `{編號}_規格統計_最終版.md` + UI 截圖 + 專案 `CLAUDE.md` |
| 輸出 | `frontend_tasks.md` / `backend_tasks.md` / `test_cases.md` |
| 通用邊界 | 任務清單分類讀專案（CLAUDE.md 索引），SKILL 只定義必要欄位 |

Workflow:
```
讀 CLAUDE.md 索引 → 讀規範文件 → [STOP] 確認輸出位置
→ 辨識輸入 → 產 3 份清單 → [STOP] PG 審閱
```

**改造要點：**
- 拔掉寫死的 A-F / A-E 區塊（前端六大區塊、後端五大區塊均為 eap 專案特化分類）
- 改成：讀專案 `CLAUDE.md` 索引指向的規範文件取得分類慣例；若無，fallback 到通用骨架：
  - 前端：資料層（型別/服務）→ 介面層（頁面/元件）→ 業務邏輯（連動/計算）→ 整合點（路由/i18n）→ 驗證
  - 後端：資料層（Entity/Domain）→ 介面層（API 端點）→ 業務邏輯（核心流程拆分）→ 整合點（外部服務/SP）→ 驗證
- 輸出模板只規範 header + 必要欄位（task id / 描述 / 依賴 / 驗收條件）
- `test_cases.md` 格式統一：`| # | 測試案例 | 前置條件 | 執行步驟 | 預期結果 |`
  - 「執行步驟」必須人類可讀 + 結構化到能轉 Playwright spec
  - 不分 auto/manual 欄位（軌道分派是 P4 的事）
- **不掃 code 歸納 pattern** — 改讀 CLAUDE.md 索引揭露的規範文件

### P3 — spec-p3-implementing（新建）

| 欄位 | 內容 |
|------|------|
| 輸入 | P2 產的 task 清單 + 專案 `CLAUDE.md` + 既有 code / 測試規範 |
| 輸出 | 實作 code + 單元測試 + git commits |
| 通用邊界 | 測試框架 / lint / typecheck / commit 規範全讀 CLAUDE.md |

**單元測試定位：** 開發 feedback loop（基本程式邏輯 + 瑣碎邊界測試），不是 QA 驗證。真正的 QA 在 P4。

Workflow:
```
/impl [task-list-path]
         ↓
[AI]  讀 task list + CLAUDE.md 索引 → 讀規範文件
[STOP] SG1: PG 確認載入正確、指定起始 task
         ↓
┌─── 每個 task loop ─────────────────┐
│  [AI]  讀當前 task                   │
│  [AI]  列單元測試清單                │
│  [STOP] SG2: PG 快審測試清單        │
│         （覆蓋度防護，不可省略）     │
│                                      │
│  [AI]  寫測試 → 跑測試 (Red)         │
│  [AI]  寫實作 → 跑測試 (Green)       │
│  [AI]  lint + typecheck              │
│  [AI]  git diff 自檢測試檔           │
│        若斷言被改 → 明示 PG          │
│  [STOP] SG3: PG 審閱 → 繼續/回修    │
│         （可降密度：每 N task 一次） │
└──────────────────────────────────────┘
         ↓
[AI]  建議進入 P4
```

**Stop Gate 設計：**

| # | 位置 | 作用 | 可否省略 |
|---|------|------|---------|
| SG1 | session 啟動後 | 確認載入正確、起始 task | 不建議（成本極低）|
| SG2 | 寫 test code 之前 | 覆蓋度防護 | **不可省略**（單 session TDD 關鍵防護）|
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度（每 N task 一次）|

**關鍵防護機制：**
1. **測試清單先審、再寫 test code** — 在測試代碼產出之前讓 PG 審「AI 打算測什麼」，覆蓋度遺漏在這關抓
2. **git diff 對照測試檔 self-check** — 規避 test-to-fit。`git diff` 是客觀事實，不靠 agent 紀律
3. **Red-Green 強制順序** — 寫測試 → 確認失敗 → 寫實作 → 確認通過，不可跳步
4. **Checkpoint 容錯** — 每完成一個 task 更新 `{程式編號}_progress.md`（狀態 + commit hash），session 中斷或 `/clear` 後可 resume。SG1 偵測到 progress 檔時自動提出 resume。

### P4a — spec-p4a-uat（新建）

| 欄位 | 內容 |
|------|------|
| 輸入 | `{編號}_規格統計_最終版.md` + `test_cases.md`（P2 產，非 P3 單元測試）|
| 輸出 | UAT checklist + 彙總報告 |
| 關鍵 | 新 session，讀 test_cases.md 而非 P3 的單元測試 |

Workflow:
```
讀 spec + test_cases.md → 產 UAT checklist（逐項勾選）
→ [STOP] PG 跑 → 回填結果 → 彙總報告
```

### P4b — spec-p4b-e2e（新建）

| 欄位 | 內容 |
|------|------|
| 輸入 | `{編號}_規格統計_最終版.md` + `test_cases.md` + CLAUDE.md E2E 規範 |
| 輸出 | Playwright spec + 補充 UAT 項 + 彙總報告（含自動修 spec 記錄）|
| 關鍵 | 新 session，SKILL 不指定框架（讀 CLAUDE.md），含自我修復 |

Workflow:
```
讀 spec + test_cases.md + CLAUDE.md E2E 規範
         ↓
產 Playwright spec + 列出不適合自動化的 case
[STOP] PG 確認 spec
         ↓
跑 Playwright → 分析失敗 case
         ↓
    ┌─ 安全類別（selector/timing/API 誤用）
    │   → git commit 原版 → 自動修 spec → git commit 新版 → 重跑
    │  （單 case 上限 3 次）
    │
    ├─ 禁止類別（斷言值/業務邏輯/測試邏輯）
    │   → STOP 回報 PG，不自動改
    │
    └─ 判斷不清 → STOP 回報 PG
         ↓
[STOP] PG 看結果 + 跑補充 UAT
         ↓
彙總報告（含自動修 spec 記錄明細）
```

**自我修復硬規則：**

| 允許自動修 | 禁止自動修 |
|-----------|----------|
| Selector syntax / element not found | 斷言值（expect values）|
| Timing race / 需要 wait | 業務流程順序 |
| Playwright API 誤用 | 測試邏輯 |
| 型別錯誤 | 測試案例的前置條件 |

**三層防護機制（應對 PG 偷懶風險）：**
1. **限制自動修範圍** — 斷言值一律不自動修。即使 PG 沒仔細看，溜過去的也只是無害的技術性修正
2. **git 留痕** — 每次自動修前後都 commit，事後可 `git log` 追溯全部修改
3. **彙總報告明列** — 所有自動修記錄列在報告中，PG 一眼可見

**核心原則：** P4b 只能修自己產的 Playwright spec，**絕不能碰 P3 產的實作 code，也不能改 P2 產的 test_cases.md**。否則失去「獨立裁判」身份。

### 進化機制（P4 → P2 回饋迴路）

P4a / P4b 的彙總報告包含「系統性回饋」區塊，記錄驗收中發現的跨個案系統性問題（如 P2 總是漏掉空值邊界測試、P3 錯誤處理未對齊規範等）。此區塊留在各專案內作為紀錄。SKILL 維護者定期從各專案蒐集這些回饋，回到 AiCoding 專案集中審視，將教訓納入 `lessons_learned.md` 並更新 SKILL（P2 prompt 自檢清單、P3 規則等）。

---

## 關鍵設計決策記錄

| # | 決策 | 選項 | 結論 | 理由 |
|---|------|------|------|------|
| D1 | SKILL 拆分數量 | 1 個 / 4 個 / 5 個 | 5 個獨立 SKILL | 工作目錄硬邊界（SA vs repo）+ context 負載差異 + P4a/P4b workflow 差異太大 |
| D2 | 通用化路線 | (a) 流程骨架 / (b) 模板通用 | (a) 流程骨架 | 模板通用在 P3 幾乎不可能，技術棧差一點就崩 |
| D3 | P3 自動化程度 | 全自動 / 半自動 / 手動輔助 | 半自動 | 全自動 context rot + 品質漂移；手動輔助失去 SKILL 價值 |
| D4 | P3 單元測試定位 | QA 驗證 / 開發 feedback | 開發 feedback | 基本程式邏輯 + 瑣碎邊界，真正 QA 在 P4 |
| D5 | P3 架構 | 單 session TDD / test-agent subagent / 三方交叉驗證 | 單 session TDD + 強 stop gate；subagent 限「不產出進 git 的檔案」（跑指令、搜尋可委託）| 實作需完整 context + 回饋迴圈；session-791acadc 前例教訓 |
| D6 | P3 球員兼裁判 | P3 內部分離 / P4 做裁判 | P4 做裁判 | P4 session 分離天然獨立觀點，成本比 multi-agent 低 |
| D7 | P4 拆分 | 1 個 SKILL / 2 個 SKILL | 2 個（spec-uat + spec-e2e）| workflow、stop gate、錯誤處理差異太大；單一職責原則 |
| D8 | P4 軌道分派 | 混合分派 / 選項式二擇一 | 選項式二擇一 | 簡化 mental model，PG 在 session 層級選路而非 case 層級 |
| D9 | 自我修 spec stop gate | (i) 無 + 三層防護 / (ii) 有 stop gate | (i) + 三層防護 | 保留自動化流暢性；三層防護限制偷懶溜過的範圍在無害類別 |
| D10 | 專案 context 來源 | 掃 code 歸納 / 讀 CLAUDE.md 索引 | 讀 CLAUDE.md 索引 | 歸納是 AI 行為會漂移；讀規範是 deterministic |
| D11 | test_cases.md 格式 | P2 預分軌道 / P4 分派 | P4 開始時分派 | P2 產出時不知道專案是否有 E2E 設施 |

---

## 「SKILL ↔ 專案」契約

SKILL 不綁專案，`CLAUDE.md` 是 SKILL 和專案之間的契約文件。專案的 `CLAUDE.md` 必須調整為索引形式（指向各類規範文件），作為 SKILL 的使用前提。

| 項目 | 用到的 SKILL |
|------|------------|
| 任務清單既有分類 / tasks/ 目錄格式 | P2 |
| 測試框架 + 執行指令 | P3 + P4b |
| Lint / typecheck 指令 | P3 |
| Commit 規範 | P3 |
| 測試目錄結構 | P3 + P4b |
| E2E 框架 + 執行流程 | P4b |
| UAT 執行流程 | P4a |
| 既有 component / API / Entity pattern 範例路徑 | P2 + P3 |

---

## 實作記錄

> 全部於 2026-04-16 完成實作。

| 順序 | 任務 | 版本 | 狀態 |
|------|------|------|------|
| 1 | P2 通用化改造 | v2.0.0 | ✅ 拔掉 A-F/A-E、改讀 CLAUDE.md 索引、test_cases.md 5 欄格式、加入依賴+驗收條件欄 |
| 2 | P3 spec-implementing 骨架 | v1.0.0 | ✅ TDD 迴圈 + SG1/SG2/SG3 三道 stop gate + git diff 自檢防護 |
| 3 | P4a spec-uat 骨架 | v1.0.0 | ✅ UAT checklist 流程 + 彙總報告 |
| 4 | P4b spec-e2e 骨架 | v1.0.0 | ✅ Playwright spec + 安全/禁止類別 + 自我修復（上限3次）+ 三層防護 |

## 下一步

在實際專案中試用這些 SKILL。需先為目標專案建立 `CLAUDE.md` 索引（指向各類規範文件），作為 SKILL 的使用前提。
