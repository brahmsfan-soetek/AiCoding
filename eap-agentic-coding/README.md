# eap-agentic-coding

eap 專案的規格驅動 AI 開發流程（Claude Code Skill）。
以 11 項 LLM 行為特性實證研究為基礎，透過結構性防禦確保 AI 產出品質。

## 使用前準備

### 1. 準備規格資料

在 eap 專案中建立規格目錄，放入以下材料：

| 材料 | 格式 | 說明 |
|------|------|------|
| 規格書 | `.docx` 或 `.md`（可含圖片） | SA 文件（功能需求、Use Case、業務邏輯、SQL） |
| HTML 畫面 | 目錄（多個 `.html`） | UI mockup，每頁一個檔案 |
| DDL/CSV | 目錄（多個 `.csv`） | 資料表結構定義 |
| 邏輯文件 | 目錄（`.txt` / `.md`） | SA 口頭釐清的書面化、業務邏輯補充（覆寫其他來源） |

> DOCX 規格書會在 Phase 0 轉為 MD + 圖片（透過 `docx2md.py`）。MD 規格書中的圖片需放在可存取的目錄下。

### 2. 確認 Skill 已安裝

本資料夾應位於 Claude Code 可載入的 skill 路徑下（如 `.claude/skills/eap-agentic-coding/`）。
Claude Code 會在 skill 清單中顯示 `eap-agentic-coding`。

## 使用方法

### 啟動

在 eap 專案目錄中開啟 Claude Code，輸入：

```
/agentic-coding
```

或直接描述需求，Claude 會在判斷符合條件時自動觸發。

### 首次使用：Setup

Claude 會詢問以下資訊，填入後自動建立 `.agentic/config.json`：

```
模組代號？       → TM003
模組名稱？       → 員工年度假別額度維護
規格書路徑？     → specs/TM-員工年度假別額度維護.md（或 .docx）
規格書圖片目錄？ → specs/images/（MD 格式時；DOCX 轉換後自動產生）
HTML 目錄？      → specs/html/
DDL 目錄？       → specs/ddl_csv/
邏輯文件目錄？   → specs/logic_txt_md/
```

之後每次啟動會讀取此配置，確認後直接進入流程。

---

## 流程概覽

```
              你需要做什麼              AI 做什麼
              ──────────              ──────────
Phase 0    裁決衝突 / 回覆 SA 問題     交叉比對 4 份來源，列出矛盾
  ↓
Phase 1    確認任務清單                 理解規格 → 拆解任務 → 寫測試
  ↓
Phase 2    （通常不需介入）             逐任務實作，通過測試
  ↓
Phase 3    決定修正範圍                 獨立審查代碼 vs 規格
```

### Phase 0｜規格衝突檢查

**你的角色**：裁決者

1. AI 交叉比對規格書、HTML、DDL、邏輯文件
2. 產出衝突清單（`conflicts.md`）和 SA 待確認清單（`sa_pending.md`）
3. **你來裁決**每個 ⏳ 項目（選擇以哪份來源為準，或回覆 SA 問題）
4. 全部解決後，AI 產出統一規格（`unified-spec.md`）

> 即使各來源「看起來一致」也不可跳過此步 — AI 會發現你沒注意到的細微差異。

### Phase 1｜任務拆解 + 測試

**你的角色**：確認者

1. AI 將統一規格拆為 <50 行的小任務
2. 逐任務撰寫單元測試（從規格推導，非從代碼推導）
3. 呈現任務清單供你確認
4. **你確認**後進入 Phase 2

> 必須使用**新的 Claude session**（Test Agent ≠ Code Agent）。

### Phase 2｜實作

**你的角色**：觀察者（通常不需介入）

1. AI 按任務清單逐一實作代碼
2. 每完成一個 Task 就跑對應的測試
3. 測試通過 → 下一個 Task；失敗 → AI 自行修正代碼（不可修改測試）
4. 全部通過後自動進入 Phase 3

> 必須使用**新的 Claude session**（Code Agent ≠ Test Agent）。
> 此 Phase 會自動註冊 hooks 阻擋修改測試檔案。

### Phase 3｜交叉驗證

**你的角色**：決策者

1. AI 獨立審查代碼是否正確實現統一規格
2. 產出審查報告（`review_report.md`），含嚴重等級分類
3. **你決定**哪些 MUST-FIX 需要修、哪些可延後

> 必須使用**新的 Claude session**（Review Agent ≠ Code Agent）。

---

## 重要：每個 Phase 用不同的 Claude session

這不是建議，是架構基礎：

| 規則 | 為什麼 |
|------|--------|
| Test Agent ≠ Code Agent | 同一個 AI 寫的測試會繼承代碼的錯誤（自我修正率僅 18%） |
| Code Agent 不可改測試 | AI 會鑽測試漏洞而非修正代碼（博弈率差 43 倍） |
| Review Agent ≠ Code Agent | AI 審查自己的代碼 = 95% 附和 + 64.5% 盲區 |

**實際操作**：每進入新 Phase 時，結束當前 Claude session，開啟新的。

---

## 產出物

所有中間產物存放在 eap 專案根目錄的 `.agentic/` 下：

| 檔案 | Phase | 說明 |
|------|-------|------|
| `config.json` | Setup | 模組配置 |
| `conflicts.md` | P0 | 衝突清單 + 裁決結果 |
| `sa_pending.md` | P0 | SA 待確認清單 + 回覆 |
| `unified-spec.md` | P0 | 統一規格（後續 Phase 唯一輸入源） |
| `tasks.md` | P1 | 任務清單（含依賴和執行順序） |
| `test_spec_map.md` | P1 | 測試案例 ↔ 規格條目對應表 |
| `review_notes.md` | P2 | Code Agent 遇到的疑問 |
| `review_report.md` | P3 | 審查報告（含嚴重等級） |

> 建議在 `.gitignore` 中加入 `.agentic/`。

---

## 適用 vs 不適用

| 適用 | 不適用 |
|------|--------|
| 有規格書的功能開發 | 輕量 bug 修正 |
| 多來源規格需要交叉比對 | 純重構 |
| 需要前後端完整實作 | 無規格書的探索式開發 |
| 品質要求高、不容許猜測 | 單檔小改動 |

## 目錄結構

```
SKILL.md                     主入口 — AI 讀取此檔案執行流程
prompts/
  phase-0-spec-check.md      P0 詳細指令
  phase-1-test-agent.md      P1 詳細指令
  phase-2-code-agent.md      P2 詳細指令
  phase-3-review-agent.md    P3 詳細指令
conventions/                 eap 專案規範（AI 按需載入）
  tech-stack.md              技術棧 + 測試框架
  naming-conventions.md      命名 + 目錄結構
  db-conventions.md          資料庫慣例
  code-patterns-backend.md   後端代碼模式 + 禁止模式
  code-patterns-frontend.md  前端代碼模式 + 禁止模式
  data-access.md             ORM 策略 + 回應格式 + 共用組件
templates/                   代碼模板（AI 按 Task 類型載入 1-2 個）
  backend-entity.md          Entity（@Cacheable + Panache）
  backend-processor-*.md     各類 Processor（Create/Update/Delete/Query/GetById/Dropdown）
  frontend-page.md           Page（CRUD + Dialog 模式）
  frontend-dialog.md         Dialog 組件
  frontend-service.md        Service（API 封裝）
  frontend-store.md          Store（Pinia Setup/Object 兩版）
  frontend-types.md          Types（Entity + Request + Response）
examples/
  conflict-list-example.md   P0 產出格式範例
references/
  traceability-appendix.md   11 項 LLM 特性 → Phase 防禦對應表
```

## 技術棧

eap：Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL
