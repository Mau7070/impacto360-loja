param(
  [string]$InventoryPath = "dados\social-videos-20260730\inventario-videos.json",

  [Parameter(Mandatory = $true)]
  [string]$FfprobePath,

  [string]$OutputDirectory = "dados\social-videos-20260730",

  [int]$CheckpointInterval = 50
)

$ErrorActionPreference = "Stop"

function Convert-Fraction {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value) -or $Value -eq "0/0") { return 0 }
  if ($Value -notmatch "^(-?\d+(?:\.\d+)?)/(-?\d+(?:\.\d+)?)$") {
    return [double]$Value
  }
  $denominator = [double]$Matches[2]
  if ($denominator -eq 0) { return 0 }
  return [math]::Round(([double]$Matches[1]) / $denominator, 3)
}

function Get-ValueOrDefault {
  param(
    $Value,
    $Default
  )
  if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
    return $Default
  }
  return $Value
}

function Write-Outputs {
  param(
    [Collections.Generic.List[object]]$Results,
    [string]$JsonPath,
    [string]$CsvPath
  )

  $items = @($Results | Sort-Object videoNumber, sourceZip)
  $valid = @($items | Where-Object { $_.status -eq "ok" })
  $summary = [ordered]@{
    generatedAt = (Get-Date).ToString("o")
    analyzed = $items.Count
    valid = $valid.Count
    errors = @($items | Where-Object { $_.status -ne "ok" }).Count
    totalDurationSeconds = [math]::Round((($valid | Measure-Object durationSeconds -Sum).Sum), 2)
    totalDurationHours = [math]::Round((($valid | Measure-Object durationSeconds -Sum).Sum) / 3600, 2)
    orientationCounts = [ordered]@{}
    codecCounts = [ordered]@{}
    resolutionCounts = [ordered]@{}
  }
  foreach ($group in @($valid | Group-Object orientation | Sort-Object Name)) {
    $summary.orientationCounts[$group.Name] = $group.Count
  }
  foreach ($group in @($valid | Group-Object videoCodec | Sort-Object Name)) {
    $summary.codecCounts[$group.Name] = $group.Count
  }
  foreach ($group in @($valid | Group-Object resolution | Sort-Object Count -Descending | Select-Object -First 30)) {
    $summary.resolutionCounts[$group.Name] = $group.Count
  }
  [ordered]@{ summary = $summary; items = $items } |
    ConvertTo-Json -Depth 7 |
    Set-Content -LiteralPath $JsonPath -Encoding utf8
  $items | Export-Csv -LiteralPath $CsvPath -NoTypeInformation -Encoding utf8
}

$inventoryFile = (Resolve-Path -LiteralPath $InventoryPath).Path
$probeFile = (Resolve-Path -LiteralPath $FfprobePath).Path
$repoRoot = (Resolve-Path -LiteralPath ".").Path
$outputRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot $OutputDirectory))
if (-not $outputRoot.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
  throw "O diretorio de saida precisa ficar dentro do repositorio: $outputRoot"
}
[IO.Directory]::CreateDirectory($outputRoot) | Out-Null

$tempRoot = [IO.Path]::Combine([IO.Path]::GetTempPath(), "impacto360-video-metadata-20260730")
$resolvedTempRoot = [IO.Path]::GetFullPath($tempRoot)
$allowedTempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
if (-not $resolvedTempRoot.StartsWith($allowedTempRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Diretorio temporario invalido: $resolvedTempRoot"
}
[IO.Directory]::CreateDirectory($resolvedTempRoot) | Out-Null

$jsonPath = Join-Path $outputRoot "metadata-videos.json"
$csvPath = Join-Path $outputRoot "metadata-videos.csv"
$inventory = Get-Content -LiteralPath $inventoryFile -Raw | ConvertFrom-Json
$videoItems = @($inventory.items | Where-Object hasVideo | Sort-Object sourceZip, videoNumber)

$results = [Collections.Generic.List[object]]::new()
$completed = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
if (Test-Path -LiteralPath $jsonPath -PathType Leaf) {
  $existing = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
  foreach ($item in @($existing.items)) {
    $results.Add($item)
    [void]$completed.Add("$($item.sourceZip)|$($item.videoEntry)")
  }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$processedSinceCheckpoint = 0
$zipGroups = $videoItems | Group-Object sourceZipPath
foreach ($zipGroup in $zipGroups) {
  $pending = @($zipGroup.Group | Where-Object {
    -not $completed.Contains("$($_.sourceZip)|$($_.videoEntry)")
  })
  if (-not $pending.Count) { continue }

  Write-Host "Analisando $([IO.Path]::GetFileName($zipGroup.Name)): $($pending.Count) videos pendentes"
  $archive = [IO.Compression.ZipFile]::OpenRead($zipGroup.Name)
  try {
    $entryMap = @{}
    foreach ($entry in $archive.Entries) {
      $entryMap[$entry.FullName] = $entry
    }

    foreach ($item in $pending) {
      $entry = $entryMap[$item.videoEntry]
      $extension = [IO.Path]::GetExtension($item.videoEntry)
      $temporaryFile = Join-Path $resolvedTempRoot ("video-" + $item.videoNumber + "-" + [guid]::NewGuid().ToString("N") + $extension)
      $resolvedTemporaryFile = [IO.Path]::GetFullPath($temporaryFile)
      if (-not $resolvedTemporaryFile.StartsWith($resolvedTempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Arquivo temporario fora do diretorio permitido: $resolvedTemporaryFile"
      }

      try {
        $inputStream = $entry.Open()
        $outputStream = [IO.File]::Create($resolvedTemporaryFile)
        try {
          $inputStream.CopyTo($outputStream)
        } finally {
          $outputStream.Dispose()
          $inputStream.Dispose()
        }

        $probeOutput = & $probeFile -v error `
          -show_entries "format=duration,bit_rate,size:stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels" `
          -of json -- $resolvedTemporaryFile 2>&1
        if ($LASTEXITCODE -ne 0) {
          throw "ffprobe retornou codigo ${LASTEXITCODE}: $($probeOutput -join ' ')"
        }
        $metadata = ($probeOutput -join [Environment]::NewLine) | ConvertFrom-Json
        $videoStream = @($metadata.streams | Where-Object codec_type -eq "video") | Select-Object -First 1
        $audioStream = @($metadata.streams | Where-Object codec_type -eq "audio") | Select-Object -First 1
        $width = [int](Get-ValueOrDefault -Value $videoStream.width -Default 0)
        $height = [int](Get-ValueOrDefault -Value $videoStream.height -Default 0)
        $frameRate = Get-ValueOrDefault -Value $videoStream.avg_frame_rate -Default $videoStream.r_frame_rate
        $orientation = if ($width -gt $height) { "horizontal" } elseif ($height -gt $width) { "vertical" } elseif ($width) { "quadrado" } else { "desconhecida" }
        $result = [pscustomobject][ordered]@{
          sourceZip = $item.sourceZip
          videoNumber = $item.videoNumber
          title = $item.title
          videoEntry = $item.videoEntry
          videoSha256 = $item.videoSha256
          status = "ok"
          durationSeconds = [math]::Round([double](Get-ValueOrDefault -Value $metadata.format.duration -Default 0), 3)
          width = $width
          height = $height
          resolution = if ($width -and $height) { "${width}x${height}" } else { "" }
          orientation = $orientation
          fps = Convert-Fraction -Value ([string]$frameRate)
          videoCodec = [string](Get-ValueOrDefault -Value $videoStream.codec_name -Default "")
          audioCodec = [string](Get-ValueOrDefault -Value $audioStream.codec_name -Default "")
          audioChannels = [int](Get-ValueOrDefault -Value $audioStream.channels -Default 0)
          audioSampleRate = [int](Get-ValueOrDefault -Value $audioStream.sample_rate -Default 0)
          bitRate = [long](Get-ValueOrDefault -Value $metadata.format.bit_rate -Default 0)
          bytes = [long](Get-ValueOrDefault -Value $metadata.format.size -Default $item.videoBytes)
          error = ""
        }
      } catch {
        $result = [pscustomobject][ordered]@{
          sourceZip = $item.sourceZip
          videoNumber = $item.videoNumber
          title = $item.title
          videoEntry = $item.videoEntry
          videoSha256 = $item.videoSha256
          status = "erro"
          durationSeconds = 0
          width = 0
          height = 0
          resolution = ""
          orientation = "desconhecida"
          fps = 0
          videoCodec = ""
          audioCodec = ""
          audioChannels = 0
          audioSampleRate = 0
          bitRate = 0
          bytes = [long]$item.videoBytes
          error = $_.Exception.Message
        }
      } finally {
        if (Test-Path -LiteralPath $resolvedTemporaryFile -PathType Leaf) {
          Remove-Item -LiteralPath $resolvedTemporaryFile -Force
        }
      }

      $results.Add($result)
      [void]$completed.Add("$($item.sourceZip)|$($item.videoEntry)")
      $processedSinceCheckpoint += 1
      if ($processedSinceCheckpoint -ge $CheckpointInterval) {
        Write-Outputs -Results $results -JsonPath $jsonPath -CsvPath $csvPath
        Write-Host "  Progresso: $($results.Count)/$($videoItems.Count)"
        $processedSinceCheckpoint = 0
      }
    }
  } finally {
    $archive.Dispose()
  }
}

Write-Outputs -Results $results -JsonPath $jsonPath -CsvPath $csvPath
$final = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
Write-Host ""
Write-Host "Analise concluida:"
Write-Host "  Videos: $($final.summary.analyzed)"
Write-Host "  Horas: $($final.summary.totalDurationHours)"
Write-Host "  Erros: $($final.summary.errors)"
Write-Host "  JSON: $jsonPath"
Write-Host "  CSV: $csvPath"
