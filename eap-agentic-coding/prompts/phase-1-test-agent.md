# Phase 1｜規格理解 → 任務拆解 → 測試

**執行者**：Test Agent

**目的**：理解統一規格，拆解為小任務，逐任務撰寫整合測試（`@QuarkusTest` + REST Assured）。

> 合併三步的原因：少一次 Agent 交接 = 少一次有損轉換 (§1)。拆解時規格理解已在 context 中，此時寫測試信噪比最高 (§2)。

## 輸入

- Phase 0 產出的統一規格
- `conventions/tech-stack.md`、`conventions/naming-conventions.md`、`conventions/db-conventions.md`

## 步驟

### 進場日誌

```bash
bash .claude/hooks/phase-logger.sh start P1
```

### Step 1：規格理解

1. 讀取統一規格，列出所有功能點。
2. 對每個功能點標記：
   - 明確的業務規則（可直接實作）
   - 隱含的假設（需要在測試中明確驗證）
   - 依賴的外部系統 / API

### Step 2：任務拆解

將功能點拆解為開發任務，每個任務須滿足：

| 條件 | 原因 |
|------|------|
| 單一職責（一個任務做一件事） | §11：>50 行正確率從 87% 降至 26% |
| 標明涉及的檔案清單 | §2：Phase 2 的 Code Agent 只載入需要的檔案 |
| 標明依賴的其他任務 | 確定執行順序 |
| 預估代碼行數 < 50 行 | §11：50 行是品質斷崖 |

**反附和檢查**：任務清單完成後，列出此拆解方案的 2-3 個潛在問題或替代拆法 (§7)。這迫使你質疑自己的第一直覺，而非預設第一版就是最佳方案。

產出格式：

```markdown
### Task-01: [任務名稱]
- **功能點**：對應統一規格 §X.X
- **涉及檔案**：`src/xxx.ts`, `src/yyy.ts`
- **依賴**：無 / Task-XX
- **預估行數**：~30 行
- **業務規則**：
  1. 規則 A（來源：統一規格 §X.X）
  2. 規則 B（來源：統一規格 §X.X）
```

### Step 3：逐任務寫測試

對每個 Task **立即**撰寫對應的整合測試，然後再處理下一個 Task。

```
for each Task in 任務清單:
    讀取該 Task 的業務規則
    從規格推導測試案例（不是從想像中的代碼推導）
    撰寫測試代碼
    next Task
```

> 逐任務循環而非批次：控制每次迭代的複雜度在模型有效規劃範圍內 (§11)，避免全部拆完後 context 膨脹 (§2)。

### 前端 Task 的測試策略

目前前端測試框架未配置（見 `conventions/tech-stack.md`）。前端 Task 的處理方式：

| 情況 | 做法 |
|------|------|
| 前端 Task（Vue/TS） | 不寫測試，在 `tasks.md` 標記 `[人工測試]` |
| 前端 Types（型別定義） | 確認 TypeScript 編譯通過即可 |
| 前端與後端聯動的 Task | 後端部分寫測試，前端部分標記 `[人工測試]` |

### 前端 Task 強制拆解粒度

**禁止**將所有前端工作合併為 1-2 個大 Task。即使不寫自動化測試，前端仍須按以下粒度拆解：

| Task 類型 | 涉及檔案 | 必須獨立為 Task | 依賴 | 需載入的模板 |
|-----------|---------|----------------|------|-------------|
| Types 定義 | `{moduleCode}Types.ts` | 是 | 無 | `frontend-types.md` |
| Service 層 | `{moduleCode}Service.ts` | 是 | Types | `frontend-service.md` |
| Store 層 | `use{ModuleCode}Store.ts` | 是 | Service, Types | `frontend-store.md` |
| Router 註冊 | `routes.ts`（新增項目） | 是 | 無 | `frontend-router.md` |
| i18n Keys | `{module}.json`（新增 key 區塊） | 是 | 主頁面, Dialog | `frontend-i18n.md` |
| 主頁面 | `{ModuleCode}.vue` | 是 | Store, Types | `frontend-page.md` |
| 每個 Dialog | `{EntityName}Dialog.vue` | 各自獨立 | Store, Types | `frontend-dialog.md` |

每個前端 Task 須包含：
- 涉及的檔案清單
- 需要 Phase 2 載入的模板名稱
- 標記 `[人工測試]`
- 預估行數（仍遵守 <50 行原則）

> 為什麼要這麼細？ Test-01 數據顯示前端 7 個檔案只用了 24/283 tool calls（8%），品質極差。細粒度拆解確保 Phase 2 對每個前端檔案投入足夠注意力。

### 前端 Task 的 P3 審查重點

Phase 3 Review Agent 對前端 `[人工測試]` Task 的審查重點：
- TypeScript 型別是否完整（無 `any`）
- 是否遵循三層架構（Page → Store → Service）
- 是否使用正確的共用組件（SBtn, SInput, SSelect2, SDialog2, SCard 等）
- i18n keys 是否齊全且結構正確
- Router 路由是否已註冊且 `meta.pid` 與 `setPagePid` 一致
- Dialog 是否遵循 `frontend-dialog.md` 模板結構（使用 `@confirm`/`@cancel` 事件）
- `permission-id` 是否配置在所有操作按鈕上

## 測試撰寫原則

| 原則 | 原因 |
|------|------|
| 測試從**規格的業務規則**推導，不從代碼結構推導 | §5：從代碼推導的 test oracle 準確率 <50% |
| 每個測試案例標註對應的規格條目 | 可追溯性，Phase 3 驗證用 |
| 包含邊界條件和異常路徑 | §5：93.5% 覆蓋率但僅 58.8% mutation score |
| 不 mock 可以不 mock 的東西 | Mock 行為反映 AI 對系統的「猜測」，是模式複製的溫床 |
| 測試必須能在代碼不存在時編譯失敗 | §9：防止空實作通過測試 |

## 約束

| 約束 | 原因 |
|------|------|
| **不可讀取任何現有實作代碼來推導測試** | §5：規格挖掘誤判率 90-99% |
| **不可為「讓測試容易寫」而降低規格要求** | §7：附和偏見的變體 |
| 無法轉化為可測試斷言的業務規則 → 標記 `[無法測試：需人工驗證]` | 不跳過 |

## 測試資料庫配置

測試檔案可能需要 `import.sql` 種子資料。配置測試資料庫時**必須遵守** `conventions/tech-stack.md` 的「測試資料庫隔離」規則：

| 做 | 不做 |
|----|------|
| 在 `src/test/resources/application.properties` 設定連線和 `drop-and-create` | 在主 `application.properties` 加 `%test.*.drop-and-create` |
| 連線指向 Docker 本地 MSSQL (`localhost:11434`) | 連線指向遠端共用 DB |
| `import.sql` 放在 `src/test/resources/` | 在測試代碼中手動建立/清除資料 |

## 產出

- `tasks.md` — 任務清單（含依賴關係和執行順序）
- 測試檔案 — 按 `conventions/tech-stack.md` 的測試框架規範放置
- `test_spec_map.md` — 測試案例 ↔ 規格條目的對應表

## 出場日誌

Phase 結束前（STOP Gate 判斷之前），記錄耗時與 token：

```bash
bash .claude/hooks/phase-logger.sh end P1
```

## STOP Gate

| 條件 | 動作 |
|------|------|
| 所有 Task 的測試撰寫完畢 | 軟檢查點：呈現任務清單供使用者確認後進入 Phase 2 |

## 失敗處理

- 規格中發現新的模糊處 → 標記到 `sa_pending.md` 追加清單，通知使用者
- 某個功能點無法拆解為 <50 行的任務 → 嘗試更細的拆分；仍不行則標記為需人工協助

## Gotchas

- 「從代碼結構推導測試」和「從規格推導測試」看起來很像但結果完全不同 — 永遠從規格出發
- 預估行數是 Phase 2 的品質安全閥，不是精確計算 — 寧可估高一點再拆
- mock 的 return value 是你對系統的猜測，不是事實 — 能不 mock 就不 mock
- 測試命名要讓 Phase 3 的 Review Agent 能透過名稱理解測試意圖
