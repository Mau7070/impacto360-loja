@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=C:\Users\PMNB\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

echo ============================================================
echo IMPACTO 360 AFILIADO - Atualizacao Mercado Livre
echo ============================================================
echo.
echo Este comando usa os links de afiliado ja cadastrados.
echo Ele nao altera nem substitui seus links de comissao.
echo.

echo [1/2] Buscando dados oficiais no Mercado Livre...
"%NODE_EXE%" ".\scripts\atualizar_loja_tech_mercado_livre.mjs"

echo.
echo [2/2] Regenerando a loja...
"%NODE_EXE%" ".\scripts\build-impacto360-premium-mall.mjs"

echo.
echo ============================================================
echo Processo finalizado.
echo.
echo Se aparecerem falhas, veja:
echo dados\mercado-livre-update-errors.json
echo.
echo Depois teste:
echo pacote-github-pages-pronto\index.html
echo ============================================================
echo.
pause

