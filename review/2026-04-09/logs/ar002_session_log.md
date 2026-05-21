# AR002 P3 Session Log

> 每個 P3 session（impl-fe / impl-be）完工後在此追加區塊。

---

## Session 1: `/impl-fe` — Frontend implementation (2026-05-13)

**Branch**: `ar002` (worktree `.claude/worktrees/ar002`)
**Range**: F01–F39 — 39 tasks across 7 batches
**Result**: ✅ 完工（32/39 完成、7/39 標 N/A — 後端工作）

### 完工統計

| 類型 | 數量 | 完成 | N/A | 契約測試案例 |
|------|:---:|:---:|:---:|:---:|
| `[service]` | 9 | 2 (F02, F36) | 7 (F29–F35 LOV) | 9 (F02) |
| `[store-map]` | 6 | 6 | — | 32 |
| `[store-action]` | 12 | 12 | — | — |
| `[page]` | 7 | 7 | — | — |
| `[dialog]` | 1 | 1 | — | — |
| `[i18n]` | 2 | 2 | — | — |
| `[types]` | 1 | 1 | — | — |
| `[router]` | 1 | 1 | — | — |
| **合計** | **39** | **32** | **7** | **41** |

### Commits（依時序）

| Hash | 範圍 | Lines |
|------|------|-------|
| `ca5a1520` | F01 types + progress scaffolding | +430 |
| `a315f211` | F02 service + 9 contract tests | +279 |
| `b9f046ef` | F03–F08 store-map helpers + 32 contract tests | +827 |
| `da9494ae` | F29–F36 LOV/dropdown batch (progress only, 7 N/A + F36 already in F02) | progress |
| `246c6436` | F09–F18 + F37–F38 store + validators | +654 |
| `e20a1a07` | F19–F25 + F39 page/dialog (8 .vue components) | +1319 |
| `4647381c` | F26–F28 router + i18n (zh-TW + en-US + errors) | +297 |

### 檢核結果

| 項目 | 狀態 | 備註 |
|------|------|------|
| vitest | ✅ 172 passed (+2 skipped) | 含 41 個 AR002 契約測試 |
| typecheck (`vue-tsc`) | ✅ 0 ar002 errors | 既有 `lov.ts` Ref 錯為歷史債、非 AR002 引入 |
| lint (`eslint`) | ✅ AR002 portions clean | 整 tree 19708 既有 warnings 是雙引號歷史債 |
| build (`quasar build`) | ✅ 成功 | SPA dist 產出正常 |
| i18n completeness | ✅ AR002 對稱 | 既有 6 個 `lov.*` mismatch 為歷史債 |

### 待補事項（下游需處理）

1. **後端 `/impl-be`** — 28 個 B-task 待開始（含 SP 呼叫 Processor、Validator、LOV SQL YAML、Permission SQL）。
2. **`/data` 產 Permission SQL + 測資** — 對齊 `ar002_test_cases.md` 的測試資料需求清單。
3. **PG 整體手測** — 依 `Docs/spec/ar002/plan/ar002_test_cases.md` 60+ 案例逐條對驗。

### 已知技術債（commit message 與 progress 已標註）

1. **`SLov` 元件 emit 限制** — 目前只回 `value`，無法即時取得 LOV 列其他欄位。影響：
   - Section 1 銀行科目選擇後 `accountReportType` / `accountCurrencyCode` 無法即時帶入（送出時 store validator 仍能擋）
   - Section 3 GL 調整科目選擇後 `accountReportType` / `isTaxAccount` 切換無法即時生效
   - 解法選項：(a) 擴充 SLov emit 整列、(b) 新增「查單筆 GL_ACCOUNT_COMPANY」API。
2. **`withSustainedLoading` 規範未落地** — `boot/axios.ts` 尚未實作；過帳 + 序列附件上傳期間可能 Loading 閃爍。
3. **附件 `fileId` 整合** — 對應後端 B28 task，等檔案儲存系統 API 確認；目前 cached 附件無 `fileId` 時上傳被 skip 並 `console.warn`。
4. **DOC_TYPE 共用 dropdown vs Processor** — 規格未定，目前走 `/ar002Dropdown` 模組專屬 processor，可後續評估改用 `commonDataDropdown`。

### PG 下一步建議

1. **另起 session 跑 `/impl-be`**（後端 B01–B28，含 SP CallableStatement 包裝、LOV SQL、錯誤碼 YAML、Permission SQL）。
2. **另起 session 跑 `/data`** — 產出 `Docs/data/AR002_TEST_DATA.sql` 對齊 `ar002_test_cases.md` 的資料需求。
3. **後端與測資完成後**，開瀏覽器照 `ar002_test_cases.md` 整體手測（60+ 案例）。
4. **手測發現 bug** → ad hoc 派 AI 修（不走 SKILL 流程）。

---

## Session 2: `/impl-be` — Backend implementation (2026-05-14)

**Branch**: `ar002`
**Range**: B01–B28 — 27 task（B26 刪除）
**Result**: ✅ 完工（27/27 + 117 個 SG2 單元測試全綠）

### 關鍵決策（SG1）

1. **LOV 合併進 B09 一支 DropdownProcessor**（PG 確認）— 不採 SimpleLovService 路由 `/api/lov`，改採 Gl010DropdownProcessor 風格：8 個 dropdownType 集中 switch case。對應改動：
   - B19–B25 改為 `AR002.dropdownXxxx` SQL key 全放 `sql/ar002.yml`
   - B26 SimpleLovService 註冊任務 → **刪除**（不再需要）
   - 7 個 LOV 既有皆不符 AR002 規格欄位需求（盤點過 PO/AP/GL），全部新建
   - profitCenter 雖 PO `profitList` 欄位 ✅ 接近，但跨模組依賴違反「業務模組不可互相依賴」規範
2. **錯誤碼策略 2 參數 + addParam**（對齊 standards/backend-processor.md）— core-foundation ErrorCodeLoader 只載 4 個 namespace，AR002 不依賴 yml message；前端 errors.json 已加 30 個 AR002_* key（F28 完工）
3. **SP 呼叫採純 JDBC CallableStatement**（而非 JPA StoredProcedureQuery）— SP_AR_RECEIPT_SIMULATE 回未綁定 entity 的多列 result set，JPA 拿不到欄位名 metadata；統一走 JDBC 對 result set + OUT 雙模式都直接支援
4. **AuAttachmentEntity 放 serp-domain shared 模組**（而非 ar.domain）— AU_ATTACHMENT 為 AR/AP/PO/SO 共用主檔，避免日後重複建
5. **B15/B16 SQL key 不放 yml** — YAML 無法承載 OUT 參數註冊與 result set；保留註解佔位，呼叫由 Ar002ProcedureService 直接管

### 完工統計

| 類型 | 數量 | 測試 |
|------|:---:|:---:|
| `[entity]` | 1 | — |
| `[spi]` | 2 | — |
| `[validator]` | 3 | 53 |
| `[sql]` | 13 | — |
| `[processor]` | 8 | 64 |
| **合計** | **27** | **117** |

### Commits（依時序）

| Hash | 範圍 | 內容 |
|------|------|------|
| `0939c1ec` | B27 + progress 初稿 | Ar002ProcedureService（CallableStatement 包裝 SP_AR_RECEIPT_SIMULATE/POST） |
| `5a74b7c3` | B01 + B02 | AuAttachmentEntity (serp-domain) + AccountsReceivableSqlProvider 加 sql/ar002.yml |
| `8dc09613` | B10 + B11 + B12 | 三支 validator + 53 SG2（純函式靜態類） |
| `6e851952` | B13–B25 SQL 批次 | 11 支 SQL（含 8 個 dropdownXxxx 合進 B09） |
| (待) | B03 + B04 + B07 + B08 + B09 + AuAttachmentPersister | 5 支 Processor + 52 SG2 |
| (待) | B05 + B06 | SP 整合 Processor + 12 SG2 |

### 檢核結果

| 項目 | 狀態 | 備註 |
|------|------|------|
| mvn test (full AR module) | ✅ 424 passed / 0 failed | 含 AR003 既有 + 新增 AR002 117 |
| mvn process-classes (jandex) | ✅ 通過 | accounts-receivable + serp-domain |
| 編譯警告 | LF/CRLF 警告 | Windows 環境正常，無實質問題 |

### 問題與教訓

1. **B03 LoadOpenItems 違反 Red-first 原則** — 連跑壓力下我直接寫實作沒先跑 UnsupportedOperationException 階段；後續 B04/B07/B08/B09/B05/B06 嚴守骨架→Red→實作→Green 順序。下次 session 開頭就把這條鎖死。
2. **NativeSqlService 對 IN-list 綁定不確定** — 為 glAccount.accountTypes 多值過濾，採 in-memory filter（先查全部再 Processor 端過濾）避開測試風險；LOV/Dropdown 預期 ≤ 數百筆資料量 OK。若日後遇到大資料 lov 需重新評估。
3. **B12 對 description 不 normalize** — Ar002UploadAttachmentProcessor 對 `description` 三空值（null/""/空白）都原樣寫入 AU_ATTACHMENT；業務語意「填了就存」，不像 paymentRef 那樣需 normalize 做 SQL 過濾。SG2 測試對此明示。
4. **SP_AR_RECEIPT_POST OUT_JE_HEADER_ID 命名陷阱** — 規格章節 B 已釐清：OUT 命名雖叫 JE_HEADER_ID，實際內容是 JE_NO（業務鍵）；DB 主鍵 DOC_HEADER_ID 由 auto_increment 產生不需回傳。Processor 端 PostResult.jeNo 對應 OUT_JE_HEADER_ID。
5. **payload key 序列化策略 camelCase → UPPER_SNAKE_CASE** — SP 規格章節 §3 要求大寫底線命名（HEADER / BANK_INFO / CLEARED_INVOICES / ADJUSTMENTS）；Processor 端 `remapKeysToUpperSnake` 遞迴轉 Map + List 結構，並有單測驗證。

### 待補事項（下游需處理）

1. **`/data` 產 Permission SQL + 測資** — 對齊 `ar002_test_cases.md` 60+ 案例的資料需求清單。
2. **PG 整體手測** — 依 `Docs/spec/ar002/plan/ar002_test_cases.md` 逐條對驗。後端單元測試僅涵蓋 mock 層級基本程式邏輯，真正整合驗證靠手測。
3. **手測發現 bug** → ad hoc 派 AI 修（不走 SKILL 流程）。
4. **`AR002_DROPDOWN_QUERY_ERROR` 錯誤碼 i18n** — Ar002DropdownProcessor 對 SQL 例外 wrap 此 code，需確認 frontend errors.json 是否已加（F28 範圍外）。

### PG 下一步建議

1. **跑 `/data` 產測資**（含 baseline 公司 / 客戶 / 會計科目 / 銀行 / 匯率 / GL_DOCUMENT 等）
2. **本機重啟 Quarkus backend** 並用瀏覽器走 `ar002_test_cases.md` 手測
3. **發現 bug** → 個別派 AI 修，不再走 SKILL 流程
