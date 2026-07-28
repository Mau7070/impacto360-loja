# IMPACTO 360 AFILIADO

Shopping virtual premium de afiliados com vitrine de produtos, lojas por categorias, links de compra, compartilhamento da loja e estrutura para divulgação.

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Abra em modo de desenvolvimento:

```bash
npm run dev
```

3. Gere a versão de publicação:

```bash
npm run storefront:build
npm run gerar:produtos
```

4. Execute as barreiras de qualidade:

```bash
npm run storefront:test
```

Os arquivos estáticos são gerados na raiz e sincronizados em `pacote-github-pages-pronto/`.

## Experiência pública

- site responsivo com navegação inferior no celular;
- PWA instalável com cache controlado;
- busca tolerante a erros, voz quando suportada e fluxo assistido por imagem;
- favoritos, histórico e acompanhamento de preço armazenados localmente;
- modo claro/escuro e central de acessibilidade;
- consentimento granular antes de medição ou publicidade;
- páginas de privacidade, cookies, termos e transparência com resposta HTTP 200;
- allowlist de parceiros e quarentena automática de imagens incompatíveis.

## Publicação

### GitHub Pages

A loja também possui versão estática pronta em `pacote-github-pages-pronto/`. Para GitHub Pages estático, mantenha `index.html`, `404.html`, `CNAME`, `robots.txt`, `sitemap.xml`, `dados/`, `public/`, `imagens/` e demais assets necessários na raiz publicada.

### Vercel ou Netlify

Use:

- Build command: `npm run build`
- Output directory: `dist`

## Onde editar produtos

Os principais dados editáveis ficam em:

- `dados/products.json`
- `dados/importedMercadoLivreProducts.json`
- `dados/stores.json`
- `src/data/products.json`, quando usar a versão React/Vite

Preserve sempre os campos `affiliateLink` e `linkOriginal` quando forem links de afiliado.
Antes de qualquer alteração no catálogo, crie um backup datado. Itens duvidosos devem permanecer fora da publicação até revisão humana.

## Onde editar links de afiliado

Troque apenas o valor do campo de link, sem remover parâmetros de rastreamento:

```json
"affiliateLink": "COLE_SEU_LINK_DE_AFILIADO_AQUI"
```

## Segurança

- Não envie `.env` para o GitHub.
- Não coloque tokens, senhas ou chaves no front-end.
- Use `.env.example` apenas como modelo sem credenciais reais.
- Nunca use variáveis `VITE_*` para senhas ou outros segredos.
- O arquivo `dados/relatorio-integridade-publicacao.json` registra bloqueios automáticos do gerador.

## Relatório da evolução premium

Consulte `RELATORIO_IMPLEMENTACAO_PREMIUM_2026-07-28.md` para escopo, validações e limitações conhecidas.

## Limpeza segura

Este repositório passou por uma limpeza em branch separada para remover dependências e arquivos temporários enviados na raiz, preservando a loja, dados, imagens, domínio e configurações essenciais.

Consulte `RELATORIO-LIMPEZA-SEGURA-IMPACTO360.md` para detalhes.
