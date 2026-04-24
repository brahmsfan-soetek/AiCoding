---
name: spec-p2-tasking
description: 在專案內依據最終版規格統計產出前後端與手測 checklist 三份清單，並為每個 task 標註類型 tag（供 P3 分流測試策略）。觸發於 /tasking 或提到任務清單、前後端清單、tasking 等關鍵字。與 spec-p1-digest-flow 接軌：在 SA 資料夾完成 S0–S4 後，把最終規格與 UI 截圖搬進專案，於此處執行。
---

# Spec Tasking — 專案內任務清單產出

在專案 repo 目錄下執行，根據最終版規格統計與專案 `CLAUDE.md` 索引揭露的規範文件，產出可直接被後續 SKILL 讀取的前端、後端、測試三份清單。每個 task 必須標註類型 tag，供 `spec-p3-backend` / `spec-p3-frontend` 分流測試策略。

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
6. 讀取 `<skill-dir>/templates/prompts/任務清單_prompt.md` 與 `<skill-dir>/templates/outputs/` 下三份輸出模板。
7. 執行 prompt，產出三份檔案至使用者指定位置：
   - `{程式編號}_frontend_tasks.md`（含前端類型 tag：service / store-map / store-action / types / page / dialog / i18n / router）
   - `{程式編號}_backend_tasks.md`（含後端類型 tag：validator / processor / sql / entity / spi；`[processor]` 類額外填「選填欄位」）
   - `{程式編號}_test_cases.md`（手測 checklist，含「狀態」欄供 PG 勾選）
8. **產出後立即 commit**（artifact 即 commit 原則）：
   - 建議 commit message：`docs({程式編號}): add P2 tasks + test checklist`
   - commit 範圍限定 `Docs/spec/{程式編號}/plan/`
9. 完成後提示：使用者可另起 session，依序執行：
   - `/impl-be` — 後端實作（`spec-p3-backend`）
   - `/impl-fe` — 前端實作（`spec-p3-frontend`）
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

1. **規格統計 = 唯一權威來源** — UI 截圖僅供排版參考，衝突時以規格統計為準。
2. **讀規範、不掃 code** — 專案 context 來自 `CLAUDE.md` 索引指向的規範文件，不掃 code 歸納 pattern（AI 行為會漂移）。
3. **輸出位置由使用者決定** — 建議預設 `plan/` 子目錄，但每次執行都詢問。
4. **類型 tag 必填** — 每個 task 必須標註類型 tag，這是 P3 分流測試策略的依據。
5. **test_cases.md = 手測 checklist** — 不是自動化 spec，而是 PG 開瀏覽器照著對的清單。
6. **PG 是品質守門人** — AI 產出後需 PG 審閱再進入實作。
7. **Artifact 即 commit** — 產出後立即 commit，避免 working tree 丟失。

## Output Templates

- `templates/outputs/前端任務清單模板.md`
- `templates/outputs/後端任務清單模板.md`
- `templates/outputs/測試清單模板.md`（手測 checklist 格式）

## Prompt Template

- `templates/prompts/任務清單_prompt.md`
