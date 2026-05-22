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
| L-P3-01 | 2026-04-24 | AR003 | 防護 | Processor 走 `:param IS NULL OR col = :param` pattern 時，選填欄位傳 `""` / 空白會讓 SQL 永遠不 match（`"" != NULL`） | ⚠️ **v2.x 修正**（commit d4ce9c6）：原 v2 解法「P3-backend SG2 強制空值覆蓋單元測試」是套套邏輯（mock 設成預期再驗自己），AR003 BUG-P4b 沒擋到；改 SG2 雙對照表（api_contract + current_schema）+ PG 手測涵蓋空值 SQL pattern |
| L-P3-02 | 2026-04-24 | AR003 | 防護 | 前端 Store mapping helper（backend shape → frontend shape）若無防線，後端欄位 rename 時 bug 會延到手測才暴露（creditAmt vs creditLimit） | ⚠️ **v2.x 修正**（commit d4ce9c6）：原 v2 解法「p3-frontend 契約測試」（mock fetch + shape 斷言）對「fixture 對但實際 BE 已 rename / camelCase」擋不下（SO0062 mapper 28 個 contract test 沒擋）；改 SG2 對照 api_contract A##（FE/BE 共讀契約 SSOT） |
| L-P3-03 | 2026-04-24 | AR003 | 流程 | 前後端實作實際會分 session 做，SKILL 應對齊現實拆為 p3-backend / p3-frontend，共用 progress.md / session_log.md | ✅（v2 拆分）|
| L-P3-04 | 2026-04-24 | AR003 | 流程 | UI / UX / 樣式 / 文字類問題人眼 1 秒看出，寫單元測試 ROI 極低；前端契約層走 SG2 對照 api_contract（v2.x 拔 mock test），其他類型由 PG 完工後整體手測 | ✅（p3-frontend 類型 tag + v2.x SG2 對照表）|
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

## 架構級決策（v1 → v2 → v2.x）

| # | 日期 | 來源 | 類型 | 描述 |
|---|------|------|------|------|
| L-ARCH-01 | 2026-04-24 | AR003 | 廢除 | P4a（人工 UAT SKILL）廢除 — test_cases.md 加「狀態」欄直接當 checklist，PG 手勾即可，不需 SKILL 包裝 |
| L-ARCH-02 | 2026-04-24 | AR003 | 廢除 | P4b（Playwright E2E SKILL）廢除 — 第一次導入陣痛（基建 / seed / sessionStorage auth）+ P3/P4b 回合制成本（45 分鐘環境浪費 + 同根 bug 拖三輪）> 自動化回歸保護價值 |
| L-ARCH-03 | 2026-04-24 | AR003 | 設計 | SKILL 若假設前置條件成立（基建、DB、環境）但不做檢核，第一次導入必卡。應為每個 SKILL 設計 Step 0 前置檢核（或廢除對應 SKILL） |
| L-ARCH-04 | 2026-04-24 | AR003 | 設計 | SKILL 邊界用「清單式」（可動路徑 / 不可動路徑）優於「原則式」（只修自己的 spec）。後者在灰色地帶（cleanup.ts / playwright.config.ts）需逐項等授權 |
| L-ARCH-05 | 2026-04-24 | AR003 | 設計 | 基礎設施（backend / frontend dev server / DB）一律由 PG 啟動維護，SKILL 偵測異常應 STOP 回報，不自主啟停（AR003 教訓：stash drop 蓋 DB config、kill backend 浪費 45 分鐘）|
| L-ARCH-06 | 2026-04-25 | AR003 + SO0062 | 廢除 | **Mock-based 單元 / 契約測試 ROI 低**（commit d4ce9c6）— Processor mock test 是套套邏輯（mock 設成預期再驗自己）、前端 contract test 抓 typo OK 但跨層 rename / camelCase 漂移擋不下；改 SG2 對照表（api_contract A## + current_schema 跨層 SSOT），整合驗證由 PG 手測涵蓋 |
| L-ARCH-07 | 2026-04-25 | AR003 | 設計 | **跨層 SSOT 必要性**（commit 4079842）— api_contract.md（FE/BE 共讀契約）+ current_schema.md（MCP 唯讀 DESCRIBE 產出）作跨層權威來源；不從 sibling code 推、不讀 DDL，缺檔 STOP 回 P2 補 |
| L-ARCH-08 | 2026-04-25 | Insight 報告 | 設計 | **Scope-lock 動手前必跑**（commit fb9f2b4）— SG1 第一個子段為 Scope Statement（Deliverable / 預期動到 / out-of-scope）；對齊 35 wrong_approach + 12 excessive_changes 觀察，攔截 AR002Q 加 export、AR002/AR003 順手重構等事件 |
| L-ARCH-09 | 2026-04-25 | AR002 B03 / AR003 B21,F11 | 設計 | **TDD Red-first 紀律外部化**（commit 59265a3）— PreToolUse Bash + git commit filter hook 自動跑 typecheck + module test；失敗 block + 要求通知 PG 不自動修。spike 3 真正擋「測試該紅而沒紅」這類 typecheck 抓不到的友擦 |
| L-ARCH-10 | 2026-04-25 | AR002 主輪後 ad hoc | 設計 | **SKILL 完工三條件 + ad hoc 不入 SKILL**（commit 6c4ef8a）— task done + 收尾報告 + 維護期 hand-off append；維護期 bug 走 ad hoc 派修，不寫 progress / session_log（避免文件膨脹失焦）。AR002 主輪後 ad hoc 沒紀錄是健康狀態而非缺失 |
| L-ARCH-11 | 2026-05-22 | spec-workflow 自身 | 設計 | **共用規約抽離**（commit ed93e9a / 131dc3e）— P3 三 SKILL 重複 30-40%（Scope / commit / handoff / progress / 歸檔 / hook 設計）抽到 `spec-workflow-refs/p3/`；shared 不放 `skills/` 下避免被當 SKILL 載入，由 plugin source=`./` 涵蓋安裝範圍 |

---

## 待觀察（v2 / v2.x 試用後回顧）

| # | 日期 | 項目 | 觀察要點 | 狀態 |
|---|------|------|---------|---|
| ~~W-01~~ | ~~2026-04-24~~ | ~~`[processor]` 選填欄位空值覆蓋~~ | ~~SG2 這條規則實際抓到幾個 bug？是否過度嚴格？~~ | **OBSOLETE**（v2.x commit d4ce9c6 拔掉 mock test） |
| ~~W-02~~ | ~~2026-04-24~~ | ~~前端契約測試~~ | ~~`[service]` + `[store-map]` 的測試範圍是否重複或漏？~~ | **OBSOLETE**（v2.x commit d4ce9c6 拔掉 mock test） |
| W-03 | 2026-04-24 | 手測 checklist 取代 P4a | 40-50 條 case 的手測體感（太累？執行步驟是否具體到人眼可對？）| 待實際專案試用 |
| W-04 | 2026-04-24 | 前後端分 session 共用 progress.md | 兩 session 更新同檔的衝突風險（通常不會同時跑但需留意）| 待實際專案試用 |
| W-05 | 2026-04-25 | SG2 對照表攔截率（取代 W-01 / W-02） | PG 在 SG2 對照表多常發現偏離？是否真的能擋下 BUG-P4b 類事件？整合手測階段的 contract/schema bug 是否真的下降？ | 待實際專案試用 |
| W-06 | 2026-04-25 | commit-time hook（spike 3） | 首次 cold build 體感、incremental cache 穩態速度、vitest related false-positive 率、block 後 AI 是否遵守不自動修 | 待實際專案試用 |
| W-07 | 2026-04-25 | Scope Statement 攔截率 | AI 在實作中發現需超出 scope 時是否真的 STOP？攔截「順手重構 / 加 feature」事件次數？ | 待實際專案試用 |
| W-08 | 2026-05-22 | 共用規約抽離後的 silent drift | 三 SKILL 後續演進時 shared 改動是否同步影響三邊？plugin 安裝後相對路徑是否仍可解析？ | 待實戰累積 |

---

## 格式約定

- **L-XXX-NN** 為已納入 SKILL 的系統性教訓；若被後續演進覆蓋，在「已納入？」欄標 ⚠️ + 註記
- **W-NN** 為待觀察項目（試用後回顧再決定是否納入）；若被後續演進廢除（如 mock test 拔掉），標 OBSOLETE 不刪
- 每條 entry 須有：日期 / 來源專案 / 類型（遺漏 / 粒度 / 格式 / 防護 / 流程 / 廢除 / 設計）/ 描述
- 個案 bug 不記（那些留在 git log 與專案內 session_log.md）
