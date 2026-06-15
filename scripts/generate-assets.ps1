# Routiner 스토어 에셋 생성 (1024 icon, splash, adaptive, favicon)
Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot '..\assets' | Resolve-Path
$ink = [System.Drawing.Color]::FromArgb(255, 10, 10, 10)
$bg = [System.Drawing.Color]::FromArgb(255, 230, 244, 254)
$white = [System.Drawing.Color]::White

function Draw-Mark {
    param(
        [System.Drawing.Graphics]$G,
        [int]$Size,
        [double]$PaddingRatio,
        [System.Drawing.Color]$Fill,
        [System.Drawing.Color]$Letter,
        [switch]$Monochrome
    )
    $G.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $G.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $pad = [int]($Size * $PaddingRatio)
    $rect = New-Object System.Drawing.Rectangle $pad, $pad, ($Size - 2 * $pad), ($Size - 2 * $pad)

    if ($Monochrome) {
        $brush = New-Object System.Drawing.SolidBrush $white
    } else {
        $brush = New-Object System.Drawing.SolidBrush $Fill
    }
    $G.FillEllipse($brush, $rect)
    $brush.Dispose()

    $fontSize = [int]($Size * 0.42)
    $font = New-Object System.Drawing.Font 'Segoe UI', $fontSize, ([System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $letterBrush = New-Object System.Drawing.SolidBrush $(if ($Monochrome) { $ink } else { $Letter })
    $G.DrawString('R', $font, $letterBrush, [System.Drawing.RectangleF]$rect, $sf)
    $letterBrush.Dispose()
    $font.Dispose()
}

function Save-Icon {
    param([string]$Path, [int]$Size, [double]$PaddingRatio, [System.Drawing.Color]$Canvas, [switch]$Transparent, [switch]$Monochrome)
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    if ($Transparent) {
        $g.Clear([System.Drawing.Color]::Transparent)
        Draw-Mark $g $Size $PaddingRatio $ink $white -Monochrome:$Monochrome
    } else {
        $g.Clear($Canvas)
        Draw-Mark $g $Size $PaddingRatio $ink $white
    }
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Save-Icon (Join-Path $assetsDir 'icon.png') 1024 0.12 $bg
Save-Icon (Join-Path $assetsDir 'android-icon-foreground.png') 1024 0.18 $bg -Transparent
Save-Icon (Join-Path $assetsDir 'android-icon-monochrome.png') 1024 0.18 $bg -Transparent -Monochrome
Save-Icon (Join-Path $assetsDir 'splash-icon.png') 512 0.15 $bg -Transparent
Save-Icon (Join-Path $assetsDir 'favicon.png') 48 0.1 $bg

# adaptive background (solid)
$bgBmp = New-Object System.Drawing.Bitmap 1024, 1024
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$bgG.Clear($bg)
$bgBmp.Save((Join-Path $assetsDir 'android-icon-background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bgG.Dispose()
$bgBmp.Dispose()

Write-Host "Generated assets in $assetsDir"
