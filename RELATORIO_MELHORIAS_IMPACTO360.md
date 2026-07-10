# Relatório de melhorias Impacto360 Afiliado

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
