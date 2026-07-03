# 04 — 通用型 SKILL 架構設計

> 初版設計日期：2026-04-16
> **v2 重構日期：2026-04-24**（基於 AR003 實戰 feedback，廢除 P4a/P4b，P3 拆前後端，新增 P3-data）
> **v2.x 演進：2026-04-25 ~ 2026-05-22**（拔 Processor / mapper mock test 改雙對照表、Scope Statement、commit-time hook、共用規約抽離；詳見「實作記錄」段）
> 狀態：v2.x 已實作

## 背景與動機

### v1（2026-04-16）

AiCoding 專案已有 2 個 SKILL（spec-p1-digest-flow v1.2.0、spec-p2-tasking v1.0.0），以及 3 個暫停的特化 SKILL（eap-agentic-coding、eap-agentic-coding-lite、serp-agentic-coding）。

特化 SKILL 的問題：
- 模板寫死了技術棧（Vue 3 + Quarkus + MSSQL + LOV Processor）
- 換專案就要重寫模板
- eap-agentic-coding-lite 走「一個大 SKILL 包所有 Phase」路線後標記暫停

v1 決定：將整體工作流程拆為 **5 個通用型 SKILL**（P1 / P2 / P3 / P4a / P4b），規範和實作細節寫在各自專案的 `CLAUDE.md` 內。

### v2（2026-04-24）重構動機

v1 在 AR003（serp_struct）實戰後累積 18 條 feedback（P3 6 條 + P4b 12 條）。根因分析收斂到兩個核心問題：

1. **P3 統一走 TDD 並不符合實際開發效益** — UI / UX / 樣式 / 文字類的 bug 人眼 1 秒看出，寫單元測試 ROI 極低；但 P3 統一套 TDD 導致前端大量 task 寫了無價值的測試。
2. **P4a/P4b 的 ROI 不成比例** — P4b 第一次導入陣痛（基建、seed、auth fixture、sessionStorage 踩坑）加上「P3 單點修 × P4b 只報不修」的回合制成本，實測 4 小時 session 有 40% 浪費在環境與回合 context switch。用戶反映「PG 開瀏覽器照 test_cases.md 手測」比整套 E2E 流程快得多。

v2 的設計哲學：
- **以 task 類型 tag 分流測試策略**（不再統一 TDD）
- **P4a/P4b 整個拔掉**（手測取代自動化 UAT + E2E）
- **前後端分 SKILL**（實戰上就是分兩 session 做，SKILL 應對齊現實）
- **新增 spec-p3-data**（權限 + 測試資料準備，獨立成 SKILL 服務手測）

---

## v2 設計原則

### 通用化路線：(a) 流程骨架通用

- SKILL 只定義 MUST-DO checklist、stop gate、角色分工
- 具體的 entity / component / test 寫法**全讀專案 `CLAUDE.md`**
- `CLAUDE.md` 作為索引，指向各類規範文件
- **不掃 code 歸納 pattern**（AI 行為、會漂移），改讀明確寫好的規範（deterministic）

### 自動化程度：半自動

- 每個 task 前 stop gate 確認、完成後問要不要繼續
- 不是全自動（context rot + 品質漂移風險）
- 不是手動輔助（失去 SKILL 價值）

### 測試策略：類型 tag 驅動

v1 採「統一 TDD」，v2 改「類型 tag 驅動」。P2 產 task 時標 tag，P3 依 tag 分流。

**v2.x 演進**：原 v2 對 Processor 走「完整 TDD（Mockito）+ 空值覆蓋」、對 service/store-map 走「mock-based 契約測試」。實戰後（commit d4ce9c6, 2026-04-25）證實兩者皆為「mock 設成預期再驗自己」的套套邏輯，AR003 BUG-P4b 全是這類測試沒擋到的；改為 SG2 雙對照表 / 靜態對照（無 mock test），整合驗證由 PG 手測涵蓋（透過 test_cases.md + spec-p3-data 產 seed）。

**後端 tag（v2.x 現況）：**

| Tag | P3-backend 測試 / 對照策略 |
|---|---|
| `[validator]` | 完整 TDD（JUnit 純或 Mockito，Red-Green）|
| `[processor]` | **無 mock-based 單元測試**；SG2 走 api_contract A## + current_schema 雙對照表（靜態檢查）|
| `[sql]` | 無 P3 測試；SG2 對照 current_schema 欄位 / 型別 |
| `[entity]` | 無測試；SG2 對照 current_schema 欄位 / 型別 / nullable |
| `[spi]` | 無測試 |

**前端 tag（v2.x 現況）：**

| Tag | P3-frontend 測試 / 對照策略 |
|---|---|
| `[service]` | **無 mock-based 測試**；SG2 對照 api_contract A##（path / method / payload / response shape 靜態檢查）|
| `[store-map]` | **無 mock-based 測試**；SG2 對照 api_contract A##（後端 shape → 前端 shape mapping 靜態檢查）|
| `[store-action]` | 無測試 |
| `[types]` | 無測試（typecheck 已蓋） |
| `[page]` / `[dialog]` | 無測試（UI 由手測） |
| `[i18n]` / `[router]` | 無測試（靜態資料） |

### 獨立性：session 分離

- Subagent 不產出進 git 的檔案（實作 / 測試 code 必須由主 session 撰寫）
  - 前例教訓：session-791acadc 中 subagent 寫程式碼時 prompt 與模板矛盾，4 個 Vue 檔案全錯
  - 可委託 subagent 的操作：跑 lint / typecheck / test 指令、搜尋既有程式碼參考
- 後端 / 前端 / data 各自獨立 session，共用 `progress.md` / `session_log.md`（task prefix B*/F* 區分）

---

## v2 架構總覽

### 5 個 SKILL

| # | SKILL 名 | 定位 | 觸發 | 工作目錄 | v2 狀態 |
|---|---------|------|------|---------|-------|
| P1 | spec-p1-digest-flow | 規格消化 S0–S4 | `/spec` | SA 資料夾 | 現有，不動 |
| P2 | spec-p2-tasking | 任務清單 + 類型 tag + 手測 checklist | `/tasking` | 專案 repo | v3 重構（加 tag、test_cases 改手測格式） |
| P3 be | spec-p3-backend | 後端 tag 分流 TDD | `/impl-be` | 專案 repo | 新建（拆自原 P3）|
| P3 fe | spec-p3-frontend | 前端 tag 分流：service/store-map SG2 對照 api_contract、UI 完工後整體手測 | `/impl-fe` | 專案 repo | 新建（拆自原 P3）|
| P3 data | spec-p3-data | 權限 + 測資 SQL | `/data` | 專案 repo | 新建 |

### 銜接圖

```
┌── P1 spec-p1-digest-flow（SA 資料夾）
│   S0→S4，輸出規格統計最終版
└───┬──── 把規格 + UI 搬進專案 repo
    ▼
┌── P2 spec-p2-tasking（專案 repo）
│   讀 CLAUDE.md 索引 → 讀規範文件
│   產 3 份清單：frontend_tasks（含 tag）/ backend_tasks（含 tag + Processor 選填欄位）/ test_cases（手測 checklist）
└───┬──── 另起 session
    ▼
┌── P3-backend spec-p3-backend（專案 repo）
│   /impl-be
│   tag 分流：validator TDD；processor 雙對照表（無 mock test）；sql/entity/spi 對照 current_schema 無測試
└───┬──── 另起 session
    ▼
┌── P3-frontend spec-p3-frontend（專案 repo）
│   /impl-fe
│   tag 分流：service/store-map SG2 對照 api_contract（無 mock test）；UI/types/i18n 無測（完工後 PG 整體手測）
└───┬──── 另起 session
    ▼
┌── P3-data spec-p3-data（專案 repo）
│   /data
│   產 PERMISSION.sql + SEED.sql → SG1 審 → SG2 授權 → 執行
└───┬──── PG 手測
    ▼
    PG 開瀏覽器照 test_cases.md 逐條勾選 → 發現 bug ad hoc 派 AI 修
```

---

## 已廢除的 SKILL（v1 → v2）

| 原 SKILL | v2 狀態 | 理由 |
|---|---|---|
| spec-p4a-uat | **廢除** | 手測直接對 test_cases.md 的 checklist 欄，不需要 SKILL 包裝 |
| spec-p4b-e2e | **廢除** | 第一次導入陣痛 + P3×P4b 回合制成本過高；PG 手測比 Playwright 自動化快 |
| spec-p3-implementing（原統一 P3）| **拆解** | 拆成 p3-backend / p3-frontend 兩個，並取消統一 TDD |

---

## 關鍵設計決策（v2 新增 / 修訂）

| # | 決策 | v1 選項 | v2 結論 | 理由 |
|---|------|--------|--------|------|
| D12（新） | P3 是否統一 TDD | v1: 統一 TDD | v2: **類型 tag 驅動**（邏輯 heavy 走 TDD，UI heavy 走手測） | AR003 實戰顯示 UI 類寫測試 ROI 極低，人眼 1 秒看出的問題寫測試要 10 分鐘 |
| D13（新） | P3 是否分前後端 | v1: 單一 P3 | v2: **拆 p3-backend / p3-frontend** | 實戰就是分兩 session 做；兩邊測試框架、tag 集合、策略都不同 |
| D14（新） | P4a UAT 是否保留 | v1: 保留 | v2: **廢除** | test_cases.md 加「狀態」欄直接當 checklist，PG 手勾即可 |
| D15（新） | P4b E2E 是否保留 | v1: 保留 | v2: **廢除** | 基建陣痛 + 回合制成本 > Playwright 帶來的回歸保護；手測優先 |
| D16（新） | 測試資料（seed）定位 | v1: P4b 附屬 | v2: **獨立 SKILL spec-p3-data** | seed 是手測前提，獨立成 SKILL 讓 AR015、AU010 等後續程式可重複使用 |
| D17（新） | test_cases.md 定位 | v1: 可轉 Playwright spec 的 5 欄 | v2: **手測 checklist 6 欄（加「狀態」）** | 配合廢除 P4b |
| D18（新） | task 類型 tag | v1: 無 | v2: **必填** | P3 分流測試 / 對照策略的唯一依據；SG2 對照表的啟動條件 |
| D19（v2.x） | Processor 是否寫 mock-based 單元測試 | v2: 完整 TDD + 空值覆蓋 | v2.x（commit d4ce9c6）: **不寫**，改 SG2 雙對照表（api_contract + current_schema） | 「mock 設成預期再驗自己」是套套邏輯，AR003 BUG-P4b 全是這類測試沒擋到的；token 高 ROI 低 |
| D20（v2.x） | 前端 service/store-map 是否寫 mock-based 契約測試 | v2: 寫契約測試 | v2.x（commit d4ce9c6）: **不寫**，改 SG2 對照 api_contract A## | mock fixture 與真實 BE 落地容易漂移（SO0062 mapper camelCase：28 個 contract test fixture 對但實際後端已 camelCase）；契約對照表更直接 |
| D21（v2.x） | api_contract.md / current_schema.md 跨層 SSOT | v2: 隱含 | v2.x（commit 4079842）: **明確制度化** — FE/BE 共讀 api_contract.md A##，所有 Entity/SQL/seed 對齊 current_schema.md（透過 MCP MySQL 唯讀 DESCRIBE 產出） | 直擊 AR003 BUG-A1（規格 17 欄、DDL 15 欄、真 DB 也缺 2 欄）+ BUG-P4b-R4-CONTRACT |
| D22（v2.x） | Scope Statement（SG1 動手前 scope-lock）| v2: 無 | v2.x（commit fb9f2b4）: **必跑** — Deliverable / 預期動到 / out-of-scope | 對齊 Insight 報告 35 wrong_approach + 12 excessive_changes 觀察、AR002Q export feature 擴張、AR002/AR003 順手重構等事件 |
| D23（v2.x） | commit-time hook（typecheck + module test）| v2: 無 | v2.x（commit 59265a3）: **可選安裝**（spike 3 預設）— PreToolUse Bash + git commit filter，失敗 block | 補位「AI 跳過跑 typecheck 直接報 green」極端；spike 3 真正擋 AR002 B03 / AR003 B21 / F11「測試該紅而沒紅」事件 |
| D24（v2.x） | SKILL 完工三條件 + 維護期 hand-off + ad hoc 不入 SKILL | v2: 模糊 | v2.x（commit 6c4ef8a）: **明確** — task done + 收尾報告 + hand-off append；維護期 bug 走 ad hoc 不寫 progress/session_log | AR002 主輪後 ad hoc 沒紀錄是健康狀態，SKILL 該結束就結束 |
| D25（v2.x） | P3 共用規約抽離 | v2: 各 SKILL 自抄 | v2.x（這次 commit）: **抽到 `spec-workflow-refs/p3/`** | 三 SKILL 重複 30-40%（Scope / commit / handoff / progress 格式 / 歸檔 / hook 設計）；抽出後一處改三處生效，並修了 README ↔ SKILL drift |
| D26（v2.2） | 「讀規範、不掃 code」是否維持絕對禁令 | v2.x: 絕對禁令 | v2.2（2026-07-03，依 G2-05/G3 優先序 7）: **鬆綁為「grep 開門 + 輕量指路」** — 規範權威仍＝CLAUDE.md 索引；容許 grep/glob 查證既有 code 落地細節；禁止盲目複製歷史 anti-pattern；schema / 契約兩 SSOT 不可從 code 推（修訂 v1 D4） | 三方審查同向最強一條：研究 §2 支持工具式檢索 + SO0062/AR003 實戰必需；絕對禁令把研究支持、實戰必需的行為禁掉了 |
| D27（v2.2） | 寫審分離缺口（§7 附和 + §8 盲區）如何補 | v2.x: 無（僅同 session 自檢） | v2.2（2026-07-03，依 G2-02）: **輕量獨立 review session（零驗證實驗、預設關）** — 限邏輯類 task，PG 另開乾淨 session 餵規格條目 + diff；prompt 範本＝`spec-workflow-refs/p3/lightweight-review-prompt.md`（抽救自 eap 反附和設計，不借 eap ROI 信用）；退場條件見 05 D9 | eap 重型三 Agent 編排被 TM002 證偽（ROI 負），但寫審分離概念不連坐；以主線可承受的輕量、有退場條件的形式回歸 |
| D28（v2.2） | eap 可移植零件的去留 | 特化砍除時一併刪 | v2.2（2026-07-03，補做 G3 優先序 3 的「砍前先救」）: **抽救 2 hook + review prompt 設計至 `spec-workflow-refs/p3/`** — `hooks/block-test-edit.sh`（測試唯讀結構強制）+ `hooks/silent-test-pass.sh`（成功靜默失敗詳述）+ `lightweight-review-prompt.md`；hook 範本標注「eap 時代環境變數介面，接線前須依現行 stdin JSON 介面改寫」 | 兩 hook 是全套裡唯一完整落實 03 P6/P7 的範例；commit 81cbd5e 砍特化時未先抽救（違 G3 優先序），本次自 `81cbd5e^` 取回 |
| D29（v2.2） | 模型選擇指引 | v2.x: 主線完全缺席 | v2.2（2026-07-03，依 G2-12）: **P2 / P3-be / P3-fe / P3-data 核心原則各加一行** — 邏輯類 task 與長 context 階段建議用最強可用模型 | §3 研究列「最重要的決策」；三方一致、成本接近零 |

---

## v1 保留的決策（不變）

| # | 決策 | 結論 |
|---|------|------|
| D1 | 通用化路線 | (a) 流程骨架通用，模板讀 CLAUDE.md |
| D2 | 自動化程度 | 半自動（stop gate + PG 裁判） |
| D3 | Subagent 角色 | 不產出進 git 的檔案，只能跑指令 / 搜尋 |
| D4 | 專案 context 來源 | 讀 CLAUDE.md 索引~~，不掃 code~~（v2.2 修訂：grep 開門 + 輕量指路，見 D26） |

---

## 「SKILL ↔ 專案」契約

SKILL 不綁專案，`CLAUDE.md` 是 SKILL 和專案之間的契約文件。

| 項目 | 用到的 SKILL |
|------|------------|
| 任務清單既有分類 / tasks/ 目錄格式 | P2 |
| 後端測試框架 + 執行指令（JUnit / Mockito） | P3-backend |
| 前端測試框架 + 執行指令（Vitest / Jest） | P3-frontend |
| Lint / typecheck 指令 | P3-backend / P3-frontend |
| Commit 規範 | 全部 P3 |
| 後端目錄結構、Entity / Processor / Validator 命名 | P3-backend |
| 前端目錄結構、元件 / Store / Service 命名 | P3-frontend |
| 權限表設計、Menu / Role 慣例 | P3-data |
| DB schema / DDL 路徑 | P3-data |
| 既有 component / API / Entity pattern 範例路徑 | P2 + P3 |

---

## AR003 feedback 對應表

| 原 feedback | v2 解法 | v2.x 後續演進 |
|---|---|---|
| P3 F1 artifact commit | 三 P3 SKILL 皆加入「artifact 即 commit」原則 | 抽到 `spec-workflow-refs/p3/commit-rules.md` |
| P3 F2 session log 累積 | 三 P3 SKILL 共用 `session_log.md`，每 session append | 格式抽到 `spec-workflow-refs/p3/progress-and-session-log.md` |
| P3 F3 session log vs skill feedback 分檔 | 分檔：repo 內 `session_log.md` / repo 外 `~/.soetek-ai-coding/skill-feedback/{skill-name}.md` | — |
| P3 F4 progress.md 瘦身 + 三檔分工 | p3-backend SKILL 明列「地圖 / 足跡 / 遊記」三檔 | — |
| P3 F5 plan/log 子目錄 | P2 預設輸出 `Docs/spec/{程式編號}/plan/`，P3 輸出 `log/` | — |
| P3 F6 測試層級決策框架 | **廢除（由 task 類型 tag 解決）** | — |
| P4b F1-F12 | **全部作廢（廢除 P4b）** | — |
| P4b F4 contract mismatch（後端 `creditAmt` vs 前端 `creditLimit`）| ~~P3-frontend `[store-map]` 契約測試~~ | **拔 mock test，改 SG2 對照 api_contract A##**（D20）— contract test 抓 typo OK 但跨層漂移擋不下（SO0062 mapper camelCase 教訓） |
| P4b F7 同根 bug 拖輪 | ~~P3-backend SG2 `[processor]` 選填欄位空值強制覆蓋~~ | **拔 mock test，改 SG2 雙對照表**（D19）— 整合驗證由 PG 手測 + spec-p3-data seed 涵蓋；空值 SQL pattern bug 由 test_cases.md 手測擋 |
| AR003 BUG-A1（規格 17 欄、DDL 15 欄、真 DB 也缺 2 欄）| — | **MCP 唯讀 DESCRIBE 產 `current_schema_{程式編號}.md` 作 SSOT**（D21） |

---

## 實作記錄

### v1 實作（2026-04-16）
| 順序 | 任務 | 版本 |
|------|------|------|
| 1 | P2 通用化改造 | v2.0.0 |
| 2 | P3 spec-implementing 骨架 | v1.0.0 |
| 3 | P4a spec-uat 骨架 | v1.0.0 |
| 4 | P4b spec-e2e 骨架 | v1.0.0 |

### v2 重構（2026-04-24）
| 順序 | 任務 | 版本 |
|------|------|------|
| 1 | 刪除 spec-p4a-uat / spec-p4b-e2e / spec-p3-implementing | — |
| 2 | P2 重構：加類型 tag + test_cases 手測格式 | v3.0.0 |
| 3 | 新建 spec-p3-backend（tag 分流 TDD） | v1.0.0 |
| 4 | 新建 spec-p3-frontend（契約測試 + 完工後整體手測） | v1.0.0 |
| 5 | 新建 spec-p3-data（權限 + 測資 SQL） | v1.0.0 |
| 6 | 更新 plugin.json / README.md / 架構設計 | — |

### v2.x 演進（2026-04-25 ~ 2026-05-22）
| Commit | 日期 | 內容 | 決策 |
|---|---|---|---|
| 4079842 | 2026-04-25 | api_contract + current_schema 作跨層 SSOT，落地 commit 兩條規約 | D21 |
| d4ce9c6 | 2026-04-25 | 拔 Processor / mapper mock test，SG2 改走 api_contract + current_schema 對照 | D19 / D20 |
| 6c4ef8a | 2026-04-25 | 明確 SKILL 結束點（完工三條件）+ bug 修復不入 SKILL + 維護期 hand-off 段 | D24 |
| 59265a3 | 2026-04-25 | 加 commit-time hook（PreToolUse Bash + git commit filter）自動跑 typecheck + module test | D23 |
| 920e3d3 | 2026-04-25 | spec-p3-fe SG1 列前端硬守則 + SG3 grep 守則驗證 | — |
| e292b31 | 2026-04-25 | spec-p3-data 改用 MCP 唯讀做 schema 對齊 + 對帳 | — |
| fb9f2b4 | 2026-04-25 | 加 Scope Statement step（切入點 7 完整落地） | D22 |
| ed93e9a / 131dc3e | 2026-05-22 | P3 共用規約抽到 `spec-workflow-refs/p3/`；修 README ↔ SKILL drift | D25 |

---

## 下一步

繼續在實際專案試用 v2.x 架構，驗證：
- task 類型 tag 在 P2 階段能否正確標註
- P3-backend `[processor]` SG2 雙對照表能否在 PG 一眼看出契約 / schema 偏離
- P3-frontend service/store-map SG2 對照 api_contract 是否比 mock-based contract test 更省 token + 更直接
- P3-data 的權限 + seed 流程能否讓 PG 手測順暢開跑
- commit-time hook（spike 3）的 false-positive 率與 cold/warm cache 速度（target project 是否需暖 cache）
- 共用規約抽離後，三 SKILL 各自演進是否仍能保持一致（無 silent drift）
