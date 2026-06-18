# Shared: read handoff.json from project root
param(
  [switch]$OnWrite
)

$ErrorActionPreference = 'SilentlyContinue'

$stdin = [Console]::In.ReadToEnd()
if ($OnWrite -and $stdin) {
  try {
    $payload = $stdin | ConvertFrom-Json
    $path = "$($payload.tool_input.path)$($payload.file_path)$($payload.path)"
    if ($path -and $path -notmatch 'handoff\.json') {
      exit 0
    }
  } catch {
    # fall through — still check handoff on disk
  }
}

$root = Get-Location
$handoffPath = Join-Path $root 'handoff.json'

if (-not (Test-Path $handoffPath)) {
  exit 0
}

try {
  $handoff = Get-Content -Path $handoffPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
  exit 0
}

if ($handoff.status -ne 'READY') {
  exit 0
}

$msg = @'
handoff.json status is READY. Git Manager role only (docs/agent/composer.md, reviewer.md).

- No implementation/refactor
- Commit only files_changed / commit_groups
- pre-merge validation, minimal commits, push, PR, squash merge
- Set handoff.json status = DONE when merged
'@

@{ followup_message = $msg.Trim() } | ConvertTo-Json -Compress
exit 0
