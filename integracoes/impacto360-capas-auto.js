(function () {
  "use strict";
  if (window.__impacto360CapasAuto) return;
  window.__impacto360CapasAuto = true;

  const profiles = {
    eletronicos: {
      label: "Eletronicos",
      subtitle: "Celulares, TVs, informatica e gadgets",
      store: "impacto-mobile",
      words: "celular smartphone iphone samsung motorola xiaomi computador informatica notebook laptop monitor teclado mouse headset gamer eletronico eletronicos tv smart drone fone camera tablet carregador"
    },
    brinquedos: {
      label: "Brinquedos",
      subtitle: "Carrinhos, bonecas, drones e educativos",
      store: "impacto-brinquedos",
      words: "brinquedo brinquedos boneca carrinho infantil crianca kids bebe baby educativo dinossauro robo helicoptero controle remoto mini cozinha maleta penteadeira pelucia cabana casinha"
    },
    moda: {
      label: "Moda",
      subtitle: "Vestidos, looks, acessorios e achados",
      store: "impacto-moda",
      words: "moda vestido blusa camisa calca legging jaqueta casaco saia short regata look roupa feminina masculino calcado tenis sandalia bolsa acessorio plus size"
    },
    casa: {
      label: "Casa e Decoracao",
      subtitle: "Cozinha, decor, utilidades e organizacao",
      store: "impacto-casa",
      words: "casa cozinha decor decoracao movel moveis utensilio panela faca facas silicone forno mesa banho cama organizador tapete lampada pulverizador azeite oleo eletrodomestico"
    },
    beleza: {
      label: "Beleza",
      subtitle: "Autocuidado, cosmeticos e bem-estar",
      store: "impacto-beauty-care",
      words: "beleza beauty care saude cosmetico maquiagem perfume skincare pele cabelo barba higiene bem-estar autocuidado spa"
    },
    outros: {
      label: "Outros",
      subtitle: "Ofertas gerais, servicos e produtos variados",
      store: "lojas-parceiras",
      words: "oferta ofertas servico servicos ferramenta auto pet esporte livro curso academico personalizado criador musica parceira mercado livre gerais"
    }
  };
  const order = ["eletronicos", "brinquedos", "moda", "casa", "beleza", "outros"];
  let stores = [];
  let timer = null;

  start();

  async function start() {
    injectStyle();
    await waitForProducts();
    stores = await loadStores();
    refresh();
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(refresh, 120);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  async function waitForProducts() {
    for (let i = 0; i < 40; i += 1) {
      if ((window.__impacto360GetProducts?.() || []).length) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async function loadStores() {
    try {
      const response = await fetch("dados/stores.json", { cache: "no-store" });
      const data = response.ok ? await response.json() : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function refresh() {
    applyImageFallbacks();
    addStoreCovers();
    addStoreHeroCover();
    renderOpeningShowcase();
  }

  function products() {
    return window.__impacto360GetProducts?.() || [];
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function html(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function attr(value) {
    return html(value);
  }

  function validImage(value) {
    const source = String(value || "").trim();
    return source && !/placeholder|sem[-_ ]?(foto|imagem)|no[-_ ]?image|COLOCAR_|URL_|LINK_/i.test(source);
  }

  function productImage(item) {
    const gallery = Array.isArray(item?.galeria) ? item.galeria : [];
    const extras = Array.isArray(item?.fotosExtras) ? item.fotosExtras : [];
    return [
      item?.fotoPrincipal,
      item?.imagemPrincipal,
      item?.image,
      item?.imagem,
      gallery[0],
      extras[0],
      item?.thumbnail
    ].map(cleanPath).find(validImage) || "";
  }

  function productLink(item) {
    return String([
      item?.linkCompra,
      item?.linkAfiliado,
      item?.affiliateLink,
      item?.linkComissionado,
      item?.linkPlataforma,
      item?.link_original_afiliado,
      item?.urlProduto,
      item?.url
    ].find(link => /^https?:\/\//i.test(String(link || ""))) || "").trim();
  }

  function cleanPath(value) {
    return String(value || "").trim().replace(/\\/g, "/");
  }

  function alternatePath(value) {
    const source = cleanPath(value);
    if (!source || source.startsWith("data:") || /^https?:\/\//i.test(source)) return "";
    if (source.startsWith("public/")) return source.slice(7);
    if (source.startsWith("/public/")) return "/" + source.slice(8);
    if (/^(images|produtos-impacto360|imagens)\//.test(source)) return "public/" + source;
    if (/^\/(images|produtos-impacto360|imagens)\//.test(source)) return "/public" + source;
    return "";
  }

  function imageErrorAttr() {
    return "if(!this.dataset.altPath){var s=this.getAttribute('src')||'';var n=s.indexOf('public/')===0?s.slice(7):(s.indexOf('images/')===0?'public/'+s:'');if(n){this.dataset.altPath='1';this.src=n;}else{this.remove();}}else{this.remove();}";
  }

  function visibleProduct(item) {
    if (!productImage(item) || !productLink(item)) return false;
    if (item?.aprovadoParaPublicacao === false) return false;
    if (String(item?.status || "").toLowerCase() === "rascunho") return false;
    return true;
  }

  function scoreText(text, groupId) {
    const source = normalize(text);
    return profiles[groupId].words.split(" ").reduce((sum, word) => sum + (word && source.includes(normalize(word)) ? 1 : 0), 0);
  }

  function bestGroup(text, fallback = "outros") {
    let best = fallback;
    let high = 0;
    order.forEach(groupId => {
      const score = scoreText(text, groupId);
      if (score > high) {
        high = score;
        best = groupId;
      }
    });
    return best;
  }

  function productGroup(item) {
    return bestGroup([
      item?.storeId,
      item?.category,
      item?.categoria,
      item?.subcategoria,
      item?.name,
      item?.nome,
      item?.description,
      item?.descricaoCurta,
      item?.badge
    ].join(" "));
  }

  function storeProducts(storeId) {
    return products().filter(item => item.storeId === storeId && visibleProduct(item));
  }

  function storeGroup(store) {
    const counts = {};
    storeProducts(store?.id).forEach(item => {
      const groupId = productGroup(item);
      counts[groupId] = (counts[groupId] || 0) + 1;
    });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (dominant) return dominant[0];
    return bestGroup([store?.id, store?.name, store?.commercialName, store?.category, store?.theme, store?.description, ...(store?.subcategories || [])].join(" "));
  }

  function coverForStore(store) {
    if (store?.coverImage) return cleanPath(store.coverImage);
    const own = storeProducts(store?.id).map(productImage).find(Boolean);
    if (own) return own;
    const groupId = storeGroup(store);
    const grouped = products().filter(item => visibleProduct(item) && productGroup(item) === groupId).map(productImage).find(Boolean);
    if (grouped) return grouped;
    return products().filter(visibleProduct).map(productImage).find(Boolean) || "";
  }

  function findStoreByTitle(text) {
    const wanted = normalize(text);
    return stores.find(store => normalize(store.name) === wanted || normalize(store.commercialName) === wanted);
  }

  function addStoreCovers() {
    document.querySelectorAll(".store-card").forEach(card => {
      const banner = card.querySelector(".store-banner");
      const title = card.querySelector("h3")?.textContent;
      if (!banner || !title || banner.querySelector(".ai360-store-cover-img")) return;
      const store = findStoreByTitle(title);
      const src = coverForStore(store);
      if (!src) return;
      card.classList.add("ai360-cover-ready");
      banner.classList.add("ai360-cover-banner");
      banner.insertAdjacentHTML("afterbegin", '<img class="ai360-store-cover-img" src="' + attr(src) + '" alt="" loading="lazy" decoding="async" onerror="' + imageErrorAttr() + '">');
    });
  }

  function addStoreHeroCover() {
    const hero = document.querySelector(".store-hero");
    if (!hero || hero.querySelector(".ai360-store-hero-img")) return;
    const store = findStoreByTitle(hero.querySelector("h1")?.textContent);
    const src = coverForStore(store);
    if (!src) return;
    hero.classList.add("ai360-store-hero-cover");
    hero.insertAdjacentHTML("afterbegin", '<img class="ai360-store-hero-img" src="' + attr(src) + '" alt="" loading="eager" decoding="async" onerror="' + imageErrorAttr() + '">');
  }

  function automaticGroups() {
    return order.map(groupId => {
      const items = products().filter(item => visibleProduct(item) && productGroup(item) === groupId);
      return { id: groupId, profile: profiles[groupId], items };
    }).filter(group => group.items.length);
  }

  function renderOpeningShowcase() {
    const mall = document.getElementById("mercadoLivreShowcase");
    if (!mall || document.getElementById("ai360OpeningCovers")) return;
    const groups = automaticGroups();
    if (!groups.length) return;
    const featured = groups.flatMap(group => group.items.slice(0, 4)).slice(0, 20);
    const cards = groups.map(group => {
      const item = group.items[0];
      const profileStore = stores.find(store => store.id === group.profile.store);
      const image = coverForStore(profileStore) || productImage(item);
      return '<button class="ai360-category-cover" type="button" data-ai360-group="' + attr(group.id) + '"><img src="' + attr(image) + '" alt="" loading="lazy" decoding="async" onerror="' + imageErrorAttr() + '"><span><strong>' + html(group.profile.label) + '</strong><small>' + html(group.profile.subtitle) + '</small><small>' + group.items.length + ' produtos prontos</small></span></button>';
    }).join("");
    const productsHtml = featured.map(item => {
      const image = productImage(item);
      const link = productLink(item);
      return '<article class="ai360-feature-product"><a href="' + attr(link) + '" target="_blank" rel="noopener noreferrer"><img src="' + attr(image) + '" alt="' + attr(item.name || item.nome || "Produto") + '" loading="lazy" decoding="async" onerror="' + imageErrorAttr() + '"><span><b>' + html(item.name || item.nome || "Produto") + '</b><small>' + html(item.price || item.preco || "Ver preco") + '</small></span></a></article>';
    }).join("");
    mall.insertAdjacentHTML("beforebegin", '<section id="ai360OpeningCovers" class="floor-block ai360-opening-covers"><div class="floor-head"><div><h3>Explore as lojas</h3><p>Capas realistas por nicho, ofertas e produtos prontos para abrir no celular.</p></div><span class="chip">' + featured.length + ' produtos em vitrine</span></div><div class="ai360-category-grid">' + cards + '</div><div class="ai360-feature-grid">' + productsHtml + '</div></section>');
    document.querySelectorAll("#ai360OpeningCovers [data-ai360-group]").forEach(button => {
      button.addEventListener("click", () => {
        const group = button.dataset.ai360Group;
        const store = stores.find(item => storeGroup(item) === group) || stores.find(item => item.id === profiles[group]?.store);
        if (store && typeof window.openStore === "function") window.openStore(store.id);
      });
    });
  }

  function applyImageFallbacks() {
    document.querySelectorAll("img").forEach(img => {
      if (img.dataset.ai360FallbackBound) return;
      img.dataset.ai360FallbackBound = "1";
      img.addEventListener("error", function () {
        const next = alternatePath(this.getAttribute("src") || this.src);
        if (next && this.dataset.altPathApplied !== "1") {
          this.dataset.altPathApplied = "1";
          this.src = next;
        }
      });
    });
  }

  function injectStyle() {
    if (document.getElementById("ai360CoverStyle")) return;
    const style = document.createElement("style");
    style.id = "ai360CoverStyle";
    style.textContent = `
      .ai360-cover-ready .store-banner{position:relative;min-height:154px;overflow:hidden;padding:0!important;color:#fff!important}
      .ai360-store-cover-img,.ai360-store-hero-img,.ai360-category-cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.08) contrast(1.04)}
      .ai360-cover-ready .store-banner::after,.ai360-store-hero-cover::after,.ai360-category-cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,21,45,.12),rgba(6,21,45,.78));pointer-events:none}
      .ai360-cover-ready .store-banner>*:not(.ai360-store-cover-img){position:relative;z-index:2;margin:16px}
      .ai360-store-hero-cover{position:relative;overflow:hidden;min-height:clamp(330px,42vw,520px);display:flex;align-items:flex-end;color:#fff!important}
      .ai360-store-hero-cover>*:not(.ai360-store-hero-img){position:relative;z-index:2}
      .ai360-store-hero-cover::after{z-index:1;background:linear-gradient(90deg,rgba(6,21,45,.86),rgba(6,21,45,.30),rgba(6,21,45,.78))}
      .ai360-opening-covers{border-color:rgba(29,92,255,.20);background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(246,251,255,.98))}
      .ai360-category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(214px,1fr));gap:14px;margin:0 0 18px}
      .ai360-category-cover{position:relative;min-height:184px;border:1px solid rgba(255,255,255,.72);border-radius:8px;overflow:hidden;color:#fff;background:#06152d;text-align:left;box-shadow:0 18px 42px rgba(8,25,47,.12)}
      .ai360-category-cover span{position:relative;z-index:2;min-height:184px;padding:16px;display:flex;flex-direction:column;justify-content:flex-end;gap:7px}
      .ai360-category-cover strong{font-size:23px;line-height:1.05}.ai360-category-cover small{color:rgba(255,255,255,.84);font-weight:850}
      .ai360-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
      .ai360-feature-product{border:1px solid var(--line,rgba(56,91,130,.16));border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(8,25,47,.08)}
      .ai360-feature-product a{display:grid;color:inherit;text-decoration:none}.ai360-feature-product img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff;padding:7px}
      .ai360-feature-product span{display:grid;gap:7px;padding:13px}.ai360-feature-product b{font-size:15px;line-height:1.25}.ai360-feature-product small{color:#0f7d69;font-weight:950}
      @media(max-width:900px){.ai360-category-grid{display:flex;grid-template-columns:none;overflow-x:auto;gap:10px;padding-bottom:8px}.ai360-category-cover{flex:0 0 78vw;min-height:174px}.ai360-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ai360-feature-product b{font-size:13px;line-height:1.18;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:46px}.ai360-feature-product span{padding:10px}}
      @media(max-width:340px){.ai360-feature-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
})();
