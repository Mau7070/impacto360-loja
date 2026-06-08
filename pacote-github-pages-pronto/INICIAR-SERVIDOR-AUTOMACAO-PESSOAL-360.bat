@echo off
title Automacao Afiliado Pessoal 360
cd /d "%~dp0..\automacao-afiliado-pessoal-360"
if not exist ".env" copy ".env.example" ".env"
echo.
echo Iniciando Automacao Afiliado Pessoal 360...
echo Painel: http://localhost:5173
echo Backend: http://localhost:3000/health
echo.
if not exist "node_modules" npm install
npm run dev
pause
