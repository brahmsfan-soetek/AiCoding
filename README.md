# soetek-agentic-coding-skills

以 LLM 行為特性實證研究為基礎的 Claude Code Skills 集合。
結構性防禦優於指令性約束 — 每條規則都有量化研究支撐。

## 安裝

在 Claude Code 中加入此 repo 作為 plugin source：

```
Plugin URL: https://github.com/soetek/soetek-agentic-coding-skills
```

加入後即可在 skill 清單中看到所有可用的 skills，選擇性安裝。

## Skill Catalog

| Skill | 狀態 | 適用場景 | 說明 |
|-------|------|---------|------|
| [eap-agentic-coding](skills/eap-agentic-coding/) | **實測中** | eap 專案（Quarkus + Vue 3 + MSSQL） | 規格驅動開發：多源規格交叉比對 → 任務拆解 → test-first → agent 分離實作 → 交叉驗證 |
| [eap-agentic-coding-lite](skills/eap-agentic-coding-lite/) | **實測中** | eap 專案（Demo 用） | 規格驅動開發：同一 session 連續執行 P0→P1→P2，模板驅動實作 |
| [spec-digest-flow](skills/spec-digest-flow/) | **v1.0.0** | 通用（SA 規格書消化） | PG 接到 SA 規格書後的標準流程：規格統計 → 釐清清單 → SA 回覆整合 → 任務清單，含 Prompt 模板與輸出模板 |
| [serp-agentic-coding](skills/serp-agentic-coding/) | 暫停 | serp 專案 | 原型骨架，待 eap 實測結論回饋後迭代 |

---

### eap-agentic-coding

```mermaid
graph TD
    subgraph INPUT[多源規格輸入]
        direction LR
        S1(規格書) ~~~ S2(HTML 畫面) ~~~ S3(DDL) ~~~ S4(邏輯文件)
    end

    INPUT --> CROSS[四源交叉比對]
    CROSS --> SPLIT[拆為小於 50 行任務]
    SPLIT --> TEST[Test Agent — 寫測試]
    TEST --> CODE[Code Agent — 實作]
    CODE --> REVIEW[Review Agent — 交叉驗證]

    style INPUT fill:none,stroke:#90a4ae
    style CROSS fill:none,stroke:#64b5f6
    style SPLIT fill:none,stroke:#64b5f6
    style TEST fill:none,stroke:#81c784
    style CODE fill:none,stroke:#81c784
    style REVIEW fill:none,stroke:#b39ddb
```

---

### eap-agentic-coding-lite

```mermaid
graph TD
    P0[P0 規格消化] --> P1[P1 任務拆解]
    P1 --> P2[P2 模板驅動實作]

    P2 --> BE & FE

    subgraph BE[後端]
        direction LR
        E(Entity) --> CR(Create) --> UP(Update) --> DE(Delete)
        DE --> QU(Query) --> GB(GetById) --> MV(mvn compile)
    end

    subgraph FE[前端]
        direction LR
        TY(Types) --> SV(Service) --> ST(Store) --> RT(Router)
        RT --> PG(主頁面) --> DL(各 Dialog) --> I18(i18n) --> VT(vue-tsc)
    end

    style P0 fill:none,stroke:#90a4ae
    style P1 fill:none,stroke:#64b5f6
    style P2 fill:none,stroke:#b39ddb
    style BE fill:none,stroke:#81c784
    style FE fill:none,stroke:#64b5f6
```

---

### spec-digest-flow

```mermaid
graph TD
    subgraph PARSE[規格解析]
        S1["Step 1 · AI — 規格統計"]
    end

    subgraph CLARIFY[釐清對齊]
        S2["Step 2 · AI — 釐清清單"]
        S3["Step 3 · PG — 篩選回覆 + 問 SA"]
        S4["Step 4 · AI — 整合 + 二次審查"]
        S2 --> S3 --> S4
        S4 -. 有新問題 .-> S3
    end

    subgraph TASK[任務拆解]
        S5["Step 5 · AI — 前端 + 後端 + 測試清單"]
    end

    subgraph IMPL[實作]
        direction LR
        S6["Step 6 · AI — 前端"] --> S7["Step 7 · PG — 前端測試"]
        S8["Step 8 · AI — 後端"] --> S9["Step 9 · PG — 後端測試"]
    end

    S10["Step 10 · AI — 前後對接"]

    PARSE --> CLARIFY --> TASK --> IMPL --> S10

    style PARSE fill:none,stroke:#64b5f6
    style CLARIFY fill:none,stroke:#ffa726
    style TASK fill:none,stroke:#81c784
    style IMPL fill:none,stroke:#b39ddb
    style S10 fill:none,stroke:#ef5350
```

---

### serp-agentic-coding

```mermaid
graph TD
    P0["Phase 0 — 規格衝突檢查"]
    P1["Phase 1 — Test Agent — 任務拆解 + 寫測試"]
    P2["Phase 2 — Code Agent — 逐任務實作"]
    P3["Phase 3 — Review Agent — 交叉驗證"]

    P0 --> P1 --> P2 --> P3

    style P0 fill:none,stroke:#64b5f6
    style P1 fill:none,stroke:#81c784
    style P2 fill:none,stroke:#ffa726
    style P3 fill:none,stroke:#b39ddb
```

## 相關 Skill 專案

| 專案 | 說明 |
|------|------|
| [TouchFish-DevTeam](https://github.com/agony1997/TouchFish-DevTeam) | 多角色 Agent 團隊協作 — TL (Opus) 指揮 Workers (Sonnet) 並行開發，分離測試 + 三方交叉驗證 QA |
| [TouchFish-Skills](https://github.com/agony1997/TouchFish-Skills) | 4 個專案基礎設施插件 — DDD 分析模板、Git 全方位專家、專案規範審查、專案探索者 |

### TouchFish-DevTeam

```mermaid
graph TD
    P0["Phase 0 — 專案理解 + 任務規劃"] --> P1["Phase 1 — API 契約"]
    P1 --> P2["Phase 2 — 開發執行"]
    P2 --> P3["Phase 3 — 全域審查"]
    P3 --> P4["Phase 4 — 交付"]

    subgraph P2SUB[Phase 2 — 每個 Task 循環]
        direction LR
        TA["test-agent (Opus) — 寫測試"] --> WK["worker (Sonnet) — 實作"] --> QA["qa-task (Opus) — 三方驗證"]
    end

    P2 --> P2SUB

    style P0 fill:none,stroke:#64b5f6
    style P1 fill:none,stroke:#64b5f6
    style P2 fill:none,stroke:#81c784
    style P3 fill:none,stroke:#ffa726
    style P4 fill:none,stroke:#b39ddb
    style P2SUB fill:none,stroke:#81c784
```

## 研究基礎

這些 skills 的設計規則追溯至以下實證研究，非經驗談：

| 文件 | 內容 |
|------|------|
| [01 LLM 行為特性研究彙整](01_LLM_行為特性研究彙整.md) | 11 項 LLM 行為風險 + 量化證據（語義漂移、Context Rot、模式複製、規格博弈等） |
| [01 摘要](01_摘要.md) | 上述研究的萃取摘要 |
| [02 Skill 設計原則](02_Skill設計原則_Thariq_Anthropic.md) | Anthropic 工程師 Thariq 的 9 項 Skill 設計原則 |
| [03 Harness Engineering](03_Harness_Engineering_HumanLayer.md) | HumanLayer 的 7 項 Harness Engineering 原則 + 反模式 |
| [review/](review/) | Skills 的多輪交叉審查報告 |

## 設計原則

- **AI 做執行，人做判斷** — 每個 Phase 有明確的人類決策點（STOP Gate）
- **信噪比 > 總量** — conventions 和 templates 按需載入，不一次全灌
- **回饋迴路決定自主上限** — 測試、lint、型別檢查提供 pass/fail 信號
- **研究 → Skill 直接推導** — 不設中間抽象層，減少語義漂移
