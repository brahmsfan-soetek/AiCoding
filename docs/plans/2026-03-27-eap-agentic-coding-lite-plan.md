# eap-agentic-coding-lite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立精簡版 `eap-agentic-coding-lite` skill，用於 30 分鐘內 Demo TM002 模組從規格到可運行程式碼的完整流程。

**Architecture:** 3-Phase workflow（P0 規格衝突檢查 → P1-lite 任務拆解 → P2-lite 模板驅動實作），無測試、無 hooks、同一 session 連續執行。模板從「骨架」升級為「含 TM002 完整實作的參考程式碼」。

**Tech Stack:** Claude Code Skill（Markdown）、Quarkus + Vue 3 + MSSQL（目標專案）

**Key Paths:**
- 原版 skill：`C:\Users\a0304\OneDrive\Desktop\AiCoding\eap-agentic-coding\`
- TM002 後端：`C:\Users\a0304\IdeaProjects\eap\backend\tm\src\main\java\org\soetek\eap\tm\`
- TM002 前端：`C:\Users\a0304\IdeaProjects\eap\frontend\src\`
- TM002 規格：`C:\Users\a0304\IdeaProjects\eap\Docs\spec\tm002\`
- 新 skill 目標：`C:\Users\a0304\OneDrive\Desktop\AiCoding\eap-agentic-coding-lite\`

**設計文件：** `docs/plans/2026-03-27-eap-agentic-coding-lite-design.md`

---

## Task 1: Scaffold — 建立目錄結構 + 複製共用檔案

**Files:**
- Create: `eap-agentic-coding-lite/` 完整目錄結構
- Copy from: `eap-agentic-coding/conventions/` (6 files)
- Copy from: `eap-agentic-coding/examples/conflict-list-example.md`
- Copy from: `eap-agentic-coding/references/traceability-appendix.md`

**Step 1: 建立目錄結構**

```bash
cd "C:/Users/a0304/OneDrive/Desktop/AiCoding"
mkdir -p eap-agentic-coding-lite/{prompts,conventions,templates,examples,references,.claude-plugin}
```

**Step 2: 複製 conventions（沿用原版，不改）**

```bash
cp eap-agentic-coding/conventions/*.md eap-agentic-coding-lite/conventions/
```

驗證：`ls eap-agentic-coding-lite/conventions/` 應有 6 個檔案：
- tech-stack.md
- naming-conventions.md
- db-conventions.md
- code-patterns-backend.md
- code-patterns-frontend.md
- data-access.md

**Step 3: 複製 examples 和 references**

```bash
cp eap-agentic-coding/examples/conflict-list-example.md eap-agentic-coding-lite/examples/
cp eap-agentic-coding/references/traceability-appendix.md eap-agentic-coding-lite/references/
```

**Step 4: 建立 plugin.json**

Write `eap-agentic-coding-lite/.claude-plugin/plugin.json`:
```json
{
  "name": "eap-agentic-coding-lite",
  "version": "1.0.0",
  "description": "eap 規格驅動開發 Demo 版：快速從規格產出可運行程式碼（Quarkus + Vue 3 + MSSQL）",
  "author": { "name": "soetek" },
  "skills": ["./"]
}
```

**Step 5: Commit**

```bash
git add eap-agentic-coding-lite/
git commit -m "scaffold: eap-agentic-coding-lite 目錄結構 + 複製 conventions/examples"
```

---

## Task 2: 撰寫 SKILL.md — 主入口

**Files:**
- Create: `eap-agentic-coding-lite/SKILL.md`
- Reference: `eap-agentic-coding/SKILL.md`（原版，403 行）

**Step 1: 閱讀原版 SKILL.md**

讀取 `eap-agentic-coding/SKILL.md` 完整內容，理解結構。

**Step 2: 撰寫精簡版 SKILL.md**

核心結構（目標約 150-200 行，原版的一半以下）：

```markdown
---
name: eap-agentic-coding-lite
description: eap 規格驅動開發 Demo 版 — 快速從規格書+HTML+DDL產出可運行程式碼
---

# eap-agentic-coding-lite

> Demo 專用精簡版。目標 30 分鐘內完成一個模組。

## 適用條件
（同原版：有規格書 + HTML + DDL + 邏輯文件）

## 流程總覽
P0（規格衝突檢查）→ P1-lite（任務拆解）→ P2-lite（模板驅動實作）
同一 session 連續執行，無需切換。

## 專案慣例（按需載入）
（列出 conventions/ 6 個檔案，與原版相同的載入規則）

## 程式碼模板（按需載入）
（列出 templates/ 14 個檔案 + 載入規則）
★ 模板是「完整參考實作」而非骨架，P2 套用時做變數替換 + 業務邏輯微調。

## Phase 0：規格衝突檢查
- 載入 prompts/phase-0-spec-check.md
- 產出 .agentic/{moduleCode}/conflicts.md + unified-spec.md
- 衝突逐一提問確認
- STOP Gate：0 衝突

## Phase 1-lite：任務拆解
- 載入 prompts/phase-1-task-breakdown.md
- 產出 .agentic/{moduleCode}/tasks.md
- 每個任務標記對應 template
- STOP Gate：用戶確認

## Phase 2-lite：模板驅動實作
- 逐任務執行：載入 template → 套用 → Write
- 後端完成 → mvn compile
- 前端完成 → vue-tsc --noEmit
- 全部完成 → 啟動應用驗證

## 編輯規則
- 不寫測試、不跑測試
- 不產出 review_notes.md / test_spec_map.md / sa_pending.md
- 無 hooks

## Gotchas
（精選原版最關鍵的 3-4 項）
```

**關鍵差異 vs 原版**：
- 拔掉 §1-§11 研究引用（Demo 不需要理論背景）
- 拔掉 Agent 分離模型（同一 session）
- 拔掉 hooks 配置段落
- 拔掉 Phase 3 和 Phase logging
- 模板說明改為「完整參考實作」
- 簡化 Gotchas

**Step 3: 驗證 SKILL.md 格式**

確認 frontmatter 有 `name` 和 `description`，Claude Code 能正確載入。

**Step 4: Commit**

```bash
git add eap-agentic-coding-lite/SKILL.md
git commit -m "feat: eap-agentic-coding-lite SKILL.md 主入口"
```

---

## Task 3: 撰寫 phase-0-spec-check.md — 規格衝突檢查

**Files:**
- Create: `eap-agentic-coding-lite/prompts/phase-0-spec-check.md`
- Reference: `eap-agentic-coding/prompts/phase-0-spec-check.md`（原版，144 行）

**Step 1: 閱讀原版 phase-0**

讀取 `eap-agentic-coding/prompts/phase-0-spec-check.md` 完整內容。

**Step 2: 撰寫 lite 版 phase-0**

**基本上沿用原版**，微調：
- 拔掉 `sa_pending.md` 產出（Demo 假設 SA 問題已確認）
- 保留衝突逐一提問確認（不自動解決）
- 保留 Spec ↔ HTML ↔ DDL 交叉比對的 8 個步驟
- 保留 conflicts.md + unified-spec.md 產出
- 保留 STOP Gate
- 精簡 Gotchas（從 13 項縮減到最關鍵的 5-6 項）

**Step 3: Commit**

```bash
git add eap-agentic-coding-lite/prompts/phase-0-spec-check.md
git commit -m "feat: phase-0-spec-check.md 規格衝突檢查（lite 版）"
```

---

## Task 4: 撰寫 phase-1-task-breakdown.md — 任務拆解

**Files:**
- Create: `eap-agentic-coding-lite/prompts/phase-1-task-breakdown.md`
- Reference: `eap-agentic-coding/prompts/phase-1-test-agent.md`（原版，172 行）

**Step 1: 閱讀原版 phase-1**

讀取 `eap-agentic-coding/prompts/phase-1-test-agent.md` 完整內容。

**Step 2: 撰寫 lite 版 phase-1（核心改動）**

**保留**：
- 規格理解：列出所有功能點（顯式 vs 隱含）
- 任務拆解規則：單一職責、< 50 行、列出影響檔案、依賴關係
- 前端強制 7 種拆分（Types / Service / Store / Router / i18n / Page / Dialog）
- Anti-anchoring check（列出 2-3 個潛在問題）

**拔掉**：
- 全部測試撰寫段落
- `test_spec_map.md` 產出
- 測試 fail-first 驗證
- 測試資料庫配置規則
- 「無法測試」標記

**新增**：
- 每個任務必須標記對應的 template 檔名（一或多個）
- 明確標記後端/前端分組

產出格式範例（寫在 prompt 中）：
```markdown
## Task 1: Entity 定義
- **類型**: 後端
- **檔案**: {moduleCode}/domain/{EntityName}Entity.java
- **模板**: backend-entity.md
- **依賴**: 無

## Task 2: Create Processor
- **類型**: 後端
- **檔案**: {moduleCode}/processor/{ModuleCode}CreateProcessor.java
- **模板**: backend-processor-create.md
- **依賴**: Task 1
```

**Step 3: Commit**

```bash
git add eap-agentic-coding-lite/prompts/phase-1-task-breakdown.md
git commit -m "feat: phase-1-task-breakdown.md 任務拆解（lite 版，無測試）"
```

---

## Task 5: 升級後端模板 — 從 TM002 提取完整參考實作

**Files:**
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-entity.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-processor-create.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-processor-update.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-processor-delete.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-processor-query.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-processor-dropdown.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/backend-processor-getbyid.md`
- Read from: TM002 後端原始碼（`C:\Users\a0304\IdeaProjects\eap\backend\tm\src\main\java\org\soetek\eap\tm\`）
- Reference: 原版 templates/（`eap-agentic-coding/templates/backend-*.md`）

**Step 1: 閱讀原版後端模板**

讀取 `eap-agentic-coding/templates/backend-entity.md` 及所有 `backend-processor-*.md`，理解骨架格式。

**Step 2: 閱讀 TM002 後端實作程式碼**

讀取以下檔案：
- `C:\Users\a0304\IdeaProjects\eap\backend\tm\src\main\java\org\soetek\eap\tm\domain\TmEmpVacationEntity.java`
- `C:\Users\a0304\IdeaProjects\eap\backend\tm\src\main\java\org\soetek\eap\tm\processor\Tm002*.java`（所有 6 個 processor）
- `C:\Users\a0304\IdeaProjects\eap\backend\tm\src\main\java\org\soetek\eap\tm\service\Tm002EmpVacationService.java`

**Step 3: 比對原版模板 vs TM002 程式碼，識別模式**

對每個模板：
1. 找出**不可變部分**（import、框架 annotation、固定結構）
2. 找出**模組特有部分**（欄位名、表名、業務邏輯）→ 標記為 `{placeholder}`
3. 找出**業務邏輯變化點** → 加註解說明

**Step 4: 逐一升級 7 個後端模板**

每個模板結構：
```markdown
---
name: backend-xxx
applies_to: "*Xxx.java"
---

## 說明
（一句話描述）

## 替換規則
- `{ModuleCode}` → PascalCase
- `{moduleCode}` → camelCase
- `{tableName}` → DDL 表名
- （其他模板特有的 placeholder）

## 完整參考實作
```java
（TM002 完整程式碼，placeholder 已標記）
```

## 業務邏輯注意點
- （列出需依規格調整的部分）
```

**注意**：
- backend-processor-create.md 需包含 Thick/Thin 兩種變體（原版已有）
- TM002 有 6 個 processor 但模板分類是 7 個（create/update/delete/query/dropdown/getbyid + batch）
- 如果 TM002 的 processor 不完全對應模板分類，以模板分類為主，從 TM002 中提取最接近的

**Step 5: Commit**

```bash
git add eap-agentic-coding-lite/templates/backend-*.md
git commit -m "feat: 後端模板升級為 TM002 完整參考實作（7 個）"
```

---

## Task 6: 升級前端模板 — 從 TM002 提取完整參考實作

**Files:**
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-page.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-dialog.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-service.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-store.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-types.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-router.md`
- Create/Upgrade: `eap-agentic-coding-lite/templates/frontend-i18n.md`
- Read from: TM002 前端原始碼（`C:\Users\a0304\IdeaProjects\eap\frontend\src\`）
- Reference: 原版 templates/（`eap-agentic-coding/templates/frontend-*.md`）

**Step 1: 閱讀原版前端模板**

讀取 `eap-agentic-coding/templates/frontend-*.md`（7 個檔案）。

**Step 2: 閱讀 TM002 前端實作程式碼**

讀取以下檔案：
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\pages\tm\tm002\TM002.vue`
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\pages\tm\tm002\components\Tm002BatchDialog.vue`
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\pages\tm\tm002\components\Tm002CreateDialog.vue`
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\pages\tm\tm002\components\Tm002EditDialog.vue`
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\services\tm\tm002Service.ts`
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\stores\tm\tm002\useTm002Store.ts`
- `C:\Users\a0304\IdeaProjects\eap\frontend\src\types\tm\tm002.ts`

另外找到並讀取：
- TM002 的 router 註冊（在 `routes.ts` 或類似檔案中搜尋 `tm002`）
- TM002 的 i18n JSON（搜尋 `tm002` 相關的 `.json` 檔案）

**Step 3: 比對原版模板 vs TM002 程式碼，識別模式**

（同 Task 5 Step 3 的做法）

**Step 4: 逐一升級 7 個前端模板**

格式同後端模板，但前端特有注意點：
- `frontend-page.md`：含 CRUD + SDialog2 整合，permission-id 標記
- `frontend-dialog.md`：SDialog2 API（@confirm/@cancel），不用手動按鈕
- `frontend-service.md`：API wrapper，Request → Camel route 映射
- `frontend-store.md`：Pinia Setup 或 Object 兩種變體
- `frontend-types.md`：Entity + Request + Response TypeScript 介面
- `frontend-router.md`：route 註冊 + meta.pid 一致性
- `frontend-i18n.md`：JSON 結構 + key 命名規則

**Step 5: Commit**

```bash
git add eap-agentic-coding-lite/templates/frontend-*.md
git commit -m "feat: 前端模板升級為 TM002 完整參考實作（7 個）"
```

---

## Task 7: Dry Run 驗證 — 用 TM002 規格跑一次

**Files:**
- Read: `C:\Users\a0304\IdeaProjects\eap\Docs\spec\tm002\` 下所有規格文件
- Verify: 整個 `eap-agentic-coding-lite/` skill

**Step 1: 驗證 skill 結構完整性**

```bash
find eap-agentic-coding-lite/ -type f | sort
```

預期：
```
eap-agentic-coding-lite/.claude-plugin/plugin.json
eap-agentic-coding-lite/SKILL.md
eap-agentic-coding-lite/conventions/code-patterns-backend.md
eap-agentic-coding-lite/conventions/code-patterns-frontend.md
eap-agentic-coding-lite/conventions/data-access.md
eap-agentic-coding-lite/conventions/db-conventions.md
eap-agentic-coding-lite/conventions/naming-conventions.md
eap-agentic-coding-lite/conventions/tech-stack.md
eap-agentic-coding-lite/examples/conflict-list-example.md
eap-agentic-coding-lite/prompts/phase-0-spec-check.md
eap-agentic-coding-lite/prompts/phase-1-task-breakdown.md
eap-agentic-coding-lite/references/traceability-appendix.md
eap-agentic-coding-lite/templates/backend-entity.md
eap-agentic-coding-lite/templates/backend-processor-create.md
eap-agentic-coding-lite/templates/backend-processor-delete.md
eap-agentic-coding-lite/templates/backend-processor-dropdown.md
eap-agentic-coding-lite/templates/backend-processor-getbyid.md
eap-agentic-coding-lite/templates/backend-processor-query.md
eap-agentic-coding-lite/templates/backend-processor-update.md
eap-agentic-coding-lite/templates/frontend-dialog.md
eap-agentic-coding-lite/templates/frontend-i18n.md
eap-agentic-coding-lite/templates/frontend-page.md
eap-agentic-coding-lite/templates/frontend-router.md
eap-agentic-coding-lite/templates/frontend-service.md
eap-agentic-coding-lite/templates/frontend-store.md
eap-agentic-coding-lite/templates/frontend-types.md
```

**Step 2: 驗證 SKILL.md 中的模板/conventions 路徑引用**

讀取 SKILL.md，確認每個引用的檔案路徑都存在。

**Step 3: 驗證模板中的 placeholder 一致性**

對所有模板 grep `{ModuleCode}` / `{moduleCode}` / `{tableName}` 等 placeholder：
- 每個模板都應有「替換規則」段落
- placeholder 名稱在所有模板中保持一致

**Step 4: 模擬 P2 流程（人工檢查）**

挑一個模板（如 `backend-entity.md`），人工模擬替換流程：
1. 讀取模板中的參考實作
2. 用 TM002 的值替換 placeholder
3. 比對替換結果 vs TM002 實際程式碼
4. 確認兩者一致或差異可接受

**Step 5: Final Commit**

```bash
git add -A
git commit -m "chore: eap-agentic-coding-lite 完成，ready for demo dry-run"
```

---

## 任務依賴圖

```
Task 1 (Scaffold)
  ├── Task 2 (SKILL.md) ─── depends on Task 1
  ├── Task 3 (phase-0) ──── depends on Task 1
  ├── Task 4 (phase-1) ──── depends on Task 1
  ├── Task 5 (後端模板) ─── depends on Task 1
  └── Task 6 (前端模板) ─── depends on Task 1

Task 7 (Dry Run) ────────── depends on Task 2, 3, 4, 5, 6
```

**Task 2-6 可並行執行**（互不依賴，只依賴 Task 1 的目錄結構）。

---

## 估計時間分配

| Task | 估計時間 | 說明 |
|------|---------|------|
| Task 1: Scaffold | 5 min | 純複製 + mkdir |
| Task 2: SKILL.md | 15 min | 從原版精簡，核心設計工作 |
| Task 3: phase-0 | 10 min | 沿用原版微調 |
| Task 4: phase-1 | 15 min | 從原版大幅改寫 |
| Task 5: 後端模板 | 30 min | 讀 TM002 程式碼 + 升級 7 個模板 |
| Task 6: 前端模板 | 30 min | 讀 TM002 程式碼 + 升級 7 個模板 |
| Task 7: Dry Run | 15 min | 結構 + 一致性驗證 |
| **合計** | **~2 小時** | |
