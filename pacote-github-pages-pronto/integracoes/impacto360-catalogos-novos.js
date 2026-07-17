(function () {
  "use strict";

  var VERSION = "20260715-catalogos-mix-v2";
  var STYLE_ID = "impacto360CatalogosNovosStyle";
  var CATALOGS = [
    {
      id: "maquinas-lavar-quente",
      title: "Maquinas de lavar quente",
      label: "Maquinas",
      storeId: "impacto-casa",
      storeName: "Impacto Casa",
      description: "Lava e seca, vapor e agua quente com links de afiliado preservados.",
      items: [
        item("Philco PLS11T Lava e Seca 10 kg / 7 kg Inox", "R$ 2.645,75", "https://http2.mlstatic.com/D_NQ_NP_652991-MLA99984680741_112025-O.webp", "https://meli.la/19pSjdp"),
        item("Midea HealthGuard Smart 11 kg Branca MF200W110WB/WK", "R$ 3.221,11", "https://http2.mlstatic.com/D_NQ_NP_627265-MLA99473277170_112025-O.webp", "https://meli.la/2YM4pBv"),
        item("Samsung WD11M Lava e Seca 11 kg / 7 kg Branca", "R$ 3.699,00", "https://http2.mlstatic.com/D_NQ_NP_707477-MLA99987270185_112025-O.webp", "https://meli.la/1pHgJ5M"),
        item("Samsung WD11A EcoBubble Lava e Seca 11 kg / 7 kg Inox Look", "R$ 4.314,74", "https://http2.mlstatic.com/D_NQ_NP_711535-MLA98006687169_112025-O.webp", "https://meli.la/1hmJ5Ln"),
        item("Midea HealthGuard Titanium Conectada 13 kg", "R$ 2.995,90", "https://http2.mlstatic.com/D_NQ_NP_813969-MLA107386089012_032026-O.webp", "https://meli.la/1yRpAQ7"),
        item("Midea Slim HealthGuard 11 kg Branca", "R$ 2.265,90", "https://http2.mlstatic.com/D_NQ_NP_880536-MLA100014277111_122025-O.webp", "https://meli.la/2UaCf2T"),
        item("Brastemp BNQ10AB Lava e Seca 10,1 kg / 6 kg Branca", "R$ 4.253,03", "https://http2.mlstatic.com/D_NQ_NP_991343-MLA99981455321_112025-O.webp", "https://meli.la/1KZXsw7"),
        item("LG VC5 Lava e Seca Smart 12 kg Branca", "Preco no anuncio", "https://http2.mlstatic.com/D_NQ_NP_939792-MLA99491735794_112025-O.webp", "https://meli.la/2jXKUqy"),
        item("Midea MF200D130WB Lava e Seca HealthGuard Smart 13 kg / 8 kg Branca", "R$ 3.559,00", "https://http2.mlstatic.com/D_NQ_NP_925442-MLA99456480574_112025-O.webp", "https://meli.la/27MBhiA")
      ]
    },
    {
      id: "tvs-75-boas-avaliacoes",
      title: "TVs 75 polegadas novas",
      label: "TVs 75",
      storeId: "impacto-eletronicos",
      storeName: "Impacto Eletronicos",
      description: "Modelos 4K e QLED novos com boas avaliacoes e link de afiliado.",
      items: [
        item("TCL 75P6K - Smart TV 75 UHD 4K Google TV / Android TV", "R$ 3.799", "https://http2.mlstatic.com/D_NQ_NP_839737-MLA113356249335_062026-O.webp", "https://meli.la/2VpBsCx"),
        item("TCL 75P7K - Smart TV 75 QLED 4K Google TV HDR10+ Dolby Vision", "R$ 3.989,05", "https://http2.mlstatic.com/D_NQ_NP_622389-MLA113356485173_062026-O.webp", "https://meli.la/2hp4FqJ"),
        item("Samsung U8100F - Smart TV Crystal 75 UHD 4K 2025 Bivolt", "R$ 4.519,27", "https://http2.mlstatic.com/D_NQ_NP_966308-MLA110473670029_042026-O.webp", "https://meli.la/2zc67ep"),
        item("TCL 75C6K - Smart TV 75 QLED Mini LED 4K Google TV 144 Hz", "R$ 5.499", "https://http2.mlstatic.com/D_NQ_NP_915801-MLA112209897986_062026-O.webp", "https://meli.la/2ThHXNZ")
      ]
    }
  ];

  function item(name, price, image, link) {
    return { name: name, price: price, image: image, link: link };
  }

  function slug(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
  }

  function catalogProductId(catalog, product, index) {
    return "catalogo-" + catalog.id + "-" + String(index + 1).padStart(2, "0") + "-" + slug(product.name);
  }

  function catalogProduct(catalog, product, index) {
    var isLaundry = catalog.id === "maquinas-lavar-quente";
    var source = catalog.storeName || "Impacto360";
    return {
      id: catalogProductId(catalog, product, index),
      storeId: catalog.storeId,
      name: product.name,
      nome: product.name,
      title: product.name,
      slug: slug(product.name),
      category: isLaundry ? "Casa e Cozinha" : "Eletronicos",
      categoria: isLaundry ? "Casa e Cozinha" : "Eletronicos",
      subcategoria: isLaundry ? "Lava e seca" : catalog.label,
      departamento: isLaundry ? "Lavanderia" : catalog.title,
      badge: isLaundry ? "Mercado Livre lava e seca" : "Mercado Livre " + catalog.label,
      source: "Mercado Livre",
      origem: source + " - catalogo novo",
      plataformaOrigem: "Mercado Livre",
      price: product.price,
      preco: product.price,
      description: product.name + " selecionado para a vitrine " + source + ". Confira preco, estoque, frete, garantia e condicoes diretamente no anuncio antes da compra.",
      descricaoCurta: product.name + " selecionado para a vitrine " + source + ". Confira preco, estoque, frete, garantia e condicoes diretamente no anuncio antes da compra.",
      fullDescription: catalog.description,
      descricaoDetalhada: catalog.description,
      image: product.image,
      imagemPrincipal: product.image,
      fotoPrincipal: product.image,
      imagem: product.image,
      galeria: [product.image],
      fotosExtras: [product.image],
      linkCompra: product.link,
      linkAfiliado: product.link,
      affiliateLink: product.link,
      linkComissionado: product.link,
      linkPlataforma: product.link,
      linkOriginal: product.link,
      urlProduto: product.link,
      aprovadoParaPublicacao: true,
      status: "pronto",
      statusPublicacao: "pronto",
      auditoriaPublicacao: "aprovado",
      actionType: "offer",
      specs: isLaundry ? ["Lava e seca", "Agua quente", "Loja: Mercado Livre"] : [catalog.label, "Loja: Mercado Livre"]
    };
  }

  function catalogProductsForStore(storeId) {
    return CATALOGS
      .filter(function (catalog) { return !storeId || catalog.storeId === storeId; })
      .flatMap(function (catalog) {
        return catalog.items.map(function (product, index) {
          return catalogProduct(catalog, product, index);
        });
      });
  }

  function registerCatalogProducts(storeId) {
    if (typeof window.__impacto360GetProducts !== "function" || typeof window.__impacto360AddManualProduct !== "function") return false;
    var products = window.__impacto360GetProducts() || [];
    var ids = new Set(products.map(function (product) { return String(product && product.id || ""); }));
    var changed = false;
    catalogProductsForStore(storeId).forEach(function (product) {
      if (ids.has(product.id)) return;
      window.__impacto360AddManualProduct(product);
      ids.add(product.id);
      changed = true;
    });
    return changed;
  }

  function removeStoreCatalogSections() {
    document.querySelectorAll(".catalog-store-section, [id^='catalogStore-']").forEach(function (section) {
      section.remove();
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, function (char) {
      if (char === "&") return "&amp;";
      if (char === "<") return "&lt;";
      if (char === ">") return "&gt;";
      return "&quot;";
    });
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = "\
      .catalog-showcase{margin:18px auto 20px;padding:0 16px;max-width:1180px}\
      .catalog-showcase__head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}\
      .catalog-showcase__title{margin:0;color:#0b1f3c;font:800 1.32rem/1.15 Inter,Arial,sans-serif}\
      .catalog-showcase__meta{color:#5f6b7a;font:700 .84rem/1.25 Inter,Arial,sans-serif}\
      .catalog-showcase__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}\
      .catalog-shortcut{border:1px solid rgba(9,30,66,.13);border-radius:16px;background:#fff;box-shadow:0 10px 28px rgba(9,30,66,.08);padding:14px;overflow:hidden}\
      .catalog-shortcut__top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}\
      .catalog-shortcut__title{margin:0;color:#10233f;font:900 1rem/1.12 Inter,Arial,sans-serif}\
      .catalog-shortcut__badge{border-radius:999px;background:#fff3bf;color:#0b584f;font:900 .78rem/1 Inter,Arial,sans-serif;padding:7px 9px;white-space:nowrap}\
      .catalog-shortcut__desc{margin:0 0 11px;color:#586579;font:700 .82rem/1.35 Inter,Arial,sans-serif}\
      .catalog-mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}\
      .catalog-mini-item{display:grid;grid-template-columns:58px minmax(0,1fr);gap:8px;align-items:center;min-height:76px;border:1px solid rgba(9,30,66,.1);border-radius:12px;background:#f8fbff;padding:7px}\
      .catalog-mini-item img{width:58px;height:58px;object-fit:contain;border-radius:9px;background:#fff}\
      .catalog-mini-item strong{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:#101828;font:900 .73rem/1.12 Inter,Arial,sans-serif}\
      .catalog-mini-item span{display:block;margin-top:4px;color:#0756d8;font:900 .72rem/1 Inter,Arial,sans-serif}\
      .catalog-shortcut__button,.catalog-product-card__button{appearance:none;border:0;border-radius:13px;background:#0f63ff;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font:900 .88rem/1 Inter,Arial,sans-serif;padding:11px 13px;min-height:40px;width:100%;box-shadow:0 8px 18px rgba(15,99,255,.24)}\
      .catalog-store-section{margin:18px 0 24px;padding:16px;border-radius:18px;background:linear-gradient(180deg,#f7fbff 0%,#ffffff 100%);border:1px solid rgba(9,30,66,.12)}\
      .catalog-store-section__head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}\
      .catalog-store-section__head h2{margin:0;color:#10233f;font:900 1.18rem/1.15 Inter,Arial,sans-serif}\
      .catalog-store-section__head span{color:#5f6b7a;font:800 .82rem/1.2 Inter,Arial,sans-serif}\
      .catalog-product-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}\
      .catalog-product-card{border:1px solid rgba(9,30,66,.12);border-radius:15px;background:#fff;padding:12px;display:flex;flex-direction:column;gap:9px;min-height:100%}\
      .catalog-product-card img{width:100%;height:150px;object-fit:contain;background:#f7f9fc;border-radius:12px}\
      .catalog-product-card h3{margin:0;color:#101828;font:900 .9rem/1.2 Inter,Arial,sans-serif}\
      .catalog-product-card p{margin:0;color:#0756d8;font:900 .88rem/1 Inter,Arial,sans-serif}\
      @media(max-width:640px){.catalog-showcase{padding:0 12px;margin-top:14px}.catalog-showcase__grid{grid-template-columns:1fr}.catalog-shortcut{border-radius:14px;padding:12px}.catalog-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.catalog-mini-item{grid-template-columns:52px minmax(0,1fr);min-height:70px;padding:6px}.catalog-mini-item img{width:52px;height:52px}.catalog-mini-item strong{font-size:.68rem}.catalog-mini-item span{font-size:.68rem}.catalog-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.catalog-product-card{padding:8px;border-radius:12px}.catalog-product-card img{height:104px}.catalog-product-card h3{font-size:.72rem;line-height:1.15}.catalog-product-card p{font-size:.72rem}.catalog-product-card__button{font-size:.72rem;padding:9px 7px;border-radius:10px}}\
      @media(max-width:760px){#impacto360AdRotation.ai360-ad-rotation{margin:0 0 12px!important;padding:8px!important;border-radius:0!important;background:#fff!important}#impacto360AdRotation .rotation-head,#impacto360AdRotation [data-main]{display:none!important}#impacto360AdRotation .rotation-thumbs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:0!important}#impacto360AdRotation .rotation-thumbs button{min-width:0!important;width:100%!important;max-width:100%!important;min-height:96px!important;height:auto!important;border:1px solid rgba(9,30,66,.12)!important;border-radius:13px!important;background:#fff!important;padding:8px!important;display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;gap:8px!important;align-items:center!important;text-align:left!important;overflow:hidden!important;box-shadow:none!important}#impacto360AdRotation .rotation-thumbs img{width:58px!important;height:58px!important;max-width:58px!important;object-fit:contain!important;background:#fff!important;grid-column:1!important}#impacto360AdRotation .rotation-thumbs span{font-size:.74rem!important;line-height:1.12!important;font-weight:900!important;color:#101828!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important;margin:0!important;padding:0!important}#impacto360AdRotation .rotation-price{display:block!important;font-size:.74rem!important;line-height:1.1!important;font-weight:900!important;color:#0756d8!important;margin-top:4px!important;padding:0!important}#impacto360AdRotation .rotation-thumbs em{display:none!important}}\
    ";
    document.head.appendChild(style);
  }

  function miniItemMarkup(product) {
    return '<a class="catalog-mini-item" href="' + escapeHtml(product.link) + '" target="_blank" rel="noopener sponsored">' +
      '<img loading="lazy" src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">' +
      '<span><strong>' + escapeHtml(product.name) + '</strong><span>' + escapeHtml(product.price) + '</span></span>' +
      '</a>';
  }

  function renderHomeCatalogs() {
    installStyle();
    var host = document.getElementById("catalogShowcase");
    if (!host) {
      host = document.createElement("section");
      host.id = "catalogShowcase";
      var reference = document.getElementById("mallFloors") || document.getElementById("mercadoLivreShowcase") || document.querySelector("main") || document.body.firstElementChild;
      if (reference && reference.parentNode) reference.parentNode.insertBefore(host, reference.id === "mallFloors" ? reference : reference.nextSibling);
      else document.body.appendChild(host);
    }
    host.className = "catalog-showcase";
    host.innerHTML = '<div class="catalog-showcase__head"><h2 class="catalog-showcase__title">Catalogos novos</h2><span class="catalog-showcase__meta">13 ofertas Mercado Livre</span></div>' +
      '<div class="catalog-showcase__grid">' + CATALOGS.map(function (catalog) {
        return '<article class="catalog-shortcut">' +
          '<div class="catalog-shortcut__top"><h3 class="catalog-shortcut__title">' + escapeHtml(catalog.title) + '</h3><span class="catalog-shortcut__badge">' + catalog.items.length + ' itens</span></div>' +
          '<p class="catalog-shortcut__desc">' + escapeHtml(catalog.description) + '</p>' +
          '<div class="catalog-mini-grid">' + catalog.items.slice(0, 4).map(miniItemMarkup).join("") + '</div>' +
          '<button type="button" class="catalog-shortcut__button" data-impacto-catalog="' + escapeHtml(catalog.id) + '">Abrir na loja</button>' +
        '</article>';
      }).join("") + '</div>';
  }

  function productCardMarkup(product) {
    return '<article class="catalog-product-card">' +
      '<img loading="lazy" src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">' +
      '<h3>' + escapeHtml(product.name) + '</h3>' +
      '<p>' + escapeHtml(product.price) + '</p>' +
      '<a class="catalog-product-card__button" href="' + escapeHtml(product.link) + '" target="_blank" rel="noopener sponsored">Ver oferta</a>' +
    '</article>';
  }

  function injectStoreCatalog(catalog) {
    installStyle();
    registerCatalogProducts(catalog.storeId);
    removeStoreCatalogSections();
    if (typeof window.__impacto360RefreshShopping === "function") window.__impacto360RefreshShopping();
  }

  function catalogById(id) {
    return CATALOGS.filter(function (catalog) { return catalog.id === id; })[0] || CATALOGS[0];
  }

  function openCatalog(id) {
    var catalog = catalogById(id);
    window.__impacto360PendingCatalog = catalog.id;
    registerCatalogProducts(catalog.storeId);
    if (typeof window.openStore === "function") window.openStore(catalog.storeId);
    window.setTimeout(function () { injectStoreCatalog(catalog); }, 180);
  }

  function bindClicks() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest && event.target.closest("[data-impacto-catalog]");
      if (!button) return;
      event.preventDefault();
      openCatalog(button.getAttribute("data-impacto-catalog"));
    });
  }

  function wrapOpenStore() {
    if (window.__impacto360CatalogOpenStoreWrapped) return;
    var original = window.openStore;
    if (typeof original !== "function") return;
    window.__impacto360CatalogOpenStoreWrapped = true;
    window.openStore = function (storeId) {
      registerCatalogProducts(storeId);
      var result = original.apply(this, arguments);
      var pending = window.__impacto360PendingCatalog;
      var catalog = CATALOGS.filter(function (entry) { return entry.id === pending || entry.storeId === storeId; })[0];
      removeStoreCatalogSections();
      if (catalog) window.setTimeout(function () { injectStoreCatalog(catalog); }, 220);
      return result;
    };
  }

  function boot() {
    installStyle();
    var changed = registerCatalogProducts();
    removeStoreCatalogSections();
    if (changed && typeof window.__impacto360RefreshShopping === "function") window.__impacto360RefreshShopping();
    renderHomeCatalogs();
    bindClicks();
    wrapOpenStore();
    window.openCatalog = openCatalog;
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      renderHomeCatalogs();
      wrapOpenStore();
      if (attempts > 12) window.clearInterval(timer);
    }, 500);
    document.documentElement.setAttribute("data-impacto-catalogos", VERSION);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
