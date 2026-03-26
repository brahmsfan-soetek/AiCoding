---
name: eap-agentic-coding
description: >
  當 eap 專案需要從規格書（DOCX 或 MD+圖片）+ HTML 畫面 + DDL + 邏輯文件進行功能開發時觸發。
  涵蓋規格衝突檢查、test-first 任務拆解、agent 分離實作、交叉驗證。
  不適用於單檔修正、純重構、無規格書的探索式開發。
---

# Agentic Coding — eap 專屬

以 LLM 行為特性實證研究為基礎的 AI 開發流程。所有規則追溯至 11 項量化研究。
專案：eap（Quarkus 3.25.4 + Apache Camel 4.4.0 + Vue 3 + Quasar 2.14.2 + MSSQL）。

**核心原則**：AI 做執行，人做判斷。每次 LLM 處理都是有損轉換 — 結構性防禦優於指令性約束。

## When to Use

**適用**：eap 的規格驅動功能開發（規格書 DOCX 或 MD+圖片 + HTML 畫面 + DDL/CSV + 邏輯文件）
**不適用**：輕量 bug 修正、純重構、無規格書的探索式開發、單檔小改動

---

## 專案規範（按需載入）

eap 的規範拆為獨立檔案，各 Phase 按需載入相關的規範，不一次全載 (§2 + §10)。

| 規範檔案 | 內容 | Phase 載入時機 |
|---------|------|---------------|
| [conventions/tech-stack.md](conventions/tech-stack.md) | 技術棧 + 測試框架 | P1（測試框架）、P2（技術限制） |
| [conventions/naming-conventions.md](conventions/naming-conventions.md) | 命名 + 目錄結構 | P1（檔案規劃）、P2（建檔） |
| [conventions/db-conventions.md](conventions/db-conventions.md) | 資料庫慣例 | P1（測試設計）、P2（Entity） |
| [conventions/code-patterns-backend.md](conventions/code-patterns-backend.md) | 後端代碼模式 + 禁止模式 | P2（後端 Task） |
| [conventions/code-patterns-frontend.md](conventions/code-patterns-frontend.md) | 前端代碼模式 + 禁止模式 | P2（前端 Task）、P3（前端審查） |
| [conventions/data-access.md](conventions/data-access.md) | ORM 策略 + 回應格式 + 共用組件 | P2（實作）、P3（審查） |

> **為什麼拆？** LLM 會複製看到的模式含 bug (§5)。精簡載入減少 60% 錯誤 (§2)。正確範例 + 結構骨架是最有效的引導。

## 代碼模板（按 Task 類型載入）

Phase 2 Code Agent 按 Task 涉及的檔案類型，只載入對應的 1-2 個模板：

| Task 涉及的檔案 | 模板 |
|----------------|------|
| `*Entity.java` | [templates/backend-entity.md](templates/backend-entity.md) |
| `*CreateProcessor.java` | [templates/backend-processor-create.md](templates/backend-processor-create.md)（含 Thick/Thin 兩版） |
| `*UpdateProcessor.java` | [templates/backend-processor-update.md](templates/backend-processor-update.md) |
| `*DeleteProcessor.java` | [templates/backend-processor-delete.md](templates/backend-processor-delete.md) |
| `*QueryProcessor.java` | [templates/backend-processor-query.md](templates/backend-processor-query.md)（PaginationUtil 分頁） |
| 下拉選單需求 | [templates/backend-processor-dropdown.md](templates/backend-processor-dropdown.md)（LOV YAML 優先，特殊場景才寫 Processor） |
| `*GetByIdProcessor.java` | [templates/backend-processor-getbyid.md](templates/backend-processor-getbyid.md) |

| `*Query.vue` / `*Page.vue` | [templates/frontend-page.md](templates/frontend-page.md)（CRUD + Dialog 模式） |
| `*Dialog.vue` | [templates/frontend-dialog.md](templates/frontend-dialog.md)（新增/編輯 Dialog — 使用 SDialog2 `@confirm`/`@cancel` 事件） |
| `*Service.ts` | [templates/frontend-service.md](templates/frontend-service.md)（API 封裝） |
| `*Store.ts` | [templates/frontend-store.md](templates/frontend-store.md)（Setup + Object 兩版） |
| `*Types.ts` | [templates/frontend-types.md](templates/frontend-types.md)（Entity + Request + Response 型別） |
| `routes.ts`（路由註冊） | [templates/frontend-router.md](templates/frontend-router.md)（路由格式 + meta.pid 一致性） |
| `{moduleCode}.json`（i18n keys） | [templates/frontend-i18n.md](templates/frontend-i18n.md)（i18n JSON 結構 + key 命名 + 共用 key） |

**前端整合模板規則**：當任何 `*.vue` 檔案出現在 Task 中，必須同時載入 `frontend-router.md` 和 `frontend-i18n.md` 作為伴隨模板。

**不可一次載入所有模板** (§2 + §10)。

---

## Agent 分離模型（Context 防火牆）

Agent 分離**不是角色扮演分工**（03-P4 已證實「前端/後端工程師」分法不 work），而是 **context 防火牆**——確保：

- 寫代碼的 session 沒有修改測試的權限（§9 結構性防禦）
- 審查代碼的 session 不受生成 session 的錨定效應影響（§8 外部修正率 88% vs 自我 18%）
- 每個 Phase 的 context 不被其他 Phase 的中間產物污染（§2 Context Rot）

```
Phase 0 → 任何 Agent（或人工）     ← 規格衝突檢查
Phase 1 → Test Agent               ← 規格理解 → 任務拆解 → 寫測試
Phase 2 → Code Agent               ← 逐任務實作（測試唯讀）
Phase 3 → Review Agent             ← 交叉驗證
```

### 模型選擇

Phase 0/1/3 一律使用可用的最強模型——這些 Phase 的 context 較長且需要高品質推理，位置偏見差距過大：Opus 76% vs Sonnet 18.5%（MRCR v2 @ 1M）(§3)。

> Phase 2 的個別 Task（每個 <50 行、context 精簡載入）context 遠小於 1M tokens，在短 context 下模型間差距顯著縮小（03-P4：昂貴模型用於規劃/編排，便宜模型用於離散小任務）。若成本是限制因素，Phase 2 是最適合降級的地方。但降級前須確認該模型在目標 context 長度下的檢索準確率足夠。

### 硬性規則

| 規則 | 證據 |
|------|------|
| **Test Agent ≠ Code Agent** | §8：自我修正率 18% vs 外部 88%。同一 Agent 寫的測試會繼承代碼的錯誤 |
| **Code Agent 不可修改測試檔案** | §9：回饋可見性 30.4% vs 0.7% 博弈率（43× 差異）。測試唯讀 = 結構性防禦。**應以 Hook 強制**（見 Hooks 段落） |
| **Review Agent ≠ Code Agent** | §7 附和 95% + §8 盲區 64.5%：審查自己的代碼 = 附和 + 盲區雙重疊加 |

**不可協商。這三條是架構基礎，不是建議。**

---

## Setup（首次使用）

首次啟動時檢查 eap 專案根目錄下是否已有 `.agentic/config.json`。若不存在，詢問使用者以下資訊並建立：

| 資訊 | 說明 | 範例 |
|------|------|------|
| 模組代號 | 決定 package、檔案命名、路由前綴 | `TM003` |
| 模組名稱 | 用於日誌和 API 描述 | `員工年度假別額度維護` |
| 規格書路徑 | SA 文件 DOCX 或 MD（Phase 0 主要輸入） | `specs/TM-員工年度假別額度維護.md` |
| 規格書圖片目錄 | MD 格式時引用的圖片所在目錄（DOCX 不需要） | `specs/images/` |
| HTML 目錄 | 畫面 mockup（可多個 .html） | `specs/html/` |
| DDL 目錄 | 資料表結構 CSV | `specs/ddl_csv/` |
| 邏輯文件目錄 | 業務邏輯補充/覆寫 | `specs/logic_txt_md/` |

確認後存入 `.agentic/config.json`，後續 Phase 直接讀取。Phase 產出物也存放在 `.agentic/` 下：

```
{projectRoot}/
  .agentic/
    config.json          ← Setup 建立
    conflicts.md         ← P0 產出
    sa_pending.md        ← P0 產出
    unified-spec.md      ← P0 產出（統一規格）
    tasks.md             ← P1 產出
    test_spec_map.md     ← P1 產出
    review_notes.md      ← P2 產出
    review_report.md     ← P3 產出
  .gitignore             ← 加入 .agentic/
```

```json
{
  "moduleCode": "TM003",
  "moduleName": "員工年度假別額度維護",
  "specPath": "specs/TM-員工年度假別額度維護.md",
  "specImageDir": "specs/images/",
  "htmlDir": "specs/html/",
  "ddlDir": "specs/ddl_csv/",
  "logicDir": "specs/logic_txt_md/"
}
```

> 若 `.agentic/config.json` 已存在，顯示當前配置供使用者確認後直接進入 Phase 路由。(02-P5)

---

## Phase 日誌

每個 Phase 進場/出場時自動記錄時間戳、token 耗用、費用，產出 `.agentic/phase-log.md`。

### 運作原理

```
statusline.sh ──(每次互動)──→ .agentic/.session-stats  (JSON snapshot)
                                       ↑
phase-logger.sh start Px ──→ 記錄開始時間 + snapshot 基準
phase-logger.sh end   Px ──→ 讀取最新 snapshot，算差值 → 寫入 phase-log.md
```

Token 耗用透過 Claude Code **statusline** 功能自動取得（每次互動後 Claude Code 將 session JSON 推送到 `statusline.sh`，腳本解析後寫入 `.agentic/.session-stats`）。Phase logger 在 `end` 時自動讀取，**不需手動輸入**。

### 前置配置

Phase 0 進場前，確認 statusline 已啟用：

```jsonc
// .claude/settings.local.json
{
  "statusLine": {
    "type": "command",
    "command": "bash .claude/hooks/statusline.sh"
  }
}
```

### 使用方式

每個 Phase prompt 的**第一步**和**最後一步**：

```bash
# Phase 開始（進場）
bash .claude/hooks/phase-logger.sh start P0

# Phase 結束（出場）— token 自動從 .session-stats 讀取
bash .claude/hooks/phase-logger.sh end P0
```

### 產出格式

```markdown
# Phase Log

| Phase | 開始時間 | 結束時間 | 階段耗時 | 累計耗時 | Token (in/out) | 費用 (USD) |
|-------|---------|---------|---------|---------|---------------|-----------|
| P0    | 2026-03-26 10:00 | 2026-03-26 10:15 | 15m 0s | 15m 0s | 12,300 / 5,900 | $0.2500 |
| P1    | 2026-03-26 10:20 | 2026-03-26 10:45 | 25m 0s | 45m 0s | 20,100 / 12,400 | $0.4800 |
```

> 計時器和 snapshot 存於 `.agentic/.timers/`（自動管理）。累計耗時從第一個 Phase 的 start 開始計算。同一 session 跨 Phase 時自動算差值（只記該 Phase 的增量）。

---

## Phase 路由

進入每個 Phase 時，讀取對應的 prompt 檔案。**只載入當前 Phase 的 prompt，不載入其他 Phase。**

### Phase 0｜規格衝突檢查

**Agent**: 任何
**目的**: 交叉比對規格書、HTML 畫面、DDL Schema、邏輯文件，消除矛盾
**輸入**: 規格書(DOCX 或 MD+圖片), HTML 畫面目錄, DDL/CSV 目錄, 邏輯文件目錄
**產出**: `conflicts.md`, `sa_pending.md`, 統一規格
**詳細指令**: 讀取 [prompts/phase-0-spec-check.md](prompts/phase-0-spec-check.md)

### Phase 1｜規格理解 → 任務拆解 → 測試

**Agent**: Test Agent
**目的**: 理解統一規格，拆解為 <50 行的小任務，逐任務寫測試
**輸入**: 統一規格, `conventions/tech-stack.md`, `conventions/naming-conventions.md`, `conventions/db-conventions.md`
**產出**: `tasks.md`, 測試檔案, `test_spec_map.md`
**詳細指令**: 讀取 [prompts/phase-1-test-agent.md](prompts/phase-1-test-agent.md)

### Phase 2｜實作

**Agent**: Code Agent（≠ Test Agent）
**目的**: 按任務清單逐一實作，通過 Phase 1 的測試
**輸入**: 統一規格, `tasks.md`, 測試檔案(**唯讀**), 按需載入 `conventions/` + `templates/`
**產出**: 實作代碼, 測試結果, `review_notes.md`
**詳細指令**: 讀取 [prompts/phase-2-code-agent.md](prompts/phase-2-code-agent.md)

### Phase 3｜交叉驗證

**Agent**: Review Agent（≠ Code Agent）
**目的**: 獨立驗證代碼是否正確實現統一規格
**輸入**: 統一規格, 代碼, 測試, `test_spec_map.md`, `review_notes.md`
**產出**: `review_report.md`
**詳細指令**: 讀取 [prompts/phase-3-review-agent.md](prompts/phase-3-review-agent.md)

---

## 編排規則

### Phase 順序

P0 → P1 → P2 → P3，不可跳過、不可亂序。

### STOP Gate 協議

| 檢查點 | 條件 | 自動/手動 |
|--------|------|-----------|
| P0 出口 | 衝突=0 且 SA待確認=0 | 自動進入 P1（需通知使用者） |
| P0 出口 | 任何 ⏳ 項目 | **STOP** — 不可猜測裁決結果 (§6) |
| P1 → P2 | 任務清單完成 | 軟檢查點：呈現任務清單供使用者確認 |
| P2 → P3 | 全部測試通過 | 自動進入 P3 |
| P3 出口 | review_report.md 完成 | **STOP** — 使用者決定修正範圍 |

### Context 載入紀律

每個 Task 從源頭文件獨立載入，不基於前一個 Task 的 context 接著做 (§1 語義漂移 + §2 Context Rot)。

| 載入 | 不載入 |
|------|--------|
| 統一規格中**該 Task** 的段落 | 整份統一規格 |
| 該 Task 涉及的檔案 | 專案中所有檔案 |
| 該 Task 的測試檔案 | 其他 Task 的測試 |
| 該 Task 需要的 `conventions/` 檔案 | 全部 conventions + templates |

### 失敗升級

```
測試失敗
  ├─ 代碼有 bug → 修正代碼，重跑測試
  ├─ 理解規格有誤 → 回查統一規格，修正理解
  └─ 測試似乎有問題 → 不修改測試，記到 review_notes.md 供 P3 處理
```

---

## Hooks

> **為什麼用 hook 而非 prompt 指令？** SKILL 的核心主張是「結構性防禦優於指令性約束」——§9 數據顯示反作弊指令幾乎無效（o3 被告知不要作弊後仍 14/20 次博弈）。Hook 是確定性控制流 (03-P6)，Agent 無法繞過。

### Statusline：Session Stats 自動擷取

透過 Claude Code 的 statusline 功能，每次互動後自動將 token/費用/時間寫入 `.agentic/.session-stats`，供 `phase-logger.sh` 讀取。

```bash
# .claude/hooks/statusline.sh
# 從 Claude Code 推送的 JSON stdin 解析 session metrics，寫入 .session-stats
```

> **全 Phase 啟用**：statusline 在整個開發流程中持續運作，不限於 Phase 2。

### Hook 1：測試檔案唯讀強制

Phase 2 啟動時註冊 `PreToolUse` hook，結構性阻擋 Code Agent 修改測試檔案：

```bash
# .claude/hooks/block-test-edit.sh
# PreToolUse hook — matcher: Edit|Write
FILE_PATH="${TOOL_INPUT_file_path:-}"
if echo "$FILE_PATH" | grep -qiE '(Test|\.test\.|\.spec\.|_test\.)'; then
  echo "❌ Phase 2 禁止修改測試檔案 — 記到 review_notes.md 供 P3 裁決" >&2
  exit 2
fi
```

### Hook 2：測試輸出靜默（成功靜默，失敗詳述）

Phase 2 的測試執行結果不應全量湧入 context（03-P7：4000 行通過的測試 → agent 幻覺）。

```bash
# .claude/hooks/silent-test-pass.sh
# PostToolUse hook — matcher: Bash
# 檢查 tool output 是否為測試執行結果
OUTPUT="${TOOL_OUTPUT:-}"
if echo "$OUTPUT" | grep -qE '(BUILD SUCCESS|Tests run:.*Failures: 0)'; then
  echo "✅ 全部測試通過" >&2
  exit 2  # exit 2 = 將 stderr 作為替換輸出注入 context
fi
# 失敗時原樣輸出，不截斷
```

> **設計原則**：成功是靜默的（不佔 context），失敗才呈現完整輸出。只執行當前 Task 的測試（不跑全套件），進一步控制 context 膨脹。

### 啟用方式

Statusline 在首次進入 Phase 0 時寫入 `settings.local.json`，整個流程期間持續生效。
Phase 2 的 hooks（測試唯讀 + 靜默通過）在 Phase 2 啟動時加入，Phase 2 結束後移除。

```jsonc
// .claude/settings.local.json
// statusLine: 全 Phase 生效（Phase 0 進場時寫入）
// hooks: Phase 2 啟動時寫入，結束時移除
{
  "statusLine": {
    "type": "command",
    "command": "bash .claude/hooks/statusline.sh"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/block-test-edit.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/silent-test-pass.sh" }
        ]
      }
    ]
  }
}
```

---

## 隔離指令

本 SKILL 的 Phase 1-3 工作流程**覆蓋**以下 skills：

- `superpowers:test-driven-development` — TDD 的 red-green-refactor 與本 SKILL 的 spec-driven test 設計衝突
- `superpowers:subagent-driven-development` — 不同的 agent dispatch 模型
- `superpowers:executing-plans` — 不同的執行模型

**相容**：
- `superpowers:using-git-worktrees` — workspace 隔離互補
- `superpowers:systematic-debugging` — Phase 2 除錯時可用

---

## Gotchas

從實際測試中累積的常見陷阱（持續更新）：

- Phase 0 看起來沒有衝突 ≠ 真的沒有衝突。跑完比對流程才能確認
- 「測試太嚴格」不是修改測試的理由 — 記到 review_notes.md 讓 P3 裁決
- `templates/` 中沒有對應模板不代表可以隨便寫 — 參考 `code-patterns-{backend,frontend}.md`「禁止模式」，風格必須一致
- 不要為「讓代碼更優雅」而偏離模板結構 — 一致性 > 優雅 (§5)
- 「這個 API 應該存在」不等於「這個 API 存在」— 驗證再使用 (§6)
- 「代碼已經寫好了，補寫測試就好」— 不行。代碼先寫 = 測試從代碼推導 (§5)。刪掉代碼，從 Phase 1 Test Agent 開始
- 「我先自己把測試和代碼一起寫比較快」— 快不代表對。自我修正率 18% (§8)。分離 session 才有品質
- 「明天 demo 很急，品質之後再顧」— 急件不改變規格矛盾的事實。demo 猜測的實作比 demo 一份清楚的衝突清單風險更高

---

## Red Flags — 看到這些念頭立刻停下

- 「Phase 0 可以跳過，規格看起來一致」 → 不行。(§4)
- 「我可以同時寫測試和代碼更有效率」 → 不行。(§8)
- 「這個測試寫錯了，我來改」 → 不行。記到 review_notes。(§9)
- 「規格沒寫清楚，我先假設一個合理值」 → 不行。標記待確認。(§6)
- 「前一個 Task 的模式可以直接套用」 → 不行。從源頭重新載入。(§5)
- 「任務太小不值得拆」 → >50 行正確率從 87% 降至 26%。(§11)
- 「審查一下自己的代碼應該 OK」 → 自我修正率 18%。(§8)
- 「代碼已經寫好了，補測試就好」 → 不行。Test Agent 必須獨立、從規格推導。(§5 + §8)
- 「很急，先做再說」 → 急件不跳 Phase。猜測裁決 = 製造更大的返工。(§4 + §6)

---

## 01 特性追溯

完整的 11 項 LLM 特性與 Phase 對應表見 [references/traceability-appendix.md](references/traceability-appendix.md)。
