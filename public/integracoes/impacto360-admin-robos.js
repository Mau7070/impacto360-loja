(function () {
  const ADMIN_PATH = "/admin/robos";
  const PASSWORD = "impacto360-admin";
  const STORE_OPEN_KEY = "ai360:storeOpen:v2";
  const AUTH_KEY = "ai360:adminRobosAuth";
  const WHATSAPP_KEY = "ai360:whatsapp";
  const MANUAL_PRODUCTS_KEY = "ai360:manualProducts";
  const LOG_KEY = "ai360:roboLogs:catalogo";

  injectMobileProductStyle();

  if (location.pathname === ADMIN_PATH) {
    renderAdmin();
    return;
  }

  if (new URLSearchParams(location.search).get("abrir") === "loja") {
    localStorage.setItem(STORE_OPEN_KEY, "true");
  }

  if (localStorage.getItem(STORE_OPEN_KEY) === "false") {
    renderClosedStore();
  }

  function getProducts() {
    const base = typeof window.__impacto360GetProducts === "function" ? window.__impacto360GetProducts() : [];
    return [...base, ...readJson(MANUAL_PRODUCTS_KEY, [])];
  }

  function normalizeProduct(product) {
    const description = text(product.descricao || product.description || product.shortDescription || product.fullDescription);
    const link = text(product.link_original_afiliado || product.affiliateLink || product.linkAfiliado);
    return {
      id: text(product.id),
      nome: text(product.nome || product.name),
      categoria: text(product.categoria || product.category || "geral"),
      descricao: description,
      imagem: text(product.imagem || product.image),
      link_original_afiliado: link,
      preco: product.preco ?? product.price,
      status: text(product.status || "rascunho"),
      origem: product
    };
  }

  function validateCatalog(products) {
    const ids = new Map();
    const links = new Map();
    return products.map((item) => {
      const product = normalizeProduct(item);
      const alerts = [];
      if (!product.id) alerts.push("Produto sem id.");
      if (!product.nome) alerts.push("Produto sem nome.");
      if (!product.link_original_afiliado) alerts.push("Produto sem link original de afiliado.");
      if (!product.imagem) alerts.push("Produto sem imagem.");
      if (product.preco === undefined || product.preco === null || product.preco === "") alerts.push("Produto sem preço.");
      if (!product.descricao || product.descricao.length < 30) alerts.push("Descrição ausente ou muito curta.");
      if (product.id) {
        const count = (ids.get(product.id) || 0) + 1;
        ids.set(product.id, count);
        if (count > 1) alerts.push("Produto duplicado pelo id.");
      }
      if (product.link_original_afiliado) {
        const count = (links.get(product.link_original_afiliado) || 0) + 1;
        links.set(product.link_original_afiliado, count);
        if (count > 1) alerts.push("Produto duplicado pelo link de afiliado.");
      }
      return {
        ...product,
        status: alerts.length ? "rascunho" : "pronto",
        alerts
      };
    });
  }

  function runCatalog(simulated) {
    const products = validateCatalog(getProducts());
    const result = {
      total: products.length,
      prontos: products.filter((item) => item.status === "pronto").length,
      rascunhos: products.filter((item) => item.status === "rascunho").length,
      incompletos: products.filter((item) => item.alerts.length).length,
      products
    };
    appendLog(simulated ? "Teste simulado do Robô de Catálogo concluído." : "Robô de Catálogo ativado em modo seguro.", result);
    return result;
  }

  function renderAdmin() {
    document.body.className = "";
    document.body.innerHTML = `
      <main class="ai360-admin">
        <section class="admin-shell" data-admin-root></section>
      </main>
    `;
    injectAdminStyle();
    if (localStorage.getItem(AUTH_KEY) === "ok") renderAdminPanel();
    else renderLogin();
  }

  function renderLogin(message) {
    const root = document.querySelector("[data-admin-root]");
    root.innerHTML = `
      <div class="admin-card admin-login">
        <span class="admin-icon">360</span>
        <h1>Administração dos Robôs</h1>
        <p>Área local protegida para controlar catálogo, abertura da loja e WhatsApp.</p>
        <form data-login-form>
          <input type="password" name="password" placeholder="Senha administrativa" autocomplete="current-password" />
          <button type="submit">Entrar no painel</button>
        </form>
        <small>${escapeHtml(message || "Senha padrão local: impacto360-admin. Troque no próximo ciclo com backend/env.")}</small>
      </div>
    `;
    root.querySelector("[data-login-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const password = new FormData(event.currentTarget).get("password");
      if (password === PASSWORD) {
        localStorage.setItem(AUTH_KEY, "ok");
        renderAdminPanel("Acesso liberado.");
      } else {
        renderLogin("Senha incorreta.");
      }
    });
  }

  function renderAdminPanel(message) {
    const root = document.querySelector("[data-admin-root]");
    const storeOpen = localStorage.getItem(STORE_OPEN_KEY) !== "false";
    const whatsapp = localStorage.getItem(WHATSAPP_KEY) || "";
    const logs = readJson(LOG_KEY, []);
    root.innerHTML = `
      <header class="admin-head">
        <div>
          <strong>/admin/robos</strong>
          <h1>Painel Administrativo dos Robôs</h1>
          <p>Etapa atual: somente Robô de Catálogo reconstruído e seguro.</p>
        </div>
        <span class="admin-status ${storeOpen ? "ok" : "wait"}">${storeOpen ? "Loja aberta" : "Loja em preparação"}</span>
      </header>

      <section class="admin-grid">
        <article class="admin-card">
          <h2>Robô de Catálogo</h2>
          <p>Valida produtos, preserva links de afiliado e bloqueia incompletos.</p>
          <div class="admin-actions">
            <button data-run-real>Ativar robô</button>
            <button data-stop>Desativar robô</button>
            <button data-test>Testar robô</button>
            <button data-show-logs>Ver logs</button>
          </div>
          <div class="admin-result" data-result>${escapeHtml(message || "Execute primeiro em modo simulado.")}</div>
        </article>

        <article class="admin-card">
          <h2>Abertura da loja</h2>
          <p>Abra somente depois de cadastrar e revisar produtos.</p>
          <div class="admin-actions">
            <button data-open-store>Abrir loja ao público</button>
            <button data-close-store>Fechar loja temporariamente</button>
          </div>
        </article>

        <article class="admin-card">
          <h2>WhatsApp da loja</h2>
          <label>Número com DDD e país</label>
          <input data-whatsapp value="${escapeAttr(whatsapp)}" placeholder="5531999999999" />
          <button data-save-whatsapp>Salvar WhatsApp</button>
        </article>
      </section>

      <section class="admin-card">
        <h2>Cadastrar produto manualmente</h2>
        <form class="admin-product-form" data-product-form>
          <input name="nome" required placeholder="Nome do produto" />
          <input name="categoria" required placeholder="Categoria" />
          <input name="preco" required type="number" min="0" step="0.01" placeholder="Preço" />
          <input name="imagem" required placeholder="URL da imagem" />
          <input name="link_original_afiliado" required placeholder="Link original de afiliado" />
          <textarea name="descricao" required placeholder="Descrição"></textarea>
          <button type="submit">Salvar produto manual</button>
        </form>
      </section>

      <section class="admin-card" data-logs hidden>
        <h2>Logs do Robô de Catálogo</h2>
        <pre>${escapeHtml(logs.map((log) => `[${log.createdAt}] ${log.message}`).join("\\n") || "Nenhum log registrado.")}</pre>
      </section>
    `;

    root.querySelector("[data-test]").addEventListener("click", () => showResult(runCatalog(true)));
    root.querySelector("[data-run-real]").addEventListener("click", () => showResult(runCatalog(false)));
    root.querySelector("[data-stop]").addEventListener("click", () => {
      appendLog("Robô de Catálogo desligado.", {});
      renderAdminPanel("Robô de Catálogo desligado.");
    });
    root.querySelector("[data-show-logs]").addEventListener("click", () => {
      const box = root.querySelector("[data-logs]");
      box.hidden = !box.hidden;
    });
    root.querySelector("[data-open-store]").addEventListener("click", () => {
      localStorage.setItem(STORE_OPEN_KEY, "true");
      renderAdminPanel("Loja aberta ao público neste navegador.");
    });
    root.querySelector("[data-close-store]").addEventListener("click", () => {
      localStorage.setItem(STORE_OPEN_KEY, "false");
      renderAdminPanel("Loja fechada temporariamente.");
    });
    root.querySelector("[data-save-whatsapp]").addEventListener("click", () => {
      localStorage.setItem(WHATSAPP_KEY, root.querySelector("[data-whatsapp]").value.trim());
      renderAdminPanel("WhatsApp salvo.");
    });
    root.querySelector("[data-product-form]").addEventListener("submit", saveManualProduct);

    function showResult(result) {
      const html = `
        <strong>Total:</strong> ${result.total} |
        <strong>Prontos:</strong> ${result.prontos} |
        <strong>Rascunhos:</strong> ${result.rascunhos} |
        <strong>Incompletos:</strong> ${result.incompletos}
        <div class="admin-table">
          ${result.products.slice(0, 40).map((product) => `
            <p><b>${escapeHtml(product.nome || product.id)}</b><br><span>${escapeHtml(product.status)} - ${escapeHtml(product.alerts.join(" | ") || "Sem alertas")}</span></p>
          `).join("")}
        </div>
      `;
      root.querySelector("[data-result]").innerHTML = html;
    }
  }

  function saveManualProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      id: `manual-${Date.now()}`,
      name: text(form.get("nome")),
      category: text(form.get("categoria")),
      price: Number(form.get("preco") || 0),
      image: text(form.get("imagem")),
      description: text(form.get("descricao")),
      shortDescription: text(form.get("descricao")),
      fullDescription: text(form.get("descricao")),
      affiliateLink: text(form.get("link_original_afiliado")),
      link_original_afiliado: text(form.get("link_original_afiliado")),
      badge: "Manual",
      specs: [],
      status: "rascunho"
    };
    const current = readJson(MANUAL_PRODUCTS_KEY, []);
    localStorage.setItem(MANUAL_PRODUCTS_KEY, JSON.stringify([...current, product]));
    if (typeof window.__impacto360AddManualProduct === "function") window.__impacto360AddManualProduct(product);
    renderAdminPanel("Produto manual salvo como rascunho.");
  }

  function renderClosedStore() {
    document.body.className = "";
    const whatsapp = localStorage.getItem(WHATSAPP_KEY) || "";
    const digits = whatsapp.replace(/\D/g, "");
    const href = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent("Olá, quero saber quando a loja IMPACTO 360 terá novas ofertas.")}`
      : `https://wa.me/?text=${encodeURIComponent("Olá, quero saber quando a loja IMPACTO 360 terá novas ofertas.")}`;
    document.body.innerHTML = `
      <main class="ai360-closed">
        <section>
          <span>IMPACTO 360 AFILIADO</span>
          <h1>Loja em preparação</h1>
          <p>Em breve novas ofertas. Estamos revisando produtos, imagens e links de afiliado antes de liberar a vitrine ao público.</p>
          <div class="ai360-closed-actions">
            <button type="button" onclick="localStorage.setItem('ai360:storeOpen:v2','true'); location.href=location.pathname + '?abrir=loja';">Entrar no shopping</button>
            <a href="${href}" target="_blank" rel="noreferrer">Falar no WhatsApp</a>
          </div>
        </section>
      </main>
    `;
    injectClosedStyle();
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

  function injectMobileProductStyle() {
    const style = document.createElement("style");
    style.textContent = `.product-media img{object-fit:contain!important;background:#fff;padding:10px}.product-actions .btn-primary{min-height:48px}`;
    document.head.appendChild(style);
  }

  function injectAdminStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .ai360-admin{min-height:100vh;background:linear-gradient(135deg,#f8fbff,#eef7fb);padding:24px;color:#08192f;font-family:Inter,system-ui,sans-serif}
      .admin-shell{width:min(1180px,100%);margin:0 auto}.admin-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:18px}
      .admin-head h1,.admin-card h2{margin:0}.admin-head p,.admin-card p{color:#607083}.admin-grid{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:16px;margin-bottom:16px}
      .admin-card{background:rgba(255,255,255,.92);border:1px solid rgba(56,91,130,.16);border-radius:8px;box-shadow:0 20px 54px rgba(8,25,47,.1);padding:18px}
      .admin-login{max-width:520px;margin:8vh auto}.admin-icon{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:8px;background:#1d5cff;color:#fff;font-weight:900}
      .admin-card input,.admin-card textarea{width:100%;min-height:44px;border:1px solid rgba(56,91,130,.18);border-radius:8px;padding:10px 12px;margin:6px 0 10px}
      .admin-card textarea{min-height:96px}.admin-card button,.admin-card a{display:inline-flex;justify-content:center;align-items:center;min-height:42px;border:0;border-radius:8px;background:#1d5cff;color:#fff;font-weight:900;padding:0 14px;margin:4px;text-decoration:none}
      .admin-actions{display:flex;flex-wrap:wrap;gap:6px}.admin-status{border-radius:999px;padding:8px 12px;font-weight:900}.admin-status.ok{background:#dff8ed;color:#0c6b46}.admin-status.wait{background:#fff1cc;color:#7c5300}
      .admin-product-form{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.admin-product-form textarea,.admin-product-form button{grid-column:1/-1}
      .admin-result{margin-top:14px;padding:12px;border-radius:8px;background:#eef5ff}.admin-table{margin-top:12px;max-height:360px;overflow:auto}.admin-table p{border-top:1px solid rgba(56,91,130,.14);padding-top:8px}
      pre{white-space:pre-wrap;max-height:320px;overflow:auto;background:#06152d;color:#eaf6ff;padding:14px;border-radius:8px}
      @media(max-width:850px){.admin-head,.admin-grid,.admin-product-form{grid-template-columns:1fr;display:grid}.ai360-admin{padding:14px}}
    `;
    document.head.appendChild(style);
  }

  function injectClosedStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .ai360-closed{min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#f8fbff,#eaf7f9);font-family:Inter,system-ui,sans-serif;color:#08192f}
      .ai360-closed section{width:min(720px,100%);text-align:center;background:rgba(255,255,255,.92);border:1px solid rgba(56,91,130,.16);border-radius:8px;box-shadow:0 24px 70px rgba(8,25,47,.14);padding:32px}
      .ai360-closed span{font-weight:900;color:#1d5cff}.ai360-closed h1{font-size:clamp(2rem,7vw,4rem);margin:14px 0 10px}.ai360-closed p{font-size:1.08rem;line-height:1.75;color:#607083}
      .ai360-closed-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
      .ai360-closed a,.ai360-closed button{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border:0;border-radius:8px;background:#16a36f;color:white;font-weight:900;padding:0 18px;text-decoration:none;cursor:pointer}
      .ai360-closed button{background:#1d5cff}
    `;
    document.head.appendChild(style);
  }
})();
