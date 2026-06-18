(function () {
  "use strict";

  const route = new URLSearchParams(location.search).get("route") || location.pathname;
  const isAdmin = route.startsWith("/admin/");
  const password = "impacto360-admin";
  const authKey = "impacto360:sala-agentes:auth";

  if (isAdmin) {
    renderPrivateRoom();
    return;
  }

  repairPublicStore();

  function repairPublicStore() {
    let timer;

    const text = value => String(value == null ? "" : value).trim();
    const key = value => text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
    const cleanPath = value => text(value)
      .replace(/\\/g, "/")
      .replace(/^(https?:\/\/[^/]+)\/public\/produtos-impacto360\//i, "$1/produtos-impacto360/")
      .replace(/^\/public\/produtos-impacto360\//i, "/produtos-impacto360/")
      .replace(/^(?:\.\/)?public\/produtos-impacto360\//i, "produtos-impacto360/");
    const validImage = value => {
      const source = cleanPath(value);
      return Boolean(source && !/placeholder|sem[-_ ]?(?:foto|imagem)|COLOCAR_|URL_|LINK_/i.test(source));
    };
    const imageOf = product => [
      product?.fotoPrincipal,
      product?.imagemPrincipal,
      product?.image,
      product?.imagem,
      ...(Array.isArray(product?.galeria) ? product.galeria : []),
      ...(Array.isArray(product?.fotosExtras) ? product.fotosExtras : [])
    ].map(cleanPath).find(validImage) || "";

    function fixText(value) {
      const original = String(value == null ? "" : value);
      if (!/[\u00c3\u00c2\u00e2\ufffd]/.test(original) || /^https?:\/\//i.test(original)) return original;
      let result = original;
      for (let index = 0; index < 2; index += 1) {
        const chars = Array.from(result);
        if (!chars.every(char => char.charCodeAt(0) <= 255)) break;
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(chars.map(char => char.charCodeAt(0))));
        if (!decoded || decoded === result || decoded.includes("\ufffd")) break;
        result = decoded;
      }
      return result.replace(/\u00c2/g, "");
    }

    function products() {
      try {
        return typeof window.__impacto360GetProducts === "function" ? window.__impacto360GetProducts() || [] : [];
      } catch {
        return [];
      }
    }

    function normalizeProduct(product) {
      if (!product || typeof product !== "object") return;
      Object.keys(product).forEach(field => {
        const value = product[field];
        if (typeof value === "string") {
          product[field] = /link|url|href|src|image|imagem|foto|video|thumbnail/i.test(field) ? cleanPath(value) : fixText(value);
        } else if (Array.isArray(value)) {
          product[field] = value.map(item => typeof item === "string"
            ? (/image|imagem|foto|galeria|thumbnail/i.test(field) ? cleanPath(item) : fixText(item))
            : item);
        }
      });
      const image = imageOf(product);
      if (!image) return;
      product.fotoPrincipal = image;
      product.imagemPrincipal = image;
      product.image = image;
      product.statusImagem = "imagem_ok";
      product.statusMidia = "imagem ok";
    }

    function fixVisibleText() {
      if (!document.body) return;
      ["alt", "title", "aria-label", "placeholder"].forEach(attribute => {
        document.querySelectorAll(`[${attribute}]`).forEach(element => {
          const before = element.getAttribute(attribute);
          const after = fixText(before);
          if (before !== after) element.setAttribute(attribute, after);
        });
      });
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement || /SCRIPT|STYLE/.test(node.parentElement.tagName)) continue;
        if (/[\u00c3\u00c2\u00e2\ufffd]/.test(node.nodeValue || "")) nodes.push(node);
      }
      nodes.forEach(node => {
        node.nodeValue = fixText(node.nodeValue);
      });
    }

    function repairCards() {
      const catalog = products();
      const map = new Map(catalog.map(product => [key(product.name || product.nome || product.title), product]));
      document.querySelectorAll(".product-card").forEach(card => {
        const image = card.querySelector(".product-media img");
        const product = map.get(key(card.querySelector("h3")?.textContent));
        const source = product ? imageOf(product) : cleanPath(image?.getAttribute("src"));
        if (!image || !source) return;
        image.onerror = function () {
          const corrected = cleanPath(this.getAttribute("src"));
          if (corrected && corrected !== this.getAttribute("src")) this.src = corrected;
        };
        image.removeAttribute("srcset");
        image.src = source;
        image.style.objectFit = "contain";
        image.style.opacity = "1";
        const status = card.querySelector(".media-status");
        if (status) {
          status.classList.remove("review");
          status.textContent = "Foto preservada";
        }
      });
    }

    function run(refresh) {
      products().forEach(normalizeProduct);
      if (refresh && typeof window.__impacto360RefreshShopping === "function") {
        try { window.__impacto360RefreshShopping(); } catch {}
      }
      repairCards();
      fixVisibleText();
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => run(false), 90);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => run(true), { once: true });
    else run(true);
    setTimeout(() => run(true), 800);
    setTimeout(() => run(false), 1800);
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  }

  function renderPrivateRoom() {
    document.body.className = "";
    document.body.innerHTML = '<main class="agent-admin"><section class="agent-shell" data-agent-root></section></main>';
    addRoomStyles();
    if (sessionStorage.getItem(authKey) === "ok") showRoom();
    else showLogin();
  }

  function showLogin(message) {
    const root = document.querySelector("[data-agent-root]");
    root.innerHTML = `
      <section class="login-card">
        <span class="brand-360">360</span>
        <h1>Sala Privada dos Agentes IA</h1>
        <p>Acesso administrativo para estrategia, catalogo, fotos, links, campanhas, atendimento e auditoria.</p>
        <form data-agent-login>
          <input type="password" name="password" placeholder="Senha administrativa" autocomplete="current-password">
          <button type="submit">Entrar na sala privada</button>
        </form>
        <small>${escapeHtml(message || "Acesso restrito. A senha nao aparece na loja publica.")}</small>
      </section>`;
    root.querySelector("[data-agent-login]").addEventListener("submit", event => {
      event.preventDefault();
      if (new FormData(event.currentTarget).get("password") !== password) return showLogin("Senha incorreta.");
      sessionStorage.setItem(authKey, "ok");
      showRoom();
    });
  }

  function showRoom() {
    const catalog = typeof window.__impacto360GetProducts === "function" ? window.__impacto360GetProducts() || [] : [];
    const withPhoto = catalog.filter(product => {
      const value = product.fotoPrincipal || product.imagemPrincipal || product.image || "";
      return value && !/placeholder|COLOCAR_/i.test(value);
    }).length;
    const agents = [
      ["CEO", "ChatGPT CEO", "Estrategia, prioridades e aprovacao", "Coordena a equipe, prepara recomendacoes e organiza o CRM com privacidade.", "ceo", "Abrir console CEO"],
      ["CAT", "Orbit Catalogo", "Produtos, categorias e duplicados", "Organiza produtos nas lojas corretas e sinaliza cadastros incompletos.", "", "Catalogo monitorado"],
      ["MID", "Agente de Midias", "Fotos, videos e acessibilidade", "Corrige caminhos, preserva fotos reais e impede imagens quebradas.", "media", "Abrir editor de midias"],
      ["LINK", "Agente de Links e Ofertas", "Afiliados, CTA e rastreio", "Separa links de pesquisa dos links comissionados e confere chamadas.", "", "Links monitorados"],
      ["SOC", "Agente Social 360", "Campanhas e postagens", "Prepara legendas, hashtags e campanhas para aprovacao administrativa.", "", "Campanhas organizadas"],
      ["CRM", "Agente de Atendimento", "CRM, WhatsApp e LGPD", "Organiza interesses autorizados sem expor clientes na loja publica.", "ceo", "Abrir atendimento"],
      ["QA", "Agente Auditor", "Qualidade e publicacao", "Revisa textos, fotos, links e status antes de liberar atualizacoes.", "", "Auditoria ativa"]
    ];
    const root = document.querySelector("[data-agent-root]");
    root.innerHTML = `
      <header class="room-head">
        <div><span>AMBIENTE ADMINISTRATIVO</span><h1>Sala Privada dos Agentes IA</h1><p>Sete agentes especializados, uma unica central de controle.</p></div>
        <div class="room-actions"><a href="/">Ver loja</a><button data-agent-logout>Sair</button></div>
      </header>
      <section class="room-summary">
        <span><b>${agents.length}</b> agentes ativos</span>
        <span><b>${catalog.length}</b> produtos monitorados</span>
        <span><b>${withPhoto}</b> produtos com foto</span>
      </section>
      <section class="agent-grid">
        ${agents.map(agent => `
          <article class="agent-card">
            <div class="agent-top"><span class="agent-avatar">${agent[0]}</span><i>Ativo</i></div>
            <h2>${agent[1]}</h2><strong>${agent[2]}</strong><p>${agent[3]}</p>
            ${agent[4] ? `<button data-agent-tool="${agent[4]}">${agent[5]}</button>` : `<small>${agent[5]}</small>`}
          </article>`).join("")}
      </section>
      <section class="workflow">
        <h2>Fluxo de trabalho</h2>
        <p>Catalogo organiza -> Midias e Links corrigem -> Social e Atendimento preparam -> ChatGPT CEO prioriza -> Auditor libera.</p>
      </section>`;
    root.querySelector("[data-agent-logout]").addEventListener("click", () => {
      sessionStorage.removeItem(authKey);
      showLogin("Sessao encerrada.");
    });
    root.querySelectorAll("[data-agent-tool]").forEach(button => button.addEventListener("click", () => openTool(button.dataset.agentTool)));
    loadModule("impacto360-revisao-fotos-ceo.js");
    loadModule("impacto360-chatgpt-ceo.js");
  }

  function loadModule(file) {
    if (document.querySelector(`script[src*="${file}"]`)) return;
    const script = document.createElement("script");
    script.src = `integracoes/${file}`;
    script.defer = true;
    document.body.appendChild(script);
  }

  function openTool(tool) {
    const selector = tool === "media" ? "#impacto360AdEditorLauncher" : ".ceo360-fab";
    const file = tool === "media" ? "impacto360-revisao-fotos-ceo.js" : "impacto360-chatgpt-ceo.js";
    loadModule(file);
    setTimeout(() => {
      const launcher = document.querySelector(selector);
      if (launcher) launcher.click();
      else alert("Modulo carregando. Tente novamente em um instante.");
    }, 180);
  }

  function addRoomStyles() {
    const style = document.createElement("style");
    style.textContent = `
      *{box-sizing:border-box}.agent-admin{min-height:100vh;padding:20px;background:#f3f8fe;color:#08192f;font-family:Inter,Arial,sans-serif}.agent-shell{width:min(1180px,100%);margin:auto}.login-card{max-width:560px;margin:9vh auto;padding:28px;border:1px solid #dce8f7;border-radius:18px;background:#fff;box-shadow:0 22px 70px rgba(8,25,47,.13)}.brand-360{display:grid;place-items:center;width:58px;height:58px;border-radius:15px;background:linear-gradient(135deg,#1d5cff,#27d7e8);color:#fff;font-weight:950}.login-card input{width:100%;min-height:48px;margin:14px 0 8px;padding:10px 12px;border:1px solid #cbdced;border-radius:10px}.login-card button,.agent-card button,.room-actions a,.room-actions button{min-height:44px;padding:0 15px;border:0;border-radius:10px;background:#0a2852;color:#fff;font-weight:900;text-decoration:none;cursor:pointer}.room-head{display:flex;align-items:end;justify-content:space-between;gap:18px;padding:24px;border-radius:18px;background:linear-gradient(135deg,#071a36,#0d3970);color:#fff}.room-head span{font-size:11px;font-weight:950;letter-spacing:.14em;color:#72e0ee}.room-head h1{margin:5px 0}.room-head p{margin:0;color:#d9e8fb}.room-actions{display:flex;gap:8px}.room-actions a,.room-actions button{display:inline-flex;align-items:center;background:rgba(255,255,255,.12)}.room-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}.room-summary span{padding:15px;border:1px solid #dce8f7;border-radius:13px;background:#fff}.room-summary b{display:block;font-size:24px}.agent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.agent-card{display:flex;flex-direction:column;min-height:300px;padding:18px;border:1px solid #dce8f7;border-radius:15px;background:#fff;box-shadow:0 16px 44px rgba(8,25,47,.07)}.agent-top{display:flex;justify-content:space-between;align-items:center}.agent-avatar{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:linear-gradient(135deg,#1d5cff,#27d7e8);color:#fff;font-weight:950}.agent-top i{padding:6px 9px;border-radius:999px;background:#dff8ed;color:#0c6b46;font-size:11px;font-style:normal;font-weight:950}.agent-card h2{margin:16px 0 4px}.agent-card>strong{color:#1d5cff}.agent-card p{flex:1;color:#607083;line-height:1.5}.agent-card small{padding:12px;border-radius:9px;background:#eef5ff;font-weight:900}.workflow{margin-top:14px;padding:18px;border-radius:14px;background:#fff;border:1px solid #dce8f7}.workflow h2{margin-top:0}@media(max-width:820px){.agent-admin{padding:10px}.room-head{align-items:start;flex-direction:column}.room-summary,.agent-grid{grid-template-columns:1fr}.room-actions{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
})();
