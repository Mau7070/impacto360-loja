(function () {
  "use strict";

  const CEO_NAME = "ChatGPT";
  const CEO_TITLE = "ChatGPT Chief Executive Officer";
  const STORE_NAME = "Shopping Impacto360";
  const MANUAL_PRODUCTS_KEY = "ai360:manualProducts";
  const POSTS_KEY = "ai360:postagens";

  startCeo();

  function startCeo() {
    replaceMonicaText();
    injectStyle();
    createPanel();
    exposeApi();
  }

  function exposeApi() {
    window.IMPACTO360_CEO = {
      nome: CEO_TITLE,
      funcao: "Chief Executive Officer do Shopping Impacto360",
      listarProdutos: listProducts,
      salvarProduto: saveProduct,
      arquivarProduto: archiveProduct,
      moverParaLixeira: moveToTrash,
      gerarPostagem: createPost
    };
  }

  function replaceMonicaText