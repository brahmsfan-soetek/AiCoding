# IM004 庫存異動單 — 後端實作清單

> 初版日期：2026-03-31
> 更新日期：2026-04-01（新增：庫存異動 DB 預存程序呼叫、SP 替換評估）

---

## A. Entity / Domain 層

| # | 項目 | 說明 |
|---|------|------|
| B01 | `ImDocHeaderEntity` | 庫存異動單表頭 Entity，對應 `IM_DOC_HEADER`，含 INV_NO、MVT_TYPE、DOC_STATUS、POSTING_DATE、INV_DOC_DATE、REF_DOC_NO、DESCRIPTION、COST_CODE、PROFIT_CODE 等欄位，繼承 `AuditableEntity` |
| B02 | `ImDocDetailEntity` | 庫存異動單明細 Entity，對應 `IM_DOC_DETAIL`，PK 為 bigint 自增，含 MATERIAL_CODE、QUANTITY、UNIT_PRICE、TOTAL_AMOUNT、PLANT_CODE、SLOC_CODE、TARGET_PLANT_CODE、TARGET_SLOC_CODE、BATCH_NO、STOCK_QTY 等 |
| B03 | `ImTransactionsEntity` | 庫存交易檔 Entity，對應 `IM_TRANSACTIONS`（若尚不存在），含 TXN_ID、STOCK_TYPE_REDUCE、STOCK_TYPE_ADD 等完整欄位 |

---

## B. Processor 層（API 端點）

| # | 項目 | 說明 |
|---|------|------|
| B04 | `Im004QueryProcessor` | 查詢頁面：依篩選條件（INV_NO、MVT_TYPE、DOC_STATUS、日期區間）查詢 Header + COUNT/SUM(Detail)，不分頁不排序 |
| B05 | `Im004DetailProcessor` | 取得單筆完整資料：Header + Detail list，供編輯/檢視頁面使用 |
| B06 | `Im004CreateProcessor` | 新增：AU_GEN_NUMBER 取 INV_NO → 寫入 Header + Detail，DOC_STATUS='A'，悲觀鎖（SELECT FOR UPDATE） |
| B07 | `Im004UpdateProcessor` | 修改：悲觀鎖 → 更新 Header + Detail（先刪後寫或差異更新），限 DOC_STATUS='A' |
| B08 | `Im004DeleteProcessor` | 刪除：硬刪除 Detail + Header，限 DOC_STATUS='A' |
| B09 | `Im004ValidateProcessor` | 驗證：做過帳前業務面檢查（會計期間、庫存充足、科目查詢），不實際寫入 |
| B10 | `Im004PostProcessor` | **過帳（核心）**：單一 LUW，步驟 0~4 完整流程（前置檢查→建 IM_TRANSACTIONS→更新成本→建傳票→呼叫 DB 預存程序更新庫位/批次庫存→COMMIT/ROLLBACK） |
| B11 | `Im004DropdownProcessor` | 異動類型下拉：查 `AU_DATA_PROFILE` WHERE PF_TYPE='INV_MVT' |

---

## C. LOV Processor 層

| # | 項目 | 說明 |
|---|------|------|
| B12 | `Im004MaterialLovProcessor` | LOV 2.1 物料代碼：JOIN IM_MATERIAL、IM_UNIT、IM_MATERIAL_VALUATION、AU_DATA_PROFILE，排除 AVG_PRICE 為 NULL |
| B13 | `Im004PlantLovProcessor` | LOV 2.2 工廠：查 IM_PLANT WHERE IS_ACTIVE='Y' |
| B14 | `Im004SlocLovProcessor` | LOV 2.3 庫位：依物料+工廠篩選 IM_MATERIAL_STORAGE，出庫類型加 AVL_QTY > 0 |
| B15 | `Im004TargetSlocLovProcessor` | LOV 2.4 目標庫位：查 IM_SLOC WHERE IS_ACTIVE='Y'，依目標工廠篩選 |
| B16 | `Im004BatchLovProcessor` | LOV 2.5 批號：依物料+工廠+庫位查 IM_MATERIAL_BATCH |
| B17 | `Im004CostCenterLovProcessor` | 成本中心 LOV：查 GL_COST_CTR_SET（或複用 GL009 既有 Processor） |
| B18 | `Im004ProfitCenterLovProcessor` | 利潤中心 LOV：查 GL_PROFIT_CTR_SET（或複用 GL009 既有 Processor） |

---

## D. 過帳核心邏輯（B10 內部拆分）

| # | 項目 | 說明 |
|---|------|------|
| B10-1 | 前置檢查 | 查 GL_PERIOD_STATUSES 確認期間開放（GPS.STATUS='O'）；後端庫存充足檢查（D02/D03/D05 查 IM_MATERIAL_VALUATION.STOCK_QTY） |
| B10-2 | 狀態更新 | IM_DOC_HEADER.DOC_STATUS → 'P' |
| B10-3 | 建立 IM_TRANSACTIONS | D01 每筆明細建 2 筆（出+入），D02~D05 每筆建 1 筆；TXN_ID 由 AU_GEN_NUMBER 取號 |
| B10-4 | 更新移動平均成本 | 呼叫 `ConfigurableMovingAverageCostService`（參考 CO003），D01 不呼叫；更新 STOCK_QTY/STOCK_VALUE，AVG_PRICE 不變；寫入 IM_MATERIAL_AVGPRICE_LOG |
| B10-5 | 傳票科目邏輯 | 取 VAL_CLASS → 查 AU_MVTXN_MAPPING 取 DC_INDICATOR/TXN_KEY → 查 AU_TXN_KEY 取存貨科目；費用科目由 TXN_KEY='OEI' + SUB_TXN_KEY 決定（D02/D05→IGI、D03→DST、D04→NPR） |
| B10-6 | 建立 GL_JOURNAL | Header（JE_NO 取號、DOC_TYPE='MP'、SOURCE_TYPE 依類型）+ Detail（兩筆分錄，存貨科目+費用科目，借貸相反） |
| B10-7 | 呼叫 DB 預存程序更新庫位/批次庫存 | 呼叫預存程序更新 IM_MATERIAL_STORAGE / IM_MATERIAL_BATCH，涵蓋所有異動類型（D01~D05）；失敗時納入 LUW 整體 ROLLBACK。**預存程序名稱與呼叫方式待提供** |

---

## E. SP 替換評估

> 更新日期：2026-04-01
> 參考：`Docs/stored-procedures/00_SpIndex.md`

以下功能目前以 Java 實作，可改為呼叫 DB 預存程序。替換後可減少 Java 端程式碼量並統一邏輯歸口。

### 可替換項目

| # | SP 名稱 | 替換對象 | 影響任務 | 替換效果 | 狀態 |
|---|--------|---------|---------|---------|------|
| SP-1 | `SP_GET_NUMBER` | `Im004NumberGenerator`（INV_NO、TXN_ID 取號）及 `JournalNumberGenerator`（JE_NO 取號） | B06、B10-3、B10-6 | 取號邏輯統一收斂到 DB 端；`Im004NumberGenerator` 整個類別可刪除；SQL YAML 的 `lockGenNumber`、`updateGenNumber`、`insertGenNumber` 可移除 | 待確認 SP 參數規格 |
| SP-2 | `SP_GET_FISCAL_PERIOD_INFO` | `Im004.getAccountingPeriod` SQL 查詢 | B09、B10-1 | 期間查詢邏輯統一（含模組代碼支援）；SQL YAML 的 `getAccountingPeriod` 可移除 | 待確認 SP 參數規格 |
| SP-3 | `SP_GL_JE_CREATE` | PostProcessor Step 3 整段傳票建立邏輯（`resolveAccounts` + `createJournal` + `createJournalDetail`，約 120 行） | B10-5、B10-6 | **影響最大** — 科目查找、借貸平衡、傳票寫入全交給 SP，Java 端只需組 JSON 傳入；SQL YAML 的 8 段查詢可移除（`getLedgerGroupCode`、`getLedgerCode`、`getBaseCurrency`、`getMvtxnMapping`、`getTxnKeyAccount`、`getExpenseAccount`、`getAccountInfo`、`getPostingKey`）；`GlJournalHeaderEntity` 的 `sourceType`/`sourceDocId` 擴充可能不再需要 | 待確認 SP 輸入 JSON 格式 |
| SP-4 | `SP_CHECK_RECORD_REFERENCES` | DeleteProcessor 刪除前引用檢查（可選） | B08 | 可在刪除前多一層防護，檢查 IM_DOC_HEADER 是否被其他表引用；目前以 DOC_STATUS='A' 守門已足夠，此項為**可選**強化 | 可選 |

### 不適用項目

| SP 名稱 | 不適用原因 |
|--------|-----------|
| `SP_AR_RECEIPT_POST` | AR 收款專用，與 IM004 無關 |
| `SP_AR_RECEIPT_SIMULATE` | AR 收款專用，與 IM004 無關 |
| `SP_GL_ACC_CREATE` | 建立會計科目，IM004 不建科目 |
| `SP_GET_DYNAMIC_VALUE` | IM004 的 LOV 已有專用 SQL，通用動態查值無優勢 |

### 替換後 Java 端異動估算

若 SP-1 + SP-2 + SP-3 全部替換：

| 異動 | 說明 |
|------|------|
| 可刪除 | `Im004NumberGenerator.java`（整個類別） |
| 可大幅簡化 | `Im004PostProcessor.java`（Step 3 約 120 行 → 改為 ~20 行 JSON 組裝 + SP 呼叫） |
| 可簡化 | `Im004ValidateProcessor.java`（期間檢查改呼叫 SP） |
| SQL YAML 可移除 | `lockGenNumber`、`updateGenNumber`、`insertGenNumber`、`getAccountingPeriod`、`getLedgerGroupCode`、`getLedgerCode`、`getBaseCurrency`、`getMvtxnMapping`、`getTxnKeyAccount`、`getExpenseAccount`、`getAccountInfo`、`getPostingKey`（共 12 段） |
| pom.xml 依賴 | `general-ledger` 依賴可能可移除（若取號和傳票都改用 SP） |

> ⚠ 以上替換需等 SA 提供各 SP 的完整輸入/輸出參數規格後方可執行。
