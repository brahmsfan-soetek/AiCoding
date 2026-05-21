# Spec-workflow PreToolUse hook (spike 3: typecheck + vitest related on commit)
# Fires when AI tries to run `git commit`. Runs npm typecheck and vitest related
# for the .ts/.tsx/.vue files in the staged diff.
# On failure, blocks commit and asks AI to notify PG (do not auto-fix).
#
# Spec: TDD Red-first 紀律外部化 (review/2026-04-09 切入點 8, A path)

$ErrorActionPreference = 'Stop'

$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$command = $payload.tool_input.command

if (-not $command) { exit 0 }
if ($command -notmatch '\bgit\s+commit\b') { exit 0 }

$stagedFE = & git diff --cached --name-only 2>$null | Where-Object { $_ -match '\.(ts|tsx|vue)$' }
if (-not $stagedFE) { exit 0 }

function Find-PackageRoot {
    param([string]$startDir)
    $dir = $startDir
    while ($dir) {
        $pkg = Join-Path $dir 'package.json'
        if (Test-Path $pkg) { return $dir }
        $parent = Split-Path $dir -Parent
        if ($parent -eq $dir) { return $null }
        $dir = $parent
    }
    return $null
}

$cwd = (Get-Location).Path
$runDir = Find-PackageRoot -startDir $cwd
if (-not $runDir) { exit 0 }

$pkgJson = Join-Path $runDir 'package.json'
try {
    $pkg = Get-Content $pkgJson -Raw | ConvertFrom-Json
} catch {
    exit 0
}

function Block-And-Exit {
    param([string]$step, [string]$output, [string[]]$staged)
    $maxLen = 2000
    $truncated = if ($output.Length -gt $maxLen) { $output.Substring(0, $maxLen) + "`n... (truncated)" } else { $output }
    $reason = @"
[spec-workflow commit hook] $step failed.
Staged FE files: $($staged -join ', ')

$truncated

⚠️ Do NOT auto-fix in-place. Stop and notify PG with:
  (1) the failing file + first error line,
  (2) one-line guess of the root cause.
PG decides whether to retry, rollback, or hand off.
"@
    @{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$tcScript = $null
if ($pkg.scripts) {
    if ($pkg.scripts.typecheck) { $tcScript = 'typecheck' }
    elseif ($pkg.scripts.'type-check') { $tcScript = 'type-check' }
}

if ($tcScript) {
    Push-Location $runDir
    try {
        $tcOutput = & npm run -s $tcScript 2>&1 | Out-String
        $tcCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($tcCode -ne 0) {
        Block-And-Exit -step "npm run $tcScript" -output $tcOutput -staged $stagedFE
    }
}

$hasVitest = $false
$vitestBin = Join-Path $runDir 'node_modules\.bin\vitest.cmd'
if (Test-Path $vitestBin) { $hasVitest = $true }
$vitestBinSh = Join-Path $runDir 'node_modules\.bin\vitest'
if (Test-Path $vitestBinSh) { $hasVitest = $true }

if ($hasVitest) {
    $relPaths = @()
    foreach ($f in $stagedFE) {
        $relPaths += ($f -replace '/', '\')
    }
    Push-Location $runDir
    try {
        $testOutput = & npx --no-install vitest related --run @relPaths 2>&1 | Out-String
        $testCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($testCode -ne 0) {
        Block-And-Exit -step 'vitest related' -output $testOutput -staged $stagedFE
    }
}

exit 0
