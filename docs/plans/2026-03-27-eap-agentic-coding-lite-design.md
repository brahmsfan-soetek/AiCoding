# eap-agentic-coding-lite 設計文件

> **日期**: 2026-03-27
> **目的**: 為老闆 Demo 而設計的精簡版 eap-agentic-coding skill
> **目標**: 30 分鐘內完成 TM002 模組全流程（規格 → 程式碼 → 可啟動運行）

---

## 1. 背景與動機

原版 `eap-agentic-coding` 是研究導向的 4-Phase workflow（P0 衝突檢查 → P1 測試先行 → P2 實作 → P3 交叉驗證），TM002 實測耗時 112 分鐘，其中 66% 為測試基建、編碼問題、API 路由探索等可避免浪費。

Lite 版的目標是：
- **快**：30 分鐘內完成，適合現場 Demo
- **正確**：產出可編譯、可啟動、可操作的程式碼
- **彈性**：Demo 後能當場處理老闆的業務邏輯修改需求（如「預設新增一筆改成兩筆」）

## 2. 設計決策

### 2.1 拔掉的部分

| 項目 | 原因 |
|------|------|
| Phase 3（交叉驗證） | Demo 不需要獨立審查，節省 5-7 分鐘 |
| Phase 1 測試撰寫 | 測試依賴容易出錯（TM002 實測 32% 時間浪費在測試基建），且 Demo 不需要 |
| 所有 Hooks | phase-logger、statusline、block-test-edit、silent-test-pass 全部拔掉，簡化配置 |
| Agent 分離（多 session） | 改為同一 session 連續執行 P0 → P1 → P2，減少切換成本 |
| `test_spec_map.md` 產出 | 無測試，不需要追溯表 |
| `review_notes.md` 產出 | 無 P3，不需要 review notes |
| `sa_pending.md` 產出 | Demo 假設所有 SA 問題已確認 |

### 2.2 保留的部分

| 項目 | 原因 |
|------|------|
| Phase 0 規格衝突檢查 | 展示 AI 理解力，衝突仍需逐一向用戶提問確認（Demo 加分項） |
| Phase 1 任務拆解 | 展示 AI 規劃能力，<50 行 / 單一職責 / 前端 7 種強制拆分 |
| Phase 2 模板驅動實作 | 核心產出，但從骨架 scaffold 升級為完整參考實作 |
| Conventions 全套 | 確保產出符合團隊規範 |
| 編譯驗證 | `mvn compile` + `vue-tsc --noEmit` + 應用啟動 |

### 2.3 核心策略：模板即答案

把 `templates/` 從「骨架 scaffold」升級為「含 TM002 完整實作的參考程式碼」。P2 時 AI 讀規格 + 讀完整模板 → 套用變數替換 + 業務邏輯微調 → Write 檔案。

**優點**：
- 模板已有 90% 的答案，速度有保障
- AI 仍需理解規格做微調，不算純抄
- Demo 後手改自然（AI 已有完整程式碼理解）

## 3. 目錄結構

```
eap-agentic-coding-lite/
├── SKILL.md                          # 主入口（3-Phase 精簡流程）
├── prompts/
│   ├── phase-0-spec-check.md         # 沿用原版（衝突仍需提問確認）
│   └── phase-1-task-breakdown.md     # P1-lite：只拆任務，不寫測試
├── conventions/                      # 沿用原版（不改）
│   ├── tech-stack.md
│   ├── naming-conventions.md
│   ├── db-conventions.md
│   ├── code-patterns-backend.md
│   ├── code-patterns-frontend.md
│   └── data-access.md
├── templates/                        # ★ 升級為「完整參考實作」
│   ├── backend-entity.md
│   ├── backend-processor-create.md
│   ├── backend-processor-update.md
│   ├── backend-processor-delete.md
│   ├── backend-processor-query.md
│   ├── backend-processor-dropdown.md
│   ├── backend-processor-getbyid.md
│   ├── frontend-page.md
│   ├── frontend-dialog.md
│   ├── frontend-service.md
│   ├── frontend-store.md
│   ├── frontend-types.md
│   ├── frontend-router.md
│   └── frontend-i18n.md
├── examples/
│   └── conflict-list-example.md      # 沿用原版
└── references/
    └── traceability-appendix.md      # 可選保留
```

## 4. Phase 流程設計

### Phase 0 — 規格衝突檢查（~5-8 分鐘）

**輸入**：規格書（DOCX/MD）+ HTML 畫面 + DDL + 邏輯文件

**流程**：
1. 讀取所有規格來源
2. 交叉比對：Spec ↔ HTML、Spec ↔ DDL、HTML ↔ DDL
3. 套用邏輯文件覆蓋已知矛盾
4. **產出衝突清單 → 逐一向用戶提問確認**
5. 確認完成後產出 `unified-spec.md`

**產出**：
- `.agentic/{moduleCode}/conflicts.md`
- `.agentic/{moduleCode}/unified-spec.md`

**STOP Gate**：衝突全部解決後才進入 P1。

### Phase 1-lite — 任務拆解（~3-5 分鐘）

**輸入**：`unified-spec.md` + conventions

**流程**：
1. 列出所有功能點（顯式規則 vs 隱含假設）
2. 任務拆解：
   - 單一職責、< 50 行
   - 列出影響檔案
   - 標記任務依賴
   - **每個任務標記對應的 template 檔名**
3. 前端強制 7 種拆分（Types / Service / Store / Router / i18n / Page / Dialog）

**產出**：
- `.agentic/{moduleCode}/tasks.md`

**STOP Gate**：用戶確認任務清單後進入 P2。

### Phase 2-lite — 模板驅動實作（~15-20 分鐘）

**流程（per task）**：
1. 載入該任務對應的 template（完整參考實作）
2. 載入 `unified-spec.md` 中相關段落
3. 載入對應 conventions
4. **套用模板**：替換 TM002 變數 → 目標模組值，調整業務邏輯
5. Write 檔案

**驗證**：
- 後端全部完成 → `mvn compile`
- 前端全部完成 → `npx vue-tsc --noEmit`
- 全部完成 → 啟動應用驗證

**無測試、無 review notes、無 hooks。**

## 5. 模板升級格式

每個模板的結構：

```markdown
---
name: backend-entity
applies_to: "*Entity.java"
---

## 說明
Entity 檔案的完整實作範例，基於 TM002 模組。

## 替換規則
- `{ModuleCode}` → 目標模組代碼（PascalCase）
- `{moduleCode}` → 目標模組代碼（camelCase）
- `{tableName}` → DDL 中的表名
- `{fields}` → 依 unified-spec 的欄位清單產生
- `{businessLogic}` → 依 unified-spec 的業務規則填入

## 完整參考實作
（TM002 的完整程式碼，帶有 placeholder 標記）

## 業務邏輯注意點
- 此類型檔案中常見的業務邏輯變化點
- AI 需依據 unified-spec 判斷是否需要修改
```

**原則**：
1. 模板是「帶註解的完整程式碼」，不是 snippet
2. 替換變數用 `{placeholder}` 標記
3. 業務邏輯區明確標註
4. 不可變部分（import、框架設定）直接寫死

## 6. 與原版的比較

| 項目 | 原版 | Lite 版 |
|------|------|---------|
| Phase 數量 | 4（P0-P3） | 3（P0, P1-lite, P2-lite） |
| Agent 分離 | 強制不同 session | 同一 session 連續執行 |
| 測試 | P1 寫測試、P2 跑測試 | 完全無測試 |
| Hooks | 4 個 | 無 |
| 模板 | 骨架 scaffold | 完整參考實作 |
| 預估時間 | ~112 分鐘 | 目標 < 30 分鐘 |
| 適用場景 | 正式開發 | Demo 展示 |
| 衝突處理 | 提問確認 | 提問確認（相同） |
| Demo 後手改 | N/A | 自然支持（同 session 有脈絡） |

## 7. 實作步驟概覽

1. 從原版 `eap-agentic-coding/` 複製 conventions/ 和 examples/
2. 撰寫精簡版 `SKILL.md`
3. 撰寫 `prompts/phase-0-spec-check.md`（微調原版）
4. 撰寫 `prompts/phase-1-task-breakdown.md`（P1 去測試版）
5. 從 TM002 最終程式碼提取各 template，升級為完整參考實作
6. 整合測試：用 TM002 規格文件跑一次完整 Demo 驗證

## 8. 風險與緩解

| 風險 | 緩解 |
|------|------|
| 模板太長撐爆 context | 每任務只載入 1-2 個模板，非全部 |
| 業務邏輯替換不準確 | 模板中明確標註變化點 + AI 有 unified-spec 參照 |
| 編譯失敗 | 模板基於已驗證的 TM002 程式碼，基礎正確性有保障 |
| 老闆手改時 AI 不理解 | 同一 session 保留完整脈絡，AI 知道程式碼結構 |
| Demo 超時 | P0 衝突數量可控（TM002 已知），P2 模板套用速度快 |
