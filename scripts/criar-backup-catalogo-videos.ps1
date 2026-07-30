param(
    [string]$Root = (Get-Location).Path,
    [string]$Stamp = (Get-Date -Format "yyyyMMdd-HHmmss")
)

$ErrorActionPreference = "Stop"

$rootPath = [System.IO.Path]::GetFullPath($Root)
$backupRoot = Join-Path $rootPath "backups"
$backupPath = Join-Path $backupRoot "pre-importacao-videos-$Stamp"

$relativeFiles = @(
    "dados/products.json",
    "dados/catalogo-publico.json",
    "dados/stores.json",
    "dados/fila-revalidacao-precos.json",
    "dados/relatorio-integridade-publicacao.json",
    "pacote-github-pages-pronto/dados/products.json",
    "pacote-github-pages-pronto/dados/catalogo-publico.json",
    "pacote-github-pages-pronto/dados/stores.json",
    "pacote-github-pages-pronto/dados/fila-revalidacao-precos.json",
    "pacote-github-pages-pronto/dados/relatorio-integridade-publicacao.json"
)

New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

$manifest = foreach ($relativeFile in $relativeFiles) {
    $source = Join-Path $rootPath $relativeFile
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        [pscustomobject]@{
            path = $relativeFile.Replace("\", "/")
            status = "ausente"
            bytes = 0
            sha256 = ""
        }
        continue
    }

    $destination = Join-Path $backupPath $relativeFile
    $destinationDirectory = Split-Path -Parent $destination
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination

    $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($sourceHash -ne $destinationHash) {
        throw "Falha de integridade no backup: $relativeFile"
    }

    $item = Get-Item -LiteralPath $source
    [pscustomobject]@{
        path = $relativeFile.Replace("\", "/")
        status = "copiado"
        bytes = $item.Length
        sha256 = $sourceHash
    }
}

$manifestPath = Join-Path $backupPath "manifesto-backup.json"
$manifestDocument = [pscustomobject]@{
    createdAt = (Get-Date).ToString("o")
    root = $rootPath
    backupPath = $backupPath
    copied = @($manifest | Where-Object status -eq "copiado").Count
    missing = @($manifest | Where-Object status -eq "ausente").Count
    files = @($manifest)
}
$manifestDocument | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8

$manifestDocument | ConvertTo-Json -Depth 5
