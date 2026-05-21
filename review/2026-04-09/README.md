# 批次 2026-04-09 ~ 2026-05-21

> 本批起點：2026-04-09（Anthropic Insight Report 統計區間起始日）
> 本批終點：2026-05-21（spec-workflow review 完成日）
> 下批起點：2026-05-22（目錄 `review/2026-05-22/` 啟用後接續）

## 本批內容

### 實作（logs/）

3 個專案各 2 份 log（progress + session_log），共 6 份：

| 專案 | 描述 | session 數 |
|---|---|:---:|
| AR002 | 收款處理模組（前端 32 task + 後端 27 task） | 2 sessions 進 SKILL；主輪後 ad hoc 多 session 未紀錄 |
| AR003 | 應收帳款客戶追蹤（含催款 PDF） | 11+ sessions；4 輪 BUG round + SA 11 項需求補充 |
| SO0062 | 銷售群組維護 | 3 sessions（後/前端/data） |

### 外部 Insight（insights/）

`report-2026-05-20-172026.md` — Anthropic Claude Code Insights，分析本批期間 2,586 messages / 146 sessions / 205 commits。

### Review（problems.md + direction.md）

針對 spec-workflow bundle（spec-p1-digest-flow / spec-p2-tasking / spec-p3-backend / spec-p3-frontend / spec-p3-data）做整體 review。

- `problems.md` — 三專案概覽、PG 5 個觀察點、5 個 skill 的洞、Insight 補強的觀察點 6、log 事件附錄
- `direction.md` — 9 個切入點優先順序、本批已實作的 spec-p1 source-mapping 改造（5 個檔案 11 個 Edit）、待動 8 個切入點詳述

## 主要結論

### 已實作（本批）

**spec-p1-digest-flow source-mapping 改造**（5 個檔案）：

| 改造 | 動到 |
|---|---|
| 改 1：規格統計加「規格出處」欄 | `規格統計模板.md` 3 張主表 + `step1_prompt.md` |
| 改 2：釐清清單加「解讀確認」第五類 | `step2_prompt.md` + `釐清清單模板.md` |
| 改 3：S4 章節 coverage 反向 mapping | `step4_prompt.md` + `規格統計模板.md` 文件開頭 |

預期擋下 AR003「規則 A」漏看、SA §10「第 1 名」誤解、AR002 LOV 誤植等。

### 待動（傳給下批）

依槓桿排：

1. API contract 表升級為 spec-p2 一級產出 + spec-p3-backend DESCRIBE 真 DB（切入點 2）
2. 測試策略瘦身：拔 Processor mock test、加跨層 schema 一致性測試（切入點 3）
3. 第一元件 milestone stop + 自訂 CSS regex 守則 + 強制讀 CLAUDE.md（切入點 4）
4. SKILL 結束點明確化 + bug 修復不入 SKILL 規約（切入點 5）
5. MCP MySQL Server：DB-first 驗證內建（切入點 6，與 2 連動）
6. Scope-lock prompt pattern：restate deliverable + out-of-scope（切入點 7）
7. Hooks PostToolUse 自動 typecheck / mvn test（切入點 8，與 3 連動）
8. CLAUDE.md 補 5 條規約（切入點 9）

## 引用清單

| 類型 | 路徑 |
|---|---|
| 實作 log | `logs/{ar002,AR003,so0062}_{progress,session_log}.md` |
| Insight | `insights/report-2026-05-20-172026.md` |
| Review 問題 | `problems.md` |
| Review 方向 | `direction.md` |

## 動到的 skill 檔案（本批 commit 範圍）

```
skills/spec-p1-digest-flow/templates/outputs/規格統計模板.md
skills/spec-p1-digest-flow/templates/outputs/釐清清單模板.md
skills/spec-p1-digest-flow/templates/prompts/step1_規格統計_prompt.md
skills/spec-p1-digest-flow/templates/prompts/step2_釐清清單_prompt.md
skills/spec-p1-digest-flow/templates/prompts/step4_釐清整合_prompt.md
```
