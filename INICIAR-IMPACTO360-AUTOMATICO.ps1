$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $ProjectRoot "logs"
$ServerLog = Join-Path $LogDir "servidor-impacto360.log"
$ErrorLog = Join-Path $LogDir "erro-impacto360.log"
$Url = "http://localhost:5173"
$Port = 5173

function Write-ImpactoLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    Write-Host $line
    Add-Content -LiteralPath $ServerLog -Value $line -Encoding UTF8
}

function Write-ImpactoError {
    param([string]$Message)

    $line = "[{0}] [ERRO] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Write-Host $line -ForegroundColor Red
    Add-Content -LiteralPath $ErrorLog -Value $line -Encoding UTF8
}

function Get-PortOwner {
    param([int]$LocalPort)

    try {
        return Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
    } catch {
        return $null
    }
}

function Test-LocalSite {
    param([string]$Address)

    try {
        Invoke-WebRequest -Uri $Address -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
}

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
Set-Location -LiteralPath $ProjectRoot

Write-ImpactoLog "Iniciando Shopping Impacto 360 em $ProjectRoot"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-ImpactoError "Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e reinicie o computador."
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-ImpactoError "npm nao encontrado. Reinstale o Node.js LTS em https://nodejs.org e reinicie o computador."
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "package.json"))) {
    Write-ImpactoError "package.json nao encontrado na pasta do projeto: $ProjectRoot"
    Write-ImpactoError "Coloque estes scripts na raiz do projeto React/Vite antes de iniciar o servidor."
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "node_modules"))) {
    Write-ImpactoLog "node_modules nao encontrado. Executando npm install..."
    & npm install 1>> $ServerLog 2>> $ErrorLog
    if ($LASTEXITCODE -ne 0) {
        Write-ImpactoError "npm install falhou. Veja o arquivo logs/erro-impacto360.log."
        exit $LASTEXITCODE
    }
    Write-ImpactoLog "Dependencias instaladas com sucesso."
}

$connection = Get-PortOwner -LocalPort $Port
if ($connection) {
    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
    $commandLine = if ($processInfo) { $processInfo.CommandLine } else { "" }
    $isNodeOrVite = $process -and $process.ProcessName -match "^(node|npm|vite)$"
    $isLikelyOldServer = $isNodeOrVite -and (
        $process.ProcessName -match "^(npm|vite)$" -or
        $commandLine -like "*$ProjectRoot*" -or
        $commandLine -match "(?i)\bvite\b"
    )

    if ($process -and $isLikelyOldServer) {
        Write-ImpactoLog "Porta $Port ocupada por processo antigo ($($process.ProcessName), PID $($process.Id)). Encerrando com seguranca..."
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Seconds 2
    } elseif ($process) {
        Write-ImpactoError "Porta $Port ocupada por outro programa ($($process.ProcessName), PID $($process.Id)). Nao vou encerrar esse processo."
        exit 1
    } else {
        Write-ImpactoError "Porta $Port ocupada, mas nao foi possivel identificar o processo. Verifique manualmente."
        exit 1
    }
}

$escapedRoot = $ProjectRoot.Replace("'", "''")
$escapedServerLog = $ServerLog.Replace("'", "''")
$escapedErrorLog = $ErrorLog.Replace("'", "''")
$serverCommand = @"
Set-Location -LiteralPath '$escapedRoot'
npm run dev -- --host 127.0.0.1 --port 5173 1>> '$escapedServerLog' 2>> '$escapedErrorLog'
"@

Write-ImpactoLog "Iniciando servidor local na porta $Port..."
$serverProcess = Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $serverCommand
) -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru

Write-ImpactoLog "Servidor iniciado em segundo plano. PID auxiliar: $($serverProcess.Id)"
Write-ImpactoLog "Aguardando resposta em $Url..."

$online = $false
for ($i = 1; $i -le 30; $i++) {
    if (Test-LocalSite -Address $Url) {
        $online = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($online) {
    Write-ImpactoLog "Shopping Impacto 360 ativo em $Url"
    Start-Process $Url | Out-Null
} else {
    Write-ImpactoError "Servidor iniciado, mas ainda nao respondeu em $Url. Veja os logs para diagnostico."
    exit 1
}
