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
      .servers-alert {
        margin: 0 0 14px;
        padding: 13px 14px;
        border: 1px solid rgba(29, 92, 255, .18);
        border-radius: 10px;
        color: #173657;
        background: linear-gradient(135deg, #eef7ff, #ffffff);
        box-shadow: 0 12px 28px rgba(6, 21, 45, .06);
        line-height: 1.45;
      }
      .servers-alert strong { color: #06152d; }
      .servers-status {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 0 9px;
        margin: 0 0 10px;
        border-radius: 999px;
        color: #0b4a64;
        background: #e9f9fd;
        font-size: .78rem;
        font-weight: 900;
      }
      .servers-card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .servers-command-box {
        margin-top: 10px;
        padding: 10px;
        border: 1px dashed rgba(29, 92, 255, .24);
        border-radius: 8px;
        color: #40536b;
        background: #f8fbff;
        font-size: .82rem;
        line-height: 1.4;
      }
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
      {
        name: "AFILIADO-ORBIT",
        status: "Painel local em http://localhost:5174",
        text: "Curadoria de produtos, validação de links afiliados, Mercado Livre, Amazon, Shopee, scores e exportações.",
        command: "Dê duplo clique em INICIAR-SERVIDOR-AFILIADO-ORBIT.bat ou rode: cd AFILIADO-ORBIT && copy .env.example .env && docker compose -f infra/docker-compose.yml --env-file .env up --build",
        actions: [
          { label: "Abrir se ligado", type: "url", value: "http://localhost:5174", primary: true },
          { label: "API se ligada", type: "url", value: "http://localhost:8000/docs" },
          { label: "Copiar comando", type: "copy-command" },
        ],
      },
      {
        name: "Mercado Livre Afiliado",
        status: "Dentro do AFILIADO-ORBIT",
        text: "Área para buscar produtos, inserir seu link do Portal do Afiliado, validar e aprovar publicação.",
        command: "Dê duplo clique em INICIAR-SERVIDOR-AFILIADO-ORBIT.bat. Depois abra http://localhost:5174/#mercado-livre-afiliado",
        actions: [
          { label: "Abrir ML se ligado", type: "url", value: "http://localhost:5174/#mercado-livre-afiliado", primary: true },
          { label: "API ML se ligada", type: "url", value: "http://localhost:8000/docs" },
          { label: "Copiar comando", type: "copy-command" },
        ],
      },
      {
        name: "Robô da Loja",
        status: "Embutido nesta vitrine",
        text: "Atendimento dentro da loja, recomendação de produtos, captura de interesse e WhatsApp.",
        command: "Abra a loja e clique no botão 360 no canto inferior direito.",
        actions: [
          { label: "Abrir chat 360", type: "chat", primary: true },
          { label: "Editar produtos", type: "products" },
        ],
      },
      {
        name: "Automação Pessoal 360",
        status: "Servidor OAuth pessoal",
        text: "Postagens pessoais autorizadas por OAuth, modo teste, histórico, agenda e aprovação manual.",
        command: "Dê duplo clique em INICIAR-SERVIDOR-AUTOMACAO-PESSOAL-360.bat ou rode: cd automacao-afiliado-pessoal-360 && copy .env.example .env && npm install && npm run dev",
        actions: [
          { label: "Abrir painel estático", type: "url", value: "../automacao-afiliado-pessoal-360/PAINEL-PESSOAL-360.html", primary: true },
          { label: "Abrir se ligado", type: "url", value: "http://localhost:5173" },
          { label: "Copiar comando", type: "copy-command" },
        ],
      },
      {
        name: "Automação Social 360",
        status: "Servidor social completo",
        text: "Painel de automação social estruturada para redes, com tokens protegidos e modo seguro.",
        command: "Dê duplo clique em INICIAR-SERVIDOR-AUTOMACAO-SOCIAL-360.bat ou rode: cd automacao-afiliado-social-360 && copy .env.example .env && npm install && npm run dev",
        actions: [
          { label: "Abrir se ligado", type: "url", value: "http://localhost:5173", primary: true },
          { label: "Copiar comando", type: "copy-command" },
        ],
      },
      {
        name: "Central VIP",
        status: "Campanhas e divulgação",
        text: "Campanhas, UTM, textos de anúncios, WhatsApp, e-mail e modelos de divulgação segura.",
        command: "Use a aba Comandos e a Central de Divulgação publicada na loja quando disponível.",
        actions: [
          { label: "Ver comandos", type: "commands", primary: true },
          { label: "Copiar orientação", type: "copy-command" },
        ],
      },
    ];
    body.innerHTML = `
      <div class="servers-alert">
        <strong>Atenção:</strong> endereços <strong>localhost</strong> só abrem quando o servidor correspondente está ligado no seu computador.
        Se aparecer "conexão recusada", volte na pasta do projeto e dê duplo clique no arquivo <strong>INICIAR-SERVIDOR...</strong> do módulo desejado.
      </div>
      <div class="servers-grid">${cards.map((card, index) => `
      <article class="servers-card">
        <h3>${escapeHtml(card.name)}</h3>
        <span class="servers-status">${escapeHtml(card.status)}</span>
        <p>${escapeHtml(card.text)}</p>
        <div class="servers-card-actions">
          ${card.actions.map((action) => `
            <button
              class="servers-btn${action.primary ? " primary" : ""}"
              type="button"
              data-server-action="${escapeAttr(action.type)}"
              data-server-index="${index}"
              ${action.value ? `data-action-value="${escapeAttr(action.value)}"` : ""}
            >${escapeHtml(action.label)}</button>
          `).join("")}
        </div>
        <div class="servers-command-box">${escapeHtml(card.command)}</div>
      </article>
    `).join("")}</div>`;
    body.querySelectorAll("[data-server-action]").forEach((button) => {
      button.addEventListener("click", () => runServerAction(button, cards[Number(button.dataset.serverIndex)]));
    });
  }

  function runServerAction(button, card) {
    const type = button.dataset.serverAction;
    const value = button.dataset.actionValue;
    if (type === "url") {
      window.open(value, "_blank", "noopener,noreferrer");
      return;
    }
    if (type === "copy-command") {
      copyText(card.command);
      return;
    }
    if (type === "products") {
      render("products");
      return;
    }
    if (type === "commands") {
      render("commands");
      return;
    }
    if (type === "chat") {
      const chatButton = document.querySelector("#impacto360-robo-orbit .orbit-fab");
      if (chatButton) {
        closePanel();
        chatButton.click();
      } else {
        alert("O Robô da Loja não foi encontrado nesta página. Confirme se impacto360-robo-orbit.js está carregado.");
      }
    }
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
      ["Iniciar AFILIADO-ORBIT", "INICIAR-SERVIDOR-AFILIADO-ORBIT.bat"],
      ["Painel AFILIADO-ORBIT", "http://localhost:5174"],
      ["API AFILIADO-ORBIT", "http://localhost:8000/docs"],
      ["Mercado Livre Afiliado", "Abra o AFILIADO-ORBIT e acesse http://localhost:5174/#mercado-livre-afiliado"],
      ["Robô da Loja", "Clique no botão 360 no canto inferior direito da própria loja."],
      ["Iniciar Automação Pessoal 360", "INICIAR-SERVIDOR-AUTOMACAO-PESSOAL-360.bat"],
      ["Painel Pessoal local", "automacao-afiliado-pessoal-360\\PAINEL-PESSOAL-360.html"],
      ["Iniciar Automação Social 360", "INICIAR-SERVIDOR-AUTOMACAO-SOCIAL-360.bat"],
      ["Produtos editáveis", "Servidores > Produtos editáveis > Salvar edição > Exportar JSON para publicar permanente."],
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
