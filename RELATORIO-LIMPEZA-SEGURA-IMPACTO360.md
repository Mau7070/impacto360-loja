# Relatório de Limpeza Segura - Impacto360

Branch: `limpeza-segura-impacto360`
Base: `main` em `f525ed17b2fe3f44c5e8905f98390a532b0d0c6f`
Data: 2026-06-10

## Objetivo

Remover arquivos desnecessários, duplicados, temporários e dependências de `node_modules` que foram enviados na raiz do repositório, sem alterar a `main` diretamente e sem remover arquivos ativos da loja.

## Preservado

- Página inicial: `index.html`, `404.html`, `impacto360.html`.
- Domínio e SEO: `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml`, `favicon.svg`.
- Catálogo e dados: `dados/`, `public/`, `produtos-impacto360/`, `imagens/`, `videos/`.
- Código e integrações: `src/`, `scripts/`, `integracoes/`, `dist/`, `.github/`.
- Configurações: `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `postcss.config.js`, `tailwind.config.js`, `vite.config.js`.
- Documentação útil de operação e hospedagem.

## Removido

- Diretórios de dependências soltos na raiz, como `@nodelib/`, `@rollup/`, `@vitejs/`, `react/`, `typescript/`, `helpers/`, `lib/`, `data/`, `generated/` e equivalentes.
- Centenas de arquivos JavaScript/TypeScript e mapas de código pertencentes a pacotes NPM, que não fazem parte da loja.
- Binários auxiliares de pacotes (`autoprefixer`, `browserslist`, `rollup`, `semver`, `sucrase`, `tailwind`, `tailwindcss`, `vite`, `resolve`, etc.) que estavam na raiz.
- Metadados incorretos de pacote, substituindo o `package.json` de `caniuse-lite` por um `package.json` real da loja.
- `README.md` incorreto de pacote, substituído por documentação da Impacto360.
- Arquivos temporários e logs de execução.

## Testes realizados

- Conferida a branch base remota antes da alteração.
- Conferido que a limpeza foi aplicada somente na branch `limpeza-segura-impacto360`.
- Comparação remota `main...limpeza-segura-impacto360` para validar que a `main` não foi alterada.
- Preservação explícita dos arquivos essenciais da loja, catálogo, domínio, SEO, imagens, scripts e configurações.

## Observação

O ambiente local não possui `git` nem `gh` instalados; por isso a branch, commit e PR foram criados usando o conector oficial do GitHub, mantendo a alteração fora da `main`.
