# spec-workflow Review — 方向紀錄

> 日期：2026-05-21
> 配套：`REVIEW_spec_workflow_problems.md`（問題與根因）
> 目的：把優化方向、優先順序、已實作改造與未來待辦集中一處

## 切入點優先順序（依槓桿排）

| # | 切入點 | 影響的 skill | 槓桿來源 | 狀態 |
|:--:|---|---|---|:--:|
| 1 | 規格統計 source-mapping + coverage 反向檢查 + 解讀確認類別 | spec-p1-digest-flow | 規格統計是整條流程的上游，這裡擋住等於擋下游所有錯 | ✅ **本輪已實作** |
| 2 | API contract 表升級為 spec-p2 一級產出 + spec-p3-backend 啟動先 DESCRIBE 真 DB | spec-p2 / spec-p3-backend | 直擊 AR003 BUG-A1 / R4-CONTRACT 兩個跨層 schema 漂移 | ⏳ 待動 |
| 3 | 測試策略瘦身（拔 Processor mock test）+ 加跨層 schema 一致性測試 | spec-p3-backend / spec-p3-frontend | 直接影響 token 成本與實作速度；改變 SG2 的擴張規則 | ⏳ 待動 |
| 4 | 第一元件 milestone stop + 自訂 CSS regex 守則 + 強制讀 CLAUDE.md 對照 | spec-p3-frontend | UI 微調量減少；CLAUDE.md 規範守住 | ⏳ 待動 |
| 5 | SKILL 結束點明確化 + bug 修復不入 SKILL 規約 | spec-p3-* 全體 | 解釋 AR002 ad hoc 階段為何不入 SKILL | ⏳ 待動 |
| 6 | MCP MySQL Server：DB-first 驗證內建 | 全 skill（特別 spec-p3-backend / spec-p3-data）| 根除「Claude 從 sibling code 推 schema」這類型錯誤；也是切入點 2「DESCRIBE 真 DB」的實作方式 | ⏳ 待動 |
| 7 | Scope-lock prompt pattern：restate deliverable + out-of-scope 後才動手 | 全 skill 開頭 + ad hoc 請求 | 直擊 Insight 報告的 35 wrong_approach + 12 excessive_changes 友擦 | ⏳ 待動 |
| 8 | Hooks（PostToolUse）自動 typecheck / mvn test | settings.json 層級 | 自動化測試執行；連動切入點 3 測試策略瘦身 + TDD Red-first 紀律外部化 | ⏳ 待動 |
| 9 | CLAUDE.md 補 5 條規約（DB-first / 不擴張 scope / 金融約定 / git worktree / i18n namespace）| 專案 CLAUDE.md | 落地 Insight 建議的 5 條 CLAUDE.md additions | ⏳ 待動 |

---

## 已實作：spec-p1 source-mapping 改造（2026-05-21）

### 改造方案

| 改 | 目的 | 動到的檔案 |
|:--:|---|---|
| 改 1：加「規格出處」欄 | 規格爭執時能逆查原文，「⚠️ 推斷」標籤迫使誤植浮出 | `規格統計模板.md`（3 張主表）+ `step1_prompt.md`（輸出要求 + 自檢）|
| 改 2：釐清清單加「解讀確認」第五類 | 把靜默誤解轉成明示主動發問（規格原文 / 我的解讀 / 替代解讀 / 影響） | `step2_prompt.md`（聚焦面向 + 加類）+ `釐清清單模板.md`（第五大節骨架）|
| 改 3：S4 加「章節 ↔ 統計 coverage 反向 mapping」 | 漏看型錯誤在發 SA 前抓出；最終版開頭顯示對照表 | `step4_prompt.md`（二次審查加第 5 類 + 指令 3 加 coverage 表 + 自檢加第 7 條）+ `規格統計模板.md`（文件開頭加 coverage 表段落）|

### 影響檔案清單

| 檔案 | 改動類型 |
|---|---|
| `skills/spec-p1-digest-flow/templates/outputs/規格統計模板.md` | 開頭加 coverage 表段落；表頭 / 表身 / 核心業務邏輯欄位對照 3 表加「規格出處」欄 |
| `skills/spec-p1-digest-flow/templates/outputs/釐清清單模板.md` | 加第五大節「解讀確認」骨架（含規格原文 / 出處 / 我的解讀 / 替代解讀 / 影響） |
| `skills/spec-p1-digest-flow/templates/prompts/step1_規格統計_prompt.md` | 輸出要求加第 7 條（強制填規格出處）；自檢加第 4 條 |
| `skills/spec-p1-digest-flow/templates/prompts/step2_釐清清單_prompt.md` | 聚焦面向加「五、解讀確認」類別 |
| `skills/spec-p1-digest-flow/templates/prompts/step4_釐清整合_prompt.md` | 二次審查加第 5 類「章節未覆蓋」；指令 3 加 coverage 表填寫要求；自檢加第 7 條 |

### 預期擋下的事件（基於 log 反推）

| 事件 | 改 1 | 改 2 | 改 3 |
|---|:---:|:---:|:---:|
| AR003 規則 A 漏看（→ N01-N09 11 項補丁）| — | — | ✓ |
| AR003 SA §10「第 1 名」誤解（CREATE_DT vs CREATOR）| — | ✓ | — |
| AR002 早期「員工 LOV」誤植 | ✓ | ✓ | — |
| AR003 F01「爭議原因下拉」殘留到後期才拔 | ✓ | — | — |
| 規格 / 統計後續爭執時無法逆查原文 | ✓ | — | — |

### 後續驗證建議

1. 拿一份既有規格（如 AR003 規則 A 那段）跑一次新版 S1+S2，看 AI 會不會抗拒填「規格出處」欄
2. 跑一次 S4，看「章節 ↔ 統計對照表」是否真的能抓到漏看的章節
3. 若驗證通過 → commit；若 AI 抗拒填 source map → 強化 prompt（如改成「不填者不予產出最終版」這種硬性條款）

### Commit 建議

```
refactor(spec-p1): add source-mapping + coverage-check + 解讀確認 class

- 規格統計模板：開頭加 coverage 表段落；3 張主表（表頭/表身/核心業務邏輯欄位對照）加「規格出處」欄
- 釐清清單模板：加第五大節「解讀確認」骨架（規格原文/出處/我的解讀/替代解讀/影響）
- step1 prompt：輸出要求加強制填規格出處；自檢加驗證項
- step2 prompt：聚焦面向加「五、解讀確認」主動發問類別
- step4 prompt：二次審查加「章節未覆蓋」第 5 類；指令 3 加 coverage 表填寫；自檢加驗證項

基於 AR003 「規則 A」漏看（N01-N09 11 項補丁）+ SA §10「第 1 名」誤解 + AR002 LOV 誤植等 log 事件
```

---

## 待動：切入點 2 — API contract 表 + DESCRIBE 真 DB

### 設計概念

**spec-p2 加第四份產出**：

```
{程式編號}_api_contract.md
```

每支 API 一張：
- routeId
- HTTP method / path
- Request shape（payload 欄位 × 型別 × 必填）
- Response shape（成功 data 結構 × 型別）
- 對應的 i18n key list（錯誤碼 → i18n key）

FE / BE task 開寫前都讀這份，作為跨層共讀來源。

**spec-p3-backend 啟動加步驟**：

- SG1 之前：列出此程式涉及的表，PG 確認後 AI 對每張表跑 `DESCRIBE {table_name}`（PG 授權一次）
- 落地成 `Docs/spec/{程式編號}/log/current_schema_{程式編號}.md`
- 後續所有 Entity / SQL / DDL 檢核以此檔為準，不再以 `Docs/DDL/*.sql` 為來源

### 預期擋下

- AR003 BUG-A1（schema 漂移 17 欄 vs DDL 15 欄）
- AR003 BUG-P4b-R4-CONTRACT（4 支 API 欄位與前端型別不一致）
- SO0062 mapper 寫完才發現後端 camelCase

### 風險

- DESCRIBE 需要 dev DB 可連，PG 啟動維護成本不高但要明示
- API contract 表是新概念，PG 要不要兩邊讀同一份還是各自寫待確認

---

## 待動：切入點 3 — 測試策略瘦身

### 三選一（建議 B 折衷）

| 方案 | 內容 | 適用情境 |
|:--:|---|---|
| A 激進 | P3 完全不寫 mock-based Processor 測試；只寫純函式邊界 + 跨層 schema 一致性；Processor 整合靠 P4 E2E | 願意賭 P4 E2E 完整度的團隊 |
| **B 折衷（推薦）** | 保留純函式 SG2；保留 Mapper contract test；**拔掉 Processor mock-based 單元測試**；強制產出「跨層 schema 一致性測試」作為新類別 | 平衡 ROI 與安全網 |
| C 保守 | 保留現狀，但把 SG2 預設條目從「所有測試」降為「**僅對純函式 / validator**」，Processor 類預設不出 SG2 案例 | 不想動既有產出但承認 token 成本 |

### 新測試類別「跨層 schema 一致性」

對應 AR003 BUG-A1 後補的測試類型：

- `ArRecordsDdlConsistencyTest`：驗 DDL 檔含預期欄位 / Entity `@Column.name` 都能在 DDL 找到
- `arNamespaceParity.test.ts`：驗 zh-TW / en-US namespace 對稱
- `ar003TemplateKeyCoverage.test.ts`：驗 AR003 元件所有 `$t(...)` key 在兩邊 JSON 都能解析

這類測試「治本」，目前 SKILL 沒系統性產出，但 AR003 補完後是 P4b 修復的關鍵防線。

### memory 連動

PG 已記 `feedback_integration_test_tool.md`（PG 對 Testcontainers 的傾向）；本方向可順手把 Processor 整合測試挪到 P3.5 / P4 走 Testcontainers，與 mock-based 切割。

---

## 待動：切入點 4 — UI 微調 / CLAUDE.md 守則

### 三個動作

1. **強制讀 CLAUDE.md 並對照記憶列出守則清單**：spec-p3-frontend 開頭強制讀 `frontend/CLAUDE.md` + 引用 `feedback_frontend_style.md` 把規範列成本次 session 的硬守則
2. **第一個元件 demo stop**：第一個元件（建議 SearchComponent / 主入口頁）做完後**強制停下來給 PG 看樣**，過了才連跑其餘
3. **自訂 CSS regex 守則檢查**：grep `<style>` 區塊內非 quasar utility class 的自訂 CSS、grep `style=` inline style，找到 → 警示

### 預期效果

- UI 微調量大幅降低
- 違反 `feedback_frontend_style.md`（零自訂 CSS）會在第一個元件就被攔下，不會擴散到 27 個

---

## 待動：切入點 5 — SKILL 結束點 / bug 修復 hand-off

### 三個原則

1. **SKILL 結束 = P3 全部 task done + 收尾報告**：SKILL 不負責「實際跑得起來」「整合手測沒 bug」
2. **整合手測發現的 bug → ad hoc 派 AI 修，不入 SKILL**：避免後續 bug 修復膨脹 progress.md / session_log.md
3. **每個 spec-p3-* SKILL 結束時產「維護期 hand-off」段**：明示哪些洞是「上線前必補」（如 AR003 B52 JasperReports 模板留空殼）、哪些是技術債（如 AR002 `SLov` emit 限制）

### 對應 AR002 觀察

PG 講「AR002 主輪後就 ad hoc 沒紀錄」實際上是健康狀態：SKILL 該結束就結束，後面是維護期。這個原則寫進 skill 後反而能正名「為什麼 AR002 沒看到 P4b bug round」— 它就不該有。

---

## 變更回流 mini-loop（與切入點 1 連動的待補）

### 觸發情境

AR003 N01-N09 / SO0062 員工 LOV 撤回這類「最終版定稿後 SA 補新需求」事件。目前流程是直接重跑 S1-S4 整份，或更糟糕的，直接撞進 P3。

### 設計概念

`spec-p1-digest-flow` 加 S5（暫名）：

- 輸入：原最終版規格統計 + SA 補的新需求文件
- 流程：mini-S1（只統計新需求）→ mini-S2（只列新需求衍生的釐清）→ PG / SA 回覆 → mini-S4（合併進原最終版）
- 輸出：新最終版 + 變更摘要表（哪些統計項被翻轉、哪些被新增、哪些測試 / 任務需重做）

### 預期效果

- AR003 N01-N09 11 項變更，會經過結構化盤點而非 11 個分散修
- 變更摘要表直接帶到 P3，明示哪些 task 需重做

---

## 跨 skill 共通的小改進（低槓桿但便宜）

1. **TDD Red-first 紀律外部化**：spec-p3-backend 的 SG2 後加一個「跑測試確認 Red」的 gate，AI 不跑就不能進實作。對應 AR002 B03、AR003 B21、F11 都出現的「寫完才跑」事件
2. **既有殘留 / 對帳 query 規約**：spec-p3-data 對帳 query 必須帶 spec 的完整過濾條件（如 `SALE_DIVISION='00'`），不只靠 CREATOR 特徵碼。對應 SO0062 G01-G03 殘留差點誤判
3. **session_log 即時 append 紀律**：AR003 Session 3 沒即時 append session_log，後續要靠 git log + progress 補。SKILL 收工 gate 加一條「session_log 已 append」

---

## 待動：切入點 6 — MCP MySQL Server（DB-first 驗證內建）

### 設計概念

裝 `@modelcontextprotocol/server-mysql`，讓 Claude 能直接查 DB schema / SP definition / table data，不再走 Bash → mysql CLI → 文字 parsing 路線。

```bash
claude mcp add mysql -- npx -y @modelcontextprotocol/server-mysql --host localhost --user dev --database SERP
```

### 與切入點 2 的關係

切入點 2 的「DESCRIBE 真 DB」原本要靠 Bash mysql 指令，現在改走 MCP：

- spec-p3-backend SG1 之前：AI 直接透過 MCP 對相關表跑 metadata 查詢
- spec-p3-data：DB schema 驗證走 MCP，不靠 PowerShell + mysql CLI 的 escape 風險

### 預期擋下

- AR003 BUG-A1（schema 漂移）
- IM004 系列 Claude 從 GL010 推 SP signature 的事件
- SO0062 mapper 寫完才發現後端 camelCase（FE 端 MCP 同樣可查 backend processor schema 對齊）

### 風險 / 注意

- MCP 連線到 dev DB 需要 PG 預先配置帳密
- production DB 絕對不能掛 MCP（避免 AI 不小心動）
- 對 read-only user 也應建一份僅可 DESCRIBE / SELECT 的權限

---

## 待動：切入點 7 — Scope-lock prompt pattern（普適）

### 設計概念

在每個 SKILL 開頭、ad hoc 請求進場前，強制 AI 走 3 步：

1. **restate** 一句話的 deliverable
2. **list** 預期會動到的檔案 / 模組
3. **list** out-of-scope items（明示「不會動」）

PG 確認後才開始實作。

### 三類落點

| 落點 | 怎麼套 |
|---|---|
| SKILL 流程 | spec-p2 / spec-p3-* 的 SG1 之前加「scope statement」step；目前 SG1 是「報告載入清單 + task 分佈」，可一併涵蓋 |
| Ad hoc 請求 | 寫進專案 CLAUDE.md：「For non-trivial requests, restate deliverable + out-of-scope items before touching files」 |
| Bug 修復 | 明示「只修 BUG-X 描述的根因，不擴展到相鄰重構」 |

### Insight 提供的 prompt 範本

```
Before making any changes, restate: 
(1) the exact deliverable in one sentence,
(2) the files you expect to touch,
(3) what is explicitly OUT of scope. 
Wait for my confirmation.
```

### 預期擋下

- AR002Q spec 被加未要求的 export feature
- dialog width 過度修改
- AR002 / AR003 「順手重構」相鄰程式碼
- 35 wrong_approach + 12 excessive_changes 友擦的大部分

---

## 待動：切入點 8 — Hooks PostToolUse 自動 typecheck / test

### 設計概念

`.claude/settings.json` 加 PostToolUse hook，Edit / Write 後自動跑對應檢查：

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "if echo \"$CLAUDE_FILE_PATH\" | grep -qE '\\.(ts|vue)$'; then npm run -s typecheck; elif echo \"$CLAUDE_FILE_PATH\" | grep -qE '\\.java$'; then mvn -pl <module> test -o -q; fi"
      }]
    }]
  }
}
```

### 與切入點 3 的關係

切入點 3「測試策略瘦身」拔掉 Processor mock test，但仍保留純函式邊界 + 跨層 schema 一致性測試。Hook 確保每次 Edit 後自動跑這些測試 — TDD Red-first 紀律不靠 AI 自我約束。

### 預期擋下

- AR002 B03、AR003 B21、F11 「寫完才跑」事件
- AR003 BUG-A1 schema 漂移（若 DDL 一致性測試已就位，每次 Entity 改動會自動失敗）
- typecheck baseline regression（前後端皆有 baseline 概念但靠人記得跑）

### 風險

- 每次 Edit 自動跑 mvn test 可能變慢 → 用 `-pl <module>` 限定範圍 + offline 模式
- typecheck 大量 baseline 既有錯時要過濾，否則 hook 一直紅

---

## 待動：切入點 9 — CLAUDE.md 補 5 條規約

### 來源

Insight Report 「Suggested CLAUDE.md Additions」5 條，直接落地：

1. **Database Investigation**：查 SP / schema / DB 行為時，直接查 DB DDL/definition，不要從 sibling Java/SP code 推
2. **Working Style**：narrowly scoped；不擴張到相鄰重構、不加未請求的 feature、不寫廣泛實作計劃；擴張前先問
3. **AR002 / Financial Conventions**：currency precision 由 currency code 決定（不靠 decimals prop）；historical base-amount 不能用 current FX rate 重算；credit note 符號 convention 先驗
4. **Git Workflow**：worktree 時確認寫入目標路徑；git amend/rebase 前確認 target commit
5. **Frontend / i18n**：i18n 新增字串加進既有 default `cv.json`，不創新 prefix namespace（除非明示）

### 落地方式

每條都是 1-2 句話的「行為規約」，加進 `CLAUDE.md` 對應章節（DB / Working Style / AR2 / Git / Frontend）；若該章節不存在就建立。

### 預期效果

- 規約直接擋下 Insight 報告中的具體 friction 案例
- AR002 跨 session 重複糾正（decimals split / base-amount / ANCV sign）一次性收斂
- Git worktree path / amend 失誤類事件減少
- i18n namespace 暴增的問題收斂

---

## 還在外面、本輪不動

- `eap-agentic-coding` / `eap-agentic-coding-lite` / `serp-agentic-coding`：獨立 plugin，是不同流程的 wrapper，與 spec-workflow bundle 並列。本輪 review 暫不深入
- `session-analyzer`：純分析工具，不涉及流程設計
- spec-workflow bundle 內的 prompt template 細節（如「LOV 標準結構範本」是否要加 source）— PG 選只動 3 張主表，其餘暫不動
