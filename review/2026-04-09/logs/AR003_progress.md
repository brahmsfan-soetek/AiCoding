# AR003 — P3 Implementing Progress

> 最後更新：2026-04-22（Session 11 — SA 需求補充 11 項修復：HIS 無狀態 / 規則 A 狀態推導 / 可修改 REC_STATUS / 催收專員 ASC / collector 欄可清）
> 當前分支：`ar003`
> HEAD：`f45d790 feat(ar003): SA 需求補充 — 11 項修正整合`

## Task 清單來源
- frontend: `Docs/spec/ar003/task/AR003_frontend_tasks.md`
- backend: `Docs/spec/ar003/task/AR003_backend_tasks.md`
- 規格權威來源: `Docs/spec/ar003/AR003_規格統計_最終版.md`

## 決策記錄

- **測試策略**：路線 1（先建測試基礎建設再走 TDD）+ 後端純單元測試（Mockito mock `NativeSqlService`）
- **提交策略**：1.a — 獨立 `chore(test):` commit 先落地，再走 AR003 TDD
- **AR 模組**：`backend/accounts-receivable/`（仿 `accounts-payable` pom 結構 + 加 `mockito-core` / `mockito-junit-jupiter`）
- **前端測試框架**：Vitest 2 + @vue/test-utils 2 + jsdom 25 + @vitejs/plugin-vue 5
- **後端測試框架**：JUnit 5（Quarkus BOM 提供）+ Mockito
- **Entity 風格**：`@Data @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(callSuper=false)` + `@RegisterForReflection`；`private` 欄位（非 `public`）
- **BusinessException**：一律用 3 參數建構子 `(code, httpStatus, message)` 自帶中文訊息（新模組的 `error-codes/*.yml` 不會被 `core-foundation` 自動載入）
- **契約違反處理**：純函式若被違規呼叫（如 `InvoiceStatusResolver` 收到 HIS、`DisputeAmountValidator` 收到 null balance）拋 `IllegalArgumentException`（PG 確認前端接住即可）
- **會計年度查詢（B51）**：透過 `GL_PERIOD_STATUSES`（非 `GL_PERIODS`；後者是範本規則表無日期欄位）；以 `(companyCode, moduleCode=FI, postingDate)` 定位單筆 `PERIOD_YEAR`。AR 屬財務 subledger，用 SAP 慣例 `FI`（合法值 FI/MM/SD/CO/ALL 寫在 `ModuleCode` enum，暫放 AR 模組 package）
- **會計年度錯誤碼**：`AR003_FISCAL_YEAR_NOT_FOUND`（400，B60 清單當前未列，後續補 YAML + 前端 errors.json）
- **Processor 持久化策略**：走 Panache `entity.persist()`，但透過 `ArRecordsPersister` thin delegate 注入（@ApplicationScoped 包一層 20 行類別），讓單元測試 mock 普通 bean 而非 mock Panache static。保留 `@PrePersist` 審計欄位自動填與 `AUTO_INCREMENT` 回填；B21/B22/B24 皆共用此 Persister
- **`validateRequiredFields` 實際拋 `UtilsException`**（非 `BusinessException`）：兩者皆 `RuntimeException` 子類且都有 `getErrorCode()`，`SYS001` 錯誤碼一致；測試捕 `UtilsException.class`

## 進度

| Task ID | 狀態 | Commit | 備註 |
|---------|:----:|--------|------|
| CHORE-FE | done | da31805 | Vitest 基礎建設，4 smoke 測試通過；既有 452 TS 錯誤不在範圍 |
| CHORE-BE | done | 9d6d24e | AR 模組建立，smoke test 2/2 通過；backend 11 模組 compile ok |
| B01 | done | 46135b0 | ArRecordsEntity 17 欄對齊規格，7 結構測試通過（反射驗 @Column） |
| B31-2 | done | f695afd | InvoiceStatusResolver 純函式，9 測試通過（DIS/PMS/OVERDUE/NOT_DUE + 邊界 + 契約檢查）|
| B82 | done | 9b2b883 | DisputeAmountValidator 純函式，9 測試通過（正值檢查 + 餘額檢查 + 精度邊界）|
| B40 | done | ce6a734 | ArNumberFormatter 純 static，11 測試通過（REC/DIS 前綴 + SEQ 溢位 / 負值 / 公司長度 / 年度格式邊界）|
| B81 | done | 4ead31b | PromiseDateValidator 純 static，9 測試通過（today 邊界 + 昨日/遠過去拒絕 + params 附 pmsDate/today）|
| B83 | done | 62e33ff | RecDescValidator 純 static，10 測試通過（200/201 邊界 + BMP/emoji 合約 + null/empty 放行）|
| B41 | done | a35719b | ArRecordsFactory 純 static，10 測試通過（四情境完整欄位對照 + null 契約 + invoiceNo 不變式）|
| B80 | done | 1b39b0d | CustomerExistenceValidator @ApplicationScoped + Mockito，6 測試通過（首支 DB 查詢 unit test；null-before-DB 順序固化）|
| B86 | done | 9798d27 | ArNoOwnershipValidator @ApplicationScoped + Mockito，7 測試通過（DIS/PMS/催款 PDF 共用；四種 WHERE 失敗情境合一為 null→拋）|
| B51 | done | c17030f | ArNumberGenerator @ApplicationScoped + @Transactional(REQUIRES_NEW)；整合 NumberGeneratorService + NativeSqlService + B40；10 測試（8 generator + 2 enum ModuleCode）；新增 ModuleCode enum（FI/MM/SD/CO/ALL）；新錯誤碼 AR003_FISCAL_YEAR_NOT_FOUND |
| B84 | done | 556ace6 | AmountPositiveValidator 純 static，9 測試通過（PMS 用；DIS 由 DisputeAmountValidator 內嵌；null 視同金額非正與 DIS 一致） |
| B87 | done | 556ace6 | DebtMethodValidator 純 static，10 測試通過（TEL/EML/VIS 嚴格大寫不 trim；null/空/小寫/未知值拒絕）；新錯誤碼 AR003_INVALID_DEBT_METHOD |
| B70 | done | 556ace6 | DunningOverdueChecker 純 static，13 測試通過（balance>0 + overdueDays>0 + 檢核順序）；null 拋 IllegalArgumentException；發票存在性留給 B86；新錯誤碼 AR003_DUNNING_NOT_OVERDUE |
| B50 | done | 9906e08 | AccountsReceivableSqlProvider SPI + META-INF/services + beans.xml；sql/ar.yml 含 AR003.customerExists + AR003.arNoExists；common-data.yml 補 CommonData.getFiscalYearByDate（B51 依賴）；7 測試通過（合約 + classpath 資源存在性）|
| B60 | done | 9906e08 | error-codes/ar-errors.yml 文件化 10 個錯誤碼；備註 core-foundation 不自動載入業務模組 YAML，Java 端仍以 3 參數 BusinessException 自帶 message；前端 i18n 同步待補 |
| B20 | done | 5303058 | Ar003ActivityCreateProcessor + ArRecordsPersister（首支 Create Processor 樣板）；8 測試通過（happy path 欄位對照 + 依賴呼叫順序 + SYS001/業務例外各短路 + arNo 空字串 + 取號消耗語義）；Panache 持久化策略定案（Persister thin delegate） |
| B21 | done | 1102f31 | Ar003PromiseCreateProcessor（PMS）；10 測試通過（PMS 欄位 recType/recStatus=P1/debtMethod=null/recDocNo=null + pmsDate LocalDate→LocalDateTime atStartOfDay + amount 0/-1 + pmsDate 昨天 + 客戶/arNo 短路 + recDesc 選填 null + persist 失敗取號消耗）|
| B30 (partial) | done | 1102f31 | InvoiceBalanceService thin delegate（B22 前置依賴）；3 測試通過（happy path 參數傳遞 + null row + null 參數契約）；完整 SQL AR003.invoiceBalanceSingle 由 B30-4 補 YAML |
| B22 | done | 1102f31 | Ar003DisputeCreateProcessor（DIS）；12 測試通過（DIS 欄位 recType=DIS/recStatus=D1/recDocNo 寫入/debtMethod/pmsDate=null + 6 步依賴順序 + SYS001 + amount=0 + amount>balance + amount==balance 邊界 + customer/arNo/balance=null 契約短路 + recDocNo 取號失敗 recNo 消耗 + persist 失敗雙號消耗 + recDesc 超長）|
| B30-1 | done | 980073d | AR003.invoiceBalanceList SQL（B14 依賴）；wrapper subquery 讓 outer 以 balanceAmt alias 過濾 > 0 + ORDER BY paymentDuedate ASC；8 測試（JOIN 鏈 + STATUS/APPLY_TYPE/balance>0 + ORDER BY + 欄位 alias + 參數檢核）|
| B30-4 | done | 980073d | AR003.invoiceBalanceSingle SQL（B16/B22/B23/B24/B82 依賴）；同 B30-1 結構 + 加 h.AR_NO = :arNo；8 測試（JOIN 鏈 + DC_INDICATOR='C' + RECON_ACCOUNT + balanceAmt alias + 三個 namedParam + 單張 AR_NO 過濾）|
| B31-2 refactor | done | 2e43b4e | InvoiceStatusResolver.resolve 簽名降耦合 (ArRecordsEntity → String recType)；9 既有測試呼叫點同步，斷言未變 |
| B31-1 | done | 2e43b4e | AR003.invoiceStatus SQL（B14 依賴）；取最新 DIS/PMS (REC_TYPE IN + ORDER BY CREATE_DT DESC LIMIT 1)；4 structural test；不過濾 REC_STATUS（B31-3：AR_RECORDS 建立後不可修改）|
| B14 | done | 2e43b4e | Ar003InvoiceQueryProcessor；N+1 路線（PG 指示）：balanceList → 每張發票查 invoiceStatus → 算 overdueDays → resolve status；11 測試通過（requiredFields/空結果短路/SQL 參數/camelCase mapping/overdueDays 邊界/4 status 情境/N+1 行為驗 times(3)）；日期統一 toDateString() YYYY-MM-DD |
| B10 | done | 2483f09 | Ar003CustomerQueryProcessor（View 1）+ AR003.customerQuery SQL；四選填過濾 :param IS NULL OR ... 沿用 AP008 慣例；collector scalar subquery 取最新 CREATOR；14 測試（8 Processor + 6 SQL structural）|
| B15 | done | 7b57381 | Ar003RecordsQueryProcessor（三 Tab HIS/DIS/PMS 共用）+ AR003.recordsQuery SQL；方案 C 單 SQL + Processor switch 裁欄；recType 不合法拋 IllegalArgumentException；datetime 欄位統一 YYYY-MM-DD；15 測試（11 Processor + 4 SQL structural）|
| B16 | done | 506620d | Ar003InvoiceBalanceProcessor 單張發票本位幣未清金額即時查詢（爭議金額驗證、催款預覽前置）；設計 A：直接走 NativeSqlService（與 B14 同 pattern），不擴 InvoiceBalanceService API；ArNoOwnershipValidator 前置 + null row 視為 contract 違反拋 IllegalStateException；8 測試 |
| B13 | done | 9bb91db | Ar003AgingProcessor 客戶帳齡直查 AR_AGE_V View；View 2 F22 帳齡分析卡；6 欄 amt1to30/31to60/61to90/91plus/totalOverdue/totalDue；null row 視為 race-condition 合法狀態回六欄 BigDecimal.ZERO；9 測試（5 Processor + 4 SQL structural）|
| B12 | done | d600b79 | Ar003CustomerInfoProcessor 兩支 SQL 組合（customerInfo + customerContact）；View 2 F21 客戶資訊卡；creditBalance = CREDIT_AMT − COALESCE(TOTAL_DUE, 0) SQL 端計算；customerInfo null → AR003_CUSTOMER_NOT_FOUND（3 參數自帶 message）；contact null 合法 data.contact = null；短路設計（customerInfo null 不打 contact SQL）；17 測試（9 Processor + 8 SQL structural）|
| B23 | done | 64229d4 | Ar003DunningPreviewProcessor 催款通知函預覽（不寫 DB）；流程：ownership → invoiceBalanceSingle → DunningOverdueChecker → customerInfo → customerContact；10 欄變數：customerName/todayDate/arNo/paymentDuedate/balanceAmt/baseCurrency/overdueDays/currentUser/contactName/contactEmail；today() protected 供測試 override；currentUser 從 X-User header 取，fallback "system"；13 測試通過（happy path 10 欄 + SYS001 × 2 + ownership 短路 + not overdue + already cleared + customer not found + contact null 合法 + overdueDays 計算 + currentUser fallback + InOrder 四步 + 反射驗無 Persister + SQL params）|
| B24 | done | d90cb79 | Ar003DunningExportProcessor 催款通知函匯出（PDF + INSERT HIS）；新增 ArDunningPdfService thin delegate（空殼實作：UnsupportedOperationException，待 .jrxml 模板補）；流程（規格 B43-2）：ownership → invoiceBalanceSingle → DunningOverdueChecker → pdfService.generate → generateRecNo → Factory.forDunningExport → Persister；response {fileName,pdfContent(Base64),rowCount:1}；檔名「催款通知函_{arNo}_{yyyyMMdd}.pdf」；recDesc「發送逾期催款通知函，逾期 N 天」；14 測試通過（含 PDF 空殼契約 + Persister 失敗時取號消耗）|
| B85 + B88 | done | (pending commit) | Ar003EndpointContractTest 守則固化（5 測試）；盤點結果：11 支 AR003 Processor 均已合規，測試一次綠（守則回溯檢查非 TDD）。B85 驗 4 支寫入類 Processor（Activity/Promise/Dispute/DunningExport）requiredFields 不含 recType；B88 驗 11 支 requiredFields 含 companyCode + sql/ar.yml AR003 namespace 每支 SQL 含 COMPANY_CODE；附 sanity：WRITE ⊂ ALL + 無 public non-final 欄位 |
| B60 | done | (pre-existing) | error-codes/ar-errors.yml 盤點：10 個錯誤碼全部到位（AMOUNT_NOT_POSITIVE / DISPUTE_EXCEEDS_BALANCE / PROMISE_DATE_PAST / REC_DESC_TOO_LONG / CUSTOMER_NOT_FOUND / AR_NO_NOT_FOUND / FISCAL_YEAR_NOT_FOUND / INVALID_DEBT_METHOD / INVOICE_ALREADY_CLEARED / DUNNING_NOT_OVERDUE）。本 session 確認無缺漏；前 session 已補 YAML，僅 progress 表未同步。前端 i18n errors.json 同步屬 F52（前端 task） |
| F03 | done | 5d84ece | stores/ar/useAr003Store.ts Pinia composition store；10 state 欄位 + 5 loading 欄位（query/detail/dunning/save/export）；9 actions（handleQuery/selectCustomer/loadCustomerView/refreshTab/handleCreateActivity/handleCreatePromise/handleCreateDispute/handleExportDunning/resetView）；loadCustomerView 用 Promise.allSettled 平行打 6 支 API（customerInfo/aging/invoiceList/records×3 HIS/DIS/PMS），單支失敗不癱瘓其他卡片；companyCode 取自 useCommonDataStore.companyOptions[0]；queryForm.collector 初始 sessionStore.userInfo.userId；handleCreate* 成功後自動 refreshTab；handleExportDunning 實作 Base64→Blob→a.download + setTimeout revokeObjectURL；catch 統一經 useErrorHandler.showError；15 測試全綠（2 初始值 + 5 查詢/view + 3 refreshTab + 3 create + 2 PDF export）；總 Vitest 45/45；TypeScript typecheck AR003 0 errors（總 452 維持 baseline）；Lint AR003 0 errors；測試檔 untracked 零修改 |
| F02 | done | 5d84ece | services/ar/ar003Service.ts 建立；11 個方法對齊後端 11 支 Processor routeId（ar003CustomerQuery/CustomerInfo/Aging/InvoiceQuery/RecordsQuery/InvoiceBalance/DunningPreview/DunningExport/ActivityCreate/PromiseCreate/DisputeCreate）；風格 class-based singleton（對齊 PO004Service）；寫入類（createActivity/createPromise/createDispute）統一經 convertToStringPayload 轉字串（對齊 api-contract.md IMPORTANT）；exportDunningPdf 走 api instance 不走 download（對齊 B24 Base64 JSON 設計）；擴充 types（Ar003SearchCustomersParams/CustomerScopedParams/RecordsQueryParams/ArNoScopedParams/三個 CreateParams/ApiResponse/DunningExportData）於 service 檔內；13 測試全綠（8 查詢 + 3 寫入驗 convertToStringPayload + 2 契約）；總 Vitest 30/30；TypeScript typecheck AR003 0 errors（總 452 維持 baseline）；Lint AR003 0 errors；測試檔 untracked 零修改（test-to-fit 風險 0） |
| F01 | done | 919c30d | types/ar/ar003Types.ts 重構：5 個聯合值常數（RISK_LEVELS H/M/L/''、CONTACT_METHODS TEL/EML/VIS、INVOICE_STATUSES DIS/PMS/OVERDUE/NOT_DUE、REC_STATUS_DISPUTE='D1'、REC_STATUS_PROMISE='P1'）+ 8 個介面對齊（customerId→customerCode、invoiceId→arNo、加 baseCurrency/recDocNo/status/contactEmail/totalDue、移除 reason/contactDept）+ 新增 Ar003CustomerContact 介面 + 8 個 factory helper。PG 指示「A 範圍一次修」：17 檔（13 元件 + 2 types + 2 mock/page）同步改名，含拔 Ar003DisputeDialog 爭議原因下拉（規格最終版確認移除）。13 測試全綠（5 常數 + 8 介面 shape）；總 Vitest 17/17 綠；TypeScript typecheck AR003 0 errors（總數 452 維持 baseline）；Lint AR003 0 errors（總數 102 維持 baseline）；測試檔 untracked 零修改（test-to-fit 風險 0） |
| F04 Mock 清理 | done | 4c0f1a6 | `ar003Mock.ts` 全域 grep 確認無 import（7 個 View 2 元件都已在 F20 切 Store）→ 直接刪檔；86/86 測試仍綠，無副作用 |
| F54 Permission SQL | done | 92d6ea7 | `Docs/Permission/AR003_COMPLETE_PERMISSION_SETUP.sql` 前 session 已建（2026-04-08），包含 AR 模組選單 + AR003 應用程式 + 選單項 + 4 角色（ADMIN/USER/AR_ADMIN/AR_USER）view 權限。對齊目前「不實作 permission-id 按鈕權限」政策，無需 AU_APPLICATION_ITEM F 類紀錄 |
| F60+F61+F62+F65 | done | 4c0f1a6 | 四個 Dialog 加 `isValid` / `canExport` computed 綁 save/confirm btn `:disable`，阻擋不合法 form 提交；`:loading` 綁 `store.loading.save` / `loading.export`（F65）防連點。Activity isValid：contactMethod 必填 + summary 非空 + 含前綴 ≤200；Promise isValid：arNo + amount>0 + date≥today；Dispute isValid：arNo + amount(>0 且 ≤ 選定發票未清) + description(非空 ≤200)；Dunning canExport：invoice !== null。既有 handleSave/handleSubmit 內 guard 保留為最後防線。測試 stub `s-btn` 升級為帶 name/props/disable binding 的 component stub 以利 findComponent 讀 props。5 新測試全綠（Activity T4 + Promise T4 + Dispute T5 + Dunning T4/T5）；前端累計 91/91 綠。F63 SYS001 欄位紅框、F64 業務錯誤翻譯（已在 Layer 2 完成）、maxlength counter UI 留下一輪精進 |
| F21+F23+F4A | done | a363aeb | 新增 `utils/ar003Format.ts` 共用 `formatCurrency(amount, baseCurrency?)` + `getCurrencyDecimals(code)` 對照表（TWD/JPY/KRW=0、USD/EUR/CNY/HKD/SGD/GBP/AUD=2、fallback=2；後端未回傳 decimalPlace，前端維護對照表務實解）；F21 CustomerInfoCard 頂部補 customerCode/customerName 兩欄（7 → 9 欄對齊規格）；F23 InvoiceTable balanceAmount cell 改用 `formatCurrency(val, row.baseCurrency)`，顯示如 `TWD 10,500`/`USD 350.50`；其餘金額欄（View1/AgingCard/DisputeTab/PromiseTab/DunningDialog）策略上可後續改用同一 util 集中化，本 task 僅接入有幣別來源的 InvoiceTable 與 CustomerInfoCard 信用額度。7 新測試全綠（5 util + 2 InvoiceTable），InfoCard 既有 T2 規格對齊改 9 欄（schema 修正非 test-to-fit）；前端累計 86/86 綠 |
| F52 errors.json | done | 9fff157 | i18n/zh-TW/common/errors.json 新增 10 個 AR003_* key（AMOUNT_NOT_POSITIVE/DISPUTE_EXCEEDS_BALANCE/PROMISE_DATE_PAST/REC_DESC_TOO_LONG/CUSTOMER_NOT_FOUND/AR_NO_NOT_FOUND/FISCAL_YEAR_NOT_FOUND/INVALID_DEBT_METHOD/INVOICE_ALREADY_CLEARED/DUNNING_NOT_OVERDUE），訊息對齊後端 ar-errors.yml `message` 字段；不嵌 `{paramName}` 佔位符（後端 message 本身也無）。1 覆蓋度測試鎖定（10 key 存在且非空字串）；前端累計 79/79 綠 |
| F30+F31+F32+F33+F44+F45+F46+F47 (四彈窗串 Store) | done | 7aafa45 | 四個 Dialog `handleSave`/`handleSubmit`/`handleExport` 串 useAr003Store：Activity → handleCreateActivity；Promise → handleCreatePromise；Dispute → handleCreateDispute；Dunning → handleExportDunning。F44：Activity summary 送出前組 `{contactPerson}-{summary}`（無聯絡人維持原摘要）；F45：Dispute disputeAmount > 選定 invoice.balanceAmount 前端擋（相等放行，0/null/負值一併擋）；F46：Promise promiseDate < today 前端擋（YYYY-MM-DD 字串比對）；F47：Dunning 成功後 store 內 refreshTab('HIS') 自動連動。**發現 F03 payload key bug 一併修**：Store 3 個 handleCreate* 加做後端欄位對齊 mapping（contactMethod→debtMethod、summary→recDesc；promiseAmount→amount、promiseDate→pmsDate、description→recDesc；disputeAmount→amount、description→recDesc），否則實跑後端會 SYS001 擋；Service layer `Ar003*CreateParams` 型別同步改成後端 schema。F03 既有 T11/T12/T13 測試的 `objectContaining` 斷言同步更新為後端 key（schema 對齊修正，非 test-to-fit）。13 新測試全綠（3 Activity + 3 Promise + 4 Dispute + 3 Dunning）；前端累計 78/78 綠；typecheck AR003 0 error（總 452 維持 baseline） |
| F20+F21–F27 (View 2 切 Store) | done | cd396b9 | Ar003CustomerView 切 useAr003Store：移除 6 個 mockXxxData import；customerInfo / aging / invoices / historyList / disputeList / promiseList 六份資料全部改讀 store。Header 改讀 `customerRow` prop（避開 store.customerInfo 初始 null）。F21/F22 子元件 null guard（prop 型別 `T \| null` + `v-if="prop"` 守護，適應 Store 載入前狀態）。Ar003DunningDialog customerInfo prop 型別同步放寬為 `\| null`（避免 TS typecheck baseline 超標）。F21 九欄對齊 / F23 baseCurrency 前置格式 / F24 Tab 載入時 refreshTab 等規格項**本 task 外，獨立拆**。11 新測試全綠（7 CustomerView + 2 InfoCard null/full + 2 AgingCard null/full）；前端累計 65/65 綠。測試檔 Red→Green 期間無斷言修改 |
| F11+F12+F14 | done | 4d6a7eb | Ar003SearchComponent 切 useAr003Store：移除 local ref / setTimeout / mockCustomerRows import；v-model 綁 store.queryForm 三欄、:loading 綁 store.loading.query、v-model:tableData 綁 store.customerList。元件體從 22 行 setup 縮成 11 行。5 個新整合測試通過（v-model 正向、@query 行為級、customerList/loading 前向傳遞、selectCustomer 冒泡）。F12/F14 子元件本身無改動（F01「A 範圍」時已對齊規格）。測試基礎建設：加 `$t` 全局 mock + s-card/q-card-section slot-passthrough stub。**T2 斷言層級變更風險提示**：Red 版 spy `store.handleQuery`、Green 版改驗 `ar003Service.searchCustomers` 被打（Vue template 對 Pinia setup action 的綁定捕獲時機使 spy 失效；改行為級斷言而非 tweak expect 值，語意不變） |
| F41 | done | 4d6a7eb | AR003.vue 主頁面切 useAr003Store：selectedCustomer 改讀 store.selectedCustomer；handleSelectCustomer 呼叫 store.selectCustomer + store.loadCustomerView(customerCode) + history.pushState；popstate 改用 store.resetView（清空所有客戶 scoped 資料，確保再次進入重新載入）；handleBack 改用 store.resetView。4 個新整合測試通過（setPagePid 呼叫、CustomerView v-if 閘、select-customer 三步驟、popstate → selectedCustomer 回 null）|
| BUG-A1 | done | 0d12781 | P4b E2E report 根因 A 修復：AR_RECORDS schema 漂移。Entity / sql/ar.yml / 規格統計都以 17 欄為前提（含 CUSTOMER_CODE + AR_NO），但 `Docs/DDL/AR_RECORDS.sql` 只 15 欄、實際 DB schema 也缺這兩欄，導致 `ar003CustomerQuery` 子查詢 `r2.CUSTOMER_CODE` 觸發 MySQL `Unknown column` → HandlerApiResource 包成 SYS004。診斷路徑：臨時加 `%dev.quarkus.log.file.*` 抓 stack trace（已還原），定位 Hibernate SQLSyntaxError。修復：① PG 外部補 DB schema（+ 2 欄）② `Docs/DDL/AR_RECORDS.sql` 更新到 17 欄 ③ `AR003_E2E_SEED.sql` 的 INSERT INTO AR_RECORDS 欄位清單補 AR_NO + CUSTOMER_CODE + 4 筆資料值 ④ `E2E_ADMIN_ACCOUNT.sql` 改用寫死 bcrypt hash `$2b$10$PqYhcK6LpVdlv50lPDKkJe/syM.V0SI6kfCj95e7n62cQ.qaAtneq`（不再從 admin clone，admin 被 schema dump 覆寫為 placeholder）+ 加 ON DUPLICATE KEY UPDATE 確保冪等。新增測試 `backend/accounts-receivable/src/test/java/org/soetek/serp/ar/schema/`：ArRecordsDdlConsistencyTest（T1 ×2 + T2 ×1）驗 DDL 檔含兩欄且 Entity @Column.name 都能在 DDL 找到；E2eSeedSqlConsistencyTest（T3 ×2 + T4 ×2）驗 seed INSERT 含兩欄 + E2E_ADMIN 用 literal bcrypt hash。curl 實跑 `/api/ar003CustomerQuery` 回 6 筆客戶（空 payload）+ 1 筆過濾（customerCode=E2E_C001），SYS004 解除。累計後端測試 288 → 295 綠 |
| BUG-C1 | done | (this commit) | P4b 瀏覽器實測暴露「F01 rename 尾巴 + Playwright 預設 locale」兩件事（根因 C 延伸）。① `frontend/playwright.config.ts` 加 `use.locale='zh-TW'` + `use.timezoneId='Asia/Taipei'`（原本走 chromium 預設 navigator.language='en-US'，spec 用中文 selector 全 fail）。② 12+ 項 i18n key 不對齊：template 用 `fields.customerCode / columns.customerCode / customerCodeLabel / disputeDialog.arNo / promiseDialog.arNo / dunningDialog.colArNo / contactMethod.{TEL\|EML\|VIS} / invoiceStatus.{DIS\|PMS\|OVERDUE\|NOT_DUE} / disputeStatus.D1 / promiseStatus.P1 / riskOptions.{H\|M\|L}` 等新值，但兩邊 ar.json 仍是 F01 前的舊名（customerId / invoiceId / phone|email|visit / dispute|promised|not_due|overdue / processing|resolved / pending|fulfilled / high|medium|low）→ 進入 AR003 頁面全 raw key 顯示。③ 兩邊 ar.json 完全 rename 對齊 F01 canonical 值 + 補 `customerInfo.customerCode/customerName/contactEmail`、`promiseDialog.description`、`disputeTable.recDocNo/description`；拔 F01 已移除的 `reason / disputeReasons`。新增測試 `frontend/test/i18n/ar003TemplateKeyCoverage.test.ts`：T-B4a 靜態 grep AR003 元件所有 `$t(i18nPrefix+'…')` key 都能在 zh-TW JSON 找到 / T-B4b 同上驗 en-US / T-B4c dynamic key 域（TEL/EML/VIS、D1、P1、H/M/L、DIS/PMS/OVERDUE/NOT_DUE）兩邊都可解析。標準 `standards/e2e.md` 補「語系設定（IMPORTANT）」段（寫死 locale + timezoneId），**但 standards/ 被 `.git/info/exclude` 第 8 行本機排除不進 git**，修改保留本地；若要分享給其他開發者需 `git add -f` 強推。累計前端測試 94 → 97 綠；typecheck 452 = baseline；lint 102 errors = baseline |
| BUG-B1 | done | 0d12781 | P4b E2E report 根因 B 修復：`frontend/src/i18n/en-US/ar/` 資料夾整個不存在（zh-TW 有 ar/ar.json，en-US 漏補）。Playwright chromium 預設 navigator.language=en-US → `boot/i18n.ts:getStoredLocale()` fallback en-US → `loadLocaleMessages('en-US')` 組 messages 時 en-US 沒 ar folder → `$t('ar.ar003.searchTitle')` 找不到 key 回 raw key（E2E report 看到 `common.search="Search"` 英文佐證 locale=en-US）。修復：新增 `frontend/src/i18n/en-US/ar/ar.json` 對齊 zh-TW 全 key tree（英文翻譯；「查詢條件」→「Search Criteria」等）。新增測試 `frontend/test/i18n/arNamespaceParity.test.ts`：T-B1 en-US/ar/ar.json 存在且可解析 JSON / T-B2 zh-TW 下每個 module folder+JSON 檔在 en-US 都有同名對應（泛化防護擋下次新模組再犯）/ T-B3 兩檔 key tree 遞迴對齊。累計前端測試 91 → 94 綠；typecheck 452 = baseline；lint 102 errors = baseline |

| BUG-P4b-R4-CONTRACT | done | e5ab948 | P4b 第四輪 E2E 報告類別 1 修復：後端 4 支 View 2 API（CustomerInfo / Aging / InvoiceQuery / RecordsQuery×3）回傳欄位名與前端型別全不一致，Store 誤讀 `d.info` 永遠取到 undefined → 客戶卡空、帳齡 NaN、Tab 列全錯。採最小侵入修法（前端 Store 層 mapping，後端零改動）：`useAr003Store.ts` 新增 6 個 `mapXxx()` helper + 7 個後端 response 內部型別 interface；`loadCustomerView` / `refreshTab` 改走 mapping。欄位對應：CustomerInfo flat `creditAmt→creditLimit` + `contact:{contactsName,tel,email}→contactPerson/Phone/Email` 九欄 inline；Aging `amt*/totalOverdue→days*/overdueTotal`；Invoice `applyDate/paymentDuedate/balanceAmt→invoiceDate/dueDate/balanceAmount`；HIS `createDt/creator/debtMethod/recDesc/recStatus→activityDate/collector/contactMethod/summary/status`；DIS/PMS `amount/recDesc/createDt/recStatus→disputeAmount(promiseAmount)/description/createDate/status`。型別修正：`Ar003CollectionHistory.status: string → string \| null` 對齊 SA §6 HIS 無狀態。新增 7 個 T-C1~T-C7 mapping 專注測試；既有 mock schema 對齊（7 處）+ T6/T7 smoke 斷言 `toEqual(invRow)→length.toBe(1)`（深度交給 T-C4，非 test-to-fit）。useAr003Store.test.ts 22/22，前端 97→104 綠；typecheck AR003 0 errors / 452 baseline；lint AR003 0 new errors / 102 baseline；後端零改動（324/324 不受影響）。類別 2/3/4/5 依 PG 指示「只修類別 1」保留未動。|

| BUG-P4b-R3 | done | 5a5000e | P4b 第三輪 E2E 報告修復：`Ar003CustomerQueryProcessor` 的 `customerCode` / `customerName` / `riskLevel` 三選填欄位原先未 normalize（上輪只修 collector 一欄），導致 E2E 清空欄位查詢時前端送 `riskLevel=""` 觸發 SQL `c.CREDIT_LEVEL = ''` 永遠無匹配 → 37 條 spec 全 fail。修法採報告建議的最小方案：抽 private static `normalize(String)` helper（`null || isBlank() → null`）套用至 4 欄位（含既有 collector 改走同 helper，語意不變）。新增 6 測試（customerCode/customerName/riskLevel 各 empty + blank whitespace），沿用既有 collector 兩測試 pattern。16/16 `Ar003CustomerQueryProcessorTest` 綠；累計後端 316 → 324 綠（含 N01-N09 後 PG 外部補的 E2eSeedSqlConsistencyTest 目錄搬遷差異，非本 task 範圍）。未擴範圍處理 AP/GL/IM/Cost 等其他模組同 `IS NULL OR` pattern — P4b 僅回報 AR003，保留給未來 task。|

| N01-N09 | done | (prev commit) | SA 需求補充 11 項修復。規則 A 狀態推導：SQL 返 hasDisputeD1 + hasPromiseP1 flag、Resolver 簽名改（boolean, boolean, long）、DIS(D1) 優先於 PMS(P1) 優先於 overdueDays。HIS recStatus 改 null（Factory forActivity + forDunningExport 從 D1 改 STATUS_NONE）；既有 ActivityCreate + DunningExport Processor 測試同步改 assertNull（對齊規格修正，非 test-to-fit）。新 RecStatusValidator 純 static 11 測試（DIS∈{D1,D2} / PMS∈{P1,P2} / HIS null；錯誤碼 AR003_INVALID_REC_STATUS）。新 Ar003RecordsUpdateProcessor（routeId `ar003RecordsUpdate`）+ ArRecordsReader thin delegate + 9 單元測試（reader 查無 → AR003_REC_NO_NOT_FOUND；validator 失敗短路；happy path D1↔D2 / P1↔P2 成功）。customerQuery SQL collector scalar subquery ORDER BY 從 CREATE_DT DESC 改 CREATOR ASC（SA §10 取字串第 1 名）；recordsQuery SQL 補 REC_NO 欄供前端 Update UI 使用。前端 i18n 加 D2/P2（zh/en）+ D2=處理完成 / P2=已兌現；types 加 AR003_REC_STATUS_DISPUTE_RESOLVED + AR003_REC_STATUS_PROMISE_FULFILLED 常數 + Ar003DisputeStatus/PromiseStatus 擴為 'D1'\|'D2' / 'P1'\|'P2' 聯合型別；Ar003Dispute + Ar003PaymentPromise 加 recNo 欄。Ar003SearchElementComponent collector 欄 readonly 拔除 → v-model + clearable（SA §11）。DisputeTab + PaymentPromiseTab status badge 加 popup 切換下拉（D1↔D2 / P1↔P2）呼叫 store.handleUpdateRecStatus。Service 加 updateRecStatus + Ar003RecStatusUpdateParams 型別；Store 加 handleUpdateRecStatus action（成功後 refreshTab）。新錯誤碼 AR003_INVALID_REC_STATUS + AR003_REC_NO_NOT_FOUND 前後端同步（ar-errors.yml + errors.json + ar003Errors.test.ts key 清單+2）。ar003TemplateKeyCoverage dynamic 值域補 D2 / P2。InvoiceStatusResolverTest 簽名改（boolean,boolean,long）9 測試重寫；InvoiceStatusSqlTest 改驗 hasDisputeD1 / hasPromiseP1 pattern。規則 A 的 Processor 整合：Ar003InvoiceQueryProcessor 改讀 flags map。累計後端 295 → 316 綠；前端 97 → 97（Tab UI 改 Popup 影響小，既有測試未破）|

**累計測試通過：後端 324 / 324 + 前端 104 / 104**（後端 +8：Ar003CustomerQueryProcessorTest 6 新 normalize 測試 + N01-N09 後 PG 外部補的 E2eSeedSqlConsistencyTest 目錄搬遷；前端維持 97）✅

## Session 11 筆記（2026-04-22）— SA 需求補充 11 項修復

- **觸發**：SA 回覆 `Docs/spec/ar003/需求補充.md` 11 項釐清後 PG 下 `/impl` 動手。
- **11 項對應實作**：
  | SA 項 | 實作 |
  |:---:|------|
  | 1 AR_NO 催收=空字串 | Factory.forActivity 本就用 AR_NO_EMPTY="" 無變化 |
  | **2 DIS 處理中 → 發票維持爭議中** | Resolver 改簽名 + SQL 改 hasDisputeD1/hasPromiseP1 flag |
  | **3 手動維護 REC_STATUS** | 新 Ar003RecordsUpdateProcessor + 前端 popup UI |
  | 4 DIS 預設 D1 | Factory 已 D1 無變化 |
  | 5 PMS 預設 P1 | Factory 已 P1 無變化 |
  | **6 催收沒狀態** | Factory HIS forActivity/forDunningExport recStatus 改 null |
  | **7 狀態值含 D2/P2** | i18n + types 常數 + dynamic key coverage |
  | **8-9 DIS∈{D1,D2} / PMS∈{P1,P2}** | RecStatusValidator + 套用到 Update Processor |
  | **10 第 1 名催收專員** | customerQuery SQL ORDER BY CREATOR ASC（字串排序） |
  | **11 搜尋 collector 可修改** | SearchElement 拔 readonly + v-model + clearable |
- **關鍵設計決策**：
  - **規則 A 實作**（SA §2）：SQL 從「最新 DIS/PMS LIMIT 1」改為「返 2 個 flag」，Resolver 簽名 `resolve(hasDisputeD1, hasPromiseP1, overdueDays)`。避免「同 arNo 下 PMS 更新於 DIS 導致 DIS 被蓋」的語意問題
  - **B31-3 原則翻轉**：原「AR_RECORDS 建立後不可修改」→ 新「使用者可手動維護 REC_STATUS（DIS D1↔D2, PMS P1↔P2）」。SQL 加 REC_NO 欄、前端 Tab 加 popup menu、後端走 Panache managed entity set + Persister.save
  - **PG 選 (b) 含 Update UI**：原本選 (a) 只承認可變不建 UI；PG 改 (b) 連 UI 一起做。Tab status badge 改 cursor-pointer + q-popup-proxy 提供兩個選項，成功後 refreshTab
  - **SA §10 解為字串 ASC**：原 SQL 取 `CREATE_DT DESC LIMIT 1` = 最新；SA 說「第 1 名」，PG 選解讀為「CREATOR 字串排序最小」（`ORDER BY CREATOR ASC`）。語意轉為「同客戶多催收人時取字母序第 1 個」
  - **Reader thin delegate**：新 `ArRecordsReader.findByCompanyCodeAndRecNo` 為 Update Processor 的讀取層，與 Persister 一致地可 Mockito mock，不動 Panache static
  - **Update Processor 走 managed entity**：find → setRecStatus → Persister.save（for managed entity set 後 tx commit 時自動 flush，persist 呼叫對 managed 是 no-op 但保持 thin delegate 一致性）
- **HIS recStatus 衝擊面**：Factory + Activity + DunningExport + Factory 既有測試 + ActivityCreate Processor 既有測試 + DunningExport Processor 既有測試。6 處修正，性質為「規格翻轉」而非 test-to-fit（PG 確認 SA §6「催收沒有狀態」）
- **整合測試鏈未變**：B14 InvoiceQueryProcessor 的 N+1 查詢行為保留（每張發票查 1 次 invoiceStatus），僅回傳結構從 recType 字串改為 hasDisputeD1/hasPromiseP1 兩 flag map
- **前端 UI 選擇最小侵入**：DisputeTab / PaymentPromiseTab 既有 badge slot 加 q-popup-proxy 切換項，不開新彈窗、不加專門編輯按鈕；store.loading.save 防連點
- **Tab 資料型別加 recNo**：Ar003Dispute / Ar003PaymentPromise 新增 `recNo` 欄（Update 定位 key），後端 recordsQuery SQL 補返 REC_NO 欄；Processor `mapRowForTab` 補 DIS/PMS case 的 recNo put
- **未解決 Warning**：
  - Session 6 的 B31-3 原則註解仍散落在 sql/ar.yml 部分註解中（例如 recordsQuery 已改，invoiceStatus 已改；其他內部引用若需後續清理）
  - B31-3 翻轉後，既有 `AR003_規格統計_最終版.md` 中相關段落未同步（屬 spec 層，由 PG / SA 後續決策）



## Session 10 筆記（2026-04-22）— P4b E2E report 修復

- **觸發**：上游 Session 9 完成介面層後，PG 跑 P4b E2E，37 條 spec 全 fail，`AR003_e2e_p4b_report.md`（已於 E2E 整包移除時刪除）歸結三類根因：A 後端 SYS004、B 前端 i18n raw key、C e2e_admin 多角色選第一個。PG 下 /impl「修復 e2e report」
- **診斷轉向**：E2E report 原假設 A 是「Redis null-cache」（因看到 `Cannot cache null value` 訊息）。實際重現後拿 Quarkus log 看到真因是 MySQL `Unknown column 'r2.CUSTOMER_CODE'`，Redis 訊息可能是先前 debug 階段的另一層。**教訓：SKILL 流程強調「先重現取 stack trace 再改 code」是正確的；若照 E2E report 原假設動手會走錯方向**
- **schema 漂移這件事早該被抓到**：progress.md Session 2 標 B01 ArRecordsEntity done、包含 17 欄結構測試全綠 — 但 Entity 測試只驗 `@Column` annotation（Java 層），完全沒驗真 DB schema 或 DDL 檔。此次補的 ArRecordsDdlConsistencyTest.T2（Entity @Column.name ⊂ DDL 字串）是新的防護層
- **PG 外部修 schema 期間順序**：收到「新 schema」→ curl 發現 login 也失敗 → 發現 admin hash 被 dump 成 placeholder (`$2b$10$rKvK3lPK8qr5wc/2k3GS0eXxH5x2M1Y9P7v8B4N6C3Q8E7F1A2D5G` 一眼假) → E2E_ADMIN 從 admin clone 繼承假 hash → 用 Python bcrypt 產真 hash，寫死進 E2E_ADMIN_ACCOUNT.sql。追加 T4（寫死 literal bcrypt hash + 不得 clone admin）固化此教訓
- **ar_non_clear_v / ar_age_v 評估**：新 schema 帶來的 `ar_non_clear_v` view 封裝「未清發票本位幣餘額」的 GL 層版本，與 AR003 B30 目前的 AR_DOC_DETAIL + AR_RC_CLEAR 自算 SQL 可能是替代方案；但 view 以 INVOICE_NO 為鍵、不含 AR_NO，與規格不合。記入「後續優化」不修。`ar_age_v.TOTAL_DUE` 用 NET_AMT 不扣沖帳，已結清客戶可能仍被 customerQuery 撈出來；亦記入「後續優化」不在本輪
- **未解決待 P4b 處理（不在 P3 範疇）**：Playwright chromium 預設 locale=en-US，即使 en-US/ar/ 補齊，E2E spec 用中文 selector (`getByLabel('客戶編號')`) 仍抓不到英文 label。建議 P4b 改 auth.fixture.ts 或 playwright.config.ts 加 `contextOptions: { locale: 'zh-TW' }`
- **後端診斷痕跡清理**：曾加過 `%dev.quarkus.log.file.*`，已還原；曾有 `backend/application/logs/` 目錄，已刪
- **未動程式碼層**：BUG-A1 / BUG-B1 的修復全在資料層（SQL / JSON / i18n 翻譯），Entity / Processor / Vue 元件 / Store / Service 零改動。測試對應也全是 structural 驗 schema/JSON 一致性，非業務行為測試

## 下一 Task 候選（依 TDD 適合度排序）

1. **B10 Ar003CustomerQueryProcessor** — View 1 客戶清單查詢；JOIN SO_CUSTOMER + AR_AGE_V + 最近 AR_RECORDS.CREATOR；純 Mockito 單元測試
2. **B15 Ar003RecordsQueryProcessor** — Tab1/2/3 歷史記錄查詢；payload customerCode + recType；純 AR_RECORDS 查詢
3. **B16 Ar003InvoiceBalanceProcessor** — 薄包裝 InvoiceBalanceService（已存在，thin delegate 已備）
4. **B12 Ar003CustomerInfoProcessor** — 客戶主檔 + 信用餘額 + 主要聯絡人（3 個 SQL 組合）
5. **B13 Ar003AgingProcessor** — AR_AGE_V 單筆查詢（最簡單）
6. **B23 / B24 催款 PDF** — 需 JasperReports 模板，邊界較大
7. **B88 companyCode 一致性** — Processor 層守則

## Session 事件筆記

- **2026-04-17 中途 branch 切換事件**：PG 在做 B82 前曾切到 `release` branch，造成 3 個檔案（`backend/pom.xml`、`backend/application/pom.xml`、`frontend/package.json`）的 AR 模組 / vitest 變更暫時消失。PG 切回 `ar003` 後所有 commits 完好。New session 如遇類似狀況，務必先 `git branch --show-current` + `git log ar003 --oneline` 確認。

## 未解決 Warning

- **既有技術債**（非本 task 範圍，不擋進度）：
  - `frontend/npm run lint` 102 errors（GL003/PO005Validators 等既有檔）
  - `frontend/npm run typecheck` 452 TS errors（SO007/SO010/LOV/GL003 等既有檔）
- **後端 Mockito inline-mock-maker 警告**：JDK 未來版本會棄用動態 agent；目前純函式測試未觸發，先不處理

## 尚未動到的範圍

- **前端 F04/F20–F33/F40–F65**：共約 27 task 未完成。F10（已 ✅）/F11（✅）/F12（✅ F01 一次修）/F13（✅）/F14（✅ F01 一次修）/F41（✅）完工；F20–F27 View 2 元件仍吃 mock（需切 Store）；F30–F33 四彈窗仍用 q-dialog（需改 SDialog2 + 移除爭議原因已在 F01 完成，尚待改用 SDialog2）；F40/F42–F4A 業務邏輯；F52 errors.json；F54 Permission SQL；F60–F65 驗證層
- **後端殘留**（PG 指示「後端先都處理完、PDF 不需要驗」的邊界內已全收斂；以下為下階段邊界外項目）：
  - **B52 JasperReports 實體模板**：`reports/ar003-dunning-notice.jrxml` 未建、`ArDunningPdfService.generate` 為空殼 `throws UnsupportedOperationException`。`ar003DunningExport` route 上線前**必須補實體模板 + 實作**，否則實跑會拋 UnsupportedOperation（單元測試因 mock 不觸發）
  - **B02/B03/B04/B05** Entity 沿用確認 + `SO_CUSTOMER.RECON_ACCOUNT` 欄位檢查：目前全走 native SQL，前端串接若無缺口不需補
  - **B11** `Ar003CustomerDetailProcessor` 合併版：B12/B13/B14 已覆蓋 View 2 初始化；前端若要一次抓再補
- **Permission SQL**：`Docs/Permission/AR003_COMPLETE_PERMISSION_SETUP.sql` 未建、未執行（前端上選單前必做）

## Resume 指示（Session 8+ 啟動）

New session 啟動後應：
1. 讀本檔 + `AR003_backend_tasks.md` + `AR003_frontend_tasks.md` + `AR003_規格統計_最終版.md`
2. 確認 `git branch --show-current` 為 `ar003`、HEAD 為 `4abd772` 或後續
3. 跑 `cd backend && mvn -pl accounts-receivable test -o`（系統 mvn；mvnw wrapper properties 缺檔）驗 **288** 測試全綠
4. 跑 `cd frontend && npm run test:run` 驗 frontend 4 smoke 測試全綠
5. 向 PG 確認下一階段路線：
   - **路線 A（推薦）**：前端 F01 → F02 → F03 資料層先行，再逐元件切 Store（後端查詢類 8 條 API 已就緒）
   - 路線 B：補 B52 JasperReports 模板 + `ArDunningPdfService.generate` 實作（需 .jrxml 版型設計）
   - 路線 C：跳 P4 UAT/E2E 進行後端煙測

## Session 8 筆記（2026-04-21 — 前端資料層起步）

- 見 `AR003_session_log.md` 或早期 commits（`5d84ece` F03 Store、`5d84ece` F02 Service、`919c30d` F01 types 重構）

## Session 9 筆記（2026-04-21 — 介面層與 P4a/P4b 首跑）

- F11/F12/F14 SearchComponent 切 Store、F41 AR003.vue 主頁切 Store、F20–F33 四彈窗全接 Store；F52 errors.json、F54 Permission SQL 收尾
- P4a UAT 拉清單 37 項 / P4b 自動化 37 spec（37 fail，報告 `AR003_e2e_p4b_report.md`（已於 E2E 整包移除時刪除）三類根因；觸發本 Session 10）

## Session 7 筆記（2026-04-21）

- **本 session 目標**：PG 指示「後端先都處理完，PDF 不需要驗」→ 聚焦後端收斂
- **完成 task**：B23（Dunning Preview）→ B24（Dunning Export + PDF thin delegate）→ B85 + B88（守則固化測試）→ B60（盤點已完成，progress sync）
- **commits**：`64229d4`（B23）→ `d90cb79`（B24）→ `4abd772`（B85+B88）；B60 屬 pre-existing 無 commit
- **測試 222 → 288**（+66；但前置 session 已做 B12/B13/B16 = 34 測，本 session 淨增 32）
- **B23 設計定案**：
  - 10 欄變數由後端回傳原始資料，固定標題 / 收件人「財務部」字串 / 事由模板由前端填（PG：模板資訊＝固定樣板中的變數）
  - `today()` 改 `protected` 方法供測試子類 override，不新增 `Clock` DI 慣例（沿用 `PromiseDateValidator` 的「呼叫者注入日期」精神但本地處理）
  - `currentUser` 從 `X-User` header 取，fallback `"system"`（沿用 `Im001UpdateProcessor.getCurrentUser`）
- **B24 設計定案**：
  - **ArDunningPdfService thin delegate**：`@ApplicationScoped`，`generate(Map)` 空殼 `throws UnsupportedOperationException("Template pending")`。測試 mock 避開，實際上線前需補 `ReportUtil.fillJasperReport("reports/ar003-dunning-notice.jrxml", vars, List.of())` + `toPdfBytes`
  - **Response 自組 Map**：`{fileName, pdfContent(Base64), rowCount:1}`；不用 `ExportResponseBuilder`（foundation 無 `buildPdfResponse`；`buildExcelResponse` 的 key `excelContent` 語意不對）
  - **InOrder 遵守 B43-2**：PDF 產生先於取號、取號先於 Persister。PDF 失敗不消耗取號；PDF 成功後取號 + INSERT 同主交易，Persister 失敗吃掉 recNo（規格容許）
- **B85 / B88 盤點結果**：**11 支 AR003 Processor 已全合規**，無違規需修；改用「守則固化測試」做斷言回溯檢查（`Ar003EndpointContractTest` 5 測試一次綠，非 TDD Red→Green）
  - B85：4 支寫入類 Processor（Activity/Promise/Dispute/DunningExport）`requiredFields` 不含 `recType`（RecType 由 `ArRecordsFactory` 硬寫常數）
  - B88：11 支 `requiredFields` 含 `companyCode`；sql/ar.yml 18 處 `COMPANY_CODE = :companyCode`
- **B60 盤點結果**：`ar-errors.yml` 10 個錯誤碼已全到位（含 progress 標「待補」的 3 個：FISCAL_YEAR_NOT_FOUND / INVALID_DEBT_METHOD / DUNNING_NOT_OVERDUE）；前 session 已補、progress 表未同步。本 session 僅補 docs commit
- **測試 pattern 重點**（future session 留意）：
  - `stubHappyPath()` private helper 有 `when(nativeSqlService.executeSingle(...))` 時**必須宣告 `throws Exception`**（NativeSqlService 簽名 throws）；參考 B16 測試既有 pattern
  - Processor 用匿名子類 override `today()` 固定時鐘 + 反射 set field 注入 mock；避免引入 `Clock` bean
- **後端收斂邊界**：B52 JasperReports 實體模板、B02–B05 Entity 沿用、B11 合併版 Customer Detail、Permission SQL 歸屬於「後端本階段收斂完成後的附加項」；前端 F01–F65 完全未動
- **下次 session 推薦路線 A**：前端資料層 F01 types 對齊規格最終版 → F02 service → F03 store，再逐元件切 Store（參考 PO004 三層實作）

## Session 6 筆記（2026-04-20）

- **本 session 完成 4 支 Processor + 3 支 SQL + 1 個 refactor**：B30（invoice balance 2 SQL）→ B14（InvoiceQuery + B31-1 invoiceStatus SQL + Resolver refactor）→ B10（CustomerQuery）→ B15（RecordsQuery）
- **累計測試由 162 → 222**，+60 測試全綠
- **新增 SQL structural test 路線**（無 DB 環境下驗 YAML pattern）；SnakeYAML test scope 已就位
- **整合測試策略**（PG 決策）：真 SQL 行為驗證用 Testcontainers（非 H2）；此決策已進 auto-memory `feedback_integration_test_tool.md`
- **方案 C 三 Tab 共用 Processor**（B15）：單 SQL 返 union + Processor switch 裁欄，替代規格清單原列三 SQL；理由「不為假設性未來需求設計」（未來要 JOIN 再拆獨立 SQL）
- **B14 InvoiceQuery + B31-1 invoiceStatus SQL 完成**（193/193 綠）；N+1 路線（PG 指示對齊規格 SQL 命名）
- **InvoiceStatusResolver 簽名降耦合**：從 `ArRecordsEntity` 改接 `String recType`；9 既有測試呼叫點同步（`rec("DIS")` → `"DIS"`），斷言與通過條件未變，非 test-to-fit
- **日期 mapping 慣例**：Processor 層統一 `toDateString()` 轉 `YYYY-MM-DD`（對齊 `api-contract.md`）；既有 AP006 沒做但不溯改
- **N+1 測試寫法提醒**：`callsInvoiceStatusPerInvoice` 測試 `times(3)`，未來改 bulk query 時此 1 測試需同步更新（名稱已 flag 出）
- **B30 完整 SQL 實作完成**（AR003 累計測試 178/178 綠）
- **Structural test 路線確立**：無 DB 環境下驗 SQL 結構（YAML 解析成 Map → 逐支 SQL 驗關鍵 pattern contains / regex）。擋得了 SQL 誤刪、alias 打錯、參數名飄移；無法驗實際數值正確性
- **測試工具**：SnakeYAML（test scope），寫 `@BeforeAll` 一次 parse，各 test case 讀 `map.get("AR003").get("invoiceBalanceSingle")` 逐支斷言
- **PG 決策：真實 SQL 行為驗證用 Testcontainers，不用 H2**（方言差異會產生 false signal）。此決策已存入 auto-memory `feedback_integration_test_tool.md`
- **Wrapper subquery 設計**：list 版為了能用 `balanceAmt` alias 直接過濾 > 0，outer 包一層 subquery。代價是 ORDER BY 也在 outer 用 `t.paymentDuedate ASC`（camelCase alias，非原始 `PAYMENT_DUEDATE`）
- **測試 14 pattern 微調**（Red→Green 期間唯一斷言改動）：`PAYMENT_DUEDATE` → `(?i).*PAYMENT_?DUEDATE`，兼容 alias。已明示並取得 PG 同意（選項 3）；性質為「對 SQL 寫法的原始預期修正」而非 test-to-fit，語意「按到期日升冪排」未變
- **`cus.RECON_ACCOUNT` outer reference 問題**：規格原 SQL 讓 sub-query 直接引用 outer `cus.RECON_ACCOUNT`（MySQL derived table 不支援），改寫法為 `JOIN SO_CUSTOMER cus` 先在 outer 取得，再把 `clr.ACCOUNT_CODE = cus.RECON_ACCOUNT` 放到 LEFT JOIN ON 條件。語意等價
- **`AR_DOC_DETAIL.COMAPNY_CODE` 拼寫錯維持**（釐清 3-1 PG 確認「懶得管」）

## Session 5 筆記（2026-04-20）

- **三支 Create Processor 全數完成**（B20 / B21 / B22），模組測試 162/162 綠
- **B21 TDD 回溯修正**：第一次寫 B21 時一口氣把實作+測試都寫完才跑 → 違反 TDD Red-first 紀律。補救方式：把實作 `processBusinessLogic` 暫時改回 `throw UnsupportedOperationException`，跑測試確認全 Red，再恢復實作跑 Green。下次起嚴守先測試、後實作
- **`JsonUtil.getLocalDateFromMap` 只認 String**：位元組碼驗證 → 若 payload 值是 `LocalDate` 物件，`instanceof String` 失敗直接回 `null`，不做 toString 轉換。測試必須傳 `LocalDate.toString()`（`"YYYY-MM-DD"`）。對齊前端 `convertToStringPayload` 全轉字串協議
- **B22 Dispute 特色**：兩組取號（`generateRecNo` + `generateRecDocNo`）、金額驗證依賴未清餘額查詢（`InvoiceBalanceService`）。為避免卡 B30 完整 SQL，先建 `InvoiceBalanceService` thin delegate（3 測試），實 SQL 等 B30-4 補入 YAML
- **驗證依賴順序決策**：B22 把 `RecDescValidator` 放最前（純 static，早 fail 早 return）；`InvoiceBalance` 查詢放 `ArNoOwnership` 驗證之後（先驗 arNo 屬於客戶再查餘額）；`DisputeAmountValidator` 把 `balance==null` 視為契約違反（因 ArNoOwnership 已確保發票存在），拋 `IllegalArgumentException`
- **B20 Activity Create Processor 完成**（137/137 綠）
- **Panache 持久化策略 PG 決策**：PG 問「迴避 Panache 有什麼問題?」後盤點發現審計欄位自動填充失效是致命缺點 → 改走 Panache + `ArRecordsPersister` thin delegate DI 包裝（20 行類別換 Processor 單元測試無痛）。此策略 B21/B22/B24 共用
- **`process()` 公開入口必要**：Processor 繼承 `ApiRouteProcessor` 需 override 三個方法 — `getTemplateParams()` / `getProcessorType()` / `process(Exchange, @Body, @Headers)`；`processBusinessLogic` 是內部 hook。`process()` 內呼叫 `executeWithErrorHandling` 轉交基底類處理異常包裝
- **SYS001 由 `UtilsException` 拋出**：`validateRequiredFields` 內部 `JsonUtil.validateRequiredKeys` 拋 `UtilsException`（`extends RuntimeException`），不是 `BusinessException`。兩者都有 `getErrorCode()`，errorCode 值 `SYS001` 一致；測試斷言改捕 `UtilsException.class`。此經驗 B21/B22 可直接套用
- **Red→Green 期間唯一斷言修正**：測試 3 `missingRequiredField_throwsSys001` 的預期型別從 `BusinessException` 改為 `UtilsException` — 修正對框架的錯誤預期，非 test-to-fit（`getErrorCode()=="SYS001"` 驗證未變）
- **首支 Create Processor 樣板定型**：`process()` → `executeWithErrorHandling` → `processBusinessLogic`（`validateRequiredFields` → 取 payload → static validator → DI validator → 取號 → Factory 建 entity → Persister 存 → `buildStandardResponse(traceId, data, "CREATE")`）
- **Stray 檔案清理**：Explore subagent 調查 ApiRouteProcessor jar 時誤將 `ApiRouteProcessor.class` 展開到 `backend/accounts-receivable/org/soetek/foundation/processor/`（subagent 誤用 `javap` 行為），git untracked 直接 `rm -rf` 清除；不影響 commit

## Session 4 筆記（2026-04-20）

- **PG 指示**：「不用 pg 審，你規劃連續跑完」→ 採折衷模式（SG2 測試清單顯示、SG3 改為里程碑報告）
- **Batch 1 完成**：B84 (AmountPositiveValidator) + B87 (DebtMethodValidator) + B70 (DunningOverdueChecker)
  - 共 32 新測試；皆為純 static validator，不需 Mockito
  - 錯誤碼新增 2 個：AR003_INVALID_DEBT_METHOD / AR003_DUNNING_NOT_OVERDUE（B60 YAML 待補）
- **Batch 2 阻塞點**：B20 Activity Create Processor 需前置 B50 ArSqlProvider + 測試策略決策
  - 純 unit test 困難（Camel route + Panache + Quarkus）→ 建議 Mockito 全 mock 或走 Quarkus IT
  - 架構決策宜由 PG 敲定
- **Batch 2 補完基礎設施**（PG 指示「先補」）：
  - B50 SqlProvider SPI + sql/ar.yml + META-INF 檔案
  - B60 ar-errors.yml 文件
  - common-data.yml 補 getFiscalYearByDate（原 B51 ArNumberGenerator 依賴，原本缺 SQL）
  - 下一步可開始 B20 Processor（所有零件與基礎設施就緒）
- **application compile 離線依賴**：cost-module jar 離線模式無法下載（環境問題，非此 session 引入）；AR 模組單獨編譯 + 測試完整綠
