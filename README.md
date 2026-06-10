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
npm run build
```

A pasta final do Vite é `dist`.

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

## Onde editar links de afiliado

Troque apenas o valor do campo de link, sem remover parâmetros de rastreamento:

```json
"affiliateLink": "COLE_SEU_LINK_DE_AFILIADO_AQUI"
```

## Segurança

- Não envie `.env` para o GitHub.
- Não coloque tokens, senhas ou chaves no front-end.
- Use `.env.example` apenas como modelo sem credenciais reais.

## Limpeza segura

Este repositório passou por uma limpeza em branch separada para remover dependências e arquivos temporários enviados na raiz, preservando a loja, dados, imagens, domínio e configurações essenciais.

Consulte `RELATORIO-LIMPEZA-SEGURA-IMPACTO360.md` para detalhes.
