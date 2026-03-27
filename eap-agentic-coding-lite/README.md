# eap-agentic-coding-lite

> **v1.0.0** — 2026-03-27

eap 專案的規格驅動 AI 開發流程 **Demo 精簡版**（Claude Code Skill）。
目標 30 分鐘內完成一個模組從規格到可運行程式碼。

**與完整版的差異**：無測試、無 hooks、無 P3 審查、同一 session 連續執行。
模板從骨架升級為「含 TM002 完整實作的參考程式碼」。

## 使用前準備

### 1. 準備規格資料

| 材料 | 格式 | 說明 |
|------|------|------|
| 規格書 | `.docx` 或 `.md`（可含圖片） | SA 文件（功能需求、Use Case、業務邏輯、SQL） |
| HTML 畫面 | 目錄（多個 `.html`） | UI mockup，每頁一個檔案 |
| DDL/CSV | 目錄（多個 `.csv`） | 資料表結構定義 |
| 邏輯文件 | 目錄（`.txt` / `.md`） | SA 口頭釐清的書面化（覆寫其他來源） |

### 2. 確認 Skill 已安裝

本資料夾應位於 Claude Code 可載入的 skill 路徑下。
Claude Code 會在 skill 清單中顯示 `eap-agentic-coding-lite`。

## 使用方法

在 eap 專案目錄中開啟 Claude Code，輸入：

```
/eap-agentic-coding-lite
```

首次使用會建立 `.agentic/config.json`（模組代號、規格路徑等），之後直接進入流程。

---

## 必須流程

```
P0 規格衝突檢查 ──→ P1 任務拆解 ──→ P2 模板驅動實作
     │                    │                    │
     │ 讀取 4 份來源       │ 拆解為 Task         │ 逐 Task 載入 template
     │ 交叉比對矛盾        │ 每個 <50 行         │ 替換 placeholder
     │ 人工裁決衝突        │ 標記 template       │ 微調業務邏輯
     ▼                    ▼                    ▼
  unified-spec.md     tasks.md            可運行程式碼
```

### Phase 0｜規格衝突檢查

**你的角色**：裁決者

1. AI 交叉比對規格書、HTML、DDL、邏輯文件
2. 產出衝突清單（`conflicts.md`）
3. **你來裁決**每個項目
4. 全部解決 → 產出統一規格（`unified-spec.md`）

### Phase 1-lite｜任務拆解

**你的角色**：確認者

1. AI 將統一規格拆為 <50 行的小任務
2. 每個任務標記對應的 template 檔名
3. **你確認**任務清單後進入 P2

### Phase 2-lite｜模板驅動實作

**你的角色**：觀察者

後端和前端按嚴格順序逐步執行：

#### 後端（7 步）

```
Step 1  Entity 定義           ← backend-entity.md
  │
  ├→ Step 2  Create Processor  ← backend-processor-create.md
  ├→ Step 3  Update Processor  ← backend-processor-update.md
  ├→ Step 4  Delete Processor  ← backend-processor-delete.md
  ├→ Step 5  Query Processor   ← backend-processor-query.md
  ├→ Step 6  GetById Processor ← backend-processor-getbyid.md
  └→ Step 7  Dropdown (若需要) ← backend-processor-dropdown.md

  ★ mvn compile 驗證
```

#### 前端（7 步）

```
Step 1  Types 定義            ← frontend-types.md
  │     Entity / Request / Response interface
  │
  ├→ Step 2  Service 層        ← frontend-service.md
  │          API endpoints + wrapper functions
  │
  ├→ Step 3  Store 層          ← frontend-store.md
  │          Pinia Setup + useErrorHandler
  │
  ├→ Step 4  Router 註冊       ← frontend-router.md
  │          routes.ts 追加（meta.pid = setPagePid）
  │
  ├→ Step 5  主頁面            ← frontend-page.md
  │          查詢區 + 按鈕(permission-id) + 表格 + Dialog
  │
  ├→ Step 6  各 Dialog 組件    ← frontend-dialog.md
  │          每種 Dialog 獨立檔案（Create / Edit / Batch）
  │          SDialog2（@confirm / @cancel），不手動加按鈕
  │
  └→ Step 7  i18n Keys        ← frontend-i18n.md
             zh-TW + en-US，key prefix = '{module}.{moduleCode}.'

  ★ vue-tsc --noEmit 驗證
```

#### 整合驗證

```
  ★ 啟動應用 → 頁面載入 → CRUD 操作
```

---

## 前端組件拆分規則

依規格的畫面需求決定需要哪些組件：

| 規格描述 | 產出組件 |
|---------|---------|
| 查詢 + 列表頁面 | `{ModuleCode}.vue`（必要） |
| 新增功能 | `{ModuleCode}CreateDialog.vue` |
| 編輯功能 | `{ModuleCode}EditDialog.vue` |
| 批次匯入 | `{ModuleCode}BatchDialog.vue` |
| 明細檢視 | `{ModuleCode}DetailDialog.vue` |
| 子表格 | `{ModuleCode}DetailTable.vue` |

- 每個 Dialog 獨立一個檔案、一個 Task
- 所有 Dialog 使用 `SDialog2`（`@confirm` / `@cancel`）
- 共用組件優先（SBtn, SInput, SSelect2, SCard 等），零自訂 CSS

---

## 產出物

| 檔案 | Phase | 說明 |
|------|-------|------|
| `config.json` | Setup | 模組配置 |
| `conflicts.md` | P0 | 衝突清單 + 裁決結果 |
| `unified-spec.md` | P0 | 統一規格 |
| `tasks.md` | P1 | 任務清單（含 template 標記） |

> 存放於 `.agentic/{moduleCode}/` 下。建議 `.gitignore` 加入 `.agentic/`。

---

## 目錄結構

```
SKILL.md                         主入口
prompts/
  phase-0-spec-check.md          P0 規格衝突檢查指令
  phase-1-task-breakdown.md      P1 任務拆解指令
  phase-2-implementation.md      P2 模板驅動實作指令（含必須流程 + 驗證清單）
conventions/                     eap 專案規範（按需載入）
  tech-stack.md                  技術棧
  naming-conventions.md          命名 + 目錄結構
  db-conventions.md              資料庫慣例
  code-patterns-backend.md       後端代碼模式 + 禁止模式
  code-patterns-frontend.md      前端代碼模式 + 禁止模式
  data-access.md                 ORM 策略 + 回應格式 + 共用組件
templates/                       代碼模板（含 TM002 完整參考實作）
  backend-entity.md              Entity（Panache + @Cacheable）
  backend-processor-create.md    Create（Thick / Thin 兩版）
  backend-processor-update.md    Update
  backend-processor-delete.md    Delete
  backend-processor-query.md     Query（PaginationUtil 分頁）
  backend-processor-getbyid.md   GetById
  backend-processor-dropdown.md  Dropdown（LOV YAML 優先）
  frontend-types.md              Types（Entity + Request + Response）
  frontend-service.md            Service（API 封裝）
  frontend-store.md              Store（Pinia Setup / Object 兩版）
  frontend-router.md             Router（meta.pid 一致性）
  frontend-page.md               Page（CRUD + Dialog 整合）
  frontend-dialog.md             Dialog（SDialog2 @confirm/@cancel）
  frontend-i18n.md               i18n（zh-TW + en-US）
examples/
  conflict-list-example.md       P0 衝突清單格式範例
references/
  traceability-appendix.md       LLM 特性 → Phase 防禦對應表
```

## 技術棧

eap：Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL

---

## vs 完整版 (eap-agentic-coding)

| | lite | 完整版 |
|---|------|--------|
| Phase | P0 → P1 → P2 | P0 → P1 → P2 → P3 |
| Session | 同一 session | 每 Phase 獨立 session |
| 測試 | 不寫、不跑 | 整合測試（@QuarkusTest） |
| Hooks | 無 | 測試唯讀 + 靜默通過 |
| 模板 | TM002 完整參考實作 | 通用骨架 |
| 產出物 | 4 個 | 9 個（含測試、審查報告） |
| Phase 日誌 | 無 | 自動記錄 token/費用 |
| 目標 | 30 分鐘 Demo | 完整品質保證 |
