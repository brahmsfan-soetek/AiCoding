# spec-p3-frontend Hooks — commit-time typecheck + vitest related

> 切入點 8（review/2026-04-09 direction.md）落地：當 AI 跑 `git commit` 時，自動跑 staged `.ts/.tsx/.vue` 對應的 `npm run typecheck` + `vitest related --run`；失敗 → block commit 並要求 AI 通知 PG。
>
> 範圍：Windows + PowerShell + npm (vue-tsc / tsc / vitest)。其他平台請另行翻譯。

## 為什麼是 commit 時跑、不是每次 Edit 跑

原本切入點 8 設計是 PostToolUse Edit/Write 後立即跑 typecheck。實際盤點後改為 PreToolUse + Bash matcher + git commit filter 觸發，理由：

1. **AI flow 不被切碎**：原設計每 Edit 卡 5-20s（vue-tsc 慢），連續修小 UI 微調（如加 `class="xxx"`）連環卡
2. **vitest 跑 test 可行了**：原設計每 Edit 跑 test 是災難，commit 時跑 1 次可接受
3. **天然對齊 SKILL P3 階段**：task 完成 → commit，每次 commit hook 觸發等於每個 task 收尾跑完整 typecheck + test
4. **SG3 已是天然 typecheck stop gate**：每個 task 結束 SG3 報告本來就要報 typecheck 結果，hook 補位「跳過跑」的極端
5. **切入點 3 拔了 store-map / service mock contract test 後**，剩下保留的 unit test（如純函式 utility / formatter）才是真正該強制跑的，本 hook 跑這些

## hook 行為

```
AI 跑 `git commit`
     ↓
PreToolUse hook 觸發（matcher: Bash）
     ↓
script 從 stdin 拿 tool_input.command
     ↓
不是 `git commit` → exit 0（其他 Bash 不擋，cost 接近 0）
是 `git commit` →
     ↓
git diff --cached --name-only | grep \.(ts|tsx|vue)$
     ↓
無 staged FE 檔 → exit 0
有 staged FE 檔 →
     ↓
找 package.json root（向上走 cwd）
     ↓
讀 package.json scripts：
  優先 typecheck → npm run -s typecheck
  退而 type-check → npm run -s type-check
     ↓
typecheck 失敗 → block + reason（含「⚠️ Do NOT auto-fix in-place」）
typecheck 通過 →
     ↓
若 vitest 已安裝 (node_modules\.bin\vitest 存在)：
  npx --no-install vitest related --run <staged files>
     ↓
test 失敗 → block + reason
全通過 → exit 0，commit 繼續
```

`vitest related --run <files>` 是 vitest 內建的「找與這些檔案相依的 test」mode — 不跑全 test suite，只跑可能受影響的 test。對 unit / 純函式 test 很準。

## block 後 AI 行為

Reason 明示「**⚠️ Do NOT auto-fix in-place**」，要求 AI 收到 block 後：

1. 看 reason 找出失敗檔案 + 第一行錯誤
2. 一句話猜測 root cause
3. **回報 PG**，等 PG 決策

不希望 AI 收到 block 後原地反覆「再修 → 再 commit → 再 block」死循環。

## 安裝

1. 複製 `typecheck-test-on-commit.ps1` 到 target project 的 `.claude/hooks/typecheck-test-on-commit.ps1`
2. 合併 `settings.local.json.tmpl` 的 hooks 區塊到 target project 的 `.claude/settings.local.json`
3. 確認 target project package.json 有 `typecheck` 或 `type-check` script
4. 不需 restart Claude Code；`/hooks` 確認 PreToolUse Bash 已 load

## 已知限制

- **vitest related 對 .vue 的相依分析**：vitest 用 vite 的 module graph 找相依，對 SFC 的 .vue 通常 OK，但若 vite config 自訂 alias / plugin 可能漏 — vitest 找不到相依的 test 就跳過，不會誤擋
- **vue-tsc 在大型專案首次跑 30s+**：incremental cache 可降到 10-15s，commit 等可接受；首次 PG 用 SKILL 前先跑一次 `npm run typecheck` 暖 cache
- **`git diff --cached` 必須在 commit 前已 `git add`**：見 backend README 對應段落
- **若 package.json 沒 typecheck script**：hook 自動跳過（vue-tsc 不直接呼叫，尊重 project pipeline）；PG 在 SKILL SG1 階段會被提示
- **monorepo（pnpm workspaces / nx）**：hook 找最近 package.json，可能跑 sub-package 而非 workspace root；PG 視需求改 `Find-PackageRoot` 改向上走找 workspace root

## 與其他切入點的連動

- **切入點 3**：拔了 store-map / service mock-based contract test。本 hook 跑 `vitest related` 跑的是剩下保留的 unit / 純函式 test。若 PG 在 target project 完全沒寫 vitest test（所有測試走手測），hook 的 test 段自動 skip，僅跑 typecheck — 也是合理 fallback
- **切入點 4**（待動：第一元件 milestone stop + 自訂 CSS regex）：未來可加第二個 hook script 在 commit 時 grep `<style>` 自訂 CSS、`style=` inline style，與 typecheck hook 並列
- **切入點 5**：SKILL 結束後維護期 ad hoc 修也會經過本 hook，避免維護期偷塞錯 commit

## 替代設計（保留設計骨架供未來評估）

### Spike 1（typecheck only on commit）

如果 vitest related 跑太慢或 false positive 太多，可改 typecheck only：移除 script 內 vitest 段。失去「測試該紅而沒紅」的擋下能力，但 typecheck 紀律仍在。

### Spike 2（typecheck + eslint on commit）

在 typecheck 通過後加 `npm run -s lint`（若 package.json 有）。

### Pre-commit git hook（替代 Claude Code hook）

純 git pre-commit hook，與 AI 工具無關。詳見 backend README 對應段。
