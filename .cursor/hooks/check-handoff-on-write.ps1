# postToolUse — handoff.json written as READY → remind Git Manager
$ErrorActionPreference = 'SilentlyContinue'

$stdin = [Console]::In.ReadToEnd()
if ($stdin) {
  try {
    $payload = $stdin | ConvertFrom-Json
    $path = "$($payload.tool_input.path)$($payload.file_path)$($payload.path)"
    if (-not $path) {
      $blob = ($payload | ConvertTo-Json -Compress)
      if ($blob -notmatch 'handoff\.json') { exit 0 }
    } elseif ($path -notmatch 'handoff\.json') {
      exit 0
    }
  } catch { }
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$handoffPath = Join-Path $projectRoot 'handoff.json'

if (-not (Test-Path $handoffPath)) { exit 0 }

try {
  $handoff = Get-Content -Path $handoffPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch { exit 0 }

if ($handoff.status -ne 'READY') { exit 0 }

$ctx = 'handoff.json is READY. End implementation; next step is Git Manager (docs/agent/composer.md): validate, commit_groups, PR, squash merge, DONE.'

@{ additional_context = $ctx } | ConvertTo-Json -Compress
exit 0
