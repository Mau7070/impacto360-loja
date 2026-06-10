(function () {
  "use strict";

  const CEO_NAME = "ChatGPT Chief Executive Officer";
  const STORE_NAME = "Shopping Impacto360";
  const MANUAL_PRODUCTS_KEY = "ai360:manualProducts";
  const POSTS_KEY = "ai360:postagens";

  start();

  function start() {
    replaceMonicaText();
    injectStyle();
    createPanel();
    window.IMPACTO360_CEO = {
      nome: CEO_NAME,
      funcao: "Chief Executive Officer do Shopping Impacto360",
      listarProdutos: listProducts,
      salvarProduto: saveProduct,
      arquivarProduto: archiveProduct,
      moverParaLixeira