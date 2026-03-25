# Agentic Coding 方法論

以 LLM 行為特性實證研究為基礎的 AI Coding 開發框架。

## 目前狀態

| SKILL | 狀態 | 說明 |
|-------|------|------|
| `eap-agentic-coding/` | **實測中** | eap 專案實測，優先推進 |
| `serp-agentic-coding/` | 暫停 | 原型骨架，待 eap 實測結論回饋後再迭代 |

## 文件體系

```
01（研究基礎）：LLM 行為特性，11 項風險 + 量化證據
  ↓ 推導出
eap-agentic-coding（SKILL）：eap 專案實測版 Phase 0-3  ← 目前進行中
serp-agentic-coding（SKILL）：原型骨架（暫停）

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
| `eap-agentic-coding/` | Claude SKILL — eap 專案實測版（[使用方法](eap-agentic-coding/README.md)） |
| `serp-agentic-coding/` | Claude SKILL — 原型骨架（暫停，待 eap 實測回饋） |
| `review/` | 審查報告（含多輪交叉審查） |

## 核心觀點

- **AI 做執行，人做判斷** — LLM 判斷能力有明確邊界，超出則退化為訓練資料頻率的猜測
- **傳達偏差** — 每次 LLM 處理都是有損轉換；每次 session 從源頭文件載入，不基於上次產出
- **信噪比 > 總量** — 精準的少量 context 優於含噪訊的大量 context
- **回饋迴路決定自主上限** — 測試、lint、型別檢查提供 pass/fail 信號；沒有硬規則 LLM 無從判斷對錯

## 設計決策

- **研究 → SKILL 直接推導**：01 → SKILL，不設中間層（減少語義漂移，01 §1）
- **eap 優先實測**：先在真實專案驗證流程，再回饋修正 SKILL 設計
- **SKILL 格式**：供 Claude 直接讀取執行，README 給人看
- **每條規則追溯 01**：所有工程原則都有實證研究支撐，不是經驗談
- **參考文獻獨立**：02, 03 為外部 Skill/Harness 設計指引，用於審視 SKILL 設計品質
