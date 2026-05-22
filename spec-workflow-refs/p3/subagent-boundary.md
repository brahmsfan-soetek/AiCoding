# Subagent 邊界 + 讀規範不掃 code

> **適用：** P3-be / P3-fe / P3-data

## 1. Subagent 不產出進 git 的檔案

**實作 / 測試 code 必須由主 session 撰寫**（需要完整 context + 回饋迴圈）。

**可委託 subagent 的操作**：
- 跑 lint / typecheck / test 指令
- 搜尋既有程式碼參考、找相似元件 / Processor / Validator
- 從規範文件抽特定段落
- 探索性查詢（如「這個 method 還有誰呼叫」）

**不可委託 subagent 的操作**：
- 寫 Entity / Processor / Validator / SQL / Service / Store / Component / SQL 檔等任何進 git 的檔案
- 寫測試檔
- 修改既有實作 code

**前例教訓（session-791acadc）**：subagent 寫程式碼時 prompt 與模板矛盾導致全錯。subagent 缺乏主 session 累積的 context（PG 回饋、SG2 對照表結果、規範細節），且無回饋迴圈確認產出對齊。

## 2. 讀規範、不掃 code

專案 context 來自 `CLAUDE.md` 索引指向的規範文件，**不從掃 sibling code 歸納 pattern**。

需要從 `CLAUDE.md` 索引取得的資訊：
- 測試框架與執行指令（JUnit / Mockito / Testcontainers / Vitest / Jest / etc.）
- Lint / typecheck 指令
- Commit 規範
- 後端 / 前端目錄結構、Entity / Processor / Validator / Component 命名慣例
- Store / Service / API service 慣例

理由：掃 code 容易把「歷史 anti-pattern」當「現在規範」、也容易把 sibling 的舊版本當對齊基準（AR003 BUG-A1 教訓：規格 17 欄、DDL 15 欄、實際 DB 也缺 2 欄；若掃 sibling Java code 推 schema 會錯）。
