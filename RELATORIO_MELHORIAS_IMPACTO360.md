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

## 16. Correção de publicações duplicadas e fotos PFE65 - 2026-07-13

Alterações realizadas nesta rodada:

- Backup criado antes das mudanças: `backups/2026-07-13-0959-pre-correcao-publicacoes-pfe65.zip`.
- 6 registros Mercado Livre do Philco PFE65 foram mantidos no catálogo, mas retirados da publicação com status `duplicado`.
- 1 registro Amazon do Philco PFE65 foi mantido como `pendente_validacao`, sem voltar para a vitrine.
- 6 anúncios de forno com foto real local foram ativados com título curto, descrição comercial reduzida e botão `Ver oferta`.
- O filtro público da home, do pacote e do gerador de páginas agora ignora `revisao_manual`, `pendente_*`, `duplicado` e qualquer item com `aprovadoParaPublicacao: false`.
- A vitrine pública passou a considerar apenas produtos ativos/aprovados com link utilizável e foto real.
- Links de afiliado existentes foram preservados; nenhum link afiliado foi substituído por link direto.
- O arquivo `afiliado.docx` citado pelo usuário não estava disponível no caminho informado nem na pasta de anexos da sessão; os itens dependentes desse arquivo foram registrados no Word de pendências.

Resultado da auditoria local do catálogo após a correção:

- Produtos totais no catálogo: 700.
- Produtos públicos após o novo filtro: 329.
- Produtos ativos: 329.
- PFE65 público após a correção: 0.
- Textos não-URL com caractere `?` residual no catálogo: 0.

Validações executadas nesta rodada:

- `npm.cmd run gerar:produtos`: aprovado, com 329 páginas canônicas.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado; apenas avisos legados não bloqueantes do Vite sobre scripts sem `type="module"`.
- `npm.cmd run test:seguranca`: aprovado.

## 20. Ajuste da ferramenta de distribuicao de tokens - 2026-07-13

O que foi implementado:

- A ferramenta de tokens passou para a versao `20260713-1`.
- O painel do cliente ficou mais claro, com regras de pontuacao visiveis: entrada, favorito, compartilhamento, clique em oferta e cadastro.
- Foi criado o botao/formulario `Cadastrar para obter recompensa`.
- O telefone com DDD passou a ser obrigatorio para cadastro de recompensa.
- O cliente precisa aceitar a autorizacao antes de o telefone ser salvo.
- O cadastro gera bonus unico de 20 tokens.
- Foi criado o grupo local `Grupo da Loja - Detentores de Tokens`.
- O painel administrativo mostra a contagem de detentores, lista recente com telefone mascarado, cidade e saldo.
- O admin pode exportar detentores em JSON ou CSV.
- A API local `window.__ai360TokenHolders` permite conferir o grupo e a contagem pelo console.

Arquivos alterados:

- `integracoes/impacto360-social-recompensas.js`.
- `integracoes/impacto360-admin-robos.js`.
- `pacote-github-pages-pronto/integracoes/impacto360-social-recompensas.js`.
- `pacote-github-pages-pronto/integracoes/impacto360-admin-robos.js`.
- `index.html`, `impacto360.html` e `pacote-github-pages-pronto/index.html` com cache-buster atualizado.
- `CONFIGURAR-ROBO-SOCIAL-E-TOKENS.md`.

Observacao importante:

- Como o site publicado roda no GitHub Pages estatico, o grupo de detentores fica salvo no navegador/localStorage ate existir backend seguro. A exportacao administrativa ja ficou pronta para migracao ou consolidacao manual.
- `produtos_pendentes.docx`: criado e verificado estruturalmente com 15 parágrafos, 1 tabela, 6 linhas e 0 textos com `?` residual.

## 17. Correção das capas de loja e remoção dos andares - 2026-07-13

Alterações realizadas nesta rodada:

- Backup criado antes das mudanças: `backups/2026-07-13-1058-pre-correcao-capas-loja.zip`.
- As capas de loja passaram a usar primeiro o campo `coverImage` de `dados/stores.json`.
- O fallback das capas foi trocado de caminhos antigos `.png` para imagens reais `.webp` em `public/images/capas-lojas-2026`.
- O hover dos cards de loja foi estabilizado para remover tremor visual nas capas.
- As imagens de capa receberam `transform: none`, `transition: none` e fallback visual para evitar ícone de imagem quebrada.
- Os controles visíveis de andares foram removidos: `Todos os andares`, `Térreo`, `1º Andar`, `2º Andar`, `3º Andar` e `Ala Externa`.
- Os rótulos de andar dentro dos cards de loja foram removidos.
- Os títulos das seções foram simplificados para categorias comerciais, sem termos de andar.

## 18. Correção final dos 4 cards repetidos de forno - 2026-07-13

Alterações realizadas nesta rodada:

- Backup criado antes das mudanças: `backups/2026-07-13-1132-pre-correcao-fornos-repetidos.zip`.
- Criado o script reutilizável `scripts/corrigir-fornos-repetidos-mercado-livre.mjs`.
- Substituídos os quatro cards repetidos do forno Philco PFE65 pelos produtos resolvidos a partir dos links enviados.
- As imagens foram importadas do Mercado Livre e salvas em `public/images/anuncios/` e `pacote-github-pages-pronto/public/images/anuncios/`.
- Os links curtos de afiliado foram preservados como links de compra.
- Os metadados internos antigos do forno foram removidos dos quatro produtos corrigidos.
- O registro extra `loja-parceira-001` foi mantido fora da vitrine como `revisao_manual`, sem apagar o link original, para impedir nova publicação errada.

Produtos atualizados:

- `mercado-livre-produto-019`: Notebook Acer Aspire Go 15 AG15-51P-34KT Intel Core i3 8GB 256GB SSD. Link preservado: `https://meli.la/1K6Jhmd`.
- `mercado-livre-produto-020`: Notebook Asus TUF Gaming A15 Ryzen 7 RTX 3050 16GB 512GB Linux. Link preservado: `https://meli.la/1Dinaeg`.
- `mercado-livre-produto-023`: iPhone 16e 128 GB Preto - Distribuidor Autorizado. Link preservado: `https://meli.la/34dtQGa`.
- `mercado-livre-produto-029`: Computador All in One 23,8 I7 16GB SSD 512GB Full HD Branco. Link preservado: `https://meli.la/11MQYNu`.

Observação de origem:

- `https://meli.la/34dtQGa` e `https://meli.la/11MQYNu` abriram listas sociais do Mercado Livre, não uma página única de produto. Foram usados itens reais visíveis nessas listas e o link de afiliado curto continuou como botão de compra.

Validação antes da publicação:

- `index.html`, `impacto360.html`, `pacote-github-pages-pronto/index.html` e os JSONs públicos não contêm mais `Forno Elétrico Philco 65l Dupla Resistência Pfe65 127v` nem `R$ 674,90` nos registros corrigidos.
- Os quatro produtos corrigidos estão `ativo` e `aprovadoParaPublicacao: true`.
- O registro extra `loja-parceira-001` está `revisao_manual`, `aprovadoParaPublicacao: false` e `productIsVisible: false`.
- `npm.cmd run gerar:produtos`: aprovado, com 333 páginas canônicas de produto.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado; apenas avisos legados não bloqueantes do Vite sobre scripts sem `type="module"`.
- `npm.cmd run test:seguranca`: aprovado.

## 19. Importação dos catálogos DOCX para amanhã - 2026-07-13

Arquivos de origem lidos:

- `produtos_mercado_livre_extraidos_das_imagens.docx`.
- `Lista_15_iPhones_15_e_16_Mercado_Livre.docx`.
- `lista_130_calcados_mais_vendidos_ml_amazon_com_afiliado.docx`.

Segurança aplicada antes da importação:

- Backup criado antes das mudanças: `backups/2026-07-13-1207-pre-importacao-catalogos-para-amanha.zip`.
- Cópia dos DOCX preservada em `importacoes/originais/2026-07-13-catalogos-para-amanha`.
- Criado o importador `scripts/importar-catalogos-para-amanha.py`.
- O link de afiliado foi preservado como link de compra.
- O link direto foi usado apenas para validação e importação da foto real.
- Produto sem afiliado, com afiliado duplicado ou sem confirmação segura de título/foto ficou fora da vitrine pública.

Resultado da extração:

- Linhas extraídas dos DOCX: 198.
- Linhas aceitas para validação online: 193.
- Produtos adicionados: 141.
- Produtos atualizados: 52.
- Produtos ativos ou atualizados como ativos: 142.
- Pendências mantidas fora da vitrine: 56.

Pendências registradas:

- 1 produto sem link de afiliado real.
- 4 produtos com link de afiliado duplicado em outro produto.
- 51 produtos não confirmaram, de forma segura, a combinação link afiliado + título + foto real.

Validação por lotes de 20:

- Lote 1: 20 checados, 19 ativos, OK.
- Lote 2: 20 checados, 20 ativos, OK.
- Lote 3: 20 checados, 19 ativos, OK.
- Lote 4: 20 checados, 18 ativos, OK.
- Lote 5: 20 checados, 11 ativos, OK.
- Lote 6: 20 checados, 13 ativos, OK.
- Lote 7: 20 checados, 12 ativos, OK.
- Lote 8: 20 checados, 16 ativos, OK.
- Lote 9: 20 checados, 10 ativos, OK.
- Lote 10: 13 checados, 4 ativos, OK.

Ambiente e rodízio:

- Os produtos ativos ficaram nas lojas corretas: `impacto-mobile`, `impacto-calcados`, `impacto-casa`, `impacto-ofertas`, `grife-prime`, `impacto-ferramentas` e `impacto-eletronicos`.
- 193 anúncios foram preparados em `dados/banners-anuncios.json`.
- 142 anúncios ficaram ativos no rodízio `catalogos-para-amanha-2026-07-13`.
- O pacote `pacote-github-pages-pronto` foi sincronizado com os mesmos dados e imagens.

Auditoria global após a importação:

- Produtos importados/atualizados na rodada: 193.
- Produtos ativos da rodada: 142.
- Ativos sem link: 0.
- Ativos sem foto real: 0.
- Ativos sem loja válida: 0.
- Links ativos duplicados: 0.
- Páginas individuais geradas: 440.

Validações executadas:

- `npm.cmd run gerar:produtos`: aprovado, com 440 páginas canônicas.
- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado; apenas avisos legados não bloqueantes do Vite sobre scripts sem `type="module"`.
- `npm.cmd run test:seguranca`: aprovado.

## 21. Ajuste de experiência de comprador, abertura e lojas internas - 2026-07-21

Reclamação analisada:

- A abertura da loja ocupava espaço demais antes dos produtos.
- O banner inicial podia mostrar imagens grandes demais.
- Ao entrar em uma loja, a capa e os textos atrasavam a chegada até a grade de produtos.

Auditoria feita como comprador:

- Site público medido no desktop antes da alteração: primeiro produto aparecia por volta de 1.550 px de rolagem.
- Prévia local após a alteração: primeiro produto da home apareceu por volta de 636 px.
- Loja interna `impacto-mobile` na prévia local: a capa caiu de mais de 1.100 px para cerca de 353 px, com o primeiro card de produto por volta de 562 px.

Alterações realizadas:

- Abertura da home ficou mais curta, com título menor e texto comercial reduzido.
- O banner fixo de três imagens foi escondido para não esticar a primeira dobra.
- Os filtros longos da abertura foram ocultados; a navegação principal e os botões diretos continuam disponíveis.
- Cards de loja passaram a limitar descrição a duas linhas.
- Ao abrir uma loja, a seção textual de destaques antes da grade foi removida.
- A loja interna agora entra direto na seção `Produtos da loja`.
- Cards da grade interna ficaram mais enxutos, sem descrição longa, specs e aviso de afiliado repetitivo.
- Scripts `impacto360-banners-public.js`, `impacto360-capas-auto.js` e `impacto360-capas-fix.js` foram compactados para não reabrirem banners/capas gigantes depois do carregamento.
- Cache-busters dos scripts de banner e capa foram atualizados para `20260721-ux-compacto-v1`.

Arquivos alterados nesta rodada:

- `index.html`
- `impacto360.html`
- `pacote-github-pages-pronto/index.html`
- `integracoes/impacto360-banners-anuncios.js`
- `integracoes/impacto360-banners-public.js`
- `integracoes/impacto360-capas-auto.js`
- `integracoes/impacto360-capas-fix.js`
- `integracoes/impacto360-admin-robos.js`
- `pacote-github-pages-pronto/integracoes/impacto360-admin-robos.js`

Backup criado antes das mudanças:

- `backups/ux-compacto-20260721-113225`

Validações executadas nesta rodada:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado; apenas avisos legados não bloqueantes do Vite sobre scripts externos sem `type="module"`.
- `npm.cmd run test:seguranca`: aprovado.
