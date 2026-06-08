@echo off
title AFILIADO-ORBIT - IMPACTO 360
cd /d "%~dp0..\AFILIADO-ORBIT"
if not exist ".env" copy ".env.example" ".env"
echo.
echo Iniciando AFILIADO-ORBIT...
echo Painel: http://localhost:5174
echo API: http://localhost:8000/docs
echo.
docker compose -f infra/docker-compose.yml --env-file .env up --build
pause
