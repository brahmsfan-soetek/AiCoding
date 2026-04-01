import { readFileSync, readdirSync } from 'fs';

const SESSION_DIR = 'C:/Users/a0304/OneDrive/Desktop/AiCoding/eap-agentic-coding/test01/tm002-session';
const MAIN_JSONL = `${SESSION_DIR}/6b60a685-11a5-4baa-9b7b-1daff6749b50.jsonl`;
const SUB_DIR = `${SESSION_DIR}/6b60a685-11a5-4baa-9b7b-1daff6749b50/subagents`;

// ── Helpers ──

function parseJsonl(filePath) {
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line, idx) => {
      try { return { ...JSON.parse(line), _lineNum: idx + 1 }; }
      catch { return null; }
    })
    .filter(Boolean);
}

function shortPath(fp) {
  if (!fp) return '';
  const parts = fp.replace(/\\/g, '/').split('/');
  // Find meaningful anchor
  const anchors = ['eap-agentic-coding', 'eap', '.agentic', 'backend', 'frontend', 'conventions', 'prompts', 'templates'];
  for (const a of anchors) {
    const idx = parts.indexOf(a);
    if (idx >= 0) return parts.slice(idx).join('/');
  }
  return parts.slice(-3).join('/');
}

function truncate(s, max = 120) {
  if (!s) return '';
  s = s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function extractPurpose(content) {
  if (!content || !Array.isArray(content)) {
    if (typeof content === 'string') return truncate(content, 120);
    return '';
  }
  const parts = [];
  for (const block of content) {
    if (block.type === 'tool_use') {
      const n = block.name;
      const inp = block.input || {};
      switch (n) {
        case 'Read': parts.push(`Read ${shortPath(inp.file_path)}`); break;
        case 'Write': parts.push(`Write ${shortPath(inp.file_path)}`); break;
        case 'Edit': parts.push(`Edit ${shortPath(inp.file_path)}`); break;
        case 'Bash': parts.push(`Bash: ${truncate(inp.command, 80)}`); break;
        case 'Grep': parts.push(`Grep "${truncate(inp.pattern, 30)}" in ${shortPath(inp.path) || 'cwd'}`); break;
        case 'Glob': parts.push(`Glob ${inp.pattern || ''}`); break;
        case 'Agent': parts.push(`Agent → ${inp.description || truncate(inp.prompt, 60)}`); break;
        case 'Skill': parts.push(`Skill: ${inp.skill || ''}`); break;
        default: parts.push(n);
      }
    } else if (block.type === 'text' && parts.length === 0) {
      parts.push(truncate(block.text, 120));
    }
  }
  return parts.join(' | ');
}

function extractAgentPrompt(content) {
  if (!Array.isArray(content)) return null;
  for (const block of content) {
    if (block.type === 'tool_use' && block.name === 'Agent') {
      return {
        description: block.input?.description || '',
        prompt: block.input?.prompt || '',
        subagentType: block.input?.subagent_type || 'general-purpose',
        model: block.input?.model || '',
        mode: block.input?.mode || '',
      };
    }
  }
  return null;
}

function extractSkillFiles(content) {
  const files = [];
  if (!Array.isArray(content)) return files;
  for (const block of content) {
    if (block.type === 'tool_use' && block.name === 'Read') {
      const fp = block.input?.file_path || '';
      if (fp.match(/convention|prompt|template|\.agentic|phase-/i)) {
        files.push(shortPath(fp));
      }
    }
  }
  return files;
}

function extractWrittenFiles(content) {
  const files = [];
  if (!Array.isArray(content)) return files;
  for (const block of content) {
    if (block.type === 'tool_use' && (block.name === 'Write' || block.name === 'Edit')) {
      files.push({ tool: block.name, file: shortPath(block.input?.file_path) });
    }
  }
  return files;
}

// ── Analyze one JSONL ──

function analyzeConversation(entries, label, isMain = false) {
  const result = {
    label,
    turns: [],
    skillContent: null,
    slashCommands: [],
    agentCalls: [],
    skillFileReads: [],
    filesWritten: [],
    filesEdited: [],
    userMessages: [],
    totalOut: 0, totalCc: 0, totalCr: 0, totalIn: 0,
    startTs: null, endTs: null,
  };

  for (const entry of entries) {
    const ts = entry.timestamp || '';
    const timePart = ts.slice(11, 19);

    // Track start/end
    if (ts && !result.startTs) result.startTs = ts;
    if (ts) result.endTs = ts;

    // Skip progress entries for main
    if (isMain && (entry.type === 'progress' || entry.type === 'hook_progress')) continue;

    // Slash commands
    if (entry.type === 'user') {
      const c = entry.message?.content;
      if (typeof c === 'string' && c.includes('command-name')) {
        const match = c.match(/<command-name>([^<]+)<\/command-name>/);
        if (match) result.slashCommands.push({ time: timePart, command: match[1] });
      }
      // Skill content loaded
      if (typeof c === 'string' && c.includes('Base directory for this skill')) {
        const dirMatch = c.match(/Base directory for this skill: (.+?)[\r\n]/);
        result.skillContent = { time: timePart, size: c.length, dir: dirMatch?.[1]?.trim() || '' };
      }
      if (Array.isArray(c)) {
        for (const block of c) {
          if (block.type === 'text' && block.text?.includes('Base directory for this skill')) {
            const dirMatch = block.text.match(/Base directory for this skill: (.+?)[\r\n]/);
            result.skillContent = { time: timePart, size: block.text.length, dir: dirMatch?.[1]?.trim() || '' };
          }
        }
        // User text messages
        for (const block of c) {
          if (block.type === 'text' && !block.text?.includes('command-') && !block.text?.includes('Base directory')) {
            result.userMessages.push({ time: timePart, text: truncate(block.text, 100) });
          }
        }
      }
      if (typeof c === 'string' && !c.includes('command-') && !c.includes('Base directory') && !c.includes('tool_result') && !c.includes('local-command')) {
        if (c.trim().length > 0 && c.trim().length < 500) {
          result.userMessages.push({ time: timePart, text: truncate(c, 100) });
        }
      }
    }

    // Assistant turns
    if (entry.type === 'assistant') {
      const msg = entry.message;
      if (!msg || msg.role !== 'assistant') continue;

      const usage = msg.usage || {};
      const out = usage.output_tokens || 0;
      const cc = usage.cache_creation_input_tokens || 0;
      const cr = usage.cache_read_input_tokens || 0;
      const inp = usage.input_tokens || 0;
      const total = out + cc + cr + inp;

      if (total === 0) continue;

      result.totalOut += out;
      result.totalCc += cc;
      result.totalCr += cr;
      result.totalIn += inp;

      const purpose = extractPurpose(msg.content);
      const agentCall = extractAgentPrompt(msg.content);
      const skillFiles = extractSkillFiles(msg.content);
      const written = extractWrittenFiles(msg.content);

      if (agentCall) result.agentCalls.push({ time: timePart, ...agentCall });
      for (const f of skillFiles) result.skillFileReads.push({ time: timePart, file: f });
      for (const f of written) {
        if (f.tool === 'Write') result.filesWritten.push({ time: timePart, file: f.file });
        else result.filesEdited.push({ time: timePart, file: f.file });
      }

      result.turns.push({
        num: result.turns.length + 1,
        time: timePart,
        out, cc, cr, inp, total,
        purpose,
        isSkillRead: skillFiles.length > 0,
        isAgentCall: !!agentCall,
        isWrite: written.some(w => w.tool === 'Write'),
        isEdit: written.some(w => w.tool === 'Edit'),
      });
    }
  }

  return result;
}

// ── Format output ──

function formatSection(analysis) {
  const lines = [];
  const { label, turns, totalOut, totalCc, totalCr, startTs, endTs } = analysis;
  const startTime = startTs?.slice(11, 19) || '?';
  const endTime = endTs?.slice(11, 19) || '?';
  const grandTotal = totalOut + totalCc + totalCr;

  lines.push(`## ${label} (${startTime} → ${endTime})`);
  lines.push('');

  // Skill content
  if (analysis.skillContent) {
    lines.push(`> **Skill 載入**: ${analysis.skillContent.dir} (${analysis.skillContent.size.toLocaleString()} chars) @ ${analysis.skillContent.time}`);
    lines.push('');
  }

  // Slash commands
  if (analysis.slashCommands.length > 0) {
    lines.push('### Slash Commands');
    for (const sc of analysis.slashCommands) {
      lines.push(`- \`${sc.time}\` ${sc.command}`);
    }
    lines.push('');
  }

  // User messages
  if (analysis.userMessages.length > 0) {
    lines.push('### User Messages');
    for (const m of analysis.userMessages) {
      lines.push(`- \`${m.time}\` ${m.text}`);
    }
    lines.push('');
  }

  // Agent calls with prompt excerpts
  if (analysis.agentCalls.length > 0) {
    lines.push('### Agent Calls (Sub-Agent Dispatches)');
    lines.push('');
    for (const ac of analysis.agentCalls) {
      lines.push(`#### \`${ac.time}\` Agent → ${ac.description}`);
      lines.push('');
      lines.push(`- **Type**: ${ac.subagentType}${ac.model ? ` | Model: ${ac.model}` : ''}${ac.mode ? ` | Mode: ${ac.mode}` : ''}`);
      // Show prompt excerpt (first 500 chars)
      if (ac.prompt) {
        const excerpt = ac.prompt.replace(/\r?\n/g, '\n').slice(0, 800);
        lines.push('<details>');
        lines.push(`<summary>Prompt (${ac.prompt.length.toLocaleString()} chars) — click to expand</summary>`);
        lines.push('');
        lines.push('```');
        lines.push(excerpt);
        if (ac.prompt.length > 800) lines.push('... (truncated)');
        lines.push('```');
        lines.push('</details>');
      }
      lines.push('');
    }
  }

  // Skill/convention file reads
  if (analysis.skillFileReads.length > 0) {
    lines.push('### Skill / Convention / Template Files Loaded');
    lines.push('');
    lines.push('| Time | File |');
    lines.push('|------|------|');
    for (const f of analysis.skillFileReads) {
      lines.push(`| ${f.time} | \`${f.file}\` |`);
    }
    lines.push('');
  }

  // Files written
  if (analysis.filesWritten.length > 0) {
    lines.push('### Files Created (Write)');
    lines.push('');
    const unique = [...new Set(analysis.filesWritten.map(f => f.file))];
    for (const f of unique) {
      const first = analysis.filesWritten.find(w => w.file === f);
      lines.push(`- \`${first.time}\` \`${f}\``);
    }
    lines.push('');
  }

  // Files edited
  if (analysis.filesEdited.length > 0) {
    lines.push('### Files Modified (Edit)');
    lines.push('');
    const unique = [...new Set(analysis.filesEdited.map(f => f.file))];
    for (const f of unique) {
      const first = analysis.filesEdited.find(w => w.file === f);
      const count = analysis.filesEdited.filter(w => w.file === f).length;
      lines.push(`- \`${f}\` (${count} edits)`);
    }
    lines.push('');
  }

  // Per-turn table
  lines.push('### Per-Turn Detail');
  lines.push('');
  lines.push('```');
  for (const t of turns) {
    const numStr = `T${String(t.num).padStart(3, '0')}`;
    const outStr = String(t.out).padStart(6);
    const ccStr = String(t.cc).padStart(7);
    const crStr = String(t.cr).padStart(9);
    const totalStr = String(t.total).padStart(10);

    // Add markers
    let markers = '';
    if (t.isSkillRead) markers += ' [SKILL]';
    if (t.isAgentCall) markers += ' [AGENT]';
    if (t.isWrite) markers += ' [WRITE]';
    if (t.isEdit) markers += ' [EDIT]';

    let purp = t.purpose;
    const maxPurp = 95 - markers.length;
    if (purp.length > maxPurp) purp = purp.slice(0, maxPurp - 3) + '...';

    lines.push(`${numStr} ${t.time} | out:${outStr} | cc:${ccStr} | cr:${crStr} | Σ${totalStr} |${markers} ${purp}`);
  }
  lines.push('─'.repeat(130));
  lines.push(`SUBTOTAL ${turns.length} turns | out: ${totalOut.toLocaleString()} | cc: ${totalCc.toLocaleString()} | cr: ${totalCr.toLocaleString()} | Σ ${grandTotal.toLocaleString()}`);
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ── Main ──

const output = [];

output.push('# TM002 Session — Complete Analysis');
output.push('');
output.push('- **Session ID**: `6b60a685-11a5-4baa-9b7b-1daff6749b50`');
output.push('- **Branch**: `tm002-test-01`');
output.push('- **Model**: `claude-opus-4-6` (1M context)');
output.push('- **CLI Version**: 2.1.84');
output.push('- **Start**: 2026-03-26T03:52:48Z');
output.push('- **End**: 2026-03-26T05:45:14Z');
output.push('- **Total Wall-Clock**: 112m 26s');
output.push('');

// ── Skill Overview ──
output.push('---');
output.push('');
output.push('## Skill & Convention File Map');
output.push('');
output.push('```');
output.push('soetek-agentic-coding-skills/eap-agentic-coding/');
output.push('├── (main skill file)                         ← 10,239 chars, loaded at session start');
output.push('├── prompts/');
output.push('│   ├── phase-1-test-agent.md                 ← Main reads before spawning P1');
output.push('│   ├── phase-2-code-agent.md                 ← Main reads before spawning P2');
output.push('│   └── phase-3-review-agent.md               ← Main reads before spawning P3');
output.push('├── conventions/');
output.push('│   ├── tech-stack.md                         ← Main reads at P0');
output.push('│   ├── naming-conventions.md                 ← Main reads at P0, P3 re-reads');
output.push('│   ├── db-conventions.md                     ← Main reads at P0, P3 re-reads');
output.push('│   ├── code-patterns-backend.md              ← P2 reads, P3 re-reads');
output.push('│   ├── code-patterns-frontend.md             ← P3 reads');
output.push('│   └── data-access.md                        ← P3 reads');
output.push('├── templates/');
output.push('│   ├── backend-entity.md                     ← P2 reads (04:11)');
output.push('│   ├── backend-processor-query.md            ← P2 reads (04:11)');
output.push('│   ├── frontend-types.md                     ← P2 reads (05:01)');
output.push('│   ├── frontend-service.md                   ← P2 reads (05:01)');
output.push('│   └── frontend-store.md                     ← P2 reads (05:01)');
output.push('└── (other templates not loaded this session)');
output.push('');
output.push('.agentic/ (working documents, produced & consumed between phases)');
output.push('├── config.json                               ← Main creates at P0');
output.push('├── tasks.md                                  ← P1 produces → Main, P2, P3 consume');
output.push('├── test_spec_map.md                          ← P1 produces → Main, P3 consume');
output.push('├── review_notes.md                           ← P2 produces → Main, P3 consume');
output.push('└── review_report.md                          ← P3 produces → Main consumes');
output.push('```');
output.push('');

// ── Timeline ──
output.push('---');
output.push('');
output.push('## Timeline');
output.push('');
output.push('```');
output.push('03:52:48 ┬── /clear + /eap-agentic-coding (Skill loaded, 10K chars)');
output.push('03:52:52 │   User: "位於 Docs/spec/tm002"');
output.push('03:53:00 │   Main: Glob .agentic/config.json → not found');
output.push('03:53:34 │   Main: ls Docs/spec/tm002 → found unified-spec.md');
output.push('03:54:10 │   Main: Read unified-spec.md → Phase 0 already done');
output.push('03:54:17 │   Main: mkdir .agentic + Write config.json');
output.push('03:54:38 │   Main: "Phase 0 已完成"');
output.push('03:54:53 │   Main: Read phase-1-test-agent.md + 3 conventions     [SKILL LOAD]');
output.push('03:55:05 ├─→ Agent: Explore TM module structure (Explore type)');
output.push('03:56:23 │   └── Done (58 turns, 1m18s, 8K out, 1.76M total)');
output.push('03:56:33 │   Main: verify test infra (Glob, Grep, Read processors)');
output.push('03:57:16 │   Main: Read phase-1-test-agent prompt');
output.push('03:57:57 ├─→ Agent: P1 Test Agent (general-purpose)');
output.push('         │   Reads: tasks context, conventions');
output.push('         │   Produces: .agentic/tasks.md, test_spec_map.md, import.sql, 4 test files');
output.push('04:06:40 │   └── Done (103 turns, 8m43s, 35K out, 6.1M total)');
output.push('04:06:43 │   Main: Read P1 outputs (tasks.md, test_spec_map.md, test files)');
output.push('04:07:26 │   Main: "Phase 1 完成 — STOP Gate 軟檢查點"');
output.push('04:08:03 │   User: (confirms proceed)');
output.push('04:08:06 │   Main: Read phase-2-code-agent.md                     [SKILL LOAD]');
output.push('04:09:34 ├─→ Agent: P2 Code Agent (general-purpose)');
output.push('         │   Reads: tasks.md, code-patterns-backend.md,');
output.push('         │          backend-entity.md, backend-processor-query.md,');
output.push('         │          frontend-types.md, frontend-service.md, frontend-store.md');
output.push('         │   Produces: 25 source files (+4,088 lines)');
output.push('05:06:16 │   └── Done (425 turns, 56m42s, 95K out, 67.4M total)');
output.push('05:06:21 │   Main: verify outputs (Bash, Glob, Read)');
output.push('05:06:39 │   Main: "Phase 2 完成"');
output.push('05:07:01 │   Main: Read phase-3-review-agent.md                   [SKILL LOAD]');
output.push('05:07:50 ├─→ Agent: P3 Review Agent (general-purpose)');
output.push('         │   Reads: tasks.md, test_spec_map.md, review_notes.md,');
output.push('         │          5 convention files (data-access, code-patterns-*, naming, db)');
output.push('         │   Produces: review_report.md (Write)');
output.push('05:13:32 │   └── Done (93 turns, 5m42s, 17K out, 8.1M total)');
output.push('05:13:34 │   Main: Read review_report.md → parse MUST/SHOULD/NOTE issues');
output.push('05:13:48 │   Main: "Phase 3 完成 — 發現 N 個問題待修"');
output.push('05:15:13 │   User: (confirms fix)');
output.push('05:15:46 ├─→ Agent: P4a MUST-FIX / SHOULD-FIX (general-purpose)');
output.push('         │   Prompt contains fix list from review_report');
output.push('         │   No extra skill file reads');
output.push('05:26:09 │   └── Done (177 turns, 10m23s, 25K out, 14.1M total)');
output.push('05:26:14 │   Main: verify fixes, prepare NOTE fix list');
output.push('05:27:19 │   Main: "MUST/SHOULD 修正完成"');
output.push('05:29:55 │   User: (reviews, confirms NOTE fixes)');
output.push('05:34:19 ├─→ Agent: P4b NOTE Fix (general-purpose)');
output.push('         │   No extra skill file reads');
output.push('05:38:39 │   └── Done (54 turns, 4m20s, 8K out, 2.3M total)');
output.push('05:38:45 │   Main: verify, git commit (2 commits total)');
output.push('05:41:48 │   /export');
output.push('05:45:14 └── Session 結束');
output.push('```');
output.push('');

// ── Per-Agent Detailed Sections ──

output.push('---');
output.push('');

// Main
const mainEntries = parseJsonl(MAIN_JSONL);
const mainAnalysis = analyzeConversation(mainEntries, 'Main Orchestrator', true);
output.push(formatSection(mainAnalysis));

// Subagents in chronological order
const agentOrder = [
  { id: 'agent-a4a732c4cb01c965b', label: 'Explore: TM Module Structure' },
  { id: 'agent-a0ac40a4b0dfc13e7', label: 'P1 Test Agent: Task Decomposition + Tests' },
  { id: 'agent-a48012713fedf516d', label: 'P2 Code Agent: Implement TM002' },
  { id: 'agent-ab41565bd7427a3bc', label: 'P3 Review Agent: Cross-Verify TM002' },
  { id: 'agent-a03a7f089fc7d7104', label: 'P4a MUST-FIX / SHOULD-FIX Agent' },
  { id: 'agent-a987aaa5c18650264', label: 'P4b NOTE Fix Agent' },
];

for (const agent of agentOrder) {
  const entries = parseJsonl(`${SUB_DIR}/${agent.id}.jsonl`);
  const analysis = analyzeConversation(entries, agent.label, false);
  output.push('---');
  output.push('');
  output.push(formatSection(analysis));
}

// ── Grand Summary ──

output.push('---');
output.push('');
output.push('## Grand Summary');
output.push('');
output.push('### Token Consumption');
output.push('');
output.push('| Role | Turns | Output | Cache Create | Cache Read | Total |');
output.push('|------|------:|-------:|------------:|-----------:|------:|');

const allAnalyses = [mainAnalysis];
for (const agent of agentOrder) {
  const entries = parseJsonl(`${SUB_DIR}/${agent.id}.jsonl`);
  allAnalyses.push(analyzeConversation(entries, agent.label, false));
}

let gTurns = 0, gOut = 0, gCc = 0, gCr = 0;
for (const a of allAnalyses) {
  const total = a.totalOut + a.totalCc + a.totalCr;
  output.push(`| ${a.label} | ${a.turns.length} | ${a.totalOut.toLocaleString()} | ${a.totalCc.toLocaleString()} | ${a.totalCr.toLocaleString()} | ${total.toLocaleString()} |`);
  gTurns += a.turns.length;
  gOut += a.totalOut;
  gCc += a.totalCc;
  gCr += a.totalCr;
}
const gTotal = gOut + gCc + gCr;
output.push(`| **TOTAL** | **${gTurns}** | **${gOut.toLocaleString()}** | **${gCc.toLocaleString()}** | **${gCr.toLocaleString()}** | **${gTotal.toLocaleString()}** |`);
output.push('');

output.push('### Skill Usage Summary');
output.push('');
output.push('| Category | Count | When Loaded | Loaded By |');
output.push('|----------|------:|-------------|-----------|');
output.push('| Skill main file | 1 (10K chars) | 03:52:52 (session start) | CLI → Main |');
output.push('| Phase prompts | 3 | P0→P1, P1→P2, P2→P3 transitions | Main |');
output.push('| Convention files | 6 unique (10 reads) | P0, P2, P3 | Main, P2, P3 |');
output.push('| Template files | 5 | P2 backend (04:11), P2 frontend (05:01) | P2 |');
output.push('| .agentic working docs | 4 unique (8 reads) | Between phases | All agents |');
output.push('| **Total unique files** | **19** | | |');
output.push('');

output.push('### Files Produced');
output.push('');

// Collect all written/edited files across all agents
const allWritten = new Map();
const allEdited = new Map();
for (const a of allAnalyses) {
  for (const f of a.filesWritten) {
    if (!allWritten.has(f.file)) allWritten.set(f.file, { file: f.file, time: f.time, agent: a.label });
  }
  for (const f of a.filesEdited) {
    const key = f.file;
    if (!allEdited.has(key)) allEdited.set(key, { file: f.file, agent: a.label, count: 0 });
    allEdited.get(key).count++;
  }
}

output.push(`- **Write (new files)**: ${allWritten.size}`);
output.push(`- **Edit (modifications)**: ${allEdited.size} files, ${[...allEdited.values()].reduce((s, e) => s + e.count, 0)} total edits`);
output.push('');

// Key observations
output.push('### Key Observations');
output.push('');
output.push('1. **P2 Code Agent** is the dominant cost center: 61% of total tokens, 50% of wall-clock time');
output.push('2. **Cache read** accounts for 97.8% of all tokens — prompt caching is working effectively');
output.push('3. **Skill files are loaded lazily**: conventions loaded at P0, templates loaded by P2 only when needed (backend templates at 04:11, frontend templates at 05:01)');
output.push('4. **Phase prompts are loaded by Main** just before spawning each agent — they are NOT pre-loaded');
output.push('5. **P4a/P4b receive fix instructions via Agent prompt** — no additional skill/convention files loaded');
output.push('6. **Working docs (.agentic/) serve as inter-phase memory**: P1 writes tasks.md → P2 reads it → P3 reads it for review');
output.push('7. **P3 Review Agent loads the most conventions** (5 files) to cross-verify code compliance');
output.push('');

console.log(output.join('\n'));
