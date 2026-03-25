# Phase 2｜實作

**執行者**：Code Agent（與 Phase 1 的 Test Agent 不同）

**目的**：按任務清單逐一實作，通過 Phase 1 產出的測試。

## 輸入

- Phase 0 產出的統一規格
- Phase 1 產出的 `tasks.md`
- Phase 1 產出的測試檔案（**唯讀**）
- `conventions/` 中按需載入相關檔案：
  - 共用：`tech-stack.md`、`naming-conventions.md`、`db-conventions.md`、`data-access.md`
  - 後端 Task：`code-patterns-backend.md`（不載入 frontend）
  - 前端 Task：`code-patterns-frontend.md`（不載入 backend）

## 步驟

對每個 Task（按 `tasks.md` 的執行順序）：

### Step 0：模板匹配

1. 根據當前 Task 涉及的檔案類型，從 `templates/` 目錄**只載入對應的 1-2 個模板檔案**：
   - `*Entity.java` → `backend-entity.md`
   - `*CreateProcessor.java` → `backend-processor-create.md`（含 Thick/Thin 兩版）
   - `*UpdateProcessor.java` → `backend-processor-update.md`
   - `*DeleteProcessor.java` → `backend-processor-delete.md`
   - `*QueryProcessor.java` → `backend-processor-query.md`（PaginationUtil 分頁）
   - 下拉選單需求 → `backend-processor-dropdown.md`（LOV YAML 優先）
   - `*GetByIdProcessor.java` → `backend-processor-getbyid.md`
   - `*Query.vue` / `*Page.vue` → `frontend-page.md`（CRUD + Dialog 模式）
   - `*Dialog.vue` → `frontend-dialog.md`（新增/編輯 Dialog）
   - `*Service.ts` → `frontend-service.md`（API 封裝）
   - `*Store.ts` → `frontend-store.md`（Setup + Object 兩版）
   - `*Types.ts` → `frontend-types.md`（Entity + Request + Response 型別）
2. 有匹配 → 以模板骨架開始，填入業務邏輯
3. 無匹配 → 參考 `conventions/code-patterns-backend.md`（後端 Task）或 `conventions/code-patterns-frontend.md`（前端 Task）
4. **不可自行發明新的結構模式** (§5：防止模式發散)
5. **不可一次載入所有模板** (§2 + §10：精簡 context，每個 Task 最多 1-2 個模板)
6. 如有 `permission_framework` 定義 → 前端按鈕必須使用指定的權限組件

### Step 1：從源頭載入

載入精簡 context（每個 Task 獨立，不基於前一個 Task 的 context）：

| 載入 | 不載入 |
|------|--------|
| 統一規格中**該 Task** 的段落 | 整份統一規格 |
| 該 Task 涉及的檔案（tasks.md 中列出的） | 專案中所有檔案 |
| 該 Task 的測試檔案 | 其他 Task 的測試 |
| `conventions/` 的相關區塊 | `conventions/` 全文 |

> 為什麼？ 策劃過的 context 減少 60% 錯誤 (§2)。每次從源頭載入，漂移被歸零 (§1)。

### Step 2：實作代碼

根據模板骨架（或 `conventions/code-patterns-{backend,frontend}.md`）+ 統一規格中該 Task 的業務規則，撰寫實作代碼。

### Step 3：執行測試

```
測試通過 → 下一個 Task
測試失敗 → 修正代碼（不可修改測試），重新執行
```

## 約束

| 約束 | 原因 |
|------|------|
| **不可修改測試檔案** | §9：測試唯讀是最有效的結構性防禦（30.4% vs 0.7% 博弈率） |
| **不可刪除、跳過、或標記測試為 skip** | §9：反作弊指令無效（14/20 仍博弈），結構限制才有效 |
| **遇到無法通過的測試 → 報告，不繞過** | §9：給「我做不到」的退出選項可降低博弈壓力 |
| **不可從其他 Task 的代碼推測模式** | §5：前一個 Task 的 bug 會被複製到下一個 |
| **不確定的 API/依賴必須驗證存在性** | §6：19.7% 推薦套件不存在 |
| **業務邏輯不確定時詢問而非假設** | §6：「暫不實作」比幻覺填補安全 |
| **測試失敗時先 Wait 再修正** | §8：Wait 提示降低盲區率 89.3%。暫停 → 重讀規格 → 再修，避免在錯誤理解上疊加修正 |
| **不可偏離 `templates/` 模板定義的結構** | §5：一致性 > 優雅。模板中的問題記到 review_notes |

## 產出

- 實作代碼（按 ``conventions/`` 的目錄結構放置）
- 測試執行結果（成功靜默，失敗詳述）
- `review_notes.md` — 遇到的疑問、可能的測試問題、規格模糊處

## STOP Gate

| 條件 | 動作 |
|------|------|
| 全部 Task 測試通過 | 自動進入 Phase 3 |
| 有 Task 無法通過測試且已記錄到 review_notes.md | 通知使用者後進入 Phase 3 |

## 失敗處理

```
測試失敗
  ├─ 先 Wait：暫停，重新從統一規格理解該 Task 的業務規則 (§8)
  ├─ 代碼有 bug → 修正代碼，重跑測試
  ├─ 理解規格有誤 → 回查統一規格，修正理解，重新實作
  └─ 測試本身似乎有問題 → 不修改測試，記錄到 review_notes.md 供 Phase 3 處理
```

> 為什麼不讓 Code Agent 修改測試？ 讓 Code Agent 判斷「測試錯了」等於讓它自我裁決 — §8：自我修正率僅 18%。交給 Phase 3 的 Review Agent 判斷更可靠（外部修正率 88%）。

## Gotchas

- 「測試太嚴格」99% 的情況是代碼有問題，不是測試有問題
- 模板中的錯誤不要自己修 — 記到 review_notes.md，讓 P3 統一裁決
- 每個 Task 結束後不要把 context 帶到下一個 Task — 從源頭重新載入
- `code-patterns-{backend,frontend}.md`「禁止模式」中的做法即使能通過測試也絕對不用
- 驗證 import 的套件確實存在 — `npm ls` 或 `pip list` 確認
