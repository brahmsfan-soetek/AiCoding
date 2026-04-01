# Frontend: Router 路由註冊模板

> 載入時機：Phase 2 前端 Task — 建立頁面時必須同時註冊路由

## 路由檔案位置

`frontend/src/router/routes.ts` — 單一檔案，所有模組的路由定義在同一個陣列中。

**不使用** `import.meta.glob` 或分模組檔案。直接在 `routes.ts` 的陣列中新增項目。

## 範例代碼

```typescript
// ===== {MODULE_CODE} =====
{
  path: '/{MODULE_CODE}',
  name: '{MODULE_CODE}',
  component: () => import('pages/{module}/{moduleCode}/{MODULE_CODE}.vue'),
  meta: {
    title: '{模組中文名稱}',
    icon: '{quasar_material_icon}',
    requiresAuth: true,
    pid: '{MODULE_CODE}'
  }
},
// 若有明細頁
{
  path: '/{MODULE_CODE}Detail',
  name: '{MODULE_CODE}Detail',
  component: () => import('pages/{module}/{moduleCode}/{MODULE_CODE}Detail.vue'),
  meta: {
    title: '{模組中文名稱}明細',
    icon: '{quasar_material_icon}',
    requiresAuth: true,
    pid: '{MODULE_CODE}'
  }
},
```

### 真實範例（TM 模組）

```typescript
// ===== TM001 =====
{
  path: '/TM001',
  name: 'TM001',
  component: () => import('pages/tm/tm001/TM001.vue'),
  meta: {
    title: '假別維護',
    icon: 'beach_access',
    requiresAuth: true,
    pid: 'TM001'
  }
},
{
  path: '/TM001Detail',
  name: 'TM001Detail',
  component: () => import('pages/tm/tm001/TM001Detail.vue'),
  meta: {
    title: '假別維護明細',
    icon: 'beach_access',
    requiresAuth: true,
    pid: 'TM001'
  }
},
```

## 結構要點

| 欄位 | 規則 |
|------|------|
| `path` | `/{MODULE_CODE}`，大寫（如 `/TM002`） |
| `name` | 與 `path` 相同（不含 `/`） |
| `component` | Lazy loading：`() => import('pages/{module}/{moduleCode}/{ModuleCode}.vue')` |
| `meta.title` | 頁面中文標題 |
| `meta.icon` | Quasar Material Icon 名稱（如 `event_available`、`beach_access`） |
| `meta.requiresAuth` | 業務頁面一律 `true` |
| `meta.pid` | **必須**與頁面 `sessionStore.setPagePid()` 的參數完全一致 |

## 一致性規則

- `meta.pid` 的值必須與頁面組件 `onMounted` 中 `sessionStore.setPagePid('{MODULE_CODE}')` 的參數**完全相同**
- `component` 的 import 路徑必須與實際檔案位置一致（使用 `pages/` alias）
- Dialog 模式的頁面**不需要**為 Dialog 建立獨立路由 — Dialog 內嵌在主頁面中

## 驗證清單

- [ ] `routes.ts` 中已新增路由項目
- [ ] `path` 格式正確（大寫模組代碼）
- [ ] `component` import 路徑與實際檔案位置一致
- [ ] `meta.pid` 與頁面 `setPagePid()` 參數一致
- [ ] `meta.requiresAuth` 為 `true`
- [ ] 若有明細頁，已建立 `{MODULE_CODE}Detail` 路由
