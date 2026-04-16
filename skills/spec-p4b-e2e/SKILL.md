---
name: spec-p4b-e2e
description: Playwright 自動化 E2E 測試 SKILL：讀 P2 的 test_cases.md + 專案 CLAUDE.md E2E 規範，產 Playwright spec + 自我修復（安全類別自動修、禁止類別 STOP）+ 三層防護。觸發於 /e2e 或提到 E2E、Playwright、端對端測試等關鍵字。
---

# Spec E2E — Playwright 自動化驗證

在專案 repo 目錄下執行，根據 P2 產出的 `test_cases.md` 與專案 `CLAUDE.md` E2E 規範，產出 Playwright spec 並執行自動化驗證，含自我修復機制與三層防護。

## 定位

- **輸入：** `{程式編號}_規格統計_最終版.md` + `{程式編號}_test_cases.md` + `CLAUDE.md` E2E 規範
- **輸出：** Playwright spec + 補充 UAT 項 + 彙總報告（含自動修 spec 記錄）
- **關鍵：** 新 session，SKILL 不指定框架（讀 `CLAUDE.md`），含自我修復

## 觸發方式

- `/e2e` — 顯示流程說明並開始
- `/e2e <程式編號>` — 直接帶入程式編號

## 前置條件

1. 已完成 P2 `spec-p2-tasking`，產出 `{程式編號}_test_cases.md`
2. 已完成 P3 `spec-p3-implementing`，實作程式碼已就緒可測試
3. 專案 `CLAUDE.md` 索引有指向 E2E 規範（框架設定、執行流程、測試目錄結構）
4. **另起新 session** — 不在 P3 session 中繼續（獨立裁判原則）

## 設計原則

1. **獨立裁判** — P4b 是獨立 session，不受 P3 的 context 影響。
2. **SKILL 不指定框架** — E2E 框架設定讀 `CLAUDE.md`，非寫死在 SKILL 中。
3. **P4b 只能修自己產的 Playwright spec** — **絕不能碰 P3 產的實作 code，也不能改 P2 產的 test_cases.md**。否則失去「獨立裁判」身份。

## Execution Flow

```
/e2e [程式編號]
         ↓
[AI]  讀 {程式編號}_規格統計_最終版.md
      + {程式編號}_test_cases.md
      + CLAUDE.md E2E 規範（框架、執行指令、目錄結構）
         ↓
[AI]  產 Playwright spec：
      - 將 test_cases.md 適合自動化的 case 轉為 Playwright spec
      - 列出不適合自動化的 case（交由 P4a 人工 UAT）
[STOP] PG 確認 spec + 不適合自動化的 case 清單
         ↓
[AI]  跑 Playwright → 分析失敗 case
         ↓
    ┌─ 安全類別（可自動修）
    │   → git commit 原版 → 自動修 spec → git commit 新版 → 重跑
    │  （單 case 上限 3 次）
    │
    ├─ 禁止類別（不可自動修）
    │   → [STOP] 回報 PG，不自動改
    │
    └─ 判斷不清
        → [STOP] 回報 PG，由 PG 決定
         ↓
[STOP] PG 看結果 + 跑補充 UAT（不適合自動化的 case）
         ↓
[AI]  彙總報告（含自動修 spec 記錄明細）
```

### 詳細步驟

1. **Determine `<skill-dir>`**（此檔所在目錄）。
2. **確認當前工作目錄為專案 repo**。
3. **讀取輸入材料與 context：**
   - `{程式編號}_規格統計_最終版.md`
   - `{程式編號}_test_cases.md`
   - `CLAUDE.md` 索引 → 讀取 E2E 規範文件（框架設定、執行指令、目錄結構、page object 慣例）
4. **產出 Playwright spec：**
   - 逐一讀取 test_cases.md 的測試案例
   - 判斷每個 case 是否適合自動化：
     - 適合：轉為 Playwright spec（利用「執行步驟」欄位，已結構化到能轉 spec）
     - 不適合：加入「補充 UAT 清單」（如：需要外部系統操作、視覺驗證等）
   - Playwright spec 檔案路徑依 `CLAUDE.md` E2E 規範
5. **[STOP] 確認 spec** — PG 審閱：
   - Playwright spec 內容
   - 不適合自動化的 case 清單（建議轉 P4a 人工 UAT）
6. **執行 Playwright + 自我修復迴圈：**
   - 跑 Playwright
   - 分析每個失敗 case，依分類表判斷：

     | 允許自動修（安全類別） | 禁止自動修 |
     |----------------------|----------|
     | Selector syntax / element not found | 斷言值（expect values）|
     | Timing race / 需要 wait | 業務流程順序 |
     | Playwright API 誤用 | 測試邏輯 |
     | 型別錯誤 | 測試案例的前置條件 |

   - **安全類別：**
     1. `git commit` 原版 spec（留痕）
     2. 自動修正 spec
     3. `git commit` 修正版 spec（留痕）
     4. 重跑 Playwright
     5. 單 case 上限 3 次自動修，超過則歸類為「自動修失敗」，STOP 回報 PG，列入彙總報告「失敗項目明細」。
        PG 可選擇：手動修 spec / 轉為 P4a 人工驗證 / 標記為已知問題跳過。
   - **禁止類別：** 不自動修，直接 STOP 回報 PG
   - **判斷不清：** 不自動修，直接 STOP 回報 PG
7. **[STOP] 最終審閱** — PG 看結果 + 執行補充 UAT（不適合自動化的 case）。
8. **彙總報告：**（格式見下方）
9. **Session 歸檔**（見下方「Session 歸檔」區塊）

   ```markdown
   # {程式編號} {功能名稱} — E2E 測試報告

   > 日期：{YYYY-MM-DD}

   ## 測試結果

   | 項目 | 數量 |
   |------|------|
   | 自動化 case 總數 | |
   | 通過 | |
   | 失敗（修復後通過） | |
   | 失敗（未修復） | |
   | 不適合自動化（轉 UAT） | |

   ## 自動修 spec 記錄

   | # | Case | 修復類別 | 修復內容 | 修復次數 | 結果 |
   |---|------|---------|---------|:-------:|------|
   | 1 | {case} | {安全類別} | {描述} | {N} | 通過/仍失敗 |

   ## 失敗項目明細

   （禁止自動修 + 判斷不清的 case）

   ## 補充 UAT 項目

   （不適合自動化的 case，建議以 P4a 人工執行）

   ## 建議

   （由 AI 根據結果產出）

   ## 系統性回饋（供 P2 演進）

   | 回饋對象 | 類型 | 描述 |
   |---------|------|------|
   | {P2 test_cases / P2 frontend_tasks / P3 實作} | {遺漏 / 粒度 / 品質} | {具體描述} |

   <!-- 此區塊記錄 P4 驗收中發現的系統性問題（非個案 bug），留在專案內作為紀錄。
        SKILL 維護者定期從各專案蒐集此區塊，回到 AiCoding 專案集中審視並更新 SKILL。 -->
   ```

## 三層防護機制（應對 PG 偷懶風險）

1. **限制自動修範圍** — 斷言值一律不自動修。即使 PG 沒仔細看，溜過去的也只是無害的技術性修正（selector / timing / API 誤用）。
2. **git 留痕** — 每次自動修前後都 commit，事後可 `git log` 追溯全部修改。
3. **彙總報告明列** — 所有自動修記錄列在報告中，PG 一眼可見。

## Session 歸檔

彙總報告完成後（步驟 9），將當前 session 完整紀錄複製到集中目錄，供 SKILL 維護者日後審視。

### 歸檔流程

1. **決定專案名稱：** 取 git remote origin 的 repo 名（如 `serp-struct-frontend`）；若無 remote 則取當前目錄名。
2. **決定檔名：** `{程式編號}-P4b-e2e_{yyyyMMdd}_{HHmm}`（時間取當下）。
3. **定位當前 session 檔案：** 掃描 `~/.claude/projects/{當前專案路徑的 Claude 編碼}/` 下最近修改的 `.jsonl` 檔。
4. **建立目標目錄：** `~/.soetek-ai-coding/{專案名}/`（若不存在則建立）。
5. **複製檔案：**
   - `{uuid}.jsonl` → `~/.soetek-ai-coding/{專案名}/{檔名}.jsonl`
   - `{uuid}/subagents/*` → `~/.soetek-ai-coding/{專案名}/{檔名}/subagents/`（若有）
6. **產出結構化摘要：** `~/.soetek-ai-coding/{專案名}/{檔名}.summary.md`

### 摘要格式

```markdown
# Session Log — {程式編號} P4b E2E

> 日期：{YYYY-MM-DD HH:mm}
> 專案：{專案名}
> SKILL：spec-p4b-e2e v1.0.0
> 原始 Session：~/.claude/projects/{path}/{uuid}.jsonl

## E2E 結果摘要
| 項目 | 數量 |
|------|------|
| 自動化 case / 通過 / 修復後通過 / 未修復 / 轉 UAT | |

## 自動修 spec 記錄摘要
- {修了幾次、哪些類別}

## 關鍵決策
- {session 中做出的重要選擇和理由}

## 問題與教訓
- {遇到的問題、workaround、值得注意的現象}

## 系統性回饋（供進化機制）
- {與彙總報告的「系統性回饋」同步}
```

## 核心原則

1. **只修自己的 spec** — P4b 只能修自己產的 Playwright spec，**絕不碰 P3 實作 code、不改 P2 test_cases.md**。
2. **讀 CLAUDE.md、不寫死框架** — E2E 框架設定讀專案規範，SKILL 不綁定特定框架。
3. **獨立 session** — 不在 P3 session 中繼續，保持獨立觀點。
4. **安全類別才自動修** — 斷言值 / 業務邏輯 / 測試邏輯一律 STOP 回報 PG。
