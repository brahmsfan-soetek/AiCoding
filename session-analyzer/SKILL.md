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
