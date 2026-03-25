---
name: agentic-coding
description: >
  eap 專案的規格驅動開發流程。DOCX + HTML 規格輸入，
  test-first + agent 分離，Phase 0-3 執行。
---

# Agentic Coding — eap 專屬

以 LLM 行為特性實證研究為基礎的 AI 開發流程。所有規則追溯至 11 項量化研究。
專案：<!-- TODO: 填入 EAP 專案名稱與技術棧摘要 -->。

**核心原則**：AI 做執行，人做判斷。每次 LLM 處理都是有損轉換 — 結構性防禦優於指令性約束。

## When to Use

**適用**：eap 的規格驅動功能開發（DOCX + HTML 輸入）
**不適用**：輕量 bug 修正、純重構、無規格書的探索式開發、單檔小改動

---

## 專案規範（按需載入）

eap 的規範拆為獨立檔案，各 Phase 按需載入相關的規範，不一次全載 (§2 + §10)。

| 規範檔案 | 內容 | Phase 載入時機 |
|---------|------|---------------|
| [conventions/tech-stack.md](conventions/tech-stack.md) | 技術棧 + 測試框架 | P1（測試框架）、P2（技術限制） |
| [conventions/naming-conventions.md](conventions/naming-conventions.md) | 命名 + 目錄結構 | P1（檔案規劃）、P2（建檔） |
| [conventions/db-conventions.md](conventions/db-conventions.md) | 資料庫慣例 | P1（測試設計）、P2（Entity） |
| [conventions/code-patterns.md](conventions/code-patterns.md) | 代碼模式 + 禁止模式 | P2（實作） |
| [conventions/data-access.md](conventions/data-access.md) | ORM 策略 + 回應格式 + 共用組件 | P2（實作）、P3（審查） |

> **為什麼拆？** LLM 會複製看到的模式含 bug (§5)。精簡載入減少 60% 錯誤 (§2)。正確範例 + 結構骨架是最有效的引導。

## 代碼模板（按 Task 類型載入）

Phase 2 Code Agent 按 Task 涉及的檔案類型，只載入對應的 1-2 個模板：

| Task 涉及的檔案 | 模板 |
|----------------|------|
| `*Entity.java` | [templates/backend-entity.md](templates/backend-entity.md) |
| `*CreateProcessor.java` | [templates/backend-processor-create.md](templates/backend-processor-create.md) |
| `*UpdateProcessor.java` | [templates/backend-processor-update.md](templates/backend-processor-update.md) |
| `*DeleteProcessor.java` | [templates/backend-processor-delete.md](templates/backend-processor-delete.md) |
| `*QueryProcessor.java` | [templates/backend-processor-query.md](templates/backend-processor-query.md) |
| `*DropdownProcessor.java` | [templates/backend-processor-dropdown.md](templates/backend-processor-dropdown.md) |
| `*GetByIdProcessor.java` | [templates/backend-processor-getbyid.md](templates/backend-processor-getbyid.md) |

<!-- TODO: 前端模板待 EAP 排版風格確定後補充 -->

**不可一次載入所有模板** (§2 + §10)。

---

## Agent 分離模型

```
Phase 0 → 任何 Agent（或人工）     ← 規格衝突檢查
Phase 1 → Test Agent               ← 規格理解 → 任務拆解 → 寫測試
Phase 2 → Code Agent               ← 逐任務實作（測試唯讀）
Phase 3 → Review Agent             ← 交叉驗證
```

### 模型選擇

所有 Phase 一律使用可用的最強模型。位置偏見差距過大 — Opus 76% vs Sonnet 18.5%（MRCR v2 @ 1M）(§3)，弱模型在長 context 下的檢索準確率不足以支撐任何 Phase 的品質要求。

### 硬性規則

| 規則 | 證據 |
|------|------|
| **Test Agent ≠ Code Agent** | §8：自我修正率 18% vs 外部 88%。同一 Agent 寫的測試會繼承代碼的錯誤 |
| **Code Agent 不可修改測試檔案** | §9：回饋可見性 30.4% vs 0.7% 博弈率（43× 差異）。測試唯讀 = 結構性防禦 |
| **Review Agent ≠ Code Agent** | §7 附和 95% + §8 盲區 64.5%：審查自己的代碼 = 附和 + 盲區雙重疊加 |

**不可協商。這三條是架構基礎，不是建議。**

---

## Phase 路由

進入每個 Phase 時，讀取對應的 prompt 檔案。**只載入當前 Phase 的 prompt，不載入其他 Phase。**

### Phase 0｜規格衝突檢查

**Agent**: 任何
**目的**: 消除 DOCX ↔ HTML 矛盾，在 AI 開始任何開發前
**輸入**: DOCX, HTML
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
- code_templates 不存在不代表可以隨便寫 — 參考 code_patterns，風格必須一致
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
