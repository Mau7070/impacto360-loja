(function () {
  "use strict";

  // Credenciais nunca devem ser validadas em JavaScript entregue ao navegador.
  document.documentElement.setAttribute("data-impacto360-banners-admin-publico", "desativado");
  console.warn("Impacto360: gestor público de banners desativado.");
})();
