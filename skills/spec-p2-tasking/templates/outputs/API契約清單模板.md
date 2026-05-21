# {程式編號} {功能名稱} — API 契約清單

> 初版日期：{YYYY-MM-DD}
> Schema 來源：`current_schema_{程式編號}.md`（透過 MCP MySQL 唯讀連線執行 `DESCRIBE` 取得）

---

<!--
  使用說明：
  - 本檔為 FE / BE 共讀的契約來源（Single Source of Truth）。
  - 對齊規則：
      * BE 寫 Processor → 對齊本表的 Response shape
      * FE 寫 service / store-map → 對齊本表的 Request payload + Response shape
      * 不一致時 → 改 code，不反向改本表
      * 確需改本表 → 必須回頭確認規格統計與 DB schema，並在「變更紀錄」段註明
  - 每支 API 一張小節（A01 / A02 / ...），依規格統計中的 API 清單逐一展開。
  - 「真實型別」欄必須使用 `current_schema_{程式編號}.md` 中的真實 SQL 型別
    （如 `VARCHAR(20)` / `DECIMAL(13,2)` / `CHAR(1)` / `TIMESTAMP`）。
    規格只給業務型別時，必須交叉真實 schema 補正。
  - 「對應 DB 欄位」欄當 Processor 直接 SELECT 自單一表時填 `表名.欄位名`；
    跨表組合或運算結果填「(計算)」並在「業務說明」說明來源。
  - 「規格出處」欄寫規格章節編號（與規格統計 source-mapping 對接）；
    若為 DB 有但規格未涵蓋的欄位 → 填「⚠️ 規格未涵蓋，待 SA 確認」並列入文末「保留欄位」段。
-->

## API 索引

<!-- 一行一支 API，後續每支展開為獨立小節。 -->

| # | routeId | Method | Path | 用途 |
|:---:|---------|:------:|------|------|
| A01 | {routeId} | GET / POST / PUT / DELETE | /api/{...} | {一句話描述} |

---

## A01 — {routeId}

### Endpoint

- **Method**：{GET / POST / PUT / DELETE}
- **Path**：{/api/...}
- **前端路由名稱**：{若有，否則填「無」}

### Request Shape

#### Path / Query 參數

<!-- 若無則填一列「無」。 -->

| 欄位 | 真實型別 | 必填 | 業務說明 | 規格出處 |
|------|---------|:----:|---------|---------|
| {customerCode} | {VARCHAR(20)} | ✓ | {客戶代號} | {§4.1} |

#### Body 參數

<!-- GET / 無 body 填「無」。POST/PUT 必填本段。 -->

| 欄位 | 真實型別 | 必填 | 業務說明 | 規格出處 |
|------|---------|:----:|---------|---------|
| {riskLevel} | {CHAR(1)} | — | {風險等級；空字串 / 空白 / null 均視為「未選」} | {§4.2} |

### Response Shape

#### 成功（HTTP 200）

##### 結構示意（TypeScript）

```typescript
{
  status: "success",
  data: {
    customerCode: string,    // VARCHAR(20)
    customerName: string,    // VARCHAR(60)
    creditAmt: number,       // DECIMAL(13,2)
    riskLevel: string,       // CHAR(1)
    items: Array<{
      invoiceNo: string,     // VARCHAR(20)
      promiseDate: string    // ISO 8601 (YYYY-MM-DD)
    }>
  }
}
```

##### 欄位逐條對照

<!-- 巢狀欄位用「巢狀層」欄表示，如 data / data.items[] -->

| 欄位 | 真實型別 | 巢狀層 | 對應 DB 欄位 | 業務說明 | 規格出處 |
|------|---------|--------|-------------|---------|---------|
| {customerCode} | {VARCHAR(20)} | data | {AR_CUSTOMER.CUSTOMER_CODE} | {客戶代號} | {§4.1} |
| {creditAmt} | {DECIMAL(13,2)} | data | {AR_CUSTOMER.CREDIT_AMT} | {信用額度；注意規格中文用「額度」、後端欄位 `CREDIT_AMT`} | {§4.3} |
| {invoiceNo} | {VARCHAR(20)} | data.items[] | {AR_INVOICE.INVOICE_NO} | {發票號} | {§5.1} |

#### 失敗

<!-- 錯誤碼 → i18n key 一對一對應。i18n key 必須與專案規範文件指定的 namespace 一致。 -->

| HTTP Status | 觸發條件 | i18n key | 規格出處 |
|:----------:|---------|----------|---------|
| 400 | {customerCode 缺失} | `{cv.error.customer.code.required}` | {§4.5} |
| 404 | {客戶不存在} | `{cv.error.customer.notFound}` | {§4.6} |

### 跨層對齊備忘

<!-- 標明三方對應的 task id，便於 P3 開寫時逆查；任務 id 留空則代表 P2 尚未對齊或不需要。 -->

- **BE Processor**：`{B20}` — Response shape 必須與本表一致（SG2 收尾時自檢）
- **FE service**：`{F02}` — Request payload + Response 解析必須與本表一致
- **FE store-map**：`{F08}` — 後端欄位 → 前端欄位 mapping 以本表為基準

---

## A02 — {routeId}

<!-- 依 A01 結構展開。多支 API 依序加 A02 / A03 / ... -->

---

## 保留欄位（DB 有但規格未涵蓋）

<!--
  由 current_schema 反查 → 規格統計未提到、但 DB 表確實存在的欄位。
  列此處待 SA 確認是否要納入 API；在 SA 確認前 BE 不主動回傳、FE 不主動讀取。
-->

| 表名 | 欄位 | 真實型別 | 用途推測 | 處理建議 |
|------|------|---------|---------|---------|
| {AR_CUSTOMER} | {DUNS_NO} | {VARCHAR(15)} | {DUNS 編號} | ⚠️ 規格未涵蓋，待 SA 確認 |

---

## 變更紀錄

<!--
  本表初版定稿後，若有調整必須記錄於此（與規格統計的「變更紀錄」段平行）。
  例如 SA 補充欄位、規格修正、DB schema 漂移修正等。
-->

| 日期 | 變更項 | 原因 | 影響的 task |
|------|--------|------|------------|
| {YYYY-MM-DD} | {變更說明} | {原因說明} | {B20, F02, F08} |
