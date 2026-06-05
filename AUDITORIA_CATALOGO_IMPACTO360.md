# Auditoria do catálogo de celulares - Impacto 360

## Resultado executivo

- Itens prometidos no título: 100.
- Itens realmente extraídos do arquivo: 54.
- Imagens embutidas no DOCX: 5. Isso indica que as fotos são repetidas/representativas, não uma foto exclusiva para cada produto.
- Links/hyperlinks detectados no documento: 66 ocorrências, com repetições.
- Regra de ouro do projeto: **nunca substituir o link_original_preservado**. O robô deve coletar foto, descrição, preço, avaliação e vídeo, mas o botão de compra deve continuar usando o link original do arquivo.

## Falhas encontradas

1. O arquivo não contém 100 itens completos. Números ausentes: 019, 020, 036, 037, 038, 040, 041, 042, 043, 044, 045, 046, 047, 048, 049, 050, 051, 052, 053, 054, 055, 056, 057, 058, 059, 060, 061, 062, 063, 064, 065, 066, 067, 068, 069, 070, 091, 092, 093, 094, 095, 096, 097, 098, 099, 100.
2. Existem links genéricos de loja/lista, especialmente em Apple e alguns Motorola. Esses links não levam necessariamente a um produto individual.
3. Existem links duplicados usados em produtos diferentes: 5 links duplicados.
4. Há descrições aparentemente incompatíveis com o título em alguns registros, por exemplo: A03 com texto de A06, S23 FE com texto de S25 FE, S24 FE com texto de S25 Ultra, Moto G24 Power com Edge 60 Neo e Moto G85 com Moto G86.
5. Como os preços e estoques mudam, o catálogo precisa ser enriquecido dinamicamente e revalidado antes de publicar.

## Contagem por status

- ok_para_enriquecer: 24
- verificar: 6
- corrigir_antes_de_publicar: 24

## Alertas por tipo

- link_duplicado_em_outros_produtos: 24
- possivel_titulo_descricao_incompatíveis: 6
- link_google_generico: 1
- link_generico_loja_ou_lista: 18

## Itens que precisam de correção antes de publicar

- 015 - Samsung Galaxy A03 | alertas: possivel_titulo_descricao_incompatíveis | link: https://meli.la/1wsTVyx
- 017 - Samsung Galaxy S23 FE | alertas: possivel_titulo_descricao_incompatíveis | link: https://meli.la/1KJA6kB
- 018 - Samsung Galaxy S24 FE | alertas: possivel_titulo_descricao_incompatíveis | link: https://meli.la/14A5mNi
- 021 - Samsung Galaxy S25+ | alertas: possivel_titulo_descricao_incompatíveis | link: https://meli.la/29aDs96
- 031 - Motorola Moto G24 Power | alertas: link_google_generico, possivel_titulo_descricao_incompatíveis | link: https://www.google.com/search?btnI=1&q=site%3Amercadolivre.com.br%2Fp%2FMLB+%22Motorola+Moto+G24+Power%22+Mercado+Livre
- 032 - Motorola Moto G04s | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/motorola#from=share_eshop
- 033 - Motorola Moto G84 5G | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/motorola#from=share_eshop
- 034 - Motorola Moto G85 5G | alertas: possivel_titulo_descricao_incompatíveis | link: https://meli.la/34bojpa
- 039 - Motorola Edge 50 Ultra | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/motorola#from=share_eshop
- 071 - Apple iPhone 11 | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 072 - Apple iPhone XR | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 073 - Apple iPhone XS | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 074 - Apple iPhone 12 | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 075 - Apple iPhone 12 Pro | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 076 - Apple iPhone 13 | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 077 - Apple iPhone 13 Pro | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 078 - Apple iPhone 14 | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 079 - Apple iPhone 14 Plus | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 080 - Apple iPhone 14 Pro | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 081 - Apple iPhone 15 | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 082 - Apple iPhone 15 Plus | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 083 - Apple iPhone 15 Pro | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 086 - Apple iPhone 16e | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop
- 087 - Apple iPhone 16 Plus | alertas: link_generico_loja_ou_lista, link_duplicado_em_outros_produtos | link: https://www.mercadolivre.com.br/loja/apple#from=share_eshop

## Estratégia recomendada

Criar um robô de enriquecimento com navegador real, preferencialmente Playwright, porque links curtos do Mercado Livre e páginas dinâmicas podem bloquear requisições simples. O robô deve:

1. Ler `catalogo_manifesto_original_preservado.json`.
2. Abrir cada `link_original_preservado` em navegador real.
3. Resolver a URL final somente para auditoria, sem trocar o link original de afiliado.
4. Capturar título real, preço, avaliação, número de opiniões, vendedor, fotos, vídeos, descrição, características técnicas, disponibilidade e data/hora da coleta.
5. Baixar fotos permitidas para uso interno do catálogo.
6. Procurar vídeos incorporados ou blocos de mídia do anúncio; quando não houver vídeo do anúncio, criar campo `video_status = sem_video_no_anuncio`.
7. Gerar HTML de vitrine, JSON enriquecido e relatório de inconsistências.
8. Marcar como `bloqueado_publicacao` qualquer produto com link genérico ou título incompatível.

## Estrutura ideal de saída

- `saida/catalogo_enriquecido.json`
- `saida/catalogo_enriquecido.csv`
- `saida/vitrine_afiliado_impacto360.html`
- `saida/fotos/{codigo}/imagem_1.webp`
- `saida/videos_detectados.json`
- `saida/relatorio_erros.json`
