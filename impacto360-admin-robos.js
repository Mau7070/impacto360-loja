(function () {
  const ADMIN_ROUTES = [
    "/admin/robos",
    "/admin/catalogo-inteligente",
    "/admin/postagens",
    "/admin/midias",
    "/admin/tendencias",
    "/admin/plataformas",
    "/admin/atendimento",
    "/admin/revisao"
  ];
  const PASSWORD = "impacto360-admin";
  const AUTH_KEY = "ai360:adminRobosAuth";
  const STORE_OPEN_KEY = "ai360:storeOpen:v2";
  const WHATSAPP_KEY = "ai360:whatsapp";
  const MANUAL_PRODUCTS_KEY = "ai360:manualProducts";
  const POSTS_KEY = "ai360:postagens";
  const LOG_KEY = "ai360:qualityLogs";
  const EFFECTIVE_PATH = new URLSearchParams(location.search).get("route") || location.pathname;
  const BASE_PATH = getBasePath();

  injectMobileProductStyle();

  if (new URLSearchParams(location.search).get("abrir") === "loja") {
    localStorage.setItem(STORE_OPEN_KEY, "true");
  }

  if (ADMIN_ROUTES.includes(EFFECTIVE_PATH)) {
    renderAdminShell();
    return;
  }

  if (localStorage.getItem(STORE_OPEN_KEY) === "false") {
    injectReviewBanner();
  }

  function getProducts() {
    const base = typeof window.__impacto360GetProducts === "function" ? window.__impacto360GetProducts() : [];
    return [...base, ...readJson(MANUAL_PRODUCTS_KEY, [])];
  }

  function getProductLink(product) {
    if (typeof window.getProductLink === "function") return window.getProductLink(product);
    return text(product.linkPlataforma || product.affiliateLink || product.link_original_afiliado || product.linkAfiliado || product.url || "");
  }

  function getProductMedia(product) {
    if (typeof window.getProductMedia === "function") return window.getProductMedia(product);
    const principal = text(product.fotoPrincipal || product.image || product.imagem || "");
    return {
      principal,
      status: principal ? "foto_validada" : "revisar_foto",
      alt: text(product.altImagem || product.name || product.nome || "Produto Impacto 360")
    };
  }

  function getProductVideo(product) {
    if (typeof window.getProductVideo === "function") return window.getProductVideo(product);
    const videoPrincipal = text(product.videoPrincipal || product.video || "");
    return {
      videoPrincipal,
      videosExtras: Array.isArray(product.videosExtras) ? product.videosExtras : [],
      thumbnailVideo: text(product.thumbnailVideo || ""),
      origemVideo: text(product.origemVideo || ""),
      statusVideo: videoPrincipal ? "video_adicionado" : "sem_video"
    };
  }

  function validateProduct(product) {
    const link = getProductLink(product);
    const media = getProductMedia(product);
    const video = getProductVideo(product);
    const name = text(product.name || product.nome);
    const description = text(product.description || product.descricao || product.shortDescription || product.fullDescription);
    const alerts = [];
    if (!name) alerts.push("titulo ausente");
    if (!description || description.length < 24) alerts.push("descricao curta ou ausente");
    if (!link) alerts.push("linkPlataforma ausente");
    if (!media.principal || media.status === "revisar_foto") alerts.push("foto principal ausente");
    if (video.statusVideo === "video_rejeitado") alerts.push("video rejeitado");
    return {
      id: text(product.id || name),
      nome: name || text(product.id),
      link,
      media,
      video,
      status: alerts.length ? "revisar" : "pronto",
      alerts
    };
  }

  function validateAll() {
    const products = getProducts().map(validateProduct);
    const posts = readJson(POSTS_KEY, []).map(validatePost);
    const result = {
      totalProdutos: products.length,
      produtosProntos: products.filter(item => item.status === "pronto").length,
      produtosRevisar: products.filter(item => item.status !== "pronto").length,
      totalPostagens: posts.length,
      postagensProntas: posts.filter(item => item.status === "pronto").length,
      postagensRevisar: posts.filter(item => item.status !== "pronto").length,
      products,
      posts
    };
    appendLog("Revisao de seguranca executada.", result);
    return result;
  }

  function validatePost(post) {
    const alerts = [];
    if (!text(post.titulo)) alerts.push("titulo ausente");
    if (!text(post.legenda)) alerts.push("legenda ausente");
    if (!text(post.linkPlataforma)) alerts.push("linkPlataforma ausente");
    if (!text(post.foto) && !text(post.video)) alerts.push("midia da postagem ausente");
    if ((post.redeSocial === "TikTok" || post.redeSocial === "Reels") && !text(post.video)) alerts.push("video exigido para esta rede");
    return { ...post, statusCalculado: alerts.length ? "revisar" : "pronto", status: post.status || (alerts.length ? "rascunho" : "pronto"), alerts };
  }

  function renderAdminShell() {
    document.body.className = "";
    document.body.innerHTML = '<main class="ai360-admin"><section class="admin-shell" data-admin-root></section></main>';
    injectAdminStyle();
    if (localStorage.getItem(AUTH_KEY) === "ok") renderAdminPanel();
    else renderLogin();
  }

  function renderLogin(message) {
    const root = document.querySelector("[data-admin-root]");
    root.innerHTML = `
      <section class="admin-card admin-login">
        <span class="admin-icon">360</span>
        <h1>Painel Impacto360</h1>
        <p>Controle local de catalogo, midias, postagens, links e revisao. A home publica fica preservada.</p>
        <form data-login-form>
          <input type="password" name="password" placeholder="Senha administrativa" autocomplete="current-password" />
          <button type="submit">Entrar</button>
        </form>
        <small>${escapeHtml(message || "Senha local padrao: impacto360-admin")}</small>
      </section>
    `;
    root.querySelector("[data-login-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      if (new FormData(event.currentTarget).get("password") === PASSWORD) {
        localStorage.setItem(AUTH_KEY, "ok");
        renderAdminPanel("Acesso liberado.");
      } else {
        renderLogin("Senha incorreta.");
      }
    });
  }

  function renderAdminPanel(message) {
    const root = document.querySelector("[data-admin-root]");
    const route = EFFECTIVE_PATH;
    const result = validateAll();
    root.innerHTML = `
      <header class="admin-head">
        <div>
          <strong>${escapeHtml(route)}</strong>
          <h1>Organizador Inteligente Impacto360</h1>
          <p>Midias, links e postagens sao revisados antes de marcar como pronto. Nenhuma alteracao substitui a pagina inicial.</p>
        </div>
        <span class="admin-status ${result.produtosRevisar || result.postagensRevisar ? "wait" : "ok"}">${result.produtosProntos}/${result.totalProdutos} produtos prontos</span>
      </header>
      ${renderAdminNav(route)}
      <section class="admin-grid">
        <article class="admin-card">
          <h2>Status de seguranca</h2>
          <p>${escapeHtml(message || "Painel carregado. Execute revisao antes de publicar mudancas.")}</p>
          <div class="quality-grid">
            <span><b>${result.totalProdutos}</b> produtos</span>
            <span><b>${result.produtosRevisar}</b> revisar</span>
            <span><b>${result.totalPostagens}</b> postagens</span>
            <span><b>${result.postagensRevisar}</b> revisar</span>
          </div>
          <div class="admin-actions">
            <button data-review>Rodar revisao</button>
            <button data-open-store>Abrir loja</button>
            <button data-close-store>Marcar loja em revisao</button>
          </div>
        </article>
        <article class="admin-card">
          <h2>Gerenciador Inteligente de Midia</h2>
          <p>Fotos reais sao priorizadas, imagens ausentes viram revisao e videos ficam como recomendados, sem travar produto comum.</p>
          <ul>
            <li>Foto principal e galeria manual</li>
            <li>Video principal, extras e thumbnail</li>
            <li>Texto alternativo para acessibilidade</li>
          </ul>
        </article>
        <article class="admin-card">
          <h2>Distribuidor de Links</h2>
          <p>O campo <b>linkPlataforma</b> alimenta card, pagina do produto, WhatsApp, legenda, campanha e CTA.</p>
          <input data-whatsapp value="${escapeAttr(localStorage.getItem(WHATSAPP_KEY) || "")}" placeholder="WhatsApp da loja: 5531999999999" />
          <button data-save-whatsapp>Salvar WhatsApp</button>
        </article>
      </section>
      ${renderRouteContent(route, result)}
    `;
    bindAdminEvents(result);
  }

  function renderAdminNav(route) {
    return `<nav class="admin-nav">
      ${ADMIN_ROUTES.map(path => `<a class="${route === path ? "active" : ""}" href="${adminHref(path)}">${routeLabel(path)}</a>`).join("")}
      <a href="${BASE_PATH || "/"}">Ver home</a>
    </nav>`;
  }

  function getBasePath() {
    const adminIndex = location.pathname.indexOf("/admin/");
    if (adminIndex >= 0) return location.pathname.slice(0, adminIndex);
    return location.pathname.replace(/\/(?:index\.html)?$/, "");
  }

  function adminHref(path) {
    return (BASE_PATH || "") + path;
  }

  function routeLabel(path) {
    return ({
      "/admin/robos": "Robos",
      "/admin/catalogo-inteligente": "Catalogo",
      "/admin/postagens": "Postagens",
      "/admin/midias": "Midias",
      "/admin/tendencias": "Tendencias",
      "/admin/plataformas": "Plataformas",
      "/admin/atendimento": "Atendimento",
      "/admin/revisao": "Revisao"
    })[path] || path;
  }

  function renderRouteContent(route, result) {
    if (route === "/admin/postagens") return renderPostForm();
    if (route === "/admin/midias") return renderMediaGuide(result);
    if (route === "/admin/revisao") return renderReviewTable(result);
    if (route === "/admin/tendencias") return renderSimplePanel("Tendencias", "Area preparada para analisar buscas, termos populares e oportunidades sem publicar automaticamente.");
    if (route === "/admin/plataformas") return renderSimplePanel("Plataformas", "Campos de links, UTM, redes sociais e campanhas sao organizados sem misturar link com foto, video ou categoria.");
    if (route === "/admin/atendimento") return renderSimplePanel("Atendimento", "Mensagens de WhatsApp usam linkPlataforma e dados do produto, respeitando revisao manual.");
    return renderProductForm(result);
  }

  function renderProductForm(result) {
    return `
      <section class="admin-card">
        <h2>Edicao manual completa do produto</h2>
        <form class="admin-product-form" data-product-form>
          <input name="nome" required placeholder="Titulo do produto" />
          <input name="categoria" required placeholder="Categoria" />
          <input name="subcategoria" placeholder="Subcategoria" />
          <input name="preco" placeholder="Preco ou chamada" />
          <input name="linkPlataforma" required placeholder="linkPlataforma" />
          <input name="fotoPrincipal" required placeholder="Foto principal por URL" />
          <textarea name="fotosExtras" placeholder="Fotos extras, uma por linha"></textarea>
          <input name="videoPrincipal" placeholder="Video principal por URL" />
          <textarea name="videosExtras" placeholder="Videos extras, um por linha"></textarea>
          <input name="thumbnailVideo" placeholder="Thumbnail do video" />
          <input name="origemVideo" placeholder="Origem do video" />
          <input name="hashtags" placeholder="Hashtags" />
          <input name="seo" placeholder="SEO / texto alternativo" />
          <textarea name="descricaoCurta" required placeholder="Descricao curta"></textarea>
          <textarea name="descricaoCompleta" placeholder="Descricao completa"></textarea>
          <textarea name="observacoes" placeholder="Observacoes e revisao"></textarea>
          <div class="admin-actions full">
            <button type="submit">Salvar como rascunho/pronto</button>
            <button type="button" data-mark-ready>Marcar revisados como prontos</button>
          </div>
        </form>
      </section>
      ${renderReviewTable(result)}
    `;
  }

  function renderPostForm() {
    return `
      <section class="admin-card">
        <h2>Edicao manual de postagem</h2>
        <form class="admin-product-form" data-post-form>
          <input name="titulo" required placeholder="Titulo da postagem" />
          <input name="redeSocial" placeholder="Rede social: Instagram, TikTok, Reels..." />
          <input name="linkPlataforma" required placeholder="linkPlataforma" />
          <input name="foto" placeholder="Foto ou capa" />
          <input name="video" placeholder="Video" />
          <input name="thumbnail" placeholder="Thumbnail" />
          <input name="cta" placeholder="Chamada para acao" />
          <input name="hashtags" placeholder="Hashtags" />
          <textarea name="legenda" required placeholder="Legenda"></textarea>
          <textarea name="observacoes" placeholder="Observacoes"></textarea>
          <button type="submit">Salvar postagem para revisao</button>
        </form>
      </section>
      ${renderPostList()}
    `;
  }

  function renderPostList() {
    const posts = readJson(POSTS_KEY, []).map(validatePost);
    return `<section class="admin-card"><h2>Postagens salvas</h2><div class="admin-table">${
      posts.length ? posts.map(post => `<p><b>${escapeHtml(post.titulo)}</b><br>${escapeHtml(post.redeSocial || "sem rede")} - ${escapeHtml(post.alerts.join(" | ") || "pronto")}</p>`).join("") : "Nenhuma postagem cadastrada."
    }</div></section>`;
  }

  function renderMediaGuide(result) {
    return `<section class="admin-card"><h2>Midias em revisao</h2><div class="admin-table">${
      result.products.filter(item => item.media.status === "revisar_foto" || item.video.statusVideo === "video_rejeitado").slice(0, 80).map(item =>
        `<p><b>${escapeHtml(item.nome)}</b><br>${escapeHtml(item.alerts.join(" | ") || "sem alerta")}</p>`
      ).join("") || "Nenhuma midia critica encontrada."
    }</div></section>`;
  }

  function renderReviewTable(result) {
    return `<section class="admin-card"><h2>Revisao antes de publicar</h2><div class="admin-table">${
      result.products.slice(0, 120).map(item => `<p><b>${escapeHtml(item.nome)}</b><br><span class="${item.status === "pronto" ? "ok-text" : "warn-text"}">${escapeHtml(item.status)} - ${escapeHtml(item.alerts.join(" | ") || "sem alertas")}</span></p>`).join("")
    }</div></section>`;
  }

  function renderSimplePanel(title, description) {
    return `<section class="admin-card"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></section>`;
  }

  function bindAdminEvents(result) {
    const root = document.querySelector("[data-admin-root]");
    root.querySelector("[data-review]")?.addEventListener("click", () => renderAdminPanel("Revisao concluida. Itens incompletos ficam como revisar."));
    root.querySelector("[data-open-store]")?.addEventListener("click", () => {
      localStorage.setItem(STORE_OPEN_KEY, "true");
      renderAdminPanel("Loja aberta. A home continua preservada.");
    });
    root.querySelector("[data-close-store]")?.addEventListener("click", () => {
      localStorage.setItem(STORE_OPEN_KEY, "false");
      renderAdminPanel("Loja marcada em revisao sem substituir a home.");
    });
    root.querySelector("[data-save-whatsapp]")?.addEventListener("click", () => {
      localStorage.setItem(WHATSAPP_KEY, root.querySelector("[data-whatsapp]").value.trim());
      renderAdminPanel("WhatsApp salvo.");
    });
    root.querySelector("[data-product-form]")?.addEventListener("submit", saveManualProduct);
    root.querySelector("[data-post-form]")?.addEventListener("submit", savePost);
    root.querySelector("[data-mark-ready]")?.addEventListener("click", () => renderAdminPanel("Produtos completos marcados como prontos no criterio da revisao."));
  }

  function saveManualProduct(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    const product = typeof window.buildManualProduct === "function" ? window.buildManualProduct(fields) : fallbackManualProduct(fields);
    const current = readJson(MANUAL_PRODUCTS_KEY, []);
    localStorage.setItem(MANUAL_PRODUCTS_KEY, JSON.stringify([...current, product]));
    if (typeof window.__impacto360AddManualProduct === "function") window.__impacto360AddManualProduct(product);
    renderAdminPanel(product.status === "pronto" ? "Produto salvo como pronto." : "Produto salvo como rascunho para revisao.");
  }

  function savePost(event) {
    event.preventDefault();
    const post = { id: "post-" + Date.now(), ...Object.fromEntries(new FormData(event.currentTarget).entries()), status: "rascunho" };
    const current = readJson(POSTS_KEY, []);
    localStorage.setItem(POSTS_KEY, JSON.stringify([...current, post]));
    renderAdminPanel("Postagem salva para revisao.");
  }

  function fallbackManualProduct(fields) {
    return {
      id: "manual-" + Date.now(),
      name: text(fields.nome),
      category: text(fields.categoria || "geral"),
      price: text(fields.preco || "Sob consulta"),
      description: text(fields.descricaoCurta),
      fullDescription: text(fields.descricaoCompleta || fields.descricaoCurta),
      linkPlataforma: text(fields.linkPlataforma),
      affiliateLink: text(fields.linkPlataforma),
      fotoPrincipal: text(fields.fotoPrincipal),
      image: text(fields.fotoPrincipal),
      videoPrincipal: text(fields.videoPrincipal),
      statusVideo: text(fields.videoPrincipal) ? "video_adicionado" : "sem_video",
      badge: "Manual",
      specs: [],
      status: text(fields.linkPlataforma) && text(fields.fotoPrincipal) ? "pronto" : "rascunho"
    };
  }

  function injectReviewBanner() {
    const banner = document.createElement("div");
    banner.className = "ai360-review-banner";
    banner.textContent = "Loja em revisao administrativa. A home continua ativa.";
    document.body.appendChild(banner);
  }

  function injectMobileProductStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .product-media img{object-fit:contain!important;object-position:center!important}
      .product-actions .btn{min-height:48px}
      .ai360-review-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:80;border-radius:8px;background:#fff8db;color:#68470d;border:1px solid #f3ce7b;padding:10px 14px;font:800 13px system-ui,sans-serif;box-shadow:0 12px 36px rgba(8,25,47,.16)}
      @media(max-width:760px){.product-grid,.store-grid{grid-template-columns:1fr!important}.product-media{aspect-ratio:1/1}.btn,.nav-btn,.chip{min-height:44px}.assistant-fab{top:14px;bottom:auto}}
    `;
    document.head.appendChild(style);
  }

  function injectAdminStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .ai360-admin{min-height:100vh;background:#f6fbff;color:#08192f;font-family:Inter,system-ui,sans-serif;padding:16px}
      .admin-shell{width:min(1180px,100%);margin:0 auto}.admin-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin:8px 0 16px}
      .admin-head h1,.admin-card h2{margin:0}.admin-head p,.admin-card p,.admin-card li{color:#607083;line-height:1.5}.admin-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:14px}
      .admin-card{background:#fff;border:1px solid rgba(56,91,130,.16);border-radius:8px;box-shadow:0 18px 44px rgba(8,25,47,.09);padding:18px;margin-bottom:14px}
      .admin-login{max-width:560px;margin:8vh auto}.admin-icon{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:8px;background:#1d5cff;color:#fff;font-weight:950}
      .admin-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.admin-nav a{min-height:40px;display:inline-flex;align-items:center;border-radius:999px;border:1px solid rgba(56,91,130,.16);padding:0 12px;color:#17314f;text-decoration:none;font-weight:900;background:#fff}.admin-nav a.active{background:#1d5cff;color:#fff}
      .admin-card input,.admin-card textarea{width:100%;min-height:44px;border:1px solid rgba(56,91,130,.2);border-radius:8px;padding:10px 12px;margin:6px 0 10px;font:inherit}.admin-card textarea{min-height:92px}
      .admin-card button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:0;border-radius:8px;background:#1d5cff;color:#fff;font-weight:900;padding:0 14px;margin:4px;cursor:pointer}
      .admin-product-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.admin-product-form textarea,.admin-product-form .full,.admin-product-form button[type=submit]{grid-column:1/-1}
      .admin-actions{display:flex;flex-wrap:wrap;gap:6px}.admin-status{border-radius:999px;padding:8px 12px;font-weight:950}.admin-status.ok{background:#dff8ed;color:#0c6b46}.admin-status.wait{background:#fff1cc;color:#7c5300}
      .quality-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.quality-grid span{background:#eef5ff;border-radius:8px;padding:10px}.admin-table{max-height:440px;overflow:auto}.admin-table p{border-top:1px solid rgba(56,91,130,.14);padding:10px 0;margin:0}.ok-text{color:#0c6b46;font-weight:900}.warn-text{color:#8a5600;font-weight:900}
      @media(max-width:850px){.ai360-admin{padding:12px}.admin-head,.admin-grid,.admin-product-form{display:grid;grid-template-columns:1fr}.quality-grid{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function appendLog(message, details) {
    const logs = readJson(LOG_KEY, []);
    logs.push({ message, details, createdAt: new Date().toISOString() });
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-250)));
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function text(value) {
    return String(value ?? "").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
