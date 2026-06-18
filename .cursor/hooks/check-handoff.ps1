# handoff.json status check — stop hook
# READY → followup_message for Git Manager (composer.md)
$ErrorActionPreference = 'SilentlyContinue'

$null = [Console]::In.ReadToEnd()

$root = Get-Location
$handoffPath = Join-Path $root 'handoff.json'

if (-not (Test-Path $handoffPath)) {
  exit 0
}

try {
  $raw = Get-Content -Path $handoffPath -Raw -Encoding UTF8
  $handoff = $raw | ConvertFrom-Json
} catch {
  exit 0
}

if ($handoff.status -ne 'READY') {
  exit 0
}

$followup = @'
handoff.json status is READY. Git Manager 역할만 수행한다 (docs/agent/composer.md, reviewer.md, workflow.md).

- 구현·리팩터 금지
- handoff files_changed / commit_groups만 커밋
- pre-merge validation → 최소 단위 커밋 → push → PR → squash merge
- 완료 후 handoff.json status = DONE
'@

$out = @{ followup_message = $followup.Trim() } | ConvertTo-Json -Compress
Write-Output $out
exit 0
