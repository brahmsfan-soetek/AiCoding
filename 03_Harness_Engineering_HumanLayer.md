# 參考文獻摘要｜Skill Issue: Harness Engineering for Coding Agents

> 作者：Kyle（HumanLayer）
> 日期：2026-03-12
> 來源：https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents

---

## 核心主張

大多數 coding agent 的失敗**不是模型問題 — 是配置問題**。

```
coding agent = AI model(s) + harness
```

Harness 是 agent 的運行時/周邊設備 — skills、MCP servers、sub-agents、hooks、memory、AGENTS.md。**Harness engineering** 意味著：每次 agent 犯錯，就工程化一個解決方案讓它再也不犯同樣的錯。

Harness engineering 是 **context engineering**（Dex 提出，"12-factor agents"）的子集，專門利用 harness 配置點來精心管理 coding agent 的 context window。

---

## 7 項設計原則

### P1：先把 CLAUDE.md / AGENTS.md 弄好

這是所有 harness 配置之前的第一步。

關鍵子原則（經 ETH Zurich 研究 138 個 agentfiles 驗證）：

| 原則 | 說明 |
|------|------|
| **不要自動生成** | LLM 生成的 agentfiles 反而傷害效能，成本多 20%+ |
| **少即是多** | 指令越少越好。過重的 steering 導致更差的結果 |
| **用漸進揭露** | 不要把所有東西都塞進 agentfile |
| **保持簡潔且普適** | 條件式規則稀釋了效益。HumanLayer 的 CLAUDE.md 不到 60 行 |
| **不要放 codebase 概覽或目錄列表** | Agents 自己探索 repo 結構就夠了 |

### P2：MCP Servers 是用來擴展工具，不是知識

| 原則 | 說明 |
|------|------|
| **工具太多是壞事** | 工具描述填滿 system prompt，更快進入「笨區」。每個無關工具描述都是浪費的指令 |
| **關掉不用的 servers** | 不在用的多工具 server 應該停用 |
| **訓練資料已有的 CLI 優於 MCP** | GitHub、Docker、databases — 模型已經會 CLI。免費獲得 grep/jq 組合性 |
| **永不連接不受信任的 MCP server** | 工具描述被注入 system prompt = prompt injection 向量 |
| **建構 context-efficient 的自訂 CLI** | HumanLayer 用小 CLI wrapper + 6 個範例用法取代 Linear MCP server，省下數千 tokens |

### P3：Skills 用於可重用知識的漸進揭露

Skills 解決「把所有指令塞進 system prompt」的問題（在工作開始前就耗盡指令預算）。

| 概念 | 說明 |
|------|------|
| **漸進揭露** | Agent 只在決定（或你決定）它需要時才獲得 skill 指令/工具 |
| **啟動方式** | SKILL.md 在啟動時作為 user message 載入。Agent 被告知它來自哪個目錄 |
| **多檔案漸進揭露** | 每個 skill 綁多個 markdown 檔案；SKILL.md 告訴 agent 其他檔案是什麼、何時讀取 |
| **分發工具** | 不能直接把 MCP servers 綁在 skill 中。改寫可執行檔/CLI/NPM 套件 |
| **安全警告** | Skill registries（ClawHub、skills.sh）曾被發現分發惡意 skills。像對待 `npm install random-package` 一樣 — 讀你安裝的東西 |

### P4：Sub-Agents 是 Context 防火牆，不是角色扮演

**這是他們最強的發現之一。**

| 概念 | 說明 |
|------|------|
| **不 work 的** | 「前端工程師」sub-agent、「後端工程師」sub-agent 的角色分割 |
| **work 的** | 用 sub-agents 作為 **context 防火牆**。封裝整個 session 的工作，parent agent 只看到 prompt 和最終結果 |
| **Context rot 是真的** | Chroma 研究確認模型在更長 context 下表現更差。parent session 中每個無關的 grep 結果或檔案讀取都是干擾 |
| **condensed responses** | Sub-agents 應回傳高度濃縮的回應。用 `filepath:line` 格式引用來源 |
| **成本控制** | 昂貴模型（Opus）用於 parent session（規劃/編排），便宜模型（Sonnet/Haiku）用於 sub-agents 處理離散小任務 |

**好的 sub-agent 使用場景**：
- 定位特定定義/實作
- 分析 codebase 以識別模式
- 追蹤跨服務邊界的資訊流
- 通用代碼/文件/網頁研究
- 特徵：問題直接、答案簡單、但需要很多中間工具呼叫

**Sub-agent 注意事項**：在 sub-agent system prompt 中仔細指定範圍：該做什麼、**不**該做什麼、回傳什麼資訊及格式、應有哪些工具。

### P5：對更長 Context Window 保持懷疑

更大的 context window **不會**讓模型更善於找到 needle — 它讓 haystack 更大。如果你認為需要更長 context，你可能只需要**更好的 context window 隔離**（透過 sub-agents）。

Extended-context 模型用數學技巧（如 YaRN）延伸序列長度，但**不會增加**模型的指令預算。

### P6：Hooks 用於確定性控制流

Hooks 是在 agent 生命週期特定事件執行的使用者定義命令/腳本。

| 用途 | 範例 |
|------|------|
| **通知** | Agent 完成或需要注意時播放聲音 |
| **批准** | 基於規則自動批准/拒絕工具呼叫（比預設權限更有表達力），如拒絕任何嘗試跑 migration 的 Bash 呼叫 |
| **整合** | 完成時發 Slack、建 PR、設定預覽環境 |
| **驗證** | 每次 agent 停止時跑 formatter + typecheck；成功時靜默退出（不進入 context），失敗時輸出錯誤到 stderr + exit code 2（告訴 harness 重新啟動 agent 修正） |

**範例 hook 模式**：agent 停止時跑 formatter + typecheck。成功 → 靜默（不佔 context）。失敗 → stderr 輸出錯誤 + exit code 2（harness 重新啟動 agent 修正）。

### P7：Back-Pressure 增加成功機率

任務成功與 agent **驗證自己工作的能力**強相關。這是**最高槓桿的投資**之一。

驗證機制：
- Typechecks 和 build 步驟（最好是強型別語言）
- 單元測試和/或整合測試
- 代碼覆蓋率報告（hook 在覆蓋率下降時提示 agent 增加）
- UI 互動/測試（Playwright、agent-browser）

**關鍵**：驗證必須是 **context-efficient** 的。

早期錯誤：每次變更後跑完整測試套件 → 4000 行通過的測試湧入 context → agent 失去任務追蹤並開始幻覺。

**解法：吞掉輸出，只呈現錯誤。成功是靜默的。**

---

## 反模式（不 work 的做法）

| # | 反模式 | 說明 |
|---|--------|------|
| 1 | 預先設計理想 harness | 在遇到真正失敗之前就設計 |
| 2 | 安裝數十個 skills 和 MCP servers「以防萬一」 | 過多工具/指令消耗 context |
| 3 | 每次 session 結束跑完整測試套件（5+ 分鐘） | 改跑子集 |
| 4 | 微調 sub-agents 可存取哪些工具 | 導致 tool thrash 和更差的結果 |
| 5 | 基於角色的 sub-agents | 「前端工程師」「後端工程師」角色分割不 work |
| 6 | 怪模型 | harness 才是真正的問題 |
| 7 | 把所有指令和工具塞進 system prompt | 工作開始前就耗盡指令預算 |
| 8 | 冗長的驗證輸出 | 通過的測試湧入 context → 幻覺和任務遺失 |
| 9 | 祈禱更好的模型 | 不如優化手上的工具 |

## Work 的做法

| # | 做法 |
|---|------|
| 1 | **從簡單開始**，只在 agent 真正失敗時才加配置 |
| 2 | **設計、測試、迭代 — 並丟掉沒用的東西**。「我丟掉的 hooks 比我們實際使用的多得多」 |
| 3 | **分發經過實戰考驗的配置**給整個團隊（透過 repo 級配置） |
| 4 | **優化迭代速度**，而非一次做對的可能性 |
| 5 | **從寬泛的能力開始**（如完整 Linear MCP）然後**修剪**到實際需要的（使用模式出現後） |

---

## 額外洞察：Post-Training 與 Harness 過擬合

模型在特定 harness 上做 post-training（如 Claude in Claude Code、GPT-5 Codex in Codex）可能**過擬合到其 harness**。

Viv 引用 Terminal Bench 2.0：Opus 4.6 在 Claude Code 中排 #33，但在不同 harness 中排 #5。

意味著：**自訂 harness 實際上可以解鎖預設 harness 壓制的效能**。
