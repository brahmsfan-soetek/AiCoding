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
- `direction.md` — 9 個切入點優先順序、本批已實作的 3 項（spec-p1 source-mapping / 切入點 2 API contract + current_schema / 切入點 3 測試策略瘦身 A 方案）、切入點 6 半實作、其餘 5 個切入點待動

## 主要結論

### 已實作（本批）

| 切入點 | 內容 | commit |
|:--:|---|---|
| 1 | spec-p1-digest-flow source-mapping + coverage 反向 mapping + 解讀確認類別（5 個檔案 11 個 Edit） | ef69531 |
| 2 | API contract 表升級為 spec-p2 一級產出 + spec-p3-backend 啟動先 DESCRIBE 真 DB（含 MCP MySQL DESCRIBE step、`api_contract.md` 第四份產出、Artifact 合一 commit 規約） | 4079842 |
| 3 | 測試策略瘦身 A 方案：BE 拔 Processor mock test、FE 拔 store-map contract test，SG2 改走「api_contract A## + current_schema」對照規則 | d4ce9c6 |
| 5 | SKILL 結束點明確化（完工三條件：task done + 收尾報告 + 維護期 hand-off append）+ bug 修復不入 SKILL 規約 + Session Log 加「維護期 hand-off」段骨架（上線前必補 / 技術債兩類） | （本 commit）|
| 6（半）| MCP MySQL Server DB-first 驗證已在 spec-p2 落地；spec-p3-data 改用 MCP 待動 | 4079842 |

預期擋下：AR003「規則 A」漏看、SA §10「第 1 名」誤解、AR002 LOV 誤植、AR003 BUG-A1（schema 漂移）、AR003 BUG-P4b-R4-CONTRACT（4 支 API 跨層欄位不一致）、SO0062 mapper camelCase、Processor mock test 套套邏輯 token 浪費、SKILL 結束模糊導致 progress.md / session_log.md 在維護期持續膨脹（正名「AR002 主輪後 ad hoc 沒紀錄是健康狀態」）、上線前必補的洞 / 技術債散落多個 session 沒收口等。

### 待動（傳給下批）

依槓桿排：

1. 第一元件 milestone stop + 自訂 CSS regex 守則 + 強制讀 CLAUDE.md（切入點 4）
2. MCP MySQL Server：spec-p3-data 改用 MCP（切入點 6 剩餘半）
3. Scope-lock prompt pattern：restate deliverable + out-of-scope（切入點 7）
4. Hooks PostToolUse 自動 typecheck / grep（切入點 8，與 3 連動把 SG2 對照規則部分自動化）
5. CLAUDE.md 補 5 條規約（切入點 9）

## 引用清單

| 類型 | 路徑 |
|---|---|
| 實作 log | `logs/{ar002,AR003,so0062}_{progress,session_log}.md` |
| Insight | `insights/report-2026-05-20-172026.md` |
| Review 問題 | `problems.md` |
| Review 方向 | `direction.md` |

## 動到的 skill 檔案（本批 commit 範圍）

```
skills/spec-p1-digest-flow/templates/outputs/規格統計模板.md        # 切入點 1
skills/spec-p1-digest-flow/templates/outputs/釐清清單模板.md        # 切入點 1
skills/spec-p1-digest-flow/templates/prompts/step1_規格統計_prompt.md  # 切入點 1
skills/spec-p1-digest-flow/templates/prompts/step2_釐清清單_prompt.md  # 切入點 1
skills/spec-p1-digest-flow/templates/prompts/step4_釐清整合_prompt.md  # 切入點 1
skills/spec-p2-tasking/SKILL.md                                       # 切入點 2（api_contract + MCP DESCRIBE）
skills/spec-p3-backend/SKILL.md                                       # 切入點 2 / 3 / 5
skills/spec-p3-frontend/SKILL.md                                      # 切入點 3 / 5
skills/spec-p3-data/SKILL.md                                          # 切入點 5
```
