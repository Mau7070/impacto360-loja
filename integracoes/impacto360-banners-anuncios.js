(function () {
  "use strict";
  if (window.__impacto360MarketingLoader) return;
  window.__impacto360MarketingLoader = true;
  const route = new URLSearchParams(location.search).get("route") || location.pathname;
  const script = document.createElement("script");
  script.src = route === "/admin/banners-anuncios"
    ? "integracoes/impacto360-banners-admin.js"
    : "integracoes/impacto360-banners-public.js?v=20260714-desktop-v1";
  script.defer = true;
  document.head.appendChild(script);
  if (route !== "/admin/banners-anuncios") {
    const covers = document.createElement("script");
    covers.src = "integracoes/impacto360-capas-auto.js?v=20260625-1";
    covers.defer = true;
    document.head.appendChild(covers);
    const storeCovers = document.createElement("script");
    storeCovers.src = "integracoes/impacto360-capas-fix.js?v=20260625-1";
    storeCovers.defer = true;
    document.head.appendChild(storeCovers);
  }
  if (!document.querySelector('script[src*="impacto360-catalogos-novos.js"]')) {
    const catalogos = document.createElement("script");
    catalogos.src = "integracoes/impacto360-catalogos-novos.js?v=20260701-catalogos-v1";
    catalogos.defer = true;
    document.head.appendChild(catalogos);
  }
})();
