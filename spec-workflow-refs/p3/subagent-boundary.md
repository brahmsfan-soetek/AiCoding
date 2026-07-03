# Subagent 邊界 + 規範權威與 grep 查證

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

## 2. 規範權威 = CLAUDE.md 索引；容許 grep 查證落地細節

**規範權威＝`CLAUDE.md` 索引指向的規範文件**；但**容許用 grep/glob 工具式查證既有 code 的落地細節**（API response shape 落地點、Processor mapping 寫法、既有元件 prop、reference implementation）作交叉驗證。**禁止的是把無 review 的歷史 code 當權威規範整段盲目複製**（把歷史 anti-pattern 當「現在規範」）。

需要從 `CLAUDE.md` 索引取得的資訊：
- 測試框架與執行指令（JUnit / Mockito / Testcontainers / Vitest / Jest / etc.）
- Lint / typecheck 指令
- Commit 規範
- 後端 / 前端目錄結構、Entity / Processor / Validator / Component 命名慣例
- Store / Service / API service 慣例

**輕量指路（可選）：** PG 可在 SG1 或 task 中即時指定一個「已知結構良好的既有檔」當參考（如「仿 Ap008VoidProcessor.java 的 ApplicationScoped + NativeSqlService 模式」）。這是一句指路，不建 canonical-example 清單 apparatus（清單有 silent drift 與維護債，見 05 A2）。

**兩條紅線不因鬆綁而動搖：**
1. **schema 不可從 code 推**：`current_schema_{程式編號}.md` 是唯一 schema 權威，缺檔回 `/tasking` 補（AR003 BUG-A1 教訓：規格 17 欄、DDL 15 欄、實際 DB 也缺 2 欄；掃 sibling Java code 推 schema 會錯）。
2. **契約不可從 code 推**：response shape 一律對齊 `api_contract.md` A##，不從 sibling FE code 或 BE Processor code 推測（AR003 BUG-P4b-R4-CONTRACT / SO0062 教訓）。

grep 查證用於「規範沒寫到的落地細節」，不用於替代上述兩個 SSOT。
