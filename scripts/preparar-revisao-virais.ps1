param(
  [Parameter(Mandatory = $true)]
  [string]$VideoNumbers,
  [string]$CandidatesPath = "dados/social-videos-20260730/candidatos-virais.json",
  [string]$OutputDirectory = "outputs/agenda-social-2026-08-04-a-13/revisao",
  [string]$FfmpegPath = "C:\Users\PMNB\AppData\Local\Temp\impacto360-ffprobe-20260730\node_modules\ffmpeg-static\ffmpeg.exe"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$candidateFile = Join-Path $repoRoot $CandidatesPath
$outputRoot = Join-Path $repoRoot $OutputDirectory
$videoRoot = Join-Path $outputRoot "videos"
$frameRoot = Join-Path $outputRoot "quadros"
$sheetRoot = Join-Path $outputRoot "comparativos"
$productImageRoot = Join-Path $outputRoot "imagens-produtos"

if (-not (Test-Path -LiteralPath $candidateFile)) { throw "Arquivo de candidatos nao encontrado: $candidateFile" }
if (-not (Test-Path -LiteralPath $FfmpegPath)) { throw "ffmpeg nao encontrado: $FfmpegPath" }

New-Item -ItemType Directory -Force -Path $videoRoot, $frameRoot, $sheetRoot, $productImageRoot | Out-Null
$numbers = $VideoNumbers -split "[,; ]+" | Where-Object { $_ } | ForEach-Object { [int]$_ }
$data = Get-Content -Raw -LiteralPath $candidateFile | ConvertFrom-Json
$selected = @($data.candidates | Where-Object { $numbers -contains [int]$_.videoNumber })

Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($candidate in $selected) {
  $number = [int]$candidate.videoNumber
  $prefix = "video-{0:D4}" -f $number
  $videoPath = Join-Path $videoRoot "$prefix.mp4"
  $candidateFrameRoot = Join-Path $frameRoot $prefix
  New-Item -ItemType Directory -Force -Path $candidateFrameRoot | Out-Null

  if (-not (Test-Path -LiteralPath $videoPath)) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($candidate.sourceZipPath)
    try {
      $videoPattern = "/VIDEO 0*$number/.*\.mp4$"
      $entry = $zip.Entries | Where-Object { $_.FullName.Replace("\", "/") -match $videoPattern } | Select-Object -First 1
      if (-not $entry) { throw "Video $number nao encontrado no ZIP: $($candidate.videoEntry)" }
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $videoPath, $true)
    }
    finally { $zip.Dispose() }
  }

  $duration = [double]$candidate.durationSeconds
  $times = @(0.15, 0.5, 0.85) | ForEach-Object { [Math]::Max(0.2, [Math]::Round($duration * $_, 3)) }
  $frames = @()
  for ($i = 0; $i -lt $times.Count; $i++) {
    $frame = Join-Path $candidateFrameRoot ("quadro-{0}.jpg" -f ($i + 1))
    & $FfmpegPath -hide_banner -loglevel error -y -ss $times[$i] -i $videoPath -frames:v 1 -q:v 2 $frame
    if ($LASTEXITCODE -ne 0) { throw "Falha ao extrair quadro do video $number" }
    $frames += $frame
  }

  $imageValue = [string]$candidate.product.image
  if ($imageValue -match "^https?://") {
    $productImage = Join-Path $productImageRoot "$prefix.webp"
    if (-not (Test-Path -LiteralPath $productImage)) {
      Invoke-WebRequest -UseBasicParsing -Uri $imageValue -OutFile $productImage
    }
  }
  elseif ([System.IO.Path]::IsPathRooted($imageValue)) {
    $productImage = $imageValue
  }
  else {
    $productImage = Join-Path $repoRoot ($imageValue -replace "^[/\\]+", "")
  }
  if (-not (Test-Path -LiteralPath $productImage)) { throw "Imagem do produto nao encontrada para o video $number`: $productImage" }

  $sheet = Join-Path $sheetRoot "$prefix.jpg"
  $filter = "[0:v]scale=360:600:force_original_aspect_ratio=decrease,pad=360:600:(ow-iw)/2:(oh-ih)/2:color=white[p];" +
    "[1:v]scale=360:600:force_original_aspect_ratio=decrease,pad=360:600:(ow-iw)/2:(oh-ih)/2:color=white[f1];" +
    "[2:v]scale=360:600:force_original_aspect_ratio=decrease,pad=360:600:(ow-iw)/2:(oh-ih)/2:color=white[f2];" +
    "[3:v]scale=360:600:force_original_aspect_ratio=decrease,pad=360:600:(ow-iw)/2:(oh-ih)/2:color=white[f3];" +
    "[p][f1][f2][f3]hstack=inputs=4[out]"
  & $FfmpegPath -hide_banner -loglevel error -y -i $productImage -i $frames[0] -i $frames[1] -i $frames[2] -filter_complex $filter -map "[out]" -frames:v 1 -q:v 2 $sheet
  if ($LASTEXITCODE -ne 0) { throw "Falha ao montar comparativo do video $number" }

  Write-Host "OK video $number -> $sheet"
}

$selected | Select-Object videoNumber, viralScore, matchScore, matchMargin, title, @{Name="product";Expression={$_.product.name}}, @{Name="shortUrl";Expression={$_.product.shortUrl}} |
  ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $outputRoot "indice-revisao.json")

Write-Host "Comparativos gerados: $($selected.Count)"
