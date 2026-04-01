# SA_IM004: 庫存異動單

版本：1.0 | 文件日期：Aug 29, 2025 | 轉換時間：2026-03-19 11:38

---


本文件

- 若有SQL Statement，目的僅為示意參考與加速了解之用。後續以實際開發之源代碼(Source Code)為準。
- 為求格式統一及閱讀性，所有文字使用<微軟正黑體>字型


## 業務需求(Business Requirements)

庫存異動單支援的移動類型

- 庫存調撥單（D01）：在不同工廠或庫位間調撥物料，保持總庫存價值不變。

- 成本中心領用（D02）：將庫存物料分配至成本中心使用，用於內部消耗追蹤。

- 存貨報廢處理（D03）：處理損壞、過期或無法使用的物料，產生損失記錄。

- 雜收(D04) : 處理盤盈、退料入庫、免費贈品等無特定來源的庫存增加。

- 雜發(D05) : 處理盤虧、損耗、樣品贈送等無特定目的的庫存減少


## 程式列表 (Program List)


| **模組** | **編號#** | **程式 子編號** | **系統上使用者程式名稱** **(User Program Name)** | **程式簡碼** | **簡述/對應功能分項說明** | **程式類型** |
| --- | --- | --- | --- | --- | --- | --- |
| IM | 004 | 1 | 庫存異動單 | IMManage | 由擁有權限之使用者維護庫存異動相關操作與會計過帳記錄。 | 網頁 |


## 設計及功能要點 (Design & Function Points)


### 「IM004：庫存異動單」


#### 介面設計：（此版爲claude 產生，配色僅供參考）

- 查詢頁面：
![images/img_005.png](images/img_005.png)

- 新增、編輯頁面：
![images/img_004.png](images/img_004.png)


#### 頁面欄位說明

查詢頁面-篩選條件 **[IM_DOC_HEADER]H . [IM_DOC_DETAIL] D, [GL_COMPANY_SET] C**：


| **UI欄位名稱** | **UI 元件** | **欄位描述/重要說明** |
| --- | --- | --- |
| 文件編號 |  | H.INV_NO |
| 異動類型 | Selection | H.MVT_TYPE (下拉選單來源:PF_TYPE = ‘INV_MVT’) |
| 文件狀態 | Selection | H.DOC_STATUS ( 下拉選單項目:固定值 A:暫存、P:已過帳 ) |
| 文件日期起 | Date | H.INV_DOC_DATE |
| 文件日期迄 | Date | H.INV_DOC_DATE |

查詢頁面- 查詢結果 **[IM_DOC_HEADER]H . [IM_DOC_DETAIL] D **


| **UI欄位名稱** | **欄位描述/重要說明** |
| --- | --- |
| 文件編號 | H.INV_NO |
| 異動類型 | H.MVT_TYPE |
| 文件狀態 | H.DOC_STATUS |
| 參考文件 | H.REF_DOC_NO |
| 項目數 | COUNT(D.INV_DETAIL_ID) GROUP BY D.INV_NO |
| 總金額 | SUM(D.TOTAL_AMOUNT) GROUP BY D.INV_NO |
| 文件日期 | H.INV_DOC_DATE |
| **過帳時間** | H.POSTING_DATE |
| 操作 | 狀態為已過帳者，僅可檢視資料，不可進行異動 |


**新增頁面-表頭資料 [IM_DOC_HEADER]H , [GL_PROFIT_CTR_SET] GPC , [GL_COST_CTR_SET] GCC：**


| **UI欄位名稱** | **新增頁** **可修改** | **修改頁** **可修改** | **UI 元件** | **欄位描述/重要說明** |
| --- | --- | --- | --- | --- |
| 異動類型 |  |  | Selection | H.MVT_TYPE (下拉選單來源: PF_TYPE = ‘INV_MVT’) |
| 過帳日期 |  |  | Date | H.POSTING_DATE ; 預設值 今天 |
| 文件日期 |  |  | Date | H.INV_DOC_DATE ; 預設值 今天 |
| 成本中心 |  |  | LOV | H.COST_CODE 欄位顯示判斷參考如下C2.1章節說明 取畫面選定之COMPANY_CODE查詢相符且有效GCC.COST_CTR_CODE、GCC.COST_CTR_NAME：選定後使GCC.COST_CTR_CODE寫入H.COST_CODE |
| 利潤中心 |  |  | LOV | H.PROFIT_CODE 欄位顯示判斷參考如下C2.1章節說明 取畫面選定之COMPANY_CODE查詢相符且有效GPC. PROFIT_CODE、GPC.PROFIT_NAME：選定後使GPC. PROFIT_CODE寫入H.PROFIT_CODE |
| 調撥單號 |  |  |  | H.REF_DOC_NO |
| 報廢原因 |  |  |  | H.DESCRIPTION |
| 雜收/雜發原因 |  |  |  | H.DESCRIPTION |
| 領用申請 |  |  |  | H.REF_DOC_NO |


異動項目明細**[IM_DOC_DETAIL] D**


| **MM_MATERIAL** | **a** |
| --- | --- |
| **MM_UNIT** | **mu** |
| **MM_MATERIAL_STORAGE** | **mms** |
| **IM_SLOC ** | **sl** |
| **MM_MATERIAL_BATCH ** | ***mmb*** |
| **MM_MATERIAL_VALUATION** | ***mmv*** |
| **GL_PERIOD_STATUSES** | **GPS** |
| **GL_JOURNAL_HEADER** | **GJH** |
| **GL_JOURNAL_DETAIL** | **GJD** |
| **GL_LEDGER_GROUP** | **GLG** |
| **GL_COMPANY_SET** | **GCS** |
| **GL_ACCOUNT_COMPANY** | **GAC** |
| **GL_POSTING** | **GP** |


| **UI欄位名稱** | **新增頁** **可修改** | **修改頁** **可修改** | **UI 元件** | **欄位描述/重要說明** |
| --- | --- | --- | --- | --- |
| 項次 | N |  |  | D.LINE_NUM; 依畫面順序編號、不可跳號 |
| 物料代碼 |  |  | LOV | D.MATERIAL_CODE ; LOV 資料來源 2.1 |
| 物料名稱 | N |  |  | D.MATERIAL_DESC; 新增時使用者選擇物料編號LOV後一併帶入 |
| 數量 |  |  | NUMBER | D.QUANTITY; 需輸入正數 |
| 單位 | N |  |  | D.UNIT; |
| 工廠 |  |  | LOV | D.PLANT_CODE； LOV資料來源 2.2 |
| 庫位 |  |  | LOV | D.SLOC_CODE； LOV資料來源 2.3 |
| 目標工廠 |  |  | LOV | D.TARGET_PLANT_CODE；LOV資料來源 2.2 欄位顯示判斷參考如下說明 |
| 目標庫位 |  |  | LOV | D.TARGET_SLOC_CODE；LOV資料來源 2.4 欄位顯示判斷參考如下C2.1章節說明 |
| 批次號 |  |  | LOV | D.BATCH_NO ; LOV資料來源 2.5 |
| 單價 | N |  | NUMBER | D.UNIT_PRICE; 新增時使用者選擇物料號LOV後一併帶入 |
| 金額 | N |  | NUMBER | D.TOTAL_AMOUNT; D.UNIT_PRICE * D.QUANTITY |
| 庫存水位 | N |  |  | D.STOCK_QTY；新增時使用者選擇庫位or 批號LOV後一併帶入 |
| 操作-刪除鈕 |  |  |  | 該單據已過帳時不可刪除 |

LOV 資料來源

```
-- 2.1 料號資料來源
SELECT a.MATERIAL_CODE , a.MATERIAL_NAME, a.MAIN_UNIT,
a.ENABLE_BATCH_CONTROL,   -- 啟動批號控制? Y/N
mu.UNIT_DEC ,    -- 單位小數位數
mmv.AVG_PRICE,    -- 單價 (畫面顯示小數兩位，NULL值時不可選擇)
concat(adp.pf_value ,' - ', mmv.VAL_CLASS )   -- 評價類別
FROM  MM_MATERIAL a,
MM_UNIT mu,
MM_MATERIAL_VALUATION mmv,
AU_DATA_PROFILE adp 
WHERE a.STATUS = 'A'  -- 啓用
AND a.COMPANY_CODE = '1000'  -- 前端畫面傳入
AND a.COMPANY_CODE  = mmv.COMPANY_CODE 
AND a.MATERIAL_CODE  = mmv.MATERIAL_CODE 
AND a.MAIN_UNIT = mu.UNIT_CODE
  AND adp.PF_TYPE = 'VAL_CLASS' 
  AND mmv.VAL_CLASS = adp.PF_CODE;

  -- 2.2 工廠/ 目標工廠 資料來源
  SELECT pl.plant_code,pl.PLANT_NAME1  
     FROM IM_PLANT pl 
  WHERE pl.company_code = '1000'   -- 前端畫面傳入
    AND pl.is_active = 'Y';
  
  -- 2.3 庫位 資料來源
  SELECT mms.PLANT_CODE ,  -- 工廠
  mms.SLOC_CODE,  -- 庫位
  mms.AVL_QTY      -- 庫存水位
  FROM MM_MATERIAL_STORAGE mms
 WHERE mms.COMPANY_CODE = '1000'  -- 前端畫面傳入
AND mms.MATERIAL_CODE = 'M001000001' -- 前端畫面傳入
AND mms.AVL_QTY >0;
    
  -- 2.4 目標庫位 資料來源
  SELECT sl.PLANT_CODE,sl.SLOC_CODE,sl.SLOC_DESC 
  FROM IM_SLOC sl 
  WHERE sl.COMPANY_CODE = '1000'  -- 前端畫面傳入
    AND sl.plant_code = 'P001'  -- 前端畫面傳入
    AND sl.IS_ACTIVE = 'Y';
  
  -- 2.5 批號 資料來源
  SELECT mmb.PLANT_CODE , mmb.SLOC_CODE , mmb.AVL_QTY, -- 庫存
         mmb.BATCH_NO   -- 批號
    FROM MM_MATERIAL_BATCH mmb 
  WHERE mmb.COMPANY_CODE = '1000' -- 前端畫面傳入
    AND mmb.MATERIAL_CODE = 'M002000001'  -- 前端畫面傳入
    AND mmb.PLANT_CODE  = 'P001'  -- 前端畫面傳入
    AND mmb.SLOC_CODE  = 'S003'   -- 前端畫面傳入
  ;
```


#### 功能要點：

- **執行時機：**隨時。
- **假設前提： **
公司代碼(COMPANY_CODE)：依 ROLE_PROFILE帶出預設公司代碼(COMPANY_CODE)值。

- **操作要點及卡控：**
  - 查詢：
需判斷當文件過帳日期有值時，僅顯示檢視鈕；反之，顯示編輯與刪除鈕。

  - 新增/編輯鈕：
    - 使用者切換異動類型時，須將畫面資料清除，並針對不同的異動類別顯示不同的欄位供輸入：
      - IM_DOC_HEADER:

| **異動類型** | **額外顯示欄位** |
| --- | --- |
| **D01** | 調撥單號 |
| **D02** | 成本中心、報廢原因 |
| **D03** | 成本中心、領用申請 |
| **D04、D05** | 雜收/雜發原因 |

      - IM_DOC_DETAIL:

| **異動類型** | **額外顯示欄位** |
| --- | --- |
| **D01** | 目標工廠、目標庫位 |


  - 儲存前檢查：
    - 必填檢查：異動類型、過帳日期、文件日期。
    - 邏輯檢查：
使用者在明細表格中挑選物料時，同一張庫存異動單中，不允許挑選不同[評價類別]物料資料。

  - 儲存後檢查：
    - 新增/編輯頁面
      - 儲存 鈕: 儲存畫面上資料；主要資料表資料[IM_DOC_HEADER]、[IM_DOC_DETAIL]
      - 過帳 鈕:
        - 建立 [MM_TRANSACTIONS] MT庫存交易檔資料
當異動類別為’D01’時須建立兩筆物料交易資料 [一進一出]；其他異動類別則針對每一筆異動明細物料，建立庫存交易檔資料；


| 欄位名稱 | 必填欄位 | 欄位描述/重要說明 |
| --- | --- | --- |
| COMPANY_CODE | Y | 依照前端記錄寫入 例：1000 |
| TXN_ID | Y |  |
| MATERIAL_CODE | Y | D.MATERIAL_CODE ; |
| MATERIAL_NAME | Y | D.MATERIAL_DESC; |
| TXN_DT | Y | H.INV_DOC_DATE |
| MVT_TYPE |  | H. MVT_TYPE |
| DESCRIPTION |  | H.DESCRIPTION |
| DOC_NO |  | H.INV_NO |
| STOCK_TYPE_REDUSE | S | H.MVT_TYPE = ‘D02’,”D03”, “D05”時寫入“AVL”固定值 |
| STOCK_TYPE_ADD | S | H.MVT_TYPE = ‘D04’ 時寫入“AVL” 固定值 ; |
| TXN_QTY | Y | D.QUANTITY |
| TXN_UNIT |  | D.UNIT |
| PLANT_CODE |  | D.PLANT_CODE； |
| SLOC_CODE |  | D.SLOC_CODE； |
| BATCH_NO |  | D.BATCH_NO |
| UNIT_PRICE |  | D.UNIT_PRICE |
| TOTAL_AMT | Y | D.TOTAL_AMOUNT; |
| CURRENCY_CODE |  | 空 |
| SOURCE_LINE_ID |  | 空 |
| VENDOR_CUSTOMER |  | 空 |
| POSTING_DATE |  | H.POSTING_DATE |
| REMARK |  |  |


        - 更新移動平均成本表格資料[MM_MATERIAL_VALUATION]；更新邏輯請參考" 15-CO成本模組\SA_CO003-1 與SA_CO003-2  之md 檔
        - 當H.MVT_TYPE IN ‘D02’,’D03’, ‘D04’,’D05’ 時需產生傳票
傳票建檔邏輯如下：


| 欄位名稱 | 必填欄位 | 欄位描述/重要說明 |
| --- | --- | --- |
| 傳票表頭 |  |  |
| JE_HEADER_ID | Y | 以JE(固定值) + H.company_Code+GJH.PERIOD_YEAR的組合作爲PREFIX，查詢AGN.PREFIX 取得AGN.CURRENT_NUMBER 寫入：PREFIX+「CURRENT_NUMBER+1」 例：JE10002025000012674 |
| DOC_TYPE | Y | MP (固定值) |
| COMPANY_CODE | Y | 依照前端記錄寫入 例：1000 |
| PERIOD_YEAR | S | 資料來源：以畫面上過帳日期[D.POSTING_DATE]+公司代碼於GPS表格中取得該年度，且GPS.STATUS = ‘O’條件下，取得年度[GPS.PERIOD_YEAR]、期別[GPS.PERIOD_NUM]與會計年度ID[PERIOD_SET_ID] 將上述取得之年度值，寫入GJH.PERIOD_YEAR |
| LEDGER_GROUP_CODE | Y | 以畫面上的COMPANY_CODE查詢GLG.LEDGER_GROUP_CODE |
| DESCRIPTION |  | “庫存異動單號：”+ H.INV_NO |
| JOURNAL_DATE | Y | 系統當日 |
| POSTING_DATE | Y | H.POSTING_DATE |
| PERIOD_SET_ID | Y | 參考PERIOD_YEAR資料來源說明，取得之會計年度ID值，寫入GJH.PERIOD_SET_ID |
| PERIOD_NUM | Y | 參考PERIOD_YEAR資料來源說明，取得之期別值，寫入GJH.PERIOD_NUM |
| BASE_CURRENCY | Y | 以COMPANY_CODE查詢GCS.BASE_CURRENCY |
| TXN_CURRENCY | Y | 以COMPANY_CODE查詢GCS.BASE_CURRENCY |
| IS_REVERSED | Y | 固定N |
| SOURCE_TYPE | Y | H. MVT_TYPE  IN  (‘D02’, ‘D04’) 寫入 ‘D’ H.MVT_TYPE IN (‘D03’,’D05’)   寫入 ‘G’ |
| SOURCE_DOC_ID | Y | H.INV_NO |
| 傳票表身 |  |  |
| JE_LINE_ID | Y | 取JE_HEADER_ID+三碼序號，依照分錄產生順序添加 例MP100020250000012647001 |
| JE_HEADER_ID | Y | JE_HEADER_ID |
| LINE_NUM | Y | 系統依單筆傳票產生三碼序號 例：001 |
| LEDGER_CODE | Y | 以GJH.LEDGER_GROUP_CODE及+公司代碼，取得GLG.LEDGER_CODE 以LEDGER_CODE查詢GL_LEDGER 取得“IS_LEADING”的LEDGER_CODE寫入GJD.LEDGER_CODE （日後存在延伸帳邏輯時，此段需改呼叫獨立功能） |
| PERIOD_NUM | Y | GJH.PERIOD_NUM |
| ACCOUNT_TYPE | Y | 依照異動類型賦予會計科目：實際作業單次應爲2筆以上的記錄建檔 取得科目邏輯，參考如下D1章節說明 查詢GAC取得GAC.ACCOUNT_TYPE |
| ACCOUNT_CODE | Y | 參考ACCOUNT_TYPE欄位內，取得科目邏輯步驟中ACCOUNT_CODE |
| COMPANY_CODE | Y | 同GJH.COMPANY_CODE |
| CURRENCY_CODE | Y | 同GJH. BASE_CURRENCY |
| BASE_CURRENCY | Y | 同GJH. BASE_CURRENCY |
| DC_INDICATOR | Y | 參考ACCOUNT_TYPE欄位內，取得科目邏輯步驟中DC_INDICATOR |
| POSTING_KEY | Y | 以預計寫入的COMPANY_CODE,ACCOUNT_TYPE及DC_INDICATOR由GP 表格中取得GP.POSTING_KEY |
| DESCRIPTION |  | 空 |
| ENTER_AMT | Y | SUM(D.TOTAL_AMOUNT) GROUP BY D.INV_NO |
| ACCOUNT_AMT | Y | SUM(D.TOTAL_AMOUNT) GROUP BY D.INV_NO |
| INVOICE_NO |  | 空 |
| IS_TAX |  | N (固定值) |
| TAX_CODE |  | 空 |
| TAX_AMT |  | 空 |
| TAX_BASE_AMT |  | 空 |
| PROFIT_CODE |  | H.PROFIT_CODE |
| COST_CODE |  | H.COST_CODE |
| PARTY_TYPE |  | 依GJD.ACCOUNT_CODE 查詢GAC表格，取得GAC.REPORT_TYPE |
| CUSTOMER_CODE |  | 空 |
| SO_NO |  | 空 |
| VENDOR_CODE |  | 空 |
| PO_NO |  | 空 |
| ASSET_CODE |  | 空，如有AA模組時需添加邏輯 |
| SUB_ASSET_CODE |  | 空，如有AA模組時需添加邏輯 |
| MATERIAL_CODE |  | 空 |
| REF_DOC |  | 空 |
| IS_CLEAR |  | 如爲供應商科目時壓Y，請款科目爲空 |
| CLEAR_COMPLETE |  | 空 |
| CLEAR_JE_ID |  | 空 |


      - 驗證紐：針對過帳紐寫入傳票前的資料取得有問題時，顯示錯誤訊息。
- **程式處理邏輯：**
  - 取得傳票科目資料邏輯

```sql
-- 1.取得第一筆科目  (存貨)
-- 1.1 讀取物料主檔的 Valuation Class → F920
SELECT mmv.VAL_CLASS FROM MM_MATERIAL_VALUATION mmv
WHERE mmv.MATERIAL_CODE = 'M003000001'  -- 傳入第一筆的物料，因一單據只有一種val_class
AND mmv.COMPANY_CODE  = '1000';  -- 前端畫面傳入
-- 1.2 取得存貨科目 (ex: INP/3000 → 140100 原料存貨) 目前設定為貸方
-- 1.2.1 取得借/貸方值
SELECT amm.DC_INDICATOR, amm.TXN_KEY  FROM AU_MVTXN_MAPPING amm
WHERE amm.COMPANY_CODE ='1000'   -- 前端畫面傳入
AND amm.MVT_TYPE = 'D02';  --依照畫面的異動類別傳入
-- 1.2.2 取得對應會計科目; 若2.1 dc_indicator = 'C' 則科目值為 atk.cr_account;否則，科目為atk.dr_account
SELECT atk.DR_ACCOUNT ,atk.CR_ACCOUNT
FROM AU_TXN_KEY atk WHERE atk.COMPANY_CODE = '1000'     -- 前端畫面傳入
AND atk.TXN_KEY = 'INP'     -- 傳入2.1 取得之txn_key
AND atk.VAL_CLASS = 'F920'; -- 傳入1 取得之val_class
-- 2. 取得TXN_KEY 值
If 異動類別 = 'D02' OR 異動類別 = 'D05' then @TXN_KEY = 'OEI', @ SUB_TXN_KEY = 'IGI'   -- 成本中心領用、雜發
ELSE IF  異動類別 = 'D03' then @TXN_KEY = 'OEI', @ SUB_TXN_KEY = 'DST'  -- 報廢
ELSE IF  異動類別 = 'D04' then @TXN_KEY = 'OEI', @ SUB_TXN_KEY = 'NPR'  -- 雜收
END IF
-- 3. 取得第二筆科目  (費用)
-- 3.1 取得借/貸方值 : 若1.2.1 為借方，此處值為貸方”C”；反之，則為借方”D”
-- 3.2 由步驟2 取得對應會計科目; 若3.1 dc_indicator = 'C' 則科目值為 atk.cr_account;否則，科目為atk.dr_account
SELECT atk.DR_ACCOUNT ,atk.CR_ACCOUNT
FROM AU_TXN_KEY atk WHERE atk.COMPANY_CODE = '1000'     -- 前端畫面傳入
AND atk.TXN_KEY = 'INP'     -- 傳入2 取得之txn_key
AND atk.SUB_TXN_KEY = 'IGI'     -- 傳入2 取得之SUB_TXN_KEY
```


  - 由客製表格篩選及異動資料，詳細資料表規格請參閱Q3結構設計規格 。


## 相關資料表及存取權限 (Relevant Tables and Access Privileges)


| Table / View / Sequence | 別名 | Description | 查詢 | 新增 | 修改 | 刪除 | 其他 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IM_DOC_HEADER | H | 庫存異動單主檔 | √ |  |  |  |  |
| IM_DOC_LINE | D | 庫存異動單明細檔 | √ |  |  |  |  |