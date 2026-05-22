# Session 歸檔流程

> **適用：** P3-be / P3-fe / P3-data

全部 task 完成後（或本 session 收工時），將當前 session 完整紀錄複製到集中目錄，供 SKILL 維護者日後審視。

## 歸檔流程

1. **決定專案名稱：** 取 git remote origin 的 repo 名；若無 remote 則取當前目錄名。

2. **決定檔名：**
   - P3-be：`{程式編號}-P3-backend_{yyyyMMdd}_{HHmm}`
   - P3-fe：`{程式編號}-P3-frontend_{yyyyMMdd}_{HHmm}`
   - P3-data：`{程式編號}-P3-data_{yyyyMMdd}_{HHmm}`

3. **定位當前 session 檔案：** 掃描 `~/.claude/projects/{當前專案路徑的 Claude 編碼}/` 下最近修改的 `.jsonl` 檔。

4. **建立目標目錄：** `~/.soetek-ai-coding/{專案名}/`（若不存在則建立）。

5. **複製檔案：**
   - `{uuid}.jsonl` → `~/.soetek-ai-coding/{專案名}/{檔名}.jsonl`
   - `{uuid}/subagents/*` → `~/.soetek-ai-coding/{專案名}/{檔名}/subagents/`（若有）

6. **產出結構化摘要：** `~/.soetek-ai-coding/{專案名}/{檔名}.summary.md`（從 progress.md + session_log.md 取內容）

## SKILL 本身改進建議（給維護者）

PG 使用 SKILL 發現的改進建議，寫到 `~/.soetek-ai-coding/skill-feedback/{skill-name}.md`（repo 外）。此檔不建空殼，僅在有實質內容時 append。

對應檔名：
- P3-be：`spec-p3-backend.md`
- P3-fe：`spec-p3-frontend.md`
- P3-data：`spec-p3-data.md`
