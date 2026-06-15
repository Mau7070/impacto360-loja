# Relatorio de Correcao - Fotos, Assistente e Anuncios

## 1. Causa das fotos sumidas

A vitrine possui produtos com imagens reais e 44 produtos usando placeholder. A funcao antiga dos cards nao consultava todos os campos de imagem na ordem correta e o modulo de revisao apontava imagens quebradas para `/assets/placeholder-produto.svg`, arquivo que nao existe na publicacao atual.

## 2. Causa da tremulacao

Quando uma imagem quebrava, o fallback apontava para outro arquivo inexistente. Isso podia manter a troca de imagem ativa no card, gerando piscada, area instavel ou aparencia de carregamento permanente.

## 3. Arquivos corrigidos

- `integracoes/impacto360-revisao-fotos-ceo.js`
- `dados/controle-anuncios-chatgpt-ceo.json`
- `RELATORIO-CORRECAO-FOTOS-MONICA-ANUNCIOS.md`

## 4. Como as fotos foram restauradas

Foi criada a funcao segura `resolveProductImage(produto)`, usando esta ordem:

1. `fotoPrincipal`
2. `imagemPrincipal`
3. `image`
4. primeira imagem valida em `galeria`
5. primeira imagem valida em `fotosExtras`
6. `imagem`
7. `thumbnail`
8. placeholder interno estavel, apenas se nao houver imagem real

O placeholder agora e embutido como `data:image/svg+xml`, evitando erro 404 e eliminando loop de fallback.

## 5. Onde o assistente antigo foi removido

O novo modulo substitui referencias residuais no `localStorage` e nos textos visiveis da pagina por `ChatGPT CEO`. A busca inicial na base carregada da loja nao encontrou referencia ativa visivel do assistente antigo.

## 6. Como o ChatGPT CEO foi ativado

O script `integracoes/impacto360-revisao-fotos-ceo.js`, que ja e carregado pelo painel administrativo, agora atua tambem como modulo do Chief Executive Officer do Shopping Impacto360 para:

- revisar fotos;
- estabilizar imagens quebradas;
- editar anuncios;
- revisar links;
- sugerir descricoes;
- gerar textos de postagem;
- marcar pendencias.

O modulo expoe:

- `window.resolveProductImage`
- `window.__impacto360Anuncios`

## 7. Como editar anuncio manualmente

No painel administrativo, o botao `CEO Anuncios` abre o editor completo. Nele e possivel alterar titulo, nome, marca, modelo, categoria, subcategoria, descricao curta, descricao completa, beneficios, especificacoes, preco, preco antigo, desconto, parcelas, frete, links, foto principal, galeria, videos, textos para redes sociais, hashtags, status e observacoes.

## 8. Como editar anuncio com ChatGPT CEO

Dentro do editor existem botoes para:

- Melhorar descricao com ChatGPT;
- Gerar postagem com ChatGPT;
- Revisar imagem com ChatGPT;
- Sugerir categoria com ChatGPT;
- Verificar anuncio incompleto.

As sugestoes aparecem primeiro em uma area de revisao. O administrador precisa aprovar antes de aplicar.

## 9. Como inserir foto

Abra `CEO Anuncios`, selecione o produto e preencha `foto principal`. Tambem e possivel inserir varias URLs em `galeria de fotos`, uma por linha.

## 10. Como remover foto

Apague `foto principal` e salve. O anuncio fica `pendente_foto` e recebe placeholder estavel ate receber imagem real.

## 11. Como modificar anuncio

Selecione o anuncio, edite os campos e clique em `Salvar anuncio`. As alteracoes ficam salvas localmente no navegador administrativo ate existir backend seguro.

## 12. Limitacoes encontradas

A loja ainda e estatica. As edicoes administrativas ficam em `localStorage`. Para gravacao permanente multi-dispositivo, e necessario backend protegido ou processo seguro de exportacao/importacao.

## 13. Testes realizados

- `npm.cmd run build` executado localmente com sucesso.
- Sintaxe do modulo de correcao validada com Node.
- Home local respondeu HTTP 200.
- Rota administrativa local respondeu HTTP 200.
- Script de correcao respondeu HTTP 200.
- Confirmado que o fallback nao depende mais de `/assets/placeholder-produto.svg`.

## 14. Confirmacao da home

A home nao foi reescrita. A correcao atua pelo modulo de revisao/CEO ja carregado pela loja, preservando fachada, entrada do shopping e estrutura principal.
