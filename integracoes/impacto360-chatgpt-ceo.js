(function () {
  "use strict";

  const STORE_NAME = "Shopping Impacto360";
  const STORAGE_KEY = "impacto360:chatgpt-ceo:clientes";
  const ACTIVE_KEY = "impacto360:chatgpt-ceo:cliente-ativo";
  const LOG_KEY = "impacto360:chatgpt-ceo:logs";
  const PANEL_ID = "impacto360-chatgpt-ceo-panel";
  const CONSENT_TEXT = "Autorizo o Shopping Impacto360 a registrar meus dados de contato e interesses para atendimento, recomendações de produtos e acompanhamento comercial. Posso solicitar alteração ou remoção dos meus dados.";
  const STATUS = ["novo", "interessado", "aguardando resposta", "cliente em negociação", "comprador", "sem interesse", "não contatar", "revisar"];
  const LEVELS = ["baixo", "médio", "alto", "muito alto"];
  const EMPTY_CLIENT = {
    clienteId: "",
    nome: "",
    telefone: "",
    whatsapp: "",
    email: "",
    cidade: "",
    estado: "",
    origemContato: "Loja virtual",
    primeiroContatoEm: "",
    ultimoContatoEm: "",
    produtosVisualizados: [],
    produtosPesquisados: [],
    categoriasInteresse: [],
    linksClicados: [],
    perguntasFeitas: [],
    intencaoCompra: "",
    nivelInteresse: "baixo",
    observacoesInternas: "",
    autorizacaoContato: false,
    statusCliente: "novo",
    naoContatar: false,
    historicoAtendimento: []
  };

  if (window.__impacto360ChatGptCeoLoaded) return;
  window.__impacto360ChatGptCeoLoaded = true;

  injectStyle();
  renderFloatingButton();
  observeCustomerActions();
  wrapKnownStoreFunctions();

  function renderFloatingButton() {
    const button = document.createElement("button");
    button.className = "ceo360-fab";
    button.type = "button";
    button.setAttribute("aria-label", "Abrir ChatGPT CEO e CRM de clientes");
    button.innerHTML = "<strong>CEO</strong><span>CRM</span>";
    button.addEventListener("click", togglePanel);
    document.body.appendChild(button);
  }

  function togglePanel() {
    const current = document.getElementById(PANEL_ID);
    if (current) {
      current.remove();
      return;
    }
    renderPanel("crm");
  }

  function renderPanel(tab) {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
    const activeClient = getActiveClient();
    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.className = "ceo360-panel";
    panel.innerHTML = `
      <header class="ceo360-head">
        <div>
          <span>ChatGPT CEO</span>
          <h2>CRM do ${escapeHtml(STORE_NAME)}</h2>
        </div>
        <button type="button" data-ceo-close aria-label="Fechar">×</button>
      </header>
      <nav class="ceo360-tabs" aria-label="Navegação do ChatGPT CEO">
        ${tabButton("crm", "Clientes", tab)}
        ${tabButton("assistente", "Atendimento", tab)}
        ${tabButton("recomendacoes", "Recomendações", tab)}
        ${tabButton("privacidade", "Privacidade", tab)}
      </nav>
      <section class="ceo360-body">
        ${tab === "assistente" ? renderAssistant(activeClient) : ""}
        ${tab === "crm" ? renderCrm(activeClient) : ""}
        ${tab === "recomendacoes" ? renderRecommendations(activeClient) : ""}
        ${tab === "privacidade" ? renderPrivacy() : ""}
      </section>
    `;
    document.body.appendChild(panel);
    bindPanelEvents(panel);
  }

  function tabButton(name, label, active) {
    return `<button type="button" class="${active === name ? "active" : ""}" data-ceo-tab="${name}">${label}</button>`;
  }

  function renderCrm(activeClient) {
    const clients = readClients();
    const client = activeClient || createClientDraft();
    return `
      <div class="ceo360-alert">Modo local provisório: os dados de clientes ficam apenas neste navegador administrativo até integração com backend seguro.</div>
      ${renderInterestWarning(client)}
      <form class="ceo360-form" data-ceo-client-form>
        <input type="hidden" name="clienteId" value="${escapeAttr(client.clienteId)}" />
        <label>Nome<input name="nome" value="${escapeAttr(client.nome)}" placeholder="Nome do cliente" /></label>
        <label>Telefone<input name="telefone" value="${escapeAttr(client.telefone)}" placeholder="Telefone" /></label>
        <label>WhatsApp<input name="whatsapp" value="${escapeAttr(client.whatsapp)}" placeholder="WhatsApp" /></label>
        <label>E-mail<input name="email" value="${escapeAttr(client.email)}" placeholder="E-mail" /></label>
        <label>Cidade<input name="cidade" value="${escapeAttr(client.cidade)}" placeholder="Cidade" /></label>
        <label>Estado<input name="estado" value="${escapeAttr(client.estado)}" placeholder="Estado" /></label>
        <label>Origem do contato<input name="origemContato" value="${escapeAttr(client.origemContato)}" placeholder="Ex.: WhatsApp, loja, Instagram" /></label>
        <label>Intenção de compra<textarea name="intencaoCompra" placeholder="O que o cliente procura?">${escapeHtml(client.intencaoCompra)}</textarea></label>
        <label>Observações internas<textarea name="observacoesInternas" placeholder="Anotações privadas de atendimento">${escapeHtml(client.observacoesInternas)}</textarea></label>
        <label>Status<select name="statusCliente">${options(STATUS, client.statusCliente)}</select></label>
        <label>Nível de interesse<select name="nivelInteresse">${options(LEVELS, client.nivelInteresse)}</select></label>
        <label class="ceo360-check"><input type="checkbox" name="autorizacaoContato" ${client.autorizacaoContato ? "checked" : ""} />${CONSENT_TEXT}</label>
        <label class="ceo360-check"><input type="checkbox" name="naoContatar" ${client.naoContatar ? "checked" : ""} /> Marcar cliente como não contatar</label>
        <div class="ceo360-actions">
          <button type="submit">Salvar cliente</button>
          <button type="button" data-ceo-new>Novo cliente</button>
          <button type="button" data-ceo-anonymize>Anonimizar</button>
          <button type="button" data-ceo-deactivate>Desativar</button>
          <button type="button" data-ceo-delete>Apagar</button>
        </div>
      </form>
      <div class="ceo360-grid two">
        <article>
          <h3>Clientes cadastrados</h3>
          <div class="ceo360-list">${clients.length ? clients.map(renderClientRow).join("") : "<p>Nenhum cliente salvo ainda.</p>"}</div>
        </article>
        <article>
          <h3>Interesses registrados</h3>
          ${renderClientDetails(client)}
          <div class="ceo360-actions compact"><button type="button" data-ceo-export-json>Exportar JSON</button><button type="button" data-ceo-export-csv>Exportar CSV</button></div>
        </article>
      </div>
    `;
  }

  function renderAssistant(client) {
    return `
      <div class="ceo360-alert">Perguntas ficam no histórico do cliente ativo somente se houver autorização de contato.</div>
      <form class="ceo360-form" data-ceo-question-form>
        <label>Pergunta do cliente<textarea name="pergunta" placeholder="Ex.: Quero um celular bom e barato"></textarea></label>
        <button type="submit">Registrar pergunta e sugerir</button>
      </form>
      <div class="ceo360-answer">${client ? "Cliente ativo: " + escapeHtml(client.nome || client.clienteId) : "Nenhum cliente ativo. Cadastre ou selecione um cliente."}</div>
    `;
  }

  function renderRecommendations(client) {
    const products = recommendProducts(client).slice(0, 10);
    return `
      ${renderInterestWarning(client)}
      <p class="ceo360-muted">As recomendações usam interesses, buscas, categorias e cliques salvos no CRM local.</p>
      <div class="ceo360-products">${products.length ? products.map(renderRecommendedProduct).join("") : "<p>Nenhum produto encontrado no catálogo carregado.</p>"}</div>
    `;
  }

  function renderPrivacy() {
    return `
      <article class="ceo360-privacy">
        <h3>Privacidade e segurança</h3>
        <p>Coletamos dados de contato somente quando o cliente informa voluntariamente e autoriza o registro. Não colete documentos, dados sensíveis, religião, política, saúde, biometria ou informações íntimas.</p>
        <p>Os dados salvos localmente ficam apenas neste navegador administrativo. Para operação profissional, use backend seguro, autenticação e banco protegido.</p>
        <p>O cliente pode pedir correção, remoção, anonimização ou retirada da autorização de contato.</p>
      </article>
    `;
  }

  function bindPanelEvents(panel) {
    panel.querySelector("[data-ceo-close]")?.addEventListener("click", () => panel.remove());
    panel.querySelectorAll("[data-ceo-tab]").forEach(btn => btn.addEventListener("click", () => renderPanel(btn.dataset.ceoTab)));
    panel.querySelector("[data-ceo-client-form]")?.addEventListener("submit", saveClientFromForm);
    panel.querySelector("[data-ceo-new]")?.addEventListener("click", () => { localStorage.removeItem(ACTIVE_KEY); renderPanel("crm"); });
    panel.querySelectorAll("[data-ceo-select]").forEach(btn => btn.addEventListener("click", () => { localStorage.setItem(ACTIVE_KEY, btn.dataset.ceoSelect); renderPanel("crm"); }));
    panel.querySelector("[data-ceo-anonymize]")?.addEventListener("click", anonymizeActiveClient);
    panel.querySelector("[data-ceo-deactivate]")?.addEventListener("click", deactivateActiveClient);
    panel.querySelector("[data-ceo-delete]")?.addEventListener("click", deleteActiveClient);
    panel.querySelector("[data-ceo-export-json]")?.addEventListener("click", () => downloadFile("clientes-impacto360.json", JSON.stringify(readClients(), null, 2), "application/json"));
    panel.querySelector("[data-ceo-export-csv]")?.addEventListener("click", exportCsv);
    panel.querySelector("[data-ceo-question-form]")?.addEventListener("submit", saveQuestion);
  }

  function saveClientFromForm(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const hasContact = [data.telefone, data.whatsapp, data.email].some(Boolean);
    const authorized = Boolean(data.autorizacaoContato);
    if (hasContact && !authorized) {
      alert("Para salvar telefone, WhatsApp ou e-mail, marque a autorização de contato.");
      return;
    }
    const clients = readClients();
    const now = new Date().toISOString();
    const previous = clients.find(item => item.clienteId === data.clienteId) || createClientDraft();
    const client = {
      ...EMPTY_CLIENT,
      ...previous,
      ...data,
      clienteId: data.clienteId || previous.clienteId || makeId(),
      autorizacaoContato: authorized,
      naoContatar: Boolean(data.naoContatar),
      primeiroContatoEm: previous.primeiroContatoEm || now,
      ultimoContatoEm: now,
      historicoAtendimento: [...(previous.historicoAtendimento || []), { tipo: "atualizacao", data: now, texto: "Cadastro atualizado no CRM." }]
    };
    saveClients(upsert(clients, client));
    localStorage.setItem(ACTIVE_KEY, client.clienteId);
    log("Cliente salvo", client.clienteId);
    renderPanel("crm");
  }

  function saveQuestion(event) {
    event.preventDefault();
    const question = new FormData(event.currentTarget).get("pergunta");
    trackEvent("perguntasFeitas", question, "pergunta");
    const suggestions = recommendProducts(getActiveClient()).slice(0, 3).map(p => p.name || p.nome).filter(Boolean);
    const answer = event.currentTarget.nextElementSibling;
    answer.textContent = suggestions.length ? "Sugestões: " + suggestions.join(", ") : "Pergunta registrada. Ainda não há produtos suficientes para recomendar.";
  }

  function getActiveClient() {
    const id = localStorage.getItem(ACTIVE_KEY);
    return readClients().find(item => item.clienteId === id) || null;
  }

  function createClientDraft() {
    return { ...EMPTY_CLIENT, clienteId: makeId(), primeiroContatoEm: new Date().toISOString(), ultimoContatoEm: new Date().toISOString() };
  }

  function readClients() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveClients(clients) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }

  function upsert(list, client) {
    const index = list.findIndex(item => item.clienteId === client.clienteId);
    if (index >= 0) return list.map(item => item.clienteId === client.clienteId ? client : item);
    return [...list, client];
  }

  function anonymizeActiveClient() {
    const client = getActiveClient();
    if (!client) return;
    saveClients(readClients().map(item => item.clienteId === client.clienteId ? {
      ...item,
      nome: "Cliente anonimizado",
      telefone: "",
      whatsapp: "",
      email: "",
      cidade: "",
      estado: "",
      observacoesInternas: "Dados pessoais anonimizados por solicitação.",
      autorizacaoContato: false,
      statusCliente: "não contatar",
      naoContatar: true
    } : item));
    renderPanel("crm");
  }

  function deactivateActiveClient() {
    const client = getActiveClient();
    if (!client) return;
    saveClients(readClients().map(item => item.clienteId === client.clienteId ? { ...item, statusCliente: "não contatar", naoContatar: true, autorizacaoContato: false } : item));
    renderPanel("crm");
  }

  function deleteActiveClient() {
    const client = getActiveClient();
    if (!client || !confirm("Apagar este cliente deste navegador?")) return;
    saveClients(readClients().filter(item => item.clienteId !== client.clienteId));
    localStorage.removeItem(ACTIVE_KEY);
    renderPanel("crm");
  }

  function trackEvent(field, value, kind) {
    const clean = String(value || "").trim();
    if (!clean) return;
    const client = getActiveClient();
    if (!client || !client.autorizacaoContato || client.naoContatar) return;
    const updated = {
      ...client,
      [field]: unique([...(client[field] || []), clean]).slice(-50),
      ultimoContatoEm: new Date().toISOString(),
      historicoAtendimento: [...(client.historicoAtendimento || []), { tipo: kind || field, data: new Date().toISOString(), texto: clean }].slice(-100)
    };
    updated.nivelInteresse = calculateInterest(updated);
    if (updated.nivelInteresse === "alto" || updated.nivelInteresse === "muito alto") updated.statusCliente = updated.statusCliente === "novo" ? "interessado" : updated.statusCliente;
    saveClients(upsert(readClients(), updated));
  }

  function calculateInterest(client) {
    const score = (client.produtosVisualizados || []).length + (client.linksClicados || []).length * 2 + (client.perguntasFeitas || []).length * 2 + (client.produtosPesquisados || []).length;
    if (score >= 12) return "muito alto";
    if (score >= 7) return "alto";
    if (score >= 3) return "médio";
    return "baixo";
  }

  function observeCustomerActions() {
    document.addEventListener("click", event => {
      const link = event.target.closest("a[href], button");
      if (!link) return;
      const href = link.getAttribute("href") || link.dataset.link || "";
      const label = link.textContent || href;
      if (href) trackEvent("linksClicados", href, "clique");
      if (/comprar|oferta|mercado livre|amazon|shopee/i.test(label)) trackEvent("produtosVisualizados", label.trim().slice(0, 120), "produto");
    }, true);
    document.addEventListener("input", event => {
      const input = event.target;
      if (!input || !/search|busca|buscar/i.test(input.type + " " + input.name + " " + input.placeholder)) return;
      if (String(input.value || "").trim().length >= 3) trackEvent("produtosPesquisados", input.value, "busca");
    }, true);
  }

  function wrapKnownStoreFunctions() {
    setTimeout(() => {
      wrapFunction("quickSearch", value => trackEvent("produtosPesquisados", value, "busca"));
      wrapFunction("buyProduct", product => {
        if (product) {
          trackEvent("produtosVisualizados", product.name || product.nome || product.id, "produto");
          trackEvent("linksClicados", product.affiliateLink || product.linkPlataforma || product.linkOriginal, "clique");
          if (product.category || product.categoria) trackEvent("categoriasInteresse", product.category || product.categoria, "categoria");
        }
      });
    }, 600);
  }

  function wrapFunction(name, before) {
    if (typeof window[name] !== "function" || window[name].__ceoWrapped) return;
    const original = window[name];
    window[name] = function (...args) {
      try { before(...args); } catch {}
      return original.apply(this, args);
    };
    window[name].__ceoWrapped = true;
  }

  function recommendProducts(client) {
    const products = getProducts();
    if (!client) return products.slice(0, 10);
    const terms = [client.intencaoCompra, ...(client.produtosPesquisados || []), ...(client.categoriasInteresse || []), ...(client.perguntasFeitas || [])].join(" ").toLowerCase();
    return products.map(product => {
      const haystack = [product.name, product.nome, product.category, product.categoria, product.description, product.descricao].join(" ").toLowerCase();
      const score = terms.split(/\s+/).filter(word => word.length > 2 && haystack.includes(word)).length;
      return { product, score };
    }).sort((a, b) => b.score - a.score).map(item => item.product);
  }

  function getProducts() {
    if (typeof window.__impacto360GetProducts === "function") return window.__impacto360GetProducts() || [];
    if (Array.isArray(window.products)) return window.products;
    if (Array.isArray(window.PRODUCTS)) return window.PRODUCTS;
    return [];
  }

  function exportCsv() {
    const header = ["clienteId", "nome", "telefone", "whatsapp", "email", "cidade", "estado", "statusCliente", "nivelInteresse", "autorizacaoContato", "naoContatar", "categoriasInteresse", "produtosPesquisados", "linksClicados"];
    const lines = [header.join(",")].concat(readClients().map(client => header.map(key => csvCell(Array.isArray(client[key]) ? client[key].join(" | ") : client[key])).join(",")));
    downloadFile("clientes-impacto360.csv", lines.join("\n"), "text/csv;charset=utf-8");
  }

  function renderClientRow(client) {
    return `<button type="button" class="ceo360-row" data-ceo-select="${escapeAttr(client.clienteId)}"><b>${escapeHtml(client.nome || client.clienteId)}</b><span>${escapeHtml(client.statusCliente)} · ${escapeHtml(client.nivelInteresse)}</span></button>`;
  }

  function renderClientDetails(client) {
    if (!client) return "<p>Selecione ou cadastre um cliente.</p>";
    return `<dl class="ceo360-details">
      <dt>Pesquisas</dt><dd>${list(client.produtosPesquisados)}</dd>
      <dt>Categorias</dt><dd>${list(client.categoriasInteresse)}</dd>
      <dt>Links clicados</dt><dd>${list(client.linksClicados)}</dd>
      <dt>Perguntas</dt><dd>${list(client.perguntasFeitas)}</dd>
      <dt>Visualizados</dt><dd>${list(client.produtosVisualizados)}</dd>
    </dl>`;
  }

  function renderInterestWarning(client) {
    if (!client || !["alto", "muito alto"].includes(client.nivelInteresse)) return "";
    return `<div class="ceo360-hot">Atenção: este cliente demonstrou interesse ${escapeHtml(client.nivelInteresse)}. Priorize atendimento consultivo e respeite a autorização de contato.</div>`;
  }

  function renderRecommendedProduct(product) {
    const name = product.name || product.nome || "Produto Impacto360";
    const category = product.category || product.categoria || "Catálogo";
    const link = product.affiliateLink || product.linkPlataforma || product.linkOriginal || "#";
    return `<article class="ceo360-product"><b>${escapeHtml(name)}</b><span>${escapeHtml(category)}</span><a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer">Ver oferta</a></article>`;
  }

  function options(values, selected) {
    return values.map(value => `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
  }

  function list(values) {
    return (values || []).length ? values.map(escapeHtml).join("<br>") : "-";
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function unique(values) {
    return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))];
  }

  function makeId() {
    return "cliente-" + Date.now() + "-" + Math.random().toString(16).slice(2, 7);
  }

  function csvCell(value) {
    return '"' + String(value ?? "").replace(/"/g, '""') + '"';
  }

  function log(message, detail) {
    const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    logs.push({ message, detail, data: new Date().toISOString() });
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-100)));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function injectStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .ceo360-fab{position:fixed;right:18px;bottom:92px;z-index:9998;width:72px;height:72px;border:0;border-radius:24px;background:linear-gradient(135deg,#06244a,#1d7cff);color:#fff;box-shadow:0 18px 42px rgba(6,36,74,.28);cursor:pointer;display:grid;place-items:center;font:800 12px Inter,system-ui,sans-serif}.ceo360-fab strong{font-size:18px}.ceo360-fab span{font-size:11px;opacity:.9}.ceo360-panel{position:fixed;right:18px;bottom:176px;z-index:9999;width:min(760px,calc(100vw - 24px));max-height:min(82vh,760px);overflow:auto;background:#ffffff;color:#0b1d33;border:1px solid rgba(29,124,255,.18);border-radius:8px;box-shadow:0 26px 80px rgba(2,20,45,.26);font-family:Inter,system-ui,sans-serif}.ceo360-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:16px 18px;background:linear-gradient(135deg,#f6fbff,#eaf5ff);border-bottom:1px solid #d9e8fb}.ceo360-head span{font-size:12px;font-weight:900;color:#1d7cff;text-transform:uppercase}.ceo360-head h2{font-size:19px;margin:2px 0 0}.ceo360-head button{border:0;background:#fff;border-radius:8px;width:38px;height:38px;font-size:24px;cursor:pointer}.ceo360-tabs{display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #eef3fa;overflow:auto}.ceo360-tabs button{border:1px solid #dce8f7;background:#fff;color:#17314f;border-radius:999px;min-height:38px;padding:0 12px;font-weight:900;cursor:pointer}.ceo360-tabs button.active{background:#1d7cff;color:#fff}.ceo360-body{padding:14px}.ceo360-alert,.ceo360-hot{border-radius:8px;padding:11px 12px;margin-bottom:12px;font-size:13px;line-height:1.45}.ceo360-alert{background:#eef6ff;color:#17314f}.ceo360-hot{background:#fff3cf;color:#6f4700;font-weight:900}.ceo360-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ceo360-form label{display:grid;gap:5px;font-size:12px;font-weight:900;color:#496074}.ceo360-form input,.ceo360-form textarea,.ceo360-form select{border:1px solid #dce8f7;border-radius:8px;min-height:42px;padding:9px 10px;font:inherit;color:#0b1d33}.ceo360-form textarea{min-height:86px;resize:vertical}.ceo360-check{grid-column:1/-1;display:flex!important;grid-template-columns:auto 1fr!important;align-items:flex-start;font-weight:700!important;line-height:1.4}.ceo360-check input{min-height:auto;margin-top:2px}.ceo360-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}.ceo360-actions button,.ceo360-product a{border:0;border-radius:8px;background:#1d7cff;color:#fff;min-height:40px;padding:0 12px;font-weight:900;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.ceo360-actions button:nth-child(n+3){background:#eef5ff;color:#17314f}.ceo360-grid.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ceo360-grid article,.ceo360-privacy,.ceo360-answer{border:1px solid #eef3fa;background:#fbfdff;border-radius:8px;padding:12px}.ceo360-list{display:grid;gap:8px;max-height:260px;overflow:auto}.ceo360-row{border:1px solid #dce8f7;background:#fff;border-radius:8px;padding:10px;text-align:left;cursor:pointer}.ceo360-row span{display:block;color:#607083;font-size:12px;margin-top:3px}.ceo360-details{font-size:13px}.ceo360-details dt{font-weight:900;margin-top:8px}.ceo360-details dd{margin:2px 0 8px;color:#496074}.ceo360-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ceo360-product{border:1px solid #dce8f7;background:#fff;border-radius:8px;padding:12px;display:grid;gap:8px}.ceo360-product span,.ceo360-muted{color:#607083;font-size:13px}.compact button{min-height:34px}@media(max-width:760px){.ceo360-fab{right:12px;bottom:84px}.ceo360-panel{left:10px;right:10px;bottom:166px;width:auto}.ceo360-form,.ceo360-grid.two,.ceo360-products{grid-template-columns:1fr}.ceo360-tabs button{white-space:nowrap}}
    `;
    document.head.appendChild(style);
  }
})();