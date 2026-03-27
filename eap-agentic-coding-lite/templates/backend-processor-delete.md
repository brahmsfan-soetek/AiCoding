---
name: backend-processor-delete
applies_to: "*DeleteProcessor.java"
---

## 說明
刪除 Processor，接收主鍵後執行硬刪除（DELETE FROM）。支援單筆或批次刪除。

## 替換規則
- `{ModuleCode}` -- PascalCase 模組代碼（如 Tm002）
- `{moduleCode}` -- camelCase 模組代碼（如 tm002）
- `{module}` -- 小寫模組前綴（如 tm）
- `{EntityName}` -- PascalCase Entity 名稱（如 TmEmpVacation）
- `{entityDescription}` -- Entity 中文描述（如 員工假別明細）
- `{MODULE_CODE}` -- 大寫底線格式（如 TM002，用於 log 標籤）
- `{routeId}` -- Camel route ID（如 tm002EmpVacationDelete）
- `{apiDescription}` -- API 描述（如 刪除員工假別明細）
- `{requiredFields}` -- 必填欄位清單（如 empVacationId）
- `{pkField}` -- 主鍵欄位名（如 empVacationId）
- `{PKType}` -- 主鍵 Java 型別（如 Integer）
- `{ServiceName}` -- Service 類別名稱（如 Tm002EmpVacationService）
- `{serviceName}` -- Service 變數名稱（如 empVacationService）

## 完整參考實作（Thin 版 -- 委派 Service，TM002 實際模式）

```java
package org.soetek.eap.{module}.processor;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.Body;
import org.apache.camel.Exchange;
import org.apache.camel.Headers;
import org.soetek.eap.{module}.service.{ServiceName};
import org.soetek.foundation.config.annotation.AuditLog;
import org.soetek.foundation.exception.BusinessException;
import org.soetek.foundation.processor.ApiRouteProcessor;
import org.soetek.foundation.util.LogType;

import java.util.HashMap;
import java.util.Map;

/**
 * {MODULE_CODE} {entityDescription}刪除 Processor
 * <p>
 * 刪除{entityDescription}（硬刪除）
 * API 路徑：POST /api/{routeId}
 *
 * @author SoeTek Team
 */
@Slf4j
@ApplicationScoped
@Named("{routeId}Processor")
@RegisterForReflection
public class {ModuleCode}{EntityName}DeleteProcessor extends ApiRouteProcessor {

    @Inject
    {ServiceName} {serviceName};

    @Override
    public Map<String, Object> getTemplateParams() {
        return Map.of(
                "routeId", "{routeId}",
                "apiDescription", "{apiDescription}",
                "requiredFields", "{requiredFields}");
    }

    @Override
    protected String getProcessorType() {
        return LogType.API_PROCESSING;
    }

    @Override
    @ActivateRequestContext
    @AuditLog(
            operation = AuditLog.OperationType.DELETE,
            entity = "{EntityName}",
            description = "{apiDescription}",
            logParameters = true,
            logResult = false           // Delete 不記錄回傳結果
    )
    public Object process(Exchange exchange, @Body Map<String, Object> payload,
                          @Headers Map<String, Object> headers) throws Exception {
        return executeWithErrorHandling(exchange, payload, headers);
    }

    @Override
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        Object idObj = payload.get("{pkField}");
        if (idObj == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "{pkField} 為必填欄位");
        }
        {PKType} {pkField} = ((Number) idObj).intValue();

        log.debug("[{MODULE_CODE} 刪除] {pkField}: {}, TraceId: {}", {pkField}, traceId);

        // 委派 Service（@Transactional + 業務規則驗證在 Service 上）
        {serviceName}.delete{EntityName}({pkField});

        log.info("[{MODULE_CODE} 刪除] 完成 - {pkField}: {}, TraceId: {}", {pkField}, traceId);

        Map<String, Object> data = new HashMap<>();
        data.put("{pkField}", {pkField});
        data.put("entityId", {pkField});

        return buildStandardResponse(traceId, data, "DELETE");
    }
}
```

## Service 層刪除方法參考（TM002 實作）

```java
/**
 * 刪除{entityDescription}（硬刪除）
 * 業務規則：結算列（CLEAR=1）不可刪除
 */
@Transactional
public void delete{EntityName}({PKType} {pkField}) {
    {EntityName}Entity entity = {EntityName}Entity.findByKey({pkField});
    if (entity == null) {
        throw new BusinessException("RECORD_NOT_FOUND", 400, "記錄不存在：" + {pkField});
    }

    // 業務規則檢查 -- 依規格調整
    // 例：結算列不可刪除
    // if (Boolean.TRUE.equals(entity.clear)) {
    //     throw new BusinessException("CLEAR_CANNOT_DELETE", 400, "結算記錄不可刪除");
    // }

    // 例：有子表引用不可刪除
    // long relatedCount = RelatedEntity.count("parentId", {pkField});
    // if (relatedCount > 0) {
    //     throw new BusinessException("HAS_DEPENDENCIES", 400, "資料被引用中，無法刪除");
    // }

    // 硬刪除
    entity.delete();
    em.flush();
}
```

## Thick 版（Processor 內直接處理，適用於無額外業務規則的場景）

```java
    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    protected Object processBusinessLogic(
            Exchange exchange,
            Map<String, Object> payload,
            Map<String, Object> headers,
            String traceId,
            String routeId) throws Exception {

        log.debug("[{MODULE_CODE} 刪除] 開始 - TraceId: {}", traceId);

        // 1. 驗證 ids 必填（批次刪除模式）
        if (!payload.containsKey("ids") || payload.get("ids") == null) {
            throw new BusinessException("REQUIRED_FIELD", 400, "請選擇要刪除的資料");
        }

        List<?> rawIds = (List<?>) payload.get("ids");
        if (rawIds.isEmpty()) {
            throw new BusinessException("REQUIRED_FIELD", 400, "請選擇要刪除的資料");
        }

        // 2. 逐筆刪除
        List<{PKType}> deletedIds = new ArrayList<>();
        for (Object rawId : rawIds) {
            {PKType} id = ((Number) rawId).intValue();
            {EntityName}Entity entity = {EntityName}Entity.findByKey(id);
            if (entity != null) {
                entity.delete();
                deletedIds.add(id);
            }
        }

        log.info("[{MODULE_CODE} 刪除] 完成 - 刪除筆數: {}, TraceId: {}", deletedIds.size(), traceId);

        // 3. 回應
        Map<String, Object> data = new HashMap<>();
        data.put("deletedCount", deletedIds.size());
        data.put("deletedIds", deletedIds);

        return buildStandardResponse(traceId, data, "DELETE");
    }
```

## 業務邏輯注意點
- **`@AuditLog` logResult = false**: 刪除操作不記錄回傳結果
- **單筆 vs 批次**: TM002 使用單筆刪除（傳 `empVacationId`）；通用模板也提供批次刪除（傳 `ids` 陣列）。依規格選擇
- **刪除前檢查**: 常見檢查包括：結算狀態不可刪除、有子表引用不可刪除、已核准不可刪除等
- **硬刪除**: 使用 `entity.delete()` + `em.flush()`。若需要軟刪除，改為更新狀態欄位
- **容錯**: 批次模式下，`findByKey()` 返回 null 時靜默跳過（不拋異常）
- **`@Transactional`**: Thin 版在 Service 上；Thick 版在 `processBusinessLogic()` 上
