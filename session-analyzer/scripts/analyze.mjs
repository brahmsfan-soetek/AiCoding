#!/usr/bin/env node
// session-analyzer / analyze.mjs
// Analyzes Claude Code session JSONL files and outputs markdown reports.

import { createReadStream, existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

// ─────────────────────────────────────────────────────────
// 1. CLI Arg Parsing
// ─────────────────────────────────────────────────────────

function parseFlags(argv) {
  const flags = {
    session: 'current',
    list: false,
    detail: false,
    cwd: process.cwd(),
    help: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--list') {
      flags.list = true;
    } else if (arg === '--detail') {
      flags.detail = true;
    } else if (arg.startsWith('--session=')) {
      flags.session = arg.slice('--session='.length);
    } else if (arg.startsWith('--cwd=')) {
      flags.cwd = arg.slice('--cwd='.length);
    }
  }

  return flags;
}

const flags = parseFlags(process.argv);

if (flags.help) {
  console.log(`Usage: node analyze.mjs [options]

Options:
  --session=current   Analyze most recently modified JSONL (default)
  --session=<uuid>    Analyze specific session by UUID
  --list              List recent sessions and exit
  --detail            Include per-turn detail, timeline, files list, key observations
  --cwd=<path>        Project working directory (default: process.cwd())
  -h, --help          Show this help message
`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────
// 2. Path Helpers
// ─────────────────────────────────────────────────────────

function encodeCwd(cwd) {
  // Replace ':' and path separators with '-'
  // Observed encoding: C:\Users\... → C--Users-...
  // (':' → '-', '\' → '-', '/' → '-')
  return cwd.replace(/[:\\\\/]/g, '-');
}

function getProjectDir(cwd) {
  const home = homedir();
  const encoded = encodeCwd(cwd);
  return join(home, '.claude', 'projects', encoded);
}

function listSessions(projectDir) {
  if (!existsSync(projectDir)) return [];

  const files = readdirSync(projectDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => {
      const fp = join(projectDir, f);
      const stat = statSync(fp);
      return {
        name: f,
        path: fp,
        sessionId: basename(f, '.jsonl'),
        mtime: stat.mtimeMs,
        size: stat.size,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files;
}

function findCurrentSession(projectDir) {
  const sessions = listSessions(projectDir);
  if (sessions.length === 0) {
    throw new Error(`No session JSONL files found in ${projectDir}`);
  }
  return sessions[0].path;
}

// ─────────────────────────────────────────────────────────
// 3. JSONL Parser
// ─────────────────────────────────────────────────────────

async function parseJsonl(filePath) {
  const entries = [];
  const rl = createInterface({ input: createReadStream(filePath) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

/**
 * Read only the first N lines of a JSONL to extract hints quickly.
 */
async function parseJsonlHead(filePath, maxLines = 20) {
  const entries = [];
  let count = 0;
  const rl = createInterface({ input: createReadStream(filePath) });
  for await (const line of rl) {
    if (count >= maxLines) break;
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip
    }
    count++;
  }
  return entries;
}

// ─────────────────────────────────────────────────────────
// 4. Conversation Analyzer
// ─────────────────────────────────────────────────────────

function analyzeConversation(entries) {
  let model = '';
  let version = '';
  let startTs = '';
  let endTs = '';
  const turns = [];
  const toolCounts = {};
  const agentCalls = [];
  const filesWritten = [];
  const filesEdited = [];

  // Determine start/end from all entries that have a timestamp
  for (const entry of entries) {
    if (entry.timestamp) {
      if (!startTs) startTs = entry.timestamp;
      endTs = entry.timestamp;
    }
  }

  // Extract version from first entry
  for (const entry of entries) {
    if (entry.version) {
      version = entry.version;
      break;
    }
  }

  // Process assistant entries
  for (const entry of entries) {
    if (entry.type !== 'assistant') continue;
    const msg = entry.message;
    if (!msg || !msg.usage) continue;

    // Model from first assistant entry
    if (!model && msg.model) {
      model = msg.model;
    }

    const usage = msg.usage;
    const turn = {
      time: entry.timestamp || '',
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
      cache_read_input_tokens: usage.cache_read_input_tokens || 0,
      total: (usage.input_tokens || 0) +
             (usage.output_tokens || 0) +
             (usage.cache_creation_input_tokens || 0) +
             (usage.cache_read_input_tokens || 0),
      tools: [],
    };

    // Extract tool_use blocks from content
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_use') {
          const toolName = block.name || 'unknown';
          const input = block.input || {};

          // Count tools
          toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;

          // Build input summary
          let inputSummary = '';
          if (toolName === 'Read' || toolName === 'Write') {
            inputSummary = shortPath(input.file_path);
          } else if (toolName === 'Edit') {
            inputSummary = shortPath(input.file_path);
          } else if (toolName === 'Bash') {
            inputSummary = truncate(input.command, 60);
          } else if (toolName === 'Grep') {
            inputSummary = truncate(input.pattern, 40);
          } else if (toolName === 'Glob') {
            inputSummary = truncate(input.pattern, 40);
          } else if (toolName === 'Agent') {
            inputSummary = truncate(input.description || input.prompt || '', 60);
          } else if (toolName === 'Skill') {
            inputSummary = truncate(input.skill || '', 40);
          } else {
            // Generic: try to show first string value
            const firstVal = Object.values(input).find(v => typeof v === 'string');
            inputSummary = truncate(firstVal || '', 40);
          }

          turn.tools.push({ name: toolName, inputSummary });

          // Detect Agent calls
          if (toolName === 'Agent') {
            agentCalls.push({
              time: entry.timestamp || '',
              description: input.description || input.prompt || '',
              subagentType: input.subagent_type || input.agentType || '',
              model: input.model || '',
            });
          }

          // Detect file writes
          if (toolName === 'Write' && input.file_path) {
            filesWritten.push({ time: entry.timestamp || '', file: input.file_path });
          }

          // Detect file edits
          if (toolName === 'Edit' && input.file_path) {
            filesEdited.push({ time: entry.timestamp || '', file: input.file_path });
          }
        }
      }
    }

    turns.push(turn);
  }

  // Compute totals
  const totals = {
    input: turns.reduce((s, t) => s + t.input_tokens, 0),
    output: turns.reduce((s, t) => s + t.output_tokens, 0),
    cacheCreate: turns.reduce((s, t) => s + t.cache_creation_input_tokens, 0),
    cacheRead: turns.reduce((s, t) => s + t.cache_read_input_tokens, 0),
    grand: turns.reduce((s, t) => s + t.total, 0),
  };

  return {
    model,
    version,
    startTs,
    endTs,
    turns,
    totals,
    toolCounts,
    agentCalls,
    filesWritten,
    filesEdited,
  };
}

// ─────────────────────────────────────────────────────────
// 5. Sub-Agent Discovery
// ─────────────────────────────────────────────────────────

function discoverSubagents(projectDir, sessionId) {
  const subDir = join(projectDir, sessionId, 'subagents');
  if (!existsSync(subDir)) return [];

  const results = [];
  const files = readdirSync(subDir);

  // Find all .jsonl files (excluding .meta.json)
  const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

  for (const jf of jsonlFiles) {
    const agentId = basename(jf, '.jsonl');
    const metaPath = join(subDir, `${agentId}.meta.json`);
    let agentType = '';
    let description = '';

    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
        agentType = meta.agentType || '';
        description = meta.description || '';
      } catch {
        // skip
      }
    }

    results.push({
      agentId,
      jsonlPath: join(subDir, jf),
      agentType,
      description,
    });
  }

  return results;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function shortPath(fp) {
  if (!fp) return '';
  const parts = fp.replace(/\\/g, '/').split('/');
  return parts.slice(-3).join('/');
}

function truncate(s, max = 80) {
  if (!s) return '';
  s = s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function formatDuration(startTs, endTs) {
  if (!startTs || !endTs) return '\u2014';
  const ms = new Date(endTs) - new Date(startTs);
  if (!Number.isFinite(ms) || ms < 0) return '\u2014';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function timeOnly(ts) {
  if (!ts) return '??:??:??';
  const d = new Date(ts);
  return d.toTimeString().slice(0, 8);
}

function pct(part, total) {
  if (total === 0) return '0.0';
  return ((part / total) * 100).toFixed(1);
}

function actionSummary(turn) {
  if (!turn.tools || turn.tools.length === 0) {
    return 'text response';
  }
  // Summarize tool calls
  return turn.tools
    .map(t => `${t.name}${t.inputSummary ? '(' + t.inputSummary + ')' : ''}`)
    .join(', ');
}

// ─────────────────────────────────────────────────────────
// 6. Summary Output
// ─────────────────────────────────────────────────────────

function formatSummary(sessionId, mainAnalysis, subAnalyses) {
  const lines = [];
  const main = mainAnalysis;

  // ── Session header ──
  lines.push('# Session Analysis');
  lines.push('');
  lines.push(`- **Session ID**: \`${sessionId}\``);
  lines.push(`- **Model**: ${main.model || '(unknown)'}`);
  lines.push(`- **CLI Version**: ${main.version || '(unknown)'}`);
  lines.push(`- **Start**: ${main.startTs || '(unknown)'}`);
  lines.push(`- **End**: ${main.endTs || '(unknown)'}`);
  lines.push(`- **Wall-Clock**: ${formatDuration(main.startTs, main.endTs)}  \`[估算] 首末訊息時間差\``);
  lines.push('');

  // ── Token Summary table ──
  // Compute grand total across main + all subs
  let grandTotal = main.totals.grand;
  for (const sub of subAnalyses) {
    grandTotal += sub.analysis.totals.grand;
  }

  lines.push('## Token Summary');
  lines.push('');
  lines.push('| Role | Turns | Input | Output | Cache Create | Cache Read | Total | % `[計算]` |');
  lines.push('|------|------:|------:|-------:|------------:|-----------:|------:|------:|');

  // Main row
  lines.push(
    `| Main | ${main.turns.length} | ${formatNumber(main.totals.input)} | ${formatNumber(main.totals.output)} | ${formatNumber(main.totals.cacheCreate)} | ${formatNumber(main.totals.cacheRead)} | ${formatNumber(main.totals.grand)} | ${pct(main.totals.grand, grandTotal)}% |`
  );

  // Sub-agent rows
  for (const sub of subAnalyses) {
    const a = sub.analysis;
    const label = sub.description ? truncate(sub.description, 40) : sub.agentId.slice(0, 8);
    lines.push(
      `| Sub: ${label} | ${a.turns.length} | ${formatNumber(a.totals.input)} | ${formatNumber(a.totals.output)} | ${formatNumber(a.totals.cacheCreate)} | ${formatNumber(a.totals.cacheRead)} | ${formatNumber(a.totals.grand)} | ${pct(a.totals.grand, grandTotal)}% |`
    );
  }

  // Total row
  let totalTurns = main.turns.length;
  let totalInput = main.totals.input;
  let totalOutput = main.totals.output;
  let totalCC = main.totals.cacheCreate;
  let totalCR = main.totals.cacheRead;
  for (const sub of subAnalyses) {
    totalTurns += sub.analysis.turns.length;
    totalInput += sub.analysis.totals.input;
    totalOutput += sub.analysis.totals.output;
    totalCC += sub.analysis.totals.cacheCreate;
    totalCR += sub.analysis.totals.cacheRead;
  }

  lines.push(
    `| **TOTAL** | **${totalTurns}** | **${formatNumber(totalInput)}** | **${formatNumber(totalOutput)}** | **${formatNumber(totalCC)}** | **${formatNumber(totalCR)}** | **${formatNumber(grandTotal)}** | **100%** |`
  );
  lines.push('');

  // ── Sub-Agent Overview ──
  if (subAnalyses.length > 0) {
    lines.push('## Sub-Agent Overview');
    lines.push('');
    lines.push('| # | Time | Description | Type | Turns | Duration `[估算]` | Output Tokens |');
    lines.push('|---|------|-------------|------|------:|---------:|--------------|');

    subAnalyses.forEach((sub, i) => {
      const a = sub.analysis;
      const dur = formatDuration(a.startTs, a.endTs);
      lines.push(
        `| ${i + 1} | ${timeOnly(a.startTs)} | ${truncate(sub.description, 50)} | ${sub.agentType} | ${a.turns.length} | ${dur} \`[估算] 子代理首末訊息時間差\` | ${formatNumber(a.totals.output)} |`
      );
    });
    lines.push('');
  }

  // ── Tool Usage ──
  // Merge tool counts from main + subs
  const mergedTools = { ...main.toolCounts };
  for (const sub of subAnalyses) {
    for (const [tool, count] of Object.entries(sub.analysis.toolCounts)) {
      mergedTools[tool] = (mergedTools[tool] || 0) + count;
    }
  }

  const sortedTools = Object.entries(mergedTools).sort((a, b) => b[1] - a[1]);

  lines.push('## Tool Usage');
  lines.push('');
  lines.push('| Tool | Count |');
  lines.push('|------|------:|');
  for (const [tool, count] of sortedTools) {
    lines.push(`| ${tool} | ${count} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────
// 7. Detail Output (--detail)
// ─────────────────────────────────────────────────────────

function formatDetail(mainAnalysis, subAnalyses) {
  const lines = [];

  // ── Timeline ──
  lines.push('## Timeline');
  lines.push('');
  lines.push('```');

  // Build timeline events
  const events = [];

  // Session start
  if (mainAnalysis.startTs) {
    events.push({ time: mainAnalysis.startTs, type: 'session-start' });
  }

  // Main turns
  for (const turn of mainAnalysis.turns) {
    if (!turn.time) continue;
    events.push({
      time: turn.time,
      type: 'main-turn',
      summary: truncate(actionSummary(turn), 70),
    });
  }

  // Sub-agent start/end
  for (const sub of subAnalyses) {
    const a = sub.analysis;
    if (a.startTs) {
      events.push({
        time: a.startTs,
        type: 'agent-start',
        description: truncate(sub.description, 50),
        agentType: sub.agentType,
      });
    }
    if (a.endTs) {
      events.push({
        time: a.endTs,
        type: 'agent-end',
        description: truncate(sub.description, 50),
        turns: a.turns.length,
        duration: formatDuration(a.startTs, a.endTs),
        outputTokens: a.totals.output,
      });
    }
  }

  // Session end
  if (mainAnalysis.endTs) {
    events.push({ time: mainAnalysis.endTs, type: 'session-end' });
  }

  // Sort by time
  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  // Render timeline
  const lastIdx = events.length - 1;
  events.forEach((ev, idx) => {
    const t = timeOnly(ev.time);
    switch (ev.type) {
      case 'session-start':
        lines.push(`${t} ┬── Session start`);
        break;
      case 'main-turn':
        lines.push(`${t} │   Main: ${ev.summary}`);
        break;
      case 'agent-start':
        lines.push(`${t} ├─→ Agent: ${ev.description} (${ev.agentType})`);
        break;
      case 'agent-end': {
        const outK = ev.outputTokens >= 1000
          ? `${(ev.outputTokens / 1000).toFixed(1)}K`
          : ev.outputTokens;
        lines.push(`${t} │   └── Done (${ev.turns} turns, ${ev.duration}, ${outK} out)  [估算]`);
        break;
      }
      case 'session-end':
        lines.push(`${t} └── Session end`);
        break;
    }
  });

  lines.push('```');
  lines.push('');

  // ── Per-Agent Per-Turn Detail ──
  // Main
  lines.push(formatPerTurnDetail('Main Conversation', mainAnalysis));

  // Sub-agents
  for (const sub of subAnalyses) {
    const label = sub.description
      ? `Sub-Agent: ${truncate(sub.description, 50)}`
      : `Sub-Agent: ${sub.agentId.slice(0, 12)}`;
    lines.push(formatPerTurnDetail(label, sub.analysis));
  }

  // ── Files Created / Modified ──
  const allWritten = [...mainAnalysis.filesWritten];
  const allEdited = [...mainAnalysis.filesEdited];
  for (const sub of subAnalyses) {
    allWritten.push(...sub.analysis.filesWritten);
    allEdited.push(...sub.analysis.filesEdited);
  }

  if (allWritten.length > 0) {
    lines.push('## Files Created');
    lines.push('');
    // Deduplicate by file path, keep first occurrence
    const seen = new Set();
    for (const fw of allWritten) {
      const sp = shortPath(fw.file);
      if (seen.has(sp)) continue;
      seen.add(sp);
      lines.push(`- \`${sp}\` (${timeOnly(fw.time)})`);
    }
    lines.push('');
  }

  if (allEdited.length > 0) {
    lines.push('## Files Modified');
    lines.push('');
    const seen = new Set();
    for (const fe of allEdited) {
      const sp = shortPath(fe.file);
      if (seen.has(sp)) continue;
      seen.add(sp);
      lines.push(`- \`${sp}\` (${timeOnly(fe.time)})`);
    }
    lines.push('');
  }

  // ── Key Observations ──
  lines.push(formatKeyObservations(mainAnalysis, subAnalyses));

  return lines.join('\n');
}

function formatPerTurnDetail(label, analysis) {
  const lines = [];
  lines.push(`### ${label} Per-Turn Detail`);
  lines.push('');
  lines.push('```');

  analysis.turns.forEach((turn, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const t = timeOnly(turn.time);
    const inp = String(turn.input_tokens).padStart(6);
    const out = String(turn.output_tokens).padStart(6);
    const cc = String(turn.cache_creation_input_tokens).padStart(6);
    const cr = String(turn.cache_read_input_tokens).padStart(6);
    const tot = String(turn.total).padStart(7);
    const summary = truncate(actionSummary(turn), 50);
    lines.push(`T${num} ${t} | in:${inp} | out:${out} | cc:${cc} | cr:${cr} | total:${tot} | ${summary}`);
  });

  lines.push('──────');
  const a = analysis;
  lines.push(
    `SUBTOTAL ${a.turns.length} turns | in: ${formatNumber(a.totals.input)} | out: ${formatNumber(a.totals.output)} | cc: ${formatNumber(a.totals.cacheCreate)} | cr: ${formatNumber(a.totals.cacheRead)} | total: ${formatNumber(a.totals.grand)}`
  );
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function formatKeyObservations(mainAnalysis, subAnalyses) {
  const lines = [];
  lines.push('## Key Observations `[自動產生] 由腳本根據數據推導`');
  lines.push('');

  const grandTotal = mainAnalysis.totals.grand +
    subAnalyses.reduce((s, sub) => s + sub.analysis.totals.grand, 0);

  // 1. Which agent consumed most tokens
  let maxLabel = 'Main conversation';
  let maxTokens = mainAnalysis.totals.grand;
  for (const sub of subAnalyses) {
    if (sub.analysis.totals.grand > maxTokens) {
      maxTokens = sub.analysis.totals.grand;
      maxLabel = truncate(sub.description, 40) || sub.agentId.slice(0, 12);
    }
  }
  lines.push(`1. **Highest token consumer**: ${maxLabel} — ${formatNumber(maxTokens)} tokens (${pct(maxTokens, grandTotal)}% of total)`);

  // 2. Cache read ratio
  const totalCR = mainAnalysis.totals.cacheRead +
    subAnalyses.reduce((s, sub) => s + sub.analysis.totals.cacheRead, 0);
  lines.push(`2. **Cache read ratio**: ${pct(totalCR, grandTotal)}% of total tokens came from cache reads`);

  // 3. Total files written/edited
  let totalWritten = mainAnalysis.filesWritten.length;
  let totalEdited = mainAnalysis.filesEdited.length;
  for (const sub of subAnalyses) {
    totalWritten += sub.analysis.filesWritten.length;
    totalEdited += sub.analysis.filesEdited.length;
  }
  lines.push(`3. **Files touched**: ${totalWritten} created, ${totalEdited} edited`);

  // 4. Longest-running agent by duration
  if (subAnalyses.length > 0) {
    let longestLabel = '';
    let longestMs = 0;
    for (const sub of subAnalyses) {
      const a = sub.analysis;
      if (a.startTs && a.endTs) {
        const ms = new Date(a.endTs) - new Date(a.startTs);
        if (ms > longestMs) {
          longestMs = ms;
          longestLabel = truncate(sub.description, 40) || sub.agentId.slice(0, 12);
        }
      }
    }
    if (longestLabel) {
      const m = Math.floor(longestMs / 60000);
      const s = Math.floor((longestMs % 60000) / 1000);
      lines.push(`4. **Longest sub-agent**: ${longestLabel} — ${m}m ${s}s \`[估算]\``);
    }
  }

  // 5. Total turns
  const totalTurns = mainAnalysis.turns.length +
    subAnalyses.reduce((s, sub) => s + sub.analysis.turns.length, 0);
  lines.push(`${subAnalyses.length > 0 ? '5' : '4'}. **Total turns**: ${totalTurns} across ${1 + subAnalyses.length} conversation(s)`);

  lines.push('');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────
// 8. List Output (--list mode)
// ─────────────────────────────────────────────────────────

async function printSessionList(projectDir) {
  const sessions = listSessions(projectDir);
  if (sessions.length === 0) {
    console.log('No sessions found in ' + projectDir);
    return;
  }

  const lines = [];
  lines.push('# Recent Sessions');
  lines.push('');
  lines.push('| # | Session ID | Start | Size | Hint |');
  lines.push('|---|------------|-------|------|------|');

  const max = Math.min(sessions.length, 15);
  for (let i = 0; i < max; i++) {
    const sess = sessions[i];
    let startTs = '';
    let hint = '';

    try {
      const headEntries = await parseJsonlHead(sess.path, 20);
      // Find first entry with timestamp for start
      for (const e of headEntries) {
        if (e.timestamp) {
          startTs = e.timestamp;
          break;
        }
      }
      // Find first user message for hint
      for (const e of headEntries) {
        if (e.type === 'user') {
          // User message content can be string or array
          let text = '';
          if (typeof e.message === 'string') {
            text = e.message;
          } else if (e.message && Array.isArray(e.message.content)) {
            for (const block of e.message.content) {
              if (block.type === 'text' && block.text) {
                text = block.text;
                break;
              }
            }
          } else if (e.message && typeof e.message.content === 'string') {
            text = e.message.content;
          }
          hint = truncate(text, 60);
          break;
        }
      }
    } catch {
      // skip on read errors
    }

    const startDisplay = startTs
      ? new Date(startTs).toISOString().replace('T', ' ').slice(0, 16)
      : '—';

    lines.push(
      `| ${i + 1} | ${sess.sessionId} | ${startDisplay} | ${formatSize(sess.size)} | ${hint} |`
    );
  }

  console.log(lines.join('\n'));
}

// ─────────────────────────────────────────────────────────
// Main Flow
// ─────────────────────────────────────────────────────────

async function main() {
  const projectDir = getProjectDir(flags.cwd);

  if (!existsSync(projectDir)) {
    throw new Error(`Project directory not found: ${projectDir}\nUse --cwd=<path> to specify the project working directory.`);
  }

  if (flags.list) {
    await printSessionList(projectDir);
    return;
  }

  // Resolve session
  let sessionPath;
  if (flags.session === 'current') {
    sessionPath = findCurrentSession(projectDir);
  } else {
    sessionPath = join(projectDir, `${flags.session}.jsonl`);
  }

  if (!existsSync(sessionPath)) {
    throw new Error(`Session file not found: ${sessionPath}`);
  }

  const sessionId = basename(sessionPath, '.jsonl');

  // Parse main conversation
  const mainEntries = await parseJsonl(sessionPath);
  const mainAnalysis = analyzeConversation(mainEntries);

  // Discover + parse sub-agents
  const subagentInfos = discoverSubagents(projectDir, sessionId);
  const subAnalyses = [];
  for (const info of subagentInfos) {
    const entries = await parseJsonl(info.jsonlPath);
    const analysis = analyzeConversation(entries);
    subAnalyses.push({ ...info, analysis });
  }

  // Sort sub-agents by startTs
  subAnalyses.sort((a, b) => new Date(a.analysis.startTs) - new Date(b.analysis.startTs));

  // Output
  console.log(formatSummary(sessionId, mainAnalysis, subAnalyses));
  if (flags.detail) {
    console.log(formatDetail(mainAnalysis, subAnalyses));
  }
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
