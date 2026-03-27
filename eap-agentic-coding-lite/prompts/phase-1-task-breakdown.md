# Phase 1-lite｜任務拆解

**執行者**：同一 session（Demo 版無 Agent 分離）

**目的**：理解統一規格，拆解為小任務，每個任務標記對應的 template 檔名。

> lite 版不寫測試。任務拆解的目的是確保 P2-lite 逐任務載入正確的 template + conventions。

## 輸入

- Phase 0 產出的統一規格（`.agentic/{moduleCode}/unified-spec.md`）
- `conventions/tech-stack.md`、`conventions/naming-conventions.md`、`conventions/db-conventions.md`

## 步驟

### Step 1：規格理解

1. 讀取統一規格，列出所有功能點。
2. 對每個功能點標記：
   - 明確的業務規則（可直接實作）
   - 隱含的假設（需在實作中注意）
   - 依賴的外部系統 / API

### Step 2：任務拆解

將功能點拆解為開發任務，每個任務須滿足：

| 條件 | 原因 |
|------|------|
| 單一職責（一個任務做一件事） | >50 行正確率大幅下降 |
| 標明涉及的檔案清單 | P2-lite 只載入需要的檔案 |
| 標明對應的 template 檔名 | P2-lite 按此載入模板 |
| 標明依賴的其他任務 | 確定執行順序 |
| 預估代碼行數 < 50 行 | 50 行是品質斷崖 |
| 標記後端/前端分組 | 後端先做，前端後做 |

**反附和檢查**：任務清單完成後，列出此拆解方案的 2-3 個潛在問題或替代拆法。

### Step 3：後端任務拆解參考

後端任務通常包含以下類型（依序）：

| Task 類型 | 涉及檔案 | 模板 | 依賴 |
|-----------|---------|------|------|
| Entity 定義 | `{moduleCode}/domain/{EntityName}Entity.java` | `backend-entity.md` | 無 |
| Create Processor | `{moduleCode}/processor/{ModuleCode}CreateProcessor.java` | `backend-processor-create.md` | Entity |
| Update Processor | `{moduleCode}/processor/{ModuleCode}UpdateProcessor.java` | `backend-processor-update.md` | Entity |
| Delete Processor | `{moduleCode}/processor/{ModuleCode}DeleteProcessor.java` | `backend-processor-delete.md` | Entity |
| Query Processor | `{moduleCode}/processor/{ModuleCode}QueryProcessor.java` | `backend-processor-query.md` | Entity |
| GetById Processor | `{moduleCode}/processor/{ModuleCode}GetByIdProcessor.java` | `backend-processor-getbyid.md` | Entity |
| Dropdown Processor | `{moduleCode}/processor/{ModuleCode}DropdownProcessor.java` | `backend-processor-dropdown.md` | Entity |

> 不是每個模組都需要全部 7 種。依統一規格的功能點決定需要哪些。

### Step 4：前端任務拆解（強制粒度）

**禁止**將所有前端工作合併為 1-2 個大 Task。前端須按以下粒度拆解：

| Task 類型 | 涉及檔案 | 模板 | 依賴 |
|-----------|---------|------|------|
| Types 定義 | `{moduleCode}Types.ts` | `frontend-types.md` | 無 |
| Service 層 | `{moduleCode}Service.ts` | `frontend-service.md` | Types |
| Store 層 | `use{ModuleCode}Store.ts` | `frontend-store.md` | Service, Types |
| Router 註冊 | `routes.ts`（新增項目） | `frontend-router.md` | 無 |
| i18n Keys | `{module}.json`（新增 key 區塊） | `frontend-i18n.md` | 主頁面, Dialog |
| 主頁面 | `{ModuleCode}.vue` | `frontend-page.md` | Store, Types |
| 每個 Dialog | `{EntityName}Dialog.vue` | `frontend-dialog.md` | Store, Types |

### Step 5：產出任務清單

產出格式：

```markdown
# 任務清單 — {moduleCode} {moduleName}

## 後端任務

### Task-01: Entity 定義
- **類型**: 後端
- **檔案**: `{moduleCode}/domain/{EntityName}Entity.java`
- **模板**: `backend-entity.md`
- **依賴**: 無
- **預估行數**: ~40 行
- **業務規則**:
  1. 規則 A（來源：統一規格 §X.X）
  2. 規則 B（來源：統一規格 §X.X）

### Task-02: Create Processor
- **類型**: 後端
- **檔案**: `{moduleCode}/processor/{ModuleCode}CreateProcessor.java`
- **模板**: `backend-processor-create.md`
- **依賴**: Task-01
- **預估行數**: ~35 行
- **業務規則**:
  1. ...

## 前端任務

### Task-08: Types 定義
- **類型**: 前端
- **檔案**: `types/tm/{moduleCode}.ts`
- **模板**: `frontend-types.md`
- **依賴**: 無
- **預估行數**: ~30 行

（以此類推）
```

## 約束

| 約束 | 原因 |
|------|------|
| **不可合併前端任務** | 細粒度拆解確保 P2 對每個檔案投入足夠注意力 |
| **每個任務必須標記 template** | P2-lite 依此載入模板，遺漏會導致從零開始寫 |
| **預估行數 < 50 行** | 超過 50 行正確率從 87% 降至 26% |

## 產出

- `tasks.md` — 任務清單（含依賴關係、執行順序、template 標記）

存入 `.agentic/{moduleCode}/tasks.md`。

## STOP Gate

| 條件 | 動作 |
|------|------|
| 任務清單完成 | 呈現給使用者確認後進入 Phase 2-lite |

## Gotchas

- 預估行數是品質安全閥，不是精確計算 — 寧可估高一點再拆
- 不是每個模組都需要全部 14 個 Task — 依統一規格決定
- 前端 i18n Task 依賴主頁面和 Dialog（需要知道有哪些 key）— 排在最後
