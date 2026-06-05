@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INICIAR-IMPACTO360-AUTOMATICO.ps1"
echo.
pause

