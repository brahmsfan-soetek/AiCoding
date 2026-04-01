import { readFileSync } from 'fs';

const SESSION_DIR = 'C:/Users/a0304/OneDrive/Desktop/AiCoding/eap-agentic-coding/test01/tm002-session';
const mainJsonl = `${SESSION_DIR}/6b60a685-11a5-4baa-9b7b-1daff6749b50.jsonl`;
const subDir = `${SESSION_DIR}/6b60a685-11a5-4baa-9b7b-1daff6749b50/subagents`;

function analyzeFile(filePath, label) {
  const lines = readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }

    const content = entry.message?.content;
    if (!content) continue;
    const ts = entry.timestamp || '';
    const timePart = ts.slice(11, 19);

    // String content checks
    if (typeof content === 'string') {
      if (content.includes('command-name') || content.includes('command-message')) {
        const match = content.match(/command-name>([^<]+)</);
        results.push({ line: i+1, time: timePart, type: 'SLASH_COMMAND', detail: match ? match[1] : content.slice(0, 100) });
      }
      if (content.includes('Base directory for this skill')) {
        results.push({ line: i+1, time: timePart, type: 'SKILL_CONTENT', size: content.length });
      }
    }

    // Array content checks
    if (Array.isArray(content)) {
      for (const block of content) {
        // Skill content injection
        if (block.type === 'text' && block.text?.includes('Base directory for this skill')) {
          const dirMatch = block.text.match(/Base directory for this skill: (.+)/);
          results.push({
            line: i+1, time: timePart, type: 'SKILL_CONTENT_LOADED',
            size: block.text.length,
            dir: dirMatch ? dirMatch[1].trim() : '',
            preview: block.text.slice(0, 200).replace(/\r?\n/g, ' ')
          });
        }

        // Read calls on convention/prompt/template/.agentic files
        if (block.type === 'tool_use' && block.name === 'Read') {
          const fp = block.input?.file_path || '';
          if (fp.match(/convention|prompt|template|\.agentic|phase-/i)) {
            const parts = fp.replace(/\\/g, '/').split('/');
            results.push({ line: i+1, time: timePart, type: 'READ_SKILL_FILE', file: parts.slice(-3).join('/') });
          }
        }

        // Tool results that contain convention/prompt content
        if (block.type === 'tool_result' && typeof block.content === 'string') {
          if (block.content.includes('## Phase') || block.content.includes('## Convention') || block.content.includes('## 規範')) {
            results.push({ line: i+1, time: timePart, type: 'LOADED_CONTENT', size: block.content.length, preview: block.content.slice(0, 100).replace(/\r?\n/g, ' ') });
          }
        }
      }
    }
  }

  return results;
}

// Analyze main conversation
console.log('='.repeat(80));
console.log('SKILL & CONVENTION LOADS — Main Orchestrator');
console.log('='.repeat(80));
const mainResults = analyzeFile(mainJsonl, 'Main');
for (const r of mainResults) {
  console.log(`  L${String(r.line).padStart(4)} ${r.time} | ${r.type.padEnd(22)} | ${r.file || r.dir || ''} ${r.size ? `(${r.size} chars)` : ''} ${r.detail || ''}`);
  if (r.preview) console.log(`         ${r.preview.slice(0, 120)}`);
}

// Analyze subagents
const agents = [
  { id: 'agent-a4a732c4cb01c965b', label: 'Explore' },
  { id: 'agent-a0ac40a4b0dfc13e7', label: 'P1 Test Agent' },
  { id: 'agent-a48012713fedf516d', label: 'P2 Code Agent' },
  { id: 'agent-ab41565bd7427a3bc', label: 'P3 Review Agent' },
  { id: 'agent-a03a7f089fc7d7104', label: 'P4a MUST-FIX' },
  { id: 'agent-a987aaa5c18650264', label: 'P4b NOTE Fix' },
];

for (const agent of agents) {
  const results = analyzeFile(`${subDir}/${agent.id}.jsonl`, agent.label);
  if (results.length > 0) {
    console.log('');
    console.log('='.repeat(80));
    console.log(`SKILL & CONVENTION LOADS — ${agent.label}`);
    console.log('='.repeat(80));
    for (const r of results) {
      console.log(`  L${String(r.line).padStart(4)} ${r.time} | ${r.type.padEnd(22)} | ${r.file || r.dir || ''} ${r.size ? `(${r.size} chars)` : ''} ${r.detail || ''}`);
      if (r.preview) console.log(`         ${r.preview.slice(0, 120)}`);
    }
  }
}
