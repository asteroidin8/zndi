# stop hook — handoff READY → followup_message (Git Manager)
$ErrorActionPreference = 'SilentlyContinue'

$null = [Console]::In.ReadToEnd()

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$handoffPath = Join-Path $projectRoot 'handoff.json'

if (-not (Test-Path $handoffPath)) { exit 0 }

try {
  $handoff = Get-Content -Path $handoffPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
  exit 0
}

if ($handoff.status -ne 'READY') { exit 0 }

$msg = @'
handoff.json status is READY. Git Manager role only (docs/agent/composer.md, reviewer.md).

- No implementation/refactor
- Commit only files_changed / commit_groups
- pre-merge validation, minimal commits, push, PR, squash merge
- Set handoff.json status = DONE when merged
'@

@{ followup_message = $msg.Trim() } | ConvertTo-Json -Compress
exit 0
