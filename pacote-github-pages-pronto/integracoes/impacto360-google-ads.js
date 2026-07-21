(function impacto360GoogleAds() {
  "use strict";

  const CONVERSION_DESTINATION = "AW-17933727169/t6sTCL7IltQcEMHru-dC";
  const PARTNER_HOSTS = [
    /(^|\.)amazon\.com\.br$/i,
    /(^|\.)amzn\.to$/i,
    /(^|\.)link\.amazon$/i,
    /(^|\.)mercadolivre\.com\.br$/i,
    /(^|\.)meli\.la$/i,
    /(^|\.)shopee\.com\.br$/i,
    /(^|\.)s\.shopee\.com\.br$/i,
    /(^|\.)hotmart\.com$/i,
    /(^|\.)go\.hotmart\.com$/i
  ];

  function targetUrl(element) {
    if (!element) return null;
    const value = element.dataset?.linkPlataforma || element.getAttribute?.("href") || "";
    if (!/^https?:\/\//i.test(value)) return null;

    try {
      return new URL(value, window.location.href);
    } catch (_error) {
      return null;
    }
  }

  function isPartnerClick(element, url) {
    if (!element || !url || url.hostname === window.location.hostname) return false;
    if (element.hasAttribute("data-link-plataforma")) return true;
    if ((element.getAttribute("rel") || "").split(/\s+/).includes("sponsored")) return true;
    return PARTNER_HOSTS.some((pattern) => pattern.test(url.hostname));
  }

  function reportPartnerClick(element) {
    const url = targetUrl(element);
    if (!isPartnerClick(element, url) || typeof window.gtag !== "function") return;

    window.gtag("event", "conversion", {
      send_to: CONVERSION_DESTINATION,
      value: 1,
      currency: "BRL"
    });
  }

  document.addEventListener("click", function onPartnerClick(event) {
    const origin = event.target instanceof Element ? event.target : null;
    const element = origin?.closest("[data-link-plataforma], a[href]");
    reportPartnerClick(element);
  }, true);

  window.__impacto360GoogleAds = Object.freeze({
    conversionDestination: CONVERSION_DESTINATION,
    reportPartnerClick
  });
})();
