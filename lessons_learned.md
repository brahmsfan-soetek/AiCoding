# Lessons Learned — SKILL 進化回饋累積

> 本檔案位於 AiCoding 專案，是所有專案回饋的**集中收集點**。
> SKILL 維護者定期從各專案的 `session_log.md`（repo 內）與 `~/.soetek-ai-coding/skill-feedback/{skill-name}.md`（repo 外）蒐集跨專案通用的系統性教訓，彙整到此處。
> 只記錄**跨專案通用的系統性教訓**，個案 bug 不記。

---

## v2 蒐集流程（2026-04-24 重構後）

```
專案 repo：Docs/spec/{code}/log/{code}_session_log.md
             ↓（本專案教訓）
~/.soetek-ai-coding/{專案名}/{編號}-{SKILL}-{時間}.summary.md
             ↓（session 歸檔）
~/.soetek-ai-coding/skill-feedback/{skill-name}.md
             ↓（對 SKILL 本身的改進建議）
        本檔案（AiCoding/lessons_learned.md）
             ↓（審視後納入）
SKILL.md / P2 prompt 自檢清單 更新
```

---

## 回饋給 P2（任務清單 / test_cases.md）

| # | 日期 | 來源專案 | 類型 | 描述 | 已納入 P2？ |
|---|------|---------|------|------|:---:|
| L-P2-01 | 2026-04-24 | AR003 | 遺漏 | `[processor]` task 必須列出「選填欄位」清單，供 P3-backend SG2 強制覆蓋 null/""/空白三種測試 | ✅（v3.0.0）|
| L-P2-02 | 2026-04-24 | AR003 | 粒度 | Store 相關 task 需區分 `[store-map]` 與 `[store-action]`（測試策略不同） | ✅（v3.0.0）|
| L-P2-03 | 2026-04-24 | AR003 | 格式 | `test_cases.md` 作為手測 checklist 時，「執行步驟」必須具體到「點哪個按鈕、填什麼值」，「預期結果」必須具體到「顯示什麼文字 / 數值」，不可含糊 | ✅（v3.0.0）|

---

## 回饋給 P3（實作品質）

| # | 日期 | 來源專案 | 類型 | 描述 | 已納入 P3？ |
|---|------|---------|------|------|:---:|
| L-P3-01 | 2026-04-24 | AR003 | 防護 | Processor 走 `:param IS NULL OR col = :param` pattern 時，選填欄位傳 `""` / 空白會讓 SQL 永遠不 match（`"" != NULL`），應在單元測試階段強制覆蓋 | ✅（p3-backend SG2）|
| L-P3-02 | 2026-04-24 | AR003 | 防護 | 前端 Store mapping helper（backend shape → frontend shape）若無測試，後端欄位 rename 時 bug 會延到手測才暴露（creditAmt vs creditLimit） | ✅（p3-frontend 契約測試）|
| L-P3-03 | 2026-04-24 | AR003 | 流程 | 前後端實作實際會分 session 做，SKILL 應對齊現實拆為 p3-backend / p3-frontend，共用 progress.md / session_log.md | ✅（v2 拆分）|
| L-P3-04 | 2026-04-24 | AR003 | 流程 | UI / UX / 樣式 / 文字類問題人眼 1 秒看出，寫單元測試 ROI 極低；前端只測「契約層」（service / store-map），其他類型由 PG 完工後整體手測 | ✅（p3-frontend 類型 tag）|
| L-P3-05 | 2026-04-24 | AR003 | 流程 | Artifact（progress.md / session_log.md / SQL）產出後應立即 commit，不能讓 PG 提醒 | ✅（三 P3 SKILL 皆有）|
| L-P3-06 | 2026-04-24 | AR003 | 流程 | session_log.md 應全程累積（每 session append），不只在結尾產出一次 | ✅（P3 SKILL 設計）|
| L-P3-07 | 2026-04-24 | AR003 | 流程 | session_log.md（repo 內）與 skill-feedback（repo 外）分檔：前者是本專案教訓、後者是對 SKILL 的改進建議 | ✅（P3 SKILL 設計）|
| L-P3-08 | 2026-04-24 | AR003 | 流程 | `Docs/spec/{code}/` 底下以 `plan/`（P2 產物）`log/`（P3 產物）子目錄分類 | ✅（P2 預設路徑）|

---

## 回饋給 P3-data（權限 / 測資）

| # | 日期 | 來源專案 | 類型 | 描述 | 已納入？ |
|---|------|---------|------|------|:---:|
| L-DATA-01 | 2026-04-24 | AR003 | 防護 | Entity 假設的欄位數與 DDL 實際欄位不一致時，不自主改 DDL，STOP 回報 PG 決定 | ✅（v1.0.0）|
| L-DATA-02 | 2026-04-24 | AR003 | 防護 | seed 資料必須帶特徵碼（如 `creator='e2e_seed'`），與真實資料分離便於清理 | ✅（v1.0.0）|
| L-DATA-03 | 2026-04-24 | AR003 | 防護 | DB 執行錯誤（外鍵 / 權限 / 欄位類型）不自主修，STOP 回報 PG | ✅（v1.0.0）|

---

## 架構級決策（v1 → v2）

| # | 日期 | 來源 | 類型 | 描述 |
|---|------|------|------|------|
| L-ARCH-01 | 2026-04-24 | AR003 | 廢除 | P4a（人工 UAT SKILL）廢除 — test_cases.md 加「狀態」欄直接當 checklist，PG 手勾即可，不需 SKILL 包裝 |
| L-ARCH-02 | 2026-04-24 | AR003 | 廢除 | P4b（Playwright E2E SKILL）廢除 — 第一次導入陣痛（基建 / seed / sessionStorage auth）+ P3/P4b 回合制成本（45 分鐘環境浪費 + 同根 bug 拖三輪）> 自動化回歸保護價值 |
| L-ARCH-03 | 2026-04-24 | AR003 | 設計 | SKILL 若假設前置條件成立（基建、DB、環境）但不做檢核，第一次導入必卡。應為每個 SKILL 設計 Step 0 前置檢核（或廢除對應 SKILL） |
| L-ARCH-04 | 2026-04-24 | AR003 | 設計 | SKILL 邊界用「清單式」（可動路徑 / 不可動路徑）優於「原則式」（只修自己的 spec）。後者在灰色地帶（cleanup.ts / playwright.config.ts）需逐項等授權 |
| L-ARCH-05 | 2026-04-24 | AR003 | 設計 | 基礎設施（backend / frontend dev server / DB）一律由 PG 啟動維護，SKILL 偵測異常應 STOP 回報，不自主啟停（AR003 教訓：stash drop 蓋 DB config、kill backend 浪費 45 分鐘）|

---

## 待觀察（v2 試用後回顧）

| # | 日期 | 項目 | 觀察要點 |
|---|------|------|---------|
| W-01 | 2026-04-24 | `[processor]` 選填欄位空值覆蓋 | AR004 試用時，SG2 這條規則實際抓到幾個 bug？是否過度嚴格？ |
| W-02 | 2026-04-24 | 前端契約測試 | `[service]` + `[store-map]` 的測試範圍是否重複或漏？實際防住幾個 contract mismatch？ |
| W-03 | 2026-04-24 | 手測 checklist 取代 P4a | 40-50 條 case 的手測體感（太累？執行步驟是否具體到人眼可對？）|
| W-04 | 2026-04-24 | 前後端分 session 共用 progress.md | 兩 session 更新同檔的衝突風險（通常不會同時跑但需留意）|

---

## 格式約定

- **L-XXX-NN** 為已納入 SKILL 的系統性教訓
- **W-NN** 為待觀察項目（v2 試用後回顧再決定是否納入）
- 每條 entry 須有：日期 / 來源專案 / 類型（遺漏 / 粒度 / 格式 / 防護 / 流程 / 廢除 / 設計）/ 描述
- 個案 bug 不記（那些留在 git log 與專案內 session_log.md）
