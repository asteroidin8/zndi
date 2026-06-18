# sessionStart: if handoff READY, inject context at chat open
$ErrorActionPreference = 'SilentlyContinue'

$null = [Console]::In.ReadToEnd()

$handoffPath = Join-Path (Get-Location) 'handoff.json'
if (-not (Test-Path $handoffPath)) { exit 0 }

try {
  $handoff = Get-Content -Path $handoffPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch { exit 0 }

if ($handoff.status -ne 'READY') { exit 0 }

$ctx = @'
handoff.json status is READY (pending Git Manager). On this session, run docs/agent/composer.md first unless the user asks otherwise: validate diff, commit_groups, push, PR, squash merge, set DONE.
'@

@{ additional_context = $ctx.Trim() } | ConvertTo-Json -Compress
exit 0
