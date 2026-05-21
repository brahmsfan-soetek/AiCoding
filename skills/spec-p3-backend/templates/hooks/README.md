# spec-p3-backend Hooks — commit-time typecheck + module test

> 切入點 8（review/2026-04-09 direction.md）落地：當 AI 跑 `git commit` 時，自動跑改動 module 的 `mvn -pl <module> -am test`；失敗 → block commit 並要求 AI 通知 PG。
>
> 範圍：Windows + PowerShell + Maven。其他平台請另行翻譯。

## 為什麼是 commit 時跑、不是每次 Edit 跑

原本切入點 8 設計是 PostToolUse Edit/Write 後立即跑 typecheck（spike 1 / 2 / 3）。實際盤點後改為 PreToolUse + Bash matcher + git commit filter 觸發，理由：

1. **AI flow 不被切碎**：原設計每 Edit 卡 5-15s，連續修小東西時連環卡；新設計只在 commit 時卡（且 commit 本來就慢，等 30-60s 可忍受）
2. **`spike 3 = + test` 變得可行**：原設計每 Edit 跑 test 是災難（×N 次 30s+ 累積），commit 時跑 test 只跑 1 次
3. **天然對齊 SKILL P3 階段**：task 完成 → commit，每次 commit hook 觸發等於每個 task 收尾跑完整 typecheck + test
4. **SG3 已是天然 typecheck stop gate**：每個 task 結束 SG3 報告本來就要報 typecheck 結果，hook 只是補位「AI 跳過跑 typecheck 直接報全 green」這個極端
5. **spike 3 真正擋的 friction（AR002 B03 / AR003 B21 / F11「測試該紅而沒紅」）只能在 test 自動跑時擋下**，spike 1 typecheck only 抓不到

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
git diff --cached --name-only | grep \.java$
     ↓
無 staged .java → exit 0（只動文件 / SQL 等不跑）
有 staged .java →
     ↓
找 Maven reactor root（向上找含 <modules> 的 pom.xml）
     ↓
對每個 staged .java 找所屬 module（artifactId）
     ↓
從 reactor root 跑 `mvn -pl <module1,module2,...> -am test -o -q`
     ↓
exit 0 → 通過，commit 繼續
exit != 0 → 印 {"decision":"block","reason":"..."} → commit 被 block
            reason 含「⚠️ Do NOT auto-fix in-place. Notify PG.」
```

`-am`（also-make）= 連帶包含 module 依賴的模組一起 build，避免 module 間引用斷掉但測試沒測到。

## block 後 AI 行為

Reason 明示「**⚠️ Do NOT auto-fix in-place**」，要求 AI 收到 block 後：

1. 看 reason 找出失敗 module + 第一行錯誤
2. 一句話猜測 root cause
3. **回報 PG**，等 PG 決策（retry / rollback / hand off）

不希望 AI 收到 block 後原地反覆「再修 → 再 commit → 再 block」死循環。這個約束是 hook 設計的一部分（reason 文案）+ 仰賴 AI 遵守。若 AI 自行重試的情況太頻繁 → 後續加 `.claude/hooks/state.json` 紀錄 N 次失敗後升級警告。

## 安裝（SKILL 自動執行，亦可手動）

1. 複製 `typecheck-test-on-commit.ps1` 到 target project 的 `.claude/hooks/typecheck-test-on-commit.ps1`
2. 合併 `settings.local.json.tmpl` 的 hooks 區塊到 target project 的 `.claude/settings.local.json`（保留現有 `permissions` 等其他區塊）
3. 確認 target project pom.xml 結構正確（reactor root + modules 結構標準）
4. 不需 restart Claude Code，file watcher 自動 reload；用 `/hooks` 確認 PreToolUse Bash 已 load

## 已知限制

- **PowerShell 5.1+** 才支援 `[Console]::In.ReadToEnd()` + `ConvertFrom-Json`
- **Maven offline 模式 `-o`** 需 target project 已 cache 依賴（首次跑或新依賴會失敗 → PG 暫時拔 `-o` 跑一次）
- **`git diff --cached` 必須在 commit 前已 `git add`**：若 AI 用 `git commit -a`（自動 stage modified），hook 跑時 staged 已含 modified 檔，OK；若 AI 用 `git commit <specific-file>`，hook 跑 staged 可能不準（少見）
- **跨 module 改動**：staged 涵蓋 module A + B → hook 跑 `mvn -pl A,B -am test`，若 B 依賴 A、A 的 test 失敗，B 不會被測；可接受（A 修完 commit 重跑會 cascade）
- **第一次 cold build** 可能 30s+，後續 incremental cache 約 10-20s
- **僅擋 commit 不擋 push**：commit 已涵蓋；若想 push 也擋，把 matcher 內 regex 改為 `git\s+(commit|push)\b`，並另寫 push 場景的 diff 取得邏輯（不從 cached，從 `git diff origin/HEAD HEAD`）

## 與其他切入點的連動

- **切入點 3**（測試策略瘦身）拔了 Processor mock test、store-map / service contract test，剩 `[validator]` 純函式邊界 test。本 hook 對應 `mvn test` 跑的就是這些剩下保留的測試 — 不再 token 浪費跑 mock test，但保留的 test 強制跑
- **切入點 2**（api_contract + current_schema 跨層 SSOT）+ SG2 對照表處理「契約 / schema 漂移」這類 typecheck 抓不到的 friction，跟本 hook 互補
- **切入點 5**（SKILL 結束點）的「ad hoc bug 不入 SKILL」規約：本 hook 觸發於 commit，SKILL 結束後的維護期 ad hoc 修也會經過 hook，可避免維護期偷塞錯 commit

## 替代設計（保留設計骨架供未來評估）

### Spike 1（typecheck only on commit）

如果跑 test 太慢，可改為 typecheck only：把 script 最後的 `mvn -pl ... -am test` 改成 `mvn -pl ... compile`，跳過 test。失敗時 reason 文案改為「compile failed」。速度提升但失去「test 自動跑」的核心價值。

### Spike 2（typecheck + lint on commit）

在 mvn compile 後加 `mvn -pl ... checkstyle:check`。需 target project pom.xml 已配置 maven-checkstyle-plugin。

### Pre-commit git hook（替代 Claude Code hook）

純走 git pre-commit hook，與 AI 工具無關。優點：不限定 Claude Code，IDE / CLI commit 都會跑。缺點：要手動 install 到 `.git/hooks/`（不能跨 clone 同步），且 AI 看到的錯訊息走 stderr 而非結構化 reason。
