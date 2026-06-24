(function () {
  "use strict";
  if (window.__impacto360MarketingLoader) return;
  window.__impacto360MarketingLoader = true;
  const route = new URLSearchParams(location.search).get("route") || location.pathname;
  const script = document.createElement("script");
  script.src = route === "/admin/banners-anuncios"
    ? "integracoes/impacto360-banners-admin.js"
    : "integracoes/impacto360-banners-public.js";
  script.defer = true;
  document.head.appendChild(script);
  if (route !== "/admin/banners-anuncios") {
    const covers = document.createElement("script");
    covers.src = "integracoes/impacto360-capas-auto.js";
    covers.defer = true;
    document.head.appendChild(covers);
  }
})();