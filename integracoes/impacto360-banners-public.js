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
    return data.banners.filter(function (item) {
      return item.active && item.image && safe(item.link);
    }).sort(function (a, b) { return Number(a.order) - Number(b.order); });
  }

  function activeAds() {
    const now = new Date();
    return data.ads.filter(function (item) {
      const start = parseDate(item.startDate, false);
      const end = parseDate(item.endDate, true);
      return item.active && item.image && item.title && safe(item.link) && (!start || start <= now) && (!end || end >= now);
    }).sort(function (a, b) { return Number(a.priority) - Number(b.priority); });
  }

  function parseDate(value, end) {
    if (!value) return null;
    const result = new Date(value + (String(value).length === 10 ? (end ? "T23:59:59.999" : "T00:00:00") : ""));
    return Number.isNaN(result.getTime()) ? null : result;
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
    holder.innerHTML = '<section class="floor-block promo360-ads"><div class="floor-head"><div><h3>Anuncios variados</h3><p>Ofertas, campanhas, cupons e lojas parceiras.</p></div><span class="chip">' + items.length + ' campanhas ativas</span></div>' +
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
    css.textContent = '.promo360-panel{padding:0!important}.promo360-panel>.search-row,.promo360-panel>.floor-tabs,.promo360-panel>.filters{margin-left:32px;margin-right:32px}.promo360-panel>.filters{margin-bottom:28px}#promo360Hero,.promo360-adbox{position:relative;overflow:hidden}.promo360-track{position:relative;min-height:390px}.promo360-slide,.promo360-ad{position:absolute;inset:0;opacity:0;visibility:hidden;transition:.4s}.promo360-slide.active,.promo360-ad.active{opacity:1;visibility:visible}.promo360-slide>a{min-height:390px;display:grid;grid-template-columns:1.15fr .85fr;color:#fff;background:linear-gradient(135deg,#06152d,#12677d)}.promo360-copy,.promo360-adcopy{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:38px}.promo360-copy h1{font-size:clamp(34px,5vw,64px);line-height:1;margin:12px 0}.promo360-copy b,.promo360-adcopy b{padding:13px 18px;border-radius:999px;background:#f3ce7b;color:#10213a}.promo360-media,.promo360-admedia{display:grid;place-items:center;padding:22px}.promo360-media img{width:100%;height:330px;object-fit:contain;background:#fff;border-radius:8px}.promo360-ads{padding:0!important;overflow:hidden}.promo360-ads>.floor-head{padding:20px 20px 0}.promo360-adtrack{position:relative;min-height:320px}.promo360-ad>a{min-height:320px;display:grid;grid-template-columns:.8fr 1.2fr;color:#fff;background:linear-gradient(135deg,#0b2850,#12677d)}.promo360-admedia img{width:100%;height:250px;object-fit:contain;background:#fff;border-radius:8px}.promo360-controls{position:absolute;z-index:4;right:16px;bottom:14px;display:flex;gap:7px}.promo360-controls button{width:42px;height:42px;border:0;border-radius:50%;background:#06152d;color:#fff;font-size:22px}.promo360-empty{padding:45px;text-align:center;background:#eef7ff;color:#607083}@media(max-width:760px){.promo360-panel>.search-row,.promo360-panel>.floor-tabs,.promo360-panel>.filters{margin-left:14px;margin-right:14px}.promo360-track{min-height:570px}.promo360-slide>a{min-height:570px;grid-template-columns:1fr;grid-template-rows:auto 230px}.promo360-copy{padding:25px 20px 10px}.promo360-media{padding:5px 20px 55px}.promo360-media img{height:210px}.promo360-adtrack,.promo360-ad>a{min-height:540px}.promo360-ad>a{grid-template-columns:1fr;grid-template-rows:250px auto}.promo360-admedia img{height:220px}.promo360-adcopy{padding:20px 20px 60px}}';
    document.head.appendChild(css);
  }

  function loadStoreCovers() {
    if (window.__ai360StoreCoverFixLoader) return;
    window.__ai360StoreCoverFixLoader = true;
    const script = document.createElement("script");
    script.src = "integracoes/impacto360-capas-fix.js?v=20260624-4";
    script.defer = true;
    document.head.appendChild(script);
  }

  function text(value) { return esc(value || ""); }
  function esc(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
})();