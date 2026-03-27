---
name: frontend-router
applies_to: "src/router/routes.ts"
---

## 說明

路由註冊：在 `routes.ts` 的單一陣列中追加路由項目。Lazy loading component import、meta.pid 必須與頁面 `setPagePid()` 一致。

## 替換規則

- `{ModuleCode}` → PascalCase 模組代碼（如 `Tm002`）
- `{moduleCode}` → camelCase 模組代碼（如 `tm002`）
- `{MODULE_CODE}` → 大寫格式（如 `TM002`）
- `{module}` → 模組群小寫（如 `tm`）
- `{moduleTitle}` → 模組中文名稱（如 `員工年度假別額度維護`）
- `{moduleIcon}` → Quasar Material Icon 名稱（如 `event_available`）

## 完整參考實作

```typescript
// 在 frontend/src/router/routes.ts 中追加（不覆寫既有路由）

// {MODULE_CODE} {moduleTitle}
{
  path: '/{MODULE_CODE}',
  name: '{MODULE_CODE}',
  component: () => import('pages/{module}/{moduleCode}/{MODULE_CODE}.vue'),
  meta: {
    title: '{moduleTitle}',
    icon: '{moduleIcon}',
    requiresAuth: true,
    pid: '{MODULE_CODE}'
  }
},
```

## TM002 真實範例

```typescript
// TM002 員工年度假別額度維護
{
  path: '/TM002',
  name: 'TM002',
  component: () => import('pages/tm/tm002/TM002.vue'),
  meta: {
    title: '員工年度假別額度維護',
    icon: 'event_available',
    requiresAuth: true,
    pid: 'TM002'
  }
},
```

## 若有明細頁（Detail Page）

```typescript
// {MODULE_CODE} 明細
{
  path: '/{MODULE_CODE}Detail',
  name: '{MODULE_CODE}Detail',
  component: () => import('pages/{module}/{moduleCode}/{MODULE_CODE}Detail.vue'),
  meta: {
    title: '{moduleTitle}明細',
    icon: '{moduleIcon}',
    requiresAuth: true,
    pid: '{MODULE_CODE}'
  }
},
```

## 結構要點

| 欄位 | 規則 |
|------|------|
| `path` | `/{MODULE_CODE}`，大寫（如 `/TM002`） |
| `name` | 與 `path` 相同（不含 `/`） |
| `component` | Lazy loading：`() => import('pages/{module}/{moduleCode}/{MODULE_CODE}.vue')` |
| `meta.title` | 頁面中文標題 |
| `meta.icon` | Quasar Material Icon 名稱 |
| `meta.requiresAuth` | 業務頁面一律 `true` |
| `meta.pid` | **必須**與頁面 `sessionStore.setPagePid()` 的參數完全一致 |

## 業務邏輯注意點

- **單一檔案** — 所有路由在 `routes.ts` 一個陣列中定義，不使用 `import.meta.glob` 或分模組檔案
- **追加不覆寫** — 新模組路由追加到既有陣列中，不刪除其他模組的路由
- **`meta.pid` 一致性** — 必須與頁面組件 `onMounted` 中 `sessionStore.setPagePid('{MODULE_CODE}')` 完全相同
- **`component` 路徑** — 使用 `pages/` alias（不是 `src/pages/`），與 Quasar 專案設定一致
- **Dialog 不需路由** — Dialog 模式的頁面不需為 Dialog 建立獨立路由，Dialog 內嵌在主頁面中
- **Detail 頁面** — TM002 不需 Detail 路由（使用 Dialog 模式）；TM001 有 Detail 路由（使用獨立頁面）
- **icon 選擇** — 使用 [Material Icons](https://fonts.google.com/icons) 名稱，依模組功能選擇合適的 icon

## 驗證清單

- [ ] `routes.ts` 中已新增路由項目
- [ ] `path` 格式正確（大寫模組代碼）
- [ ] `component` import 路徑與實際檔案位置一致
- [ ] `meta.pid` 與頁面 `setPagePid()` 參數一致
- [ ] `meta.requiresAuth` 為 `true`
- [ ] 若有明細頁，已建立 `{MODULE_CODE}Detail` 路由
- [ ] 未破壞既有路由定義
