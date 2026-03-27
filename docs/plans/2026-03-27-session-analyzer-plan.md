# Session Analyzer Skill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `session-analyzer` skill that analyzes Claude Code session token usage, timing, and sub-agent details.

**Architecture:** SKILL.md defines trigger/params, delegates all parsing to `scripts/analyze.mjs`. The script reads JSONL files from `~/.claude/projects/<encoded-cwd>/`, aggregates token/timing data for main + sub-agents, outputs markdown to stdout.

**Tech Stack:** Node.js (ESM), readline for streaming JSONL, fs/path for file discovery.

---

## Data Structure Reference

### Session Data Locations

```
~/.claude/sessions/{pid}.json
  → { pid, sessionId, cwd, startedAt, kind, entrypoint }

~/.claude/projects/{encoded-cwd}/{sessionId}.jsonl
  → main conversation (types: file-history-snapshot, user, assistant, progress, system)

~/.claude/projects/{encoded-cwd}/{sessionId}/subagents/{agentId}.jsonl
  → sub-agent conversation (same entry format)

~/.claude/projects/{encoded-cwd}/{sessionId}/subagents/{agentId}.meta.json
  → { agentType, description }
```

### JSONL Entry Format (assistant type with usage)

```json
{
  "type": "assistant",
  "message": {
    "model": "claude-opus-4-6",
    "role": "assistant",
    "content": [{ "type": "tool_use", "name": "Read", "input": {...} }, ...],
    "usage": {
      "input_tokens": 3,
      "output_tokens": 111,
      "cache_creation_input_tokens": 8514,
      "cache_read_input_tokens": 0
    }
  },
  "timestamp": "2026-03-23T07:29:04.980Z",
  "version": "2.1.81",
  "sessionId": "02314245-..."
}
```

### Encoded CWD Pattern

`C:\Users\a0304\OneDrive\Desktop\AiCoding` → `C--Users-a0304-OneDrive-Desktop-AiCoding`

Rule: replace `:` with nothing, replace `\` and `/` with `-`.

### Current Session Detection

No env var available. Strategy: sort `*.jsonl` by mtime descending, pick first.

---

## Task 1: Scaffold plugin directory + plugin.json

**Files:**
- Create: `session-analyzer/.claude-plugin/plugin.json`

**Step 1: Create plugin.json**

```json
{
  "name": "session-analyzer",
  "version": "1.0.0",
  "description": "分析 Claude Code session 的 token 用量、時間、sub-agent 明細",
  "author": { "name": "soetek" },
  "skills": ["./"]
}
```

**Step 2: Register in marketplace.json**

Modify: `.claude-plugin/marketplace.json`

Add to `plugins` array:

```json
{
  "name": "session-analyzer",
  "source": "./session-analyzer",
  "description": "分析 Claude Code session 的 token 用量、時間、sub-agent 明細",
  "version": "1.0.0"
}
```

**Step 3: Verify**

Run: `cat .claude-plugin/marketplace.json | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).plugins.length))"`
Expected: `3`

---

## Task 2: Write SKILL.md

**Files:**
- Create: `session-analyzer/SKILL.md`

**Step 1: Write SKILL.md**

```markdown
---
name: session-analyzer
description: Use when the user wants to analyze a Claude Code session's token usage, timing, sub-agent details, or tool usage statistics. Triggers on /session-analyzer or mentions of session analysis, token stats, session report.
---

# Session Analyzer

Analyze Claude Code session token usage, timing, and sub-agent details.

## Parameters

| Input | Mapped CLI | Description |
|-------|-----------|-------------|
| `/session-analyzer` | `--session=current` | Analyze current session (summary) |
| `/session-analyzer -d` | `--session=current --detail` | Current session (full detail) |
| `/session-analyzer -list` | `--list` | List recent sessions to choose |
| `/session-analyzer -list -d` | `--list` then `--session=<uuid> --detail` | Choose + full detail |

## Execution Flow

1. Determine the skill's base directory (this file's location).
2. Parse user arguments from the slash command input.
3. Map arguments to CLI flags:
   - No args or just `-d` → `--session=current`
   - `-list` present → `--list` first, then ask user to pick
   - `-d` present → append `--detail`
4. Run: `node <skill-base-dir>/scripts/analyze.mjs <flags> --cwd=<process.cwd()>`
5. Present stdout output directly to the user as-is (it is already formatted markdown).
6. For `-list` mode:
   a. Run with `--list` → script outputs numbered session list
   b. Ask user which number they want
   c. Run again with `--session=<selected-uuid>` [--detail]

## Important

- Do NOT attempt to parse JSONL files yourself. Always delegate to the script.
- Output the script's stdout verbatim. Do not summarize or reformat.
- If the script exits with non-zero, show the stderr to the user.
```

---

## Task 3: Write analyze.mjs — CLI argument parsing + session discovery

**Files:**
- Create: `session-analyzer/scripts/analyze.mjs`

**Step 1: Write the argument parser and session discovery module**

This step creates the file with:
- CLI arg parsing (`--session`, `--list`, `--detail`, `--cwd`)
- `encodeCwd(cwd)` function: replaces `:\` with `-`, `/` with `-`
- `findProjectDir(cwd)` → resolves `~/.claude/projects/<encoded-cwd>/`
- `listSessions(projectDir)` → scans `*.jsonl`, returns array sorted by mtime desc with `{ uuid, mtime, size }`
- `findCurrentSession(projectDir)` → returns most recent `.jsonl` by mtime
- `--list` mode: prints numbered list and exits

```javascript
#!/usr/bin/env node
import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, homedir } from 'path';
import os from 'os';

// ── CLI Args ──

const args = process.argv.slice(2);
const flags = {
  session: 'current',
  list: false,
  detail: false,
  cwd: process.cwd(),
};

for (const arg of args) {
  if (arg === '--list') flags.list = true;
  else if (arg === '--detail') flags.detail = true;
  else if (arg.startsWith('--session=')) flags.session = arg.slice('--session='.length);
  else if (arg.startsWith('--cwd=')) flags.cwd = arg.slice('--cwd='.length);
}

// ── Path Helpers ──

function encodeCwd(cwd) {
  return cwd.replace(/:/g, '').replace(/[\\/]/g, '-');
}

function getProjectDir(cwd) {
  const home = os.homedir();
  const dir = join(home, '.claude', 'projects', encodeCwd(cwd));
  if (!existsSync(dir)) {
    console.error(`Error: Project dir not found: ${dir}`);
    process.exit(1);
  }
  return dir;
}

function listSessions(projectDir) {
  const files = readdirSync(projectDir)
    .filter(f => f.endsWith('.jsonl') && !f.startsWith('.'))
    .map(f => {
      const fp = join(projectDir, f);
      const st = statSync(fp);
      return {
        uuid: basename(f, '.jsonl'),
        mtime: st.mtimeMs,
        size: st.size,
        path: fp,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return files;
}
```

**Step 2: Verify file runs**

Run: `node session-analyzer/scripts/analyze.mjs --list --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding"`
Expected: prints session list or scaffolding message

---

## Task 4: Write analyze.mjs — JSONL parser + token aggregation

**Files:**
- Modify: `session-analyzer/scripts/analyze.mjs`

**Step 1: Add JSONL streaming parser**

```javascript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function parseJsonl(filePath) {
  const entries = [];
  const rl = createInterface({ input: createReadStream(filePath) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try { entries.push(JSON.parse(line)); }
    catch { /* skip malformed lines */ }
  }
  return entries;
}
```

**Step 2: Add conversation analyzer**

Function `analyzeConversation(entries)` returns:

```javascript
{
  model: string,
  version: string,
  startTs: string,       // first timestamp
  endTs: string,         // last timestamp
  turns: [{              // only assistant entries with usage
    time: string,
    input_tokens, output_tokens,
    cache_creation_input_tokens, cache_read_input_tokens,
    total,
    tools: [{ name, input_summary }],
  }],
  totals: { input, output, cacheCreate, cacheRead, grand },
  toolCounts: { Read: N, Edit: N, ... },
  agentCalls: [{ time, description, subagentType, model }],
}
```

Key logic:
- Skip entries where `type !== 'assistant'`
- Skip entries where `message.usage` is missing or all zeros
- For each assistant entry, extract `message.content` tool_use blocks for tool counting
- Detect Agent tool_use to record agent dispatches

**Step 3: Verify with test**

Run: `node session-analyzer/scripts/analyze.mjs --session=02314245-e7a7-4cca-88e8-688d4d0a0c7a --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding" 2>&1 | head -5`
Expected: starts printing session analysis header

---

## Task 5: Write analyze.mjs — sub-agent discovery + analysis

**Files:**
- Modify: `session-analyzer/scripts/analyze.mjs`

**Step 1: Add sub-agent discovery**

```javascript
function discoverSubagents(projectDir, sessionId) {
  const subDir = join(projectDir, sessionId, 'subagents');
  if (!existsSync(subDir)) return [];
  const agents = [];
  for (const f of readdirSync(subDir)) {
    if (!f.endsWith('.jsonl')) continue;
    const agentId = basename(f, '.jsonl');
    const metaPath = join(subDir, `${agentId}.meta.json`);
    let meta = {};
    if (existsSync(metaPath)) {
      try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); } catch {}
    }
    agents.push({
      agentId,
      jsonlPath: join(subDir, f),
      agentType: meta.agentType || 'unknown',
      description: meta.description || agentId,
    });
  }
  // Sort by first timestamp in each JSONL (chronological)
  return agents;
}
```

**Step 2: Integrate into main flow**

After analyzing main conversation, iterate sub-agents:
- Parse each sub-agent JSONL with `analyzeConversation()`
- Attach metadata (agentType, description) from `.meta.json`
- Sort sub-agents chronologically by `startTs`

---

## Task 6: Write analyze.mjs — summary output formatter

**Files:**
- Modify: `session-analyzer/scripts/analyze.mjs`

**Step 1: Write `formatSummary(mainAnalysis, subAgentAnalyses)` function**

Outputs markdown to stdout with these sections:
1. **Session header** — ID, model, version, start, end, wall-clock `[估算]`
2. **Token Summary table** — Main + each sub-agent + TOTAL row, with percentage column `[計算]`
3. **Sub-Agent Overview table** — #, time, description, type, turns, duration `[估算]`, output tokens
4. **Tool Usage table** — tool name, count (aggregated across main + all sub-agents)

See design doc `docs/plans/2026-03-27-session-analyzer-design.md` for exact format.

**Step 2: Add annotation helpers**

```javascript
function wallClock(startTs, endTs) {
  const ms = new Date(endTs) - new Date(startTs);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s  [估算] 首末訊息時間差`;
}

function pct(part, total) {
  if (total === 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%  [計算]`;
}
```

**Step 3: Verify summary mode**

Run: `node session-analyzer/scripts/analyze.mjs --session=02314245-e7a7-4cca-88e8-688d4d0a0c7a --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding"`
Expected: full markdown summary output

---

## Task 7: Write analyze.mjs — detail output formatter

**Files:**
- Modify: `session-analyzer/scripts/analyze.mjs`

**Step 1: Write `formatDetail(mainAnalysis, subAgentAnalyses)` function**

When `--detail` is passed, add these sections after the summary:

1. **Timeline** — ASCII tree with timestamps, agent dispatches, key events
2. **Per-Agent Sections** — for main + each sub-agent:
   - Per-Turn Detail table (turn#, time, out, cc, cr, total, action summary)
   - Files Created (Write tool_use)
   - Files Modified (Edit tool_use)
3. **Key Observations** `[自動產生]` — auto-generated insights:
   - Which agent consumed most tokens (% of total)
   - Cache read ratio
   - Total files written/edited
   - Longest-running agent

**Step 2: Add tool_use content summarizer**

```javascript
function summarizeToolUse(content) {
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const block of content) {
    if (block.type === 'tool_use') {
      const n = block.name;
      const inp = block.input || {};
      switch (n) {
        case 'Read': parts.push(`Read ${shortPath(inp.file_path)}`); break;
        case 'Write': parts.push(`Write ${shortPath(inp.file_path)}`); break;
        case 'Edit': parts.push(`Edit ${shortPath(inp.file_path)}`); break;
        case 'Bash': parts.push(`Bash: ${truncate(inp.command, 60)}`); break;
        case 'Agent': parts.push(`Agent -> ${inp.description || ''}`); break;
        default: parts.push(n);
      }
    } else if (block.type === 'text' && parts.length === 0) {
      parts.push(truncate(block.text, 80));
    }
  }
  return parts.join(' | ');
}
```

**Step 3: Verify detail mode**

Run: `node session-analyzer/scripts/analyze.mjs --session=02314245-e7a7-4cca-88e8-688d4d0a0c7a --detail --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding" 2>&1 | head -50`
Expected: summary + timeline + per-turn detail sections

---

## Task 8: Write analyze.mjs — --list mode output

**Files:**
- Modify: `session-analyzer/scripts/analyze.mjs`

**Step 1: Write list formatter**

When `--list` is passed, read each session JSONL's first `user` entry to extract a timestamp and first line of user message as a hint. Output:

```
# Recent Sessions

| # | Session ID | Start | Size | Hint |
|---|------------|-------|------|------|
| 1 | 5f19b456-... | 2026-03-27 10:33 | 324 KB | 我要在此 marketplace 新增... |
| 2 | 3ef61325-... | 2026-03-27 09:15 | 261 KB | commit |
| ...
```

Read only first few lines of each JSONL to get hint (performance).

**Step 2: Verify**

Run: `node session-analyzer/scripts/analyze.mjs --list --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding"`
Expected: numbered table of recent sessions

---

## Task 9: End-to-end test with reference data

**Files:**
- No new files

**Step 1: Test against known session (tm002)**

Copy the tm002 session JSONL to a temp location and run the analyzer against it, compare key numbers with the reference `session-full-analysis.md`:

Expected from reference:
- Main: 131 turns, 31,191 output tokens
- Total: 1,041 turns, 109,526,064 total tokens
- 6 sub-agents

Run: `node session-analyzer/scripts/analyze.mjs --session=6b60a685-11a5-4baa-9b7b-1daff6749b50 --cwd="C:/Users/a0304/IdeaProjects/eap" 2>&1 | grep TOTAL`

Verify the totals are consistent with the reference.

**Step 2: Test current session mode**

Run: `node session-analyzer/scripts/analyze.mjs --session=current --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding"`
Expected: analyzes the current (most recently modified) session

**Step 3: Test list mode**

Run: `node session-analyzer/scripts/analyze.mjs --list --cwd="C:/Users/a0304/OneDrive/Desktop/AiCoding"`
Expected: shows numbered list of sessions

---

## Task 10: Commit

**Step 1: Stage and commit**

```bash
git add session-analyzer/ .claude-plugin/marketplace.json docs/plans/2026-03-27-session-analyzer-design.md docs/plans/2026-03-27-session-analyzer-plan.md
git commit -m "feat: add session-analyzer skill — token/timing/sub-agent analysis for Claude Code sessions"
```
