# zndi 브랜드 아이콘 → Expo 스토어 에셋 (1024 icon, splash, adaptive, favicon)
param(
  [string]$SourcePath = (Join-Path $PSScriptRoot '..\assets\zndi-icon-source.png')
)

Add-Type -AssemblyName System.Drawing

$assetsDir = (Join-Path $PSScriptRoot '..\assets' | Resolve-Path).Path
$matteBlack = [System.Drawing.Color]::FromArgb(255, 18, 18, 18)

if (-not (Test-Path $SourcePath)) {
  Write-Error "Source not found: $SourcePath"
  exit 1
}

function Save-Resized {
  param(
    [System.Drawing.Image]$Source,
    [string]$Path,
    [int]$Size
  )
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.DrawImage($Source, 0, 0, $Size, $Size)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function Save-Monochrome {
  param(
    [System.Drawing.Image]$Source,
    [string]$Path,
    [int]$Size
  )
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($Source, 0, 0, $Size, $Size)

  for ($x = 0; $x -lt $Size; $x++) {
    for ($y = 0; $y -lt $Size; $y++) {
      $pixel = $bmp.GetPixel($x, $y)
      $lum = 0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B
      if ($lum -gt 40 -and $pixel.A -gt 20) {
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::White)
      } else {
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
      }
    }
  }

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

$source = [System.Drawing.Image]::FromFile((Resolve-Path $SourcePath).Path)

Save-Resized $source (Join-Path $assetsDir 'icon.png') 1024
Save-Resized $source (Join-Path $assetsDir 'android-icon-foreground.png') 1024
Save-Resized $source (Join-Path $assetsDir 'splash-icon.png') 512
Save-Resized $source (Join-Path $assetsDir 'favicon.png') 48
Save-Monochrome $source (Join-Path $assetsDir 'android-icon-monochrome.png') 1024

$bgBmp = New-Object System.Drawing.Bitmap 1024, 1024
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$bgG.Clear($matteBlack)
$bgBmp.Save((Join-Path $assetsDir 'android-icon-background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bgG.Dispose()
$bgBmp.Dispose()
$source.Dispose()

Write-Host "Generated zndi assets in $assetsDir"
