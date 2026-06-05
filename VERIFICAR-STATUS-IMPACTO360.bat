@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFICAR-STATUS-IMPACTO360.ps1"
echo.
pause

