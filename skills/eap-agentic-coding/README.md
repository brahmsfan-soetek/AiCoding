# eap-agentic-coding

> **v0.7.0** — 2026-03-26

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
/eap-agentic-coding
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
3. **你來裁決**每個項目（選擇以哪份來源為準，或回覆 SA 問題）
4. 全部解決後，AI 產出統一規格（`unified-spec.md`）

> 即使各來源「看起來一致」也不可跳過此步 — AI 會發現你沒注意到的細微差異。

### Phase 1｜任務拆解 + 測試

**你的角色**：確認者

1. AI 將統一規格拆為 <50 行的小任務
2. 逐任務撰寫整合測試（從規格推導，非從代碼推導）
3. 前端任務按 7 類強制拆解（Types / Service / Store / Router / i18n / Page / Dialog）
4. 呈現任務清單供你確認
5. **你確認**後進入 Phase 2

> 必須使用**新的 Claude session**（Test Agent ≠ Code Agent）。

### Phase 2｜實作

**你的角色**：觀察者（通常不需介入）

1. AI 按任務清單逐一實作代碼，每個 Task 載入對應模板
2. 每完成一個 Task 就跑對應的測試
3. 測試通過 → 下一個 Task；失敗 → AI 自行修正代碼（不可修改測試）
4. 後端完成後執行 Backend → Frontend 過渡檢查，重載前端 conventions
5. 前端完成後執行結構驗證（TypeScript 編譯、路由、i18n key 完整性）
6. 全部通過後自動進入 Phase 3

> 必須使用**新的 Claude session**（Code Agent ≠ Test Agent）。
> 此 Phase 會自動註冊 hooks 阻擋修改測試檔案。

### Phase 3｜交叉驗證

**你的角色**：決策者

1. AI 獨立審查代碼是否正確實現統一規格
2. 執行前端結構審查（Router / i18n / 三層架構 / SDialog2 API），缺失為 MUST-FIX
3. 產出審查報告（`review_report.md`），含嚴重等級分類
4. **你決定**哪些 MUST-FIX 需要修、哪些可延後

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

## 測試策略

eap 的業務邏輯主要在 SQL（Native Query / YAML LOV），Java 層是薄膠水。因此 AI 產出的是**整合測試**（`@QuarkusTest` + REST Assured 打真實 API），而非 Mock DB 的單元測試。

測試資料庫使用 Docker 本地 MSSQL 實例，與遠端共用 DB 完全隔離。`drop-and-create` 只允許出現在 `src/test/resources/application.properties`，防止意外清除遠端資料庫。

---

## Phase 日誌

每個 Phase 進場/出場時自動記錄時間戳、token 耗用、費用，產出 `.agentic/phase-log.md`。

透過 Claude Code 的 **statusline** 功能自動擷取 session metrics（token/費用/時間），`phase-logger.sh` 在 end 時算差值，不需手動輸入。`statusline.sh` 為透明包裝器——僅記錄 stats，再透傳給使用者原本的 statusline command，不影響使用者的顯示設定。

```
| Phase | 開始時間 | 結束時間 | 階段耗時 | 累計耗時 | Token (in/out) | 費用 (USD) |
|-------|---------|---------|---------|---------|---------------|-----------|
| P0    | ... | ... | 15m 0s | 15m 0s | 12,300 / 5,900 | $0.25 |
```

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
| `phase-log.md` | 全程 | 每階段耗時、token 耗用、費用（自動產出） |

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
SKILL.md                        主入口 — AI 讀取此檔案執行流程
prompts/
  phase-0-spec-check.md         P0 詳細指令
  phase-1-test-agent.md         P1 詳細指令（含前端 7 類強制拆解）
  phase-2-code-agent.md         P2 詳細指令（含模板載入驗證 + 前端驗證）
  phase-3-review-agent.md       P3 詳細指令（含前端結構審查）
conventions/                    eap 專案規範（AI 按需載入）
  tech-stack.md                 技術棧 + 測試框架 + 測試 DB 隔離規則
  naming-conventions.md         命名 + 目錄結構
  db-conventions.md             資料庫慣例 + 測試 DB 編碼與 Collation
  code-patterns-backend.md      後端代碼模式 + 禁止模式 + API 請求完整 Flow
  code-patterns-frontend.md     前端代碼模式 + 禁止模式
  data-access.md                ORM 策略 + 回應格式 + 共用組件
templates/                      代碼模板（AI 按 Task 類型載入）
  backend-entity.md             Entity（@Cacheable + Panache）
  backend-processor-*.md        各類 Processor（Create/Update/Delete/Query/GetById/Dropdown）
  frontend-page.md              Page（CRUD + Dialog 模式）
  frontend-dialog.md            Dialog（SDialog2 @confirm/@cancel 事件模式）
  frontend-service.md           Service（API 封裝）
  frontend-store.md             Store（Pinia Setup/Object 兩版）
  frontend-types.md             Types（Entity + Request + Response）
  frontend-router.md            Router（路由註冊 + meta.pid 一致性）
  frontend-i18n.md              i18n（JSON 結構 + key 命名 + 共用 key）
  test-infrastructure.md        測試基建（Quarkus + Docker MSSQL）
examples/
  conflict-list-example.md      P0 產出格式範例
references/
  traceability-appendix.md      11 項 LLM 特性 → Phase 防禦對應表
```

## 技術棧

eap：Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL

---

## Changelog

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) |
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

### [0.7.0] - 2026-03-26

#### Added
- `templates/frontend-router.md` — 路由註冊模板（routes.ts 格式、meta.pid 一致性）
- `templates/frontend-i18n.md` — i18n 國際化模板（JSON 結構、key 命名、共用 key 清單）
- Phase 2：前端整合模板規則（*.vue 出現時強制伴隨 router + i18n 模板）
- Phase 2：模板載入驗證機制（Mandatory self-check）
- Phase 2：Backend → Frontend 過渡檢查（context 重置）
- Phase 2：Step 3a 前端驗證（TypeScript 編譯 + 路由 + i18n key 完整性）
- Phase 3：Step 2a 前端結構審查（9 項檢查，router/i18n = MUST-FIX）

#### Changed
- `templates/frontend-dialog.md` — 對齊 SDialog2 真實 API（`@confirm`/`@cancel` 事件 + `:confirm-loading`）
- Phase 1：前端任務強制拆解為 7 類獨立 Task（禁止合併為 1-2 個大 Task）
- Phase 3：`code-patterns-frontend.md` 加入 P3 載入時機
- `SKILL.md`：模板索引表新增 router/i18n 兩行 + 前端整合模板規則

#### Fixed
- P2 Code Agent 未載入 frontend-page.md / frontend-dialog.md 的結構性缺陷
- 前端路由未註冊導致頁面打不開
- i18n key 結構錯誤導致全顯示屬性名稱
- Dialog 手動按鈕模式與 SDialog2 真實 API 不匹配

### [0.6.0] - 2026-03-26

#### Added
- `templates/test-infrastructure.md` — Quarkus 測試基建完整模板
- `conventions/db-conventions.md`：測試 DB 編碼與 Collation 段落（Chinese_Taiwan_Stroke_CI_AS）
- `conventions/code-patterns-backend.md`：API 請求完整 Flow 段落（HandlerApiResource → Camel → Processor）

#### Changed
- `.agentic/` 改為模組隔離目錄（`.agentic/{moduleCode}/`）
- Hooks 改為 Setup 前置配置（非 Phase 2 動態註冊）
- `tech-stack.md`：`./mvnw` 改為 `mvn`
- Phase 2 新增前置條件：`mvn clean install -DskipTests`

#### Fixed
- Quarkus 測試基礎建設缺失（91 tool calls、~19m 浪費）
- DB Encoding/Charset 地獄（63 tool calls、~13m 浪費）
- API routing 架構探索重複（33 tool calls、~6m 浪費）
- mvnw 找不到（13 tool calls）
- 測試 DB port 錯誤（11434 → 11433）

### [0.5.0] - 2026-03-26

#### Added
- Phase 日誌功能 — 自動記錄每階段 token 耗用、耗時、費用
- `statusline.sh` + `phase-logger.sh` hooks
- README 補充測試策略、Phase 日誌、hooks 目錄結構

#### Fixed
- 測試策略用詞：單元測試改為整合測試，補測試 DB 隔離規則

### [0.4.0] - 2026-03-25

#### Added
- `.claude-plugin/plugin.json` — Claude Code marketplace plugin 設定
- DOCX 規格書支援（Phase 0 自動轉為 MD + 圖片）

#### Changed
- 拆分 plugin 為獨立安裝（eap / serp 各自一個 plugin）
- SKILL name 去重（eap-agentic-coding / serp-agentic-coding）
- 根 README 改為 marketplace 首頁

#### Fixed
- Plugin 目錄結構修正（符合 Claude Code plugin 規範）

### [0.3.0] - 2026-03-24

#### Added
- eap-agentic-coding SKILL（從 serp 複製流程骨架，適配 eap 技術棧）
- 三輪審查修正：消除矛盾、補缺漏、新增前端模板、Hooks 強制、命名統一、Context 防火牆、觸發描述、模型策略

#### Changed
- 重寫 eap-agentic-coding README（以人為對象的使用方法）

### [0.2.0] - 2026-03-23

#### Added
- serp-agentic-coding SKILL — 首個完整 Skill（Phase 0-3）
- SR1 Skill 審視報告（2 嚴重 + 4 中等 + 4 輕微）
- 4 個 Processor 模板（Update/Delete/Dropdown/GetById）

#### Changed
- 前端模板改為組件式（page 薄殼 + ListSection）

### [0.1.0] - 2026-03-22

#### Added
- 01 LLM 行為特性研究彙整（v0.2 → v0.5，11 項特性 + 量化證據）
- 01 摘要（供 SKILL 推導用）
- 02 Skill 設計原則（Thariq/Anthropic — 9 類分類 + 9 項原則）
- 03 Harness Engineering（HumanLayer — 7 項原則）
- 研究審查修正（r1 歸屬錯誤、r2 數據校準、r3 引用交叉驗證）
