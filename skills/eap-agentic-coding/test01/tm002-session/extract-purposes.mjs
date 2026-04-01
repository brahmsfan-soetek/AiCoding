import { readFileSync } from 'fs';
import { basename } from 'path';

const SESSION_DIR = process.argv[2] || '.';

function extractPurpose(content) {
  if (!content || !Array.isArray(content)) return '';

  const purposes = [];

  for (const block of content) {
    if (block.type === 'tool_use') {
      const name = block.name;
      const input = block.input || {};

      switch (name) {
        case 'Read': {
          const fp = input.file_path || '';
          const short = fp.split(/[/\\]/).slice(-2).join('/');
          purposes.push(`Read ${short}`);
          break;
        }
        case 'Write': {
          const fp = input.file_path || '';
          const short = fp.split(/[/\\]/).slice(-2).join('/');
          purposes.push(`Write ${short}`);
          break;
        }
        case 'Edit': {
          const fp = input.file_path || '';
          const short = fp.split(/[/\\]/).slice(-2).join('/');
          const oldStr = (input.old_string || '').slice(0, 30).replace(/\n/g, ' ');
          purposes.push(`Edit ${short}`);
          break;
        }
        case 'Bash': {
          let cmd = (input.command || '').replace(/\n/g, ' ').trim();
          if (cmd.length > 80) cmd = cmd.slice(0, 77) + '...';
          purposes.push(`Bash: ${cmd}`);
          break;
        }
        case 'Grep': {
          const pat = input.pattern || '';
          const fp = input.path || '';
          const short = fp.split(/[/\\]/).slice(-2).join('/');
          purposes.push(`Grep "${pat}" in ${short || 'cwd'}`);
          break;
        }
        case 'Glob': {
          purposes.push(`Glob ${input.pattern || ''}`);
          break;
        }
        case 'Agent': {
          const desc = input.description || input.prompt?.slice(0, 50) || '';
          purposes.push(`Agent: ${desc}`);
          break;
        }
        case 'TaskCreate':
        case 'TaskUpdate':
          purposes.push(`${name}`);
          break;
        default:
          purposes.push(`${name}`);
      }
    } else if (block.type === 'text') {
      const text = (block.text || '').replace(/\n/g, ' ').trim();
      if (text && purposes.length === 0) {
        purposes.push(text.length > 80 ? text.slice(0, 77) + '...' : text);
      }
    } else if (block.type === 'thinking') {
      // skip thinking blocks
    }
  }

  return purposes.join(' | ');
}

function processJsonl(filePath, label) {
  const lines = readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

  const turns = [];
  let turnNum = 0;

  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    // Only process assistant messages
    if (entry.type !== 'assistant') continue;

    const msg = entry.message;
    if (!msg || msg.role !== 'assistant') continue;

    const usage = msg.usage || {};
    const outTokens = usage.output_tokens || 0;
    const cacheCreate = usage.cache_creation_input_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;
    const inputTokens = usage.input_tokens || 0;
    const total = outTokens + cacheCreate + cacheRead + inputTokens;

    if (total === 0) continue;

    turnNum++;

    const ts = entry.timestamp || '';
    const timePart = ts.slice(11, 19);

    const purpose = extractPurpose(msg.content);

    turns.push({
      num: turnNum,
      time: timePart,
      out: outTokens,
      cc: cacheCreate,
      cr: cacheRead,
      total,
      purpose
    });
  }

  return turns;
}

function processMainJsonl(filePath) {
  const lines = readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

  const turns = [];
  let turnNum = 0;

  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    // Skip progress/agent_progress - only direct assistant messages
    if (entry.type === 'progress' || entry.type === 'hook_progress') continue;
    if (entry.type !== 'assistant') continue;

    // Also check nested data type
    if (entry.data && (entry.data.type === 'agent_progress' || entry.data.type === 'hook_progress')) continue;

    const msg = entry.message;
    if (!msg || msg.role !== 'assistant') continue;

    const usage = msg.usage || {};
    const outTokens = usage.output_tokens || 0;
    const cacheCreate = usage.cache_creation_input_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;
    const inputTokens = usage.input_tokens || 0;
    const total = outTokens + cacheCreate + cacheRead + inputTokens;

    if (total === 0) continue;

    turnNum++;

    const ts = entry.timestamp || '';
    const timePart = ts.slice(11, 19);

    const purpose = extractPurpose(msg.content);

    turns.push({
      num: turnNum,
      time: timePart,
      out: outTokens,
      cc: cacheCreate,
      cr: cacheRead,
      total,
      purpose
    });
  }

  return turns;
}

function formatTurns(turns) {
  const lines = [];
  let totalOut = 0, totalCc = 0, totalCr = 0;

  for (const t of turns) {
    totalOut += t.out;
    totalCc += t.cc;
    totalCr += t.cr;

    const numStr = `T${String(t.num).padStart(3, '0')}`;
    const outStr = String(t.out).padStart(6);
    const ccStr = String(t.cc).padStart(7);
    const crStr = String(t.cr).padStart(9);
    const totalStr = String(t.total).padStart(10);

    // Truncate purpose to fit
    let purp = t.purpose;
    if (purp.length > 90) purp = purp.slice(0, 87) + '...';

    lines.push(`${numStr} ${t.time} | out:${outStr} | cc:${ccStr} | cr:${crStr} | Σ${totalStr} | ${purp}`);
  }

  lines.push('─'.repeat(120));
  lines.push(`SUBTOTAL ${turns.length} turns | out:${String(totalOut).padStart(7)} | cc:${String(totalCc).padStart(8)} | cr:${String(totalCr).padStart(10)} | Σ${String(totalOut + totalCc + totalCr).padStart(10)}`);

  return lines.join('\n');
}

// ── Main ──
const mainJsonl = `${SESSION_DIR}/6b60a685-11a5-4baa-9b7b-1daff6749b50.jsonl`;
const subDir = `${SESSION_DIR}/6b60a685-11a5-4baa-9b7b-1daff6749b50/subagents`;

const agents = [
  { id: 'agent-a4a732c4cb01c965b', label: 'Explore: TM module structure' },
  { id: 'agent-a0ac40a4b0dfc13e7', label: 'P1 Test Agent: task decomposition + tests' },
  { id: 'agent-a48012713fedf516d', label: 'P2 Code Agent: implement TM002' },
  { id: 'agent-ab41565bd7427a3bc', label: 'P3 Review Agent: cross-verify TM002' },
  { id: 'agent-a03a7f089fc7d7104', label: 'P4a MUST-FIX / SHOULD-FIX Agent' },
  { id: 'agent-a987aaa5c18650264', label: 'P4b NOTE Fix Agent' },
];

// Output
const output = [];

output.push('# TM002 Session — Per-Turn Analysis with Purpose');
output.push('');
output.push('- **Session ID**: `6b60a685-11a5-4baa-9b7b-1daff6749b50`');
output.push('- **Model**: `claude-opus-4-6` (1M context)');
output.push('- **Time**: 2026-03-26 03:52:48 → 05:45:14 UTC (112m 26s)');
output.push('');

// Main orchestrator
output.push('---');
output.push('');
output.push('## Main Orchestrator (03:52:48 → 05:45:14)');
output.push('');
output.push('```');
const mainTurns = processMainJsonl(mainJsonl);
output.push(formatTurns(mainTurns));
output.push('```');
output.push('');

// Subagents
for (const agent of agents) {
  const jsonlPath = `${subDir}/${agent.id}.jsonl`;
  const metaPath = `${subDir}/${agent.id}.meta.json`;

  let meta = {};
  try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')); } catch {}

  output.push('---');
  output.push('');
  output.push(`## ${agent.label}`);
  output.push('');
  output.push('```');
  const turns = processJsonl(jsonlPath, agent.label);
  output.push(formatTurns(turns));
  output.push('```');
  output.push('');
}

// Summary table
output.push('---');
output.push('');
output.push('## Summary');
output.push('');
output.push('| Role | Turns | Output | Cache Create | Cache Read | Total |');
output.push('|------|------:|-------:|------------:|-----------:|------:|');

const allSections = [
  { label: 'Main Orchestrator', turns: mainTurns },
];
for (const agent of agents) {
  const turns = processJsonl(`${subDir}/${agent.id}.jsonl`, agent.label);
  allSections.push({ label: agent.label, turns });
}

let grandOut = 0, grandCc = 0, grandCr = 0, grandTurns = 0;
for (const sec of allSections) {
  const out = sec.turns.reduce((s, t) => s + t.out, 0);
  const cc = sec.turns.reduce((s, t) => s + t.cc, 0);
  const cr = sec.turns.reduce((s, t) => s + t.cr, 0);
  grandOut += out; grandCc += cc; grandCr += cr; grandTurns += sec.turns.length;
  output.push(`| ${sec.label} | ${sec.turns.length} | ${out.toLocaleString()} | ${cc.toLocaleString()} | ${cr.toLocaleString()} | ${(out + cc + cr).toLocaleString()} |`);
}
output.push(`| **TOTAL** | **${grandTurns}** | **${grandOut.toLocaleString()}** | **${grandCc.toLocaleString()}** | **${grandCr.toLocaleString()}** | **${(grandOut + grandCc + grandCr).toLocaleString()}** |`);

console.log(output.join('\n'));
