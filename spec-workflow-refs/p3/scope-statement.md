# Scope Statement — SG1 動手前 scope-lock

> **適用：** P3-be / P3-fe / P3-data
> **對應切入點：** 7（review/2026-04-09 direction.md）

每個 P3 SKILL 在 SG1 內必須先跑 Scope Statement 子段，動手前 lock 本次工作範圍。實作中若發現需超出 scope，STOP 回報 PG 由 PG 決定擴張或縮回，AI 不自行擴張。

## 三項必填內容

1. **Deliverable**（一句話）：本次預計產出什麼
   - P3-be：跑完 `backend_tasks.md` 內哪些 task（全部 / `B01–Bxx` 範圍 / 某類型 tag）+ 對應產出（Entity / SQL / Processor / Validator / SPI）
   - P3-fe：跑完 `frontend_tasks.md` 內哪些 task + 對應產出（service / store-map / page / dialog / i18n 等）
   - P3-data：產出 `{程式編號}_PERMISSION.sql` + `{程式編號}_SEED.sql` + 對帳結果 + 維護期 hand-off

2. **預期動到的範圍**：列實際清單
   - P3-be：backend 各層目錄下對應 `{程式編號}*` 檔（Entity / Mapper / Repository / Processor / Validator / Test 等）+ `progress.md` / `session_log.md`
   - P3-fe：frontend 各層目錄下對應 `{程式編號}*` 檔（service / store / types / page / dialog / i18n key 等）+ `progress.md` / `session_log.md`
   - P3-data：PERMISSION 涉及的 Menu / Role / MenuRole 等表名 + seed 涉及的業務表名 + SQL 檔位置 + `session_log.md`

3. **明示 out-of-scope**：列「本次不會動」的範圍
   - P3-be：不改 `current_schema_{程式編號}.md` / `api_contract.md`、不重構 sibling 程式、不動 `Docs/DDL`、不擴張到非 `{程式編號}` task、不寫前端 code
   - P3-fe：不改 `api_contract.md`、不重構 sibling 元件、不改全域 i18n / CSS、不擴張到非 `{程式編號}` task、不寫後端 code、不改 router config 之外的全域設定
   - P3-data：不改 schema / DDL、不動非本程式的 PERMISSION 配置、不清除既有 seed 殘留、不寫 backend / frontend code、不動其他程式的 seed

## 規約

實作中若發現需超出 scope（如要改契約 / schema / 順手重構 / 順手 cleanup / 順手調 dialog 風格 / 改全域 i18n 等），**STOP 回報 PG**，PG 決定擴張或縮回；AI 不自行擴張。

對齊 Insight 報告 35 wrong_approach + 12 excessive_changes 觀察、AR002Q 加 export feature、AR002 / AR003 順手重構相鄰程式碼、AR002 dialog width 過度修改、AR003 F20-F27 連跑 8 元件後一次驗收偏移等事件。
