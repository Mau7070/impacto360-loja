# Relatório final - correção e importação de anúncios

Data: 23 de junho de 2026

## Resultado geral

- Anúncios antes da execução: 174
- Anúncios após a execução: 293
- Anúncios existentes corrigidos ou enriquecidos: 140
- Novos anúncios importados após deduplicação: 119
- Anúncios ativos e publicáveis: 181
- Anúncios inativos, duplicados ou em revisão manual: 112
- Lojas cadastradas: 24
- Loja `IMPACTO BRINQUEDOS` criada e ativada com rota `/loja/brinquedos`

## Fotos e links

- Imagens de anúncios existentes substituídas por fotos confirmadas na página do produto: 104
- Anúncios existentes que tinham foto ausente, placeholder ou arquivo quebrado e receberam foto válida: 101
- Conflitos entre título e produto apontado pelo link detectados na primeira validação: 37
- Anúncios originalmente ativos que foram inativados por conflito, link genérico ou falta de segurança: 9
- Anúncios ativos sem foto válida ao final: 0
- Anúncios ativos sem link direto ao final: 0
- Links ativos duplicados ao final: 0
- Links ausentes ou genéricos existentes que não puderam ser corrigidos com segurança: 49; todos permanecem fora da vitrine ativa

## Importação dos cinco arquivos

- Registros brutos extraídos dos DOCX: 147
- Registros únicos importados: 119
- Importados ativos após validação final: 94
- Importados em revisão manual: 25
- Duplicatas foram mescladas por título e link; nenhum registro foi apagado sem rastreabilidade

Dois pares dos arquivos apontavam para o mesmo link e foram mantidos como um único anúncio:

- `Lanterna UV Alonefire 365nm 60W` e `Lanterna UV Alonefire SV103 365nm 10W USB Recarregável`
- `Smart TV 43” Full HD 43LR6700PSA` e `Smart TV 50” Ambilight 4K 50PUG7908/78`

## Organização por loja

| Loja | Total | Ativos |
|---|---:|---:|
| Brinquedos | 80 | 66 |
| Bebê e Infantil | 2 | 1 |
| Ferramentas | 9 | 8 |
| Eletrônicos | 29 | 19 |
| Moda | 23 | 19 |
| Casa e Cozinha | 29 | 12 |
| Informática | 38 | 32 |
| Celulares | 55 | 24 |

Dos novos anúncios:

- 80 foram direcionados para Brinquedos; 66 ficaram ativos e 14 em revisão
- 1 foi direcionado para Bebê e Infantil e ficou ativo
- 9 foram direcionados para Ferramentas; 8 ficaram ativos e 1 em revisão
- 29 foram direcionados para Eletrônicos; 19 ficaram ativos e 10 em revisão

## Loja de Moda

- 23 anúncios analisados
- 19 anúncios ativos com foto e link validados
- 4 anúncios mantidos em revisão manual por ausência de link ou divergência entre o título e o produto da Amazon
- Os quatro anúncios em revisão não aparecem na vitrine pública

## Duplicidade

- 5 grupos de duplicidade identificados no catálogo existente
- 7 registros marcados como `duplicado` e retirados da vitrine
- O anúncio de melhor qualidade foi preservado em cada grupo

## Segurança da publicação

A vitrine pública foi alterada para exibir apenas anúncios que atendam simultaneamente a estes requisitos:

- status `ativo`
- `aprovadoParaPublicacao` diferente de falso
- link de compra utilizável e não genérico
- foto válida e não placeholder

Itens com foto ilustrativa, conflito de modelo, link para lista/loja ou bloqueio de validação permanecem em revisão manual.

## Rotinas implementadas

- `scripts/importar-anuncios.py`
- `scripts/auditar-anuncios.py`
- `scripts/corrigir-imagens-anuncios.py`
- `scripts/anuncios_core.py`
- `requirements-importacao.txt`

Os scripts aceitam DOCX e também possuem leitura básica de JSON, CSV, TSV, TXT e HTML.

## Backup

O backup anterior às alterações está em:

`backups/2026-06-23-0952-pre-importacao-anuncios/`

Os cinco arquivos originais foram preservados em:

`importacoes/originais/2026-06-23/`

## Verificações executadas

- Compilação dos scripts Python
- Auditoria final dos 293 anúncios
- Build Vite concluído
- Teste local da loja de Brinquedos no navegador
- Teste local da loja de Moda no navegador
- Carregamento real das primeiras imagens verificado no navegador
- Itens em revisão confirmados como ausentes da vitrine pública

O validador legado ainda acusa oito rotas administrativas ausentes no arquivo de integração atual. Essa falha já pertence à estrutura administrativa da cópia de origem e não afeta as regras novas de anúncios, que passaram nos testes: nenhum ativo sem foto, sem link direto, em loja inexistente ou com link ativo duplicado.
