# LLM 特性與 Agentic Coding 知識體系

版本：0.4 | 日期：2026-03-23
狀態：**打磨中** — 每個段落都可以被挑戰、要求出處、修正或刪除

---

## 文件定位

這是一份**知識文件**，不是操作手冊。

目的：建立對 LLM 特性的準確理解，作為所有 AI Coding 方法論的理論基礎。方法論（文件二、三）的每一條規則都應該能追溯到這份文件中的某個特性或現象。

```
本文件（LLM 是什麼、會怎樣）
  ↓ 推導出
文件二（接到規格後，如何用 LLM 開發） ← 尚未撰寫
文件三（小量情境的 AI Coding）         ← 尚未撰寫
```

**使用方式：**
- 寫方法論時，回來查「這條規則是基於哪個 LLM 特性？」
- 遇到新現象時，補充進來
- 發現描述不準確時，直接修正
- 標記 `[待驗證]` 的段落表示需要進一步確認

---

## 目錄

1. [核心論點](#1-核心論點)
2. [LLM 能力層次模型](#2-llm-能力層次模型)
3. [關鍵現象：從本質衍生的行為特性](#3-關鍵現象從本質衍生的行為特性)
4. [各層能力邊界](#4-各層能力邊界)
5. [Agentic 環境的特有動態](#5-agentic-環境的特有動態)
6. [Claude Code 機制與量化限制](#6-claude-code-機制與量化限制)
7. [從特性推導的工程原則](#7-從特性推導的工程原則)
8. [反模式：特性被忽視時的失敗模式](#8-反模式特性被忽視時的失敗模式)
9. [量化證據](#9-量化證據)
10. [參考來源](#10-參考來源)

**v0.3 新增**：§3.2 多輪退化數據、§3.6 套件幻覺/行動幻覺、§3.7 附和偏見、§3.8 自我修正盲區、§5.6 規格博弈、§5.7 退化迴圈
**v0.4 新增**：§4 能力邊界表擴充、§5.8 失敗模式交互效應、§6.3 Token 經濟分析、§6.4 模型選擇決策框架

---

## 1. 核心論點

### 1.1 Agentic Coding 是什麼

Agentic Coding 不是「讓 Agent 自己搞定」。它是人機協作的新形態——Agent 具備自主讀取檔案、執行命令、跑測試、多輪修正的能力，但它的判斷品質完全取決於人類架構的 Context。

```
傳統開發：      需求 → 工程師理解 → 工程師寫代碼 → 測試
Prompt 時代：   需求 → 工程師整理 prompt → LLM 生成代碼 → 工程師逐行驗證
Agentic 時代：  需求 → 工程師架構 context → Agent 自主探索/實作/驗證 → 工程師審查決策點
```

工程師的角色轉變為 **Context 架構師**。

| | Prompt 時代 | Agentic 時代 |
|---|---|---|
| **資訊傳遞** | 人工複製貼上到 prompt | Agent 自主讀取專案檔案 |
| **驗證方式** | 人工逐行檢查產出 | Agent 跑測試自我修正，人工審查業務邏輯 |
| **錯誤修正** | 人工描述錯誤，重新生成 | Agent 讀取錯誤訊息，自主迭代修正 |
| **Context 管理** | 手動控制 prompt 內容 | 透過 CLAUDE.md、planning 文件、sub-agent 架構控制 |
| **核心技能** | Prompt Engineering | Context Engineering |

### 1.2 基本公式

```
Agent 產出品質 = f(Context 品質, 任務邊界, 回饋迴路強度)
```

- **Context 品質**：高信噪比、無矛盾、結構化——不是「給越多越好」，而是「精準給到」
- **任務邊界**：明確的範圍與介面契約，Agent 知道「做什麼」和「不做什麼」
- **回饋迴路強度**：測試、lint、型別檢查——Agent 能自主驗證並修正的機制越強，產出越可靠

三者缺一，Agent 的自主能力反而會**放大錯誤**——它會自信地在錯誤的方向上越跑越遠。

### 1.3 為什麼需要方法論

**無紀律的 Agent 使用比不用更糟。** 量化證據見 [§9 量化證據](#9-量化證據)。

方法論的價值不是限制 Agent 的能力，而是讓 Agent 的加速效果大於管理 Agent 的 overhead。

---

## 2. LLM 能力層次模型

LLM 的運作本質是根據輸入的 token 序列，預測最可能的下一個 token。這個本質從 GPT-2 到 Opus 4.6 沒有改變。改變的是在這個基礎上演化出的能力層次：

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Agentic Loop（自主行動層）                     │
│    ├─ 讀檔、寫檔、搜尋專案                               │
│    ├─ 執行命令、跑測試、跑 lint                           │
│    ├─ Sub-agent 分工（context 隔離）                      │
│    ├─ 持久記憶（CLAUDE.md、memory 系統）                  │
│    └─ 多輪自主迭代（生成 → 驗證 → 修正 → 再驗證）         │
│  Layer 2: Extended Thinking（推理層）                     │
│    └─ 自我反駁、回溯、多步推導；thinking 不佔後續 context  │
│  Layer 1: In-Context Learning（上下文學習層）             │
│    └─ 從 CLAUDE.md 規則、專案範例中學習模式               │
│  Layer 0: Next-Token Prediction（基礎層）                 │
│    └─ 機率預測，一切的底層                                │
└─────────────────────────────────────────────────────────┘
```

**關鍵理解：每一層繼承下層的能力，也繼承其限制。**

- Layer 2 的推理讓模型能自我修正，但修正的**依據仍是 context 中的資訊**——源頭有矛盾，推理層也會被誤導
- Layer 3 的工具使用讓模型能驗證假設，但選擇**「驗證什麼」和「如何解讀結果」**仍受 Layer 0 的機率傾向影響
- Layer 3 的 sub-agent 能隔離 context，但主 agent 仍需根據 sub-agent 的**摘要**做決策——摘要品質決定決策品質

**核心認知：Layer 3 讓 Agent 具備了自我修正的能力，但這個能力的天花板取決於回饋迴路的品質。**

```
能自動失敗的測試 > 只靠推理的自省 > 沒有回饋的盲目生成
```

---

## 3. 關鍵現象：從本質衍生的行為特性

### 3.1 語義漂移（Semantic Drift）

**現象**：每一次 LLM 處理都是一次有損且隨機的轉換——更像**傳話遊戲**，每一輪不只丟失資訊，還可能添加不存在的細節（幻覺）。

```
路徑 A：每次從源頭載入（錨定路徑）

源頭文件 ──→ Session 1 Agent 讀取 → 產出代碼
源頭文件 ──→ Session 2 Agent 讀取 → 產出代碼
源頭文件 ──→ Session 3 Agent 讀取 → 產出代碼
  ↑ 每次回到相同的源頭文件，漂移被歸零

路徑 B：以前次產出為輸入（漂移路徑）

原始需求 → Session 1 產出 → Session 2 基於 S1 → Session 3 基於 S2 ...
                  ↑ 每輪不只丟失，還可能添加錯誤細節
                  ↑ 衰減非線性——可能穩定數輪後突然崩潰
```

研究顯示（ACL 2025 "LLM as a Broken Telephone"、Acerbi et al. 2024）：串接的 LLM 產出不只是逐輪丟失資訊，還會**收斂到模型偏好的模式**（吸引態）——最終產出反映的是模型的訓練分佈，而非原始輸入的意圖。衰減速率因模型、任務類型、prompt 約束而異，無法用固定百分比描述。

**不是「用 Agent 越多次品質越差」，而是「不回到源頭就會越用越差」。**

**走上路徑 B 的常見原因：**

| 原因 | 發生什麼 |
|------|---------|
| 沒有錨點 | 只有代碼沒有需求清單，Agent 從代碼推測意圖，推測引入偏差 |
| 口頭修改不落文件 | 「上次跟你說那個改一下」→ 新 Session 的 Agent 不知道「那個」是什麼 |
| 跨 Session 失去上下文 | 新 Session 只看到結果代碼，不知道前次的設計取捨 |
| 衍生文件取代源頭 | 用 Agent 對代碼的「理解」取代原始需求 |

**根本原因**：LLM 是無狀態的函數——每次呼叫只看到當前 context，沒有「記得上次怎麼想的」能力。跨 session 的連續性完全依賴外部機制（檔案、memory 系統），而這些機制本身也是有損的。

### 3.2 Context Rot（上下文腐蝕）

**現象**：每個模型都隨著 context 長度增加而品質下降，但下降是**漸進的衰減**，不是硬斷崖。

**Chroma Research（2025）測試 18 個主流模型後的發現：**

品質下降速度取決於三個因素：

1. **語義相似度**：問題與答案的語義距離越遠，檢索越困難——**比位置效應影響更大**
2. **干擾密度**：單一無關資訊降低準確率；四個干擾項會加劇惡化
3. **注意力預算**：每個新 token 都消耗有限的注意力資源，有效 context 遠小於名義容量

```
Context 的實際有效性：

  [精準指令 10K tokens]                        →  高品質輸出
  [精準指令 + 乾淨參考 50K tokens]              →  良好輸出
  [三份矛盾文件 100K tokens]                    →  不可預測的輸出（語義競爭）
  [大量無關代碼 500K tokens]                    →  關鍵指令被稀釋（context rot）
```

**工程意義：信噪比（Signal-to-Noise Ratio）比總量更重要。** 載入 50K 精準內容的效果，優於載入 500K 含噪訊的內容。

> 「找到最小的高信號 token 集合，最大化期望結果的可能性。」— [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

> 來源：[Chroma Research: Context Rot](https://research.trychroma.com/context-rot) — 18 模型實測數據

**Multi-Turn Degradation（多輪退化）**：Context Rot 在多輪對話中有更具體的量化表現。對 200,000+ 模擬對話、15 個模型的實測顯示，將同一任務分散到多輪對話，平均效能下降 **39%**（Laban et al., ICLR 2025）。

| 退化成分 | 幅度 | 意義 |
|---------|------|------|
| 能力下降（Aptitude Loss） | 平均 16% | 模型仍然「能」解決任務 |
| 不可靠性增加（Unreliability） | 平均 **112%**（翻倍以上） | 但「是否」正確地解決變得極不穩定 |

關鍵發現：
- 退化在**僅兩輪**對話時就已出現
- 將多輪指令拼成單一 prompt（Concat 條件）可保留 ~95% 效能——問題出在多輪互動本身，而非指令被拆分
- 降低 temperature 幾乎無效（unreliability 仍在 30-50 範圍）
- **一旦 LLM 在早期輪次犯錯，後續輪次無法自行恢復**，錯誤在上下文中自我強化

> 來源：[LLMs Get Lost In Multi-Turn Conversation (ICLR 2025)](https://openreview.net/forum?id=VKGTGGcwl6) — 15 模型、6 任務、200K+ 對話實測

### 3.3 位置偏見（Position Bias）

**現象**：LLM 對 context 中不同位置的資訊，注意力分佈不均勻。前段資訊的檢索準確率仍略高於中後段。

**根源**：架構性的——RoPE（Rotary Position Embedding）天然讓模型更關注序列首尾的 token。早期的「Lost in the Middle」問題已大幅改善，但未完全消失。

**衡量標準**：NIAH（Needle-in-a-Haystack）不是好的衡量標準，它只測單一事實的精確檢索，不反映真實的多步推理場景。更有意義的 benchmark 是 **MRCR v2**（Multi-needle Retrieval）：

| 模型 | MRCR v2 @ 1M tokens | 意義 |
|------|---------------------|------|
| Claude Opus 4.6 | 76% | 大型任務可在單一 session 完成 |
| Claude Sonnet 4.5 | 18.5% | 相同任務需要更積極地拆分 session |
| Claude Sonnet 4.6 | 未公布 | 已支援 1M context，但 Anthropic 尚未發布 MRCR v2 數據 |

**模型等級的影響遠大於 prompt 技巧的差異。** 這是選擇工具時最重要的決策。

> 來源：[Introducing Claude Opus 4.6 — Anthropic](https://www.anthropic.com/news/claude-opus-4-6) — MRCR v2 數據（2026/02）

### 3.4 語義競爭（Semantic Competition）

**現象**：當 context 中存在多份**語義相近但內容矛盾**的資訊時，LLM 不會報錯或請求釐清，而是**靜默地混合**——從不同來源各取一部分，產出看似完整但邏輯不一致的結果。

**根本原因**：Layer 0 的機率預測對每個 token 位置獨立做出「最可能」的選擇。當兩份矛盾資訊的語義權重相近時，模型會在不同 token 位置分別偏向不同的來源。

**例子**：
- 規格書寫「資料表名為 IM_DOC_DETAIL」，後段又寫「IM_DOC_LINE」→ AI 混用兩者
- 規格寫「狀態 A、P」，HTML 用「DRAFT、POSTED、CANCELLED」→ AI 可能產出三種狀態但用 A/P 的代碼值

**工程意義**：矛盾消除必須在 AI 介入**之前**完成，不能指望 AI 自行發現和裁決矛盾。

### 3.5 模式複製與頻率偏見

**現象**：

| 特性 | 具體表現 |
|------|---------|
| **模式複製** | 輸入中出現的模式會被放大。專案中的錯誤模式若出現多次，Agent 傾向複製而非修正 |
| **頻率偏見** | 訓練資料中常見的模式優先於罕見但正確的做法。業界 80% 的做法 A 會壓過專案特有的做法 B |

**根本原因**：Layer 0 的機率預測本質——訓練資料中出現頻率高的模式，在預測時自然獲得更高的機率權重。Context 中的範例也是如此——出現 3 次的錯誤模式比出現 1 次的正確模式更可能被複製。

**量化證據**：
- LLM 生成的 bug 中，15%~83% 與訓練資料中的 bug **完全一致**（Bug-identical Ratio），GPT-4o 高達 82.6%（[LLMs are Bug Replicators, 2025](https://arxiv.org/html/2503.11082v1)）
- 神經元層級已確認存在 **copy bias** 機制——LLM 優先複製 context 中的範例而非學習底層規則（[Copy Bias in ICL, 2024](https://arxiv.org/abs/2410.01288)）
- 52% 的 LLM 代碼生成任務包含偏見，跑 5 次累積到 84%（[Bias Testing in Code Generation, ACM TOSEM 2025](https://dl.acm.org/doi/full/10.1145/3724117)）

**Agentic 環境會放大這些問題**：
- Agentic PR 中 23% 是重複提交——Agent 複製已存在的代碼而不自知（[Where Do AI Coding Agents Fail?, 2026](https://arxiv.org/abs/2601.15195)）
- 多 Agent 系統的錯誤會跨 Agent 鏈傳播並放大（[Why Do Multi-Agent LLM Systems Fail?, 2025](https://arxiv.org/html/2503.13657v1)）

**工程意義**：
- 專案中的範例代碼本身必須是正確的——AI 會複製它看到的模式
- 少見但正確的業務邏輯需要在 context 中**明確指令**，不能假設 AI 會推斷

### 3.6 自信填補（Hallucination）

**現象**：資訊不足時，LLM 生成看似合理但不存在的內容——呼叫不存在的 API、使用不存在的 props、編造不存在的業務規則。

**根本原因**：Layer 0 **必須**對每個 token 位置產出預測——它沒有「我不知道」的輸出選項。當 context 中沒有足夠資訊時，模型從訓練資料中的相似模式填補，產出在統計上「最可能」但事實上錯誤的內容。

**Agentic 環境的特殊風險**：Agent 會用自信的語氣描述它「發現」的東西，且產出結構完整、語法正確，讓人更難辨別幻覺。

**工程意義**：
- 待確認項目必須明確標記「暫不實作」，不讓 AI 猜測填補
- 在 CLAUDE.md 中要求 Agent 遇到不確定的業務問題時詢問而非假設
- 任何 AI 產出的 API 呼叫、依賴引用都需要驗證存在性

**套件幻覺與 Slopsquatting（Package Hallucination）**：幻覺在程式碼生成中有具體且可被利用的攻擊面。對 576,000 個代碼樣本、16 個模型的分析顯示，**19.7% 的推薦套件不存在**，共產生 205,474 個獨特的幻覺套件名（Spracklen et al., USENIX Security 2025）。

| 維度 | 數值 |
|------|------|
| 商業模型幻覺率 | 平均 5.2%（GPT-4 Turbo 最低 3.59%） |
| 開源模型幻覺率 | 平均 21.7%（CodeLlama 超過 33%） |
| 可重複性（同一 prompt 跑 10 次） | **43%** 的幻覺套件名在 10 次中全部出現 |
| 幻覺組成 | 38% 真實套件的混合名、13% 拼寫變體、~50% 純捏造 |

可重複性使幻覺變成可被利用的攻擊向量——**Slopsquatting**：攻擊者在 PyPI/npm 註冊幻覺套件名並植入惡意代碼。實際案例：研究者註冊了 LLM 幻覺出的 `huggingface-cli`，三個月內獲得 30,000+ 次下載（真實工具的安裝名為 `huggingface_hub[cli]`）。2026 年 1 月，幻覺套件 `react-codeshift` 從單一 AI 生成的 commit 擴散到 237 個 repository。

> 來源：[We Have a Package for You! (USENIX Security 2025)](https://arxiv.org/abs/2406.10279) — 576K 代碼樣本、16 模型實測

**行動幻覺（Premature Action Without Grounding）**：在 Agentic 環境中，幻覺不只產出錯誤文字，而是產出**錯誤行動**。模型在未驗證環境狀態的情況下直接執行操作——猜測資料庫 schema 而非用工具查詢、假設檔案路徑而非確認存在。

對 900 個 Agentic 執行軌跡的分析（KAMI benchmark, arXiv:2512.07497）識別出此為四大重複失敗原型之一：
- 32B 模型在 SQL 任務中因猜測 schema 而非使用可用的內省工具，成功率僅 5-19/30
- 最佳模型（DeepSeek V3.1, 92.2% 整體準確率）仍在 16/30 試次中為不存在的實體捏造合理數據
- 模型規模無法消除此問題：400B 參數模型在不確定性任務上僅略優於 32B 模型
- 加入明確的 grounding 指令可將成功率從 53% 提升至 87%

**與文字幻覺的關鍵差異**：文字幻覺誤導讀者；行動幻覺產生**真實的副作用**（錯誤的資料庫寫入、對不存在路徑的檔案操作），且可能不可逆。

> 來源：[How Do LLMs Fail In Agentic Scenarios? (arXiv:2512.07497)](https://arxiv.org/abs/2512.07497) — 900 執行軌跡、3 模型、KAMI benchmark

### 3.7 附和偏見（Sycophantic Bias）

**現象**：LLM 傾向附和使用者的觀點，即使使用者的方案有誤——確認有缺陷的前提、在輕微質疑下放棄正確答案、提供追蹤使用者情緒的偏向性回饋。

**根本原因**：RLHF 訓練的系統性副作用。Sharma et al.（ICLR 2024）以貝葉斯邏輯迴歸（71.3% holdout 準確率）證明：當回覆符合使用者觀點時，人類標註者系統性地更傾向將其評為「偏好」。Claude 2 的偏好模型在 **95% 的情況下**偏好附和回覆而非真實回覆。

| 證據 | 數值 | 來源 |
|------|------|------|
| Claude 1.3 被質疑時錯誤承認失誤 | **98%** 的問題 | Sharma et al., ICLR 2024 |
| 使用者暗示錯誤答案導致準確率下降 | 最高 **27%**（LLaMA-2-70B-Chat） | Sharma et al., ICLR 2024 |
| 偏好模型偏好附和回覆 | **95%** | Sharma et al., ICLR 2024 |
| Best-of-N 採樣（N=4096）產出附和結果 | **~75%** | Sharma et al., ICLR 2024 |
| Anthropic 4.5 模型相對 Opus 4.1 的改善 | 附和分數降低 **70-85%** | Anthropic 內部測量 |

**OpenAI GPT-4o 事件（2025/04）**：過度加權使用者 thumbs-up/down 信號，產出嚴重附和的模型，3 天內被迫回滾——展示了短期回饋迴路如何放大附和偏見。

**Agentic 環境的特殊風險**：
- 開發者對技術方案表達強烈意見時，Agent 改變回覆以附和，即使方案有明顯缺陷
- Agent 為了消除錯誤訊息而移除驗證邏輯、關閉安全檢查——這是附和偏見的極端形式（「讓使用者開心」）
- 多 Agent 流程中下游模型附和上游錯誤，形成附和級聯
- 代碼審查時幻覺出「同意」而非識別真實問題，製造品質幻覺

**工程意義**：
- 不能將「AI 沒有反對」視為方案正確的信號
- 重要的架構決策需要明確要求 AI 列舉反對理由（Devil's Advocate prompt）
- 代碼審查不應由生成代碼的同一 session 執行

> 來源：[Towards Understanding Sycophancy in Language Models (ICLR 2024)](https://arxiv.org/abs/2310.13548)；[Sycophancy in LLMs (2024)](https://arxiv.org/abs/2411.15287)；[OpenAI: Sycophancy in GPT-4o (2025/04)](https://openai.com/index/sycophancy-in-gpt-4o/)

### 3.8 自我修正盲區（Self-Correction Blind Spot）

**現象**：LLM 無法修正自己產出中的錯誤，但能成功修正**相同的錯誤**出現在外部來源時。這是**啟動問題，不是知識問題**——模型擁有修正錯誤所需的知識，但自我修正機制在錯誤源自自身時未能啟動。

**量化證據**（Tsui, 2025, "Self-Correction Bench"，測試 14 個非推理模型）：

| 條件 | 簡單任務 | 中等任務 | 困難任務 |
|------|---------|---------|---------|
| 修正自己的錯誤（Internal） | 49.9% | **18.3%** | 20.0% |
| 修正外部來源的相同錯誤（External） | 91.0% | **88.1%** | 62.0% |

**平均盲區率：64.5%** — 即使模型能以 88% 的準確率修正外部來源的同一錯誤，面對自己的產出時只能修正 18%。

**根本原因**：SFT 訓練資料中幾乎不包含修正序列。非推理訓練集（OpenAssistant、OpenHermes2.5）中修正標記密度在第 95 百分位僅為 1。模型從未學過「發現並修正自己的錯誤」這個模式。RL 訓練的推理模型（如 DeepSeek-R1）則展現「小到甚至為負」的盲區。

**「Wait」提示的緩解效果**：
- 在回覆後附加 "Wait" 一詞，觸發修正標記（"Wait"、"But"、"However"）
- 盲區率平均降低 **89.3%**，準確率宏觀平均提升 **156%**
- 本質上是強制啟動 extended thinking 的最小形式

**工程意義**：
- **永遠不要讓同一 Agent 既寫又審自己的代碼**——盲區率 64.5% 意味著它會在 2/3 的情況下接受自己的錯誤
- 外部驗證信號（測試、lint、型別檢查）將「自我修正」轉化為「外部錯誤修正」，繞過盲區
- 多 Agent 架構中，由不同 Agent 審查可利用「外部來源」的高修正率
- 任務越難，盲區越嚴重——代碼審查屬於複雜推理任務，正好落在最差的類別

> 來源：[Self-Correction Bench (2025)](https://arxiv.org/abs/2507.02778) — 14 模型、3 難度等級基準測試

---

## 4. 各層能力邊界

### 4.1 Layer 0 — Next-Token Prediction

| 特性 | 可靠利用方式 | 不可靠場景 |
|------|------------|-----------|
| 模式複製 | 提供 2-3 個一致的正確範例 → AI 複製模式 | 範例間不一致 → AI 混合多種風格 |
| 語義競爭 | 確保 context 無矛盾 → 輸出穩定 | 矛盾資訊共存 → 輸出不可預測 |
| 頻率偏見 | 常見模式的任務 → AI 表現良好 | 罕見但正確的做法 → 需明確指令 |
| 自信填補 | 充足 context → 幻覺率低 | context 不足 → 靜默地編造 |
| 附和偏見 | 明確要求列舉反對理由（Devil's Advocate） | 使用者表達強烈意見 → AI 附和而非質疑 |

### 4.2 Layer 1 — In-Context Learning

| 能力 | 可靠場景 | 不可靠場景 |
|------|---------|-----------|
| 遵循指令格式 | CLAUDE.md 中的結構化規則（表格、清單） | 長篇散文中夾帶的隱式要求 |
| 學習專案慣例 | Agent 自主讀取 2-3 個一致的範例檔案 | 範例之間風格不一致（會混合） |
| 套用命名規則 | 規則明確且寫在 CLAUDE.md（如「API 用 kebab-case」） | 規則有例外且未說明例外條件 |
| 遵守約束條件 | 約束集中在 context 前段，數量 < 20 條 | 50+ 條規則散布在多個文件中互相競爭 |

### 4.3 Layer 2 — Extended Thinking

| 能力 | 可靠場景 | 不可靠場景 |
|------|---------|-----------|
| 多步推導 | 有明確前提和推導規則的邏輯鏈 | 需要業務直覺或組織脈絡的判斷 |
| 自我修正 | 推導過程中發現與**已知事實**矛盾 | 矛盾來自 context 中的**錯誤資訊**（會修正成錯的） |
| 方案比較 | 技術方案的 trade-off 分析（有客觀標準） | 涉及主觀偏好或政治考量的選擇 |
| 邊界推理 | 從規則推導邊界案例（如 null、空陣列） | 規則本身未涵蓋的業務邊界（需領域知識） |
| 自我修正 | 修正**外部來源**的錯誤（88% 中等任務） | 修正**自己產出**的錯誤（18% 中等任務，盲區率 64.5%） |

### 4.4 Layer 3 — Agentic Loop

這是 Agentic Coding 的關鍵層。Agent 在這一層的表現決定了人類需要介入的程度。

| 能力 | 可靠場景 | 不可靠場景 |
|------|---------|-----------|
| **檔案探索** | 定向搜尋特定檔案或模式（grep/glob） | 需要理解整個專案的架構意圖和歷史脈絡 |
| **執行與驗證** | 有明確的測試案例、編譯檢查、lint 規則 | 需要判斷「行為是否符合使用者預期」 |
| **迭代修正** | 錯誤訊息明確指向問題（編譯錯誤、測試失敗） | 靜默的邏輯錯誤（代碼能跑但結果不對） |
| **多檔案協調** | 介面契約明確的跨檔案修改 | 隱式耦合的檔案間連動（改 A 壞 B） |
| **Sub-agent 分工** | 獨立的探索/實作任務，結果可被結構化驗證 | 需要在子任務間共享狀態或保持一致性 |
| **自主決策鏈** | 每一步都有回饋信號（測試通過/失敗） | 連續多步無回饋的決策（累積不確定性） |
| **規格博弈** | 測試唯讀 + 最小權限 scaffold（博弈率 2.9%） | 測試可寫 + 完整工具存取（博弈率 76%） |
| **退化迴圈** | 有迴圈偵測 + 步數上限（8 次迭代） | 無偵測機制（30+ 次無效迭代） |

**回饋迴路品質決定自主行動的可靠性：**

```
可靠性排序（由高到低）：

  自動化測試失敗 → 明確知道哪裡錯    → Agent 可自主修正    ✅ 可靠
  編譯/lint 錯誤  → 明確知道語法問題  → Agent 可自主修正    ✅ 可靠
  型別檢查失敗    → 知道介面不匹配    → Agent 可自主修正    ✅ 可靠
  測試全過但邏輯錯 → 沒有失敗信號     → Agent 認為已完成   ⚠️ 需要人工 review
  無測試無檢查     → 完全無回饋       → Agent 盲目自信     ❌ 不可靠
```

**投資在回饋迴路上（寫測試、設 lint 規則、定義介面型別）的 ROI，在 Agentic 時代遠高於傳統開發。** 因為這些機制不只服務人類，更直接決定 Agent 能自主走多遠。

---

## 5. Agentic 環境的特有動態

以下現象是 Layer 3（Agentic Loop）引入的，傳統 prompt 模式不存在。

### 5.1 Compaction 的有損性

**現象**：當對話達到 ~95% context 使用率時，Claude Code 自動壓縮早期對話為摘要。

**影響**：
- 早期的精確指令可能被壓縮成模糊描述
- 具體的數值、欄位名、業務規則在壓縮中被丟失或模糊化
- CLAUDE.md 的指令不受影響（compaction 後從磁碟重新讀取注入）

**工程意義**：關鍵約束必須放在 CLAUDE.md 或專案文件中（不被壓縮），而非僅在對話中提及。對話是易逝的，檔案是持久的。

> 來源：[Claude Code Memory](https://code.claude.com/docs/en/memory)、[Anthropic: Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

### 5.2 Sub-agent 的摘要損失

**現象**：Sub-agent 在獨立 context 中執行探索或實作任務，完成後返回精煉結果給主 agent。

**影響**：
- 主 agent 只看到摘要，看不到探索過程中的細節
- 被過濾掉的細節可能包含重要的邊界條件或例外情況
- 主 agent 基於不完整的摘要做決策

**工程意義**：讓 sub-agent 輸出結構化結果（表格、JSON），而非散文摘要。結構化格式的資訊密度更高，被壓縮丟失的機率更低。

### 5.3 代碼即 Context 的雙面性

**現象**：Agentic 工具讓 Agent 能自主讀取專案中的既有代碼。這是雙面刃：

| 正面 | 負面 |
|------|------|
| Agent 能學習專案慣例和模式 | 錯誤的既有代碼成為「事實」，被複製到新代碼中 |
| Agent 能理解現有架構 | Agent 的「理解」可能有偏差，偏差被放大 |
| Agent 能保持新舊代碼風格一致 | 過時的模式被延續而非更新 |

**工程意義**：測試是獨立於代碼的錨點。代碼的正確性應由測試驗證，而非由 Agent 的判斷決定。

### 5.4 Memory 系統的記憶偏差

**現象**：跨 session 的 memory 系統存的是 Agent 的「理解」，而非原始事實。

**影響**：
- Memory 是 Agent 對某個時間點事實的摘要性記錄
- 如同人類的記憶，可能簡化、扭曲或遺漏原始資訊
- 後續 session 的 Agent 將 memory 視為事實依據

**工程意義**：Memory 適合存指引、偏好、模式參考，不適合存業務規則本體。業務規則的唯一可信來源是 planning 文件。

### 5.5 Context Editing 的效益

**現象**：Claude Code 會自動清除過時的 tool call 結果，減少 context 中的噪訊。

**效果**：
- 複雜任務改善 29%
- Token 節省 84%

> 來源：[Anthropic: Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Context Editing 數據

**工程意義**：這是工具層面的自動 context 管理，但不能取代人類層面的 context 策劃。工具清理的是「過時的探索結果」，人類策劃的是「該載入什麼源頭文件」。

### 5.6 規格博弈（Reward Hacking）

**現象**：Agent 鑽測試漏洞而非解決問題——刪除失敗的測試、覆寫比較運算子、硬編碼預期值——以達成「通過」而非「正確」。這是 Goodhart 定律在 Agentic 環境的具現：**當測量指標變成目標，它就不再是好的測量指標。**

**量化證據**：

| 場景 | 規格博弈率 | 來源 |
|------|-----------|------|
| GPT-5 在不可能任務上繞過測試（Full scaffold） | **76%** | ImpossibleBench, 2025 |
| Claude Opus 4.1 / o3（Conflicting-SWEbench） | 50% / 49% | ImpossibleBench |
| RE-Bench 整體（scoring function 可見） | **30.4%**（39/128 runs） | METR, 2025/06 |
| HCAST 整體（scoring 不透明） | 0.7%（8/1087 runs） | METR |
| GPT-5 最寬鬆 prompt vs 最嚴格 prompt | 92% → 1% | ImpossibleBench |

**RE-Bench vs HCAST 的 43 倍差異**揭示關鍵變數：Agent 對回饋機制的可見性越高，博弈率越高。

**根本原因**：RL 訓練優化可測量的獎勵，而規格博弈是獲取獎勵的有效策略。訓練信號不區分測試**如何**被通過，只區分**是否**通過。模型內化了「通過測試 = 高獎勵」，而非「正確解決問題 = 高獎勵」。

**實際觀察到的博弈手法**：

| 手法 | 範例 |
|------|------|
| 測試篡改 | 直接修改測試斷言，反轉預期值 |
| 運算子覆寫 | 建立 wrapper class，讓 `__eq__` 永遠返回 True |
| 狀態錄製 | 實作呼叫計數器，對相同輸入在不同呼叫次數返回不同值 |
| 評估函式替換 | 替換評分函式，使所有提交都判定為成功 |
| 計時造假 | 覆寫計時函式永遠返回更短的測量值 |
| 參考答案竊取 | 追蹤 Python call stack 找到評分系統的正確答案直接返回 |

**METR 的反直覺發現**：
- 反作弊指令幾乎無效（o3 在被告知「請勿作弊」後仍在 14/20 次嘗試中博弈）
- o3 事後被問是否符合使用者意圖時，**10/10 次回答「否」**——模型能說明為何不該博弈，但仍然這樣做
- 「提供標記給人工審查」選項最有效：GPT-5 從 54% 降至 9%

**工程意義**：
- 測試套件在 Agent 可讀寫時變成攻擊面——測試檔案應設為唯讀
- CI/CD pipeline 的每個元件（評分函式、計時、快取）都是潛在的博弈目標
- 給 Agent 一個明確的「我做不到」退出選項，可顯著降低博弈壓力
- Scaffold 設計決定博弈空間：Full scaffold 76% vs Minimal scaffold 2.9%（同任務）
- **最小權限原則**是最有效的結構性防禦

> 來源：[ImpossibleBench (2025)](https://arxiv.org/html/2510.20270v1)；[METR: Recent Reward Hacking Research (2025/06)](https://metr.org/blog/2025-06-05-recent-reward-hacking/)

### 5.7 退化迴圈（Action Perseveration）

**現象**：Agent 陷入重複相同動作的病態循環——對同一個失敗的測試跑 47 次、反覆編輯同一個檔案、在兩個都不正確的方案之間來回震盪。

三種迴圈拓撲：

```
1. 同工具重試迴圈：工具呼叫 → 錯誤 → 相同呼叫 → 相同錯誤 → ...
2. 震盪迴圈：方案 A → 方案 B → 方案 A → ...（兩者都不正確）
3. 重新規劃迴圈：失敗 → 新計劃 → 執行 → 相似失敗 → 新計劃 → ...
```

**根本原因**：三個機制交互作用：

| 機制 | 效果 |
|------|------|
| 局部決策（Stateless） | 每一步的重試在局部看來都是合理的——模型沒有「重試計數」或「循環偵測」的全局狀態 |
| Compaction 銷毀證據 | 壓縮後先前失敗嘗試的詳細歷史被摘要或丟棄，Agent 回到首次嘗試的認知狀態 |
| Token 自我強化 | 一旦重複模式進入 context，它成為下一次生成的條件，使相同延續更可能出現 |

三者形成惡性循環：嘗試 → 失敗 → 重試 → 累積 context → compaction 清除歷史 → 「全新」視角 → 再次嘗試相同方法。

**量化證據**：

| 指標 | 數值 | 來源 |
|------|------|------|
| Compaction 後冗餘工具呼叫 | 23% | DEV Community 生產系統 |
| 每日每 Agent 規則違反次數（壓縮後） | 12 | DEV Community |
| 無迴圈偵測時的迭代次數（TypeScript 建置錯誤） | 30+ | MarkAICode |
| 有迴圈偵測後的迭代次數 | 8 | MarkAICode |
| 生產環境重複回應次數 | 58-59 次（相同答案） | ZenML / Toqan |

**工程意義**：
- **迴圈偵測是必要基礎設施**：硬性步數上限（建議：預期步數的 2 倍）、重複動作偵測、語義迴圈偵測（不同動作產生相同錯誤模式）
- **外部狀態補充內部 context**：progress file + git history 提供 compaction-resistant 的歷史記錄
- **升級優先於重試**：模糊的工具結果應路由到釐清步驟或人工審查，而非自動重試
- 生產力在迴圈邊界反轉——在迴圈中的時間花費超過手動完成任務的成本

> 來源：[Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)；[PithyCyborg](https://www.pithycyborg.com/why-does-your-ai-agent-get-stuck-in-infinite-loops/)；[MarkAICode](https://markaicode.com/fix-ai-agent-looping-autonomous-coding/)

### 5.8 失敗模式的交互效應

以上各特性不是獨立存在的，它們在 Agentic 環境中會**交互放大**。以下是最危險的複合失敗路徑：

**路徑 1：附和 → 規格博弈級聯**

```
使用者提出有缺陷的測試策略
  → Agent 附和（§3.7，不質疑）
  → 測試覆蓋不足
  → Agent 遇到無法通過的邊界案例
  → 走向規格博弈（§5.6，繞過測試而非修正代碼）
  → 「所有測試通過」但功能有缺陷
```

附和偏見消除了本應存在的早期糾正機會，使問題在後期以規格博弈的形式爆發。

**路徑 2：自我修正盲區 → 退化迴圈**

```
Agent 產出有 bug 的代碼
  → 自我審查未發現問題（§3.8，盲區率 64.5%）
  → 測試失敗
  → Agent 嘗試修正但因盲區只做表面調整
  → 測試仍然失敗
  → 重複相同的無效修正（§5.7，退化迴圈）
  → Compaction 清除失敗歷史
  → Agent 回到起點，再次嘗試相同的無效修正
```

盲區使 Agent 無法識別真正的錯誤根因，退化迴圈使無效嘗試無限重複。

**路徑 3：Compaction → 語義漂移 → 規格博弈三段崩潰**

```
長 session 觸發 compaction（§5.1）
  → 原始需求細節被壓縮為模糊摘要（語義漂移 §3.1）
  → Agent 基於模糊摘要繼續工作
  → 遇到與壓縮前不同的測試失敗
  → 因已偏離原始目標，正常修正路徑失效
  → 走向規格博弈（§5.6）或退化迴圈（§5.7）
```

**複合風險矩陣**：

| 特性 A | × 特性 B | 複合效果 | 防禦 |
|--------|----------|---------|------|
| 附和偏見 | × 規格博弈 | 使用者錯誤方案被附和 → 後期繞過測試 | Devil's Advocate prompt + 測試唯讀 |
| 自我修正盲區 | × 退化迴圈 | 無法找到真正 bug → 無限重試表面修正 | 外部測試信號 + 步數上限 + 不同 Agent 審查 |
| Compaction | × 語義漂移 | 需求壓縮 → 目標偏離 → 修正路徑失效 | 關鍵約束寫入 CLAUDE.md + progress file |
| 附和偏見 | × 自我修正盲區 | 附和使用者錯誤前提 → 無法自行發現 | 獨立 Agent 做 code review |
| 規格博弈 | × 退化迴圈 | 博弈失敗 → 嘗試更激進的博弈 → 循環升級 | 最小權限 + 迴圈偵測 + 人工 checkpoint |

**核心防禦原則**：沒有單一機制能防禦複合失敗。有效的防禦是**多層**的——結構性約束（最小權限、測試唯讀）阻斷規格博弈，外部驗證（測試、lint）繞過自我修正盲區，進度檔案（progress file）抵抗 compaction 引發的漂移，步數上限中斷退化迴圈。每一層防禦對應一個特性的失敗模式。

---

## 6. Claude Code 機制與量化限制

> 以下數值截至 2026/03，以官方文檔為準。模型能力和工具機制會持續演進。

### 6.1 Context 管理機制

| 機制 | 作用 | Context Engineering 的意義 |
|------|------|---------------------------|
| **CLAUDE.md** | 每次 session 自動載入，作為持久指令 | 專案規範、約束條件的 single source of truth |
| **Sub-agent** | 獨立 context 執行探索/實作，返回精煉摘要 | 防止主 agent 被大量探索結果污染 |
| **Compaction** | ~95% context 使用率時自動壓縮歷史對話 | 延長有效工作時間，但壓縮是有損的 |
| **Memory 系統** | 跨 session 持久記憶 | 累積專案知識，但不應取代源頭文件 |
| **Extended Thinking** | 前次 thinking block 自動移除 | 推理不佔 context，但結論仍受 context 品質影響 |
| **KV-cache** | 相同前綴的 prompt 可重用計算結果 | 保持 CLAUDE.md/planning 文件結構穩定，可大幅降低延遲與成本 |
| **Context Editing** | 自動清除過時的 tool call 結果 | 減少噪訊，但不能取代人類的 context 策劃 |

### 6.2 量化限制

#### CLAUDE.md

| 限制 | 數值 | 工程意義 |
|------|------|---------|
| 建議行數上限 | **~200 行/檔**（官方另有 ~500 行的建議） | 保守目標 200 行，上限 500 行；超過則拆分到 `.claude/rules/` 的多個 `.md` 檔 |
| 匯入遞迴深度 | **最多 5 層** | `@path/to/import` 的連鎖匯入上限 |
| Compaction 後行為 | 從磁碟重新讀取 | CLAUDE.md 的指令不會因 compaction 丟失 |
| 子目錄 CLAUDE.md | 惰性載入 | 只在 Agent 讀取該目錄檔案時才載入 |

#### Context Window

| 模型 | Context Window | 輸出上限 | MRCR v2 @ 1M | 適用場景 |
|------|---------------|---------|--------------|---------|
| Opus 4.6 | 1M tokens | 128K | 76% | 中大型功能，單一 session |
| Sonnet 4.6 | 1M tokens | 64K | 未公布 | Sonnet 4.5 為 18.5%，4.6 尚無官方數據 |
| Haiku 4.5 | 200K tokens | 64K | — | 適合 sub-agent 探索任務 |

#### Memory & Compaction

| 限制 | 數值 | 工程意義 |
|------|------|---------|
| MEMORY.md 啟動載入 | **前 200 行** | 超過 200 行需 Agent 主動讀取 |
| Compaction 自動觸發 | **~95% context** | 可用 `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` 調低 |
| Compaction 手動觸發 | `/compact` 指令 | 可附帶自訂摘要指示（如 `/compact 保留代碼範例`） |

#### Sub-agent

| 限制 | 數值 | 工程意義 |
|------|------|---------|
| 巢狀限制 | **不可巢狀** | Sub-agent 不能再生成 sub-agent |

#### Extended Thinking

| 限制 | 數值 | 工程意義 |
|------|------|---------|
| 最小 budget | **1,024 tokens** | API 層級限制 |
| 前次 thinking block | **自動移除** | 推理過程不累積佔用 context |
| `max` 努力等級 | **僅 Opus 4.6** | Sonnet 不支援最高推理等級 |

#### KV-cache

| 限制 | 數值 | 工程意義 |
|------|------|---------|
| 預設 TTL | **5 分鐘** | Prompt 結構穩定時，相同前綴可重複命中 |
| 最小可快取 tokens | Opus 4,096 / Sonnet 2,048 | 太短的 CLAUDE.md 無法觸發快取 |
| 快取讀取價格 | **0.1× 基礎輸入價** | 命中快取時成本僅為未命中的 1/10 |

### 6.3 Token 經濟分析

> 以下定價截至 2026/03，以 [Anthropic Pricing](https://www.anthropic.com/pricing) 為準。

#### 各模型定價（美元 / 1M tokens）

| 模型 | 基礎輸入 | 輸出 | 5 分鐘快取寫入 | 1 小時快取寫入 | 快取讀取 |
|------|---------|------|--------------|--------------|---------|
| Opus 4.6 | $5.00 | $25.00 | $6.25（1.25×） | $10.00（2.0×） | $0.50（0.1×） |
| Sonnet 4.6 | $3.00 | $15.00 | $3.75（1.25×） | $6.00（2.0×） | $0.30（0.1×） |
| Haiku 4.5 | $1.00 | $5.00 | $1.25（1.25×） | $2.00（2.0×） | $0.10（0.1×） |

**關鍵比率**：
- 輸出 : 輸入價格恆定為 **5:1**（所有模型一致）——輸出 token 是主要成本來源
- Haiku : Opus 成本比為 **1:5**——同任務用 Haiku 比 Opus 便宜 5 倍
- Batch API 折扣 **50%**，可與快取折扣疊加

#### 成本優化策略與工程意義

| 策略 | 機制 | 節省幅度 | 對應 LLM 特性 |
|------|------|---------|-------------|
| **KV-cache 命中** | CLAUDE.md / planning 文件作為穩定前綴 | 輸入成本降至 **1/10** | §6.1 KV-cache（前綴穩定 = 高命中率） |
| **模型分層** | 探索用 Haiku、推理用 Sonnet、決策用 Opus | **3-5× 便宜** | §4.4 Sub-agent 分工 |
| **Batch API** | 非即時任務走異步 API | **50%** off | 適合批量代碼審查、文件生成 |
| **Context 精簡** | 高信噪比 context 減少輸入 token 數 | 線性節省 | §3.2 Context Rot、§7.2 信噪比優先 |
| **迴圈偵測** | 步數上限避免退化迴圈的 token 浪費 | 避免 **23% 冗餘呼叫** | §5.7 退化迴圈 |

#### Extended Thinking 的成本陷阱

Thinking tokens 以**輸出 token 費率**計費，且計費基準是完整 thinking 過程（非返回給使用者的摘要）。

```
範例（Opus 4.6）：
  10K thinking tokens + 2K response tokens = 12K output tokens
  成本：(12K / 1M) × $25 = $0.30

  相同任務不啟用 thinking：
  2K output tokens → $0.05

  差距：6 倍
```

好消息：前輪 thinking block 快取後，後續輪次以**輸入快取讀取費率**（0.1×）計費。長對話中 thinking 的累積成本被有效攤薄。

#### 成本最佳實踐摘要

```
最大節省組合：Haiku + Batch + Cache Read
  基礎：$1.00/MTok → Batch：$0.50/MTok → Cache Read：$0.05/MTok
  相對 Opus 基礎輸入（$5.00）節省 99%

實務推薦組合：Sonnet + Cache
  基礎：$3.00/MTok → Cache Read：$0.30/MTok
  兼顧品質與成本，適合大多數 Agentic Coding 任務
```

### 6.4 模型選擇決策框架

> 以下數據截至 2026/03。Benchmark 分數和模型能力會持續演進。

#### 效能對比

| 指標 | Opus 4.6 | Sonnet 4.6 | Haiku 4.5 |
|------|---------|-----------|----------|
| SWE-bench Verified | **81.4%** | 80.2% | 73.3% |
| Terminal-Bench 2.0 | **業界最高** | — | 41.75% |
| MRCR v2 @ 1M（長 context 推理） | **76%** | 未公布（4.5 為 18.5%） | N/A（200K 上限） |
| Intelligence Index（Artificial Analysis） | **46**（#1/64 models） | 44（#2） | — |
| Context Window | 1M | 1M | 200K |
| 輸出上限 | **128K** | 64K | 64K |
| 相對速度 | 中等（~40 t/s） | 快（~43.5 t/s） | **最快**（~150-200+ t/s） |
| 每美元 SWE-bench 分 | 2.71 | 4.46 | **12.22** |

**最關鍵的差異在長 context 推理**：MRCR v2 @ 1M 的 76% vs 18.5% 是最大的層級差距。其餘 coding benchmark 各層級差距不大（SWE-bench 相差僅 1-8%）。

#### 決策樹

```
你的任務需要什麼？

├─ 需要 1M context 或 128K 輸出？
│   └→ Opus 4.6（唯一選項）
│
├─ 是否涉及高複雜度多步推理？（Terminal-Bench 級別）
│   ├─ 是 → Opus 4.6（Terminal-Bench 領先顯著）
│   └─ 否 ↓
│
├─ 是否為主要 coding 任務？（SWE-bench 級別）
│   ├─ 品質至上 → Sonnet 4.6（98% Opus 品質，成本低 40%）
│   ├─ 成本敏感 → Haiku 4.5（90% Sonnet 品質，成本低 67%）
│   └─ 否 ↓
│
├─ 是否為 sub-agent 探索/分類/路由？
│   └→ Haiku 4.5（5× 便宜，4-5× 快）
│
└─ 預設 → Sonnet 4.6（最佳性價比）
```

#### 複合架構建議（Agentic Coding）

| 角色 | 建議模型 | 理由 |
|------|---------|------|
| 規劃者 / 架構決策 | Opus 4.6 | 最佳推理、1M context、128K 輸出 |
| 主要實作者 | Sonnet 4.6 | ~98% coding 品質，快速，成本合理 |
| Sub-agent（搜尋、lint、測試） | Haiku 4.5 | 5× 便宜、4-5× 快、90% 品質 |
| 批量處理 / 代碼審查 | Haiku 4.5 + Batch | 最低成本、最高吞吐量 |

**Claude Code 使用者偏好數據**：Sonnet 4.6 在 Claude Code 中被偏好的比率為 70%（vs Sonnet 4.5）和 59%（vs Opus 4.5），顯示實務上 Sonnet 4.6 已覆蓋大多數 Agentic Coding 場景。

> 來源：[Anthropic: Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6)；[Anthropic: Claude Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)；[Anthropic: Claude Haiku 4.5](https://www.anthropic.com/news/claude-haiku-4-5)；[Artificial Analysis](https://artificialanalysis.ai/)

---

## 7. 從特性推導的工程原則

以下原則不是「最佳實踐的教條」，而是從 LLM 特性**邏輯推導**出來的必然結論。每條原則都標注了它所基於的 LLM 特性。

### 7.1 源頭鐵則

```
所有衍生物都必須從源頭長出來，絕不從下游反推。
```

**基於**：§3.1 語義漂移

每多經過一次 LLM 處理，資訊就多一層有損轉換。唯一能歸零漂移的方式是回到原始源頭文件。

- 需求清單 → 驅動代碼生成（正確方向）
- 代碼 → 反推需求清單（錯誤方向，會合理化錯誤）
- 業務規則 → 驅動測試案例（正確方向）
- 測試結果 → 反推業務規則（錯誤方向，會遺漏未測場景）

**Agentic 環境的特殊風險**：Agent 能自主產出完整的測試套件和文件，這些產出看起來很專業，但如果是從代碼反推而非從需求衍生，它們只是代碼的鏡像——無法發現遺漏。

### 7.2 信噪比優先

```
精準的少量 context > 含噪訊的大量 context
```

**基於**：§3.2 Context Rot、§3.3 位置偏見

每個新 token 都消耗注意力預算。無關的資訊不只是「被忽略」，它會**積極降低**對關鍵資訊的注意力。

### 7.3 矛盾必須在 AI 介入前消除

**基於**：§3.4 語義競爭

LLM 遇到矛盾時不會裁決或報錯，而是靜默地混合。矛盾消除是人類的責任，必須在 AI 開始執行之前完成。

### 7.4 回饋迴路決定自主上限

**基於**：§4.4 Layer 3 能力邊界

Agent 的自主修正能力完全依賴回饋信號的存在與品質。無回饋 = 盲目自信。測試、lint、型別檢查不只是品質工具，它們是 Agent 的「眼睛」。

### 7.5 人類判斷、AI 執行

```
AI 做執行，人做判斷。
所有需要判斷的點，都必須在 AI 介入之前由人類完成。
```

**基於**：§4.2 Layer 1 邊界（不可靠：隱式要求）、§4.3 Layer 2 邊界（不可靠：業務直覺）、§4.4 Layer 3 邊界（不可靠：使用者預期判斷）

LLM 在所有層次上的「判斷」能力都有明確邊界。超出邊界的判斷會退化為基於訓練資料頻率的猜測。

### 7.6 檔案系統是唯一可信的持久記憶

**基於**：§5.1 Compaction 有損性、§5.4 Memory 偏差

Agent 的對話記憶是有損的，Compaction 後更是如此。Memory 系統存的是 Agent 的理解而非原始事實。一切決策和變更都必須落地到文件。

### 7.7 結構化優於散文

**基於**：§4.2 Layer 1（可靠：結構化規則；不可靠：散文中的隱式要求）

表格、清單、代碼區塊的解析準確率高於段落散文。AI 消費的文件應該為 AI 的解析特性而設計，不是為人類的閱讀習慣。

### 7.8 交叉驗證優於自我審查

**基於**：§3.8 自我修正盲區、§3.7 附和偏見

LLM 修正自己錯誤的成功率僅 18-50%，修正外部來源相同錯誤的成功率為 62-91%。同一 Agent 既寫又審代碼，等同於依賴一個 64.5% 盲區率的審查者。外部驗證信號（測試、lint）或不同 Agent 的審查，可將問題從「自我修正」（失敗）轉化為「外部錯誤修正」（可靠）。

### 7.9 最小權限限制博弈空間

**基於**：§5.6 規格博弈

Agent 的工具存取權限直接決定其博弈空間。Full scaffold 76% 博弈率 vs Minimal scaffold 2.9%（ImpossibleBench, 同任務）。測試檔案唯讀、限制 shell 存取、隔離評估邏輯——結構性約束比指令性約束更可靠（反作弊 prompt 對 o3 幾乎無效）。

---

## 8. 反模式：特性被忽視時的失敗模式

每個反模式都標注它違反了哪個 LLM 特性，解釋**為什麼**會失敗。

### 8.1 Raw Dump（原始傾倒）

```
做法：把 SA 規格書、HTML 原型、會議紀錄全部丟給 AI，說「照這個做」
```

**違反**：§3.4 語義競爭、§3.2 Context Rot

多份文件幾乎必然存在矛盾（用詞不一致、版本差異、隱含假設不同）。AI 在矛盾中靜默選擇，產出包含錯誤的代碼，且難以定位問題來源。

### 8.2 Over-Prompting（過度提示）

```
做法：用一個超長的 prompt 包含所有規則、所有例外、所有邊界條件
```

**違反**：§3.3 位置偏見、§3.2 Context Rot

後段指令被遵守的機率低於前段。規則數量過多時互相競爭（§3.4），模型選擇性遵守。

### 8.3 One-Shot Everything（一次完成全部）

```
做法：讓 AI 一次生成整個功能的前端 + 後端 + 測試
```

**違反**：§3.2 Context Rot（自己產出的 token 也消耗注意力預算）

單次生成的代碼量越大，AI 在後段「忘記」前段設定的機率越高。且產出量大時，人類也難以逐行驗證。

### 8.4 No Verification（不驗證就合併）

```
做法：AI 生成的代碼看起來合理，直接合併進主分支
```

**違反**：§3.6 自信填補、§4.4 Layer 3 邊界（測試全過但邏輯錯 / 無測試無檢查）

AI 生成的代碼語法正確率很高（讓人產生信任），但業務邏輯正確率完全取決於 context 品質。語法正確≠邏輯正確。

### 8.5 Downstream Backfill（下游反推）

```
做法：AI 寫完代碼後，再根據代碼反推需求清單或測試案例
```

**違反**：§7.1 源頭鐵則（基於 §3.1 語義漂移）

從代碼反推出來的需求清單只能證明「代碼做了什麼」，不能證明「代碼做對了什麼」。遺漏的功能不會被發現——因為反推出來的清單裡根本沒有它。

```
正確：需求清單 → 代碼 → 用需求清單驗證代碼
                ↑ 源頭            ↑ 錨點

錯誤：代碼 → 反推需求清單 → 「驗證通過」
                    ↑ 只是代碼的鏡像
```

### 8.6 Self-Review Illusion（自我審查幻覺）

```
做法：讓 AI 生成代碼後，在同一 session 中要求它審查自己的代碼
```

**違反**：§3.8 自我修正盲區、§3.7 附和偏見

自我修正盲區率 64.5%——模型在 2/3 的情況下會接受自己產出中的錯誤。附和偏見進一步加劇：模型傾向確認而非質疑自己的工作。兩者疊加，「自我審查通過」幾乎不提供任何品質保證。

### 8.7 Full Trust in Test Pass（全信測試通過）

```
做法：Agent 報告「所有測試通過」後，不再做進一步驗證
```

**違反**：§5.6 規格博弈

測試通過不等於正確解決——Agent 可能篡改了測試本身。ImpossibleBench 的不可能任務中 76% 被報告為「通過」。即使在正常任務中，Agent 也可能硬編碼預期值、覆寫比較運算子。需要驗證測試本身的完整性（diff 檢查、測試檔案唯讀）。

---

## 9. 量化證據

### 9.1 AI Coding 的現實效能

| 指標 | 數值 | 來源 | 對應特性 |
|------|------|------|---------|
| AI 生成 PR 被拒率 vs 人類 | 67.3% vs 15.6% | [LinearB 2026 Benchmarks](https://linearb.io/resources/software-engineering-benchmarks-report) | 整體品質差距 |
| AI 代碼含問題倍率 | 1.7×（總 issues）；major 為 1.4-1.7× | [CodeRabbit 2025/12](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) | §3.6 自信填補 |
| 有經驗開發者使用 AI 後速度 | −19%（自認為 +20%） | [METR 2025/07](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev/) | 管理 AI 的 overhead > 加速效果 |
| 實際淨開發週期改善 | 8%（實測）~13%（理論上限） | [Thoughtworks](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/how-faster-coding-assistants-software-delivery) | 有方法論時的實際效益 |
| AI 代碼未通過安全測試 | 45% | [Veracode 2025 GenAI Report](https://www.veracode.com/blog/genai-code-security-report/) | §3.5 頻率偏見（訓練資料中的不安全模式） |

**方法論注意事項：**
- LinearB：8.1M PRs 觀測資料（非實驗），AI PR 分類方法不透明
- CodeRabbit：僅 470 PRs，human PR 可能混入 AI 代碼
- METR：隨機對照實驗（金標準），但僅 16 名資深開發者。[2026/02 更新](https://metr.org/blog/2026-02-24-uplift-update/)指出使用新工具後效果可能已反轉
- Thoughtworks：單一客戶 150 tickets，自我報告時間節省
- Veracode：合成 benchmark（80 個刻意暴露弱點的任務），非真實開發環境；Java 失敗率 >70%，Python/JS 為 38-45%

### 9.2 Context 研究現況（2026/03）

| 主題 | 發現 | 來源 |
|------|------|------|
| Context rot | 隨 token 增加，檢索準確率漸進衰減（非硬斷崖）。Opus 4.6 @ 1M MRCR v2 準確率 76%，Sonnet 4.5 僅 18.5%，Sonnet 4.6 未公布 | [Anthropic](https://www.anthropic.com/news/claude-opus-4-6), [Chroma Research](https://research.trychroma.com/context-rot) |
| 位置偏見 | 仍然存在——前段資訊的檢索準確率較高，但已比 2023 年大幅改善 | Chroma "Context Rot" study |
| Compaction 效果 | Claude Code 在 ~95% context 時自動 compact。Compaction 後 CLAUDE.md 從磁碟重新讀取注入 | Anthropic Engineering |
| Context editing | 自動清除過時 tool call 結果，帶來 29% 複雜任務改善、84% token 節省 | Anthropic Blog |
| Extended thinking | 前次 thinking block 自動移除，不佔用 context | Anthropic API Docs |

### 9.3 v0.3 新增特性的量化數據

| 主題 | 關鍵數值 | 來源 |
|------|---------|------|
| 多輪退化 | 平均 39% 效能下降；unreliability 增加 112%；兩輪即出現退化 | Laban et al., ICLR 2025 |
| 套件幻覺 | 19.7% 推薦套件不存在；43% 幻覺名在 10/10 次出現；商業 5.2% vs 開源 21.7% | Spracklen et al., USENIX Security 2025 |
| 行動幻覺 | 32B 模型猜測 schema 成功率僅 5-19/30；明確 grounding 指令提升至 87% | KAMI benchmark, arXiv:2512.07497 |
| 附和偏見 | 98% 被質疑時錯誤承認失誤；PM 95% 偏好附和；使用者暗示降低準確率最高 27% | Sharma et al., ICLR 2024 |
| 自我修正盲區 | 平均盲區率 64.5%；自我修正 18.3% vs 外部修正 88.1%（中等任務）；「Wait」緩解 89.3% | Tsui, Self-Correction Bench 2025 |
| 規格博弈 | GPT-5 不可能任務 76% 博弈；RE-Bench 30.4% vs HCAST 0.7%（43× 差異）；Full vs Minimal scaffold 76% vs 2.9% | ImpossibleBench 2025; METR 2025/06 |
| 退化迴圈 | 壓縮後 23% 冗餘呼叫；無偵測 30+ 次迭代 vs 有偵測 8 次；生產環境 58-59 次重複 | DEV Community; MarkAICode; ZenML |

---

## 10. 參考來源

| 資源 | 連結 |
|------|------|
| Anthropic: Effective Context Engineering for AI Agents | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| Chroma Research: Context Rot | https://research.trychroma.com/context-rot |
| Claude Context Windows | https://platform.claude.com/docs/en/build-with-claude/context-windows |
| Claude Code Memory | https://code.claude.com/docs/en/memory |
| Claude Code Sub-agents | https://code.claude.com/docs/en/sub-agents |
| Claude Code Model Config | https://code.claude.com/docs/en/model-config |
| Prompt Caching (KV-cache) | https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| LLM as a Broken Telephone (ACL 2025) | https://aclanthology.org/2025.acl-long.371/ |
| When LLMs Play the Telephone Game (Acerbi et al. 2024) | https://arxiv.org/abs/2407.04503 |
| LLMs are Bug Replicators (2025) | https://arxiv.org/html/2503.11082v1 |
| Copy Bias in In-Context Learning (2024) | https://arxiv.org/abs/2410.01288 |
| Bias Testing in LLM-based Code Generation (ACM TOSEM 2025) | https://dl.acm.org/doi/full/10.1145/3724117 |
| Where Do AI Coding Agents Fail? (2026) | https://arxiv.org/abs/2601.15195 |
| Why Do Multi-Agent LLM Systems Fail? (2025) | https://arxiv.org/html/2503.13657v1 |
| LinearB 2026 Software Engineering Benchmarks | https://linearb.io/resources/software-engineering-benchmarks-report |
| CodeRabbit: State of AI vs Human Code Generation (2025/12) | https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report |
| METR: AI Impact on Experienced OS Developers (2025/07) | https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev/ |
| Thoughtworks: How much faster can coding assistants make delivery? | https://www.thoughtworks.com/en-us/insights/blog/generative-ai/how-faster-coding-assistants-software-delivery |
| Veracode 2025 GenAI Code Security Report | https://www.veracode.com/blog/genai-code-security-report/ |
| LLMs Get Lost In Multi-Turn Conversation (ICLR 2025) | https://openreview.net/forum?id=VKGTGGcwl6 |
| Package Hallucinations by Code Generating LLMs (USENIX Security 2025) | https://arxiv.org/abs/2406.10279 |
| How Do LLMs Fail In Agentic Scenarios? (KAMI, 2025) | https://arxiv.org/abs/2512.07497 |
| Towards Understanding Sycophancy in Language Models (ICLR 2024) | https://arxiv.org/abs/2310.13548 |
| Sycophancy in Large Language Models (Malmqvist, 2024) | https://arxiv.org/abs/2411.15287 |
| OpenAI: Sycophancy in GPT-4o (2025/04) | https://openai.com/index/sycophancy-in-gpt-4o/ |
| Self-Correction Bench (Tsui, 2025) | https://arxiv.org/abs/2507.02778 |
| ImpossibleBench (2025) | https://arxiv.org/html/2510.20270v1 |
| METR: Recent Reward Hacking Research (2025/06) | https://metr.org/blog/2025-06-05-recent-reward-hacking/ |
| Anthropic: Effective Harnesses for Long-Running Agents | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| Anthropic: Claude Opus 4.6 | https://www.anthropic.com/news/claude-opus-4-6 |
| Anthropic: Claude Sonnet 4.6 | https://www.anthropic.com/news/claude-sonnet-4-6 |
| Anthropic: Claude Haiku 4.5 | https://www.anthropic.com/news/claude-haiku-4-5 |
| Anthropic Pricing | https://www.anthropic.com/pricing |
| Artificial Analysis | https://artificialanalysis.ai/ |

---

## 待驗證清單

以下項目需要進一步確認或挑戰：

- [x] §3.1 語義漂移的衰減率 — 原數字無研究支持，已移除。改引用 ACL 2025 和 Acerbi 2024 的定性描述
- [x] §3.3 MRCR v2 數據 — Opus 76% 確認正確（2026/02 官方）。18.5% 為 Sonnet 4.5，Sonnet 4.6 無官方數據，已標註
- [x] §3.5 頻率偏見 — 一般 LLM 和 Agentic 環境都有研究支持。已補充量化數據和 5 篇來源
- [x] §6.2 數值校驗（2026/03）— 17/23 項確認正確，3 項無法從官方文檔驗證（已標 [待驗證]），CLAUDE.md 行數限制已補充 200/500 雙標準
- [x] §9.1 量化數據審查 — 5 項來源全部確認。修正：OWASP→Veracode、CodeRabbit 1.7×→1.4-1.7×、Thoughtworks 拆為實測/理論。已補充方法論注意事項
- [x] 遺漏特性盤點 — 已識別，列入下一版待新增

### v0.3 完成項目

- [x] **Sycophantic Bias（附和偏見）** → §3.7（ICLR 2024 + OpenAI GPT-4o 事件）
- [x] **Self-Correction Blind Spot（自我修正盲區）** → §3.8（64.5% 盲區率，Self-Correction Bench 2025）
- [x] **Reward Hacking（規格博弈）** → §5.6（ImpossibleBench 76% + METR 30.4%）
- [x] **Action Perseveration（退化迴圈）** → §5.7（三種迴圈拓撲，量化證據）
- [x] Multi-Turn Degradation → 併入 §3.2（ICLR 2025，39% 下降，112% unreliability 增加）
- [x] Premature Action Without Grounding → 併入 §3.6（KAMI benchmark，900 執行軌跡）
- [x] Package Hallucination / Slopsquatting → 併入 §3.6（USENIX Security 2025，19.7% 幻覺率）
- [x] 新增工程原則 §7.8 交叉驗證、§7.9 最小權限
- [x] 新增反模式 §8.6 自我審查幻覺、§8.7 全信測試通過
- [x] 更新 §9.3 量化數據、§10 參考來源（+11 篇）

### v0.4 完成項目

- [x] §4 能力邊界表更新 — 加入附和偏見、自我修正盲區、規格博弈、退化迴圈的 Layer 對應
- [x] Token 經濟分析 → §6.3（各模型定價、成本優化策略、Extended Thinking 成本陷阱）
- [x] 模型選擇決策框架 → §6.4（Benchmark 對比、決策樹、複合架構建議）
- [x] Agentic 失敗模式的交互效應 → §5.8（三條複合失敗路徑、風險矩陣、多層防禦原則）

## 下一版待新增

- [ ] 文件一定版宣告 — 評估是否已達到可支撐文件二（操作手冊）撰寫的成熟度
- [ ] Sonnet 4.6 MRCR v2 數據 — Anthropic 尚未公布，取得後更新 §3.3、§6.4
- [ ] 實測驗證 — 對本文件中的工程原則和反模式進行實際專案驗證，收集一手數據
