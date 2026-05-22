# AI Coding Workflow — spec-p3-frontend (v1.0.0)

前端實作 SKILL。讀 P2 產的 `{程式編號}_frontend_tasks.md` + 專案 `CLAUDE.md`，依 task 類型 tag 分流：**契約層（`[service]` / `[store-map]`）寫測試、UI 層（`[page]` / `[dialog]` 等）無測試由 PG 完工後整體手測**。

本 SKILL 是 [`spec-p2-tasking`](../spec-p2-tasking/) v3.0.0 產出後的後續：前端 session 走 `/impl-fe`，後端另起 session 走 [`/impl-be`](../spec-p3-backend/)，兩 session 共用同一份 `progress.md` 與 `session_log.md`。

---

## 類型 tag 驅動的測試策略

| Tag | 測試策略 | 備註 |
|---|---|---|
| `[service]` | **契約測試**（mock fetch，驗 path / method / payload / response shape） | API 服務層 |
| `[store-map]` | **契約測試**（輸入後端 shape → 輸出前端 shape） | Store mapping helper |
| `[store-action]` | **無測試** | ROI 低，手測涵蓋 |
| `[types]` | **無測試** | typecheck 已蓋 |
| `[page]` / `[dialog]` | **無測試** | UI/UX 由 PG 完工後手測 |
| `[i18n]` / `[router]` | **無測試** | 靜態資料 |

**為什麼只測契約層：** AR003 BUG-P4b-R4-CONTRACT 教訓（後端 `creditAmt` vs 前端 `creditLimit`）證明 mapping helper 若無測試，contract mismatch 會延到手測階段才暴露。契約測試是前端唯一 ROI 夠高的測試範圍。UI / UX / 樣式 / 文字類 bug 人眼 1 秒看出，寫測試 ROI 極低。

---

## 核心原則

1. **只測契約層** — UI / UX / 樣式 / 文字由 PG 手測比寫測試快 10 倍。
2. **半自動** — 有測試的 task 走 SG2/SG3、無測試 task 只走 SG3。
3. **Subagent 不產出進 git 的檔案** — 實作 / 測試 code 必須由主 session 撰寫。
4. **讀規範、不掃 code**。
5. **Artifact 即 commit**。
6. **完工後整體手測** — 全部 task 做完後 PG 一次開瀏覽器照 `test_cases.md` 逐條勾選，bug ad hoc 派工（不走 SKILL）。
7. **Scope-lock 動手前必跑** — SG1 第一個子段為 Scope Statement（Deliverable / 預期動到 / out-of-scope）；實作中發現需超出 scope → STOP 回報，不自行擴張。

---

## 觸發方式

- `/impl-fe` — 顯示流程說明並開始
- `/impl-fe <task-list-path>` — 直接帶入前端任務清單路徑

---

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_frontend_tasks.md`（每個 task 已標類型 tag）
2. 專案有 `CLAUDE.md` 索引（指向前端測試框架 Vitest/Jest、lint、typecheck、commit 規範、前端目錄結構等）
3. 建議已完成 `/impl-be`（後端 API 規格確定後，前端契約測試才能對準欄位）

---

## Stop Gate 設計

| # | 位置 | 作用 | 可否省略 |
|---|------|------|:-:|
| SG1 | session 啟動後 | **Scope Statement**（Deliverable / 預期動到 / out-of-scope）+ 載入 + 類型分佈 + 起始 task | 不建議 |
| SG2 | `[service]` / `[store-map]` 寫測試前 | 契約覆蓋度防護 | **不可省略**（有測試的 task）|
| SG3 | task 結束 | 審閱繼續/回修 | 可降密度 |

**UI 類 task（`[page]` / `[dialog]` / `[i18n]` / `[router]` / `[types]` / `[store-action]`）** 跳過 SG2（無測試），只走 SG1 / SG3。

**無 Demo Gate** — 整個 SKILL 完工後由 PG 整體手測，SKILL 內不逐批停。

---

## 流程總覽

```
/impl-fe [task-list-path]
         ↓
[AI]  讀 frontend_tasks.md + CLAUDE.md → 讀規範文件
[AI]  讀 progress.md / session_log.md
[AI]  統計 task 類型分佈
[STOP] SG1: Scope Statement + PG 確認起始 task
         ↓
┌─ 每 task loop ─────────────────────────┐
│  讀 task + 類型 tag                      │
│                                          │
│  [service]/[store-map]:                 │
│    列契約測試清單                        │
│    [STOP] SG2                           │
│    寫測試 Red → 寫實作 Green             │
│    lint + typecheck + git diff 自檢     │
│                                          │
│  其他類（types/store-action/page/        │
│  dialog/i18n/router）:                  │
│    寫實作（無測試）                      │
│    lint + typecheck                     │
│                                          │
│  更新 progress.md + commit              │
│  [STOP] SG3                             │
└─────────────────────────────────────────┘
         ↓
[AI]  全部 task 完成 → 更新 session_log.md
[AI]  建議下一步：
      1. /data 產權限 + 測資
      2. PG 照 test_cases.md 整體手測
      3. bug ad hoc 派修
[AI]  Session 歸檔
```

---

## 契約測試範例

### `[service]` 測試（mock fetch）

```typescript
describe('CustomerService', () => {
  it('getCustomerInfo calls correct API path with correct payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ customerCode: 'C001', creditAmt: 100000 })
    })
    global.fetch = mockFetch

    await CustomerService.getCustomerInfo('C001')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ar003CustomerInfo',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ customerCode: 'C001' })
      })
    )
  })
})
```

### `[store-map]` 測試（mapping helper）

```typescript
describe('mapCustomerInfo', () => {
  it('maps backend creditAmt → frontend creditLimit', () => {
    const backend = { customerCode: 'C001', creditAmt: 100000 }
    const frontend = mapCustomerInfo(backend)
    expect(frontend.creditLimit).toBe(100000)
  })

  it('handles null / undefined backend fields with defaults', () => {
    const frontend = mapCustomerInfo({ customerCode: 'C001', creditAmt: null })
    expect(frontend.creditLimit).toBe(0)
  })

  it('ignores extra backend fields not in frontend shape', () => {
    const frontend = mapCustomerInfo({
      customerCode: 'C001',
      creditAmt: 100000,
      deprecated_field: 'ignore'
    })
    expect(frontend).not.toHaveProperty('deprecated_field')
  })
})
```

---

## 目錄結構

```
spec-p3-frontend/
├── README.md      ← 本文件
└── SKILL.md       ← Claude Code Skill 定義
```

---

## 快速開始

### 1. 確認 P2 產出已就緒且 backend session 已完成

- `Docs/spec/{程式編號}/plan/{程式編號}_frontend_tasks.md` 存在
- 每個 task 有類型 tag
- 建議後端 `/impl-be` 已完成（API shape 確定）

### 2. 於專案 repo 目錄執行

```
/impl-fe
```

### 3. AI 執行步驟

1. 讀 task list + CLAUDE.md 索引 → 規範文件
2. 檢查 progress.md（resume 偵測，讀 `F*` 相關進度）
3. SG1 報告類型分佈
4. Task loop（依 tag 分流）
5. 完工後更新 session_log.md、歸檔

### 4. 後續流程

- [`/data`](../spec-p3-data/) — 權限 + 測資 SQL
- PG 照 `test_cases.md` 整體手測
- bug → ad hoc 派 AI 修

---

## 相關連結

- [`spec-p2-tasking`](../spec-p2-tasking/) — 產 frontend_tasks.md（含類型 tag）
- [`spec-p3-backend`](../spec-p3-backend/) — 後端實作 /impl-be
- [`spec-p3-data`](../spec-p3-data/) — 權限 + 測資 /data
- [主 README](../../README.md) — Skill catalog
