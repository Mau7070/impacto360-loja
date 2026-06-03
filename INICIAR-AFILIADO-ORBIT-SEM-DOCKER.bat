@echo off
title AFILIADO-ORBIT sem Docker - IMPACTO 360
cd /d "%~dp0AFILIADO-ORBIT"
if not exist ".env" copy ".env.example" ".env"

echo.
echo Esta opcao inicia o AFILIADO-ORBIT sem Docker.
echo Voce precisa ter Python 3.12+ e Node.js/npm instalados no Windows.
echo.

start "AFILIADO-ORBIT Backend" cmd /k "cd /d %cd%\backend && if not exist .venv python -m venv .venv && call .venv\Scripts\activate && pip install -e .[dev] && uvicorn app.main:app --reload --port 8000"
start "AFILIADO-ORBIT Frontend" cmd /k "cd /d %cd%\frontend && npm install && npm run dev"

echo.
echo Aguarde alguns minutos e acesse:
echo API: http://localhost:8000/docs
echo Painel: http://localhost:5174
echo.
pause
