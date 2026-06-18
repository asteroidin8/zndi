# postToolUse: after Write — if handoff.json is READY, inject Git Manager context
$ErrorActionPreference = 'SilentlyContinue'

$stdin = [Console]::In.ReadToEnd()
if ($stdin) {
  try {
    $payload = $stdin | ConvertFrom-Json
    $blob = ($payload | ConvertTo-Json -Compress)
    if ($blob -notmatch 'handoff\.json') {
      exit 0
    }
  } catch { }
}

$handoffPath = Join-Path (Get-Location) 'handoff.json'
if (-not (Test-Path $handoffPath)) { exit 0 }

try {
  $handoff = Get-Content -Path $handoffPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch { exit 0 }

if ($handoff.status -ne 'READY') { exit 0 }

$ctx = 'handoff.json is READY. End implementation; next step is Git Manager (docs/agent/composer.md): validate, commit_groups, PR, squash merge, DONE.'

@{ additional_context = $ctx } | ConvertTo-Json -Compress
exit 0
