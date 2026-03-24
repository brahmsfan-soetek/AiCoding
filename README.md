# Agentic Coding 方法論

以 LLM 行為特性實證研究為基礎的 AI Coding 開發框架。

## 文件體系

```
01（研究基礎）：LLM 行為特性，11 項風險 + 量化證據
  ↓ 推導出
serp-agentic-coding（SKILL）：完整開發流程 Phase 0-3

02, 03（參考文獻）：Skill / Harness 設計原則
  ↓ 審視
review/（審查報告）：SKILL 審視與修正追蹤
```

| 文件 | 說明 |
|------|------|
| `01_LLM_行為特性研究彙整.md` | 純研究知識：11 項 LLM 行為特性 + 量化證據 |
| `01_摘要.md` | 01 的萃取摘要，供 SKILL 推導用 |
| `02_Skill設計原則_Thariq_Anthropic.md` | 9 類 Skill 分類 + 9 項設計原則（Anthropic 內部實踐） |
| `03_Harness_Engineering_HumanLayer.md` | 7 項 Harness Engineering 原則 + 反模式 |
| `serp-agentic-coding/` | Claude SKILL — 規格衝突檢查 → 任務拆解 → 測試先行 → 實作 → 交叉驗證 |
| `review/` | 審查報告（SR1: SKILL 審視 2 嚴重 + 4 中等 + 4 輕微） |

## 核心觀點

- **AI 做執行，人做判斷** — LLM 判斷能力有明確邊界，超出則退化為訓練資料頻率的猜測
- **傳達偏差** — 每次 LLM 處理都是有損轉換；每次 session 從源頭文件載入，不基於上次產出
- **信噪比 > 總量** — 精準的少量 context 優於含噪訊的大量 context
- **回饋迴路決定自主上限** — 測試、lint、型別檢查提供 pass/fail 信號；沒有硬規則 LLM 無從判斷對錯

## 設計決策

- **研究 → SKILL 直接推導**：01 → serp-agentic-coding，不設中間層（減少語義漂移，01 §1）
- **SKILL 格式**：供 Claude 直接讀取執行，不是給人看的手冊
- **每條規則追溯 01**：所有工程原則都有實證研究支撐，不是經驗談
- **參考文獻獨立**：02, 03 為外部 Skill/Harness 設計指引，用於審視 SKILL 設計品質
