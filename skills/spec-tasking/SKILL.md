---
name: spec-tasking
description: 在專案內依據最終版規格統計產出前後端與測試任務清單。觸發於 /tasking 或提到任務清單、前後端清單、tasking 等關鍵字。與 spec-digest-flow 接軌：在 SA 資料夾完成 S0–S4 後，把最終規格與 UI 截圖搬進專案，於此處執行 S5。
---

# Spec Tasking — 專案內任務清單產出

在專案 repo 目錄下執行，根據最終版規格統計與既有專案規範，產出可直接被實作 session 讀取的前端、後端、測試三份任務清單。

## 為何獨立於 spec-digest-flow

S1–S4（規格統計、釐清、整合）是純文件作業，在隔離的 SA 資料夾執行即可。
但任務清單必須貼合專案的既有 component、API pattern、目錄結構與命名慣例——這些資訊只存在於專案 repo 內。因此把任務清單階段從原流程拆出，改為在專案目錄下執行。

## 觸發方式

- `/tasking` — 顯示流程說明並開始
- `/tasking <程式編號>` — 直接帶入程式編號

## 前置條件

使用者已完成以下事項：
1. 在 SA 資料夾透過 `spec-digest-flow` 完成 S0–S4，產出 `{程式編號}_規格統計_最終版.md`
2. 將最終規格 + UI 截圖（PNG）搬入當前專案目錄

## Execution Flow

1. Determine `<skill-dir>`（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**（非 SA 資料夾）。若無法確認，詢問使用者。
3. **建立專案 context**（關鍵步驟，不可省略）：
   - 讀取專案根目錄的 `CLAUDE.md`（若存在）
   - 掃描既有前端 component 目錄，歸納命名與結構慣例
   - 掃描既有後端 Processor / Entity / LOV 目錄，歸納既有 pattern
   - 掃描既有測試目錄，了解測試寫法慣例
4. **辨識輸入材料**（直接讀當前工作目錄）：
   - `{程式編號}_規格統計_最終版.md`
   - UI 截圖 PNG
   若候選檔案有多個，向使用者確認。
5. **與使用者確認**：
   - 程式編號（若檔名未明示）
   - 輸出位置：提供建議預設值（例如 `docs/specs/{程式編號}/`），讓使用者按 Enter 確認或覆寫。**不得將路徑寫死於模板**。
6. 讀取 `<skill-dir>/templates/prompts/任務清單_prompt.md` 與 `<skill-dir>/templates/outputs/` 下三份輸出模板。
7. 執行 prompt，產出三份檔案至使用者指定位置：
   - `{程式編號}_frontend_tasks.md`
   - `{程式編號}_backend_tasks.md`
   - `{程式編號}_test_cases.md`
8. 完成後提示：使用者可另起 session，在 repo 內直接讀取這三份清單進行實作。

## 核心原則

1. **規格統計 = 唯一權威來源** — UI 截圖僅供排版參考，衝突時以規格統計為準。
2. **專案規範優先** — 任務清單中的 component 名稱、API 命名、目錄結構、測試寫法，必須與專案既有慣例一致，不得憑空發明。
3. **輸出位置由使用者決定** — 不同專案有不同的文件擺放慣例，每次執行都詢問。
4. **PG 是品質守門人** — AI 產出後需 PG 審閱再進入實作。

## Output Templates

- `templates/outputs/前端任務清單模板.md`
- `templates/outputs/後端任務清單模板.md`
- `templates/outputs/測試清單模板.md`

## Prompt Template

- `templates/prompts/任務清單_prompt.md`
