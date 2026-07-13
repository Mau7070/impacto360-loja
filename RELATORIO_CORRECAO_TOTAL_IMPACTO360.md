# Relatorio de correcao total Impacto360

Data: 2026-07-13

## Resumo

Foi aplicada uma correcao focada na vitrine e nos anuncios, preservando a identidade Impacto360 Afiliado, os dados existentes e os links de afiliado. A home continua com a estrutura de shopping, mas os cards passaram a apresentar titulo comercial, descricao util, destaques curtos, loja parceira, preco seguro, disponibilidade segura, CTA por parceiro e aviso de afiliado discreto.

Backup criado antes das mudancas: `backups/2026-07-13-pre-vitrine-anuncios-shopping.zip`.

## Causa real da degradacao

- A vitrine publica filtrava produtos apenas com `status: ativo`, `aprovadoParaPublicacao !== false`, link e imagem real. Isso tirava da home muitos produtos com link afiliado utilizavel marcados como `revisao_manual`.
- O card publico reaproveitava textos internos como `Foto preservada`, `Avaliacao pendente de revisao`, `Disponibilidade pendente de revisao` e `Pendente de revisao`.
- O preco `Sob consulta` era tratado como preco principal, em vez de orientar o cliente a conferir o valor atualizado no parceiro.
- As paginas individuais de produto geradas repetiam chips internos de revisao e status.

## Arquivos alterados

- `index.html`, `impacto360.html` e `pacote-github-pages-pronto/index.html`.
- `scripts/gerar-paginas-produtos.mjs`.
- `scripts/lint-impacto360.mjs`.
- `scripts/validar-impacto360.mjs`.
- `scripts/auditar-anuncios.py`.
- `produto/**/index.html` e `pacote-github-pages-pronto/produto/**/index.html` regenerados.
- `sitemap.xml` e `pacote-github-pages-pronto/sitemap.xml`.
- `dados/relatorio-auditoria-anuncios.json` e `dados/relatorio-auditoria-anuncios.md`.

## Catalogo

- Origem principal: `dados/products.json`.
- Produtos totais: 700.
- Lojas cadastradas: 26.
- Produtos ativos no criterio antigo: 323.
- Ofertas publicas pelo criterio novo de link utilizavel: 613.
- Produtos pendentes/bloqueados da vitrine publica: 87.
- Paginas canonicas de produto geradas: 613.
- Arquivos de produto publicados, incluindo aliases por id: 1226.
- URLs de produto no sitemap: 613.

## Imagens

Foi criada e usada uma resolucao mais ampla de imagem no front e no gerador, procurando campos como `fotoPrincipal`, `imagemPrincipal`, `imagem`, `image`, `imageUrl`, `thumbnail`, `foto`, `productImage`, `src`, `galeria`, `fotosExtras` e `images`.

Campos tecnicos ou placeholders como `Foto preservada`, `imagem pendente`, `placeholder quebrado`, `sem foto` e `no image` sao ignorados. Quando nao ha imagem confiavel, o card usa placeholder estatico com altura fixa e sem loop de carregamento.

## Cards corrigidos

- `revisao_manual` com link utilizavel voltou a aparecer na vitrine.
- Rascunho, duplicado, inativo, oculto, bloqueado e produto sem link utilizavel continuam fora da oferta publica.
- `Sob consulta` foi substituido visualmente por `Conferir preco atualizado`.
- Disponibilidade ausente ou pendente virou `Confirmar no site parceiro`.
- Avaliacao ausente nao e mais exibida como pendencia.
- Botao agora e contextual: `Ver oferta no Mercado Livre`, `Ver oferta na Amazon` ou `Comprar no site parceiro`.
- Aviso discreto: `Link de afiliado - sem custo adicional para voce`.

## Paginas de produto

As paginas `/produto/[slug]/` foram regeneradas com:

- titulo comercial limpo;
- descricao comercial por categoria;
- destaques curtos;
- imagem real ou placeholder estavel;
- loja parceira;
- preco seguro;
- CTA por parceiro;
- aviso de afiliado;
- produtos relacionados;
- JSON-LD Product sem inventar preco, avaliacao ou disponibilidade.

## SEO

- `sitemap.xml` e `pacote-github-pages-pronto/sitemap.xml` foram regenerados.
- As paginas de produto mantem canonical, Open Graph e JSON-LD Product.
- O JSON-LD so inclui `price` quando existe valor numerico confiavel.
- O JSON-LD so inclui `aggregateRating` quando ha nota e contagem de avaliacoes.
- O JSON-LD so inclui `availability` quando o texto consegue ser mapeado com seguranca.

## Checklist visual

- Home com produtos reais: corrigido.
- Cards sem tremura de hover/escala de imagem: corrigido.
- Placeholder de imagem estavel: corrigido.
- Pendencias tecnicas fora do card publico: corrigido.
- Produtos sem link utilizavel fora da oferta publica: corrigido.
- Links de afiliado preservados: corrigido.
- Top Amazon, Top Mercado Livre e Outras lojas parceiras preservados: corrigido.
- Categorias comerciais claras, incluindo Servicos Digitais: corrigido.

## Validacoes executadas

- `npm.cmd run gerar:produtos`: aprovado.
- `npm.cmd run auditar:anuncios`: aprovado; 700 analisados, 613 publicos por link, 323 ativos antigos, 87 pendentes/bloqueados.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run test:seguranca`: aprovado.
- `npm.cmd run build`: aprovado. Observacao: o Vite manteve avisos nao bloqueantes sobre scripts sem `type="module"` em `integracoes/impacto360-admin-robos.js` e `integracoes/impacto360-banners-anuncios.js`.
- Previa local em `http://127.0.0.1:4180/`: 40 cards renderizados na home, 40 CTAs de oferta, 40 avisos de afiliado, 12 categorias comerciais, nenhum texto tecnico proibido visivel, layout estavel apos 1,2s, sem overflow horizontal no mobile e pagina de produto com JSON-LD e 4 relacionados.

## Pendencias futuras

- Separar fisicamente um feed publico sanitizado do catalogo administrativo completo.
- Evoluir painel/admin para listar pendencias por link, foto, preco, loja e divergencia.
- Implementar busca conversacional e comparador de produtos como camada futura, sem prometer compra automatica.
