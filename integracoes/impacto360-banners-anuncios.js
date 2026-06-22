(function () {
  "use strict";

  if (window.__impacto360MarketingManager) return;
  window.__impacto360MarketingManager = true;

  const ROUTE = new URLSearchParams(location.search).get("route") || location.pathname;
  const ADMIN_ROUTE = "/admin/banners-anuncios";
  const STORAGE_KEY = "ai360:marketingContent:v1";
  const AUTH_KEY = "impacto360:sala-agentes:auth:v2";
  const PASSWORD = "Impacto360!Sala#J7K9-2026";
  const DEFAULTS = {
    settings: { bannerRotationMs: 6500, adRotationMs: 5200 },
    banners: [
      { id: "banner-smartphones", image: "produtos-impacto360/telefone-mercado-livre-001/imagem-01.webp", title: "Smartphones para todos os momentos", description: "Confira aparelhos selecionados e compre diretamente na loja parceira.", link: "https://meli.la/2vjQGTa", active: true, order: 1 },
      { id: "banner-notebooks", image: "produtos-impacto360/mercado-livre-produto-001/imagem-01.webp", title: "Tecnologia para trabalhar e jogar", description: "Notebooks e computadores em destaque com acesso rápido à oferta.", link: "https://meli.la/1yUPmtC", active: true, order: 2 },
      { id: "banner-casa", image: "imagens/01_kit-c-12-utensilios-de-cozinha-silicone-cabo-madeira.png", title: "Achados para casa e cozinha", description: "Produtos úteis para renovar sua rotina com praticidade.", link: "https://meli.la/1PPnKbt", active: true, order: 3 }
    ],
    ads: [
      { id: "ad-oferta-celular", image: "produtos-impacto360/telefone-mercado-livre-002/imagem-01.webp", title: "Oferta em smartphone", description: "Acesse a condição disponível na loja parceira e confira detalhes, entrega e garantia.", buttonLabel: "Ver oferta", link: "https://meli.la/1zuEk6q", startDate: "2026-01-01", endDate: "", active: true, priority: 1 },
      { id: "ad-notebook-gamer", image: "produtos-impacto360/mercado-livre-produto-002/imagem-01.webp", title: "Notebook gamer em destaque", description: "Desempenho para jogos, criação e produtividade em uma oferta selecionada.", buttonLabel: "Comprar na loja", link: "https://meli.la/2kPvwBZ", startDate: "2026-01-01", endDate: "", active: true, priority: 2 },
      { id: "ad-forno-eletrico", image: "produtos-impacto360/loja-parceira-001/imagem-01.webp", title: "Destaque para sua cozinha", description: "Uma seleção especial de utilidades e eletrodomésticos para facilitar o dia a dia.", buttonLabel: "Conferir promoção", link: "https://mercadolivre.com/sec/14EbgVy", startDate: "2026-01-01", endDate: "", active: true, priority: 3 },
      { id: "ad-kit-cozinha", image: "imagens/01_kit-c-12-utensilios-de-cozinha-silicone-cabo-madeira.png", title: "Cupom e achados para casa", description: "Veja utensílios selecionados e consulte as condições atuais no site de compras.", buttonLabel: "Aproveitar agora", link: "https://meli.la/1PPnKbt", startDate: "2026-01-01", endDate: "", active: true, priority: 4 }
    ]
  };

  let content = clone(DEFAULTS);
  let heroIndex = 0;
  let adIndex = 0;
  let heroTimer = null;
  let adTimer = null;
  let renderingAds = false;
  let selectedBanner = "";
  let selectedAd = "";

  if (ROUTE === ADMIN_ROUTE) {
    ready(function () { setTimeout(renderAdmin, 1000); });
  } else if (!ROUTE.startsWith("/admin/")) {
    ready(initPublic);
  }

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
    else callback();
  }

  async function loadContent() {
    try {
      const response = await fetch("dados/banners-anuncios.json", { cache: "no-store" });
      if (response.ok) content = normalize(await response.json());
    } catch {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) content = normalize(JSON.parse(stored));
    } catch {}
    return content;
  }

  async function initPublic() {
    await loadContent();
    injectPublicStyle();
    renderHero();
    renderAds();
    try { window.renderMercadoLivreShowcase = renderAds; } catch {}
    const holder = document.getElementById("mercadoLivreShowcase");
    if (holder) {
      new MutationObserver(function () {
        if (!renderingAds && !holder.querySelector(".promo360-section")) setTimeout(renderAds, 0);
      }).observe(holder, { childList: true });
    }
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) loadContent().then(function () { renderHero(); renderAds(); });
    });
  }

  function normalize(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      settings: {
        bannerRotationMs: interval(source.settings?.bannerRotationMs, 6500),
        adRotationMs: interval(source.settings?.adRotationMs, 5200)
      },
      banners: (Array.isArray(source.banners) ? source.banners : []).map(function (item, index) {
        return { id: text(item.id || "banner-" + (index + 1)), image: text(item.image), title: text(item.title), description: text(item.description), link: text(item.link), active: item.active === true || item.active === "true", order: Math.max(1, Number(item.order) || index + 1) };
      }),
      ads: (Array.isArray(source.ads) ? source.ads : []).map(function (item, index) {
        return { id: text(item.id || "ad-" + (index + 1)), image: text(item.image), title: text(item.title), description: text(item.description), buttonLabel: text(item.buttonLabel || "Ver oferta"), link: text(item.link), startDate: text(item.startDate), endDate: text(item.endDate), active: item.active === true || item.active === "true", priority: Math.max(1, Number(item.priority) || index + 1) };
      })
    };
  }

  function interval(value, fallback) {
    return Math.min(60000, Math.max(3000, Number(value) || fallback));
  }

  function safeLink(value) {
    const link = text(value);
    if (!link || /^(?:javascript|data|vbscript|file):/i.test(link) || link.startsWith("//")) return false;
    return /^https:\/\//i.test(link) || /^(?:\/(?!\/)|\.{1,2}\/|#|\?)/.test(link);
  }

  function linkAttrs(value) {
    const link = text(value);
    return safeLink(link) ? 'href="' + attr(link) + '"' + (/^https:\/\//i.test(link) ? ' target="_blank" rel="noopener noreferrer sponsored"' : "") : "";
  }

  function activeBanners() {
    return content.banners.filter(function (item) { return item.active && item.image && safeLink(item.link); }).sort(function (a, b) { return a.order - b.order; });
  }

  function activeAds() {
    const now = new Date();
    return content.ads.filter(function (item) {
      const start = campaignDate(item.startDate, false);
      const end = campaignDate(item.endDate, true);
      return item.active && item.image && item.title && safeLink(item.link) && (!start || start <= now) && (!end || end >= now);
    }).sort(function (a, b) { return a.priority - b.priority; });
  }

  function campaignDate(value, end) {
    const raw = text(value);
    if (!raw) return null;
    const result = new Date(raw + (raw.length === 10 ? (end ? "T23:59:59.999" : "T00:00:00") : ""));
    return Number.isNaN(result.getTime()) ? null : result;
  }

  function renderHero() {
    const panel = document.querySelector(".mall-panel");
    if (!panel) return;
    panel.classList.add("promo360-hero-panel");
    Array.from(panel.children).forEach(function (child) {
      if (child.matches(".eyebrow, h1, p")) child.hidden = true;
    });
    let root = document.getElementById("promo360Hero");
    if (!root) {
      root = document.createElement("div");
      root.id = "promo360Hero";
      root.className = "promo360-hero";
      panel.prepend(root);
    }
    const items = activeBanners();
    clearInterval(heroTimer);
    heroIndex = Math.min(heroIndex, Math.max(0, items.length - 1));
    if (!items.length) {
      root.innerHTML = '<div class="promo360-empty"><h1>Shopping Virtual IMPACTO 360</h1><p>Novas ofertas serão publicadas em breve.</p></div>';
      return;
    }
    root.innerHTML = '<div class="promo360-track">' + items.map(function (item, index) {
      return '<article class="promo360-slide ' + (index === heroIndex ? "active" : "") + '"><a ' + linkAttrs(item.link) + ' aria-label="' + attr(item.title || "Abrir oferta") + '"><div class="promo360-copy"><span>OFERTA SELECIONADA</span>' + (item.title ? "<h1>" + html(item.title) + "</h1>" : "") + (item.description ? "<p>" + html(item.description) + "</p>" : "") + '<b>Ver oferta</b></div><div class="promo360-media"><img src="' + attr(item.image) + '" alt="' + attr(item.title || "Banner promocional") + '" loading="' + (index ? "lazy" : "eager") + '" decoding="async"></div></a></article>';
    }).join("") + '</div>' + controls(items.length, heroIndex);
    bindCarousel(root, "hero");
    showSlide("hero", heroIndex, false);
    startRotation("hero");
  }

  function renderAds() {
    const holder = document.getElementById("mercadoLivreShowcase");
    if (!holder) return;
    renderingAds = true;
    const items = activeAds();
    clearInterval(adTimer);
    adIndex = Math.min(adIndex, Math.max(0, items.length - 1));
    holder.innerHTML = '<section class="floor-block promo360-section"><div class="floor-head"><div><h3>Anúncios variados</h3><p>Ofertas, campanhas, cupons e lojas parceiras atualizados continuamente.</p></div><span class="chip">' + items.length + ' campanhas ativas</span></div>' +
      (items.length ? '<div class="promo360-ad-carousel"><div class="promo360-ad-track">' + items.map(function (item, index) {
        return '<article class="promo360-ad-slide ' + (index === adIndex ? "active" : "") + '"><a ' + linkAttrs(item.link) + ' aria-label="' + attr(item.title) + '"><div class="promo360-ad-media"><img src="' + attr(item.image) + '" alt="' + attr(item.title) + '" loading="lazy" decoding="async"></div><div class="promo360-ad-copy"><span>DESTAQUE PROMOCIONAL</span><h3>' + html(item.title) + '</h3><p>' + html(item.description) + '</p><b>' + html(item.buttonLabel) + '</b></div></a></article>';
      }).join("") + '</div>' + controls(items.length, adIndex) + '</div>' : '<div class="promo360-empty"><strong>Nenhuma campanha ativa no momento.</strong><p>Volte em breve para conferir novas oportunidades.</p></div>') + '</section>';
    const carousel = holder.querySelector(".promo360-ad-carousel");
    if (carousel) {
      bindCarousel(carousel, "ad");
      showSlide("ad", adIndex, false);
      startRotation("ad");
    }
    setTimeout(function () { renderingAds = false; }, 0);
  }

  function controls(length, index) {
    if (length < 2) return "";
    return '<div class="promo360-controls"><button type="button" data-step="-1" aria-label="Anterior">&lsaquo;</button>' +
      Array.from({ length: length }, function (_, i) { return '<button type="button" class="dot ' + (i === index ? "active" : "") + '" data-index="' + i + '" aria-label="Exibir item ' + (i + 1) + '"></button>'; }).join("") +
      '<button type="button" data-step="1" aria-label="Próximo">&rsaquo;</button></div>';
  }

  function bindCarousel(root, kind) {
    root.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () { showSlide(kind, (kind === "hero" ? heroIndex : adIndex) + Number(button.dataset.step)); });
    });
    root.querySelectorAll("[data-index]").forEach(function (button) {
      button.addEventListener("click", function () { showSlide(kind, Number(button.dataset.index)); });
    });
    root.addEventListener("mouseenter", function () { stopRotation(kind); });
    root.addEventListener("mouseleave", function () { startRotation(kind); });
    root.addEventListener("focusin", function () { stopRotation(kind); });
    root.addEventListener("focusout", function () { setTimeout(function () { if (!root.contains(document.activeElement)) startRotation(kind); }, 0); });
  }

  function showSlide(kind, index, restart) {
    const root = kind === "hero" ? document.getElementById("promo360Hero") : document.querySelector(".promo360-ad-carousel");
    const slides = Array.from(root?.querySelectorAll(kind === "hero" ? ".promo360-slide" : ".promo360-ad-slide") || []);
    if (!slides.length) return;
    const next = (Number(index) + slides.length) % slides.length;
    if (kind === "hero") heroIndex = next; else adIndex = next;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === next);
      const link = slide.querySelector("a");
      if (link) link.tabIndex = i === next ? 0 : -1;
    });
    root.querySelectorAll(".dot").forEach(function (dot, i) { dot.classList.toggle("active", i === next); });
    if (restart !== false) startRotation(kind);
  }

  function stopRotation(kind) {
    if (kind === "hero") { clearInterval(heroTimer); heroTimer = null; }
    else { clearInterval(adTimer); adTimer = null; }
  }

  function startRotation(kind) {
    stopRotation(kind);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((kind === "hero" ? activeBanners() : activeAds()).length < 2) return;
    if (kind === "hero") heroTimer = setInterval(function () { showSlide("hero", heroIndex + 1, false); }, content.settings.bannerRotationMs);
    else adTimer = setInterval(function () { showSlide("ad", adIndex + 1, false); }, content.settings.adRotationMs);
  }

  function injectPublicStyle() {
    if (document.getElementById("promo360Style")) return;
    const style = document.createElement("style");
    style.id = "promo360Style";
    style.textContent = `
      .promo360-hero-panel{padding:0!important}.promo360-hero-panel>.search-row,.promo360-hero-panel>.floor-tabs,.promo360-hero-panel>.filters{margin-left:clamp(18px,4vw,42px);margin-right:clamp(18px,4vw,42px)}.promo360-hero-panel>.filters{margin-bottom:clamp(18px,4vw,36px)}
      .promo360-hero,.promo360-ad-carousel{position:relative;overflow:hidden;border-radius:inherit}.promo360-track{position:relative;min-height:390px}.promo360-slide,.promo360-ad-slide{position:absolute;inset:0;opacity:0;visibility:hidden;pointer-events:none;transform:translateX(18px);transition:.42s ease}.promo360-slide.active,.promo360-ad-slide.active{opacity:1;visibility:visible;pointer-events:auto;transform:none}
      .promo360-slide>a{min-height:390px;display:grid;grid-template-columns:1.15fr .85fr;color:#fff;background:radial-gradient(circle at 15% 20%,#27d7e840,transparent 34%),linear-gradient(135deg,#06152d,#124a78)}.promo360-copy{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:clamp(26px,5vw,58px)}.promo360-copy span,.promo360-ad-copy span{font-size:11px;font-weight:950;letter-spacing:.08em}.promo360-copy h1{margin:14px 0 10px;font-size:clamp(34px,5vw,64px);line-height:1}.promo360-copy p{font-size:17px!important}.promo360-copy b,.promo360-ad-copy b{display:inline-flex;align-items:center;min-height:46px;margin-top:8px;padding:0 18px;border-radius:999px;color:#10213a;background:linear-gradient(135deg,#f3ce7b,#fff1bd)}.promo360-media{display:grid;place-items:center;padding:24px 28px 24px 0}.promo360-media img{width:100%;height:330px;object-fit:contain;border-radius:8px;background:#fff;box-shadow:0 24px 54px #0004}
      .promo360-controls{position:absolute;z-index:6;left:15px;right:15px;bottom:13px;display:flex;justify-content:center;align-items:center;gap:7px}.promo360-controls button{border:1px solid #ffffff80;color:#fff;background:#06152dbb}.promo360-controls button:not(.dot){width:38px;height:38px;border-radius:50%;font-size:22px}.promo360-controls .dot{width:10px;height:10px;padding:0;border-radius:999px}.promo360-controls .dot.active{width:27px;background:#f3ce7b;border-color:#f3ce7b}
      .promo360-section{padding:0!important;overflow:hidden}.promo360-section>.floor-head{padding:20px 20px 0}.promo360-ad-track{position:relative;min-height:320px}.promo360-ad-slide>a{min-height:320px;display:grid;grid-template-columns:.8fr 1.2fr;color:#fff;background:radial-gradient(circle at 92% 8%,#f3ce7b48,transparent 34%),linear-gradient(135deg,#0b2850,#12677d)}.promo360-ad-media{display:grid;place-items:center;padding:22px}.promo360-ad-media img{width:100%;height:250px;object-fit:contain;border-radius:8px;background:#fff}.promo360-ad-copy{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:32px 64px 48px 28px}.promo360-ad-copy h3{margin:10px 0;font-size:clamp(26px,4vw,42px)}.promo360-ad-copy p{color:#ffffffd1;line-height:1.55}.promo360-empty{min-height:220px;display:grid;place-content:center;padding:28px;text-align:center;background:linear-gradient(135deg,#fff,#eef7ff);color:#607083}
      @media(max-width:760px){.promo360-track{min-height:570px}.promo360-slide>a{min-height:570px;grid-template-columns:1fr;grid-template-rows:auto 230px}.promo360-copy{padding:28px 20px 12px}.promo360-copy h1{font-size:clamp(32px,11vw,48px)}.promo360-media{padding:8px 20px 58px}.promo360-media img{height:210px}.promo360-ad-track,.promo360-ad-slide>a{min-height:540px}.promo360-ad-slide>a{grid-template-columns:1fr;grid-template-rows:250px auto}.promo360-ad-media{padding:18px 18px 0}.promo360-ad-media img{height:230px}.promo360-ad-copy{padding:20px 20px 62px}}
    `;
    document.head.appendChild(style);
  }

  async function renderAdmin(message) {
    await loadContent();
    injectAdminStyle();
    document.body.className = "";
    document.body.innerHTML = '<main class="promo-admin"><section data-promo-admin></section></main>';
    if (sessionStorage.getItem(AUTH_KEY) === "ok") renderManager(message);
    else renderLogin(message);
  }

  function renderLogin(message) {
    const root = document.querySelector("[data-promo-admin]");
    root.innerHTML = '<section class="promo-card promo-login"><span>360</span><h1>Gestão de Banners e Anúncios Promocionais</h1><p>Área protegida para organizar as campanhas exibidas na página inicial.</p><form data-promo-login><input type="password" name="password" placeholder="Senha administrativa" autocomplete="current-password"><button type="submit">Entrar</button></form><small>' + html(message || "Acesso protegido.") + '</small></section>';
    root.querySelector("[data-promo-login]").addEventListener("submit", function (event) {
      event.preventDefault();
      if (new FormData(event.currentTarget).get("password") !== PASSWORD) return renderLogin("Senha incorreta.");
      sessionStorage.setItem(AUTH_KEY, "ok");
      renderManager("Acesso liberado.");
    });
  }

  function renderManager(message) {
    const root = document.querySelector("[data-promo-admin]");
    const banner = content.banners.find(function (item) { return item.id === selectedBanner; }) || emptyBanner();
    const ad = content.ads.find(function (item) { return item.id === selectedAd; }) || emptyAd();
    root.innerHTML = `
      <header class="promo-head"><div><small>IMPACTO 360</small><h1>Gestão de Banners e Anúncios Promocionais</h1><p>${html(message || "Cadastre, edite, ordene, ative e desative campanhas.")}</p></div><div><a href="/">Ver loja</a><button data-promo-logout>Sair</button></div></header>
      <section class="promo-card"><h2>Intervalos de rotação</h2><form class="promo-settings" data-settings><label>Banners (ms)<input type="number" min="3000" max="60000" name="bannerRotationMs" value="${attr(content.settings.bannerRotationMs)}"></label><label>Anúncios (ms)<input type="number" min="3000" max="60000" name="adRotationMs" value="${attr(content.settings.adRotationMs)}"></label><button>Salvar intervalos</button></form></section>
      <section class="promo-admin-grid">
        <article class="promo-card"><h2>Banner inicial</h2><form data-banner-form>${field("id", banner.id, "hidden")}${field("image", banner.image, "text", "Imagem")}${field("title", banner.title, "text", "Título opcional")}<textarea name="description" placeholder="Descrição opcional">${html(banner.description)}</textarea>${field("link", banner.link, "url", "Link de destino")}<label>Status<select name="active"><option value="true" ${banner.active ? "selected" : ""}>Ativo</option><option value="false" ${!banner.active ? "selected" : ""}>Inativo</option></select></label>${field("order", banner.order, "number", "Ordem")}<div><button>Salvar banner</button><button type="button" data-new-banner>Novo</button></div></form></article>
        <article class="promo-card"><h2>Anúncio promocional</h2><form data-ad-form>${field("id", ad.id, "hidden")}${field("image", ad.image, "text", "Imagem")}${field("title", ad.title, "text", "Título")}<textarea name="description" placeholder="Descrição">${html(ad.description)}</textarea>${field("buttonLabel", ad.buttonLabel, "text", "Texto do botão")}${field("link", ad.link, "url", "Link de destino")}<label>Início${field("startDate", ad.startDate, "date")}</label><label>Término opcional${field("endDate", ad.endDate, "date")}</label><label>Status<select name="active"><option value="true" ${ad.active ? "selected" : ""}>Ativo</option><option value="false" ${!ad.active ? "selected" : ""}>Inativo</option></select></label>${field("priority", ad.priority, "number", "Prioridade")}<div><button>Salvar anúncio</button><button type="button" data-new-ad>Novo</button></div></form></article>
      </section>
      <section class="promo-admin-grid">
        <article class="promo-card"><h2>Banners cadastrados</h2><div class="promo-list">${content.banners.slice().sort(function(a,b){return a.order-b.order;}).map(function(item){return row(item,"banner");}).join("") || "Nenhum banner."}</div></article>
        <article class="promo-card"><h2>Anúncios cadastrados</h2><div class="promo-list">${content.ads.slice().sort(function(a,b){return a.priority-b.priority;}).map(function(item){return row(item,"ad");}).join("") || "Nenhum anúncio."}</div></article>
      </section>`;
    bindAdmin();
  }

  function bindAdmin() {
    const root = document.querySelector("[data-promo-admin]");
    root.querySelector("[data-promo-logout]").addEventListener("click", function () { sessionStorage.removeItem(AUTH_KEY); renderLogin("Sessão encerrada."); });
    root.querySelector("[data-settings]").addEventListener("submit", function (event) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      content.settings = { bannerRotationMs: interval(values.bannerRotationMs, 6500), adRotationMs: interval(values.adRotationMs, 5200) };
      save("Intervalos salvos.");
    });
    root.querySelector("[data-banner-form]").addEventListener("submit", function (event) { event.preventDefault(); saveItem("banner", Object.fromEntries(new FormData(event.currentTarget))); });
    root.querySelector("[data-ad-form]").addEventListener("submit", function (event) { event.preventDefault(); saveItem("ad", Object.fromEntries(new FormData(event.currentTarget))); });
    root.querySelector("[data-new-banner]").addEventListener("click", function () { selectedBanner = ""; renderManager("Novo banner."); });
    root.querySelector("[data-new-ad]").addEventListener("click", function () { selectedAd = ""; renderManager("Novo anúncio."); });
    root.querySelectorAll("[data-edit]").forEach(function (button) { button.addEventListener("click", function () { if (button.dataset.kind === "banner") selectedBanner = button.dataset.edit; else selectedAd = button.dataset.edit; renderManager("Item carregado para edição."); }); });
    root.querySelectorAll("[data-toggle]").forEach(function (button) { button.addEventListener("click", function () { toggle(button.dataset.kind, button.dataset.toggle); }); });
    root.querySelectorAll("[data-delete]").forEach(function (button) { button.addEventListener("click", function () { if (confirm("Excluir este item?")) remove(button.dataset.kind, button.dataset.delete); }); });
  }

  function saveItem(kind, values) {
    const active = values.active === "true";
    if (active && !text(values.link)) return renderManager("Itens ativos precisam de link de destino.");
    if (text(values.link) && !safeLink(values.link)) return renderManager("Use HTTPS ou um caminho interno seguro.");
    if (kind === "ad" && values.endDate && values.startDate && values.endDate < values.startDate) return renderManager("A data final não pode ser anterior à inicial.");
    const key = kind === "banner" ? "banners" : "ads";
    const id = text(values.id) || kind + "-" + Date.now();
    const item = kind === "banner"
      ? { id: id, image: text(values.image), title: text(values.title), description: text(values.description), link: text(values.link), active: active, order: Math.max(1, Number(values.order) || 1) }
      : { id: id, image: text(values.image), title: text(values.title), description: text(values.description), buttonLabel: text(values.buttonLabel || "Ver oferta"), link: text(values.link), startDate: text(values.startDate), endDate: text(values.endDate), active: active, priority: Math.max(1, Number(values.priority) || 1) };
    content[key] = content[key].filter(function (entry) { return entry.id !== id; }).concat(item);
    if (kind === "banner") selectedBanner = id; else selectedAd = id;
    save("Item salvo.");
  }

  function toggle(kind, id) {
    const list = kind === "banner" ? content.banners : content.ads;
    const item = list.find(function (entry) { return entry.id === id; });
    if (!item) return;
    if (!item.active && !safeLink(item.link)) return renderManager("Não é possível ativar item sem link seguro.");
    item.active = !item.active;
    save(item.active ? "Item ativado." : "Item desativado.");
  }

  function remove(kind, id) {
    const key = kind === "banner" ? "banners" : "ads";
    content[key] = content[key].filter(function (item) { return item.id !== id; });
    save("Item excluído.");
  }

  function save(message) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    renderManager(message);
  }

  function row(item, kind) {
    const order = kind === "banner" ? item.order : item.priority;
    return '<p><b>' + html(item.title || item.id) + '</b><br>Ordem ' + html(order) + ' · ' + (item.active ? '<em>ativo</em>' : "<i>inativo</i>") + '<br><button data-edit="' + attr(item.id) + '" data-kind="' + kind + '">Editar</button><button data-toggle="' + attr(item.id) + '" data-kind="' + kind + '">' + (item.active ? "Desativar" : "Ativar") + '</button><button class="danger" data-delete="' + attr(item.id) + '" data-kind="' + kind + '">Excluir</button></p>';
  }

  function field(name, value, type, placeholder) {
    return '<input name="' + name + '" type="' + (type || "text") + '" value="' + attr(value ?? "") + '"' + (placeholder ? ' placeholder="' + attr(placeholder) + '"' : "") + '>';
  }

  function emptyBanner() { return { id: "", image: "", title: "", description: "", link: "", active: false, order: 1 }; }
  function emptyAd() { return { id: "", image: "", title: "", description: "", buttonLabel: "Ver oferta", link: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", active: false, priority: 1 }; }

  function injectAdminStyle() {
    if (document.getElementById("promoAdminStyle")) return;
    const style = document.createElement("style");
    style.id = "promoAdminStyle";
    style.textContent = `.promo-admin{min-height:100vh;padding:16px;background:#f3f8fe;color:#08192f;font-family:Inter,system-ui}.promo-admin>section{width:min(1180px,100%);margin:auto}.promo-head{display:flex;justify-content:space-between;gap:16px;align-items:end;padding:22px;border-radius:16px;background:#081f42;color:#fff}.promo-head h1{margin:4px 0}.promo-head>div:last-child{display:flex;gap:8px}.promo-head a,.promo-head button,.promo-card button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:0;border-radius:8px;padding:0 13px;background:#1d5cff;color:#fff;text-decoration:none;font-weight:900}.promo-card{margin-top:14px;padding:18px;border:1px solid #dce8f7;border-radius:14px;background:#fff;box-shadow:0 16px 38px #08192f14}.promo-login{max-width:560px;margin:9vh auto}.promo-login>span{display:grid;place-items:center;width:56px;height:56px;border-radius:12px;background:#1d5cff;color:#fff;font-weight:950}.promo-login input,.promo-card input,.promo-card textarea,.promo-card select{width:100%;min-height:44px;margin:6px 0 10px;padding:10px;border:1px solid #c9dcea;border-radius:8px;background:#fff;font:inherit}.promo-card textarea{min-height:86px}.promo-card label{font-weight:850}.promo-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.promo-settings{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end}.promo-card form>div{display:flex;gap:7px;flex-wrap:wrap}.promo-list p{padding:11px 0;margin:0;border-top:1px solid #e3edf5}.promo-list button{min-height:34px;margin:5px 5px 0 0;padding:0 9px}.promo-list .danger{background:#b8324b}.promo-list em{color:#0c6b46}.promo-list i{color:#8a5600}@media(max-width:760px){.promo-head{align-items:start;flex-direction:column}.promo-admin-grid,.promo-settings{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value ?? "").trim(); }
  function html(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function attr(value) { return html(value); }
})();
