# Phase 1-lite｜任務拆解

**執行者**：同一 session（Demo 版無 Agent 分離）

**目的**：理解統一規格，拆解為小任務，每個任務標記對應的 template 檔名。

> lite 版不寫測試。任務拆解的目的是確保 P2-lite 逐任務載入正確的 template + conventions。

## 輸入

- Phase 0 產出的統一規格（`.agentic/{moduleCode}/unified-spec.md`）
- `conventions/tech-stack.md`、`conventions/naming-conventions.md`、`conventions/db-conventions.md`
- `conventions/code-patterns-frontend.md`（**必須載入** — 含 UI 互動模式規則、統一 LOV 模式）

## 步驟

### Step 1：規格理解

1. 讀取統一規格，列出所有功能點。
2. 對每個功能點標記：
   - 明確的業務規則（可直接實作）
   - 隱含的假設（需在實作中注意）
   - 依賴的外部系統 / API

### Step 2：UI 互動模式確認

確認統一規格中的「UI 互動模式」段落。eap 專案預設 Dialog 模式。

| | Dialog 模式（預設） |
|---|---|
| **路由數量** | 僅 1 條（主頁面） |
| **Create/Edit/Batch 檔案** | `components/{ModuleCode}XxxDialog.vue` |
| **Create/Edit/Batch 模板** | `frontend-dialog-create.md` / `frontend-dialog-edit.md` / `frontend-dialog-batch.md` |
| **主頁面模板** | `frontend-page.md`（含 Dialog 整合） |

### Step 3：後端任務拆解

**後端架構**：Thin Processor + 集中式 Service。所有業務邏輯在 Service 中，Processor 僅做參數驗證和委派。

| Task 類型 | 涉及檔案 | 模板 | 依賴 |
|-----------|---------|------|------|
| Entity 定義 | `tm/domain/{EntityName}Entity.java` | `backend-entity.md` | 無 |
| Service（核心邏輯） | `tm/service/{ModuleCode}EmpVacationService.java` | `backend-service.md` | Entity |
| Save Processor（新增+修改） | `tm/processor/{ModuleCode}EmpVacationSaveProcessor.java` | `backend-processor-save.md` | Service |
| Delete Processor | `tm/processor/{ModuleCode}EmpVacationDeleteProcessor.java` | `backend-processor-delete.md` | Service |
| Detail Processor（明細查詢） | `tm/processor/{ModuleCode}EmpVacationDetailProcessor.java` | `backend-processor-detail.md` | Service |
| DefaultVacation Processor | `tm/processor/{ModuleCode}DefaultVacationProcessor.java` | `backend-processor-default.md` | Service |
| BatchValidate Processor | `tm/processor/{ModuleCode}BatchValidateProcessor.java` | `backend-processor-batch-validate.md` | Service |
| BatchImport Processor | `tm/processor/{ModuleCode}BatchImportProcessor.java` | `backend-processor-batch-import.md` | Service |

> **Save = Create + Update 合併**。不建立分開的 Create/Update Processor。
> BatchValidate 和 BatchImport 僅在有批次匯入功能時需要。

### Step 4：前端任務拆解

**禁止**將所有前端工作合併為 1-2 個大 Task。前端須按以下粒度拆解：

| Task 類型 | 涉及檔案 | 模板 | 依賴 |
|-----------|---------|------|------|
| Types 定義 | `types/tm/{moduleCode}.ts` | `frontend-types.md` | 無 |
| Service 層 | `services/tm/{moduleCode}Service.ts` | `frontend-service.md` | Types |
| Store 層 | `stores/tm/{moduleCode}/use{ModuleCode}Store.ts` | `frontend-store.md` | Service, Types |
| Router 註冊 | `router/routes.ts`（追加項目） | `frontend-router.md` | 無 |
| 主頁面 | `pages/tm/{moduleCode}/{MODULE_CODE}.vue` | `frontend-page.md` | Store, Types |
| CreateDialog | `pages/tm/{moduleCode}/components/{ModuleCode}CreateDialog.vue` | `frontend-dialog-create.md` | Store, Types |
| EditDialog | `pages/tm/{moduleCode}/components/{ModuleCode}EditDialog.vue` | `frontend-dialog-edit.md` | Store, Types |
| BatchDialog | `pages/tm/{moduleCode}/components/{ModuleCode}BatchDialog.vue` | `frontend-dialog-batch.md` | Store, Types |
| i18n Keys | `i18n/zh-TW/tm/tm.json` + `i18n/en-US/tm/tm.json` | `frontend-i18n.md` | 主頁面, Dialog |

### Step 5：產出任務清單

產出格式：

```markdown
# 任務清單 — {moduleCode} {moduleName}

## UI 互動模式決策
- **模式**: Dialog
- **路由規劃**: 僅 /{MODULE_CODE}
- **前端元件**: 主頁面 + CreateDialog + EditDialog + BatchDialog

## 後端任務

### Task-01: Entity 定義
- **類型**: 後端
- **檔案**: `tm/domain/TmEmpVacationEntity.java`
- **模板**: `backend-entity.md`
- **依賴**: 無
- **業務規則**:
  1. DDL 欄位對應（來源：統一規格 DDL 段落）
  2. Schema: EAP → 基類 AuditableEapEntity

### Task-02: Service（核心邏輯）
- **類型**: 後端
- **檔案**: `tm/service/Tm002EmpVacationService.java`
- **模板**: `backend-service.md`
- **依賴**: Task-01
- **業務規則**:
  1. B1: UNUSED_HOURS = MAX_HOURS - USED_HOURS
  2. B3: 執行預設僅回傳病假
  3. B4: 結算列不可刪除
  4. B5: 不修改 CLEAR 欄位
  5. ...（從統一規格列出）

### Task-03 ~ Task-08: 各 Processor
（依上表列出）

## 前端任務

### Task-09: Types 定義
- **類型**: 前端
- **檔案**: `types/tm/tm002.ts`
- **模板**: `frontend-types.md`
- **依賴**: 無

### Task-10 ~ Task-17: 其他前端
（依上表列出）
```

## 約束

| 約束 | 原因 |
|------|------|
| **不可合併前端任務** | 細粒度拆解確保 P2 對每個檔案投入足夠注意力 |
| **每個任務必須標記 template** | P2-lite 依此載入模板，遺漏會導致從零開始寫 |
| **後端 Save = Create + Update** | 不分開建立，統一由 Service 處理 |

## 產出

- `tasks.md` — 任務清單（含依賴關係、執行順序、template 標記）

存入 `.agentic/{moduleCode}/tasks.md`。

## STOP Gate

| 條件 | 動作 |
|------|------|
| 任務清單完成 | 呈現給使用者確認後進入 Phase 2-lite |

## Gotchas

- 不是每個模組都需要全部 17 個 Task — 依統一規格決定（如無批次匯入則不需 BatchValidate/BatchImport/BatchDialog）
- 前端 i18n Task 依賴主頁面和 Dialog（需要知道有哪些 key）— 排在最後
- **Dialog 模式只需 1 條路由** — 不為 Create/Edit/Batch 建獨立路由
- 規格書的「修改頁面」「新增頁面」不代表前端要建獨立路由頁面
