# soetek-agentic-coding-skills

以 LLM 行為特性實證研究為基礎的 Claude Code Skills 集合。
結構性防禦優於指令性約束 — 每條規則都有量化研究支撐。

## 安裝

在 Claude Code 中加入此 repo 作為 plugin source：

```
Plugin URL: https://github.com/soetek/soetek-agentic-coding-skills
```

加入後即可在 skill 清單中看到所有可用的 skills，選擇性安裝。

## Skill Catalog

| Skill | 狀態 | 適用場景 | 說明 |
|-------|------|---------|------|
| [eap-agentic-coding](skills/eap-agentic-coding/) | **實測中** | eap 專案（Quarkus + Vue 3 + MSSQL） | 規格驅動開發：多源規格交叉比對 → 任務拆解 → test-first → agent 分離實作 → 交叉驗證 |
| [eap-agentic-coding-lite](skills/eap-agentic-coding-lite/) | **v1.0.0** | eap 專案（Demo 用） | 規格驅動開發：同一 session 連續執行 P0→P1→P2，模板驅動實作 |
| [spec-digest-flow](skills/spec-digest-flow/) | **v1.0.0** | 通用（SA 規格書消化） | PG 接到 SA 規格書後的標準流程：規格統計 → 釐清清單 → SA 回覆整合 → 任務清單，含 Prompt 模板與輸出模板 |
| [serp-agentic-coding](skills/serp-agentic-coding/) | 暫停 | serp 專案 | 原型骨架，待 eap 實測結論回饋後迭代 |

### eap-agentic-coding

規格書 + HTML 畫面 + DDL + 邏輯文件 → 四源交叉比對消除矛盾 → 拆為 <50 行任務 → Test Agent 寫測試 → Code Agent 實作（測試唯讀）→ Review Agent 交叉驗證。

核心機制：
- **Agent 分離** — 寫測試、寫代碼、做審查各用不同 session（自我修正率 18% vs 外部 88%）
- **測試唯讀 Hook** — 結構性阻擋 Code Agent 修改測試（博弈率差 43 倍）
- **精簡 Context** — 每個 Task 獨立載入，按需載入 conventions + templates（減少 60% 錯誤）

詳細使用方法見 [eap-agentic-coding/README.md](skills/eap-agentic-coding/README.md)。

### eap-agentic-coding-lite

目標 30 分鐘內完成一個模組。同一 session 連續執行 P0→P1→P2，P2 逐任務載入模板做 placeholder 替換 + 業務邏輯微調。

必須流程：
- **後端** — Entity → Create → Update → Delete → Query → GetById → [Dropdown] → `mvn compile`
- **前端** — Types → Service → Store → Router → 主頁面 → 各 Dialog → i18n → `vue-tsc --noEmit`

詳細使用方法見 [eap-agentic-coding-lite/README.md](skills/eap-agentic-coding-lite/README.md)。

## 研究基礎

這些 skills 的設計規則追溯至以下實證研究，非經驗談：

| 文件 | 內容 |
|------|------|
| [01 LLM 行為特性研究彙整](01_LLM_行為特性研究彙整.md) | 11 項 LLM 行為風險 + 量化證據（語義漂移、Context Rot、模式複製、規格博弈等） |
| [01 摘要](01_摘要.md) | 上述研究的萃取摘要 |
| [02 Skill 設計原則](02_Skill設計原則_Thariq_Anthropic.md) | Anthropic 工程師 Thariq 的 9 項 Skill 設計原則 |
| [03 Harness Engineering](03_Harness_Engineering_HumanLayer.md) | HumanLayer 的 7 項 Harness Engineering 原則 + 反模式 |
| [review/](review/) | Skills 的多輪交叉審查報告 |

## 設計原則

- **AI 做執行，人做判斷** — 每個 Phase 有明確的人類決策點（STOP Gate）
- **信噪比 > 總量** — conventions 和 templates 按需載入，不一次全灌
- **回饋迴路決定自主上限** — 測試、lint、型別檢查提供 pass/fail 信號
- **研究 → Skill 直接推導** — 不設中間抽象層，減少語義漂移
