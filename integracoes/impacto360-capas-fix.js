(function () {
  "use strict";
  if (window.__ai360StoreCoverFix) return;
  window.__ai360StoreCoverFix = true;

  let stores = [];
  let products = [];
  let timer = null;

  start();

  async function start() {
    style();
    await load();
    apply();
    let runs = 0;
    const pulse = setInterval(function () {
      apply();
      if (++runs > 90) clearInterval(pulse);
    }, 500);
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(apply, 120);
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
  }

  async function load() {
    try {
      const response = await fetch("dados/stores.json", { cache: "no-store" });
      stores = response.ok ? await response.json() : [];
    } catch {
      stores = [];
    }
    try {
      const response = await fetch("dados/products.json", { cache: "no-store" });
      products = response.ok ? await response.json() : [];
    } catch {
      products = [];
    }
    if (!Array.isArray(stores)) stores = [];
    if (!Array.isArray(products)) products = [];
  }

  function norm(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function clean(value) {
    value = String(value || "").replace(/\\/g, "/").trim();
    return value.replace(/^public\/produtos-impacto360\//i, "produtos-impacto360/");
  }

  function good(value) {
    value = String(value || "").trim();
    return value && !/placeholder|sem[-_ ]?(foto|imagem)|no[-_ ]?image|COLOCAR_|URL_|LINK_/i.test(value);
  }

  function productImage(item) {
    const gallery = Array.isArray(item?.galeria) ? item.galeria : [];
    const extras = Array.isArray(item?.fotosExtras) ? item.fotosExtras : [];
    return [item?.fotoPrincipal, item?.imagemPrincipal, item?.image, item?.imagem, gallery[0], extras[0], item?.thumbnail].map(clean).find(good) || "";
  }

  function productLink(item) {
    return String([item?.linkCompra, item?.linkAfiliado, item?.affiliateLink, item?.linkComissionado, item?.linkPlataforma, item?.link_original_afiliado, item?.urlProduto, item?.url].find(value => /^https?:\/\//i.test(String(value || ""))) || "");
  }

  function visibleProduct(item) {
    return productImage(item) && productLink(item) && item?.aprovadoParaPublicacao !== false && String(item?.status || "").toLowerCase() !== "rascunho";
  }

  function findStore(title) {
    const wanted = norm(title);
    return stores.find(store => norm(store.name) === wanted || norm(store.commercialName) === wanted);
  }

  function storeCover(store) {
    if (good(store?.coverImage)) return clean(store.coverImage);
    const own = products.filter(item => item.storeId === store?.id && visibleProduct(item)).map(productImage).find(Boolean);
    if (own) return own;
    return products.filter(visibleProduct).map(productImage).find(Boolean) || "";
  }

  function imageErrorAttr() {
    return "if(!this.dataset.alt){var s=this.getAttribute('src')||'';var n=s.indexOf('public/produtos-impacto360/')===0?s.slice(7):(s.indexOf('produtos-impacto360/')===0?'public/'+s:(s.indexOf('public/')===0?s.slice(7):(s.indexOf('images/')===0?'public/'+s:'')));if(n){this.dataset.alt='1';this.src=n}else this.remove()}else this.remove()";
  }

  function setCoverImage(img, src) {
    if (!img || !src) return;
    if (img.getAttribute("src") !== src) {
      img.dataset.alt = "";
      img.setAttribute("src", src);
      img.setAttribute("onerror", imageErrorAttr());
    }
  }

  function apply() {
    stores.forEach(store => {
      const src = storeCover(store);
      if (!src) return;
      document.querySelectorAll(".store-card").forEach(card => {
        const title = card.querySelector("h3")?.textContent;
        if (findStore(title)?.id !== store.id) return;
        const banner = card.querySelector(".store-banner");
        if (!banner) return;
        card.classList.add("ai360-cover-ready");
        let img = banner.querySelector(".ai360-store-cover-img");
        if (!img) {
          banner.insertAdjacentHTML("afterbegin", '<img class="ai360-store-cover-img" src="' + esc(src) + '" alt="" loading="lazy" decoding="async" onerror="' + imageErrorAttr() + '">');
          img = banner.querySelector(".ai360-store-cover-img");
        }
        setCoverImage(img, src);
      });
    });

    document.querySelectorAll(".store-hero").forEach(hero => {
      if (hero.classList.contains("store-hero-compact")) {
        hero.classList.remove("ai360-store-hero-cover");
        hero.querySelectorAll(".ai360-store-hero-img").forEach(img => img.remove());
        return;
      }
      const store = findStore(hero.querySelector("h1")?.textContent);
      const src = storeCover(store);
      if (!src) return;
      hero.classList.add("ai360-store-hero-cover");
      let img = hero.querySelector(".ai360-store-hero-img");
      if (!img) {
        hero.insertAdjacentHTML("afterbegin", '<img class="ai360-store-hero-img" src="' + esc(src) + '" alt="" loading="eager" decoding="async" onerror="' + imageErrorAttr() + '">');
        img = hero.querySelector(".ai360-store-hero-img");
      }
      setCoverImage(img, src);
    });

    updateOpeningCategories();
    renderStoreIntro();
  }

  function updateOpeningCategories() {
    const groupStore = {
      eletronicos: "impacto-tech-computadores",
      brinquedos: "impacto-brinquedos",
      moda: "impacto-moda",
      casa: "impacto-casa",
      beleza: "impacto-beauty-care",
      outros: "lojas-parceiras"
    };
    Object.entries(groupStore).forEach(([group, storeId]) => {
      const store = stores.find(item => item.id === storeId);
      const src = storeCover(store);
      const img = document.querySelector('#ai360OpeningCovers [data-ai360-group="' + group + '"] img');
      setCoverImage(img, src);
    });
    const title = document.querySelector("#ai360OpeningCovers .floor-head h3");
    const text = document.querySelector("#ai360OpeningCovers .floor-head p");
    if (title) title.textContent = "Explore as lojas";
    if (text) text.textContent = "Capas realistas por nicho, ofertas e produtos prontos para abrir no celular.";
  }

  function renderStoreIntro() {
    if (!stores.length || document.getElementById("ai360StoreCoversIntro")) return;
    const anchor = document.getElementById("mercadoLivreShowcase") || document.querySelector(".mall-panel");
    if (!anchor) return;
    const cards = stores.map(store => {
      const src = storeCover(store);
      if (!src) return "";
      return '<button class="ai360-store-intro-card" type="button" data-ai360-store="' + esc(store.id) + '"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" onerror="' + imageErrorAttr() + '"><span><strong>' + esc(store.name) + '</strong><small>' + esc(store.commercialName || store.category || "IMPACTO 360") + '</small></span></button>';
    }).join("");
    anchor.insertAdjacentHTML("beforebegin", '<section id="ai360StoreCoversIntro" class="floor-block ai360-store-intro"><div class="floor-head"><div><h3>Lojas em destaque</h3><p>Escolha a capa e entre direto na loja.</p></div><span class="chip">' + stores.length + ' lojas</span></div><div class="ai360-store-intro-rail">' + cards + '</div></section>');
    document.querySelectorAll("#ai360StoreCoversIntro [data-ai360-store]").forEach(button => {
      button.addEventListener("click", function () {
        if (typeof window.openStore === "function") window.openStore(button.dataset.ai360Store);
      });
    });
  }

  function style() {
    if (document.getElementById("ai360StoreCoverFixStyle")) return;
    const style = document.createElement("style");
    style.id = "ai360StoreCoverFixStyle";
    style.textContent = `
      .ai360-cover-ready .store-banner{position:relative;min-height:170px;overflow:hidden;padding:0!important;color:#fff!important}
      .ai360-store-cover-img,.ai360-store-hero-img,.ai360-store-hero-cover .store-hero-image,.ai360-store-intro-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.08) contrast(1.04)}
      .ai360-cover-ready .store-banner:after,.ai360-store-hero-cover:after,.ai360-store-intro-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,21,45,.08),rgba(6,21,45,.80));pointer-events:none}
      .ai360-cover-ready .store-banner>*:not(.ai360-store-cover-img){position:relative;z-index:2;margin:16px}
      .ai360-store-hero-cover{position:relative;overflow:hidden;min-height:clamp(168px,22vw,240px);display:flex;align-items:flex-end;color:#fff!important}
      .store-hero.store-hero-compact.ai360-store-hero-cover{min-height:auto!important;display:grid!important;align-items:stretch!important;color:inherit!important}
      .store-hero.store-hero-compact .ai360-store-hero-img{display:none!important}
      .ai360-store-hero-cover>.store-hero-content{position:relative;z-index:2}
      .ai360-store-hero-cover:after{z-index:1;background:linear-gradient(90deg,rgba(6,21,45,.88),rgba(6,21,45,.30),rgba(6,21,45,.78))}
      .ai360-store-intro{border-color:rgba(29,92,255,.18);background:linear-gradient(180deg,#fff,#f6fbff)}
      .ai360-store-intro-rail{display:flex;gap:14px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;padding:2px 2px 12px}
      .ai360-store-intro-card{position:relative;flex:0 0 min(330px,78vw);min-height:190px;border:0;border-radius:8px;overflow:hidden;color:#fff;background:#06152d;text-align:left;box-shadow:0 16px 36px rgba(8,25,47,.13);scroll-snap-align:start}
      .ai360-store-intro-card span{position:absolute;z-index:2;left:14px;right:14px;bottom:14px;display:grid;gap:5px}.ai360-store-intro-card strong{font-size:18px;line-height:1.05}.ai360-store-intro-card small{font-weight:850;color:rgba(255,255,255,.86)}
      @media(max-width:900px){
        .container{width:min(100% - 16px,var(--max,1240px))!important}
        .floor-tabs,.filters,.view-tabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;gap:8px!important;padding-bottom:8px!important;scroll-snap-type:x mandatory}
        .floor-tabs button,.filters button,.view-tabs button{flex:0 0 auto!important;white-space:nowrap!important;min-height:42px!important;padding:10px 14px!important;font-size:14px!important}
        .ai360-opening-covers,.ai360-store-intro{margin-left:-2px;margin-right:-2px;padding:14px!important}
        .ai360-category-grid{display:flex!important;grid-template-columns:none!important;gap:10px!important;overflow-x:auto!important;scroll-snap-type:x mandatory;padding-bottom:8px}
        .ai360-category-cover{flex:0 0 78vw!important;min-height:174px!important;scroll-snap-align:start}
        .ai360-feature-grid,.opening-products.product-grid,.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
        .product-card,.ai360-feature-product{border-radius:8px!important;overflow:hidden!important;box-shadow:0 8px 22px rgba(8,25,47,.08)!important}
        .product-media{aspect-ratio:1/1!important;min-height:0!important}
        .product-media img{padding:8px!important}
        .product-info{padding:10px!important;display:grid!important;gap:7px!important}
        .product-info h3,.ai360-feature-product b{font-size:13px!important;line-height:1.18!important;display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;overflow:hidden!important;min-height:46px!important;margin:0!important}
        .product-info p,.product-info .specs,.product-info .media-status,.product-actions .btn:not(.btn-primary),.price-line .chip{display:none!important}
        .price-line{display:block!important;margin-top:0!important}.price{font-size:14px!important;line-height:1.12!important}
        .product-actions{margin-top:4px!important}.product-actions .btn-primary{width:100%!important;min-height:38px!important;padding:9px 8px!important;border-radius:8px!important;font-size:12px!important;line-height:1.1!important}
        .badge{font-size:10px!important;padding:5px 7px!important}.favorite{width:34px!important;height:34px!important}
      }
      @media(max-width:340px){.ai360-feature-grid,.opening-products.product-grid,.product-grid{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }
})();
