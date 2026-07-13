# Relatorio de melhorias Impacto360 Afiliado

## Atualizacao de 2026-07-13 - fotos estaveis e loja mais leve

Pedido atendido: corrigir fotos tremulas, reduzir descricoes para uma vitrine mais parecida com grandes marketplaces, remover publicacoes sem fotografia e fazer limpeza do que deixava a loja pesada.

O que foi realmente alterado nesta rodada:

- A home ficou mais compacta: cards com foto maior, titulo em 2 linhas, descricao curta, loja, preco e um unico botao `Ver oferta`.
- Descricoes dos cards foram limitadas a textos curtos, com maximo validado de 91 caracteres na vitrine local.
- Foram removidos do card publico o botao `Compartilhar produto`, excesso de chips e metadados que ocupavam area da foto.
- A tremura visual foi atacada no CSS: cards e imagens de produto ficaram sem transform, filtro, transicao e hover com repintura forte.
- Produtos sem foto publica deixaram de gerar pagina e deixaram de contar como oferta publica.
- O card agora tenta imagens alternativas do proprio cadastro se a primeira foto falhar; se nenhuma imagem funcionar, o card sai da vitrine em vez de mostrar placeholder.
- O gerador deixou de criar aliases extras por `id`, reduzindo diretorios publicados e deixando a loja mais leve.
- O auditor e o lint passaram a considerar oferta publica somente quando houver link valido e foto valida.
- Links de afiliado foram preservados; nao houve troca manual de URLs de compra.

Metricas atuais:

- Produtos no catalogo: 700.
- Ofertas publicas com link valido e foto valida: 375.
- Paginas canonicas de produto geradas: 375.
- Arquivos de produto publicados: 375 na raiz e 375 no pacote GitHub Pages.
- Sitemap atualizado com 375 URLs de produto.
- Vitrine local validada no Chrome: 38 cards renderizados em desktop e mobile, 0 imagens quebradas, 0 placeholders e 0 botoes de compartilhamento.

Arquivos principais alterados:

- `index.html`, `impacto360.html`, `pacote-github-pages-pronto/index.html`.
- `scripts/gerar-paginas-produtos.mjs`.
- `scripts/lint-impacto360.mjs`.
- `scripts/auditar-anuncios.py`.
- `produto/**/index.html`, `pacote-github-pages-pronto/produto/**/index.html`.
- `sitemap.xml`, `pacote-github-pages-pronto/sitemap.xml`.
- `dados/relatorio-auditoria-anuncios.json` e `dados/relatorio-auditoria-anuncios.md`.

Validacoes executadas:

- `npm.cmd run gerar:produtos`: aprovado.
- `npm.cmd run auditar:anuncios`: aprovado.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run test:seguranca`: aprovado.
- `npm.cmd run build`: aprovado, com avisos nao bloqueantes do Vite sobre scripts externos sem `type="module"`.
- Validacao local com Chrome em `http://127.0.0.1:4187/`: desktop e mobile aprovados para cards, imagens e estabilidade visual.

Backup local antes da edicao: `backups/2026-07-13-0915-pre-limpeza-fotos-vitrine.zip`.

---

## Atualizacao de 2026-07-13 - vitrine de anuncios

Pedido atendido: corrigir degradacao da vitrine, melhorar anuncios, esconder pendencias tecnicas e preservar links de afiliado.

O que foi realmente alterado nesta rodada:

- O filtro publico da home deixou de depender apenas de `status: ativo` e passou a usar link utilizavel + bloqueio de rascunho, duplicado, inativo, oculto e bloqueado.
- Produtos com `status: revisao_manual` e link utilizavel voltaram a aparecer como oferta publica.
- Cards publicos passaram a exibir titulo comercial limpo, descricao util, destaques curtos, loja parceira, preco seguro, disponibilidade segura e CTA por parceiro.
- Textos internos como `Foto preservada`, `Avaliacao pendente de revisao`, `Disponibilidade pendente de revisao`, `Pendente de revisao`, `Inserir link` e `COLOCAR_LINK_AFILIADO_AQUI` deixaram de ser renderizados no card publico.
- `Sob consulta` deixou de aparecer como preco principal no card e nas paginas de produto; no lugar aparece `Conferir preco atualizado`.
- A disponibilidade ausente ou pendente passou a aparecer como `Confirmar no site parceiro`.
- O botao passou a ser contextual: `Ver oferta no Mercado Livre`, `Ver oferta na Amazon` ou `Comprar no site parceiro`.
- O placeholder de imagem foi trocado por fallback estatico e comercial, sem loop de carregamento.
- A animacao de escala/transform do produto no hover foi removida para evitar tremura visual.
- As paginas individuais `/produto/[slug]/` foram regeneradas sem chips de status interno e com JSON-LD seguro.
- Foi adicionada a categoria comercial `Servicos Digitais`.
- O auditor de anuncios passou a reportar tambem `publicos por link`, alinhado ao criterio da vitrine.

Metricas desta rodada:

- Produtos no catalogo: 700.
- Lojas cadastradas: 26.
- Produtos ativos no criterio antigo: 323.
- Ofertas publicas pelo novo criterio de link utilizavel: 613.
- Pendentes/bloqueados da vitrine publica: 87.
- Paginas canonicas de produto geradas: 613.
- Arquivos de produto publicados com aliases por id: 1226.
- URLs de produto no sitemap: 613.

Arquivos principais alterados:

- `index.html`, `impacto360.html`, `pacote-github-pages-pronto/index.html`.
- `scripts/gerar-paginas-produtos.mjs`.
- `scripts/lint-impacto360.mjs`.
- `scripts/validar-impacto360.mjs`.
- `scripts/auditar-anuncios.py`.
- `produto/**/index.html`, `pacote-github-pages-pronto/produto/**/index.html`.
- `sitemap.xml`, `pacote-github-pages-pronto/sitemap.xml`.
- `RELATORIO_CORRECAO_TOTAL_IMPACTO360.md`.
- `MODELO_IDEAL_SHOPPING_IMPACTO360.md`.
- `dados/relatorio-auditoria-anuncios.json` e `dados/relatorio-auditoria-anuncios.md`.

Validacoes:

- `npm.cmd run gerar:produtos`: aprovado.
- `npm.cmd run auditar:anuncios`: aprovado.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run test:seguranca`: aprovado.
- `npm.cmd run build`: aprovado, com avisos nao bloqueantes do Vite sobre scripts externos sem `type="module"`.

Backup local antes da edicao: `backups/2026-07-13-pre-vitrine-anuncios-shopping.zip`.

---

Data: 2026-07-10

## 1. Resumo da auditoria

Foi feita nova auditoria da loja Impacto360 Afiliado com foco em transformar a home em vitrine real de produtos, manter UTF-8 íntegro, preservar a marca e não alterar links de afiliado. Antes das mudanças foi criado o backup `backups/2026-07-10-auditoria-vitrine-categorias-seo.tar.gz`.

Arquivos centrais alterados:

- `index.html`, `impacto360.html` e `pacote-github-pages-pronto/index.html`.
- `scripts/gerar-paginas-produtos.mjs`.
- `scripts/lint-impacto360.mjs`.
- `robots.txt`.
- `sitemap.xml` e `pacote-github-pages-pronto/sitemap.xml`.
- `RELATORIO_MELHORIAS_IMPACTO360.md`.
- `dados/auditoria-produtos-impacto360.json`.

## 2. Produtos encontrados no catálogo

Fonte auditada: `dados/products.json`.

- Produtos totais no catálogo: 700.
- Produtos ativos/publicáveis com link e imagem: 323.
- Lojas cadastradas: 26.
- Produtos com nome: 323.
- Produtos com imagem: 323.
- Produtos com preço: 323.
- Produtos com loja/origem: 323.
- Produtos com link preservado: 323.
- Produtos com avaliação explícita: 24.
- Produtos com disponibilidade explícita: 30.
- Produtos com categoria: 323.
- Produtos com data de última revisão/verificação: 323.

## 3. Produtos completos

Critério completo usado: nome, imagem, preço, loja, link, avaliação, disponibilidade, categoria e última verificação.

- Produtos completos por esse critério: 0.
- Motivo: a maioria dos produtos ativos não possui avaliação e/ou disponibilidade explícita em campos próprios.

A lista completa está em `dados/auditoria-produtos-impacto360.json`, campo `produtosCompletos`.

## 4. Produtos incompletos

- Produtos incompletos por campos avançados: 323.
- Campos faltantes mais comuns: avaliação e disponibilidade.
- Os cards e páginas não inventam esses dados; quando faltam, exibem “pendente de revisão”.

A lista completa está em `dados/auditoria-produtos-impacto360.json`, campo `produtosIncompletos`.

## 5. Produtos exibidos em Ofertas em destaque

A home agora renderiza produtos reais do catálogo:

- Vitrine inicial: 20 produtos reais com imagem, nome, preço, loja/origem, status de avaliação/disponibilidade, selo de afiliado e botão `Ver oferta`.
- Validação estática desktop: 38 cards de produto renderizados.
- Validação estática mobile: 40 cards de produto renderizados.
- Primeiro card validado: produto Samsung Galaxy com preço, origem Mercado Livre, botão `Ver oferta`, imagem carregada e link preservado.

## 6. Categorias comerciais criadas

Foram exibidas 11 categorias comerciais com identificador visual simples, descrição curta, contagem e ação/filtro:

- Celulares e Tecnologia.
- Casa e Cozinha.
- Calçados.
- Moda Masculina.
- Moda Feminina.
- Ferramentas.
- Eletrodomésticos.
- Materiais Escolares.
- Produtos para Cavalgada.
- Ofertas do Dia.
- Mais Vendidos.

## 7. Blocos por loja criados

Foram mantidos/criados blocos separados na home:

- Top Amazon.
- Top Mercado Livre.
- Outras lojas parceiras.

Auditoria de origem nos produtos publicáveis:

- Amazon: 78 produtos.
- Mercado Livre: 243 produtos.
- Outras origens: 2 produtos.

Cada bloco usa somente produtos existentes. Se uma origem ficar sem produto suficiente em nova carga futura, a seção mostra estado “Em preparação”.

## 8. Seções em preparação

Na validação atual, os três blocos por origem aparecem com produtos. Não houve bloco vazio no preview estático.

## 9. Páginas de produto

Foram geradas páginas individuais de produto:

- 323 URLs canônicas amigáveis em `/produto/nome-do-produto/`.
- 646 diretórios publicados no total, incluindo aliases por `id` antigo para compatibilidade.
- Cada página contém imagem, nome, loja, preço, CTA `Comprar no site parceiro`, aviso de afiliado, categoria, status, última verificação e produtos relacionados.

## 10. SEO implementado

- Home mantém title e description.
- Open Graph preservado.
- `sitemap.xml` atualizado com 323 URLs canônicas de produto.
- `robots.txt` atualizado para apontar `https://impacto360afiliado.com.br/sitemap.xml`.
- JSON-LD `Product` gerado nas páginas individuais.
- O JSON-LD não cria avaliação, contagem de reviews ou disponibilidade quando esses campos não existem de forma confiável.
- Preço estruturado só é incluído quando o preço pode ser convertido com segurança.

## 11. Verificação final de UTF-8

Verificações realizadas nos HTMLs públicos e scripts alterados:

- Sem marcadores de dupla codificação tipo A.
- Sem marcadores de dupla codificação tipo B.
- Sem caractere de substituição indevido.
- Sem termos antigos do hero e da seção de categorias nos arquivos públicos.
- Acentuação validada visualmente no preview estático.

## 12. Links de afiliado preservados

Nenhum produto existente foi apagado e `dados/products.json` não teve links de afiliado modificados. A home e as páginas individuais usam os campos de link já cadastrados (`linkCompra`, `linkAfiliado`, `affiliateLink`, `linkComissionado`, `linkPlataforma` e equivalentes).

## 13. Resultado do lint

`npm.cmd run lint`: aprovado.

O lint foi atualizado para refletir a regra atual:

- Home precisa continuar exibindo `Ver oferta`.
- Páginas individuais usam `Comprar no site parceiro`.
- Avaliação ausente deve ser tratada como pendente de revisão.

## 14. Resultado do build

`npm.cmd run build`: aprovado.

Observação: o Vite manteve avisos não bloqueantes sobre dois scripts legados sem `type="module"`, mas a build foi gerada com sucesso.

## 15. Pendências reais

- Nenhum produto ativo possui simultaneamente todos os campos avançados exigidos, porque avaliação e disponibilidade ainda faltam em grande parte do catálogo.
- Há somente 2 produtos classificados como outras origens fora de Amazon/Mercado Livre.
- Os produtos com avaliação ou disponibilidade ausente precisam de revisão cadastral futura se a loja quiser remover os rótulos “pendente de revisão”.

## Validação visual local

Servidor estático validado: `http://127.0.0.1:4180/`.

Desktop:

- 11 categorias com descrição e identificador visual.
- 20 cards na vitrine inicial.
- 8 cards em Recomendado para você.
- 3 blocos por origem.
- 38 botões `Ver oferta`.
- 38 preços e 38 selos de afiliado.
- Sem mojibake e sem textos antigos.
- Sem overflow horizontal.

Mobile:

- 11 categorias com descrição e identificador visual.
- 20 cards na vitrine inicial.
- 8 cards em Recomendado para você.
- 3 blocos por origem.
- 40 botões `Ver oferta`.
- 40 preços e 40 selos de afiliado.
- Sem mojibake e sem textos antigos.
- Sem overflow horizontal.
