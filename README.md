# Pacote do catálogo afiliado Impacto 360

Este pacote contém a extração do DOCX preservando os links originais, a auditoria do arquivo e um robô-modelo para enriquecer os produtos com fotos, descrições e vídeos.

## Arquivos

- `catalogo_manifesto_original_preservado.json`: manifesto principal para o robô.
- `catalogo_manifesto_original_preservado.csv`: visão tabular dos produtos e alertas.
- `AUDITORIA_CATALOGO_IMPACTO360.md`: diagnóstico técnico do arquivo recebido.
- `COMANDO_CODEX_IMPACTO360_COMPLETO_V3.md`: comando consolidado para loja, robô, painel, WhatsApp e auto-start Windows.
- `COMANDO_CODEX_ROBO_ENRIQUECEDOR_V2.md`: comando completo para o Codex implementar loja, painel e robô inteligente.
- `COMANDO_CODEX_AUTO_START_WINDOWS.md`: comando separado apenas para automação de inicialização no Windows.
- `COMANDO_CODEX_ROBO_ENRIQUECEDOR.md`: versão inicial do comando do robô enriquecedor.
- `robot_enriquecedor_catalogo.mjs`: script-base Node.js + Playwright.
- `INICIAR-IMPACTO360-AUTOMATICO.ps1` e arquivos `.bat`: utilitários para iniciar, instalar, remover e verificar o auto-start local.

## Execução local

Instale o Node.js LTS. Depois, dentro desta pasta:

```bash
npm init -y
npm install playwright
npx playwright install chromium
node robot_enriquecedor_catalogo.mjs --input catalogo_manifesto_original_preservado.json --out saida
```

## Auto-start Windows

Para instalar a abertura automática do servidor local no logon do Windows, coloque estes arquivos na raiz do projeto React/Vite e execute uma vez:

```bat
INSTALAR-AUTO-START-IMPACTO360.bat
```

Também estão disponíveis:

```bat
INICIAR-AGORA-IMPACTO360.bat
VERIFICAR-STATUS-IMPACTO360.bat
REMOVER-AUTO-START-IMPACTO360.bat
```

Observação: esta pasta de pacote não possui `package.json`. O auto-start só conseguirá iniciar o Vite quando os scripts estiverem na raiz do projeto que tenha `package.json` com `npm run dev`.

## Atenção

O robô preserva o campo `link_original_preservado`. Esse é o link que deve ficar no botão de compra. A URL final resolvida serve apenas para auditoria.
