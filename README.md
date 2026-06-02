# AFILIADO IMPACTO 360

Loja-vitrine profissional para afiliados, criada com React + Vite + Tailwind CSS. O projeto usa arquivos JSON para produtos, categorias, avaliações, banners e artigos, sem banco de dados nesta primeira versão.

## O que foi criado

- Home persuasiva com hero, categorias, recomendados, ofertas do dia, depoimentos e captura.
- Catálogo com busca e filtros por categoria, preço, avaliação e destaque.
- Página individual de produto com benefícios, pontos positivos, pontos negativos e aviso de afiliado.
- Comparador com seleção de até 4 produtos via localStorage.
- Favoritos salvos no navegador.
- Ranking automático de melhores escolhas.
- Página de ofertas do dia.
- Blog com 5 artigos SEO iniciais.
- Quiz “Produto ideal para você”.
- Páginas Sobre, Política de Privacidade, Aviso de Afiliado, Contato e Captura.
- Botão flutuante de WhatsApp.
- Modo claro e escuro.
- Estrutura SEO com meta description dinâmica e dados estruturados em produtos.

## Como instalar

```bash
npm install
```

## Como rodar em desenvolvimento

```bash
npm run dev
```

Depois abra a URL mostrada no terminal, normalmente:

```text
http://localhost:5173
```

## Como gerar versão de publicação

```bash
npm run build
```

Os arquivos finais serão gerados na pasta `dist`.

## Onde editar produtos

Edite:

```text
src/data/products.json
```

Nesta versão, os produtos foram importados da lista pública do Mercado Livre informada pelo link:

```text
https://mercadolivre.com/sec/14EbgVy
```

O importador usado ficou em:

```text
scripts/import-mercado-livre.mjs
```

Ele organiza primeiro produtos de informática e depois os demais por menor preço.

Cada produto possui:

- `name`: nome do produto.
- `image`: imagem do produto.
- `category`: categoria vinculada ao arquivo `categories.json`.
- `shortDescription`: resumo usado em cards.
- `fullDescription`: texto da página do produto.
- `benefits`: lista de benefícios.
- `pros`: pontos positivos.
- `cons`: pontos negativos.
- `price`: preço aproximado.
- `rating`: nota.
- `featured`: destaque verdadeiro ou falso.
- `discount`: desconto exibido.
- `urgency`: chamada de urgência responsável.
- `affiliateLink`: link de afiliado.
- `idealFor`: público ideal.
- `clicks`: cliques simulados.
- `dealOfDay`: aparece em ofertas do dia.

## Onde trocar links de afiliado

No mesmo arquivo:

```text
src/data/products.json
```

Troque o valor de `affiliateLink` pelo link real da plataforma de afiliados.

Exemplo:

```json
"affiliateLink": "https://seu-link-real-de-afiliado.com/produto"
```

## Onde editar categorias

```text
src/data/categories.json
```

Use o campo `id` da categoria nos produtos.

## Onde editar artigos do blog

```text
src/data/articles.json
```

Cada artigo usa `slug`, `title`, `excerpt`, `date`, `readTime` e `content`.

## Onde editar depoimentos e banners

```text
src/data/reviews.json
src/data/banners.json
```

## Como trocar o WhatsApp

Edite o número nos arquivos:

```text
src/components/WhatsappButton.jsx
src/components/LeadBox.jsx
```

Substitua `5500000000000` pelo número com código do país e DDD.

## Como publicar

Opção simples em Vercel ou Netlify:

1. Suba o projeto para um repositório Git.
2. Conecte o repositório na plataforma.
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Publique.

Também é possível publicar a pasta `dist` em hospedagens estáticas.

## Como usar a Central VIP de Divulgação

A nova área fica na rota:

```text
/central-vip-divulgacao
```

Ela prepara campanhas para Google Ads, Meta Ads, TikTok Ads, YouTube Ads, Microsoft Ads, LinkedIn Ads, Pinterest Ads, X Ads, Reddit Ads, Taboola, Outbrain, Kwai Ads, Telegram, WhatsApp, e-mail marketing, Google Meu Negócio, Google Discover, SEO orgânico, blog e comunidades.

1. Acesse a Central VIP pelo menu ou pelo botão “Central VIP de Divulgação”.
2. Escolha a plataforma de divulgação.
3. Preencha produto, descrição curta, oferta, categoria, link real, imagem, público, objetivo, orçamento simulado e região.
4. Clique em `Gerar campanha VIP` para criar textos, títulos, descrições, públicos e criativos sugeridos.
5. Use `Gerar link com UTM` para adicionar `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`.
6. O link técnico pode ter UTM, mas o texto visível para o visitante deve continuar como `IMPACTO360`.
7. O destino visual `IMPACTO360` é configurado em `src/config/entryLink.js`.
8. Use `Copiar texto` para levar a campanha para a plataforma escolhida.
9. Use `Compartilhar no WhatsApp` para abrir uma mensagem pronta.
10. Use `Enviar por e-mail` para preparar uma mensagem de e-mail.
11. Use `Preparar anúncio` para montar o anúncio sem publicar nada.
12. Use `Exportar campanha em JSON` para salvar a campanha e revisar depois.

### Preparar anúncios por plataforma

- Google Ads: use os títulos, descrições, palavras-chave, URL final e caminho visível `IMPACTO360`.
- Facebook e Instagram: use texto principal, título, descrição, CTA e posicionamentos sugeridos.
- TikTok: use gancho de 3 segundos, roteiro curto, legenda, hashtags e criativo vertical.
- YouTube: use os roteiros de 15 e 30 segundos, título, descrição e CTA.
- Outras plataformas: copie o modelo gerado e revise manualmente antes de publicar.

### Pixels e rastreamento futuro

O arquivo `.env.example` foi criado com:

```text
VITE_GA4_ID=
VITE_GOOGLE_ADS_ID=
VITE_META_PIXEL_ID=
VITE_TIKTOK_PIXEL_ID=
VITE_LINKEDIN_PARTNER_ID=
VITE_PINTEREST_TAG_ID=
VITE_MICROSOFT_UET_ID=
```

Não coloque tokens, senhas, chaves de API ou credenciais no front-end. IDs públicos de pixel podem ser configurados no futuro, mas tokens de API devem ficar apenas em backend seguro.

### Modo seguro

A Central VIP não publica anúncios reais, não ativa campanhas, não gasta dinheiro e não usa tokens. Ela apenas prepara textos, links, modelos e arquivos para revisão manual. Para testar sem gastar dinheiro, gere campanhas, copie os textos, exporte JSON e valide os links UTM antes de entrar em qualquer gerenciador de anúncios.

## Estrutura de pastas

```text
.
├── public
├── src
│   ├── components
│   ├── data
│   ├── hooks
│   ├── pages
│   ├── utils
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## Melhorias futuras recomendadas

- Integrar captura com Mailchimp, Brevo, ConvertKit ou ferramenta similar.
- Adicionar analytics para medir cliques reais em links de afiliado.
- Criar painel administrativo simples para cadastrar produtos sem editar JSON.
- Adicionar páginas estáticas geradas por slug para SEO avançado.
- Implementar histórico de preços e alertas.
- Conectar imagens otimizadas em CDN.

## Versao estatica para GitHub Pages

A pasta pronta para publicar e:

```text
pacote-github-pages-pronto
```

Para atualizar o site no GitHub Pages, envie o conteudo dessa pasta para a raiz do repositorio.

Arquivos principais da loja:

- `index.html`: pagina principal do shopping.
- `404.html`: arquivo de suporte para o GitHub Pages.
- `dados/products.json`: produtos, servicos e links de afiliado.
- `dados/importedMercadoLivreProducts.json`: links Mercado Livre importados.
- `dados/stores.json`: lojas internas do shopping.
- `public`: imagens e placeholders.

### Produtos Mercado Livre

Os links enviados no arquivo `lista mercado livre.docx` foram importados como produtos da loja `IMPACTO TECH COMPUTADORES`.

Regra principal:

```text
affiliateLink deve manter exatamente o link original enviado.
```

Quando nome, preco, marca, imagem ou especificacoes nao puderem ser lidos do Mercado Livre, o produto fica com status `pendente` e com a mensagem `Informacao nao especificada pelo fornecedor`.

### Comandos para GitHub

Use estes comandos quando for enviar por terminal:

```bash
git init
git add .
git commit -m "Organiza loja de computadores e adiciona produtos"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

### Documentacao auxiliar

- `docs/estrutura-do-projeto.md`
- `docs/como-adicionar-produtos.md`
- `CHANGELOG.md`

## Gerar Word com produtos do Mercado Livre

Foi criado um script Python para ler links de afiliado, seguir o redirecionamento normal, consultar a API publica do Mercado Livre, baixar a imagem real do anuncio e gerar um arquivo Word.

Instalar dependencias:

```bash
pip install -r requirements-mercado-livre.txt
```

Rodar usando os links ja extraidos:

```bash
python scripts/gerar_word_produtos_mercado_livre.py --links-file dados/mercado-livre-links.json --output-dir output
```

Saidas geradas:

- `output/produtos-mercado-livre.docx`
- `output/produtos-mercado-livre.json`
- `output/imagens`

O script nao usa login, cookies, senha, scraping agressivo ou tokens. Ele preserva o link de afiliado original no campo `link_afiliado`.

## Atualizar loja IMPACTO TECH COMPUTADORES com dados oficiais

Foi criado tambem um atualizador da propria loja:

```bash
node scripts/atualizar_loja_tech_mercado_livre.mjs
```

Esse comando usa os `affiliateLink` ja anexados aos produtos da loja `IMPACTO TECH COMPUTADORES`, segue o redirecionamento normal do link de afiliado, extrai o ID `MLB`, consulta a API publica do Mercado Livre e atualiza:

- titulo oficial;
- preco;
- descricao oficial resumida e detalhada;
- fotos reais do anuncio;
- galeria de imagens;
- video, quando a API informar `video_id`;
- especificacoes tecnicas;
- condicao;
- garantia, quando informada;
- estoque informado pela API;
- SEO do produto.

As imagens baixadas ficam em:

```text
public/produtos/mercado-livre
pacote-github-pages-pronto/public/produtos/mercado-livre
```

Arquivos atualizados pelo comando:

- `dados/products.json`
- `dados/importedMercadoLivreProducts.json`
- `dados/enrichedMercadoLivreProducts.json`
- `pacote-github-pages-pronto/dados/products.json`
- `pacote-github-pages-pronto/dados/importedMercadoLivreProducts.json`
- `pacote-github-pages-pronto/dados/enrichedMercadoLivreProducts.json`

Se algum link nao abrir, ele fica registrado em:

```text
dados/mercado-livre-update-errors.json
```

Importante: o comando nao usa login, senha, cookies, scraping agressivo ou token. Ele preserva o link original de comissao em `affiliateLink`.
- Criar testes automatizados para filtros, favoritos e comparação.
