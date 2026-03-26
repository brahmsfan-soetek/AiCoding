#!/usr/bin/env bash
# statusline.sh — Claude Code statusline script
# Reads JSON from stdin, writes session stats to .agentic/.session-stats,
# and outputs a compact status line to stdout.
#
# Configure in .claude/settings.local.json:
# { "statusLine": { "type": "command", "command": "bash .claude/hooks/statusline.sh" } }

set -euo pipefail

INPUT=$(cat)

# Parse JSON with python (jq not available on this system)
STATS=$(echo "$INPUT" | python -c "
import sys, json, os

d = json.load(sys.stdin)

cw = d.get('context_window', {})
cost = d.get('cost', {})

input_tokens = cw.get('total_input_tokens', 0) or 0
output_tokens = cw.get('total_output_tokens', 0) or 0
total_tokens = input_tokens + output_tokens
used_pct = cw.get('used_percentage', 0) or 0
cost_usd = cost.get('total_cost_usd', 0) or 0
duration_ms = cost.get('total_duration_ms', 0) or 0
api_duration_ms = cost.get('total_api_duration_ms', 0) or 0

# Write session stats to file for phase-logger to read
stats_dir = os.path.join('.agentic')
os.makedirs(stats_dir, exist_ok=True)
stats_file = os.path.join(stats_dir, '.session-stats')
with open(stats_file, 'w') as f:
    json.dump({
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
        'total_tokens': total_tokens,
        'cost_usd': cost_usd,
        'duration_ms': duration_ms,
        'api_duration_ms': api_duration_ms,
        'used_percentage': round(used_pct, 1)
    }, f)

# Format for display
duration_s = duration_ms // 1000
dur_m, dur_s = divmod(duration_s, 60)
dur_h, dur_m = divmod(dur_m, 60)
if dur_h > 0:
    dur_str = f'{dur_h}h{dur_m}m'
elif dur_m > 0:
    dur_str = f'{dur_m}m{dur_s}s'
else:
    dur_str = f'{dur_s}s'

def fmt_tokens(n):
    if n >= 1_000_000:
        return f'{n/1_000_000:.1f}M'
    elif n >= 1_000:
        return f'{n/1_000:.1f}K'
    return str(n)

print(f'{fmt_tokens(total_tokens)} tokens | \${cost_usd:.2f} | {dur_str} | {round(used_pct)}% ctx')
" 2>/dev/null)

echo "$STATS"
