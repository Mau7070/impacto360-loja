(function () {
  const ROBOT_ID = "impacto360-robo-orbit";
  if (document.getElementById(ROBOT_ID)) return;

  const settings = {
    siteName: "IMPACTO 360 AFILIADO",
    whatsapp: "https://wa.me/?text=",
    orbitPanelUrl: "http://localhost:5174",
    orbitApiUrl: "http://localhost:8000/docs",
    modules: [
      {
        name: "AFILIADO-ORBIT",
        label: "Curadoria de produtos e links afiliados",
        command: "cd AFILIADO-ORBIT && copy .env.example .env && docker compose -f infra/docker-compose.yml --env-file .env up --build",
      },
      {
        name: "Automacao Afiliado Pessoal 360",
        label: "Postagens pessoais com OAuth oficial",
        command: "cd automacao-afiliado-pessoal-360 && copy .env.example .env && npm install && npm run dev",
      },
      {
        name: "Automacao Afiliado Social 360",
        label: "Painel de automacao social estruturado",
        command: "cd automacao-afiliado-social-360 && copy .env.example .env && npm install && npm run dev",
      },
      {
        name: "Central VIP de Divulgacao",
        label: "Campanhas, UTM, textos e compartilhamento seguro",
        command: "Abrir a loja e acessar a area Central de Divulgacao/Central VIP quando publicada.",
      },
    ],
  };

  const state = {
    messages: [
      {
        role: "bot",
        text: "Ola! Sou o Robo IMPACTO 360. Posso indicar uma loja, buscar produto, preparar atendimento no WhatsApp ou mostrar comandos dos modulos criados.",
      },
    ],
  };

  function getProducts() {
    try {
      if (typeof products !== "undefined" && Array.isArray(products)) return products;
    } catch (error) {}
    try {
      return JSON.parse(localStorage.getItem("impacto360-products-cache") || "[]");
    } catch (error) {
      return [];
    }
  }

  function getStores() {
    try {
      if (typeof stores !== "undefined" && Array.isArray(stores)) return stores;
    } catch (error) {}
    return [];
  }

  function addStyles() {
    const css = `
      #${ROBOT_ID} {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 99999;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #07172f;
      }
      #${ROBOT_ID} * { box-sizing: border-box; }
      .orbit-fab {
        width: 68px;
        height: 68px;
        border: 0;
        border-radius: 999px;
        color: white;
        background: radial-gradient(circle at 28% 22%, #66efff, #2367ff 42%, #06152d 100%);
        box-shadow: 0 18px 46px rgba(6, 21, 45, .28);
        cursor: pointer;
        display: grid;
        place-items: center;
        font-weight: 900;
        letter-spacing: .04em;
        animation: orbitPulse 2.8s ease-in-out infinite;
      }
      @keyframes orbitPulse {
        0%, 100% { transform: translateY(0); box-shadow: 0 18px 46px rgba(6, 21, 45, .28); }
        50% { transform: translateY(-3px); box-shadow: 0 22px 60px rgba(35, 103, 255, .36); }
      }
      .orbit-panel {
        position: absolute;
        right: 0;
        bottom: 84px;
        width: min(420px, calc(100vw - 28px));
        max-height: min(720px, calc(100vh - 120px));
        display: none;
        overflow: hidden;
        border: 1px solid rgba(31, 107, 255, .18);
        border-radius: 12px;
        background: rgba(255,255,255,.94);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(6, 21, 45, .22);
      }
      .orbit-panel.open { display: grid; grid-template-rows: auto auto 1fr auto; }
      .orbit-head {
        padding: 16px;
        color: white;
        background: linear-gradient(135deg, #06152d, #1d5cff);
      }
      .orbit-head strong { display: block; font-size: 1.05rem; }
      .orbit-head span { display: block; margin-top: 4px; color: rgba(255,255,255,.78); font-size: .86rem; }
      .orbit-tabs, .orbit-actions {
        display: flex;
        gap: 8px;
        padding: 10px;
        overflow-x: auto;
        border-bottom: 1px solid rgba(7, 23, 47, .09);
      }
      .orbit-tab, .orbit-btn, .orbit-chip {
        border: 1px solid rgba(31, 107, 255, .16);
        border-radius: 999px;
        background: #f5f8ff;
        color: #07172f;
        cursor: pointer;
        white-space: nowrap;
      }
      .orbit-tab { padding: 8px 10px; font-size: .82rem; }
      .orbit-tab.active { color: white; background: #1d5cff; }
      .orbit-body {
        overflow: auto;
        padding: 12px;
        background:
          radial-gradient(circle at top left, rgba(39, 215, 232, .12), transparent 18rem),
          #ffffff;
      }
      .orbit-msg {
        max-width: 92%;
        margin: 0 0 10px;
        padding: 10px 12px;
        border-radius: 12px;
        line-height: 1.42;
        font-size: .92rem;
      }
      .orbit-msg.bot { background: #eef5ff; border-top-left-radius: 4px; }
      .orbit-msg.user { margin-left: auto; color: white; background: #1d5cff; border-top-right-radius: 4px; }
      .orbit-form, .orbit-lead, .orbit-modules {
        display: grid;
        gap: 9px;
      }
      .orbit-input, .orbit-select, .orbit-textarea {
        width: 100%;
        min-height: 42px;
        padding: 10px 12px;
        border: 1px solid rgba(7, 23, 47, .14);
        border-radius: 8px;
        background: white;
        color: #07172f;
        font: inherit;
      }
      .orbit-textarea { min-height: 78px; resize: vertical; }
      .orbit-btn {
        min-height: 40px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 800;
      }
      .orbit-btn.primary {
        color: white;
        background: linear-gradient(135deg, #1d5cff, #27d7e8);
        border-color: transparent;
      }
      .orbit-card {
        padding: 12px;
        border: 1px solid rgba(7, 23, 47, .1);
        border-radius: 10px;
        background: white;
        box-shadow: 0 12px 28px rgba(7, 23, 47, .08);
      }
      .orbit-card strong { display: block; margin-bottom: 4px; }
      .orbit-card p { margin: 0 0 8px; color: #607083; font-size: .88rem; }
      .orbit-small { color: #607083; font-size: .78rem; line-height: 1.4; }
      .orbit-footer {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        padding: 10px;
        border-top: 1px solid rgba(7, 23, 47, .09);
        background: #f8fbff;
      }
      .orbit-footer input {
        min-height: 42px;
        border: 1px solid rgba(7, 23, 47, .14);
        border-radius: 999px;
        padding: 0 13px;
      }
      @media (max-width: 520px) {
        #${ROBOT_ID} { right: 12px; bottom: 12px; }
        .orbit-panel { width: calc(100vw - 24px); bottom: 78px; }
      }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function build() {
    addStyles();
    const root = document.createElement("section");
    root.id = ROBOT_ID;
    root.innerHTML = `
      <section class="orbit-panel" aria-label="Robo IMPACTO 360">
        <div class="orbit-head">
          <strong>Robo IMPACTO 360</strong>
          <span>Atendimento, recomendacoes, leads e central de integracoes.</span>
        </div>
        <nav class="orbit-tabs">
          <button class="orbit-tab active" data-tab="chat">Atendimento</button>
          <button class="orbit-tab" data-tab="finder">Produto ideal</button>
          <button class="orbit-tab" data-tab="lead">Capturar lead</button>
          <button class="orbit-tab" data-tab="modules">Modulos</button>
        </nav>
        <div class="orbit-body" data-body="chat"></div>
        <div class="orbit-footer">
          <input data-chat-input placeholder="Digite produto, loja ou interesse..." />
          <button class="orbit-btn primary" data-send>Enviar</button>
        </div>
      </section>
      <button class="orbit-fab" type="button" aria-label="Abrir Robo IMPACTO 360">360</button>
    `;
    document.body.appendChild(root);

    root.querySelector(".orbit-fab").addEventListener("click", () => {
      root.querySelector(".orbit-panel").classList.toggle("open");
      render("chat");
    });
    root.querySelectorAll(".orbit-tab").forEach((tab) => {
      tab.addEventListener("click", () => render(tab.dataset.tab));
    });
    root.querySelector("[data-send]").addEventListener("click", sendChat);
    root.querySelector("[data-chat-input]").addEventListener("keydown", (event) => {
      if (event.key === "Enter") sendChat();
    });
    render("chat");
  }

  function render(tabName) {
    const root = document.getElementById(ROBOT_ID);
    if (!root) return;
    root.querySelectorAll(".orbit-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });
    const body = root.querySelector(".orbit-body");
    body.dataset.body = tabName;
    if (tabName === "chat") renderChat(body);
    if (tabName === "finder") renderFinder(body);
    if (tabName === "lead") renderLead(body);
    if (tabName === "modules") renderModules(body);
  }

  function renderChat(body) {
    body.innerHTML = state.messages.map((msg) => `<p class="orbit-msg ${msg.role}">${escapeHtml(msg.text)}</p>`).join("") + `
      <div class="orbit-actions">
        <button class="orbit-btn" data-quick="celular">Celulares</button>
        <button class="orbit-btn" data-quick="computador">Computadores</button>
        <button class="orbit-btn" data-quick="oferta">Ofertas</button>
        <button class="orbit-btn" data-whatsapp>WhatsApp</button>
      </div>
    `;
    body.querySelectorAll("[data-quick]").forEach((button) => {
      button.addEventListener("click", () => answer(button.dataset.quick));
    });
    body.querySelector("[data-whatsapp]").addEventListener("click", () => openWhatsApp("Ola, quero atendimento da loja IMPACTO 360 AFILIADO."));
    body.scrollTop = body.scrollHeight;
  }

  function renderFinder(body) {
    body.innerHTML = `
      <form class="orbit-form" data-finder-form>
        <input class="orbit-input" name="term" placeholder="O que voce procura? Ex: celular, notebook, curso" />
        <select class="orbit-select" name="budget">
          <option value="">Faixa de preco</option>
          <option value="baixo">Economico</option>
          <option value="medio">Intermediario</option>
          <option value="alto">Premium</option>
        </select>
        <button class="orbit-btn primary" type="submit">Encontrar recomendacao</button>
      </form>
      <div data-finder-result></div>
    `;
    body.querySelector("[data-finder-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const result = recommend(form.get("term"), form.get("budget"));
      body.querySelector("[data-finder-result]").innerHTML = result;
    });
  }

  function renderLead(body) {
    body.innerHTML = `
      <form class="orbit-lead" data-lead-form>
        <input class="orbit-input" name="name" placeholder="Seu nome" required />
        <input class="orbit-input" name="phone" placeholder="WhatsApp com DDD" required />
        <textarea class="orbit-textarea" name="interest" placeholder="Qual produto ou servico voce procura?" required></textarea>
        <label class="orbit-small"><input type="checkbox" name="consent" required /> Aceito receber contato sobre meu interesse. Sem spam.</label>
        <button class="orbit-btn primary" type="submit">Salvar interesse e chamar no WhatsApp</button>
      </form>
      <p class="orbit-small">Os dados ficam no navegador/localStorage da loja. Para CRM profissional, use o backend AFILIADO-ORBIT.</p>
    `;
    body.querySelector("[data-lead-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const lead = {
        name: form.get("name"),
        phone: form.get("phone"),
        interest: form.get("interest"),
        consent: Boolean(form.get("consent")),
        createdAt: new Date().toISOString(),
      };
      const leads = JSON.parse(localStorage.getItem("impacto360Leads") || "[]");
      leads.push(lead);
      localStorage.setItem("impacto360Leads", JSON.stringify(leads));
      openWhatsApp(`Ola, sou ${lead.name}. Tenho interesse em: ${lead.interest}`);
    });
  }

  function renderModules(body) {
    body.innerHTML = `
      <div class="orbit-modules">
        ${settings.modules.map((module, index) => `
          <article class="orbit-card">
            <strong>${escapeHtml(module.name)}</strong>
            <p>${escapeHtml(module.label)}</p>
            <button class="orbit-btn" data-copy-command="${index}">Copiar comando</button>
          </article>
        `).join("")}
        <article class="orbit-card">
          <strong>Links rapidos locais</strong>
          <p>Use depois que os servidores estiverem rodando no seu PC.</p>
          <button class="orbit-btn" data-open="${settings.orbitPanelUrl}">Abrir painel AFILIADO-ORBIT</button>
          <button class="orbit-btn" data-open="${settings.orbitApiUrl}">Abrir API AFILIADO-ORBIT</button>
        </article>
      </div>
    `;
    body.querySelectorAll("[data-copy-command]").forEach((button) => {
      button.addEventListener("click", () => copy(settings.modules[Number(button.dataset.copyCommand)].command));
    });
    body.querySelectorAll("[data-open]").forEach((button) => {
      button.addEventListener("click", () => window.open(button.dataset.open, "_blank", "noopener,noreferrer"));
    });
  }

  function sendChat() {
    const root = document.getElementById(ROBOT_ID);
    const input = root.querySelector("[data-chat-input]");
    const text = input.value.trim();
    if (!text) return;
    state.messages.push({ role: "user", text });
    input.value = "";
    answer(text);
  }

  function answer(text) {
    const suggestion = findBest(text);
    if (suggestion.product) {
      state.messages.push({
        role: "bot",
        text: `Encontrei uma opcao: ${suggestion.product.name}. ${suggestion.product.description || ""} Valor: ${suggestion.product.price || "consultar"}. Posso abrir a loja ou preparar WhatsApp.`,
      });
    } else if (suggestion.store) {
      state.messages.push({
        role: "bot",
        text: `Recomendo entrar na loja ${suggestion.store.name}. ${suggestion.store.description || ""}`,
      });
    } else {
      state.messages.push({
        role: "bot",
        text: "Posso ajudar com celulares, computadores, ofertas, servicos digitais, composicoes musicais, trabalhos academicos de apoio ou links de afiliado.",
      });
    }
    render("chat");
  }

  function recommend(term, budget) {
    const suggestion = findBest(`${term || ""} ${budget || ""}`);
    if (suggestion.product) {
      return `<article class="orbit-card"><strong>${escapeHtml(suggestion.product.name)}</strong><p>${escapeHtml(suggestion.product.description || "Produto selecionado pela loja.")}</p><button class="orbit-btn primary" data-buy-generated>Ver na loja</button></article>`;
    }
    if (suggestion.store) {
      return `<article class="orbit-card"><strong>${escapeHtml(suggestion.store.name)}</strong><p>${escapeHtml(suggestion.store.description || "Loja recomendada.")}</p></article>`;
    }
    return `<article class="orbit-card"><strong>Recomendacao geral</strong><p>Entre no shopping e use a busca interna para encontrar ofertas selecionadas.</p></article>`;
  }

  function findBest(text) {
    const normalized = normalize(text);
    const product = getProducts().find((item) => {
      const hay = normalize(`${item.name || ""} ${item.description || ""} ${item.category || ""} ${item.storeId || ""}`);
      return normalized.split(" ").some((part) => part.length > 2 && hay.includes(part));
    });
    const store = getStores().find((item) => {
      const hay = normalize(`${item.name || ""} ${item.description || ""} ${(item.subcategories || []).join(" ")}`);
      return normalized.split(" ").some((part) => part.length > 2 && hay.includes(part));
    });
    return { product, store };
  }

  function normalize(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function openWhatsApp(text) {
    window.open(settings.whatsapp + encodeURIComponent(text), "_blank", "noopener,noreferrer");
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => alert("Comando copiado."));
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
    alert("Comando copiado.");
  }

  function escapeHtml(value) {
    return String(value ? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();

