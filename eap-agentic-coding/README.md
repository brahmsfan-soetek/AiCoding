# eap-agentic-coding

eap 專案的規格驅動 AI 開發流程。以 11 項 LLM 行為特性實證研究為基礎，透過結構性防禦（而非指令性約束）確保 AI 產出品質。

## 流程概覽

```
Phase 0  規格衝突檢查    規格書 ↔ HTML ↔ DDL ↔ Logic 交叉比對，矛盾消除
  ↓
Phase 1  任務拆解 + 測試  Test Agent：理解規格 → 拆為 <50 行任務 → 逐任務寫測試
  ↓
Phase 2  實作            Code Agent（≠ Test Agent）：逐任務實作，測試檔案唯讀
  ↓
Phase 3  交叉驗證        Review Agent（≠ Code Agent）：獨立驗證代碼 vs 規格
```

## 目錄結構

```
SKILL.md                     主入口 — Phase 路由、Agent 分離模型、編排規則
prompts/
  phase-0-spec-check.md      P0 規格衝突檢查指令
  phase-1-test-agent.md      P1 規格理解 → 任務拆解 → 測試指令
  phase-2-code-agent.md      P2 實作指令（測試唯讀）
  phase-3-review-agent.md    P3 交叉驗證指令
conventions/
  tech-stack.md              技術棧 + 測試框架
  naming-conventions.md      命名 + 目錄結構
  db-conventions.md          資料庫慣例
  code-patterns-backend.md   後端代碼模式 + 禁止模式（§2 拆分，後端 Task 載入）
  code-patterns-frontend.md  前端代碼模式 + 禁止模式（§2 拆分，前端 Task 載入）
  data-access.md             ORM 策略 + 回應格式 + 共用組件
templates/
  backend-entity.md              Entity 模板（@Cacheable + Panache）
  backend-processor-create.md    Create Processor（Thick/Thin 兩版）
  backend-processor-update.md    Update Processor（部分更新模式）
  backend-processor-delete.md    Delete Processor（批次刪除）
  backend-processor-query.md     Query Processor（PaginationUtil 分頁）
  backend-processor-dropdown.md  Dropdown / LOV（YAML 優先）
  backend-processor-getbyid.md   GetById Processor（單筆查詢）
  frontend-page.md               Page 模板（CRUD + Dialog 模式）
  frontend-dialog.md             Dialog 組件（新增/編輯）
  frontend-service.md            Service 模板（API 封裝）
  frontend-store.md              Store 模板（Setup + Object 兩版）
  frontend-types.md              Types 模板（Entity + Request + Response）
examples/
  conflict-list-example.md   P0 產出格式範例（conflicts.md + sa_pending.md）
references/
  traceability-appendix.md   11 項 LLM 特性 → Phase 防禦對應表
```

## 三條硬性規則

| 規則 | 證據 |
|------|------|
| Test Agent ≠ Code Agent | 自我修正率 18% vs 外部 88%（§8） |
| Code Agent 不可修改測試 | 回饋可見性博弈率 43× 差異（§9） |
| Review Agent ≠ Code Agent | 附和偏見 95% + 盲區 64.5%（§7+§8） |

## 載入紀律

- 每個 Phase 只載入該 Phase 的 prompt，不載入其他 Phase
- 每個 Task 從源頭文件獨立載入，不繼承前一 Task 的 context
- conventions/ 和 templates/ 按需載入，不一次全灌

## 技術棧

eap（Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL）
