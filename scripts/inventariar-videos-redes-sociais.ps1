param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDirectory,

  [string]$OutputDirectory = "dados\social-videos-20260730",

  [switch]$HashVideos
)

$ErrorActionPreference = "Stop"

function Normalize-Title {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  $decomposed = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = [Text.StringBuilder]::new()
  foreach ($character in $decomposed.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($character)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($character)
    }
  }

  return (($builder.ToString().Normalize([Text.NormalizationForm]::FormC).ToLowerInvariant() `
    -replace "[^a-z0-9]+", " ") `
    -replace "\s+", " ").Trim()
}

function Get-Sha256 {
  param([System.IO.Stream]$Stream)

  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    return ([BitConverter]::ToString($sha.ComputeHash($Stream))).Replace("-", "").ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Read-EntryText {
  param([System.IO.Compression.ZipArchiveEntry]$Entry)

  $stream = $Entry.Open()
  $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::UTF8, $true)
  try {
    return $reader.ReadToEnd().Trim()
  } finally {
    $reader.Dispose()
    $stream.Dispose()
  }
}

function Get-Marketplace {
  param([string]$Url)

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return "sem_link"
  }

  try {
    $hostName = ([Uri]$Url).Host.ToLowerInvariant()
  } catch {
    return "link_invalido"
  }

  if ($hostName -match "(^|\.)shopee\.com\.br$") { return "shopee" }
  if ($hostName -match "(^|\.)mercadolivre\.com\.br$|(^|\.)meli\.la$") { return "mercado_livre" }
  if ($hostName -match "(^|\.)amazon\.com\.br$|(^|\.)amzn\.to$") { return "amazon" }
  return "outro"
}

$sourceRoot = (Resolve-Path -LiteralPath $SourceDirectory).Path
$outputRoot = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path $OutputDirectory))
$repoRoot = (Resolve-Path -LiteralPath ".").Path
if (-not $outputRoot.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
  throw "O diretorio de saida precisa ficar dentro do repositorio: $outputRoot"
}

[IO.Directory]::CreateDirectory($outputRoot) | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipFiles = @(Get-ChildItem -LiteralPath $sourceRoot -Filter "*.zip" -File | Sort-Object Name)
if (-not $zipFiles.Count) {
  throw "Nenhum arquivo ZIP encontrado em $sourceRoot"
}

$items = [Collections.Generic.List[object]]::new()
$zipSummaries = [Collections.Generic.List[object]]::new()

foreach ($zipFile in $zipFiles) {
  Write-Host "Lendo $($zipFile.Name)..."
  $archive = [IO.Compression.ZipFile]::OpenRead($zipFile.FullName)
  try {
    $entries = @($archive.Entries | Where-Object { $_.Name })
    $grouped = $entries | Group-Object {
      $match = [regex]::Match($_.FullName, "(?i)(.+?/VIDEO\s+\d+)/")
      if ($match.Success) { $match.Groups[1].Value } else { Split-Path $_.FullName -Parent }
    }

    $zipVideoCount = 0
    $zipTextCount = 0
    foreach ($group in $grouped) {
      $videoEntries = @($group.Group | Where-Object {
        [IO.Path]::GetExtension($_.Name) -match "(?i)^\.(mp4|mov|m4v|webm|avi|mkv)$"
      } | Sort-Object FullName)
      $textEntries = @($group.Group | Where-Object {
        [IO.Path]::GetExtension($_.Name) -ieq ".txt"
      } | Sort-Object FullName)

      if (-not $videoEntries.Count -and -not $textEntries.Count) {
        continue
      }

      $zipVideoCount += $videoEntries.Count
      $zipTextCount += $textEntries.Count
      $folderMatch = [regex]::Match($group.Name, "(?i)VIDEO\s+(\d+)")
      $videoNumber = if ($folderMatch.Success) { [int]$folderMatch.Groups[1].Value } else { $null }
      $videoEntry = $videoEntries | Select-Object -First 1
      $textEntry = $textEntries | Select-Object -First 1
      $title = if ($videoEntry) {
        [IO.Path]::GetFileNameWithoutExtension($videoEntry.Name)
      } else {
        "VIDEO " + $videoNumber
      }
      $sourceUrl = if ($textEntry) { (Read-EntryText -Entry $textEntry) -replace "\s+", "" } else { "" }
      $videoHash = ""
      if ($HashVideos -and $videoEntry) {
        $videoStream = $videoEntry.Open()
        try {
          $videoHash = Get-Sha256 -Stream $videoStream
        } finally {
          $videoStream.Dispose()
        }
      }

      $items.Add([pscustomobject][ordered]@{
        sourceZip = $zipFile.Name
        sourceZipPath = $zipFile.FullName
        sourceFolder = $group.Name
        videoNumber = $videoNumber
        title = $title
        normalizedTitle = Normalize-Title -Value $title
        videoEntry = if ($videoEntry) { $videoEntry.FullName } else { "" }
        videoBytes = if ($videoEntry) { [long]$videoEntry.Length } else { 0 }
        videoSha256 = $videoHash
        textEntry = if ($textEntry) { $textEntry.FullName } else { "" }
        sourceUrl = $sourceUrl
        sourceMarketplace = Get-Marketplace -Url $sourceUrl
        hasVideo = [bool]$videoEntry
        hasText = [bool]$textEntry
      })
    }

    $zipSummaries.Add([pscustomobject][ordered]@{
      zip = $zipFile.Name
      zipBytes = [long]$zipFile.Length
      folders = @($grouped).Count
      videos = $zipVideoCount
      texts = $zipTextCount
    })
  } finally {
    $archive.Dispose()
  }
}

$sortedItems = @($items | Sort-Object @{ Expression = "videoNumber"; Ascending = $true }, sourceZip)
$titleDuplicateGroups = @(
  $sortedItems |
    Where-Object { $_.normalizedTitle } |
    Group-Object normalizedTitle |
    Where-Object Count -gt 1 |
    Sort-Object Count -Descending
)
$contentDuplicateGroups = @(
  $sortedItems |
    Where-Object { $_.videoSha256 } |
    Group-Object videoSha256 |
    Where-Object Count -gt 1 |
    Sort-Object Count -Descending
)

$summary = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  sourceDirectory = $sourceRoot
  zipCount = $zipFiles.Count
  recordCount = $sortedItems.Count
  videoCount = @($sortedItems | Where-Object hasVideo).Count
  textCount = @($sortedItems | Where-Object hasText).Count
  missingVideoCount = @($sortedItems | Where-Object { -not $_.hasVideo }).Count
  missingTextCount = @($sortedItems | Where-Object { -not $_.hasText }).Count
  invalidOrMissingUrlCount = @($sortedItems | Where-Object { $_.sourceMarketplace -in @("sem_link", "link_invalido") }).Count
  marketplaceCounts = [ordered]@{}
  exactTitleDuplicateGroups = $titleDuplicateGroups.Count
  exactContentDuplicateGroups = $contentDuplicateGroups.Count
  hashedVideos = [bool]$HashVideos
}

foreach ($marketplaceGroup in @($sortedItems | Group-Object sourceMarketplace | Sort-Object Name)) {
  $summary.marketplaceCounts[$marketplaceGroup.Name] = $marketplaceGroup.Count
}

$inventory = [ordered]@{
  summary = $summary
  zipSummaries = @($zipSummaries)
  exactTitleDuplicates = @(
    $titleDuplicateGroups | ForEach-Object {
      [ordered]@{
        normalizedTitle = $_.Name
        count = $_.Count
        videoNumbers = @($_.Group.videoNumber)
        titles = @($_.Group.title)
      }
    }
  )
  exactContentDuplicates = @(
    $contentDuplicateGroups | ForEach-Object {
      [ordered]@{
        sha256 = $_.Name
        count = $_.Count
        videoNumbers = @($_.Group.videoNumber)
        titles = @($_.Group.title)
      }
    }
  )
  items = $sortedItems
}

$jsonPath = Join-Path $outputRoot "inventario-videos.json"
$csvPath = Join-Path $outputRoot "inventario-videos.csv"
$reportPath = Join-Path $outputRoot "relatorio-inventario.md"

$inventory | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding utf8
$sortedItems | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding utf8

$report = [Collections.Generic.List[string]]::new()
$report.Add("# Inventario de videos para redes sociais")
$report.Add("")
$report.Add("- Gerado em: $($summary.generatedAt)")
$report.Add("- ZIPs analisados: $($summary.zipCount)")
$report.Add("- Registros: $($summary.recordCount)")
$report.Add("- Videos: $($summary.videoCount)")
$report.Add("- TXT: $($summary.textCount)")
$report.Add("- Sem video: $($summary.missingVideoCount)")
$report.Add("- Sem TXT: $($summary.missingTextCount)")
$report.Add("- Link ausente ou invalido: $($summary.invalidOrMissingUrlCount)")
$report.Add("- Grupos com titulo exatamente repetido: $($summary.exactTitleDuplicateGroups)")
$report.Add("- Grupos com video exatamente repetido: $($summary.exactContentDuplicateGroups)")
$report.Add("")
$report.Add("## Marketplaces dos links de origem")
$report.Add("")
foreach ($key in $summary.marketplaceCounts.Keys) {
  $report.Add("- ${key}: $($summary.marketplaceCounts[$key])")
}
$report.Add("")
$report.Add("## Arquivos")
$report.Add("")
$report.Add("- JSON: inventario-videos.json")
$report.Add("- CSV: inventario-videos.csv")
$report.Add("")
$report.Add("> Os links de origem ainda nao sao considerados links afiliados. A publicacao depende de verificacao individual do produto e do link.")

$report -join [Environment]::NewLine | Set-Content -LiteralPath $reportPath -Encoding utf8

Write-Host ""
Write-Host "Inventario concluido:"
Write-Host "  JSON: $jsonPath"
Write-Host "  CSV: $csvPath"
Write-Host "  Relatorio: $reportPath"
Write-Host "  Videos: $($summary.videoCount)"
Write-Host "  Duplicatas por conteudo: $($summary.exactContentDuplicateGroups)"
