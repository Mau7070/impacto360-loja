param(
  [string]$AgendaPath = "C:\Users\PMNB\Documents\Codex\2026-07-28\files-mentioned-by-the-user-atue\outputs\agenda-social-2026-08-04-a-13\agenda.json",
  [string]$FfmpegPath = "C:\Users\PMNB\AppData\Local\Temp\impacto360-ffprobe-20260730\node_modules\ffmpeg-static\ffmpeg.exe"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $AgendaPath)) { throw "Agenda nao encontrada: $AgendaPath" }
if (-not (Test-Path -LiteralPath $FfmpegPath)) { throw "ffmpeg nao encontrado: $FfmpegPath" }

$agenda = Get-Content -Raw -LiteralPath $AgendaPath | ConvertFrom-Json
$campaignRoot = Split-Path -Parent $AgendaPath
$sourceRoot = Join-Path $campaignRoot "originais"
New-Item -ItemType Directory -Force -Path $sourceRoot | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($slot in $agenda.slots) {
  $number = [int]$slot.videoNumber
  $sourceFile = Join-Path $sourceRoot ("video-{0:D4}.mp4" -f $number)
  $destination = [string]$slot.videoFile
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null

  if (-not (Test-Path -LiteralPath $sourceFile)) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead([string]$slot.sourceZipPath)
    try {
      $pattern = "/VIDEO 0*$number/.*\.mp4$"
      $entry = $zip.Entries | Where-Object { $_.FullName.Replace("\", "/") -match $pattern } | Select-Object -First 1
      if (-not $entry) { throw "Video $number nao encontrado no ZIP" }
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $sourceFile, $true)
    }
    finally { $zip.Dispose() }
  }

  if (-not (Test-Path -LiteralPath $destination) -or (Get-Item -LiteralPath $destination).Length -eq 0) {
    & $FfmpegPath -hide_banner -loglevel error -y -i $sourceFile `
      -map 0:v:0 -map 0:a? `
      -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1" `
      -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -profile:v high -level 4.1 `
      -c:a aac -b:a 160k -ar 48000 -movflags +faststart -shortest $destination
    if ($LASTEXITCODE -ne 0) { throw "Falha ao preparar video $number" }
  }

  $file = Get-Item -LiteralPath $destination
  if ($file.Length -le 0) { throw "Video final vazio: $destination" }
  Write-Host ("OK {0} -> {1:N1} MB" -f $number, ($file.Length / 1MB))
}

Write-Host "Midias preparadas: $($agenda.slots.Count)"
