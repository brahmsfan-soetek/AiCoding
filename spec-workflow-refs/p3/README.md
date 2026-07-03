# spec-workflow-refs / p3

P3 三個 SKILL（`spec-p3-backend` / `spec-p3-frontend` / `spec-p3-data`）共用的 reference 文件。

**本目錄不是 SKILL**，不被 Claude Code 載入為可觸發的 skill；由 `plugin.json` 的 `skills` 陣列控制哪些子目錄會被當 SKILL，本目錄不在其中。但作為 `spec-workflow` plugin 的一部分（plugin source = `./`），使用者安裝 plugin 時整個 repo 會被打包到本機，三個 SKILL.md 可用相對路徑（`../../spec-workflow-refs/p3/xxx.md`）引用本目錄檔案。

## 結構

```
spec-workflow-refs/
├── rationale.md                    ← 歷史教訓 ↔ 機制對應（執行 session 不讀，維護者查閱）
└── p3/
    ├── README.md                       ← 本檔
    ├── scope-statement.md              ← SG1 動手前 scope-lock 規約
    ├── commit-rules.md                 ← artifact 合一 commit + 標題不含 task id
    ├── subagent-boundary.md            ← Subagent 不產出進 git 的檔案 + 讀規範不掃 code
    ├── completion-and-handoff.md       ← 完工三條件 + 維護期 hand-off 段落 + SKILL 邊界
    ├── progress-and-session-log.md     ← progress.md / session_log.md 完整格式
    ├── lightweight-review-prompt.md    ← 邏輯類 task 獨立 review prompt（選配，預設關）
    ├── hooks/                          ← 測試唯讀 / 成功靜默 hook 範本（選配，未接線）
    └── commit-hook/
        ├── README.md                   ← commit-time hook 設計脈絡 + 安裝步驟（Maven / npm 並列）
        └── settings.local.json.tmpl    ← PreToolUse + Bash matcher 模板
```

## 修改原則

- 本目錄檔案修改影響 P3 三個 SKILL，commit message 必須註記「shared 改動影響 P3-be/fe/data」
- 每個檔頂部標註「適用：P3-be / P3-fe / P3-data（依檔內容註明）」
- 不放任何 SKILL 獨有規約（如類型 tag 表、SG2 對照表內容）
