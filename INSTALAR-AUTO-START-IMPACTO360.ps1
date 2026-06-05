$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartScript = Join-Path $ProjectRoot "INICIAR-IMPACTO360-AUTOMATICO.ps1"
$TaskName = "Impacto360 - Iniciar Servidor dos Robos"
$UserId = "$env:USERDOMAIN\$env:USERNAME"

if (-not (Test-Path -LiteralPath $StartScript)) {
    Write-Host "Arquivo de inicio nao encontrado: $StartScript" -ForegroundColor Red
    exit 1
}

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Tarefa existente encontrada. Removendo para recriar..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$actionArgs = '-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $StartScript
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs -WorkingDirectory $ProjectRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $UserId
$trigger.Delay = "PT30S"
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $UserId -LogonType Interactive -RunLevel LeastPrivilege

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Force | Out-Null

Write-Host "Auto-start instalado. Reinicie o computador e, ao entrar no Windows, o Shopping Impacto 360 abrira automaticamente." -ForegroundColor Green

