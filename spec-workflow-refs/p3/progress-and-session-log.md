# progress.md / session_log.md 格式

> **適用：** P3-be / P3-fe / P3-data（三 SKILL 共用同一份 progress.md + session_log.md）

兩 session（p3-backend / p3-frontend）共用此檔。task prefix `B*` 為後端、`F*` 為前端。P3-data 不寫 progress.md（一次性產出），但 session_log.md 共用。

## Checkpoint 格式（`Docs/spec/{程式編號}/log/{程式編號}_progress.md`）

```markdown
# {程式編號} — P3 Progress

> 最後更新：{YYYY-MM-DD HH:mm}
> 當前分支：{branch}
> HEAD：{commit-hash}

## Task 清單來源
- backend: Docs/spec/{程式編號}/plan/{程式編號}_backend_tasks.md
- frontend: Docs/spec/{程式編號}/plan/{程式編號}_frontend_tasks.md

## 進度（只列已接觸 task）

| Task ID | 類型 | 狀態 | Commit | 備註 |
|---------|------|:----:|--------|------|
| B01 | [entity] | done | a1b2c3d | |
| B40 | [validator] | done | e4f5g6h | SG2 增加空值邊界測試 |
| B20 | [processor] | wip | — | Red 階段，測試已寫完 |

## 下一 Task 候選
- B21（processor，選填欄位：customerCode, riskLevel）
- B30（sql）

## Resume 指示（new session 啟動後）
1. 讀本檔、確認當前分支、pull 最新
2. 執行 `/impl-be` 或 `/impl-fe`
3. SG1 回報上次進度，PG 確認繼續點
```

**狀態值：** `done` / `wip` / `skip` / `todo`
**更新時機：** 每個 task 的 SG3 之前
**Resume 時機：** SG1 之前偵測到檔案存在時觸發

## Session Log 格式（`Docs/spec/{程式編號}/log/{程式編號}_session_log.md`）

兩 session 共用此檔。每個 session 結束前 append 一個章節，不覆寫。最後一個 session 收工（SKILL 完工）時，額外 append 「## 維護期 hand-off」段（格式見 [`completion-and-handoff.md`](completion-and-handoff.md)）。

```markdown
# {程式編號} — P3 Session Log

## Session #1 — 2026-04-17 後端（B01–B40）

### 關鍵決策
- Entity 風格採 record class（專案慣例）
- Validator 採靜態工具類，無 DI

### 問題與教訓
- B40 格式化邏輯在規格中有歧義，跟 SA 確認後採 FIFO

### 下 session 注意
- B20 Processor 實作前，確認 CustomerQuery 的 SQL provider SPI 已就緒

## Session #2 — 2026-04-20 後端（B20–B30）
...

## Session #3 — 2026-04-21 前端（F01–F20）
...

---

## 維護期 hand-off

> 由 SKILL 完工時 AI 從 progress.md 備註欄、本檔「下 session 注意」、SG2 對照表偏離項主動歸納初稿，PG 過目修改。SKILL 結束後新發現的 bug / 微調走 ad hoc 派修，**不再回寫本檔**。

### 上線前必補（blocker）
> 留空殼 / 暫用 stub / 未實作的必要功能。例如：「B52 JasperReports 模板僅留空殼，待設計師補正版」。無項目時可省略或填「（無）」。

- [ ] {來源 task id 或 session 章節}：{描述}

### 技術債（non-blocker）
> 暫用 workaround / 元件限制 / 未來 refactor 候選。例如：「F05 SLov emit 限制，需 wrap 自訂事件」「B20 CustomerQuery 改走 NativeSqlService，待未來 SPI 補齊後可退回」。無項目時可省略或填「（無）」。

- [ ] {來源 task id 或 session 章節}：{描述}
```
