# Commit Rules — artifact 合一 commit + 標題格式

> **適用：** P3-be / P3-fe / P3-data

## 1. Artifact 合一 commit

`progress.md` / `session_log.md` 必須跟著實作 code 一起 commit，**不獨立 commit**。

- **Task loop 中**：code + `progress.md` 一起 commit
- **本 session 收尾時**：最後一個 task 的 commit 範圍納入 `session_log.md`（在該 task SG3 前 append），不在所有 task 結束後另開一個 commit
- **SKILL 完工時**（即全部 task 的最後一個）：上述 commit 範圍再額外納入「## 維護期 hand-off」段
- **P3-data 特例**：SQL 檔 + `session_log.md` 同一個 commit（無 progress.md，因為 P3-data 是一次性產出）

理由：避免「文件 commit」與「實作 commit」分離造成 review 跳檔、且 ad hoc 跑時容易遺漏 doc commit。

## 2. Commit 標題格式

```
{type}({模組}): {動作描述}
```

範例：
- `feat(ar003): add credit calculation`
- `feat(ar003): add cust query validator`
- `fix(ar003): correct sale division filter`
- `feat(ar003): wire customer store mapping`
- `fix(ar003): align credit field rename`
- `docs(ar003): add permission + seed SQL`

## 3. Commit 標題禁止含 task id

`B01` / `B40` / `F01` / `F08` / `T12` 等私人代號**只放 `progress.md` 與 `session_log.md` 內部**，不放：
- commit 標題
- PR title
- branch 名

task id 可以放 commit body 描述內，不放標題。

理由：task id 是 SKILL 內部代號，對 git history / PR 讀者沒有意義；標題乾淨化便於日後 git log 檢索。
