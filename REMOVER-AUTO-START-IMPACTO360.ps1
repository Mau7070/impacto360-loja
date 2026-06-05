$ErrorActionPreference = "Stop"

$TaskName = "Impacto360 - Iniciar Servidor dos Robos"
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Auto-start removido. A tarefa '$TaskName' foi apagada." -ForegroundColor Green
} else {
    Write-Host "Nenhuma tarefa de auto-start encontrada para o Shopping Impacto 360." -ForegroundColor Yellow
}

