(function () {
  "use strict";
  const KEY = "ai360:marketingContent:v1";
  let data = { settings: { bannerRotationMs: 6500, adRotationMs: 5200 }, banners: [], ads: [] };
  let heroIndex = 0;
  let adIndex = 0;
  let heroTimer;
  let adTimer;
  let writing = false;

  start();

  async function start() {
    await load();
    style();
    hero();
    ads();
    loadStoreCovers();
    try { window.renderMercadoLivreShowcase = ads; } catch {}
    const holder = document.getElementById("mercadoLivreShowcase");
    if (holder) new MutationObserver(function () {
      if (!writing && !holder.querySelector(".promo360-ads")) setTimeout(ads, 0);
    }).observe(holder, { childList: true });
  }

  async function load() {
    try {
      const response = await fetch("dados/banners-anuncios.json", { cache: "no-store" });
      if (response.ok) data = await response.json();
    } catch {}
    try {
      const local = localStorage.getItem(KEY);
      if (local) data = JSON.parse(local);
    } catch {}
    data.settings = data.settings || {};
    data.banners = Array.isArray(data.banners) ? data.banners : [];
    data.ads = Array.isArray(data.ads) ? data.ads : [];
  }

  function safe(link) {
    link = String(link || "").trim();
    return /^https:\/\//i.test(link) || /^(?:\/(?!\/)|\.{1,2}\/|#|\?)/.test(link);
  }

  function attrs(link) {
    link = String(link || "").trim();
    return safe(link) ? 'href="' + esc(link) + '"' + (/^https:\/\//i.test(link) ? ' target="_blank" rel="noopener noreferrer sponsored"' : "") : "";
  }

  function banners() {
    const items = data.banners.filter(function (item) {
      return item.active && item.image && safe(item.link);
    }).sort(function (a, b) { return Number(a.order) - Number(b.order); });
    return diversifyRotation(items, 36);
  }

  function activeAds() {
    const now = new Date();
    const items = data.ads.filter(function (item) {
      const start = parseDate(item.startDate, false);
      const end = parseDate(item.endDate, true);
      return item.active && item.image && item.title && safe(item.link) && (!start || start <= now) && (!end || end >= now);
    }).sort(function (a, b) { return Number(a.priority) - Number(b.priority); });
    return diversifyRotation(items, 140);
  }

  function parseDate(value, end) {
    if (!value) return null;
    const result = new Date(value + (String(value).length === 10 ? (end ? "T23:59:59.999" : "T00:00:00") : ""));
    return Number.isNaN(result.getTime()) ? null : result;
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function rotationKey(item) {
    const text = normalize([item.category, item.storeId, item.source, item.rotationGroup, item.title, item.description].join(" "));
    if (/notebook gamer|pc gamer|rtx|geforce/.test(text)) return "games-computadores";
    if (/controle|controller|dualsense|xbox|playstation|gamepad/.test(text)) return "games-controles";
    if (/monitor gamer|monitor/.test(text)) return "games-monitores";
    if (/mouse|teclado|headset|ssd|mousepad|cadeira gamer/.test(text)) return "games-acessorios";
    if (/celular|smartphone|iphone|samsung|motorola|xiaomi/.test(text)) return "tecnologia-celular";
    if (/casa|cozinha|forno|panela|air fryer|liquidificador|cafeteira/.test(text)) return "casa-cozinha";
    if (/brinquedo|boneca|carrinho|infantil|bebe|baby/.test(text)) return "brinquedos";
    if (/moda|calcado|tenis|sapato|sandalia|bota|camisa|vestido|bolsa/.test(text)) return "moda";
    if (/ferramenta|auto|oficina|lavadora|escada/.test(text)) return "ferramentas";
    return normalize(item.storeId || item.source || "outros") || "outros";
  }

  function diversifyRotation(items, maxItems) {
    const buckets = new Map();
    items.forEach(function (item, index) {
      const key = rotationKey(item);
      if (!buckets.has(key)) buckets.set(key, { key, firstIndex: index, cursor: 0, items: [] });
      buckets.get(key).items.push(item);
    });
    const ordered = Array.from(buckets.values()).sort(function (a, b) {
      return a.firstIndex - b.firstIndex;
    });
    const mixed = [];
    let lastKey = "";
    let added = true;
    while (added && mixed.length < maxItems) {
      added = false;
      ordered.forEach(function (bucket) {
        if (mixed.length >= maxItems || bucket.cursor >= bucket.items.length) return;
        if (ordered.length > 1 && bucket.key === lastKey) return;
        mixed.push(bucket.items[bucket.cursor]);
        bucket.cursor += 1;
        lastKey = bucket.key;
        added = true;
      });
      if (!added) {
        const next = ordered.find(function (bucket) { return bucket.cursor < bucket.items.length; });
        if (next) {
          mixed.push(next.items[next.cursor]);
          next.cursor += 1;
          lastKey = next.key;
          added = true;
        }
      }
    }
    return mixed;
  }

  function hero() {
    const panel = document.querySelector(".mall-panel");
    if (!panel) return;
    panel.classList.add("promo360-panel");
    Array.from(panel.children).forEach(function (child) {
      if (child.matches(".eyebrow,h1,p")) child.hidden = true;
    });
    let root = document.getElementById("promo360Hero");
    if (!root) {
      root = document.createElement("div");
      root.id = "promo360Hero";
      panel.prepend(root);
    }
    const items = banners();
    heroIndex = Math.min(heroIndex, Math.max(0, items.length - 1));
    root.innerHTML = items.length ? '<div class="promo360-track">' + items.map(function (item, index) {
      return '<article class="promo360-slide ' + (index === heroIndex ? "active" : "") + '"><a ' + attrs(item.link) + '><div class="promo360-copy"><small>OFERTA SELECIONADA</small><h1>' + text(item.title) + '</h1><p>' + text(item.description) + '</p><b>Ver oferta</b></div><div class="promo360-media"><img src="' + esc(item.image) + '" alt="' + esc(item.title || "Banner") + '" loading="' + (index ? "lazy" : "eager") + '"></div></a></article>';
    }).join("") + '</div>' + controls(items.length) : '<div class="promo360-empty">Novas ofertas serao publicadas em breve.</div>';
    bind(root, "hero");
    rotate("hero");
  }

  function ads() {
    const holder = document.getElementById("mercadoLivreShowcase");
    if (!holder) return;
    writing = true;
    const items = activeAds();
    adIndex = Math.min(adIndex, Math.max(0, items.length - 1));
    holder.innerHTML = '<section class="floor-block promo360-ads"><div class="floor-head"><div><h3>Ofertas em rotacao</h3></div></div>' +
      (items.length ? '<div class="promo360-adbox"><div class="promo360-adtrack">' + items.map(function (item, index) {
        return '<article class="promo360-ad ' + (index === adIndex ? "active" : "") + '"><a ' + attrs(item.link) + '><div class="promo360-admedia"><img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy"></div><div class="promo360-adcopy"><small>DESTAQUE PROMOCIONAL</small><h3>' + text(item.title) + '</h3><p>' + text(item.description) + '</p><b>' + text(item.buttonLabel || "Ver oferta") + '</b></div></a></article>';
      }).join("") + '</div>' + controls(items.length) + '</div>' : '<div class="promo360-empty">Nenhuma campanha ativa no momento.</div>') + '</section>';
    const box = holder.querySelector(".promo360-adbox");
    if (box) { bind(box, "ad"); rotate("ad"); }
    setTimeout(function () { writing = false; }, 0);
  }

  function controls(length) {
    if (length < 2) return "";
    return '<div class="promo360-controls"><button data-step="-1">&lsaquo;</button><button data-step="1">&rsaquo;</button></div>';
  }

  function bind(root, kind) {
    root.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () { show(kind, Number(button.dataset.step)); });
    });
    root.addEventListener("mouseenter", function () { stop(kind); });
    root.addEventListener("mouseleave", function () { rotate(kind); });
    root.addEventListener("focusin", function () { stop(kind); });
    root.addEventListener("focusout", function () { rotate(kind); });
  }

  function show(kind, step) {
    const root = kind === "hero" ? document.getElementById("promo360Hero") : document.querySelector(".promo360-adbox");
    const slides = Array.from(root.querySelectorAll(kind === "hero" ? ".promo360-slide" : ".promo360-ad"));
    if (!slides.length) return;
    if (kind === "hero") heroIndex = (heroIndex + step + slides.length) % slides.length;
    else adIndex = (adIndex + step + slides.length) % slides.length;
    const active = kind === "hero" ? heroIndex : adIndex;
    slides.forEach(function (slide, index) { slide.classList.toggle("active", index === active); });
    rotate(kind);
  }

  function stop(kind) {
    if (kind === "hero") clearInterval(heroTimer); else clearInterval(adTimer);
  }

  function rotate(kind) {
    stop(kind);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const count = kind === "hero" ? banners().length : activeAds().length;
    if (count < 2) return;
    const ms = Math.max(3000, Number(kind === "hero" ? data.settings.bannerRotationMs : data.settings.adRotationMs) || 6000);
    if (kind === "hero") heroTimer = setInterval(function () { show("hero", 1); }, ms);
    else adTimer = setInterval(function () { show("ad", 1); }, ms);
  }

  function style() {
    const css = document.createElement("style");
    css.textContent = `
      .promo360-panel{padding:18px 22px 20px!important}
      .promo360-panel .market-hero-banner{display:none!important}
      .promo360-panel>.search-row,.promo360-panel>.floor-tabs,.promo360-panel>.filters{margin-left:0;margin-right:0}
      .promo360-panel>.filters{margin-bottom:10px}
      #promo360Hero,.promo360-adbox{position:relative;overflow:hidden}
      .promo360-track{position:relative;min-height:168px}
      .promo360-slide,.promo360-ad{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .18s ease}
      .promo360-slide.active,.promo360-ad.active{opacity:1;visibility:visible}
      .promo360-slide>a{min-height:168px;display:grid;grid-template-columns:minmax(0,1fr) 220px;color:#fff;background:linear-gradient(135deg,#06152d,#0d415b 58%,#12677d)}
      .promo360-copy,.promo360-adcopy{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:18px 20px}
      .promo360-copy small,.promo360-adcopy small{display:inline-flex;align-items:center;min-height:24px;border-radius:999px;padding:0 10px;background:rgba(255,255,255,.14);color:#ffe9a8;font-size:11px;font-weight:950}
      .promo360-copy h1{max-width:620px;font-size:clamp(22px,2.35vw,32px);line-height:1.08;margin:8px 0 12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .promo360-copy p,.promo360-adcopy p{display:none}
      .promo360-copy b,.promo360-adcopy b{padding:12px 17px;border-radius:999px;background:#f3ce7b;color:#10213a;font-weight:950}
      .promo360-media,.promo360-admedia{display:grid;place-items:center;padding:12px}
      .promo360-media img{width:100%;height:144px;object-fit:contain;background:#fff;border-radius:8px;padding:8px}
      .promo360-ads{padding:0!important;overflow:hidden}
      .promo360-ads>.floor-head{padding:18px 20px 0}
      .promo360-adtrack{position:relative;min-height:280px}
      .promo360-ad>a{min-height:280px;display:grid;grid-template-columns:360px 1fr;color:#fff;background:linear-gradient(135deg,#0b2850,#12677d)}
      .promo360-admedia img{width:100%;height:225px;object-fit:contain;background:#fff;border-radius:8px;padding:8px}
      .promo360-controls{position:absolute;z-index:4;right:16px;bottom:14px;display:flex;gap:7px}
      .promo360-controls button{width:42px;height:42px;border:0;border-radius:50%;background:#06152d;color:#fff;font-size:22px}
      .promo360-empty{padding:45px;text-align:center;background:#eef7ff;color:#607083}
      @media(max-width:760px){
        .promo360-panel{padding:10px!important}
        .promo360-panel>.search-row,.promo360-panel>.floor-tabs,.promo360-panel>.filters{margin-left:0;margin-right:0}
        .promo360-track{min-height:136px}
        .promo360-slide>a{min-height:136px;grid-template-columns:minmax(0,1fr) 112px;grid-template-rows:none}
        .promo360-copy{padding:12px 8px 12px 14px}
        .promo360-copy h1{font-size:17px;max-height:40px}
        .promo360-copy p{display:none!important}
        .promo360-copy b{padding:8px 11px;font-size:12px}
        .promo360-media{padding:8px}
        .promo360-media img{height:118px}
        .promo360-adtrack,.promo360-ad>a{min-height:260px}
        .promo360-ad>a{grid-template-columns:145px 1fr;grid-template-rows:none}
        .promo360-admedia img{height:150px}
        .promo360-adcopy{padding:14px 14px 48px}
        .promo360-adcopy p{display:none!important}
      }`;
    document.head.appendChild(css);
  }

  function loadStoreCovers() {
    if (window.__ai360StoreCoverFixLoader) return;
    window.__ai360StoreCoverFixLoader = true;
    const script = document.createElement("script");
    script.src = "integracoes/impacto360-capas-fix.js?v=20260721-ux-compacto-v1";
    script.defer = true;
    document.head.appendChild(script);
  }

  function text(value) { return esc(value || ""); }
  function esc(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
})();
