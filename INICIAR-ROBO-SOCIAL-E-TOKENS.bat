@echo off
title IMPACTO 360 - Robo Social e Tokens
cd /d "%~dp0"
if not exist ".env" copy ".env.example" ".env"
echo.
echo Iniciando Robo Social 360...
echo Endpoint: http://localhost:3000/api/social/publish
echo Health:   http://localhost:3000/health
echo.
npm run robo:social
pause
