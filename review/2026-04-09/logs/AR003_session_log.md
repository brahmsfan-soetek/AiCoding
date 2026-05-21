# AR003 — P3 Implementing Session Log

> 每個 session 結束前 append。Resume 時讀此檔回顧前人教訓。
> 與 `AR003_progress.md` 互補：progress 是「做到哪」，session_log 是「為什麼這樣做 / 踩過什麼坑」。

---

## Session 1 — 2026-04-17（Claude Opus 4.7）

**起迄 commit：** `31868d3` → `772c330`（6 commits + 1 docs commit）

### 做了什麼
- CHORE-FE（Vitest 基礎建設，31868d3）
- CHORE-BE（AR 模組骨架 + Mockito，df90166）
- B01（ArRecordsEntity 17 欄，8926bf4）
- B31-2（InvoiceStatusResolver，412e89f）
- B82（DisputeAmountValidator，e144691）
- docs(ar003) checkpoint（772c330）
- 累計 27 單元測試全綠

### 關鍵決策（含原因）

- **測試路線選 1（先建測試基礎建設再 TDD）**：本專案前後端皆無測試框架，但 P3 要走 TDD，不先補基建 loop 無效
- **後端純單元測試 mock NativeSqlService**：不啟動 Quarkus、不跑 DB，測試跑秒級而非分鐘級；Processor 整合測試留給 P4
- **只在 `accounts-receivable` 新模組引用 mockito**：Quarkus BOM 管版本，不污染現有模組 pom
- **Entity 風格 `@Data @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(callSuper=false)` + `private` 欄位**：與 `backend-entity.md` 規範一致；不同於 `GlJournalHeaderEntity` 的 `public` 欄位風格（那是舊模組歷史遺留）
- **BusinessException 用 3 參數建構子自帶中文訊息**：`core-foundation` 的 `ErrorCodeLoader` 寫死只載 system/auth/authorize/general-ledger 四個 YAML，新模組 `error-codes/*.yml` 不會被自動掃，沒帶 message 前端會看到原始 code
- **純函式違規輸入拋 IllegalArgumentException**：PG 確認「前端接住即可」；讓契約破壞顯式浮出而非靜默漂移

### 踩過的坑

- **工作目錄漂移**：session 中 `pwd` 顯示 `/c/Users/a0304/IdeaProjects/serp_struct` 但 Bash 實際在 `frontend/`。`cd frontend && xxx` 常失敗。解法：一律用絕對路徑 + 從 repo root 用 `-f backend/pom.xml` 等絕對參數
- **root 目錄有多餘 `package.json`**：Repo root 和 `frontend/` 都有 `package.json`（root 的可能是誤加）。我誤把 vitest 裝進 root，後來 npm install 自動改到 frontend。小心 npm 跑在哪
- **branch 被切走事件**：B82 SG2 確認後 PG 把 branch 從 `ar003` 切到 `release`，3 個檔案（`backend/pom.xml`、`backend/application/pom.xml`、`frontend/package.json`）的改動「消失」，system reminder 說是 intentional。解法：不擅自 revert / checkout，停下來向 PG 確認；commits 保留在 local branch，PG 切回 `ar003` 後全部完好
- **`git reset HEAD <path>` 是 unstage 非 reset commit**：session 早期 staged 了規格檔，我為了讓 `chore(test):` commit 範圍乾淨先 reset unstage，再 `git add` 特定檔案

### 下 session 注意事項

- SG1 之前先跑 `backend/mvnw.cmd -pl accounts-receivable -f backend/pom.xml test -o` 與 `cd frontend && npm run test:run` 確認 27+4 測試全綠
- 下一 task 候選依 TDD 適合度排序：B40 取號格式化 / B41 INSERT 欄位 Factory / B81 承諾日邊界 / B31-2 擴充成 List 批次推導
- **尚未做的大塊**：前端 F01–F65（35 task，目前吃 mock）、後端 B02–B24 Processor / B30 SQL / B40 取號 / B50 SqlProvider / B60 error-codes / Permission SQL
- 若遇 branch 異常，先 `git branch --show-current` + `git log ar003 --oneline` 驗證再動作

---

## Session 2 — 2026-04-20（Claude Opus 4.7）

**起迄 commit：** `932b294`（Session 1 docs）→ `478ca1b`（含 progress/session_log docs 未 commit）

### 做了什麼
- B40（ArNumberFormatter，fefbe7b）— 純 static 21 碼格式化
- B81（PromiseDateValidator，9bcd2c2）— 承諾付款日邊界
- B83（RecDescValidator，53a4650）— recDesc 200 字上限 + emoji 合約固化
- B41（ArRecordsFactory，61179d9）— 4 情境 Entity Factory + invoiceNo 不變式
- B80（CustomerExistenceValidator，478ca1b）— 首支 DB 查詢 unit test（Mockito）
- 累計 27 → 73 單元測試全綠（+46）

### 關鍵決策（含原因）

- **B40 純 static Formatter（不含取號）**：TDD 把 `String.format` 與 `NumberGeneratorService` + `@Transactional` 分離；取號整合留給 B51。Formatter 常數 `static final` package-private 便於 B51 複用。
- **B81 注入 today 而非內部 `LocalDate.now()`**：純函式可測、無時鐘依賴；由 Processor 呼叫端取 `LocalDate.now()` 再傳入。
- **B83 保留 `String.length()` UTF-16 code units + emoji 測試固化合約**：PG 主動問 surrogate pair 行為，分析三層計量差異後確認保留，理由：(1) 對齊前端 `<input maxlength="200">`、(2) MySQL utf8mb4 更寬鬆不會溢出、(3) 防禦優勢（攻擊者繞前端仍擋）。
- **B41 `pmsDate: LocalDateTime`（非 LocalDate）**：Entity 欄位是 `LocalDateTime`；Factory 對齊 Entity，由 Processor 做 `LocalDate.atStartOfDay()` 轉換。
- **B41 Factory 硬寫 `recType / recStatus` 不接受輸入**：呼應規格 B85（recType 不暴露給前端），從 Factory 源頭阻擋誤傳。
- **B80 改 `@ApplicationScoped` + Mockito `@InjectMocks`**：首次需 DB 查詢的 validator；純 static 模式無法注入 service 故切換。`executeSingle` checked `IOException` 向外傳遞（與 `Ap008VoidProcessor` 同慣例），不 swallow。

### 踩過的坑

- **B40 SG2 人為筆誤（test-to-fit 風險演練）**：我 SG2 列測試預期值時多寫 1 個 0（寫成 22 碼 `RECC001202600000000001`，實際正確是 21 碼 `RECC00120260000000001`）。Red→Green 跑完 4 個失敗；確認是**測試預期錯誤、實作正確**後修測試、保留實作，並明文向 PG 聲明「非 test-to-fit，是 SG2 筆誤」。教訓：SG2 列測試清單時「長度邊界」要手工數一次字元數，不要憑感覺。
- **工作目錄漂移（Session 1 已記錄再次觸發）**：`pwd` 顯示 backend，下次跑測試時 `pwd` 跑到 frontend。一律用絕對路徑呼叫 `mvn -pl accounts-receivable` + `cd /c/Users/.../frontend`。
- **`executeSingle` checked `IOException`**：第一次寫 B80 Validator 沒宣告 `throws`，compile 失敗。加上 `throws IOException` 後，測試 method 也需 `throws Exception`（所有含 `when(executeSingle)` 的方法）。教訓：下次建新 DB 查詢 validator 時，`throws IOException` 先補在 signature。

### 下 session 注意事項

- SG1 前跑 `mvn -pl accounts-receivable test -o` + 前端 `npm run test:run` 驗 73/73 + 4/4 全綠
- 下一 task 候選：B86（Mockito 模式）/ B31-2 List 擴充（純函式）/ B70（PDF 催款前置三合一）/ B51（取號整合）
- **尚未做的大塊**：前端 F01–F65（35 task）、後端 B02–B24 Processor / B30 未清金額 SQL / B50 SqlProvider / B60 error-codes YAML / B51 取號整合 / B70 催款前置 / B86 arNo 屬客戶 / B87 debtMethod 合法值 / B88 跨公司隔離 / Permission SQL
- Mockito `IOException` 模式後續 B86 / B70 等查 DB 的 validator 會重複遇到，一建類就補 `throws IOException`

---

## Session 3 — 2026-04-20（Claude Opus 4.7）

> 本 session 沒有即時 append 本檔（Session 3 結束即 `/clear`），以下依 `AR003_progress.md` + git log 補綴。

**起迄 commit：** `478ca1b`（Session 2 末）→ `13b7783`

### 做了什麼
- B86 ArNoOwnershipValidator（`71c5f9f`）— DIS/PMS/催款 PDF 共用，四種 WHERE 失敗情境合一為 null→拋；7 測試通過
- B51 ArNumberGenerator（`13b7783`）— `@ApplicationScoped + @Transactional(REQUIRES_NEW)`；整合 `NumberGeneratorService` + `NativeSqlService` + B40；10 測試（8 generator + 2 enum ModuleCode）
- 新增 ModuleCode enum（FI/MM/SD/CO/ALL）暫放 AR 模組 package
- docs commit（`886e147`）更新 progress 至 B80
- 累計 73 → 90 單元測試全綠

### 關鍵決策（含原因）

- **會計年度透過 `GL_PERIOD_STATUSES`（不是 `GL_PERIODS`）**：後者是範本規則表無日期欄位；以 `(companyCode, moduleCode=FI, postingDate)` 定位單筆 `PERIOD_YEAR`
- **AR 屬財務 subledger，用 SAP 慣例 `FI` moduleCode**：合法值 FI/MM/SD/CO/ALL 寫在 `ModuleCode` enum
- **新錯誤碼 `AR003_FISCAL_YEAR_NOT_FOUND`**（400）：B60 清單當前未列，後續補 YAML + 前端 errors.json

### 下 session 注意事項
- B51 的 `FISCAL_YEAR_SQL = "CommonData.getFiscalYearByDate"` 為前瞻依賴——common-data.yml 實際未補此 key，Session 4 才發現並補

---

## Session 4 — 2026-04-20（Claude Opus 4.7，1M context）

**起迄 commit：** `13b7783`（Session 3 末）→ `6e83b5e`

### 做了什麼
- B84 AmountPositiveValidator（`64ef693`）— 純 static，PMS 金額 > 0；9 測試
- B87 DebtMethodValidator（`3c517de`）— TEL/EML/VIS 嚴格大寫不 trim；10 測試
- B70 DunningOverdueChecker（`e44a805`）— 純 static，balance > 0 + overdueDays > 0；13 測試
- B50/B60 基礎設施（`90591e4`）— AccountsReceivableSqlProvider SPI + `sql/ar.yml`（arNoExists + customerExists）+ `error-codes/ar-errors.yml` + common-data.yml 補 `CommonData.getFiscalYearByDate`；7 測試
- docs commits（`6a4ab88`、`6e83b5e`）
- 累計 90 → 129 單元測試全綠（+39）

### 關鍵決策（含原因）

- **B84 獨立 `AmountPositiveValidator`，不重構 `DisputeAmountValidator`**：後者已把 B84 邏輯內嵌（DIS 場景），重構已 done 的 validator 會動既有測試風險大；新建獨立 class 給 PMS 用即可
- **B87 嚴格大寫不 trim**：避免容忍錯誤輸入造成資料雜訊（前端送 "TEL " 就拒絕，迫使前端修好）
- **B70 拆分責任**：發票存在性 + STATUS/APPLY_TYPE 已由 B86 `ArNoOwnershipValidator` 涵蓋；B70 只負責 balance 與 overdue 兩個純函式檢查，不重做 DB 查詢
- **B50 用系統 mvn 而非 mvnw**：mvnw wrapper properties 檔案缺，系統 mvn (3.9.9) 正常
- **common-data.yml 補 `getFiscalYearByDate` 作為 B50 一部分**：B51 Session 3 遺留的前瞻依賴，補這個 SQL key 只回 `periodYear`（不動 getPeriodByDate 等既有 key）
- **error-codes/ar-errors.yml 僅作規格文件**：core-foundation 的 ErrorCodeLoader 寫死四個 YAML，新模組不會被自動載入；Java 端繼續用 3 參數 BusinessException 自帶 message；YAML 供前端 i18n 對齊
- **測試策略定調（skill-feedback 6）**：P3 Processor 類 task 走「Mockito 單元測試 + 留給 P4 E2E 涵蓋整條線」；不寫 @QuarkusTest、不寫自動化煙測

### 踩過的坑

- **mvnw.cmd 缺 wrapper properties**：首次跑 mvnw 報錯，改用系統 `mvn` OK；下次 session 應一律用 system mvn，並記錄到 Resume 指示
- **Bash `cd backend &&` 偶爾失效**：tool 返回 `pwd` 在 backend，但下一次 `cd backend` 卻失敗（shell 狀態不保留）；一律用絕對路徑 `cd /c/Users/a0304/IdeaProjects/serp_struct/backend && ...`
- **application compile 離線依賴 cost-module**：`mvn -pl application compile -o` 失敗因 cost-module jar 離線缺檔；這是環境問題，非 session 引入；AR 模組單獨編譯 + 測試完整綠
- **誤寫專案 memory（應為 skill feedback）**：我把「測試策略」寫到 `~/.claude/projects/.../memory/`，PG 指正「不是這裡，是這個 skill 的 feedback」；修正：移除專案 memory、append 到 `~/.soetek-ai-coding/skill-feedback/spec-p3-implementing.md` 的 Feedback 6

### 下 session 注意事項

- SG1 前跑 `cd /c/Users/a0304/IdeaProjects/serp_struct/backend && mvn -pl accounts-receivable test -o` 驗 129 全綠
- 前端 `cd /c/Users/a0304/IdeaProjects/serp_struct/frontend && npm run test:run` 驗 4 smoke 全綠
- **基礎設施已齊全**：B50 SqlProvider + B60 error-codes YAML + ar.yml + common-data.yml fiscal year 都就緒；**可直接進 B20 Activity Create Processor**
- **B20 測試策略（決議）**：用 Mockito mock 掉 NativeSqlService + 各 `@ApplicationScoped` validator + Panache entity static；不寫 @QuarkusTest；整條線驗證留 P4 E2E
- **尚未動到**：前端 F01–F65（35 task，含規格對齊修正）；後端 B02–B24 Processor / B30 未清金額 SQL / B88 companyCode 守則 / Permission SQL
- 若 Session 5 進 B20，可參考 `backend/accounts-payable/src/main/java/.../processor/Ap008VoidProcessor.java`（既有 ApplicationScoped + NativeSqlService + Mockito 測試模式）

---

## Session 8 — 2026-04-21（Claude Opus 4.7，1M context）— 前端資料層啟動

**起迄 commit：** `ad009b4`（Session 7 末 B60 docs）→ `b5693a9`（5 commits：F01 + F02 + F03 + 3 docs backfill）

### 做了什麼

- **F01** types/ar/ar003Types.ts 對齊規格最終版 + 17 檔連帶對齊（`99c7eaa` + `44f2d8c`）
  - 5 個聯合值常數（`AR003_RISK_LEVELS` H/M/L/''、`AR003_CONTACT_METHODS` TEL/EML/VIS、`AR003_INVOICE_STATUSES` DIS/PMS/OVERDUE/NOT_DUE、`AR003_REC_STATUS_DISPUTE='D1'`、`AR003_REC_STATUS_PROMISE='P1'`）
  - 8 個介面對齊（customerId→customerCode、invoiceId→arNo、加 baseCurrency/recDocNo/status/contactEmail/totalDue；移除 reason/contactDept）
  - 新增 `Ar003CustomerContact` 介面
  - 8 個 `makeAr003*()` factory helper
  - Ar003DisputeDialog 拔「爭議原因」下拉（規格最終版確認移除）
  - Ar003InvoiceTable「催款」按鈕條件改 `overdueDays > 0`
  - ar003Mock.ts 資料同步（arNo 用 `ARC001202600000000XXX` 格式）
  - **13 個 F01 測試**（5 常數 + 8 介面 shape）
- **F02** services/ar/ar003Service.ts 建立（`bdbdba6`）
  - class-based singleton（對齊 `po004Service.ts`）
  - 11 個方法對齊後端 11 支 Processor routeId（`ar003CustomerQuery/CustomerInfo/Aging/InvoiceQuery/RecordsQuery/InvoiceBalance/DunningPreview/DunningExport/ActivityCreate/PromiseCreate/DisputeCreate`）
  - 寫入類（Activity/Promise/Dispute）統一經 `convertToStringPayload`（對齊 `api-contract.md` IMPORTANT）
  - Service-specific types（`*Params / ApiResponse<T> / Ar003DunningExportData`）collocated in service 檔
  - **13 個 F02 測試**（8 routeId + 3 convertToStringPayload + 2 契約）
- **F03** stores/ar/useAr003Store.ts Pinia composition store（`ba561ab`）
  - 10 state + 5 loading 欄位
  - 9 actions（`handleQuery / selectCustomer / loadCustomerView / refreshTab / handleCreateActivity / handleCreatePromise / handleCreateDispute / handleExportDunning / resetView`）
  - `loadCustomerView` 用 Promise.allSettled 平行打 6 支 API
  - `companyCode` 取 `useCommonDataStore.companyOptions[0]`、`collector` 初始 `session.userInfo.userId`
  - `handleExportDunning` 實作 atob → Blob → `<a>.click` → setTimeout revokeObjectURL
  - **15 個 F03 測試**（2 初始值 + 5 查詢/view 含 partial failure + 3 refreshTab + 3 create + 2 PDF）
- docs backfill 合一（`b5693a9`）

**累計前端測試 4 → 45**（+41；4 smoke + 13 F01 + 13 F02 + 15 F03）
**後端測試保持 288/288**（本 session 未動）

### 關鍵決策（含原因）

- **F01「A 範圍一次修」邊界決策**：PG 給 A/B/C 三選項（A=純欄位對齊 17 檔；B=A+元件 badge/icon 值；C=B+TablesComponent/SDialog2 升級）。選 A 理由：B/C 會吞掉 F14/F23/F25-F27/F30-F33 共 10 個 task；路線 A（F01→F02→F03 資料層先行）後 Store 建好再逐元件切換，避免「元件吃 mock + 切 TablesComponent」尷尬過渡
- **F01 擴充常數 + factory helper 讓 TDD Red-Green 可 runtime 驗**：純 type 檔 Vitest 不會跑 TS 編譯（esbuild strip 型別），純型別 Red 無法觸發。解法：types 檔同時 export `as const` 常數陣列與 factory helper（`makeAr003*()`）作為 TDD 夾具 + Store 初始值雙用；Red 階段 factory 不存在 → import fail；Green 後 runtime 可斷言 `Object.keys()` 與常數陣列值
- **F02 寫入類統一 `convertToStringPayload`**：對齊 `api-contract.md` IMPORTANT 規範；PO004 Service 未遵守視為專案既有技術債不溯改；日期欄位（PromiseDate）必須走此路徑否則後端 `JsonUtil.getLocalDateFromMap` 只認 String（Session 5 B21 筆記）
- **F02 PDF 走 `api` instance 不走 `download`**：對齊後端 B24 設計（JSON 含 Base64 `pdfContent` 字串，不走 blob）；Base64→Blob 解碼邏輯留給 F03 Store
- **F03 `loadCustomerView` 用 Promise.allSettled 而非 Promise.all**：單一 sub-API 失敗（如 getCustomerInfo 500）不癱瘓整個 View 2；aging/invoices/records 仍顯示；失敗 API 各自 showError
- **F03 Service-specific types collocated in service file**：`Ar003SearchCustomersParams/CustomerScopedParams/RecordsQueryParams/ArNoScopedParams` 不寫進 `ar003Types.ts`；types 檔只留「實體資料結構」，service 檔留「API 參數組合」
- **commit 策略**：每個 task 獨立 feat commit，docs commit 統一 backfill hash；F02+F03 未 commit 就繼續 F03，最後一次 3 個 commit 一起出（2 feat + 1 docs）

### 踩過的坑

- **純 type 檔無法傳統 TDD**：第一版設想「寫 `expect(type...).toBe(...)`」做不到因 Vitest typecheck 模式預設關閉；最後靠「runtime 常數 + factory」設計繞過。**教訓**：Vite 生態的單元測試只能測 runtime 行為；純型別驗證要另走 `tsc --noEmit`（已由 `npm run typecheck` 提供）
- **session store 沒 `userAccount` getter**：`session.ts` 存於 `userInfo.userId`（line 86 邏輯），不是直覺的 `session.userAccount`；F03 store 改讀 `sessionStore.userInfo?.userId`
- **Ar003CollectionHistoryTab icon map 誤觸殘留掃描**：掃描舊聯合值時 `{ TEL: 'phone' }` 被掃到（value 是 Material Icon 名 `phone`，不是舊聯合值 `'phone'`）；正常殘留，非遺漏
- **Quasar Notify/Dialog 在測試會實際跑**：`vi.mock('quasar', async () => ({ ...await importActual, Notify: {create: vi.fn()}, Dialog: {create: vi.fn()} }))` 避免副作用但保留其他 Quasar 功能（`useI18n` 間接依賴）

### 未解 / 下 session 注意事項

- **本 session 未動既有技術債**：
  - `npm run lint` 102 errors（GL003/PO005Validators 等）
  - `npm run typecheck` 452 TS errors（SO007/SO010/LOV/GL003 等）
  - AR003 新增檔案對這兩個 baseline **不新增任何錯誤**（0 regression）
- **F51 i18n.json 未同步**：17 個元件改了 30+ 個 i18n key（如 `riskOptions.H`、`contactMethod.TEL`、`disputeDialog.arNo`），`ar.json` 裡的 key 名還是舊值，畫面會顯示 key 字串；歸 F51 task
- **F40 collector 唯讀鎖定尚未做**：F03 Store 已初始化 `queryForm.collector = userInfo.userId`，但 `Ar003SearchElementComponent` 的 `s-input2` 沒綁 session 切換角色時 recheckAuth 的重載邏輯；歸 F40 task
- **F04 尚未做**：`ar003Mock.ts` 還在；元件（Ar003SearchComponent / Ar003CustomerView）還 import mock；待逐元件接 Store 後刪除 mock
- **B52 JasperReports 模板仍為空殼**：後端 `ArDunningPdfService.generate` 抛 `UnsupportedOperationException`；F03 handleExportDunning 實跑會 500；上線前後端需補 .jrxml

### Resume 指示（Session 9+ 啟動）

1. 讀本檔 + `AR003_progress.md` + `AR003_frontend_tasks.md` + `AR003_規格統計_最終版.md`
2. `git branch --show-current` 應為 `ar003`；HEAD 應為 `b5693a9` 或後續
3. `cd /c/Users/a0304/IdeaProjects/serp_struct/frontend && npm run test:run` 驗 **45/45** 全綠
4. `cd /c/Users/a0304/IdeaProjects/serp_struct/backend && mvn -pl accounts-receivable test -o` 驗後端 **288/288**
5. **下階段路線推薦**：
   - **路線 A**：F04 逐元件接 Store（Ar003SearchComponent → Ar003CustomerView → Ar003Dialogs 三個彈窗）；元件切換完成後刪 `ar003Mock.ts`
   - 路線 B：F51 `ar.json` i18n key 同步（H/M/L、TEL/EML/VIS、arNo 等）+ F52 `errors.json` 新增 AR003 錯誤碼
   - 路線 C：F14 / F23 / F25-F27 元件升級 TablesComponent（原本就在用，只是規格對齊微調如 Badge 顏色、Icon 對應）
   - 路線 D：F40 collector 唯讀鎖定 + recheckAuth 連動
   - 路線 E：F54 Permission SQL（`AR003_COMPLETE_PERMISSION_SETUP.sql` 已在 `Docs/Permission/` 存在但未執行；執行後程式才會出現在選單）

