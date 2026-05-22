---
name: spec-p2-tasking
description: 在專案內依據最終版規格統計產出前後端與手測 checklist 三份清單，並為每個 task 標註類型 tag（供 P3 分流測試策略）。觸發於 /tasking 或提到任務清單、前後端清單、tasking 等關鍵字。與 spec-p1-digest-flow 接軌：在 SA 資料夾完成 S0–S4 後，把最終規格與 UI 截圖搬進專案，於此處執行。
---

# Spec Tasking — 專案內任務清單產出

在專案 repo 目錄下執行，根據最終版規格統計、專案 `CLAUDE.md` 索引揭露的規範文件、以及透過 MCP MySQL 唯讀連線取得的真實 DB schema，產出可直接被後續 SKILL 讀取的四份清單（前端、後端、API 契約、手測 checklist）。每個 task 必須標註類型 tag，供 `spec-p3-backend` / `spec-p3-frontend` 分流測試策略；API 契約清單為 FE / BE 跨層共讀來源（Single Source of Truth）。

## 為何獨立於 spec-p1-digest-flow

S1–S4（規格統計、釐清、整合）是純文件作業，在隔離的 SA 資料夾執行即可。
但任務清單必須貼合專案的既有規範與慣例——這些資訊記錄在專案 `CLAUDE.md` 索引指向的規範文件中。因此把任務清單階段從原流程拆出，改為在專案目錄下執行。

## 觸發方式

- `/tasking` — 顯示流程說明並開始
- `/tasking <程式編號>` — 直接帶入程式編號

## 前置條件

使用者已完成以下事項：
1. 在 SA 資料夾透過 `spec-p1-digest-flow` 完成 S0–S4，產出 `{程式編號}_規格統計_最終版.md`
2. 將最終規格 + UI 截圖（PNG）搬入當前專案目錄
3. **MCP MySQL 唯讀連線已配置**：PG 預先設定指向 dev DB 的 MCP server（如 `@modelcontextprotocol/server-mysql` 或同等實作），帳號僅可 `DESCRIBE` / `SELECT`，無寫入權限。production DB 絕對不可掛 MCP。

## Execution Flow

1. Determine `<skill-dir>`（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**（非 SA 資料夾）。若無法確認，詢問使用者。
3. **建立專案 context**（關鍵步驟，不可省略）：
   - 讀取專案根目錄的 `CLAUDE.md`
   - 依 `CLAUDE.md` 索引，讀取其指向的各類規範文件（如命名慣例、目錄結構、元件 pattern、API 規範、測試規範等）
   - **不掃 code 歸納 pattern**（AI 行為會漂移），改讀明確寫好的規範（deterministic）
   - 若專案無 `CLAUDE.md` 或索引不完整，fallback 到通用骨架分類，並告知使用者是否先補充 `CLAUDE.md`
4. **辨識輸入材料**（直接讀當前工作目錄）：
   - `{程式編號}_規格統計_最終版.md`
   - UI 截圖 PNG
   若候選檔案有多個，向使用者確認。
5. **與使用者確認**：
   - 程式編號（若檔名未明示）
   - 輸出位置：建議預設 `Docs/spec/{程式編號}/plan/`，讓使用者按 Enter 確認或覆寫。**不得將路徑寫死於模板**。
   - **[STOP] Scope Statement（動手前必跑）：** 在進入步驟 6 前，AI 用 3 行報告 lock scope：
     - **Deliverable**（一句話）：本次預計產出 P2 四份檔案（frontend_tasks / backend_tasks / api_contract / test_cases）+ `current_schema_{程式編號}.md`
     - **預期動到的範圍**：列實際清單（如 `Docs/spec/{程式編號}/plan/*.md` 五份檔；MCP `DESCRIBE` 涉及的表名清單）
     - **明示 out-of-scope**：列「本次不會動」的範圍（如「不改 sibling 程式的 task / spec」「不動 `Docs/DDL`」「不寫實作 code」「不改規範文件」「不重構既有專案結構」）
     - PG 確認 scope 後才進入步驟 6 DB schema 建立
     - **規約**：產出過程若發現需超出 scope（如需動到非本程式的檔案 / 改規範 / 順手重構）→ STOP 回報 PG，PG 決定擴張或縮回；AI 不自行擴張（對齊 Insight 報告 35 wrong_approach + 12 excessive_changes 觀察）
6. **DB schema 建立**（透過 MCP MySQL 唯讀連線；不可省略，schema 是 API 契約的型別來源）：
   - 從規格統計與 UI 截圖中辨識此程式涉及的表清單（含主表、關聯表、LOV 表）
   - 向 PG 報告候選表清單，**[STOP] 等 PG 確認**（PG 可增減）
   - 對確認後的每張表透過 MCP 跑 `DESCRIBE {table_name}`，亦可 `SELECT` 取得欄位 default / nullable / comment 等補充資訊
   - 落地成 `Docs/spec/{程式編號}/plan/current_schema_{程式編號}.md`：每張表一個小節，列「欄位名 / 真實型別 / nullable / default / 註解」
   - **此檔即為後續所有 schema 檢核的唯一權威來源**；`Docs/DDL/*.sql` 與規格統計的欄位定義均不再優先採用
   - MCP 無法連線（dev DB down / 帳號未設）→ 中止流程並告知 PG，不得自行 fallback 到「從 sibling code 推 schema」
7. 讀取 `<skill-dir>/templates/prompts/任務清單_prompt.md` 與 `<skill-dir>/templates/outputs/` 下四份輸出模板。
8. 執行 prompt，產出**四份**檔案至使用者指定位置：
   - `{程式編號}_frontend_tasks.md`（含前端類型 tag：service / store-map / store-action / types / page / dialog / i18n / router）
   - `{程式編號}_backend_tasks.md`（含後端類型 tag：validator / processor / sql / entity / spi；`[processor]` 類額外填「選填欄位」）
   - `{程式編號}_api_contract.md`（FE / BE 共讀契約；每支 API 一張，含 Request shape / Response shape / i18n key，型別取自 `current_schema_{程式編號}.md`）
   - `{程式編號}_test_cases.md`（手測 checklist，含「狀態」欄供 PG 勾選）
9. **產出後立即 commit**（artifact 即 commit 原則）：
   - 建議 commit message：`docs({程式編號}): add P2 tasks + API contract + test checklist`
   - **commit 標題禁止含內部 task id**（如 `B01` / `F02` / `A01`）；task id 可放 commit body 描述
   - commit 範圍限定 `Docs/spec/{程式編號}/plan/`（含 `current_schema_{程式編號}.md`）
   - 本階段為文件產出（無實作 code）→ 一次 commit 即可，不分多次
10. 完成後提示：使用者可另起 session，依序執行：
    - `/impl-be` — 後端實作（`spec-p3-backend`，讀 `backend_tasks.md` + `api_contract.md` + `current_schema_{程式編號}.md`）
    - `/impl-fe` — 前端實作（`spec-p3-frontend`，讀 `frontend_tasks.md` + `api_contract.md`）
    - `/data` — 權限 + 測資 SQL 產出與執行（`spec-p3-data`）
    - PG 手測：開瀏覽器照 `{程式編號}_test_cases.md` 逐條勾選

## 下游 SKILL 如何使用類型 tag

| Tag | 下游 SKILL | 測試策略 |
|---|---|---|
| `[validator]` / `[processor]` | spec-p3-backend | TDD（Mockito / JUnit）完整 Red-Green |
| `[sql]` / `[entity]` / `[spi]` | spec-p3-backend | 無 P3 測試 |
| `[service]` / `[store-map]` | spec-p3-frontend | 契約測試（mock fetch / shape 斷言） |
| `[store-action]` / `[types]` / `[page]` / `[dialog]` / `[i18n]` / `[router]` | spec-p3-frontend | 無測試（UI 由 PG 手測） |

**`[processor]` 額外要求：** task 必須列出「選填欄位」清單，供 P3-backend SG2 強制產生每個欄位的 null / `""` / 空白三種測試案例，對應 `:param IS NULL OR ... = :param` SQL pattern。

## 核心原則

1. **規格統計 = 業務邏輯權威來源** — UI 截圖僅供排版參考，業務衝突時以規格統計為準。
2. **DB schema = 型別權威來源** — `current_schema_{程式編號}.md` 經 MCP 唯讀 DESCRIBE 取得；所有 API 契約的欄位型別、後端 Entity / SQL 寫法均以此為準，`Docs/DDL/*.sql` 與規格的型別描述均次之。
3. **MCP 必須唯讀** — MCP MySQL server 僅可 DESCRIBE / SELECT；production DB 絕對不掛 MCP；MCP 連線失敗 → 中止流程，不得 fallback 到從 sibling code 推 schema。
4. **API 契約是跨層共讀來源** — `api_contract.md` 為 FE / BE 對齊基準，不一致改 code、不反向改契約。
5. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件，不掃 code 歸納 pattern（AI 行為會漂移）。
6. **輸出位置由使用者決定** — 建議預設 `plan/` 子目錄，但每次執行都詢問。
7. **類型 tag 必填** — 每個 task 必須標註類型 tag，這是 P3 分流測試策略的依據。
8. **test_cases.md = 手測 checklist** — 不是自動化 spec，而是 PG 開瀏覽器照著對的清單。
9. **PG 是品質守門人** — AI 產出後需 PG 審閱再進入實作。
10. **Artifact 即 commit、commit 標題乾淨** — 四份產出 + current_schema 一次 commit 完成；commit 標題用語意動詞（如 `docs(ar003): add P2 tasks + API contract + test checklist`），禁止含內部 task id（`B01` / `F02` / `A01` 等）。
11. **Scope-lock 動手前必跑** — 步驟 5 末尾 Scope Statement（Deliverable / 預期動到 / out-of-scope）為 stop gate；產出過程發現需超出 scope → STOP 回報 PG，不自行擴張。

## Output Templates

- `templates/outputs/前端任務清單模板.md`
- `templates/outputs/後端任務清單模板.md`
- `templates/outputs/API契約清單模板.md`（FE / BE 共讀契約，每支 API 一張，型別取自 `current_schema_{程式編號}.md`）
- `templates/outputs/測試清單模板.md`（手測 checklist 格式）

`current_schema_{程式編號}.md` 為 step 6 動態產出，無固定模板（格式由 prompt 指定）。

## Prompt Template

- `templates/prompts/任務清單_prompt.md`
