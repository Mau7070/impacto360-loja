(function () {
  "use strict";

  const CEO_TITLE = "ChatGPT Chief Executive Officer";
  const STORE_NAME = "Shopping Impacto360";
  const MANUAL_PRODUCTS_KEY = "ai360:manualProducts";
  const POSTS_KEY = "ai360:postagens";

  start();

  function start() {
    replaceMonica();
    injectStyle();
    createPanel();
    window.IMPACTO360_CEO = {
      nome: CEO_TITLE,
      funcao: "Chief Executive Officer do Shopping Impacto360",
      listarProdutos,
      salvarProduto,
      arquivarProduto,
      moverProdutoParaLixeira,
      gerarPostagem
    };
  }

  function replaceMonica() {
