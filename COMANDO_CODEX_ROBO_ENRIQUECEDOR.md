# COMANDO PARA CODEX - ROBÔ ENRIQUECEDOR DE CATÁLOGO AFILIADO IMPACTO 360

Você é um engenheiro full stack sênior. Crie um módulo chamado `robo-enriquecedor-catalogo` para o projeto Impacto 360.

## Objetivo
Ler um manifesto de produtos extraído de um DOCX, abrir os links originais de afiliado do Mercado Livre, importar fotos, descrições, características técnicas, preço, avaliação e vídeos relacionados a cada produto, preservando rigorosamente o link original de afiliado como CTA de compra.

## Entrada obrigatória
Arquivo: `catalogo_manifesto_original_preservado.json`
Campo crítico: `link_original_preservado`.

## Regra inviolável
Nunca substituir `link_original_preservado` pelo link final resolvido, link canônico, link de loja ou link de produto sem autorização. O link final pode ser salvo apenas em `url_final_resolvida` para auditoria. O botão Comprar sempre usa `link_original_preservado`.

## Stack
- Node.js LTS
- Playwright com Chromium
- Saída em JSON, CSV e HTML
- Pasta local `/saida`
- Rate limit de 1 produto por vez, intervalo aleatório de 2 a 5 segundos
- Logs claros por produto
- Retentativa com backoff em caso de erro

## Coleta por produto
Para cada item:
1. Abrir `link_original_preservado` com Playwright.
2. Aguardar `domcontentloaded` e depois estabilização de rede.
3. Capturar:
   - título real do anúncio ou catálogo;
   - URL final resolvida;
   - preço;
   - avaliação;
   - número de opiniões;
   - vendedor quando disponível;
   - descrição do anúncio;
   - bullets de “O que você precisa saber sobre este produto”;
   - tabela de características técnicas;
   - imagens principais do produto;
   - vídeos detectados: `<video>`, `<iframe>`, links YouTube, player interno ou bloco de galeria;
   - disponibilidade/estoque textual quando visível;
   - data e hora da coleta.
4. Baixar imagens em `saida/fotos/{codigo}/` quando a URL da imagem for acessível.
5. Não baixar vídeos protegidos; salvar apenas URL, thumbnail e origem quando detectados.

## Validação
Marcar o produto com:
- `ok_publicacao` quando link é individual, título compatível e há ao menos 1 imagem.
- `revisar_titulo` quando o título do arquivo diverge do título real.
- `link_generico` quando o link levar a loja/lista e não a produto individual.
- `sem_foto` quando não capturar imagem.
- `sem_video_no_anuncio` quando não houver vídeo detectável.
- `erro_coleta` quando a página não abrir.

## Saídas
Gerar:
1. `saida/catalogo_enriquecido.json`
2. `saida/catalogo_enriquecido.csv`
3. `saida/vitrine_afiliado_impacto360.html`
4. `saida/relatorio_inconsistencias.json`
5. `saida/relatorio_execucao.md`

## Vitrine HTML
Criar uma vitrine visual moderna, responsiva e rápida:
- cards por produto;
- imagem principal;
- selo 5G, Apple, Samsung, Motorola quando aplicável;
- preço capturado;
- avaliação;
- resumo técnico;
- botão “Ver oferta” usando `link_original_preservado`;
- botão “Ver detalhes” abrindo modal com descrição, ficha técnica, fotos extras e vídeos detectados;
- filtros por marca, faixa de preço, status de auditoria, memória e rede 5G;
- busca textual;
- alerta visual quando o link for genérico ou inconsistente.

## Segurança e conformidade
- Não mascarar link de afiliado.
- Não inventar foto, vídeo, preço ou descrição.
- Se não encontrar vídeo, registrar explicitamente.
- Respeitar robots.txt e termos da plataforma.
- Não fazer coleta agressiva.
- Manter logs de erro.

## Entrega
Crie os arquivos do módulo, scripts de execução e instruções no README. Inclua comando:

```bash
npm install
npx playwright install chromium
node robot_enriquecedor_catalogo.mjs --input catalogo_manifesto_original_preservado.json --out saida
```
