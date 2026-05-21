# Spec-workflow PreToolUse hook (spike 3: typecheck + module test on commit)
# Fires when AI tries to run `git commit`. Runs mvn compile + test for the
# Maven module(s) whose .java files are in the staged diff.
# On failure, blocks commit and asks AI to notify PG (do not auto-fix).
#
# Spec: TDD Red-first 紀律外部化 (review/2026-04-09 切入點 8, A path)

$ErrorActionPreference = 'Stop'

$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$command = $payload.tool_input.command

if (-not $command) { exit 0 }
if ($command -notmatch '\bgit\s+commit\b') { exit 0 }

$stagedJava = & git diff --cached --name-only 2>$null | Where-Object { $_ -match '\.java$' }
if (-not $stagedJava) { exit 0 }

function Find-ReactorRoot {
    $dir = (Get-Location).Path
    $last = $null
    while ($dir -and $dir -ne $last) {
        $pom = Join-Path $dir 'pom.xml'
        if (Test-Path $pom) {
            try {
                $xml = [xml](Get-Content $pom -Raw)
                if ($xml.project.modules) { return $dir }
                $last = $dir
                $dir = Split-Path $dir -Parent
                continue
            } catch { return $dir }
        }
        $last = $dir
        $dir = Split-Path $dir -Parent
    }
    if ($last) { return $last }
    return $null
}

$reactorRoot = Find-ReactorRoot
if (-not $reactorRoot) { exit 0 }

$modules = @{}
foreach ($file in $stagedJava) {
    $fileAbs = (Resolve-Path $file -ErrorAction SilentlyContinue).Path
    if (-not $fileAbs) { continue }
    $dir = Split-Path $fileAbs -Parent
    while ($dir -and ($dir.Length -ge $reactorRoot.Length)) {
        $pom = Join-Path $dir 'pom.xml'
        if (Test-Path $pom) {
            try {
                $artifactId = ([xml](Get-Content $pom -Raw)).project.artifactId
                if ($artifactId) { $modules[$artifactId] = $true; break }
            } catch { }
        }
        $parent = Split-Path $dir -Parent
        if ($parent -eq $dir) { break }
        $dir = $parent
    }
}

if ($modules.Count -eq 0) { exit 0 }

$moduleList = ($modules.Keys -join ',')

Push-Location $reactorRoot
try {
    $output = & mvn -pl $moduleList -am test -o -q 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    $maxLen = 2000
    $truncated = if ($output.Length -gt $maxLen) { $output.Substring(0, $maxLen) + "`n... (truncated)" } else { $output }
    $reason = @"
[spec-workflow commit hook] mvn -pl $moduleList -am test failed.
Staged Java files: $($stagedJava -join ', ')
Reactor root: $reactorRoot

$truncated

⚠️ Do NOT auto-fix in-place. Stop and notify PG with:
  (1) the failing module + first error line,
  (2) one-line guess of the root cause.
PG decides whether to retry, rollback, or hand off.
"@
    @{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

exit 0
