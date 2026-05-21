# AR002 P3 進度追蹤

> 前端任務以 `F*` prefix、後端任務以 `B*` prefix；本檔由 `spec-p3-frontend` 與 `spec-p3-backend` 共同維護。

## 任務清單來源

- 前端：`Docs/spec/ar002/plan/ar002_frontend_tasks.md`（39 tasks）
- 後端：`Docs/spec/ar002/plan/ar002_backend_tasks.md`（28 tasks，尚未啟動 `/impl-be`）

## 前端類型分佈與測試策略

| 類型 | 數量 | 測試策略 |
|------|:---:|---------|
| `[service]` | 9 | 契約測試（mock fetch）— 含 7 個 LOV (F29-F35) 標 N/A 由批次 6 在 Section 元件內 useLov |
| `[store-map]` | 6 | 契約測試（shape 斷言） |
| `[store-action]` | 12 | 無測試（手測涵蓋） |
| `[page]` | 7 | 無測試（手測涵蓋） |
| `[dialog]` | 1 | 無測試（手測涵蓋） |
| `[i18n]` | 2 | 無測試 |
| `[types]` | 1 | 無測試（typecheck） |
| `[router]` | 1 | 無測試 |
| **總計** | **39** | **15 有契約測試 / 24 純實作** |

## 進度表

| Task | 類型 | 狀態 | Commit | 備註 |
|------|------|------|--------|------|
| F01 | `[types]` | ✅ completed | ca5a1520 | typecheck/lint clean；既有 lov.ts 'Ref' 錯為歷史債 |
| F02 | `[service]` | ✅ completed | a315f211 | 9/9 契約測試通過 |
| F03 | `[store-map]` | ✅ completed | b9f046ef | mapOpenItemRow |
| F04 | `[store-map]` | ✅ completed | b9f046ef | mergeClearingRows |
| F05 | `[store-map]` | ✅ completed | b9f046ef | build(Simulate/Post)Payload |
| F06 | `[store-map]` | ✅ completed | b9f046ef | mapSimulateResult |
| F07 | `[store-map]` | ✅ completed | b9f046ef | calcAllocationBalance (number+epsilon) |
| F08 | `[store-map]` | ✅ completed | b9f046ef | calcBaseAmount |
| F09 | `[store-action]` | ✅ completed | 246c6436 | useAr002Store 初始化（state/computed/loading） |
| F10 | `[store-action]` | ✅ completed | 246c6436 | loadOpenItems action |
| F11 | `[store-action]` | ✅ completed | 246c6436 | queryExchangeRate action |
| F12 | `[store-action]` | ✅ completed | 246c6436 | toggleSourceRow / toggleAllSourceRows |
| F13 | `[store-action]` | ✅ completed | 246c6436 | addAdjustmentCard / removeAdjustmentCard |
| F14 | `[store-action]` | ✅ completed | 246c6436 | simulate action |
| F15 | `[store-action]` | ✅ completed | 246c6436 | post action (withSustainedLoading 待規範落地) |
| F16 | `[store-action]` | ✅ completed | 246c6436 | resetAll |
| F17 | `[store-action]` | ✅ completed | 246c6436 | loadDocTypeOptions |
| F18 | `[store-action]` | ✅ completed | 246c6436 | loadBaseCurrency |
| F19 | `[page]` | ✅ completed | e20a1a07 | 頁面入口 AR002.vue（極薄 + onMounted） |
| F20 | `[page]` | ✅ completed | e20a1a07 | Section1 一般+銀行（含 L01/L02/L04/L05 連動） |
| F21 | `[page]` | ✅ completed | e20a1a07 | Section2 待結+沖銷（含 L03/L06/L07 行內錯誤） |
| F22 | `[page]` | ✅ completed | e20a1a07 | Section3 GL 調整動態卡（L08 依 LOV emit 擴充待補） |
| F23 | `[page]` | ✅ completed | e20a1a07 | Section4 附件（緩存+硬刪除；File→fileId 待 B28） |
| F24 | `[page]` | ✅ completed | e20a1a07 | Sticky Footer 含分配餘額顯色 |
| F25 | `[dialog]` | ✅ completed | e20a1a07 | Simulate Result Dialog（maximised + 直接過帳） |
| F26 | `[router]` | ✅ completed | (pending) | /AR002 route 加入 routes.ts |
| F27 | `[i18n]` | ✅ completed | (pending) | ar.ar002 zh-TW + en-US 完整 |
| F28 | `[i18n]` | ✅ completed | (pending) | errors.json 加 30 個 AR002_* 錯誤碼 |
| F29 | `[service]` | ☑️ N/A (frontend) | — | LOV glAccount — 工作在後端；前端在 Section 1/3 用 `useLov('glAccount', {companyCode, accountTypes})`（批次 6 實作） |
| F30 | `[service]` | ☑️ N/A (frontend) | — | LOV bankCode — 同上，級聯依 selectedGLAccount |
| F31 | `[service]` | ☑️ N/A (frontend) | — | LOV bankAccount — 同上，三層級聯 |
| F32 | `[service]` | ☑️ N/A (frontend) | — | LOV customerCode — 同上 |
| F33 | `[service]` | ☑️ N/A (frontend) | — | LOV profitCenter — 同上 |
| F34 | `[service]` | ☑️ N/A (frontend) | — | LOV costCenter — 同上 |
| F35 | `[service]` | ☑️ N/A (frontend) | — | LOV taxCode — 同上 |
| F36 | `[service]` | ✅ completed | a315f211 | docType dropdown — 已併入 F02 `loadDocTypeOptions` + 契約測試 T7 |
| F37 | `[store-action]` | ✅ completed | 246c6436 | validateRequired（含逐列訊息 row=N / card=N） |
| F38 | `[store-action]` | ✅ completed | 246c6436 | validateBusiness（分配餘額 + 銀行幣別一致性） |
| F39 | `[page]` | ✅ completed | e20a1a07 | Section 2 行內 :error / :error-message 即時驗證（L06/L07） |

## 後端類型分佈與測試策略（SG1）

| 類型 | 數量 | 測試策略 |
|------|:---:|---------|
| `[entity]` | 1 (B01) | 無測試 |
| `[spi]` | 2 (B02, B27) | 無測試 |
| `[processor]` | 8 (B03–B09, B28) | TDD + SG2 強制選填覆蓋（含 B09 合 8 dropdownType） |
| `[validator]` | 3 (B10, B11, B12) | 完整 TDD |
| `[sql]` | 13 (B13–B25) | 無測試 |
| **合計** | **27**（B26 已刪） | **11 TDD / 16 純實作** |

### LOV 落地調整（PG SG1 確認）

- 採 Gl010DropdownProcessor 風格：7 個 LOV 全合進 B09 `Ar002DropdownProcessor` switch case（含原 docType 共 8 個 dropdownType：`docType / glAccount / bankCode / bankAccount / customerCode / profitCenter / costCenter / taxCode`）
- B19–B25 改為 SQL key `AR002.dropdownXxxx`，全放 `sql/ar002.yml`，不另建 `sql/ar-lov.yml`
- B26 SimpleLovService 註冊 → 不採用（**刪除**）
- 既有跨模組 LOV 不重用（PO `profitList` 雖欄位齊但跨模組依賴違反規範；其餘欄位皆缺）
- 前端未來 F29–F35 改 `api.post('/ar002Dropdown', {dropdownType:'glAccount', companyCode, accountTypes})` 不走 useLov

## 後端進度

| Task | 類型 | 狀態 | Commit | 備註 |
|------|------|------|--------|------|
| B27 | `[spi]` | ✅ completed | 0939c1ec | Ar002ProcedureService（CallableStatement 包裝 SP_AR_RECEIPT_SIMULATE/POST），參考 IM004 風格但採純 JDBC 以支援 result set + OUT 雙模式 |
| B01 | `[entity]` | ✅ completed | 5a74b7c3 | AuAttachmentEntity 放 serp-domain 共用模組（PK 單一 UUID，繼承 AuditableEntity） |
| B02 | `[spi]` | ✅ completed | 5a74b7c3 | AccountsReceivableSqlProvider 加 sql/ar002.yml；建立 ar002.yml 空殼含區塊註解 |
| B12 | `[validator]` | ✅ completed | (pending) | Ar002AttachmentValidator + 13 個 SG2 案例 — fileName 必填/3MB 邊界/類型大小寫不分 |
| B11 | `[validator]` | ✅ completed | (pending) | Ar002AllocationBalanceCalculator + 13 個 SG2 案例 — 分配餘額公式 + scale=3 半進 |
| B10 | `[validator]` | ✅ completed | 8dc09613 | Ar002RequestValidator + 27 個 SG2 案例 — 5 大規則組（Header/BankInfo/Cleared/Adjustments/分配餘額容差 0.001） |
| B13 | `[sql]` | ✅ completed | (pending) | AR002.loadOpenItems — AR_NON_CLEAR_V 三欄 LIKE paymentRef（含 :paymentRef = '' 防 AR003 教訓） |
| B14 | `[sql]` | ✅ completed | (pending) | AR002.queryExchangeRate — GL_EXCHANGE_RATES LIMIT 1 |
| B17 | `[sql]` | ✅ completed | (pending) | AR002.dropdownDocType — GL_DOCUMENT WHERE DOC_TYPE='CR' AND IS_ACTIVE='Y' AND IS_FROZEN='N' |
| B18 | `[sql]` | ✅ completed | (pending) | AR002.deleteAttachment — 含 companyCode 防跨公司刪除 |
| B19 | `[sql]` | ✅ completed | (pending) | AR002.dropdownGlAccount — accountTypes 過濾由 Processor 動態 WHERE |
| B20 | `[sql]` | ✅ completed | (pending) | AR002.dropdownBankCode — AU_BANK JOIN GL_BANK_ACCOUNT 級聯 accountCode |
| B21 | `[sql]` | ✅ completed | (pending) | AR002.dropdownBankAccount — 三層級聯 accountCode+bankId+country |
| B22 | `[sql]` | ✅ completed | (pending) | AR002.dropdownCustomerCode — SO_CUSTOMER 三旗標過濾 |
| B23 | `[sql]` | ✅ completed | (pending) | AR002.dropdownProfitCenter — GL_PROFIT_CTR_SET 生效日期過濾 |
| B24 | `[sql]` | ✅ completed | (pending) | AR002.dropdownCostCenter — GL_COST_CTR_SET 生效日期過濾 |
| B25 | `[sql]` | ✅ completed | 6e851952 | AR002.dropdownTaxCode — GL_TAX_CODE 含 TAX_ACCOUNT |
| B03 | `[processor]` | ✅ completed | (pending) | Ar002LoadOpenItemsProcessor + 9 SG2（paymentRef 三空值 normalize、16 欄位 mapping、日期字串化）⚠️ 未先跑 Red 直接寫實作 |
| B04 | `[processor]` | ✅ completed | (pending) | Ar002QueryRateProcessor + 13 SG2（rateType/rateDate 預設 'DAILY'/today、RATE_NOT_FOUND 404）— Red-first 嚴守 |
| B07 | `[processor]` | ✅ completed | (pending) | Ar002UploadAttachmentProcessor + 11 SG2（description 三空值、委派 B12 size/type、UUID/applicationCode='AR002'/isActive='Y'）+ AuAttachmentPersister thin delegate |
| B08 | `[processor]` | ✅ completed | (pending) | Ar002DeleteAttachmentProcessor + 4 SG2（必填 / 0 筆 → RESOURCE_NOT_FOUND / 受影響筆數回傳） |
| B09 | `[processor]` | ✅ completed | (pending) | Ar002DropdownProcessor + 15 SG2（8 dropdownType switch + glAccount.accountTypes 三空值 + List 過濾 + docType displayLabel='CR - {label}'）|
| B05 | `[processor]` | ✅ completed | (pending) | Ar002SimulateProcessor + 7 SG2（必填 / 驗證 / SP ERR 行 / camelCase mapping / payload key UPPER_SNAKE_CASE 序列化）|
| B06 | `[processor]` | ✅ completed | (pending) | Ar002PostProcessor + 5 SG2（含 userId 必填、OUT_STATUS=0 成功回 rcId/jeNo、=1 拋 AR002_POST_FAILED）|
| B15 | `[sql]` | ✅ completed | — | 不放 yml；由 Ar002ProcedureService.callSimulate 直接 JDBC CallableStatement 處理 |
| B16 | `[sql]` | ✅ completed | — | 不放 yml；由 Ar002ProcedureService.callPost 直接 JDBC CallableStatement 處理 |
| B28 | `[processor]` | ✅ completed | — | B07 已接受前端傳入的 fileId 寫進 AU_ATTACHMENT；檔案實體上傳由前端打既有 FileService，AR002 後端不需 inject |

## 後端完成統計（含 P3-backend session 收工）

| 類型 | 已完成 | 測試案例 |
|------|:---:|:---:|
| `[entity]` | 1 (B01) | — |
| `[spi]` | 2 (B02, B27) | — |
| `[validator]` | 3 (B10, B11, B12) | 53 |
| `[sql]` | 13 (B13–B25 含 dropdownXxxx) | — |
| `[processor]` | 8 (B03–B09, B28) | 64 |
| **合計** | **27 / 27** | **117 個 SG2 單元測試** |

AR 模組整體測試：**424 passed / 0 failed / 0 skipped**（含原 AR003 既有 + 新增 AR002）

### B26 已刪除 ✗

PG SG1 決定改採 dropdown 合併策略後不再需要 SimpleLovService 註冊。

> 狀態圖示：⏳ pending / 🚧 in_progress / ✅ completed / ❌ blocked
