---
name: spec-p4a-uat
description: 人工驗收測試 SKILL：讀 P2 的 test_cases.md + 最終版規格統計，產出 UAT checklist 供 PG 逐項勾選執行，完成後彙總報告。觸發於 /uat 或提到 UAT、驗收測試等關鍵字。
---

# Spec UAT — 人工驗收測試

在專案 repo 目錄下執行，根據 P2 產出的 `test_cases.md` 與最終版規格統計，產出 UAT checklist 供 PG 手動驗收，完成後彙總報告。

## 定位

- **輸入：** `{程式編號}_規格統計_最終版.md` + `{程式編號}_test_cases.md`（P2 產，非 P3 單元測試）
- **輸出：** UAT checklist + 彙總報告
- **關鍵：** 新 session，讀 test_cases.md 而非 P3 的單元測試 — 天然獨立觀點

## 觸發方式

- `/uat` — 顯示流程說明並開始
- `/uat <程式編號>` — 直接帶入程式編號

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_test_cases.md`
2. 已完成 P3 `spec-p3-implementing`，實作程式碼已就緒可測試
3. **另起新 session** — 不在 P3 session 中繼續（獨立裁判原則）

## 設計原則

1. **獨立裁判** — P4a 是獨立 session，不受 P3 的 context 影響。
2. **讀 test_cases.md、非 P3 單元測試** — P2 產的 test_cases.md 是 QA 驗證依據，P3 的單元測試是開發 feedback loop，兩者定位不同。
3. **PG 主導執行** — AI 產出 checklist，PG 實際操作 UI 驗證。

## Execution Flow

```
/uat [程式編號]
         ↓
[AI]  讀 {程式編號}_規格統計_最終版.md + {程式編號}_test_cases.md
         ↓
[AI]  產出 UAT checklist：
      - 將 test_cases.md 的每個測試案例轉為可勾選的 checklist 項目
      - 補充規格統計中有但 test_cases.md 未涵蓋的驗收點
      - 每項包含：項目編號 / 測試案例 / 前置條件 / 執行步驟 / 預期結果 / 通過（✓/✗）/ 備註
[STOP] PG 確認 checklist 完整性
         ↓
[PG]  逐項執行 UAT：
      - 依 checklist 操作 UI
      - 勾選通過/失敗
      - 填寫備註（失敗原因、截圖等）
         ↓
[AI]  PG 回填結果後，產出彙總報告：
      - 總項數 / 通過數 / 失敗數 / 跳過數
      - 失敗項目明細（含 PG 備註）
      - 規格統計覆蓋度摘要
      - 建議（是否需要回修、是否可以上線）
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **辨識輸入材料**（直接讀當前工作目錄或使用者指定路徑）：
   - `{程式編號}_規格統計_最終版.md`
   - `{程式編號}_test_cases.md`
   - 若候選檔案有多個，向使用者確認。
4. **產出 UAT checklist：**
   - 以 `test_cases.md` 為基礎，每個測試案例轉為一行 checklist
   - 對照規格統計，補充 test_cases.md 未涵蓋的驗收點（標記為「補充項」）
   - 格式：

     ```markdown
     | # | 測試案例 | 前置條件 | 執行步驟 | 預期結果 | 通過 | 備註 |
     |---|---------|---------|---------|---------|:----:|------|
     | T01 | {案例} | {條件} | 1. {步驟} | {結果} | | |
     ```

5. **[STOP] 確認 checklist** — PG 審閱 checklist 完整性，可增減項目。
6. **PG 執行 UAT** — PG 手動操作 UI，逐項回填「通過」（✓/✗）和「備註」。
7. **彙總報告** — PG 回填完成後，AI 產出彙總報告：
   - 通過率統計
   - 失敗項目明細
   - 建議下一步

## UAT Checklist 輸出格式

```markdown
# {程式編號} {功能名稱} — UAT Checklist

> 日期：{YYYY-MM-DD}
> 測試環境：{由 PG 填寫}

## 測試項目

| # | 測試案例 | 前置條件 | 執行步驟 | 預期結果 | 通過 | 備註 |
|---|---------|---------|---------|---------|:----:|------|
| T01 | ... | ... | ... | ... | | |

## 彙總

| 項目 | 數量 |
|------|------|
| 總項數 | |
| 通過 | |
| 失敗 | |
| 跳過 | |

## 失敗項目明細

（由 AI 根據回填結果自動彙整）

## 建議

（由 AI 根據結果產出）
```

## 核心原則

1. **test_cases.md 是唯一 QA 依據** — 不讀 P3 的單元測試。
2. **AI 產 checklist、PG 跑測試** — AI 不操作 UI，PG 是實際執行者。
3. **獨立 session** — 不在 P3 session 中繼續，保持獨立觀點。
