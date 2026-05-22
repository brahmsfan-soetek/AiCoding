# spec-workflow Review — 方向紀錄

> 日期：2026-05-21
> 配套：`REVIEW_spec_workflow_problems.md`（問題與根因）
> 目的：把優化方向、優先順序、已實作改造與未來待辦集中一處

## 切入點優先順序（依槓桿排）

| # | 切入點 | 影響的 skill | 槓桿來源 | 狀態 |
|:--:|---|---|---|:--:|
| 1 | 規格統計 source-mapping + coverage 反向檢查 + 解讀確認類別 | spec-p1-digest-flow | 規格統計是整條流程的上游，這裡擋住等於擋下游所有錯 | ✅ **本輪已實作** |
| 2 | API contract 表升級為 spec-p2 一級產出 + spec-p3-backend 啟動先 DESCRIBE 真 DB | spec-p2 / spec-p3-backend | 直擊 AR003 BUG-A1 / R4-CONTRACT 兩個跨層 schema 漂移 | ✅ **已實作**（commit 4079842）|
| 3 | 測試策略瘦身（拔 Processor mock test）+ 跨層 schema 對照規則 | spec-p3-backend / spec-p3-frontend | 直接影響 token 成本與實作速度；改變 SG2 的擴張規則 | ✅ **本輪已實作** |
| 4 | SG1 列前端硬守則清單（target CLAUDE.md + memory）+ UI 類 task SG3 自動 grep 守則驗證 | spec-p3-frontend | UI 微調量減少；CLAUDE.md 規範守住 | ✅ **本輪已實作**（動作 1+3；動作 2 第一元件 milestone stop 經評估 skip）|
| 5 | SKILL 結束點明確化 + bug 修復不入 SKILL 規約 | spec-p3-* 全體 | 解釋 AR002 ad hoc 階段為何不入 SKILL | ✅ **本輪已實作** |
| 6 | MCP MySQL Server：DB-first 驗證內建 | 全 skill（特別 spec-p3-backend / spec-p3-data）| 根除「Claude 從 sibling code 推 schema」這類型錯誤；也是切入點 2「DESCRIBE 真 DB」的實作方式 | ✅ **本輪已完整落地**（spec-p2 MCP DESCRIBE → spec-p3-backend 讀 current_schema → spec-p3-data schema 對齊讀 current_schema + 對帳走 MCP read-only / 寫入走 mysql CLI）|
| 7 | Scope-lock prompt pattern：restate deliverable + out-of-scope 後才動手 | 全 skill 開頭 + ad hoc 請求 | 直擊 Insight 報告的 35 wrong_approach + 12 excessive_changes 友擦 | ⏳ 待動 |
| 8 | commit-time hook（PreToolUse + Bash + `git commit` filter）自動 typecheck + module test | settings.json 層級 | 自動化測試執行；連動切入點 3 測試策略瘦身 + TDD Red-first 紀律外部化 | ✅ **本輪已實作**（spike 3：typecheck + module test on commit；spike 1/2 替代設計骨架）|
| 9 | CLAUDE.md 補 5 條規約（DB-first / 不擴張 scope / 金融約定 / git worktree / i18n namespace）| 專案 CLAUDE.md | 落地 Insight 建議的 5 條 CLAUDE.md additions | 🚫 **撤回**（重新歸類；CLAUDE.md 屬 target project，spec-workflow SKILL 不該管）|

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

## 已實作：切入點 3 — 測試策略瘦身 A 方案 + SG2 對照規則（2026-05-21）

### 方案決定（從 A/B/C 三方案選 A 激進）

| 方案 | 內容 | 結果 |
|:--:|---|:--:|
| A 激進 | BE 完全拔 Processor mock test、FE 拔 store-map mapper contract test；新增「跨層 schema 對照規則」（不寫 JUnit/Vitest） | **本輪採用** |
| B 折衷（原 review 推薦） | 同 A 拔 BE Processor mock test，但 FE Mapper contract test 保留 | — |
| C 保守 | 保留 SG2 規則，僅縮限預設條目 | — |

選 A 的理由：

- 切入點 2 已落地 `api_contract.md` 共讀契約 + spec-p3-frontend SG2「assertion 對齊 api_contract A##」規則，FE Mapper contract test 邊際價值已被吸收
- Mock test 抓 typo OK，但 AR003 BUG-P4b-R4-CONTRACT + SO0062 mapper camelCase 兩個案例都是 fixture 對但實際 API 已 rename / camelCase 不一致的跨層漂移，contract test 沒擋下
- Mock-based Processor test 是「mock 設成預期再驗自己」的套套邏輯，token 高 ROI 低（problems.md §5 估 AR003 117/324/134 個 mock 測試攔到 bug 比例不到三成）

### 跨層 schema 對照的形式

選「**SG2 對照規則**」（不寫 JUnit / Vitest 測試）。理由：切入點 2 已落地 `current_schema_{程式編號}.md`，SG2 階段直接由 PG 審「對照表」即可，比寫測試輕量；CI 端的自動化（commit-time hook 跑 typecheck + module test）留給切入點 8 落地。

### 改造方案

| 改 | 目的 | 動到的檔案 |
|:--:|---|---|
| 改 1：spec-p3-backend `[processor]` 走雙對照、無單元測試 | 拔 mock-based Processor test 的套套邏輯成本；SG2 改為「`api_contract A##` ↔ response shape」+「`current_schema` ↔ SQL/Entity 欄位」雙對照表審 | `spec-p3-backend/SKILL.md` |
| 改 2：spec-p3-frontend `[service]` / `[store-map]` 走 api_contract 對照、無契約測試 | 拔 mock-based contract test 的 fixture 漂移風險；SG2 改為「實作意圖 ↔ api_contract A##」對照表審 | `spec-p3-frontend/SKILL.md` |

### 影響檔案清單

| 檔案 | 改動類型 |
|---|---|
| `skills/spec-p3-backend/SKILL.md` | frontmatter description、定位段、類型 tag 表（`[processor]` 從「TDD + 強制 null/""/空白」改「無 mock test + 雙對照」）、Execution Flow box、詳細步驟 6.b（拆 `[validator]` / `[processor]` / `[sql,entity,spi]` 三分支）、SG2 stop gate 表、關鍵防護機制、核心原則 |
| `skills/spec-p3-frontend/SKILL.md` | frontmatter description、定位段、類型 tag 表、段落「為什麼只測契約層」改寫為「為什麼只做契約對照」、設計原則 1、Execution Flow box、詳細步驟 6.b、SG2 stop gate 表、關鍵防護機制、核心原則 |

### 預期擋下的事件（基於 log 反推）

| 事件 | 改 1 (BE) | 改 2 (FE) |
|---|:---:|:---:|
| AR003 BUG-P4b-R4-CONTRACT（4 支 View2 API 欄位與前端型別不一致）| ✓ | ✓ |
| AR003 BUG-A1（schema 漂移 17 欄 vs DDL 15 欄）| ✓ | — |
| SO0062 mapper camelCase 寫完 28 個 contract test 才發現 | — | ✓ |
| Processor mock test 的 token 成本（AR003 117/324/134 個套套邏輯）| ✓ | ✓ |

### 整合測試工具（未來再評）

Processor 整合測試走什麼工具（Testcontainers / 直連 dev DB / 其他）目前未定，本方向不寫死；切入點 3 落地後若 SG2 拔 mock test 暴露 feedback loop 缺口，再另案決定。

### 後續驗證建議

1. 拿 AR003 既有規格跑一次新版 `/impl-be`，看 `[processor]` SG2 雙對照表是否真能擋下契約 / schema 漂移
2. 跑一次 `/impl-fe`，看 `[service]` / `[store-map]` SG2 對照表是否能在 SO0062 那種 camelCase 改名情境抓到問題
3. 若驗證通過 → 接著推切入點 8（commit-time hook 自動跑 typecheck + module test）把 SG2 對照規則部分自動化

---

## 已實作：切入點 4 — CLAUDE.md 守則對齊（2026-05-21）

### 三個動作的取捨

| 動作 | 落地與否 | 理由 |
|:--:|---|---|
| 1. 強制讀 CLAUDE.md 列前端硬守則清單 | ✅ 落地（SG1） | SKILL 強制 AI 讀 target CLAUDE.md，本身不預設規約內容 — 與切入點 9 撤回啟示一致 |
| 2. 第一個元件 demo stop | ❌ skip | PG 評估後不採；案例對照 AR003 F20-F27（8 元件 1 commit）/ AR002 dialog 18+ session 微調，但 PG 判斷「第一元件停一次」價值不足以納入 SKILL |
| 3. 自訂 CSS regex 守則檢查 | ✅ 落地（SG3，改通用機制版） | 原版「禁自訂 CSS」是 serp 專屬風格（類似切入點 9 撤回脈絡），改為「依 SG1 列的可 grep 守則自動跑 regex 驗證」通用機制；具體規約由 target CLAUDE.md 提供 |

### 設計決策（關鍵問答）

| 問題 | 採用 |
|---|---|
| 規約源頭 | **target CLAUDE.md + PG memory**；SKILL 不預設「零自訂 CSS」這類個人 / 專案專屬規約（對齊切入點 9 撤回） |
| 守則分類 | **可 grep 驗證類**（附 regex pattern，SG3 自動驗）+ **意圖類**（PG 手測階段審）|
| SG3 違規處理 | **只報不擋** — 與 commit-time hook 自動 block 機制互補：grep 屬風格 / 審美層由 PG 判斷，hook 屬 typecheck / test 層自動擋 |
| 適用範圍 | UI 類 task（`[page]` / `[dialog]`）跑 grep；契約層 / 靜態檔 task 跳過 |
| 無守則時行為 | target CLAUDE.md 無前端硬守則 → SG1 報告「無」並跳過；SG3 grep 亦跳過 |

### 改造方案

| 改 | 目的 | 動到的檔案 |
|:--:|---|---|
| 改 1：SG1 加「列前端硬守則清單」步驟 | 從 target CLAUDE.md + PG memory 抽取硬守則，分可 grep / 意圖兩類給 PG 確認 | `spec-p3-frontend/SKILL.md` 步驟 5（SG1）|
| 改 2：SG3 UI 類 task 報告加 grep 守則驗證 | 對 commit 範圍變動檔自動跑 SG1 列的可 grep pattern，報違規清單（檔名 + 行號 + 原文） | `spec-p3-frontend/SKILL.md` 步驟 6.f（SG3）|
| 改 3：關鍵防護機制加第 7 條 | 把 CLAUDE.md 對齊機制寫進 SKILL 規約 | `spec-p3-frontend/SKILL.md` 關鍵防護機制段 |
| 改 4：Execution Flow box + Stop Gate 表同步 | SG1 / SG3 行同步更新 | `spec-p3-frontend/SKILL.md` Flow box / Stop Gate 表 |

### 影響檔案清單

| 檔案 | 改動類型 |
|---|---|
| `skills/spec-p3-frontend/SKILL.md` | 步驟 5 (SG1) 加「列前端硬守則清單」段；步驟 6.f (SG3) 加「UI 類 task 守則 grep 驗證」段；Execution Flow box SG1 + SG3 行同步；Stop Gate 表 SG1 + SG3 row 同步；關鍵防護機制加第 7 條 |

### 動作 2 skip 的理由

PG 評估後判斷「第一個元件 milestone stop」不採。雖然 AR003 F20-F27（8 個 View2 元件 1 commit / 後續 4 輪 BUG round 才收）+ AR002 dialog（18+ session 反覆微調）都對應這個 friction，但 PG 判斷 SG1 列守則清單（動作 1）+ SG3 自動 grep（動作 3）已涵蓋大部分擴散風險；強制停一次 demo 的價值不足以納入 SKILL 規約。後續若 SG1+SG3 兩段機制在實際 target project 跑後仍出現「連跑後一次驗收 → 全部偏」事件，再回來評估加 milestone stop。

### 預期擋下的事件（基於 log 反推）

| 事件 | 改 1 (SG1 守則清單) | 改 2 (SG3 grep) |
|---|:---:|:---:|
| 違反「禁 inline style」這類可 grep 規約（serp / target 各自配置） | — | ✓ |
| 違反「禁 `<style>` 自訂 CSS」（target 配置時）| — | ✓ |
| AR003 F20-F27 連跑 8 元件後一次驗收 → 全部偏 | ✓（意圖對齊）| ✓（每 UI task SG3 即時抓） |
| AR002 dialog 18+ session 微調的擴散 | ✓（意圖對齊）| ✓ |
| AI 從 sibling code 抄到偷用 inline style 的舊寫法 | — | ✓ |

### 後續驗證建議

1. 在 target project（serp 或 eap）跑 `/impl-fe`，看 SG1 是否真的從 target CLAUDE.md 抽出硬守則清單（不是憑空填）
2. 跑一個 UI 類 task，看 SG3 報告是否真的對 commit 變動檔跑 grep + 列違規（含檔名 + 行號）
3. 故意在元件裡寫一行 `<div style="color: red">` 看 SG3 是否抓到 + PG 看到後 retry 流程是否順
4. 若 target CLAUDE.md 無前端硬守則段 → 看 SG1 是否正確跳過（不應卡死或硬塞守則）
5. 若驗證通過 → 收口；若 grep 漏 / 誤判 → 補對應 pattern；若連跑後仍出現偏移 → 重新評估動作 2

---

## 已實作：切入點 5 — SKILL 結束點 + bug 修復 hand-off（2026-05-21）

### 三個原則（落地版）

| 原則 | 落地形式 |
|:--:|---|
| 1. SKILL 結束 = 完工三條件 | (a) task 全 done + (b) 收尾報告 + (c) 維護期 hand-off append；三條件缺一不可。SKILL 不負責「跑得起來」「整合手測沒 bug」「UI 微調」 |
| 2. bug 修復 / 整合手測 / UI 微調 → ad hoc 派修，**不寫進 progress.md / session_log.md** | 避免文件膨脹失焦；ad hoc 修走 git log + commit message 自身紀錄。正名「AR002 主輪後 ad hoc 沒紀錄是健康狀態」 |
| 3. 維護期 hand-off 段（兩類） | 在最後一個 task 的 commit 範圍內 append session_log 固定段「`## 維護期 hand-off`」；分「上線前必補（blocker）」「技術債（non-blocker）」兩類；AI 從 progress.md 備註欄 / session_log「下 session 注意」/ SG2 偏離項自動歸納初稿，PG 修；無項目時填「（無）」不省略段落 |

### 設計決策（hand-off 三個關鍵問）

| 問題 | 選項 | 採用 |
|---|---|:--:|
| hand-off 落點 | session_log 段 / progress 段 / 兩者都加 / 純 console 不寫檔 | **session_log 加固定段**（與 artifact 合一規約一致，最後一個 task commit 內 append；PG 日後查得到）|
| hand-off 初稿來源 | AI 主動歸納 / AI 列空骨架 PG 自填 / 設「hand-off SG」互動生成 | **AI 主動歸納初稿**（從 warning / 偏離項 / 「下 session 注意」），PG 修 |
| 「bug 不入 SKILL」規約位階 | 進核心原則 + 完工報告段都提 / 只在完工報告段提 / 進定位段「不負責」清單 | **只在完工報告段提**，定義 SKILL 邊界；個別 task loop 不重複 |

### 改造方案

| 改 | 目的 | 動到的檔案 |
|:--:|---|---|
| 改 1：定位段加「SKILL 邊界」明示 | 開頭就明示本 SKILL 結束點 + 不負責清單 | `spec-p3-backend/SKILL.md` / `spec-p3-frontend/SKILL.md` / `spec-p3-data/SKILL.md` 三份 |
| 改 2：步驟 6.d 加「同步產 hand-off 初稿」（last task）| 把 hand-off 寫死進 task loop 收尾 | `spec-p3-backend` / `spec-p3-frontend` 步驟 6.d；`spec-p3-data` 步驟 10（無 task loop，是 commit SQL 時同步 append）|
| 改 3：步驟 7 / 11 改寫為「完工三條件 + 收尾報告 + SKILL 邊界」 | SKILL 結束點明確化 | 三份完工段 + Execution Flow box 同步 |
| 改 4：Session Log 範例加「## 維護期 hand-off」段骨架 | 提供統一模板給三份 SKILL 共用 | `spec-p3-backend/SKILL.md`（frontend / data 共用此格式）|
| 改 5：關鍵防護機制 + 核心原則 升級 | 把完工三條件 + 邊界寫進 SKILL 規約 | `spec-p3-backend` 防護機制加第 8 條；`spec-p3-frontend` 核心原則 6 從「結束 ≠ 驗證結束」升級為「完工三條件」|

### 影響檔案清單

| 檔案 | 改動類型 |
|---|---|
| `skills/spec-p3-backend/SKILL.md` | 定位段（加 SKILL 邊界）、步驟 6.d（加 hand-off 初稿）、步驟 7（改寫完工三條件 + SKILL 邊界 + bug 不入 SKILL）、Execution Flow box（同步）、關鍵防護機制（加第 8 條）、Session Log 範例（加維護期 hand-off 段骨架，frontend / data 共用此格式）|
| `skills/spec-p3-frontend/SKILL.md` | 定位段（加 SKILL 邊界）、步驟 6.d（加 hand-off 初稿，特別關注 i18n / CSS / UI stub / 組件 emit 限制）、步驟 7（改寫同上）、Execution Flow box（同步）、核心原則 6（從「結束 ≠ 驗證結束」升級為「完工三條件」）|
| `skills/spec-p3-data/SKILL.md` | 定位段（加 SKILL 邊界）、步驟 10（commit SQL 與 session_log 合一 + hand-off 初稿）、步驟 11（改寫同上；hand-off 常見內容為「seed 覆蓋率」「殘留 cleanup」）、Execution Flow box（同步）|

### 預期擋下的事件（基於 log 反推）

| 事件 | 改 1 / 3 邊界 | 改 2 / 4 hand-off |
|---|:---:|:---:|
| AR002 主輪後 ad hoc 階段被誤解為「SKILL 沒做完」 | ✓ | — |
| 後續 bug 修復寫回 progress.md / session_log.md 導致文件膨脹失焦 | ✓ | — |
| AR003 B52 JasperReports 模板留空殼，PG 上線前才想起 | — | ✓（blocker）|
| AR002 `SLov` emit 限制 / 暫用 workaround 散落多個 session 沒收口 | — | ✓（技術債）|
| SO0062 seed 覆蓋率不足、test_cases 條目需 PG 手建 | — | ✓（blocker）|

### 對應 AR002 觀察

PG 講「AR002 主輪後就 ad hoc 沒紀錄」實際上是健康狀態 — 規約落地後正名為設計意圖：SKILL 該結束就結束，後面是維護期。SKILL 結束點明確化 + 「ad hoc bug 不寫回」規約，可同時擋下「SKILL 文件持續膨脹」與「以為 SKILL 失敗」兩個誤解。

### 後續驗證建議

1. 下個程式跑完 P3 三段，看 AI 是否真的在最後 task 的 commit 內 append hand-off 段（而非另開 commit / 漏寫）
2. 看 AI 歸納的「上線前必補 / 技術債」初稿是否真的命中 PG 心中的清單（若全空 / 全錯，要強化來源 prompt）
3. 整合手測階段，看 PG 是否真的不回寫 progress.md / session_log.md，走 ad hoc commit 自身紀錄
4. 若驗證通過 → 把實際 hand-off 範例補回 SKILL Session Log 範例段（取代目前的範例佔位）

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

## 已實作：切入點 6 — MCP MySQL Server 完整落地（2026-05-22）

### 落地軌跡

| 階段 | SKILL | MCP 用途 | 落地 commit |
|---|---|---|---|
| P2 | `spec-p2-tasking` | DESCRIBE 真 DB → 產 `current_schema_{程式編號}.md`（唯一 schema 來源） | 4079842 |
| P3-backend | `spec-p3-backend` | 讀 `current_schema_{程式編號}.md`（不重複 DESCRIBE） | 4079842 |
| P3-data | `spec-p3-data` | (1) Schema 對齊讀 `current_schema`；(2) 對帳走 MCP read-only SELECT；(3) 必要時對特定表重跑 `DESCRIBE` 補驗 stale | **本 commit** |

### 設計概念

裝 `@modelcontextprotocol/server-mysql`（或同等實作），讓 Claude 能直接查 DB schema / table data，不再走 Bash → mysql CLI → 文字 parsing 路線。

```bash
claude mcp add mysql -- npx -y @modelcontextprotocol/server-mysql --host localhost --user dev --database SERP
```

### 寫入路徑的決策（spec-p3-data 端 friction）

spec-p3-data 同時要做**讀**（schema 驗證、COUNT 對帳）與**寫**（PERMISSION/SEED INSERT）。為維持 MCP 唯讀原則，最終設計：

| 互動 | 路徑 | 理由 |
|---|---|---|
| Schema 對齊（讀） | 讀 `current_schema_{程式編號}.md` | 與 spec-p3-backend 對稱；P2 已透過 MCP DESCRIBE 落地 |
| COUNT 對帳（讀） | MCP read-only SELECT | 避免 mysql CLI 對中文 / 特殊字元 escape 風險 |
| PERMISSION/SEED INSERT（寫） | mysql CLI（PG 授權後） | MCP 唯讀無寫權；寫入需 PG SG2 授權，風險可控 |

PG 在落地時明示選 A 方案（保持 mysql CLI 寫入 / 唯讀 MCP 原則），不另設 write-enabled MCP。

### 改造方案（spec-p3-data）

| 改 | 目的 | 動到的檔案 |
|:--:|---|---|
| 改 1：定位段 + 前置條件 + Execution Flow 改 schema 來源 | DB schema 來源從 `Docs/DDL/*.sql` 切到 `current_schema_{程式編號}.md` | `spec-p3-data/SKILL.md` 定位段 / 前置條件 / Execution Flow box / 步驟 4 |
| 改 2：步驟 9 拆寫入/對帳兩路徑 | 寫入走 mysql CLI、對帳走 MCP read-only；MCP 失敗 fallback 對帳走 mysql CLI 並記 hand-off | `spec-p3-data/SKILL.md` 步驟 9 |
| 改 3：前置條件加 MCP 唯讀連線（與 spec-p2 對稱） | 與既有 MCP 落地共用配置；明示對帳 / DESCRIBE 補驗用 | `spec-p3-data/SKILL.md` 前置條件第 5 條 |
| 改 4：Stop Gate 表 SG1/SG2 同步 | SG1 schema 對齊註明讀 current_schema；SG2 註明「寫入 mysql CLI / 對帳 MCP」雙路徑 | `spec-p3-data/SKILL.md` Stop Gate 表 |
| 改 5：關鍵防護機制加 3 條（5/6/7）+ 核心原則加 2 條（5/6） | 把 MCP 唯讀 + schema 來源唯一化 + 雙路徑寫進規約 | `spec-p3-data/SKILL.md` 關鍵防護機制 / 核心原則 |
| 改 6：README.md 同步 | 定位 / 前置條件 / 流程總覽 / 快速開始步驟 / 核心原則 / 關鍵防護機制 全面對齊 SKILL.md | `spec-p3-data/README.md` |

### 影響檔案清單

| 檔案 | 改動類型 |
|---|---|
| `skills/spec-p3-data/SKILL.md` | 定位段「輸入」段；前置條件第 5 條（MCP 唯讀）；Execution Flow box「讀 schema」+「對帳」兩段；步驟 4（讀 current_schema + 缺檔處理 + stale 重 DESCRIBE）；步驟 9（寫入/對帳兩路徑 + MCP failure fallback）；Stop Gate 表 SG1/SG2；關鍵防護機制加 5/6/7；核心原則加 5/6 |
| `skills/spec-p3-data/README.md` | 定位「輸入」；核心原則加 6/7；前置條件第 5 條；流程總覽圖（schema 來源 + 雙路徑執行）；快速開始步驟 3/5；關鍵防護機制加 5/6 |

### 預期擋下的事件（基於 log 反推）

| 事件 | 改 1 (schema 切 current_schema) | 改 2 (對帳走 MCP) |
|---|:---:|:---:|
| AR003 BUG-A1（Entity 假設 17 欄但 DDL 只 15 欄）— spec-p3-data 階段 | ✓（schema 來源已是 MCP DESCRIBE 結果） | — |
| SO0062 對帳 COUNT 在 mysql CLI 中文 escape 出錯 | — | ✓（MCP 直接傳 binary params 不過 shell escape） |
| spec-p3-data 從 `Docs/DDL/*.sql` 讀 stale schema 推 INSERT 缺欄 | ✓ | — |
| spec-p3-data 與 spec-p3-backend / spec-p2 schema 認知不一致 | ✓（三 SKILL 共用同一份 `current_schema`） | — |

### 風險 / 注意

- MCP 連線到 dev DB 需要 PG 預先配置帳密（與 spec-p2 共用配置）
- production DB 絕對不能掛 MCP（避免 AI 不小心動）
- 對 read-only user 應建僅可 `DESCRIBE` / `SELECT` 的權限
- **MCP 失敗時的 fallback**：對帳路徑 fallback 走 mysql CLI 並明示告知 PG（記 session_log「下 session 注意」）；schema 對齊路徑無 fallback（缺 current_schema STOP 回 P2）

### 後續驗證建議

1. 在 target project 跑 `/data`，看 SKILL 是否真的讀 `current_schema_{程式編號}.md`（不是 fallback 讀 DDL）
2. PG 授權 SG2 後，看 INSERT 是否走 mysql CLI、COUNT 對帳是否走 MCP（log 中應看到兩種工具呼叫並存）
3. 故意把 `current_schema_{程式編號}.md` 刪掉，看 SKILL 是否真的 STOP 回報「回 P2 補」而不是自動 fallback 讀 DDL
4. 故意把 MCP server 停掉，看對帳是否 fallback 走 mysql CLI 並記 hand-off
5. 若驗證通過 → 收口；若 PG 觀察「對帳 escape 風險」仍頻繁，再評估升級為 write-enabled MCP（本輪選 A 方案 mysql CLI 寫入）

---

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

## 已實作：切入點 8 — commit-time hook 自動 typecheck + module test（A path，2026-05-21）

### 設計演進（PostToolUse Edit/Write → PreToolUse Bash + git commit filter）

初版設計（PostToolUse Edit/Write 後跑 typecheck）在實作後盤點發現兩個 friction：

1. **AI flow 被切碎**：每次 Edit 卡 5-20s，UI 微調（如加 `class="xxx"`）也觸發 vue-tsc，連環卡
2. **spike 3（+test）不可行**：每 Edit 跑 test 是災難（×N 次累積 30s+）

進一步釐清「hook 要解決什麼問題」後得出兩個關鍵理解：

- **SG3 已是天然 typecheck stop gate**：每個 task 結束 SG3 報告本來就要報 typecheck 結果；hook 只是補位「AI 跳過跑 typecheck 直接報全 green」的極端
- **真正的 friction（AR002 B03 / AR003 B21 / F11「測試該紅而沒紅」）只有 spike 3（test 自動跑）能擋**，spike 1（typecheck only）抓不到 — 是 typecheck 擋不到的「Red-first 違規」

→ 改設計為 **PreToolUse + matcher: Bash + script 內過濾 `git commit`**，commit 時跑 typecheck + module test（spike 3），其他時間不擋。

### 設計決策

| 問題 | 採用 |
|---|---|
| hook 位階 | SKILL 自動寫入 target `.claude/settings.local.json`（SG1 偵測未裝 → 詢問 PG → 寫入） |
| 觸發時機 | **commit 時**（PreToolUse + Bash + 過濾 `git commit`），不是每 Edit |
| hook 範圍 | **spike 3 一步到位**：typecheck + module test 都跑；spike 1（typecheck only）/ spike 2（+ lint）為替代設計骨架在 README |
| 失敗策略 | block commit + reason 含「⚠️ Do NOT auto-fix in-place. Notify PG.」AI 不自動修、通知 PG |

### 事實確認（Claude Code hook 規格，避免寫錯）

| 議題 | 事實（來源：code.claude.com/docs/en/hooks.md） |
|---|---|
| 檔案路徑傳入 | **stdin JSON payload**（不是 env var）；解析 `tool_input.file_path` / `tool_input.command` |
| matcher 語法 | pipe 分隔字串 `"Bash"`、`"Edit|Write"`（不是 array） |
| Block 機制 | **exit 0 + stdout JSON** `{"decision":"block","reason":"..."}`（不是 exit 1） |
| Windows shell | 預設 Git Bash；要 PowerShell 需 `"shell": "powershell"` |
| Settings 合併 | 多層 hooks **全部累加觸發**（local > project > global） |
| Reload | file watcher 自動 reload，不需 restart |

### 改造方案

| 改 | 目的 | 動到的檔案 |
|:--:|---|---|
| 改 1：建 hooks 範本目錄 + 三檔 | 提供 spike 3 範本 + spike 1/2 替代設計骨架 | `spec-p3-backend/templates/hooks/{typecheck-test-on-commit.ps1, settings.local.json.tmpl, README.md}` + spec-p3-frontend 對稱共 6 檔 |
| 改 2：spec-p3-backend / spec-p3-frontend SG1 加 hook 偵測 + 安裝詢問 | SG1 偵測未裝 → 詢問 PG → SKILL 寫入 `.claude/settings.local.json` | 兩份 SKILL.md 步驟 5（SG1）+ Execution Flow box + Stop Gate 表 |
| 改 3：關鍵防護機制加「commit-time hook」一條 | 寫進 SKILL 防護機制 | `spec-p3-backend` 第 9 條、`spec-p3-frontend` 第 6 條 |

### 影響檔案清單

| 檔案 | 改動類型 |
|---|---|
| `skills/spec-p3-backend/templates/hooks/typecheck-test-on-commit.ps1` | 新增：spike 3（mvn -pl <staged-modules> -am test）；stdin JSON parse / git diff --cached / 找 Maven module 與 reactor root 邏輯內建 |
| `skills/spec-p3-backend/templates/hooks/settings.local.json.tmpl` | 重寫：PreToolUse + matcher: Bash + shell: powershell |
| `skills/spec-p3-backend/templates/hooks/README.md` | 重寫：設計演進（PostToolUse 撤回理由）、hook 流程、block 後 AI 行為、安裝步驟、spike 1/2 替代骨架、已知限制 |
| `skills/spec-p3-frontend/templates/hooks/typecheck-test-on-commit.ps1` | 新增：spike 3（npm typecheck + npx vitest related --run <staged>）；自動偵測 vitest 是否安裝 |
| `skills/spec-p3-frontend/templates/hooks/settings.local.json.tmpl` | 重寫：同 backend 結構 |
| `skills/spec-p3-frontend/templates/hooks/README.md` | 重寫：同 backend 結構 |
| `skills/spec-p3-backend/SKILL.md` | 步驟 5（SG1 commit-time hook 段）、Execution Flow box SG1 行、Stop Gate 表 SG1 描述、關鍵防護機制第 9 條 |
| `skills/spec-p3-frontend/SKILL.md` | 步驟 5（同上）、Execution Flow box SG1 行、Stop Gate 表 SG1 描述、關鍵防護機制第 6 條 |

### 預期擋下的事件（基於 log 反推）

| 事件 | spike 3（commit 時 typecheck + test）|
|---|:---:|
| AR002 B03 LoadOpenItems 直接寫實作沒先跑 Red | ✓ commit 時跑 test 強制 Red→Green |
| AR003 B21「寫完才跑」事件 | ✓ |
| F11 同上 | ✓ |
| AR003 BUG-P4b-R3 normalize 不對齊（前端 type 漂移）| ✓ typecheck 抓 type signature 改 |
| SO0062 mapper camelCase 寫完才發現 | ✓ typecheck 抓欄位名不一致（前提 backend type 已更新）|
| baseline 既有 typecheck 紅 | ⚠️ 首次 commit 會卡，PG 需先清 baseline |

### 風險與已知限制

- **commit 等 30-60s**：mvn -pl + -am incremental cache 後 10-20s 可達；vitest related 只跑相依 test 通常 5-15s。首次 cold build 較慢
- **baseline typecheck 紅**：hook 報 block 但錯誤不是本次 commit 造成 → 建議 baseline 一次清乾淨後再啟用 hook
- **PowerShell 5.1+** 才支援 `[Console]::In.ReadToEnd()` + ConvertFrom-Json
- **`git diff --cached` 必須在 commit 前已 `git add`**：若 AI 用 `git commit -a` 自動 stage，hook 跑時 staged 已含 modified 檔
- **跨平台**：本範本只出 PowerShell 版（PG 環境是 Windows）；Mac/Linux 需另翻譯
- **AI 反覆試 commit 風險**：reason 文案要求 AI 通知 PG 不自動修，仰賴 AI 遵守；若觀察到死循環，後續加 `.claude/hooks/state.json` 記 N 次失敗升級警告

### 後續驗證建議

1. 在實際 target project（serp / eap）跑 SKILL，看 SG1 是否真的偵測 `.claude/settings.local.json` 並提示安裝
2. PG 選安裝 → 用 `/hooks` 驗證 PreToolUse Bash hook 已 load
3. 故意 commit 一個 typecheck 失敗的 .java / .ts，看 AI 是否真的被 block + 收到 reason 訊息 + AI 是否遵守「通知 PG 不自動修」
4. 測 cost：在 serp 跑 N 個 task 後比較 commit 等待時間是否在可接受範圍（目標 < 30s incremental）
5. 若 cost 過高 → 降階到 spike 1（typecheck only on commit）；若擋不到實質 friction → 升級加 lint / 整合 test

---

## 撤回：切入點 9 — CLAUDE.md 補 5 條規約（2026-05-21 重新歸類）

### 撤回理由

PG 觀察：**CLAUDE.md 是 target project 的事**，spec-workflow SKILL 跑在 target project 內時自然會讀 target 的 `CLAUDE.md`，SKILL 不該回過頭去改 target 的 CLAUDE.md。

切入點 9 提的 5 條規約重新拆解後，沒有任何一條應由 spec-workflow SKILL 直接落地：

| 條目 | 性質 | 真正歸屬 | 現況 |
|---|---|---|---|
| 1. **DB-first**（不從 sibling code 推 schema）| 跨專案普適 | spec-workflow SKILL | **已 cover** — spec-p3-backend SKILL.md 核心原則 2 + 防護機制 4（current_schema 對齊；切入點 2 落地時已寫進）|
| 2. **Working Style**（narrowly scoped 不擴張）| 跨專案普適 | spec-workflow SKILL | **歸併到切入點 7**（Scope-lock prompt pattern：restate deliverable / list out-of-scope，待落地時統一處理）|
| 3. **AR002 / Financial Conventions** | **serp / AR002 專屬** | serp 專案 `CLAUDE.md` | SKILL 不該管，由 PG 在 target project 自行加 |
| 4. **Git Workflow**（worktree path / amend confirm）| 跨專案 / 個人習慣 | `~/.claude/CLAUDE.md` 全域 or target | 屬個人工作風格，spec-workflow SKILL 不直接管 |
| 5. **Frontend / i18n**（不創新 prefix namespace、用 default `cv.json`）| **serp 專屬** | serp 專案 `CLAUDE.md` | SKILL 不該管 |

### 對未來批次的啟示

- spec-workflow SKILL 的責任邊界 = **跨專案普適的流程 / 規約 / Stop Gate**；target project specific 的業務 / 命名 / framework 慣例 = target project CLAUDE.md
- Insight Report 給的「Suggested CLAUDE.md Additions」是針對 PG 在過去三個專案中觀察到的 friction，落地對象應是 PG 在各專案的 CLAUDE.md，不是 SKILL bundle
- 切入點 9 的條目 1 / 2 / 4 已分別在切入點 2 / 7（待動）/ SKILL 既有規範中處理

---

## 還在外面、本輪不動

- `eap-agentic-coding` / `eap-agentic-coding-lite` / `serp-agentic-coding`：獨立 plugin，是不同流程的 wrapper，與 spec-workflow bundle 並列。本輪 review 暫不深入
- `session-analyzer`：純分析工具，不涉及流程設計
- spec-workflow bundle 內的 prompt template 細節（如「LOV 標準結構範本」是否要加 source）— PG 選只動 3 張主表，其餘暫不動
