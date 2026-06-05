$ErrorActionPreference = "SilentlyContinue"

$TaskName = "Impacto360 - Iniciar Servidor dos Robos"
$Port = 5173
$Url = "http://localhost:5173"

function Test-LocalSite {
    param([string]$Address)

    try {
        Invoke-WebRequest -Uri $Address -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
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

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
$connection = Get-PortOwner -LocalPort $Port
$portProcess = $null
if ($connection) {
    $portProcess = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
}
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$siteOnline = Test-LocalSite -Address $Url

$status = "DESLIGADO"
if (-not $nodeCommand) {
    $status = "NODE NAO INSTALADO"
} elseif ($connection -and $portProcess -and $portProcess.ProcessName -notmatch "^(node|npm|vite)$" -and -not $siteOnline) {
    $status = "PORTA OCUPADA"
} elseif ($siteOnline) {
    $status = "ATIVO"
} elseif ($task -or $connection -or $nodeProcesses) {
    $status = "ERRO"
}

Write-Host "Diagnostico geral: $status"
Write-Host ""
Write-Host "Tarefa agendada: $(if ($task) { 'EXISTE' } else { 'NAO EXISTE' })"
Write-Host "Node.js: $(if ($nodeCommand) { 'INSTALADO' } else { 'NAO INSTALADO' })"
Write-Host "Processos node.exe: $(if ($nodeProcesses) { ($nodeProcesses.Count) } else { 0 })"

if ($connection) {
    $processLabel = if ($portProcess) { "$($portProcess.ProcessName) PID $($portProcess.Id)" } else { "processo nao identificado" }
    Write-Host "Porta ${Port}: EM USO por $processLabel"
} else {
    Write-Host "Porta ${Port}: LIVRE"
}

Write-Host "Resposta em ${Url}: $(if ($siteOnline) { 'SIM' } else { 'NAO' })"

if ($status -eq "NODE NAO INSTALADO") {
    Write-Host "Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e reinicie o computador." -ForegroundColor Red
} elseif ($status -eq "PORTA OCUPADA") {
    Write-Host "A porta 5173 esta ocupada por outro programa. Feche o programa ou ajuste manualmente." -ForegroundColor Yellow
} elseif ($status -eq "ERRO") {
    Write-Host "Ha sinais de tentativa de execucao, mas o site local nao respondeu. Veja a pasta logs." -ForegroundColor Yellow
}
