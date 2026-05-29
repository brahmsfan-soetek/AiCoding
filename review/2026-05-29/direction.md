# 2026-05-29 — Skills 三方哲學對抗審查｜審查框架（direction）

> 本檔是本輪審查的共同錨點。所有對抗 agent 動手前先讀此檔，建立全局框架。
> 審查對象：`soetek-agentic-coding-skills`（通用型主線 + 特化存廢評估）
> 方法：三方哲學對抗（研究辯護 / 實戰質疑 / 極簡審查）+ 裁決 + 完整性批判

---

## 一、三大產出目標

| 代號 | 目標 | 說明 |
|---|---|---|
| **G1** | 驗證「研究 → 規則」推導鏈 | 逐條查 SKILL 規則能否追溯到 `01` 的具體研究條目（兌現 README「非經驗談」宣稱）；反向揪 11 項風險中**沒防到的缺口** |
| **G2** | 可排入實作的缺陷與改進清單 | 對齊 `05_架構審視清單.md` 格式，產帶優先級、可直接動手的修正項 |
| **G3** | 路線決策 | 特化型 eap/lite/serp 各自 刪／留／降級為參考；整套防禦**是否過度工程**；下一個該拔的是什麼 |

## 二、審查標的

**主線（活躍）：**
- `skills/spec-p1-digest-flow/SKILL.md`
- `skills/spec-p2-tasking/SKILL.md`
- `skills/spec-p3-backend/SKILL.md`
- `skills/spec-p3-frontend/SKILL.md`
- `skills/spec-p3-data/SKILL.md`
- 共用規約 `spec-workflow-refs/p3/`（README / scope-statement / commit-rules / subagent-boundary / completion-and-handoff / progress-and-session-log / session-archive / commit-hook）

**特化存廢評估：**
- `skills/eap-agentic-coding/SKILL.md`（v1.7，5796 行）
- `skills/eap-agentic-coding-lite/SKILL.md`（v2.0，4871 行）
- `skills/serp-agentic-coding/SKILL.md`（v1.2，2182 行）

**架構脈絡（全方共讀）：** `04_通用型SKILL架構設計.md`（D1-D25 決策史）、`05_架構審視清單.md`（A/B/C/D 既有清單 + 狀態標記）、`README.md`

## 三、三方陣營

| 陣營 | 立場 | 武器（先精讀） | 主攻 |
|---|---|---|---|
| **研究辯護方** | 規則都該有研究撐腰，防禦必要 | `01_LLM_行為特性研究彙整.md` + `01_摘要.md`（11 風險 + 交叉矩陣） | G1：推導鏈追溯 + 風險缺口 |
| **實戰質疑方** | 理論在實戰是摩擦、ROI 低就該砍 | `review/2026-04-09/`（problems/insights/logs：AR003/ar002/so0062）+ `review/2026-03-23/`（5 份交叉審查）+ `05` 的 DISCUSS/HOLD + `lessons_learned.md` | G2：實戰失效缺陷 |
| **極簡審查方** | 少即是多，防禦恐退化成 railroading | `03_Harness_Engineering_HumanLayer.md`（7 原則 + 反模式）+ `02_Skill設計原則_Thariq_Anthropic.md`（9 原則 + 反模式） | G3：過度工程判定 |
| **裁決方** | 中立綜合 | 全部 + `05` 格式 | 產 G1/G2/G3 三份定稿 |
| **完整性批判方** | 挑裁決的毛病，不附和 | 全部 | 揪遺漏 + 挑戰過寬裁決 |

## 四、對抗流程（回合制）

```
R1 獨立立場   三方並行各掃全標的 → 立場報告（charges 清單）｜互不可見，防 §7 附和偏見
R2 交叉反駁   每方讀另兩方 R1，逐條 refute/agree/qualify ← 對抗核心交鋒
R3 裁決綜合   裁決方讀全部 R1+R2 → 產 G1/G2/G3 三份定稿（被駁倒的不收）
R4 完整性批判 critic 查漏 + 挑戰過寬裁決 → 決定 complete / needs_more
```

## 五、評斷依據（三份地基 + 既有清單）

- `01` LLM 行為 11 風險：①語義漂移 ②Context Rot ③位置偏見 ④語義競爭 ⑤模式複製 ⑥自信填補 ⑦附和偏見 ⑧自我修正盲區 ⑨規格博弈 ⑩指令飽和 ⑪複雜度天花板
- `02` Thariq 9 原則（不說顯而易見 / Gotchas / 漸進揭露 / 避免 railroading / description 是觸發器 / 單一類別…）
- `03` Harness 7 原則（CLAUDE.md 簡潔 / 工具非知識 / sub-agent 是 context 防火牆 / 對長 context 懷疑 / hooks 確定性 / back-pressure context-efficient / 從簡單開始丟掉沒用的）
- `05` 既有審視清單 A/B/C/D 與 DISCUSS/HOLD 未定案項

## 六、產出位置

`review/2026-05-29/` — direction(本檔) + R1 立場 + R2 反駁 + R3 裁決 + R4 批判 + README 導讀
