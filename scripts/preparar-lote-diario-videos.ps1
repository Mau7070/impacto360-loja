param(
    [Parameter(Mandatory = $true)]
    [string]$Date,
    [string]$Root = (Get-Location).Path,
    [string]$Ffmpeg = "C:\Users\PMNB\AppData\Local\Temp\impacto360-ffprobe-20260730\node_modules\ffmpeg-static\ffmpeg.exe"
)

$ErrorActionPreference = "Stop"

$rootPath = [System.IO.Path]::GetFullPath($Root)
$calendarPath = Join-Path $rootPath "dados/social-videos-20260730/calendario-3-por-dia.json"
if (-not (Test-Path -LiteralPath $calendarPath -PathType Leaf)) {
    throw "Calendário não encontrado: $calendarPath"
}
if (-not (Test-Path -LiteralPath $Ffmpeg -PathType Leaf)) {
    throw "FFmpeg não encontrado: $Ffmpeg"
}

$calendar = Get-Content -LiteralPath $calendarPath -Raw -Encoding UTF8 | ConvertFrom-Json
$items = @(
    $calendar.schedule |
        Where-Object {
            $_.date -eq $Date -and
            $_.publicationStatus -eq "pronto_para_preparar" -and
            -not [string]::IsNullOrWhiteSpace($_.affiliateLink) -and
            -not [string]::IsNullOrWhiteSpace($_.storeLink)
        } |
        Sort-Object slot
)

if ($items.Count -eq 0) {
    throw "Nenhum vídeo aprovado com link afiliado confirmado para $Date."
}
if ($items.Count -gt 3) {
    throw "O calendário contém mais de três vídeos para $Date."
}

$hashCount = @($items | Group-Object videoSha256 | Where-Object Count -gt 1).Count
if ($hashCount -gt 0) {
    throw "O lote diário contém conteúdo de vídeo duplicado."
}

$outputDir = Join-Path $rootPath "saida-redes-sociais/$Date"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem

$manifest = foreach ($item in $items) {
    $zipPath = [System.IO.Path]::GetFullPath([string]$item.sourceZipPath)
    if (-not (Test-Path -LiteralPath $zipPath -PathType Leaf)) {
        throw "ZIP não encontrado: $zipPath"
    }

    $tempVideo = Join-Path ([System.IO.Path]::GetTempPath()) ("impacto360-social-" + $item.videoSha256 + ".mp4")
    $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $entry = $archive.GetEntry([string]$item.videoEntry)
        if (-not $entry) {
            throw "Vídeo não encontrado no ZIP: $($item.videoEntry)"
        }
        $input = $entry.Open()
        $output = [System.IO.File]::Create($tempVideo)
        try {
            $input.CopyTo($output)
        } finally {
            $output.Dispose()
            $input.Dispose()
        }
    } finally {
        $archive.Dispose()
    }

    $baseName = "{0:D2}-{1:D4}" -f [int]$item.slot, [int]$item.videoNumber
    $outputVideo = Join-Path $outputDir "$baseName.mp4"
    & $Ffmpeg -hide_banner -loglevel error -i $tempVideo `
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" `
        -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p `
        -c:a aac -b:a 128k -movflags +faststart -y $outputVideo
    $encodeExitCode = $LASTEXITCODE
    Remove-Item -LiteralPath $tempVideo -Force -ErrorAction SilentlyContinue
    if ($encodeExitCode -ne 0 -or -not (Test-Path -LiteralPath $outputVideo)) {
        throw "Falha ao preparar o vídeo $($item.videoNumber)."
    }

    $captionFile = Join-Path $outputDir "$baseName.txt"
    $captionText = ([string]$item.caption).Trim()
    $hashtagsLine = (@($item.hashtags) -join " ").Trim()
    if (-not [string]::IsNullOrWhiteSpace($hashtagsLine)) {
        $captionText = "$captionText`r`n`r`n$hashtagsLine"
    }
    Set-Content -LiteralPath $captionFile -Value $captionText -Encoding UTF8

    [pscustomobject]@{
        date = $Date
        slot = $item.slot
        videoNumber = $item.videoNumber
        title = $item.title
        video = $outputVideo
        captionFile = $captionFile
        affiliateLink = $item.affiliateLink
        storeLink = $item.storeLink
        caption = $item.caption
        hashtags = @($item.hashtags)
        sha256 = (Get-FileHash -LiteralPath $outputVideo -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$manifestPath = Join-Path $outputDir "manifesto.json"
@($manifest) | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8
@($manifest) | ConvertTo-Json -Depth 6
