# SKILL 完工三條件 + 維護期 hand-off + SKILL 邊界

> **適用：** P3-be / P3-fe / P3-data
> **覆蓋區間聲明：** SKILL 覆蓋的是**主輪實作**；整合手測、手測發現的 bug 修復、UI 微調（往往是實際工時的大頭）在 SKILL 邊界外走 ad hoc——這是有意的邊界設計，不是已被 SKILL 涵蓋。

## 完工三條件（全部成立才算 SKILL 結束）

| # | 條件 | 備註 |
|---|------|------|
| 1 | 本 SKILL 的 task 全部 `done`（`progress.md` 內 `B*` / `F*` 沒有 `wip` / `todo`） | P3-data 對應為「`PERMISSION.sql` + `SEED.sql` 已產出 + 對帳通過」 |
| 2 | 收尾報告產出（純 console，不寫檔，不另開 commit） | |
| 3 | 維護期 hand-off 已 append 至 `session_log.md`（含 AI 初稿，PG 修） | 在最後一個 task 的 commit 範圍內 append；P3-data 在「append session_log + Commit SQL 檔」步驟 append |

## 維護期 hand-off 段

在 SKILL 完工時，於最後一個 task 的 commit 範圍內 append `session_log.md` 固定段「`## 維護期 hand-off`」。

### 兩類分項

1. **上線前必補（blocker）**：留空殼 / 暫用 stub / 未實作的必要功能
   - P3-be 例：「B52 JasperReports 模板僅留空殼，待設計師補正版」
   - P3-fe 例：「F30 dialog 確認按鈕暫用 alert，待 UI 補正式 confirm 元件」
   - P3-data 例：「未產的 PERMISSION 角色待 PG 與 SA 確認後補」「seed 覆蓋不到的 test_cases 條目」「執行錯誤未解項目」

2. **技術債（non-blocker）**：暫用 workaround / 元件限制 / 未來 refactor 候選
   - P3-be 例：「B20 CustomerQuery 改走 NativeSqlService，待未來 SPI 補齊後可退回」
   - P3-fe 例：「F05 SLov emit 限制，需 wrap 自訂事件」「i18n 暫用 namespace」「CSS workaround」
   - P3-data 例：「seed 特徵碼 cleanup 指令」「依賴的外部資料（如 GL 設定）未驗」「未來 seed 量擴充候選」

### 初稿來源（AI 自動歸納）

- `progress.md` 備註欄出現的 warning / skip
- 本 session `session_log.md`「下 session 注意」中與「驗收 / 上線 / 維護」相關的條目
- 各 task 的 SG2 對照表偏離項（PG 過了但仍是 hand-off 候選）
- P3-data：SG1 報告中提到的「seed 覆蓋率」「schema 不一致」、執行錯誤、PG 在 SG1/SG2 提出但本批未處理的擴充項

### 規約

- 每項註明來源：`{task id 或 session 章節}：{描述}`
- 無項目可歸納時，該類可省略（或列「（無）」皆可）

## 收尾報告（純 console，不另開 commit）

- 完成的 task 清單（按類型 tag 分類計數；P3-data 為權限筆數 + seed 覆蓋的 test_cases 數）
- 測試通過數（P3-be 限 `[validator]`；P3-fe / P3-data 視情況略）
- SG2 偏離 warning（若有）
- hand-off 初稿摘要（提醒 PG 過目修改）
- 建議 PG 下一步：
  - P3-be 完工：另起 session 執行 `/impl-fe`（前端）或 `/data`（權限 + 測資）
  - P3-fe 完工：另起 session 執行 `/data`（若尚未做），`/data` 跑完後開瀏覽器照 `test_cases.md` 整體手測
  - P3-data 完工：開瀏覽器照 `test_cases.md` 逐條手測

## SKILL 邊界（完工後不入本 SKILL 的事）

以下事項落到此 SKILL 之外：

- 整合手測（PG 開瀏覽器照 `test_cases.md` 跑）
- 整合手測發現的 bug 修復 → **ad hoc 派 AI 修，不寫入 `progress.md` / `session_log.md`**
  - 邏輯類 bug（validator / processor / mapping）的 ad hoc 修，建議搭配 [`lightweight-review-prompt.md`](lightweight-review-prompt.md) 另開 session 獨立 review（原 session 自己修自己的 code 踩 §8 盲區；實驗中機制，見 05 D9）
- UI 微調、上線部署、維運監控
- P3-data 特有：seed 資料殘留 cleanup（特徵碼提供，cleanup 由 PG 或 ad hoc 自行執行）；生產 DB 權限佈署

理由：避免文件膨脹失焦；ad hoc 修走 git log + commit message 自身紀錄。**本 SKILL 覆蓋主輪實作；整合手測收尾與 bug 修復（往往是最大工時段）在 SKILL 外走 ad hoc——這是有意的邊界設計，而非已被涵蓋**。SKILL 該結束就結束，後面是維護期。
