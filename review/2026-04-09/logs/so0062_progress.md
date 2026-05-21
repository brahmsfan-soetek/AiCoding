# SO0062 — P3 Progress

> 最後更新：2026-05-11（任務目標變更：員工編號改手動輸入，表身欄位長度對齊原始規格）
> 當前分支：feat-so006-2
> 後端 HEAD：14cecb22（後端 P3 全部 task done；134 unit tests Green）

## 2026-05-11 任務目標變更

PG 回到原始規格，撤銷「員工編號改 LOV」的設計變更：

- **員工編號改為手動輸入**（系統內無對應員工主檔，原 LOV 來源 SSI 是「群組×員工」明細表，從它反查會漏掉「未曾被加進任何銷售群組過的員工」，本質上是設計錯誤）
- **表身欄位長度對齊原始規格**：
  - `EMP_NAME` 100 → 30
  - `EMP_ACCOUNT` 30 → 15（且須為英數字）
  - `EMP_TEL` 30 → 20
- 受影響：
  - 前端：`useSo0062Store`（移除 empAccountOptions/loadEmpAccountOptions/findEmpAccountOption）、`So0062SearchElementComponent`（員工編號改 s-input2）、`So0062DetailComponent`（表身員工編號改 s-input2 + alphanum 驗證 + 對齊長度）、i18n 文案
  - 後端：`sales-order-lov.yml` 刪 `so0062EmpAccount`、`So0062SaveValidator` checkMaxLength 對齊（15/30/20）
  - 規格：最終版 spec / 前後端任務清單 LOV 章節改寫為手動輸入
- 撤銷的 task：F40（前端 LOV 註冊）、B28（後端 LOV SQL）
- DDL 不動（保留 VARCHAR(30/100)），業務規則由前後端 enforce

## Task 清單來源
- backend: Docs/spec/so0062/SO0062_backend_tasks.md
- frontend: Docs/spec/so0062/SO0062_frontend_tasks.md（前端另起 session）

## 既有資產（session #1 啟動掃描）

| 項目 | 狀態 | 備註 |
|------|------|------|
| 模組 `backend/sales-order` | 已存在 | package `org.soetek.serp.so` |
| `SoSaleGroupEntity` | 已存在，需修改 | `faxno` 為 `Integer`，需配合 B00-1 改 `String` |
| `SoSaleInfoEntity` | 已存在 | 欄位齊全，與 spec 對齊 |
| `SalesOrderSqlProvider` | 已存在 | 需擴充加入 `sql/so0062.yml`（與選用的 `so0062-lov.yml`） |
| 既有 `SoSaleGroupDropdownProcessor` / `SoSaleInfoDropdownProcessor` 等 | 已存在 | 跨模組共用，本程式新增為 SO0062 專屬下拉，名稱不衝突 |

> 任務清單寫的「backend/sales/src/main/resources/sql/so0062.yml」是筆誤，實際路徑應為 `backend/sales-order/src/main/resources/sql/so0062.yml`。

## 進度（只列已接觸 task）

| Task ID | 類型 | 狀態 | Commit | 備註 |
|---------|------|:----:|--------|------|
| B00-2 | [sql] | done | d5afcbc8 | 引用清單已 append 至 SO0062_backend_tasks.md 附錄 A，待 PG / SA 標記是否補卡控 |
| B00-1 | [sql] | done | ccd990aa | DDL ALTER：SO_SALE_GROUP.FAXNO INT → VARCHAR(30) NULL；已執行於本機 dev DB（jdbc:mysql://localhost:3306/SERP），DESCRIBE 驗證 |
| B01 | [entity] | done | _本次_ | SoSaleGroupEntity.faxno: Integer → String length=30；mvn process-classes BUILD SUCCESS |
| B02 | [entity] | done (skip) | a970b79e | SoSaleInfoEntity 已存在，欄位/型別/主鍵全對齊 DDL，無需修改 |
| B10 | [validator] | done | _本次_ | SaleGroupCodeValidator + 13 unit tests Green；errorCodes: SYS001、SO0062_SALE_GROUP_FORMAT |
| B11 | [validator] | done | _本次_ | EmailFormatValidator (optional aware) + 13 unit tests Green；errorCode: SO0062_EMAIL_FORMAT |
| B12 | [validator] | done | _本次_ | PhoneCharsetValidator (optional aware) + 12 unit tests Green；errorCode: SO0062_PHONE_FORMAT |
| B13 | [validator] | done | _本次_ | DateRangeValidator + 8 unit tests Green；errorCode: SO0062_DATE_RANGE_INVALID |
| B14 | [validator] | done | _本次_ | So0062SaveValidator (編排+批次匯整) + 12 unit tests Green；新 errorCodes: SO0062_FIELD_TOO_LONG、SO0062_DUPLICATE_EMP_IN_GROUP |
| B15-1 | [validator] | done | 40f421a2 | 必填細覆蓋補在 So0062SaveValidatorTest，11 test methods × 3 空值（null/""/空白）= 33 邊界 case Green |
| B15-2 | [validator] | done (covered by B14) | — | 格式 / 長度 / 字符集 dispatch 已由 B14 (cases 4–8 + maxLength) 涵蓋；EMAIL CHAR padding trim 屬讀取階段（B04 / B05），不在此範圍 |
| B15-3 | [validator] | done (partial) | — | (b) SSI EMP_ACCOUNT 重複已由 B14 case 9 涵蓋；(a) SSG `(SALE_GROUP, COMPANY_CODE)` 跨筆唯一性需查 DB → 留待 B06 SaveProcessor |
| B16-1 | [validator] | done | 3445595f | So0062ReadonlyFieldsHelper.applyReadonlyFromDb + 7 unit tests Green；mode=update 時以 DB 原值覆蓋 saleOrg/saleChannel/saleGroup |
| B03 | [spi] | done | _本次_ | SalesOrderSqlProvider.getSqlConfigPaths 新增 `sql/so0062.yml`；員工 LOV (`so0062EmpAccount`) 加在既有 `sales-order-lov.yml` Lov: 區塊 |
| B19 | [sql] | done | _本次_ | `So0062.queryList` 8 欄 + 動態 WHERE（companyCode 強制、saleOrg/saleChannel 精確、saleGroup/saleGroupName LIKE、isActive 精確、empAccount 透過 SSI EXISTS）+ ORDER BY SALE_GROUP |
| B20 | [sql] | done | _本次_ | `So0062.findHeader` 取 SSG 所有欄位 |
| B21 | [sql] | done | _本次_ | `So0062.findInfoBySaleGroup` 取 SSI 所有欄位 + ORDER BY EMP_ACCOUNT |
| B22 | [sql] | done | _本次_ | `So0062.insertSsg / updateSsg / insertSsi / updateSsi / deleteSsi`（手寫 CREATOR/UPDATER/CREATE_DT/UPDATE_DT，因走 NativeSql 而非 Panache persist） |
| B23 | [sql] | done | _本次_ | `So0062.deleteHeader` 含 SALE_DIVISION='00' 過濾 |
| B24 | [sql] | done | _本次_ | `So0062.deleteAllInfo` 依 SALE_GROUP + COMPANY_CODE |
| B25 | [sql] | done | _本次_ | `So0062.checkSaleGroupExists` |
| B25-B | [sql] | done | _本次_ | `So0062.checkSaleGroupInUse`（B07 引用檢查；PG SG3 決議補） |
| B26 | [sql] | done | _本次_ | `So0062.dropdownSaleOrg`（IS_ACTIVE='Y' 過濾） |
| B27 | [sql] | done | _本次_ | `So0062.dropdownSaleChannel`（saleOrg cascade，含 SALE_ORG IS NULL 共用通路） |
| B28 | [sql] | done | b7d71582 | `Lov.so0062EmpAccount` 落於 `sales-order-lov.yml`（DISTINCT EMP_ACCOUNT/EMP_NAME，不限 IS_ACTIVE / VALID） |
| B04 | [processor] | done | 621d3b96 | `So0062QueryProcessor` + 12 unit tests Green（含 SG2 6 選填欄位 × 3 空值 = 18 邊界 case）；同時為 sales-order pom 加入 mockito-core / mockito-junit-jupiter 測試依賴 |
| B05 | [processor] | done | 25b773ce | `So0062DetailProcessor` + 7 unit tests Green；查無 SSG → RESOURCE_NOT_FOUND (404)；header 13 欄 + SSI 9 欄 lowercase→camelCase + 日期 ISO 字串 |
| B16-2 | [processor] | done (early) | 7c3867d1 | `So0062SaleInfoDiffer` 純函式 + 6 unit tests Green；PG SG3 決議將 B16-2 提前於 B06 之前實作，B06 直接依賴 |
| B06 | [processor] | done | _本次_ | `So0062SaveProcessor` CRUD 合一 + 15 unit tests Green（含 SG2 7 選填欄位 × 3 空值 = 21 邊界 case）；流程：requiredFields → mode dispatch（update 走 findHeader/null→404/apply readonly）→ B14 validate → mode=create checkUnique（cnt>0→SO0062_DUPLICATE_SALE_GROUP）→ 寫 SSG → 表身（create 全 INSERT；update 走 B16-2 diff 執行 INSERT/UPDATE/DELETE SSI）；新 errorCode `SO0062_DUPLICATE_SALE_GROUP` |
| B15-4 | [processor] | done (covered by B06) | — | 寫 SSG + 多筆 SSI 已涵蓋於 B06 createHappyPath / updateBodyDiffMixed 等測試，與 SaveProcessor 整合難拆 |
| B07 | [processor] | done | _本次_ | `So0062DeleteProcessor` + 6 unit tests Green；流程：B25-B `checkSaleGroupInUse`（cnt>0→`SO0062_SALE_GROUP_IN_USE` 409）→ `@Transactional` 內 `deleteAllInfo` → `deleteHeader`（affected=0→`RESOURCE_NOT_FOUND` 404） |
| B08 | [processor] | done | _本次_ | `So0062CheckUniqueProcessor` + 5 unit tests Green；onblur 唯一性查 `checkSaleGroupExists`，回 `{exists: boolean}` |
| B09 | [processor] | done | _本次_ | `So0062DropdownProcessor` + 7 unit tests Green（含 SG2 saleOrg × 3 = 3 邊界 case）；dropdownType=`saleOrgList` / `saleChannelList` 分流，`saleChannelList` 套 saleOrg cascade；displayLabel 在 Java 層補 |

## 完工狀態（後端 P3）

- 30/30 task done（B29 由 spec-p3-data 處理）
- 134 unit tests Green（SG2 強制 42 邊界 case 全 pass）

## 進度（前端 P3，session #2）

| Task ID | 類型 | 狀態 | Commit | 備註 |
|---------|------|:----:|--------|------|
| F01 | [types] | done | _本次_ | `types/so/so0062Types.ts`：QueryForm/Result、Header/InfoRow（含 `_rowState`、`_originalSnapshot`）、Save payload + SsiDiff、Dropdown、CheckUnique；ApiResponse 走 common/api.ts |
| F02 | [service] | done | 33286afc | `services/so/so0062Service.ts` 6 個函式（query / detail / save / delete / checkUnique / dropdown）；11 unit tests Green（契約：path/method/payload/response shape + convertToStringPayload 寫入路徑驗證） |
| F15 | [store-map] | done | _本次_ | `stores/so/so0062/so0062Mapper.ts` `mapQueryResultsToFront`；5 contract tests Green（rename / null preserve / extra fields drop / empty / order） |
| F16 | [store-map] | done | _本次_ | 同檔 `mapDetailToFront`；6 contract tests Green（含 EMAIL CHAR(100) padding trim、SSI 列加 `_rowState='unchanged'` + `_originalSnapshot` 凍結快照） |
| F17 | [store-map] | done | efea59a0 | 同檔 `mapDetailToBackPayload`；6 contract tests Green（create→saleInfoList / update→ssiDiff 分流；header 不送 saleDivision；空字串→null；`_rowState`/`_originalSnapshot` 不外洩） |
| F03–F14, F10b, F49 | [store-action] | done | _本次_ | `stores/so/so0062/useSo0062Store.ts` 全部 actions 完成（loadDropdowns / loadSaleChannelByOrg / handleQuery / resetQuery / openDetailFor{Create,Edit} / loadDetail / saveSaleGroup / deleteSaleGroup / checkSaleGroupUnique / backToList / refreshCurrentPage / computeSsiDiff + appendSsiRow / removeSsiRow / markSsiRowModified） |
| F35 | [router] | done | _本次_ | `router/routes.ts` 加入 SO0062 route（path /SO0062, name SO0062, lazy import, requiresAuth, pid SO0062, icon groups_2） |
| F36/F37 | [i18n] | done | _本次_ | `i18n/zh-TW/so/so.json` + `i18n/en-US/so/so.json` 加入 so0062 區塊（title / 表頭表身欄位 / columns / validation / message / isActive） |
| F38/F39 | [i18n] | done | _本次_ | `i18n/{zh-TW,en-US}/common/errors.json` 補 SO0062_*9 個 errorCode 翻譯（DUPLICATE_SALE_GROUP / SALE_GROUP_IN_USE / SALE_GROUP_FORMAT / EMAIL_FORMAT / PHONE_FORMAT / DATE_RANGE_INVALID / FIELD_TOO_LONG / DUPLICATE_EMP_IN_GROUP / INVALID_DROPDOWN_TYPE） |
| F18 | [page] | done | _本次_ | `pages/so/so0062/SO0062.vue` 模式 6 入口；watch(route.query) 處理直達/reload/前進後退；onMounted 補 dropdowns + restoreFromQuery |
| F19 | [page] | done | _本次_ | `So0062SearchComponent.vue` 主容器（兩區結構 + 列操作 confirmDelete） |
| F20 | [page] | done | _本次_ | `So0062SearchElementComponent.vue` 5 欄位 + 銷售組織 cascade + saleGroup toUpperCase |
| F21 | [page] | done | _本次_ | `So0062SearchBtnComponent.vue` 純 UI 查詢/重置（emit）|
| F22 | [page] | done | _本次_ | `So0062TableComponent.vue` 8 欄 + 列操作（編輯 + SMoreMenu 收納刪除）|
| F23 | [page] | done | _本次_ | `So0062DetailComponent.vue` 群組主檔 + SSI 表身；含 F25–F34 業務邏輯 + F41–F48 前端驗證 + DirtyTracker + UnsavedGuard |
| F24 | [dialog] | done (covered) | — | 共用 `confirmDelete` from `useUnsavedGuard.ts`；DetailComponent / SearchComponent 兩處引用 |
| F25–F34 | [page] | done (covered) | — | 內嵌於 F18–F23：cascade（onSaleOrgChange）/ toUpperCase（onSaleGroupInput）/ unique check（onSaleGroupBlur）/ 表身預設值（appendSsiRow）/ EMP_NAME 帶入（onEmpSelected）/ readonly（mode='edit' 三欄）/ 前端排序（TablesComponent 內建）/ ⋯展開（同上）/ 儲存後返回 + refresh / 失敗維持頁面 |
| F40 | [service] | done (backend) | _back-side_ | 員工 LOV 走 LovService.queryLov(`so0062EmpAccount`)，由 SLov 元件直接呼叫；前端不需另寫 service |
| F41–F48 | [page] | done (covered) | — | 內嵌於 F23：必填 / saleGroup 5 碼 / 電話傳真字元集 / Email 格式 / maxLength（透過 SInput2 maxlength 限制）/ 日期區間 / EMP_ACCOUNT 重複（saveBeforeValidate Set 比對） |

## 完工狀態（前端 P3）

- 30/30 frontend task done（含合併涵蓋）
- 28 contract tests Green（F02 service 11 + F15-F17 mapper 17）
- 全前端 test:run 131 passed / 2 skipped；`quasar build` 成功（esbuild 無死連結）
- 後端 errorCodes 9 個全補完 i18n

## 進度（P3-data，session #3）

| 項目 | 狀態 | 備註 |
|------|------|------|
| Permission SQL | done | `Docs/Permission/SO0062_COMPLETE_PERMISSION_SETUP.sql` 已執行；對帳：AU_APPLICATION 1 / AU_APPLICATION_ITEM 5 / AU_RI_MAPPING 6（ADMIN）/ AU_MENU 1 |
| Seed SQL | done | `Docs/data/SO0062_TEST_DATA.sql` 已執行；對帳：USER+C2000 mapping 10 / SSO 5 / SSC 5 / SSG 4 / SSI 7 |
| Schema 漂移備忘 | 已記載 | (1) SSO PK 仍含 CURRENCY_CODE — seed 補 'TWD'；(2) SSC.SALE_CHANNEL length=5，spec 寫 'COMMON' 改用 'COMM'；(3) test_cases T35 與 G01 saleOrg 假設衝突 — 改用 G_SOL |
| 既有殘留共存 | 確認 | DB 中既有 (1000, G01/G02/G03, '01') saleOrg=S101 殘留；不衝突（PK 第三鍵 SALE_DIVISION 不同），且後端 SQL 全部 `AND SALE_DIVISION='00'` 過濾，SO0062 不會看到 |

### 待 PG 手測

1. **以 ADMIN 登入**驗 T01-T56（基礎 CRUD / 驗證 / 業務流程 / 整合 / 邊界）
2. **以 testuser 切角色**：USER（隱藏新增/編輯/刪除按鈕）、TEST_C2000_*（公司隔離）
3. T35 改用 G_SOL（不是 G01）— seed 已建好
4. 手測發現 bug → ad hoc 派 AI 修（不走本 SKILL 流程）

## 接續工作

1. **前端 P3**：另起 session 執行 `/impl-fe`（讀 `SO0062_frontend_tasks.md`），共用本 progress.md 與 session_log.md（task prefix `F*`）
2. **權限 + 測資**：`/data` SKILL 產 `B29 SO0062_COMPLETE_PERMISSION_SETUP.sql` + seed SQL
3. **整合手測**：依 `SO0062_test_cases.md` PG 走完整流程

## Resume 指示（new session 啟動後）
1. 讀本檔、確認當前分支、pull 最新
2. 執行 `/impl-be`（後端）或 `/impl-fe`（前端）
3. SG1 回報上次進度，PG 確認繼續點
