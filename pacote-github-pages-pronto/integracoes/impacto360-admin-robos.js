(function () {
  "use strict";

  // O painel administrativo legado não é seguro em hospedagem estática.
  // A administração e os relatórios de saúde devem permanecer fora do site público.
  const routedPath = new URLSearchParams(location.search).get("route") || location.pathname;
  if (!routedPath.startsWith("/admin/")) return;

  document.documentElement.setAttribute("data-impacto360-admin-publico", "desativado");
  console.warn("Impacto360: painel administrativo público desativado.");
})();
