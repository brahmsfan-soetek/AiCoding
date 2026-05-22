# 批次 2026-04-09 ~ 2026-05-22

> 本批起點：2026-04-09（Anthropic Insight Report 統計區間起始日）
> 本批終點：2026-05-22（切入點 6 + 7 完整落地，本批所有切入點收口）
> 下批起點：2026-05-23（目錄 `review/2026-05-23/` 啟用後接續）

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
- `direction.md` — 9 個切入點優先順序、本批已實作 8 項（切入點 1/2/3/4/5/6/7/8）、撤回 1 項（切入點 9）；本批無待動

## 主要結論

### 已實作（本批）

| 切入點 | 內容 | commit |
|:--:|---|---|
| 1 | spec-p1-digest-flow source-mapping + coverage 反向 mapping + 解讀確認類別（5 個檔案 11 個 Edit） | ef69531 |
| 2 | API contract 表升級為 spec-p2 一級產出 + spec-p3-backend 啟動先 DESCRIBE 真 DB（含 MCP MySQL DESCRIBE step、`api_contract.md` 第四份產出、Artifact 合一 commit 規約） | 4079842 |
| 3 | 測試策略瘦身 A 方案：BE 拔 Processor mock test、FE 拔 store-map contract test，SG2 改走「api_contract A## + current_schema」對照規則 | d4ce9c6 |
| 4 | spec-p3-frontend SG1 列前端硬守則清單（target CLAUDE.md + memory，分可 grep / 意圖兩類）+ UI 類 task SG3 自動 grep 守則驗證（只報不擋）；規約內容由 target 提供，SKILL 不預設；動作 2 第一元件 milestone stop 經評估 skip | （本 commit）|
| 5 | SKILL 結束點明確化（完工三條件：task done + 收尾報告 + 維護期 hand-off append）+ bug 修復不入 SKILL 規約 + Session Log 加「維護期 hand-off」段骨架（上線前必補 / 技術債兩類） | 6c4ef8a |
| 6 | MCP MySQL Server 完整落地：spec-p2 MCP DESCRIBE → spec-p3-backend 讀 current_schema → spec-p3-data schema 對齊讀 current_schema + 對帳走 MCP read-only / 寫入走 mysql CLI（A 方案，PG 選擇） | 4079842 + e292b31 |
| 7 | Scope-lock prompt pattern：4 SKILL（spec-p2 步驟 5 末尾 / spec-p3-be SG1 / spec-p3-fe SG1 / spec-p3-data 步驟 4 末尾 SG0）加 Scope Statement step（Deliverable / 預期動到 / out-of-scope 三行 + 規約：實作中超出 scope STOP 回報）；spec-p1 不加（流程固定每階段已內定）；不寫 target CLAUDE.md（對齊切入點 9 撤回原則） | （本 commit）|
| 8 | commit-time hook 自動 typecheck + module test（PreToolUse + Bash matcher + `git commit` filter，spike 3 預設 + spike 1/2 替代骨架）；SKILL SG1 hook 偵測與安裝流程（PG 選擇 → SKILL 寫入 target `.claude/settings.local.json` + 複製 .ps1）；block 後 AI 通知 PG 不自動修 | 59265a3 + 920e3d3 |

預期擋下：AR003「規則 A」漏看、SA §10「第 1 名」誤解、AR002 LOV 誤植、AR003 BUG-A1（schema 漂移）、AR003 BUG-P4b-R4-CONTRACT（4 支 API 跨層欄位不一致）、SO0062 mapper camelCase、Processor mock test 套套邏輯 token 浪費、SKILL 結束模糊導致 progress.md / session_log.md 在維護期持續膨脹（正名「AR002 主輪後 ad hoc 沒紀錄是健康狀態」）、上線前必補的洞 / 技術債散落多個 session 沒收口、AR002 B03 / AR003 B21 / F11 「寫完才跑 typecheck」事件（hook 自動跑 + 失敗 block）、spec-p3-data 對帳 mysql CLI escape 風險、三 SKILL 對 DB schema 認知不一致、AR002Q export feature 加未要求、AR002 dialog width 過度修改、AR003 F20-F27 一次驗收偏移、AR002 / AR003 順手重構相鄰程式碼、Insight 35 wrong_approach + 12 excessive_changes 友擦等。

### 本批收口

本批 9 個切入點全部處理完畢，無待動項：

- **已實作 8 項**：切入點 1 / 2 / 3 / 4（動作 1+3，動作 2 評估 skip）/ 5 / 6 / 7 / 8
- **撤回 1 項**：切入點 9 — CLAUDE.md 屬 target project / 個人工作風格，spec-workflow SKILL 不該管；5 條規約已分別歸併到切入點 2（DB-first，已 cover）/ 切入點 7（Working Style，本批落地）/ target project CLAUDE.md（Financial / i18n）/ 個人工作風格（Git worktree）。詳見 direction.md「撤回：切入點 9」段。

### 下批觀察重點

1. **Insight Report 下批數字**：wrong_approach + excessive_changes 是否從 35+12 下降（切入點 7 效果驗證）
2. **AR003 F20-F27 / dialog 類事件**：是否仍出現連跑後一次驗收偏移（切入點 4 + 7 雙保險效果驗證）
3. **commit-time hook 在 serp / eap 跑後的 cost**：是否在可接受範圍（< 30s incremental，切入點 8 風險點）
4. **MCP 對帳 escape 是否仍頻**：本批切入點 6 改對帳走 MCP，若仍有 escape 場景 → 評估升級為 write-enabled MCP
5. **Scope Statement 是否真的被 PG 看 / AI 真的列**：避免變成「為跑而跑」的儀式步驟

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
skills/spec-p2-tasking/SKILL.md                                       # 切入點 2 / 7（api_contract + MCP DESCRIBE + Scope Statement）
skills/spec-p3-backend/SKILL.md                                       # 切入點 2 / 3 / 5 / 7 / 8
skills/spec-p3-frontend/SKILL.md                                      # 切入點 3 / 4 / 5 / 7 / 8
skills/spec-p3-data/SKILL.md                                          # 切入點 5 / 6 / 7（schema、MCP、Scope Statement SG0）
skills/spec-p3-data/README.md                                         # 切入點 6 / 7（同步）
skills/spec-p2-tasking/README.md                                      # 切入點 7（Scope Statement 同步）
skills/spec-p3-backend/README.md                                      # 切入點 7（Scope Statement 同步）
skills/spec-p3-frontend/README.md                                     # 切入點 7（Scope Statement 同步）
skills/spec-p3-backend/templates/hooks/typecheck-test-on-commit.ps1   # 切入點 8（新建，commit-time hook）
skills/spec-p3-backend/templates/hooks/settings.local.json.tmpl       # 切入點 8（新建，PreToolUse Bash matcher）
skills/spec-p3-backend/templates/hooks/README.md                      # 切入點 8（新建）
skills/spec-p3-frontend/templates/hooks/typecheck-test-on-commit.ps1  # 切入點 8（新建，commit-time hook）
skills/spec-p3-frontend/templates/hooks/settings.local.json.tmpl      # 切入點 8（新建，PreToolUse Bash matcher）
skills/spec-p3-frontend/templates/hooks/README.md                     # 切入點 8（新建）
```
