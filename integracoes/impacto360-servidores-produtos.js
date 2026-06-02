(function () {
  const PANEL_ID = "impacto360-servidores-panel";
  const STORAGE_KEY = "impacto360ProductOverrides";
  if (document.getElementById(PANEL_ID)) return;

  function productList() {
    try {
      if (typeof products !== "undefined" && Array.isArray(products)) return products;
    } catch (error) {}
    return [];
  }

  function storeList() {
    try {
      if (typeof stores !== "undefined" && Array.isArray(stores)) return stores;
    } catch (error) {}
    return [];
  }

  function loadOverrides() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveOverrides(overrides) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }

  function applyOverrides() {
    const overrides = loadOverrides();
    productList().forEach((product) => {
      if (overrides[product.id]) Object.assign(product, overrides[product.id], { editable: true });
    });
  }

  function refreshStore() {
    try {
      if (typeof currentStore !== "undefined" && currentStore && typeof renderStorePage === "function") {
        renderStorePage(currentStore);
      } else if (typeof renderMall === "function") {
        renderMall();
      }
    } catch (error) {}
  }

  function addStyles() {
    const css = `
      #${PANEL_ID} {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: none;
        background: rgba(6, 21, 45, .52);
        backdrop-filter: blur(10px);
      }
      #${PANEL_ID}.open { display: grid; place-items: center; padding: 18px; }
      .servers-shell {
        width: min(1120px, 100%);
        max-height: min(820px, calc(100vh - 36px));
        overflow: hidden;
        display: grid;
        grid-template-rows: auto auto 1fr;
        border: 1px solid rgba(255,255,255,.32);
        border-radius: 12px;
        background: #f7fbff;
        box-shadow: 0 28px 90px rgba(6, 21, 45, .32);
      }
      .servers-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 18px;
        color: white;
        background: linear-gradient(135deg, #06152d, #1d5cff);
      }
      .servers-head h2 { margin: 0; font-size: 1.25rem; }
      .servers-head p { margin: 3px 0 0; color: rgba(255,255,255,.78); }
      .servers-close {
        border: 1px solid rgba(255,255,255,.34);
        border-radius: 999px;
        color: white;
        background: rgba(255,255,255,.12);
        min-width: 42px;
        min-height: 42px;
        cursor: pointer;
      }
      .servers-tabs {
        display: flex;
        gap: 8px;
        padding: 12px 14px;
        overflow-x: auto;
        border-bottom: 1px solid rgba(6, 21, 45, .1);
        background: white;
      }
      .servers-tab, .servers-btn {
        border: 1px solid rgba(29, 92, 255, .2);
        border-radius: 999px;
        background: #f3f7ff;
        color: #07172f;
        cursor: pointer;
        font: inherit;
      }
      .servers-tab { padding: 9px 12px; }
      .servers-tab.active { color: white; background: #1d5cff; }
      .servers-body { overflow: auto; padding: 16px; }
      .servers-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .servers-card, .editor-card {
        padding: 16px;
        border: 1px solid rgba(6, 21, 45, .1);
        border-radius: 10px;
        background: white;
        box-shadow: 0 14px 36px rgba(6, 21, 45, .08);
      }
      .servers-card h3, .editor-card h3 { margin: 0 0 8px; }
      .servers-card p, .editor-card p { margin: 0 0 12px; color: #607083; line-height: 1.45; }
      .servers-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 0 12px;
        font-weight: 800;
      }
      .servers-btn.primary {
        color: white;
        border-color: transparent;
        background: linear-gradient(135deg, #1d5cff, #27d7e8);
      }
      .editor-layout {
        display: grid;
        grid-template-columns: minmax(220px, 320px) 1fr;
        gap: 14px;
      }
      .editor-list {
        max-height: 560px;
        overflow: auto;
        display: grid;
        gap: 8px;
      }
      .editor-item {
        border: 1px solid rgba(6, 21, 45, .1);
        border-radius: 8px;
        background: white;
        padding: 10px;
        text-align: left;
        cursor: pointer;
      }
      .editor-item.active { border-color: #1d5cff; box-shadow: 0 0 0 3px rgba(29, 92, 255, .12); }
      .editor-form {
        display: grid;
        gap: 10px;
      }
      .editor-form label { display: grid; gap: 5px; color: #607083; font-size: .88rem; }
      .editor-form input, .editor-form textarea, .editor-form select {
        width: 100%;
        min-height: 42px;
        border: 1px solid rgba(6, 21, 45, .14);
        border-radius: 8px;
        padding: 9px 10px;
        color: #07172f;
        background: white;
        font: inherit;
      }
      .editor-form textarea { min-height: 96px; resize: vertical; }
      .editor-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .servers-open-btn {
        position: fixed;
        left: 16px;
        bottom: 16px;
        z-index: 99998;
        min-height: 48px;
        padding: 0 16px;
        border: 1px solid rgba(255,255,255,.4);
        border-radius: 999px;
        color: white;
        background: linear-gradient(135deg, #06152d, #1d5cff);
        box-shadow: 0 16px 42px rgba(6, 21, 45, .28);
        cursor: pointer;
        font-weight: 900;
      }
      @media (max-width: 900px) {
        .servers-grid, .editor-layout { grid-template-columns: 1fr; }
      }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function build() {
    applyOverrides();
    addStyles();
    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="servers-shell" role="dialog" aria-label="Sala Servidores">
        <header class="servers-head">
          <div>
            <h2>Servidores</h2>
            <p>Sala dos robôs, módulos e edição dos produtos da loja.</p>
          </div>
          <button class="servers-close" type="button" data-close>&times;</button>
        </header>
        <nav class="servers-tabs">
          <button class="servers-tab active" data-tab="robots">Robôs</button>
          <button class="servers-tab" data-tab="products">Produtos editáveis</button>
          <button class="servers-tab" data-tab="commands">Comandos</button>
        </nav>
        <div class="servers-body"></div>
      </div>
    `;
    const openButton = document.createElement("button");
    openButton.className = "servers-open-btn";
    openButton.type = "button";
    openButton.textContent = "Servidores";
    document.body.appendChild(panel);
    document.body.appendChild(openButton);

    openButton.addEventListener("click", () => openPanel("robots"));
    panel.querySelector("[data-close]").addEventListener("click", closePanel);
    panel.querySelectorAll(".servers-tab").forEach((tab) => {
      tab.addEventListener("click", () => render(tab.dataset.tab));
    });
    render("robots");
  }

  function openPanel(tab) {
    document.getElementById(PANEL_ID).classList.add("open");
    render(tab || "robots");
  }

  function closePanel() {
    document.getElementById(PANEL_ID).classList.remove("open");
  }

  function render(tabName) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.querySelectorAll(".servers-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
    const body = panel.querySelector(".servers-body");
    if (tabName === "robots") renderRobots(body);
    if (tabName === "products") renderProducts(body);
    if (tabName === "commands") renderCommands(body);
  }

  function renderRobots(body) {
    const cards = [
      ["AFILIADO-ORBIT", "Servidor de curadoria, validação de links afiliados, Mercado Livre, Amazon, Shopee, scores e exportações.", "http://localhost:5174"],
      ["Robô da Loja", "Atendimento dentro da vitrine, recomendação de produtos, captura de interesse e WhatsApp.", null],
      ["Automação Pessoal 360", "Servidor para postagens pessoais autorizadas por OAuth, com modo teste e aprovação manual.", null],
      ["Automação Social 360", "Servidor de automação social estruturada para múltiplas redes, sem senha no código.", null],
      ["Central VIP", "Servidor de campanhas, UTM, textos, anúncios preparados e compartilhamento seguro.", null],
      ["Mercado Livre Afiliado", "Servidor dedicado para inserir e validar links gerados no Portal do Afiliado.", "http://localhost:8000/docs"],
    ];
    body.innerHTML = `<div class="servers-grid">${cards.map(([name, text, url]) => `
      <article class="servers-card">
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(text)}</p>
        ${url ? `<button class="servers-btn primary" data-open-url="${escapeHtml(url)}">Abrir servidor</button>` : `<button class="servers-btn" data-tab-products>Configurar</button>`}
      </article>
    `).join("")}</div>`;
    body.querySelectorAll("[data-open-url]").forEach((button) => {
      button.addEventListener("click", () => window.open(button.dataset.openUrl, "_blank", "noopener,noreferrer"));
    });
    body.querySelectorAll("[data-tab-products]").forEach((button) => {
      button.addEventListener("click", () => render("products"));
    });
  }

  function renderProducts(body) {
    const list = productList();
    const first = list[0];
    body.innerHTML = `
      <div class="editor-layout">
        <div class="editor-card">
          <h3>Produtos</h3>
          <p>Selecione um produto para editar. As alterações ficam salvas no navegador e podem ser exportadas em JSON.</p>
          <input id="serverProductSearch" placeholder="Buscar produto..." />
          <div class="editor-list" id="serverProductList"></div>
        </div>
        <div class="editor-card" id="serverProductEditor"></div>
      </div>
    `;
    const search = body.querySelector("#serverProductSearch");
    search.addEventListener("input", () => renderProductList(search.value));
    renderProductList("");
    if (first) editProduct(first.id);
  }

  function renderProductList(filter) {
    const container = document.getElementById("serverProductList");
    if (!container) return;
    const term = normalize(filter);
    const list = productList().filter((product) => !term || normalize(`${product.name} ${product.category} ${product.storeId}`).includes(term));
    container.innerHTML = list.slice(0, 160).map((product) => `
      <button class="editor-item" type="button" data-edit-product="${escapeHtml(product.id)}">
        <strong>${escapeHtml(product.name || "Produto sem nome")}</strong><br>
        <small>${escapeHtml(product.price || "Sem preço")} | ${escapeHtml(product.storeId || "")}</small>
      </button>
    `).join("");
    container.querySelectorAll("[data-edit-product]").forEach((button) => {
      button.addEventListener("click", () => editProduct(button.dataset.editProduct));
    });
  }

  function editProduct(productId) {
    const product = productList().find((item) => item.id === productId);
    const editor = document.getElementById("serverProductEditor");
    if (!product || !editor) return;
    const storeOptions = storeList().map((store) => `<option value="${escapeHtml(store.id)}"${store.id === product.storeId ? " selected" : ""}>${escapeHtml(store.name)}</option>`).join("");
    editor.innerHTML = `
      <h3>Editar produto</h3>
      <form class="editor-form" id="serverProductForm">
        <label>Nome <input name="name" value="${escapeAttr(product.name || "")}" /></label>
        <label>Preço <input name="price" value="${escapeAttr(product.price || "")}" /></label>
        <label>Imagem <input name="image" value="${escapeAttr(product.image || "")}" /></label>
        <label>Link afiliado <input name="affiliateLink" value="${escapeAttr(product.affiliateLink || "")}" /></label>
        <label>Loja <select name="storeId">${storeOptions}</select></label>
        <label>Categoria <input name="category" value="${escapeAttr(product.category || product.categoria || "")}" /></label>
        <label>Selo <input name="badge" value="${escapeAttr(product.badge || "")}" /></label>
        <label>Status <input name="status" value="${escapeAttr(product.status || "ativo")}" /></label>
        <label>Descrição <textarea name="description">${escapeHtml(product.description || "")}</textarea></label>
        <div class="editor-actions">
          <button class="servers-btn primary" type="submit">Salvar edição</button>
          <button class="servers-btn" type="button" data-export-products>Exportar JSON</button>
          <button class="servers-btn" type="button" data-clear-overrides>Limpar edições locais</button>
        </div>
      </form>
    `;
    editor.querySelector("#serverProductForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const overrides = loadOverrides();
      overrides[product.id] = { ...data, editable: true };
      saveOverrides(overrides);
      Object.assign(product, overrides[product.id]);
      refreshStore();
      renderProductList(document.getElementById("serverProductSearch")?.value || "");
      alert("Produto salvo no navegador. Exporte o JSON para publicar permanentemente.");
    });
    editor.querySelector("[data-export-products]").addEventListener("click", exportProducts);
    editor.querySelector("[data-clear-overrides]").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      alert("Edições locais removidas. Recarregue a página para ver os dados originais.");
    });
  }

  function renderCommands(body) {
    const commands = [
      ["Adicionar sala Servidores e editor", "powershell -ExecutionPolicy Bypass -File .\\CORRIGIR-LOJA-SERVIDORES-PRODUTOS.ps1"],
      ["Rodar AFILIADO-ORBIT", "cd AFILIADO-ORBIT && copy .env.example .env && docker compose -f infra/docker-compose.yml --env-file .env up --build"],
      ["Painel AFILIADO-ORBIT", "http://localhost:5174"],
      ["API AFILIADO-ORBIT", "http://localhost:8000/docs"],
      ["Automação Pessoal 360", "cd automacao-afiliado-pessoal-360 && copy .env.example .env && npm install && npm run dev"],
      ["Automação Social 360", "cd automacao-afiliado-social-360 && copy .env.example .env && npm install && npm run dev"],
    ];
    body.innerHTML = `<div class="servers-grid">${commands.map(([title, command], index) => `
      <article class="servers-card">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(command)}</p>
        <button class="servers-btn" data-copy-command="${index}">Copiar</button>
      </article>
    `).join("")}</div>`;
    body.querySelectorAll("[data-copy-command]").forEach((button) => {
      button.addEventListener("click", () => copyText(commands[Number(button.dataset.copyCommand)][1]));
    });
  }

  function exportProducts() {
    applyOverrides();
    const data = JSON.stringify(productList(), null, 2);
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products-editados-impacto360.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => alert("Copiado."));
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    alert("Copiado.");
  }

  function normalize(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  window.abrirServidoresImpacto360 = function () {
    openPanel("robots");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();

