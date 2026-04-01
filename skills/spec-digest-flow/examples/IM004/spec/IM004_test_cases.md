# IM004 庫存異動單 — 業務邏輯測試清單

> 初版日期：2026-03-31
> 更新日期：2026-04-01（新增：庫存異動 DB 預存程序呼叫測試）

---

## A. 基礎 CRUD

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T01 | 查詢 — 無篩選條件 | 回傳所有單據，含項目數 COUNT(D) 與總金額 SUM(D.TOTAL_AMOUNT) |
| T02 | 查詢 — 依文件編號篩選 | 僅回傳符合 INV_NO 的記錄 |
| T03 | 查詢 — 依異動類型篩選 | 僅回傳符合 MVT_TYPE 的記錄 |
| T04 | 查詢 — 依文件狀態篩選 | 僅回傳符合 DOC_STATUS 的記錄 |
| T05 | 查詢 — 依文件日期區間篩選 | 僅回傳 INV_DOC_DATE 在起迄範圍內的記錄 |
| T06 | 查詢 — 多條件組合篩選 | 條件交集正確 |
| T07 | 新增 — D01 庫存調撥單正常儲存 | 產生 INV_NO、DOC_STATUS='A'、Header 含 REF_DOC_NO、Detail 含 TARGET_PLANT/SLOC |
| T08 | 新增 — D02 成本中心領用正常儲存 | Header 含 COST_CODE、REF_DOC_NO |
| T09 | 新增 — D03 存貨報廢正常儲存 | Header 含 COST_CODE、DESCRIPTION |
| T10 | 新增 — D04 雜收正常儲存 | Header 含 PROFIT_CODE、DESCRIPTION |
| T11 | 新增 — D05 雜發正常儲存 | Header 含 PROFIT_CODE、DESCRIPTION |
| T12 | 修改 — 修改暫存單據 (DOC_STATUS='A') | 正確更新 Header + Detail，DOC_STATUS 仍為 'A' |
| T13 | 修改 — 嘗試修改已過帳單據 (DOC_STATUS='P') | 拒絕，回傳錯誤訊息 |
| T14 | 刪除 — 刪除暫存單據 | Header + Detail 全部硬刪除，DB 無殘留 |
| T15 | 刪除 — 嘗試刪除已過帳單據 | 拒絕，回傳錯誤訊息 |

---

## B. 編碼取號

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T16 | INV_NO 取號格式 | 格式 `INV` + YYYYMM + 三碼遞增，如 `INV202603001` |
| T17 | INV_NO 連續取號 | 第二張為 `INV202603002`，依序遞增 |
| T18 | TXN_ID 取號格式 | 格式 `TXN` + YYYYMM + 三碼遞增，如 `TXN202603001` |
| T19 | JE_NO 取號格式 | 格式 `JE` + COMPANY_CODE + PERIOD_YEAR + 遞增序號 |
| T20 | 取號到達 END_NUMBER | 回傳錯誤，不允許超過上限 |
| T21 | 併發取號 | SELECT FOR UPDATE 確保序號不重複 |

---

## C. 驗證規則

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T22 | 儲存 — 缺少異動類型 | 驗證失敗，提示「異動類型必填」 |
| T23 | 儲存 — 缺少過帳日期 | 驗證失敗，提示「過帳日期必填」 |
| T24 | 儲存 — 缺少文件日期 | 驗證失敗，提示「文件日期必填」 |
| T25 | 儲存 — 無明細行 | 驗證失敗，提示「至少一筆明細行」 |
| T26 | 明細行 — 缺少物料代碼 | 驗證失敗，標示行號與欄位 |
| T27 | 明細行 — 缺少數量 | 驗證失敗 |
| T28 | 明細行 — 數量為 0 | 驗證失敗，提示「數量須為正數」 |
| T29 | 明細行 — 數量為負數 | 驗證失敗，提示「數量須為正數」 |
| T30 | 明細行 — 缺少工廠 | 驗證失敗 |
| T31 | 明細行 — 缺少庫位 | 驗證失敗 |
| T32 | D01 明細行 — 缺少目標工廠 | 驗證失敗，提示「D01 目標工廠必填」 |
| T33 | D01 明細行 — 缺少目標庫位 | 驗證失敗，提示「D01 目標庫位必填」 |
| T34 | 批次控制物料未填批次號 | 驗證失敗，提示「批次號必填」（ENABLE_BATCH_CONTROL='Y'） |
| T35 | 非批次控制物料未填批次號 | 驗證通過 |
| T36 | 評價類別不一致 | 同單選入不同 VAL_CLASS 的物料時拒絕，提示「評價類別不一致」 |
| T37 | 評價類別一致 | 同單所有物料 VAL_CLASS 相同時驗證通過 |

---

## D. 過帳流程 — 步驟零（前置檢查）

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T38 | 會計期間未開放 (GPS.STATUS≠'O') | 過帳失敗，提示「會計期間未開放」 |
| T39 | 會計期間開放 (GPS.STATUS='O') | 通過檢查，進入後續步驟 |
| T40 | D02 出庫 — 庫存充足 (STOCK_QTY ≥ SUM(QUANTITY)) | 通過庫存檢查 |
| T41 | D02 出庫 — 庫存不足 (STOCK_QTY < SUM(QUANTITY)) | 全部回滾，提示「庫存不足」含物料代碼與數量 |
| T42 | D03 報廢 — 庫存不足 | 全部回滾，提示「庫存不足」 |
| T43 | D05 雜發 — 庫存不足 | 全部回滾，提示「庫存不足」 |
| T44 | D01 調撥 — 不檢查 IM_MATERIAL_VALUATION 庫存 | 通過（D01 不做成本庫存檢查） |
| T45 | D04 雜收 — 不檢查庫存 | 通過（入庫不需檢查庫存不足） |
| T46 | 過帳後 DOC_STATUS 更新 | IM_DOC_HEADER.DOC_STATUS 從 'A' 變為 'P' |

---

## E. 過帳流程 — 步驟一（IM_TRANSACTIONS）

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T47 | D01 — 單筆明細產生 2 筆交易 | 出庫筆：STOCK_TYPE_REDUCE='AVL', STOCK_TYPE_ADD=空, PLANT=D.PLANT_CODE, SLOC=D.SLOC_CODE；入庫筆：STOCK_TYPE_REDUCE=空, STOCK_TYPE_ADD='AVL', PLANT=D.TARGET_PLANT_CODE, SLOC=D.TARGET_SLOC_CODE |
| T48 | D01 — 多筆明細 | 每筆明細各產生 2 筆，共 2N 筆交易 |
| T49 | D02 — 每筆明細產生 1 筆交易 | STOCK_TYPE_REDUCE='AVL', STOCK_TYPE_ADD=空 |
| T50 | D03 — 每筆明細產生 1 筆交易 | STOCK_TYPE_REDUCE='AVL', STOCK_TYPE_ADD=空 |
| T51 | D04 — 每筆明細產生 1 筆交易 | STOCK_TYPE_REDUCE=空, STOCK_TYPE_ADD='AVL' |
| T52 | D05 — 每筆明細產生 1 筆交易 | STOCK_TYPE_REDUCE='AVL', STOCK_TYPE_ADD=空 |
| T53 | IM_TRANSACTIONS 欄位正確性 | TXN_ID 格式正確、TXN_DT=H.INV_DOC_DATE、MVT_TYPE=H.MVT_TYPE、DOC_NO=H.INV_NO、TXN_QTY=D.QUANTITY、UNIT_PRICE=D.UNIT_PRICE、TOTAL_AMT=D.TOTAL_AMOUNT、BATCH_NO=D.BATCH_NO |

---

## F. 過帳流程 — 步驟二（移動平均成本）

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T54 | D01 — 不呼叫成本計算 | IM_MATERIAL_VALUATION 完全不變 |
| T55 | D02 (GI) — STOCK_QTY 減少 | STOCK_QTY = 原值 - D.QUANTITY |
| T56 | D02 (GI) — STOCK_VALUE 減少 | STOCK_VALUE = 原值 - (D.QUANTITY × AVG_PRICE) |
| T57 | D02 (GI) — AVG_PRICE 不變 | AVG_PRICE 維持原值 |
| T58 | D03 (SCRAP) — STOCK_QTY/VALUE 減少 | 同 D02 規則 |
| T59 | D03 (SCRAP) — AVG_PRICE 不變 | AVG_PRICE 維持原值 |
| T60 | D04 (MIS_REC) — STOCK_QTY 增加 | STOCK_QTY = 原值 + D.QUANTITY |
| T61 | D04 (MIS_REC) — STOCK_VALUE 增加 | STOCK_VALUE = 原值 + (D.QUANTITY × AVG_PRICE) |
| T62 | D04 (MIS_REC) — AVG_PRICE 不變 | AVG_PRICE 維持原值 |
| T63 | D05 (MIS_DEL) — STOCK_QTY/VALUE 減少 | 同 D02 規則 |
| T64 | D05 (MIS_DEL) — AVG_PRICE 不變 | AVG_PRICE 維持原值 |
| T65 | 成本更新後寫入 IM_MATERIAL_AVGPRICE_LOG | 稽核日誌正確寫入，含 MATERIAL_CODE、異動前後 STOCK_QTY/VALUE/AVG_PRICE |
| T66 | 多筆明細同物料 — 成本累計更新 | 逐筆處理，最終 STOCK_QTY/VALUE 反映所有明細累計結果 |

---

## G. 過帳流程 — 步驟三（傳票）

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T67 | D01 — 不產生傳票 | GL_JOURNAL_HEADER / DETAIL 無新增記錄 |
| T68 | D02 — GL_JOURNAL_HEADER 正確 | DOC_TYPE='MP', SOURCE_TYPE='D', DESCRIPTION 含 INV_NO, IS_REVERSED='N' |
| T69 | D03 — GL_JOURNAL_HEADER 正確 | SOURCE_TYPE='G' |
| T70 | D04 — GL_JOURNAL_HEADER 正確 | SOURCE_TYPE='D' |
| T71 | D05 — GL_JOURNAL_HEADER 正確 | SOURCE_TYPE='G' |
| T72 | GL_JOURNAL_HEADER 期間欄位 | PERIOD_YEAR/PERIOD_SET_ID/PERIOD_NUM 來自 GL_PERIOD_STATUSES |
| T73 | GL_JOURNAL_HEADER 帳簿欄位 | LEDGER_GROUP_CODE 來自 GL_LEDGER_GROUP |
| T74 | GL_JOURNAL_HEADER 幣別欄位 | BASE_CURRENCY/TXN_CURRENCY 來自 GL_COMPANY_SET.BASE_CURRENCY |
| T75 | GL_JOURNAL_DETAIL — 兩筆分錄 | 存貨科目 + 費用科目，共兩筆 |
| T76 | GL_JOURNAL_DETAIL — 借貸方向相反 | 存貨科目 DC_INDICATOR 與費用科目 DC_INDICATOR 相反 |
| T77 | GL_JOURNAL_DETAIL — 金額正確 | ENTER_AMT = ACCOUNT_AMT = SUM(D.TOTAL_AMOUNT) |
| T78 | D02/D03 傳票 — COST_CODE | COST_CODE = H.COST_CODE, PROFIT_CODE = NULL |
| T79 | D04/D05 傳票 — PROFIT_CODE | PROFIT_CODE = H.PROFIT_CODE, COST_CODE = NULL |
| T80 | 存貨科目取得邏輯 | VAL_CLASS → AU_MVTXN_MAPPING(DC_INDICATOR, TXN_KEY) → AU_TXN_KEY(DR/CR_ACCOUNT)，依 DC_INDICATOR 取對應科目 |
| T81 | 費用科目取得邏輯 — D02/D05 | TXN_KEY='OEI', SUB_TXN_KEY='IGI'，DC_INDICATOR 取反 |
| T82 | 費用科目取得邏輯 — D03 | TXN_KEY='OEI', SUB_TXN_KEY='DST' |
| T83 | 費用科目取得邏輯 — D04 | TXN_KEY='OEI', SUB_TXN_KEY='NPR' |
| T84 | GL_JOURNAL_DETAIL — POSTING_KEY | 以 COMPANY_CODE + ACCOUNT_TYPE + DC_INDICATOR 查 GL_POSTING 取得 |
| T85 | GL_JOURNAL_DETAIL — ACCOUNT_TYPE | 由 ACCOUNT_CODE 查 GL_ACCOUNT_COMPANY 取得 |
| T86 | GL_JOURNAL_DETAIL — TXN_KEY 欄位 | 存貨分錄填 amm.TXN_KEY，費用分錄填 'OEI' |

---

## G2. 過帳流程 — 步驟 3.5（DB 預存程序：庫位/批次庫存更新）

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T106 | 過帳後呼叫預存程序 — 正常執行 | 預存程序成功執行，IM_MATERIAL_STORAGE / IM_MATERIAL_BATCH 庫存正確更新 |
| T107 | D01 調撥 — 預存程序更新來源與目標庫位 | 來源庫位庫存減少，目標庫位庫存增加 |
| T108 | D02/D03/D05 出庫 — 預存程序更新庫位庫存 | 對應庫位庫存減少 |
| T109 | D04 入庫 — 預存程序更新庫位庫存 | 對應庫位庫存增加 |
| T110 | 批次控制物料 — 預存程序更新批次庫存 | IM_MATERIAL_BATCH 對應批次庫存正確更新 |
| T111 | 預存程序執行失敗 → 全部回滾 | DOC_STATUS 仍為 'A'，無 IM_TRANSACTIONS，IM_MATERIAL_VALUATION 不變，GL_JOURNAL 不變 |
| T112 | 預存程序呼叫順序 — 在傳票之後 COMMIT 之前 | 確認預存程序於步驟三完成後、COMMIT 前執行 |

> ⚠ 預存程序詳細呼叫方式待提供後，需補充具體傳入參數與回傳值驗證的測試案例。

---

## H. 交易一致性 / 併發

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T87 | 過帳步驟一失敗 → 全部回滾 | DOC_STATUS 仍為 'A'，無 IM_TRANSACTIONS 記錄 |
| T88 | 過帳步驟二失敗 → 全部回滾 | DOC_STATUS 仍為 'A'，無 IM_TRANSACTIONS，IM_MATERIAL_VALUATION 不變 |
| T89 | 過帳步驟三失敗 → 全部回滾 | DOC_STATUS 仍為 'A'，無交易/傳票記錄，成本不變 |
| T89-1 | 過帳步驟 3.5（預存程序）失敗 → 全部回滾 | DOC_STATUS 仍為 'A'，無交易/傳票記錄，成本不變，庫位/批次庫存不變 |
| T90 | 併發儲存同一張單據 | 後儲存者被行鎖（SELECT FOR UPDATE）阻塞至前者完成，不產生資料衝突 |
| T91 | 多筆明細行過帳完整性 | 所有明細正確產生交易記錄、成本更新、傳票分錄 |

---

## I. LOV / 連動邏輯

| # | 測試案例 | 預期結果 |
|---|---------|---------|
| T92 | 物料 LOV — AVG_PRICE 為 NULL | 該物料不出現在可選清單中 |
| T93 | 物料 LOV — STATUS≠'A' | 該物料不出現在可選清單中 |
| T94 | 物料 LOV — 帶入欄位正確 | 帶入 MATERIAL_NAME、MAIN_UNIT、AVG_PRICE、ENABLE_BATCH_CONTROL、UNIT_DEC、VAL_CLASS 描述 |
| T95 | 庫位 LOV — 出庫類型 (D01出/D02/D03/D05) | 僅顯示 AVL_QTY > 0 的庫位 |
| T96 | 庫位 LOV — D04 入庫 | 顯示所有庫位（不限 AVL_QTY） |
| T97 | 庫位 LOV — 帶入庫存水位 | 帶入 mms.AVL_QTY 到 D.STOCK_QTY |
| T98 | D01 目標工廠/庫位排除 | 來源已選 (PLANT_A + SLOC_X)，目標選項中該組合被移除 |
| T99 | 批號 LOV — 依物料+工廠+庫位篩選 | 僅顯示符合條件的批號記錄 |
| T100 | 批號 LOV — 帶入庫存水位 | 帶入 mmb.AVL_QTY 到 D.STOCK_QTY |
| T101 | 工廠切換 → 庫位重置 | 切換工廠後庫位選項重新載入，已選庫位清空 |
| T102 | 工廠切換 → 批號重置 | 切換工廠後批號選項重新載入，已選批號清空 |
| T103 | 庫位切換 → 批號重置 | 切換庫位後批號選項重新載入 |
| T104 | 庫存水位即時警告 | 出庫數量 > 庫存水位時，前端即時顯示警告（不送後端） |
| T105 | 切換異動類型 → 清除資料 | 切換類型後表頭/表身所有資料清空，條件欄位重新顯示 |
