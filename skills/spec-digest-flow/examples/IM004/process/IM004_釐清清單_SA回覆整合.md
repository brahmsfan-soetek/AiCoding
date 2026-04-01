# IM004 庫存異動單 — 釐清清單 SA 回覆整合

> 產出日期：2026-03-31
> 原始釐清清單 → SA 回覆 → 開發者整合分析

---

## 回覆摘要總覽

| 狀態 | 數量 | 說明 |
|:---:|:---:|------|
| ✅ 已解決 | **22** | SA 已明確回覆，可直接實作 |
| ⚠️ 需小確認 | **3** | 細節待確認但不阻塞實作 |
| ⏭️ 延後 | **1** | SA 指示先跳過 |

---

## 重大變動（已全部確認）

### NEW-1 ✅ 成本計算（IM_MATERIAL_VALUATION 更新）**保留**

**最終確認：** 拿掉的是前端「成本影響」顯示區塊，**後端成本計算仍需執行**。

過帳時 D02/D03/D04/D05 需更新 IM_MATERIAL_VALUATION：
- STOCK_QTY（增減）
- STOCK_VALUE（增減，qty × 當前均價）
- AVG_PRICE（D01~D05 皆不變）
- 寫入 IM_MATERIAL_AVGPRICE_LOG 稽核日誌

成本計算邏輯依照 SA_CO003-1 的 TransactionType 對照：

| 異動類型 | TransactionType | QTY | VALUE | AVG_PRICE |
|---------|----------------|-----|-------|-----------|
| D01 | **不呼叫** | 不變 | 不變 | 不變 |
| D02 | GI | -qty | -(qty × avg) | 不變 |
| D03 | SCRAP | -qty | -(qty × avg) | 不變 |
| D04 | MIS_REC | +qty | +(qty × avg) | 不變 |
| D05 | MIS_DEL | -qty | -(qty × avg) | 不變 |

---

### NEW-2 ✅ 資料表前綴全面變更：MM_ / INV_ → IM_

**最終確認：** 規格中所有 `MM_` 和 `INV_` 開頭的表名都對應到 `IM_` 開頭。

| 規格中的表名 | 實際表名 |
|------------|--------|
| MM_MATERIAL | IM_MATERIAL |
| MM_UNIT | IM_UNIT |
| MM_MATERIAL_VALUATION | IM_MATERIAL_VALUATION |
| MM_MATERIAL_STORAGE | IM_MATERIAL_STORAGE |
| MM_MATERIAL_BATCH | IM_MATERIAL_BATCH |
| MM_TRANSACTIONS | IM_TRANSACTIONS |
| MM_MATERIAL_AVGPRICE_LOG | IM_MATERIAL_AVGPRICE_LOG |

---

### NEW-3 ✅ GL_JOURNAL 表結構已變更

**最終確認，關鍵對照：**

#### GL_JOURNAL_HEADER

| 規格概念 | 實際 DDL 欄位 | 說明 |
|---------|-------------|------|
| PK | DOC_HEADER_ID（BIGINT AUTO_INCREMENT） | 不再需要手動編 PK |
| JE_HEADER_ID | **JE_NO**（VARCHAR(21)） | 仍需 AU_GEN_NUMBER 取號 |
| 其他欄位 | 同規格定義 | DAILY_RATE / RATE_DATE / ATTRIBUTE1~5 等新增欄位填 NULL |

#### GL_JOURNAL_DETAIL

| 規格概念 | 實際 DDL 欄位 | 說明 |
|---------|-------------|------|
| PK | DOC_DETAIL_ID（BIGINT AUTO_INCREMENT） | 不再需要手動編 PK |
| JE_HEADER_ID (FK) | **DOC_HEADER_ID** (BIGINT FK) + **JE_NO** | 需同時寫入兩欄 |
| TXN_KEY（新增） | TXN_KEY VARCHAR(5) | 存貨分錄填步驟 1.2.1 的 TXN_KEY（如 'INP'）；費用分錄填 'OEI' |
| 付款相關欄位（新增） | PAYMENT_TERMS / PAYMENT_METHOD 等 | IM004 場景全部 NULL |

---

## 已解決項目（✅ 可直接實作）

### 1-1 / 1-2 ✅ INV_NO / TXN_ID 編碼規則

**SA 回覆：**
- INV_NO → `INVYYYYMM***`，起始 001，遞增 +1
- TXN_ID → `TXNYYYYMM***`，起始 001，遞增 +1

**實作決策：**
- 兩者都走 AU_GEN_NUMBER 取號
- INV_NO：FORM_TYPE 推測為 `INV`，PREFIX = `INV` + YYYYMM
- TXN_ID：FORM_TYPE 推測為 `TXN`，PREFIX = `TXN` + YYYYMM
- YYYYMM 取自文件日期（H.INV_DOC_DATE）還是過帳日期（H.POSTING_DATE）？→ INV_NO 取文件日期、TXN_ID 取過帳日期（需確認）
- `***` 為三碼流水號？若單月超過 999 筆怎麼辦？→ 由 AU_GEN_NUMBER.END_NUMBER 控制上限

⚠️ **仍需小確認：**
- YYYYMM 的「年月」取自哪個日期欄位？
- `***` 的位數是固定三碼？還是可變長度？
- AU_GEN_NUMBER 的 FORM_TYPE 值分別是什麼？

---

### 1-3 ✅ D02/D03 欄位確認對調

**SA 回覆：** 確認正確的對應為——
- D02（成本領用）→ 成本中心 + 領用申請
- D03（存貨報廢）→ 成本中心 + 報廢原因

**實作決策：** 原始規格 D02/D03 的額外欄位已對調修正。

---

### 1-4 ✅ 表頭欄位完整的條件顯示規則

**SA 回覆：**

| 異動類型 | 共用欄位 | 額外欄位 |
|---------|---------|---------|
| D01 | 異動類型、過帳日期、文件日期 | 調撥單號 |
| D02 | 異動類型、過帳日期、文件日期 | 成本中心、領用申請 |
| D03 | 異動類型、過帳日期、文件日期 | 成本中心、報廢原因 |
| D04 | 異動類型、過帳日期、文件日期 | **利潤中心**、收貨原因 |
| D05 | 異動類型、過帳日期、文件日期 | **利潤中心**、發貨原因 |

**關鍵變動（vs 原始規格）：**
- D04/D05 使用**利潤中心**而非成本中心（原始規格未寫利潤中心在哪些類型顯示）
- D04 的描述改為「收貨原因」（原寫「雜收/雜發原因」）
- D05 的描述改為「發貨原因」（原寫「雜收/雜發原因」）
- 都對應到 H.DESCRIPTION 欄位

**實作決策：** 以此表為準。

**⚠️ 衍生確認：** 傳票表身 GJD.PROFIT_CODE / GJD.COST_CODE 的填入邏輯需跟著調整：
- D02/D03 → GJD.COST_CODE = H.COST_CODE，GJD.PROFIT_CODE = NULL？
- D04/D05 → GJD.PROFIT_CODE = H.PROFIT_CODE，GJD.COST_CODE = NULL？

---

### 1-5 ✅ 科目邏輯 TXN_KEY 確認

**SA 回覆：** 費用科目取得邏輯確認為 `TXN_KEY = 'OEI'`，SQL 範例中的 `'INP'` 為誤植。

**實作決策：**
- D02/D05 → TXN_KEY = 'OEI', SUB_TXN_KEY = 'IGI'
- D03 → TXN_KEY = 'OEI', SUB_TXN_KEY = 'DST'
- D04 → TXN_KEY = 'OEI', SUB_TXN_KEY = 'NPR'

---

### 1-6 ✅ AU_GEN_NUMBER 表結構已提供

**SA 回覆：** 表名 = `AU_GEN_NUMBER`，完整 DDL 已提供。

**關鍵欄位：**
- PK：RANGE_ID（BIGINT AUTO_INCREMENT）
- UK：FORM_TYPE + PREFIX + N_YEAR
- 取號：CURRENT_NUMBER + 1，需注意 END_NUMBER 上限
- 需寫入 UPDATER / UPDATE_DT

**實作決策：** 取號流程為——
1. `SELECT CURRENT_NUMBER FROM AU_GEN_NUMBER WHERE FORM_TYPE = ? AND PREFIX = ? AND N_YEAR = ? FOR UPDATE`（鎖定行）
2. 新號 = CURRENT_NUMBER + 1
3. 檢查是否超過 END_NUMBER
4. `UPDATE AU_GEN_NUMBER SET CURRENT_NUMBER = 新號`
5. 組合：PREFIX + 新號（補零）

---

### 1-7 ✅ 修改頁面可修改欄位已澄清

**SA 回覆：** 「空白表示可修改，N 表示不可修改」

**實作決策：** 回到原始規格重新解讀——表頭欄位表中「修改頁可修改」欄：
- 空白（√）= 可修改
- N = 不可修改

所以修改頁面上，表頭和表身大部分欄位**都是可修改的**（空白欄位居多），只有項次、物料名稱、單位、單價、金額、庫存水位等計算/帶入欄位為 N（不可改）。

---

### 2-1 ✅ LOV 2.3 加上 PLANT_CODE 篩選 + D04 移除 AVL_QTY > 0

**SA 回覆：** PLANT_CODE「要加」；D04 的 `AVL_QTY > 0` 確認移除。

**實作決策：** LOV 2.3 SQL 依異動類型動態調整：
```sql
-- D01(出庫端) / D02 / D03 / D05（出庫類型）
WHERE mms.COMPANY_CODE = :COMPANY_CODE
  AND mms.MATERIAL_CODE = :MATERIAL_CODE
  AND mms.PLANT_CODE = :PLANT_CODE        -- 新增
  AND mms.AVL_QTY > 0;

-- D04（雜收，入庫類型）
WHERE mms.COMPANY_CODE = :COMPANY_CODE
  AND mms.MATERIAL_CODE = :MATERIAL_CODE
  AND mms.PLANT_CODE = :PLANT_CODE        -- 新增
  -- 不篩選 AVL_QTY，允許選擇庫存為 0 的庫位
```

---

### 2-3 ✅ D01 目標端庫存記錄使用 UPSERT

**SA 回覆：** 「要 UPSERT」

**實作決策：**
- 更新 IM_MATERIAL_STORAGE 時使用 `INSERT ... ON DUPLICATE KEY UPDATE`
- 更新 IM_MATERIAL_BATCH 同理（D01 批次物料）
- UPSERT 時需處理的欄位：AVL_QTY（增加）

---

### 2-4 ✅ D01 調撥沿用同一批次號

**SA 回覆：** 「同一批次號」

**實作決策：** D01 入庫端的 BATCH_NO = 出庫端的 BATCH_NO，不需要額外的「目標批次號」欄位。

---

### 2-5 ✅ 併發控制：悲觀鎖（儲存時行鎖）

**SA 回覆：** 「悲觀鎖，可以進入但儲存時進行行鎖」

**實作決策：**
- 不在開啟編輯時鎖定（與最新規格確認 #6 的描述不同）
- 改為儲存時使用 `SELECT ... FOR UPDATE` 行級鎖
- 如果兩人同時編輯同一張單據，後儲存的人會被阻塞直到前者完成
- 需處理鎖等待超時的錯誤訊息

**⚠️ 注意：** 此回覆與最新規格確認 #6 矛盾（#6 說「後面的人不能正常打開單據」），SA 現在改為「可以進入但儲存時鎖定」。以最新回覆為準。

---

### 2-6 ✅ D01 來源/目標不可相同：動態排除

**SA 回覆：** 「來源選了，目標那欄就從選項中移除」

**實作決策：** 前端 D01 的目標工廠 + 目標庫位 LOV 篩選時，排除已選的來源工廠+庫位組合。

---

### 2-7 ✅ 硬刪除

**SA 回覆：** 「照 SA 設計的硬刪除，表格都沒有軟刪除欄位」

**實作決策：** `DELETE FROM IM_DOC_DETAIL WHERE ...` + `DELETE FROM IM_DOC_HEADER WHERE ...`

---

### 2-9 ✅ 傳票金額為整單合計

**SA 回覆：** 「應該是整筆」

**實作決策：** 一張異動單 → 一張傳票 → 兩筆分錄（存貨 + 費用），金額 = SUM(TOTAL_AMOUNT)。

---

### 2-12 ✅ 成本計算摘要欄位修正

**SA 回覆：** 「正確是 項目總數 + 總數量 + 總金額」

**實作決策：**

| 欄位 | 說明 |
|------|------|
| 項目總數 | COUNT(明細行) |
| 總數量 | SUM(D.QUANTITY) |
| 總金額 | SUM(D.TOTAL_AMOUNT) |

---

### 4-2 ✅ D04 單價不可修改

**SA 回覆：** 「使用者不可修改單價」

**實作決策：** 所有異動類型的 D.UNIT_PRICE 都由 LOV 帶入（mmv.AVG_PRICE），前端 disabled。

---

### 其他已解決

| # | SA 回覆 | 實作決策 |
|---|--------|---------|
| 2-11 | 不管，全空查全部 | 查詢篩選全選填，空值不帶條件 |
| 3-1 | DETAIL 是對的 | 表名 = IM_DOC_DETAIL |
| 3-3 | 先保持 REDUSE | 欄位名維持 STOCK_TYPE_REDUSE |
| 3-4 | 先別管，有共用元件區 | 前端元件可行性不需確認 |
| 3-6 | 無共用 utility | 傳票邏輯需在 IM004 中自行實作 |
| 4-4 | SA 沒定，自訂 | 開發者自行定義錯誤碼 |
| 4-5 | ORM 自動填入 | 審計欄位不需手動處理 |
| 4-6 | 有 COMPANY_CODE 欄位 | IM_DOC_HEADER 中有此欄位，依登入者 session 寫入 |
| 4-7 | 可 NULL | IS_CLEAR 在 IM004 場景全部填 NULL |

---

## ⚠️ 仍需小確認（不阻塞實作，開發中遇到再問）

### OPEN-1 🟡 INV_NO / TXN_ID 的 YYYYMM 取自哪個日期

SA 回覆只說了格式 `INVYYYYMM***` / `TXNYYYYMM***`，未說明年月取自哪個日期。

**暫定方案（可先實作）：**
- INV_NO → 取 H.INV_DOC_DATE 的年月（文件日期）
- TXN_ID → 取 H.POSTING_DATE 的年月（過帳日期）

---

### OPEN-2 🟡 INV_NO / TXN_ID 流水號位數

`***` 暗示三碼（最多 999 筆/月），但 AU_GEN_NUMBER.CURRENT_NUMBER 為 BIGINT。

**暫定方案：** 固定三碼補零（如 `INV202603001`），超過 END_NUMBER 時拋錯。

---

### OPEN-3 🟡 驗證鈕的檢查範圍

**已確認方向：** 業務面檢查（會計期間、庫存、科目查詢）在驗證鈕做；程式面安全檢查（AGN 取號等）在過帳時做。

---

## ⏭️ 延後項目

| # | SA 回覆 | 說明 |
|---|--------|------|
| 3-5 | VAL_AREA = COMPANY_CODE | 成本計算已確認保留，此假設先沿用，遇到再問 |

---

## 確認後的完整過帳流程

```
步驟 0  前置檢查
        ├─ 必填欄位檢查
        ├─ 會計期間開放（GPS.STATUS = 'O'）
        └─ 後端庫存充足檢查（IM_MATERIAL_VALUATION.STOCK_QTY，出庫類型 D02/D03/D05）

步驟 1  更新單據狀態
        └─ IM_DOC_HEADER.DOC_STATUS → 'P'

步驟 2  建立庫存交易記錄
        └─ INSERT INTO IM_TRANSACTIONS
           D01: 每筆明細 2 筆（一出一入）
           D02~D05: 每筆明細 1 筆

步驟 3  更新移動平均成本（僅 D02/D03/D04/D05）
        ├─ UPDATE IM_MATERIAL_VALUATION（STOCK_QTY, STOCK_VALUE）
        │  AVG_PRICE 不變（D01~D05 皆不變）
        └─ INSERT INTO IM_MATERIAL_AVGPRICE_LOG

步驟 4  產生傳票（僅 D02/D03/D04/D05）
        ├─ AU_GEN_NUMBER 取號 → JE_NO
        ├─ INSERT INTO GL_JOURNAL_HEADER
        └─ INSERT INTO GL_JOURNAL_DETAIL（至少 2 筆分錄，一借一貸）

步驟 5  COMMIT（任一步驟失敗 → 全部 ROLLBACK）
```

### 範圍內 vs 範圍外

| 項目 | 範圍 |
|------|:---:|
| IM_DOC_HEADER / IM_DOC_DETAIL（CRUD） | ✅ 範圍內 |
| IM_TRANSACTIONS（新增） | ✅ 範圍內 |
| IM_MATERIAL_VALUATION（成本更新） | ✅ 範圍內 |
| IM_MATERIAL_AVGPRICE_LOG（日誌） | ✅ 範圍內 |
| GL_JOURNAL_HEADER / GL_JOURNAL_DETAIL（傳票） | ✅ 範圍內 |
| AU_GEN_NUMBER（取號） | ✅ 範圍內 |
| IM_MATERIAL_STORAGE（庫位庫存） | ❌ 另一支程式 |
| IM_MATERIAL_BATCH（批次庫存） | ❌ 另一支程式 |
