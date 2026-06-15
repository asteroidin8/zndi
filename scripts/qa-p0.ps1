# P0 로컬 QA — EAS 빌드 전 자동 검증
$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot '..' | Resolve-Path
Set-Location $root

Write-Host '== tsc =='
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '== asset files =='
$required = @(
    'assets/icon.png',
    'assets/splash-icon.png',
    'assets/android-icon-foreground.png',
    'assets/android-icon-background.png',
    'assets/android-icon-monochrome.png',
    'assets/favicon.png'
)
foreach ($f in $required) {
    if (-not (Test-Path $f)) { throw "Missing $f" }
    $len = (Get-Item $f).Length
    if ($len -lt 100) { throw "$f too small ($len bytes)" }
    Write-Host "  OK $f ($len bytes)"
}

Write-Host '== app.json =='
$json = Get-Content app.json -Raw | ConvertFrom-Json
if (-not $json.expo.ios.bundleIdentifier) { throw 'missing ios.bundleIdentifier' }
if (-not $json.expo.android.package) { throw 'missing android.package' }
Write-Host '  OK bundle ids'

Write-Host 'P0 local QA passed'
