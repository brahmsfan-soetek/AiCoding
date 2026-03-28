---
name: backend-service
applies_to: "*Service.java"
---

## 說明
Service 層是所有業務邏輯的唯一集中點。包含：查詢（含多表 JOIN 原生 SQL）、儲存（Create + Update 合併）、刪除（含業務規則檢查）、驗證、批次匯入。Processor 一律委派到此，不在 Processor 內寫業務邏輯。

## 🔧 依規格調整的部分
- **package**: `org.soetek.eap.{module}.service`
- **Class name**: `{ModuleCode}{EntityName}Service`（如 `Tm002EmpVacationService`）
- **Entity import**: `org.soetek.eap.{module}.domain.{EntityName}Entity`
- **SQL 中的表名**: 所有原生 SQL 的表名從 DDL 取得，前綴 `EAP.`
- **JOIN 結構**: 從 DDL FK 關係分析取得（如 EMP_VACATION -> VACATION_DETAIL_SETTING -> VACATION_SETTING）
- **WHERE 條件**: 從統一規格的業務邏輯區取得
- **欄位名**: SQL SELECT / INSERT 欄位名從 DDL 取得
- **驗證規則**: 重複檢查條件、刪除前檢查條件等從規格書業務規則取得
- **getDefaultXxx() SQL**: WHERE 條件從規格書「執行預設」邏輯取得

## 完整參考實作
```java
package org.soetek.eap.tm.service;                             // 🔧 {module}

import io.quarkus.hibernate.orm.PersistenceUnit;               // 🔒 固定
import jakarta.enterprise.context.ApplicationScoped;            // 🔒 固定
import jakarta.inject.Inject;                                   // 🔒 固定
import jakarta.persistence.EntityManager;                       // 🔒 固定
import jakarta.persistence.Query;                               // 🔒 固定
import jakarta.transaction.Transactional;                       // 🔒 固定
import lombok.extern.slf4j.Slf4j;                              // 🔒 固定
import org.soetek.eap.tm.domain.TmEmpVacationEntity;           // 🔧 Entity import
import org.soetek.foundation.exception.BusinessException;       // 🔒 固定
import org.soetek.foundation.util.DateFormatUtil;               // 🔒 固定

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j                                                         // 🔒 固定
@ApplicationScoped                                             // 🔒 固定
public class Tm002EmpVacationService {                         // 🔧 Class name

    @Inject                                                    // 🔒 固定
    @PersistenceUnit("eap")                                    // 🔒 固定：一律用 "eap"
    EntityManager em;                                          // 🔒 固定

    // ==================== 查詢：執行預設（下拉載入）====================

    // 🔧 SQL WHERE 條件、JOIN 結構、SELECT 欄位從規格書取得
    public List<Map<String, Object>> getDefaultVacation() {
        // 🔒 使用 NCHAR() 避免中文字元在 MSSQL 的編碼問題
        String sql = """
                SELECT A.VACATION_CODE, A.VACATION_NAME,
                       B.VACATION_SUB_CODE, B.VACATION_SUB_NAME,
                       B.VACATION_SUB_ID,
                       B.MIN_HOURS, B.MAX_HOURS
                  FROM EAP.TM_VACATION_SETTING A
                  JOIN EAP.TM_VACATION_DETAIL_SETTING B
                    ON A.VACATION_CODE = B.VACATION_CODE
                 WHERE A.VACATION_NAME = NCHAR(30149) + NCHAR(20551)
                   AND GETDATE() BETWEEN B.BEGIN_DATE
                       AND ISNULL(B.END_DATE, CAST('2099-12-31' AS DATE))
                   AND B.IS_EFFECTIVE = 1
                """;                                           // 🔧 整段 SQL 從規格調整
        Query query = em.createNativeQuery(sql);               // 🔒 固定模式
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();           // 🔒 固定模式
        // 🔒 row -> Map 轉換模式固定
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> record = new HashMap<>();
            record.put("vacationCode", row[0]);                // 🔧 key 名稱從前端欄位規格
            record.put("vacationName", row[1]);
            record.put("vacationSubCode", row[2]);
            record.put("vacationSubName", row[3]);
            record.put("vacationSubId", row[4]);
            record.put("minHours", row[5]);
            record.put("maxHours", row[6]);
            result.add(record);
        }
        return result;
    }

    // ==================== 查詢：明細列表 ====================

    // 🔧 JOIN 結構從 DDL FK 分析取得
    public List<Map<String, Object>> queryEmpVacationDetail(Integer empId, int year) {
        // 🔒 必須 JOIN 所有相關表以取得顯示用名稱欄位
        String sql = """
                SELECT v.EMP_VACATION_ID, v.EMP_ID, v.VACATION_SUB_ID,
                    vds.VACATION_CODE, vs.VACATION_NAME,
                    vds.VACATION_SUB_CODE, vds.VACATION_SUB_NAME,
                    v.MAX_HOURS, v.USED_HOURS, v.UNUSED_HOURS, v.CASH_OUT_HOURS,
                    v.BEGIN_DATE, v.END_DATE, v.CLEAR
                FROM EAP.TM_EMP_VACATION v
                INNER JOIN EAP.TM_VACATION_DETAIL_SETTING vds
                    ON vds.VACATION_SUB_ID = v.VACATION_SUB_ID
                INNER JOIN EAP.TM_VACATION_SETTING vs
                    ON vs.VACATION_CODE = vds.VACATION_CODE
                WHERE v.EMP_ID = :empId AND YEAR(v.BEGIN_DATE) = :year
                ORDER BY v.VACATION_SUB_ID
                """;                                           // 🔧 表名、JOIN、WHERE 從 DDL
        Query query = em.createNativeQuery(sql);
        query.setParameter("empId", empId);                    // 🔧 參數名稱
        query.setParameter("year", year);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> record = new HashMap<>();
            record.put("empVacationId", row[0]);
            record.put("empId", row[1]);
            record.put("vacationSubId", row[2]);
            record.put("vacationCode", row[3]);
            record.put("vacationName", row[4]);
            record.put("vacationSubCode", row[5]);
            record.put("vacationSubName", row[6]);
            BigDecimal maxHours = toBigDecimal(row[7]);        // 🔒 使用 toBigDecimal 安全轉換
            BigDecimal usedHours = toBigDecimal(row[8]);
            BigDecimal unusedHours = toBigDecimal(row[9]);
            record.put("maxHours", maxHours);
            record.put("totalHours", maxHours);                // 🔧 前端可能用不同 key 名
            record.put("usedHours", usedHours);
            record.put("unusedHours", unusedHours);
            record.put("remainingHours", unusedHours);         // 🔧 前端可能用不同 key 名
            record.put("cashOutHours", row[10]);
            record.put("beginDate", formatDate(row[11]));      // 🔒 使用 formatDate 處理多型別
            record.put("endDate", formatDate(row[12]));
            // 🔒 CLEAR 欄位的多型別處理：MSSQL 可能回傳 Boolean 或 Number
            Object clearVal = row[13];
            boolean isClear = false;
            if (clearVal != null) {
                if (clearVal instanceof Boolean) isClear = (Boolean) clearVal;
                else if (clearVal instanceof Number) isClear = ((Number) clearVal).intValue() == 1;
            }
            record.put("clear", isClear);
            record.put("settlementStatus", isClear ? "Y" : "");  // 🔧 前端顯示邏輯
            result.add(record);
        }
        return result;
    }

    // ==================== 儲存：Create + Update 合併 ====================

    // 🔒 Save 方法架構：Create 和 Update 合併在同一個方法內
    // 判斷依據：payload 中有 PK 值 = Update，無 PK 值 = Create
    @Transactional                                             // 🔒 固定
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> saveEmpVacationDetails(
            Integer empId, List<Map<String, Object>> details) {

        // 🔒 驗證主體存在（如員工存在性檢查）
        String checkSql = "SELECT COUNT(*) FROM EAP.PM_EMPLOYEE WHERE EMP_ID = :empId";
        Query checkQuery = em.createNativeQuery(checkSql);
        checkQuery.setParameter("empId", empId);
        Number count = (Number) checkQuery.getSingleResult();
        if (count.intValue() == 0) {
            throw new BusinessException("EMP_NOT_FOUND", 400, "員工不存在：" + empId);
        }

        List<Map<String, Object>> savedRecords = new ArrayList<>();
        for (Map<String, Object> detail : details) {
            Object empVacationIdObj = detail.get("empVacationId");  // 🔧 PK 欄位名

            // 🔧 以下欄位名從 DDL / 規格取得
            Integer vacationSubId = ((Number) detail.get("vacationSubId")).intValue();
            BigDecimal maxHours = toBigDecimal(detail.get("maxHours"));
            BigDecimal usedHours = toBigDecimal(detail.get("usedHours"));
            if (usedHours == null) usedHours = BigDecimal.ZERO;

            // 🔒 自動計算衍生欄位（如 UNUSED_HOURS = MAX_HOURS - USED_HOURS）
            BigDecimal unusedHours = maxHours.subtract(usedHours);

            // 🔒 日期解析使用 parseDate()，支援 / 和 - 兩種格式
            String beginDateStr = detail.get("beginDate").toString();
            String endDateStr = detail.get("endDate").toString();
            LocalDate beginDate = parseDate(beginDateStr);
            LocalDate endDate = parseDate(endDateStr);

            TmEmpVacationEntity entity;                        // 🔧 Entity 型別

            if (empVacationIdObj != null) {
                // ===== 修改模式 =====
                Integer empVacationId = ((Number) empVacationIdObj).intValue();
                entity = TmEmpVacationEntity.findByKey(empVacationId);
                if (entity == null) {
                    throw new BusinessException("RECORD_NOT_FOUND", 400,
                            "記錄不存在：" + empVacationId);
                }

                // 🔒 重複檢查：排除自己（WHERE ... AND PK != :selfId）
                int year = beginDate.getYear();
                String dupSql = "SELECT COUNT(*) FROM EAP.TM_EMP_VACATION "
                        + "WHERE EMP_ID = :empId AND VACATION_SUB_ID = :vacSubId "
                        + "AND YEAR(BEGIN_DATE) = :year "
                        + "AND EMP_VACATION_ID != :selfId";    // 🔧 表名、欄名
                Query dupQuery = em.createNativeQuery(dupSql);
                dupQuery.setParameter("empId", empId);
                dupQuery.setParameter("vacSubId", vacationSubId);
                dupQuery.setParameter("year", year);
                dupQuery.setParameter("selfId", empVacationId);
                Number dupCount = (Number) dupQuery.getSingleResult();
                if (dupCount.intValue() > 0) {
                    throw new BusinessException("DUPLICATE_RECORD", 400,
                            "該員工 " + year + " 年度已存在相同假別額度，不可重複設定");
                }

                // 🔒 更新時不修改 CLEAR 欄位（外部批次控制）
                entity.vacationSubId = vacationSubId;
                entity.maxHours = maxHours;
                entity.usedHours = usedHours;
                entity.unusedHours = unusedHours;
                entity.beginDate = beginDate;
                entity.endDate = endDate;

            } else {
                // ===== 新增模式 =====

                // 🔒 重複檢查（新增時不需排除自己）
                int year = beginDate.getYear();
                String dupSql = "SELECT COUNT(*) FROM EAP.TM_EMP_VACATION "
                        + "WHERE EMP_ID = :empId AND VACATION_SUB_ID = :vacSubId "
                        + "AND YEAR(BEGIN_DATE) = :year";      // 🔧 表名、欄名
                Query dupQuery = em.createNativeQuery(dupSql);
                dupQuery.setParameter("empId", empId);
                dupQuery.setParameter("vacSubId", vacationSubId);
                dupQuery.setParameter("year", year);
                Number dupCount = (Number) dupQuery.getSingleResult();
                if (dupCount.intValue() > 0) {
                    throw new BusinessException("DUPLICATE_RECORD", 400,
                            "該員工 " + year + " 年度已存在相同假別額度，不可重複新增");
                }

                entity = new TmEmpVacationEntity();            // 🔧 Entity 型別
                entity.empId = empId;
                entity.vacationSubId = vacationSubId;
                entity.maxHours = maxHours;
                entity.usedHours = usedHours;
                entity.unusedHours = unusedHours;
                entity.cashOutHours = BigDecimal.ZERO;         // 🔒 新增時預設值
                entity.beginDate = beginDate;
                entity.endDate = endDate;
                entity.clear = false;                          // 🔒 新增時 CLEAR = false
                entity.persist();                              // 🔒 Panache persist
            }

            // 🔒 回傳格式固定
            Map<String, Object> saved = new HashMap<>();
            saved.put("empVacationId", entity.empVacationId);
            saved.put("empId", entity.empId);
            saved.put("vacationSubId", entity.vacationSubId);
            saved.put("maxHours", entity.maxHours);
            saved.put("usedHours", entity.usedHours);
            saved.put("unusedHours", entity.unusedHours);
            saved.put("beginDate", DateFormatUtil.formatDate(entity.beginDate));
            saved.put("endDate", DateFormatUtil.formatDate(entity.endDate));
            savedRecords.add(saved);
        }
        em.flush();                                            // 🔒 最後統一 flush
        return savedRecords;
    }

    // ==================== 刪除 ====================

    // 🔒 刪除架構：findByKey -> 業務規則檢查 -> 硬刪除 -> flush
    @Transactional
    public void deleteEmpVacation(Integer empVacationId) {     // 🔧 方法名、參數
        TmEmpVacationEntity entity = TmEmpVacationEntity.findByKey(empVacationId);
        if (entity == null) {
            throw new BusinessException("RECORD_NOT_FOUND", 400,
                    "記錄不存在：" + empVacationId);
        }

        // 🔒 結算列不可刪除（CLEAR = true 時拒絕）
        if (Boolean.TRUE.equals(entity.clear)) {
            throw new BusinessException("CLEAR_CANNOT_DELETE", 400,
                    "結算記錄不可刪除");
        }

        entity.delete();                                       // 🔒 硬刪除
        em.flush();
    }

    // ==================== 員工驗證（批次用）====================

    // 🔒 三態判定：在職 / 已離職 / 查無此員工
    public List<Map<String, Object>> validateEmployees(List<String> empAccounts) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (String empAccount : empAccounts) {
            Map<String, Object> result = new HashMap<>();
            result.put("empAccount", empAccount);
            String sql = """
                    SELECT e.EMP_ID, e.EMP_NAME, e.ORG_ID, e.LEAVE_DATE, org.ORG_NAME
                    FROM EAP.PM_EMPLOYEE e
                    LEFT JOIN EAP.AU_ORGANIZATION org ON org.ORG_ID = e.ORG_ID
                    WHERE e.EMP_ACCOUNT = :empAccount
                    """;                                       // 🔧 表名、欄名從 DDL
            Query query = em.createNativeQuery(sql);
            query.setParameter("empAccount", empAccount);
            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();
            if (rows.isEmpty()) {
                // 🔒 查無此員工
                result.put("valid", false);
                result.put("errorMessage", "查無此員工");
            } else {
                Object[] row = rows.get(0);
                if (row[3] != null) {
                    // 🔒 已離職（LEAVE_DATE 非 null）
                    result.put("valid", false);
                    result.put("errorMessage", "員工已離職");
                } else {
                    // 🔒 在職
                    result.put("valid", true);
                    result.put("empId", row[0]);
                    result.put("empName", row[1]);
                    result.put("orgId", row[2]);
                    result.put("orgName", row[4]);
                }
            }
            results.add(result);
        }
        return results;
    }

    // ==================== 批次匯入 ====================

    // 🔒 批次架構：驗證 -> 逐筆檢查重複 -> skip 已有 / persist 新增 -> 回傳統計
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> batchImport(Map<String, Object> payload) {
        // 🔒 必填欄位驗證
        Object empIdsObj = payload.get("empIds");
        Object vacSubIdObj = payload.get("vacationSubId");
        Object maxHoursObj = payload.get("maxHours");
        Object beginDateObj = payload.get("beginDate");
        Object endDateObj = payload.get("endDate");

        if (empIdsObj == null || !(empIdsObj instanceof List) || ((List<?>) empIdsObj).isEmpty())
            throw new BusinessException("REQUIRED_FIELD", 400, "empIds 為必填欄位");
        if (vacSubIdObj == null)
            throw new BusinessException("REQUIRED_FIELD", 400, "vacationSubId 為必填欄位");
        if (maxHoursObj == null)
            throw new BusinessException("REQUIRED_FIELD", 400, "maxHours 為必填欄位");
        if (beginDateObj == null)
            throw new BusinessException("REQUIRED_FIELD", 400, "beginDate 為必填欄位");
        if (endDateObj == null)
            throw new BusinessException("REQUIRED_FIELD", 400, "endDate 為必填欄位");

        List<Number> empIds = (List<Number>) empIdsObj;
        Integer vacationSubId = ((Number) vacSubIdObj).intValue();
        BigDecimal maxHours = toBigDecimal(maxHoursObj);
        LocalDate beginDate = parseDate(beginDateObj.toString());
        LocalDate endDate = parseDate(endDateObj.toString());

        // 🔒 結束日不可早於起始日
        if (endDate.isBefore(beginDate)) {
            throw new BusinessException("DATE_INVALID", 400, "結束日不可早於起始日");
        }

        BigDecimal unusedHours = maxHours;
        int createdCount = 0;
        int year = beginDate.getYear();
        List<Integer> skippedEmpIds = new ArrayList<>();

        for (Number empIdNum : empIds) {
            Integer empId = empIdNum.intValue();

            // 🔒 重複檢查：已有記錄 skip 不報錯（與單筆新增不同！）
            String dupSql = "SELECT COUNT(*) FROM EAP.TM_EMP_VACATION "
                    + "WHERE EMP_ID = :empId AND VACATION_SUB_ID = :vacSubId "
                    + "AND YEAR(BEGIN_DATE) = :year";          // 🔧 表名、欄名
            Query dupQuery = em.createNativeQuery(dupSql);
            dupQuery.setParameter("empId", empId);
            dupQuery.setParameter("vacSubId", vacationSubId);
            dupQuery.setParameter("year", year);
            Number dupCount = (Number) dupQuery.getSingleResult();
            if (dupCount.intValue() > 0) {
                skippedEmpIds.add(empId);                      // 🔒 skip 不拋異常
                continue;
            }

            TmEmpVacationEntity entity = new TmEmpVacationEntity();  // 🔧 Entity 型別
            entity.empId = empId;
            entity.vacationSubId = vacationSubId;
            entity.maxHours = maxHours;
            entity.usedHours = BigDecimal.ZERO;
            entity.unusedHours = unusedHours;
            entity.cashOutHours = BigDecimal.ZERO;
            entity.beginDate = beginDate;
            entity.endDate = endDate;
            entity.clear = false;
            entity.persist();
            createdCount++;
        }
        em.flush();

        // 🔒 回傳統計格式
        Map<String, Object> result = new HashMap<>();
        result.put("createdCount", createdCount);
        result.put("skippedEmpIds", skippedEmpIds);
        result.put("skippedCount", skippedEmpIds.size());
        return result;
    }

    // ==================== 共用工具方法 ====================

    // 🔒 以下三個工具方法在所有 Service 中固定使用

    /**
     * 安全轉換為 BigDecimal -- 處理 null / Number / String
     */
    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return null;
        if (obj instanceof BigDecimal) return (BigDecimal) obj;
        if (obj instanceof Number) return new BigDecimal(obj.toString());
        try {
            return new BigDecimal(obj.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 格式化日期 -- 處理 SQL 回傳的多種日期型別
     * 🔒 必須處理：java.sql.Date / java.sql.Timestamp / LocalDateTime / LocalDate / String
     */
    private String formatDate(Object dateObj) {
        if (dateObj == null) return null;
        if (dateObj instanceof java.sql.Date sqlDate)
            return DateFormatUtil.formatDate(sqlDate.toLocalDate());
        if (dateObj instanceof java.sql.Timestamp ts)
            return DateFormatUtil.formatDate(ts.toLocalDateTime().toLocalDate());
        if (dateObj instanceof java.time.LocalDateTime ldt)
            return DateFormatUtil.formatDate(ldt.toLocalDate());
        if (dateObj instanceof LocalDate ld)
            return DateFormatUtil.formatDate(ld);
        String str = dateObj.toString();
        return str.length() >= 10 ? str.substring(0, 10) : str;
    }

    /**
     * 解析日期字串 -- 支援 / 和 - 兩種分隔符
     * 🔒 normalize: 先 trim 再 replace "/" -> "-"
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            throw new BusinessException("DATE_INVALID", 400, "日期不可為空");
        }
        String normalized = dateStr.trim().replace("/", "-");
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException e) {
            throw new BusinessException("DATE_INVALID", 400, "日期格式錯誤：" + dateStr);
        }
    }
}
```

## 已知陷阱
1. **#8 日期解析 500** -- 前端可能傳 `2024/01/01` 格式，若不做 `replace("/", "-")` 會導致 `DateTimeParseException` 並回傳 500。`parseDate()` 工具方法必須包含 normalize 邏輯。
2. **#9 vacationSubId FK 混淆** -- DDL 中 `VACATION_SUB_ID` 是 FK 到 `TM_VACATION_DETAIL_SETTING`，不是直接 FK 到 `TM_VACATION_SETTING`。JOIN 順序必須正確：EMP_VACATION -> VACATION_DETAIL_SETTING -> VACATION_SETTING。
3. **#13 重複檢查遺漏** -- Save 時必須做 duplicate check（同 empId + vacationSubId + 年度不可重複）。Update 時記得 `AND PK != :selfId` 排除自身。
4. **#15 ASSUME_DATE vs HIRE_DATE** -- 驗證員工時用 `LEAVE_DATE` 判斷離職，不要用 `ASSUME_DATE` 或 `HIRE_DATE`。
5. **NCHAR 中文字元** -- MSSQL 中文比對必須用 `NCHAR()` 函數（如 `NCHAR(30149) + NCHAR(20551)` = "病假"），不可直接寫中文字串，否則因編碼問題比對失敗。
6. **CLEAR 欄位多型別** -- MSSQL 的 BIT 欄位透過 JDBC 可能回傳 `Boolean` 或 `Number`，必須兩種都處理。
7. **Save = Create + Update 合併** -- 不分兩個方法。判斷依據是 payload 中 PK 欄位是否有值。這是框架固定模式。
8. **批次匯入 skip 不報錯** -- 與單筆新增的 `throw BusinessException` 不同，批次遇到重複時 skip 並記入 `skippedEmpIds`，不中斷流程。
9. **em.flush() 放最後** -- 所有 persist / update 完成後統一 flush，不要每筆都 flush。
10. **SQL 加 EAP. 前綴** -- 原生 SQL 中的表名要加 `EAP.` schema 前綴（與 Entity @Table 不加 schema 相反）。
