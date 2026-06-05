@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0REMOVER-AUTO-START-IMPACTO360.ps1"
echo.
pause

