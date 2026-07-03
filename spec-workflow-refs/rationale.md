# 歷史教訓 ↔ 機制對應（rationale）

> 執行檔（SKILL.md / prompt 模板）只留規則本身；規則「為什麼存在」集中在此，供維護者與想深究的 PG 查。
> **執行 session 不需要讀本檔** —— 案例史不會讓執行模型更守規矩，只會稀釋對指令的注意力（2026-07-03 審視 多-1）。

| 案例 | 一句話 | 對應機制 |
|---|---|---|
| AR003 BUG-A1 | 規格寫 17 欄、DDL 15 欄、真 DB 也缺 2 欄；從 sibling code 推 schema 全錯 | `current_schema` = MCP DESCRIBE 唯一權威；缺檔回 `/tasking`，不 fallback |
| AR003 BUG-P4b-R4-CONTRACT | 4 支 View2 API 欄位與前端不一致 → store 永遠讀 undefined；28 個 mock contract test 全沒擋 | `api_contract` A## 共讀契約 + SG2 對照表；拔 mock-based contract test |
| SO0062 mapper camelCase | fixture 對但真後端已 camelCase；contract test 抓 typo，抓不到跨層漂移 | 同上 |
| AR003 BUG-P4b（processor mock tests） | mock 設成預期再驗自己 = 套套邏輯，token 高 ROI 低 | `[processor]` 無 mock test，走 SG2 對照 |
| GL026 D-01 crossChartWarning | 「跨 CHART_CODE」做成「比公司」——shape 全對、語意全錯；公式在 api_contract 業務說明，task 只有指針 | P2「規則原文」欄（逐字）+ P3 SG2「規則複述」段（W-01/W-02，2026-07-03 缺-1/缺-2） |
| AR002 B03 / AR003 B21 / F11 | 測試該紅而沒紅（實作先寫 / 斷言被改） | Red-Green 強制順序 + git diff 測試檔自檢 + commit-time hook |
| AR003 F20–F27 / AR002 dialog 微調 | 連跑 8 元件一次驗收 → 全部偏；dialog 18+ session 微調 | SG1 前端硬守則清單 + SG3 grep 驗證（只報不擋） |
| Insight 報告（35 wrong_approach + 12 excessive_changes） | AI 自行擴張 scope / 順手重構 | Scope Statement（動手前 lock，超出 STOP） |
| session-791acadc | subagent 寫實作 code，prompt 與模板矛盾全錯（無主 session context、無回饋迴圈） | Subagent 不產出進 git 的檔案（`subagent-boundary.md`） |
| GL010 推 SP | 從 SP code 推 schema 出錯 | 同 AR003 BUG-A1 |
| GL026 W-03 token 實測 | P1 Opus output 503K、65% 純敘述、峰值 context 286K；前段排擠實作 token 池 | P1 step1 子 agent 化 + 輸出紀律（console ≤10 行）+ 步驟間 `/clear`（2026-07-03 缺-3） |
| eap TM002 | 112 分鐘災難，真根因 = P2 整合測試摩擦 | 測試策略瘦身（類型 tag 分流，只留 `[validator]` TDD） |
| eap session-archive（2026-07-03 多-5） | jsonl 歸檔至 `~/.soetek-ai-coding/` 無人消費；實際驅動改進的是手寫回饋檔 | 砍 Session 歸檔步驟；回饋統一記 target repo `.user/SPEC_WORKFLOW_IMPROVEMENTS.md` |

編號對照：`G2-xx` = review/2026-05-29/G2-缺陷與改進清單.md；`切入點 N` = review/2026-04-09/direction.md；`05 D9` 等 = review/2026-05-29 系列；`W-xx` = target repo `.user/SPEC_WORKFLOW_IMPROVEMENTS.md`；`缺-x`/`多-x` = review/2026-07-03/判斷力外部化審視.md。

維護規約：新教訓 → 本表加一列 + 執行檔加**一行規則**；不把案例史寫回執行檔。
