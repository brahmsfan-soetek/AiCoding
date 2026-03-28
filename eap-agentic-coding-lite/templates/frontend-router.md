---
name: frontend-router
applies_to: "src/router/routes.ts"
---

## 說明

路由註冊：在 `routes.ts` 的單一陣列中追加路由項目。Lazy loading component import。`meta.pid` 必須與頁面 `setPagePid()` 一致。

## 依規格調整的部分

- path / name：大寫模組代碼（如 `/TM002`）
- component 路徑：`pages/{module}/{moduleCode}/{MODULE_CODE}.vue`
- meta.title：模組中文名稱
- meta.icon：依模組功能選擇 Material Icon
- meta.pid：必須與頁面 `sessionStore.setPagePid()` 參數完全一致

## 完整參考實作

```typescript
// 在 frontend/src/router/routes.ts 中追加（不覆寫既有路由）

// 🔧 path, name, title, icon, pid 從統一規格取得
{
  path: '/TM002',
  name: 'TM002',
  component: () => import('pages/tm/tm002/TM002.vue'),
  meta: {
    title: '員工年度假別額度維護',
    icon: 'event_available',
    requiresAuth: true,
    pid: 'TM002'                   // 🔒 必須與頁面 setPagePid 一致
  }
}
```

## 已知陷阱

- **`meta.pid` 一致性** — 必須與頁面 `onMounted` 中 `sessionStore.setPagePid('TM002')` 完全相同，不一致會導致權限控制失效
- **追加不覆寫** — 新模組路由追加到既有陣列中，不刪除其他模組的路由
- **`component` 路徑** — 使用 `pages/` alias（不是 `src/pages/`），與 Quasar 專案設定一致
- **Dialog 不需路由** — Dialog 模式的頁面不為 Dialog 建立獨立路由，Dialog 內嵌在主頁面中
- **path 大寫** — `/{MODULE_CODE}`，如 `/TM002`（不是 `/tm002`）
