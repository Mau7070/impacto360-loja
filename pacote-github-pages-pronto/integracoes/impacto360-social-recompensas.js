(function () {
  "use strict";

  const VERSION = "20260715-1";
  const ADMIN_AUTH_KEY = "impacto360:sala-agentes:auth:v2";
  const ROBOT_KEY = "ai360:socialRobot:v1";
  const WALLET_KEY = "ai360:rewardWallet:v1";
  const HOLDER_GROUP_KEY = "ai360:tokenHolders:v1";
  const HOLDER_GROUP_ID = "impacto360";
  const HOLDER_GROUP_NAME = "impacto360";
  const DEFAULT_ENDPOINT = "http://localhost:3000/api/social/publish";
  const HOLDER_CONSENT_TEXT = "Autorizo a Impacto360 Afiliado a registrar meu nome, Zap/WhatsApp e saldo de tokens para contato sobre recompensas. Posso pedir correcao ou remocao depois.";
  const CHANNELS = ["whatsapp", "instagram", "facebook", "tiktok", "youtubeShorts"];
  const CHANNEL_LABELS = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtubeShorts: "YouTube Shorts"
  };
  const REWARDS = {
    visit: 5,
    favorite: 3,
    share: 8,
    buyClick: 10,
    socialClick: 6,
    registration: 20
  };
  const STATUS_LABEL = {
    pronto: "Pronto",
    agendado: "Agendado",
    publicado: "Publicado",
    enviado: "Enviado ao servidor",
    falha: "Falha"
  };

  let productsCache = [];
  let storesCache = [];
  let adminTimer = null;
  let autoTimer = null;

  boot();

  function boot() {
    addStyle();
    exposeApi();
    loadCatalogData().finally(() => {
      installRewardsWidget();
      wrapShopActions();
      installAdminWatcher();
      startAutoRobot();
      setTimeout(() => awardVisit(), 900);
    });
  }

  async function loadCatalogData() {
    productsCache = getWindowProducts();
    if (!productsCache.length) productsCache = await fetchJson("dados/products.json");
    storesCache = await fetchJson("dados/stores.json");
  }

  function getProducts() {
    const products = getWindowProducts();
    return products.length ? products : productsCache;
  }

  function getStores() {
    return storesCache;
  }

  function getWindowProducts() {
    try {
      return typeof window.__impacto360GetProducts === "function" ? (window.__impacto360GetProducts() || []) : [];
    } catch (error) {
      return [];
    }
  }

  async function fetchJson(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function defaultRobot() {
    return {
      version: VERSION,
      active: true,
      autoPublish: false,
      approvalRequired: true,
      endpoint: DEFAULT_ENDPOINT,
      dailyLimit: 12,
      quietUntil: 0,
      queue: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function loadRobot() {
    try {
      const saved = JSON.parse(localStorage.getItem(ROBOT_KEY) || "{}");
      const robot = Object.assign(defaultRobot(), saved || {});
      robot.queue = Array.isArray(robot.queue) ? robot.queue : [];
      robot.history = Array.isArray(robot.history) ? robot.history : [];
      robot.dailyLimit = Math.max(1, Number(robot.dailyLimit) || 12);
      robot.endpoint = trim(robot.endpoint) || DEFAULT_ENDPOINT;
      return robot;
    } catch (error) {
      return defaultRobot();
    }
  }

  function saveRobot(robot) {
    robot.updatedAt = new Date().toISOString();
    robot.version = VERSION;
    localStorage.setItem(ROBOT_KEY, JSON.stringify(robot));
    renderRewardsWidget();
    renderAdminPanel();
    return robot;
  }

  function defaultWallet() {
    const referral = "IMP" + Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
      version: VERSION,
      tokenName: "IMPACTO",
      balance: 0,
      totalEarned: 0,
      referralCode: referral,
      holderId: "",
      registeredForReward: false,
      registeredAt: "",
      earnedKeys: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function loadWallet() {
    try {
      const saved = JSON.parse(localStorage.getItem(WALLET_KEY) || "{}");
      const wallet = Object.assign(defaultWallet(), saved || {});
      wallet.balance = Number(wallet.balance) || 0;
      wallet.totalEarned = Number(wallet.totalEarned) || 0;
      wallet.earnedKeys = Array.isArray(wallet.earnedKeys) ? wallet.earnedKeys : [];
      wallet.history = Array.isArray(wallet.history) ? wallet.history : [];
      return wallet;
    } catch (error) {
      return defaultWallet();
    }
  }

  function saveWallet(wallet) {
    wallet.updatedAt = new Date().toISOString();
    wallet.version = VERSION;
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    syncHolderWalletSnapshot(wallet);
    renderRewardsWidget();
    renderAdminPanel();
    return wallet;
  }

  function isWalletRegistered(wallet) {
    const group = loadHolderGroup();
    return Boolean(findCurrentHolder(wallet, group));
  }

  function awardTokens(action, amount, label, key) {
    const wallet = loadWallet();
    if (action !== "registration" && !isWalletRegistered(wallet)) {
      if (action !== "visit") showLocalToast("Cadastre nome e Zap/WhatsApp para liberar a contagem de tokens.");
      return wallet;
    }
    const rewardKey = key || `${action}:${todayKey()}`;
    if (wallet.earnedKeys.includes(rewardKey)) return wallet;
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.earnedKeys.push(rewardKey);
    wallet.earnedKeys = wallet.earnedKeys.slice(-500);
    wallet.history.unshift({
      action,
      amount,
      label,
      key: rewardKey,
      at: new Date().toISOString()
    });
    wallet.history = wallet.history.slice(0, 80);
    saveWallet(wallet);
    showLocalToast(`+${amount} tokens ${wallet.tokenName}: ${label}`);
    return wallet;
  }

  function awardVisit() {
    if (!document.body || document.body.classList.contains("locked")) return;
    awardTokens("visit", REWARDS.visit, "Entrada no shopping", `visit:${todayKey()}`);
  }

  function installRewardsWidget() {
    if (!document.body || document.getElementById("ai360RewardsWidget")) return;
    const widget = document.createElement("aside");
    widget.id = "ai360RewardsWidget";
    widget.className = "ai360-rewards-widget";
    widget.innerHTML = '<button type="button" data-ai360-reward-toggle aria-label="Abrir tokens de recompensa"></button><section hidden data-ai360-reward-panel></section>';
    document.body.appendChild(widget);
    widget.addEventListener("click", event => {
      const button = event.target.closest("[data-ai360-reward-toggle]");
      if (button) {
        const panel = widget.querySelector("[data-ai360-reward-panel]");
        panel.hidden = !panel.hidden;
        renderRewardsWidget();
      }
    });
    widget.addEventListener("submit", handleHolderSubmit);
    renderRewardsWidget();
  }

  function renderRewardsWidget() {
    const widget = document.getElementById("ai360RewardsWidget");
    if (!widget) return;
    const wallet = loadWallet();
    const robot = loadRobot();
    const holderGroup = loadHolderGroup();
    const holder = findCurrentHolder(wallet, holderGroup);
    const holderCount = countActiveHolders(holderGroup);
    const registered = Boolean(holder);
    const visibleBalance = registered ? wallet.balance : 0;
    const button = widget.querySelector("[data-ai360-reward-toggle]");
    const panel = widget.querySelector("[data-ai360-reward-panel]");
    if (button) {
      button.innerHTML = `<strong>${visibleBalance}</strong><span>${registered ? "Tokens" : "Cadastro"}</span>`;
    }
    if (panel) {
      const last = wallet.history.slice(0, 4).map(item => `<li><b>+${item.amount}</b> ${escapeHtml(item.label)}</li>`).join("");
      panel.innerHTML = `
        <h3>Recompensas ${escapeHtml(wallet.tokenName)}</h3>
        <p>A distribuicao de tokens so e contabilizada depois do cadastro rapido com nome e Zap/WhatsApp.</p>
        <div class="ai360-token-notice"><strong>Aviso de distribuicao</strong><span>Cadastre seus dados, acompanhe ofertas e use os tokens conforme as orientacoes gravadas da loja.</span></div>
        <div class="ai360-token-total"><strong>${visibleBalance}</strong><span>${registered ? "saldo de tokens" : "cadastro necessario"}</span></div>
        <div class="ai360-holder-status ${registered ? "registered" : ""}">
          <strong>${registered ? "Cadastro ativo" : "Cadastro pendente"}</strong>
          <span>${registered ? `Zap final ${escapeHtml(maskPhone(holder.phoneDigits || holder.phone))}` : "Nome e Zap/WhatsApp obrigatorios para liberar tokens"}</span>
        </div>
        <div class="ai360-reward-rules" aria-label="Como ganhar tokens">
          <span><b>+${REWARDS.visit}</b> entrar</span>
          <span><b>+${REWARDS.favorite}</b> favoritar</span>
          <span><b>+${REWARDS.share}</b> compartilhar</span>
          <span><b>+${REWARDS.buyClick}</b> ver oferta</span>
          <span><b>+${REWARDS.registration}</b> cadastrar</span>
        </div>
        <form class="ai360-holder-form" data-ai360-holder-form>
          <label>Nome
            <input name="name" value="${escapeAttr(holder?.name || "")}" placeholder="Seu nome" autocomplete="name" required>
          </label>
          <label>Zap/WhatsApp obrigatorio
            <input name="phone" value="${escapeAttr(holder?.phone || "")}" placeholder="DDD + WhatsApp" inputmode="tel" autocomplete="tel" required>
          </label>
          <label class="ai360-holder-consent">
            <input name="consent" type="checkbox" ${registered ? "checked" : ""} required>
            <span>${escapeHtml(HOLDER_CONSENT_TEXT)}</span>
          </label>
          <button type="submit">${registered ? "Atualizar cadastro" : "Cadastrar para obter recompensa"}</button>
        </form>
        <small>Grupo ${escapeHtml(HOLDER_GROUP_NAME)} - codigo ${escapeHtml(wallet.referralCode)} - ${holderCount} cadastro(s) ativo(s).</small>
        <ul>${last || "<li>Nenhuma recompensa ainda.</li>"}</ul>
        <div class="ai360-robot-mini"><b>Robo social</b><span>${robot.active ? "ativo" : "pausado"} - ${robot.queue.length} na fila</span></div>
      `;
    }
  }

  function defaultHolderGroup() {
    return {
      version: VERSION,
      groupId: HOLDER_GROUP_ID,
      groupName: HOLDER_GROUP_NAME,
      holders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function loadHolderGroup() {
    try {
      const saved = JSON.parse(localStorage.getItem(HOLDER_GROUP_KEY) || "null");
      const group = Array.isArray(saved) ? { ...defaultHolderGroup(), holders: saved } : Object.assign(defaultHolderGroup(), saved || {});
      group.holders = Array.isArray(group.holders) ? group.holders : [];
      group.groupId = HOLDER_GROUP_ID;
      group.groupName = HOLDER_GROUP_NAME;
      return group;
    } catch (error) {
      return defaultHolderGroup();
    }
  }

  function saveHolderGroup(group) {
    group.version = VERSION;
    group.groupId = HOLDER_GROUP_ID;
    group.groupName = HOLDER_GROUP_NAME;
    group.updatedAt = new Date().toISOString();
    localStorage.setItem(HOLDER_GROUP_KEY, JSON.stringify(group));
    return group;
  }

  function handleHolderSubmit(event) {
    const form = event.target.closest("[data-ai360-holder-form]");
    if (!form) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const holderName = trim(data.name);
    if (holderName.length < 2) {
      showLocalToast("Informe seu nome para liberar os tokens.");
      form.querySelector('[name="name"]')?.focus();
      return;
    }
    const phoneDigits = cleanPhone(data.phone);
    if (!isValidPhone(phoneDigits)) {
      showLocalToast("Informe seu Zap/WhatsApp com DDD para liberar a recompensa.");
      form.querySelector('[name="phone"]')?.focus();
      return;
    }
    if (!data.consent) {
      showLocalToast("Autorize o cadastro para salvar o telefone.");
      return;
    }

    const wallet = loadWallet();
    const group = loadHolderGroup();
    const now = new Date().toISOString();
    const existingIndex = group.holders.findIndex(item =>
      item.id === wallet.holderId ||
      item.referralCode === wallet.referralCode ||
      item.phoneDigits === phoneDigits
    );
    const previous = existingIndex >= 0 ? group.holders[existingIndex] : {};
    const holder = {
      ...previous,
      id: previous.id || `detentor-token-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      groupId: HOLDER_GROUP_ID,
      groupName: HOLDER_GROUP_NAME,
      name: holderName.slice(0, 120),
      phone: trim(data.phone).slice(0, 40),
      zap: trim(data.phone).slice(0, 40),
      phoneDigits,
      city: trim(data.city).slice(0, 120),
      referralCode: wallet.referralCode,
      tokenName: wallet.tokenName,
      walletBalance: wallet.balance,
      totalEarned: wallet.totalEarned,
      status: "ativo",
      source: "widget-tokens-loja",
      phoneRequired: true,
      zapRequired: true,
      nameRequired: true,
      contactGroupName: HOLDER_GROUP_NAME,
      consent: true,
      consentText: HOLDER_CONSENT_TEXT,
      consentAt: previous.consentAt || now,
      createdAt: previous.createdAt || now,
      updatedAt: now
    };

    if (existingIndex >= 0) group.holders[existingIndex] = holder;
    else group.holders.unshift(holder);
    group.holders = dedupeHolders(group.holders).slice(0, 1000);
    saveHolderGroup(group);

    wallet.holderId = holder.id;
    wallet.registeredForReward = true;
    wallet.registeredAt = wallet.registeredAt || now;
    wallet.registrationGroup = HOLDER_GROUP_NAME;
    wallet.holderPhoneDigits = phoneDigits;
    saveWallet(wallet);
    const awardedWallet = awardTokens("registration", REWARDS.registration, "Cadastro para recompensa", `registration:${holder.id}`);
    syncHolderWalletSnapshot(awardedWallet);
    showLocalToast("Cadastro salvo no grupo impacto360.");
    renderRewardsWidget();
    renderAdminPanel();
  }

  function findCurrentHolder(wallet, group) {
    return (group.holders || []).find(item =>
      item.status !== "removido" &&
      (item.id === wallet.holderId ||
        item.referralCode === wallet.referralCode ||
        (wallet.holderPhoneDigits && item.phoneDigits === wallet.holderPhoneDigits))
    ) || null;
  }

  function countActiveHolders(group) {
    return (group.holders || []).filter(item => item.status !== "removido" && isValidPhone(item.phoneDigits || cleanPhone(item.phone))).length;
  }

  function syncHolderWalletSnapshot(wallet) {
    if (!wallet || !wallet.holderId) return;
    const group = loadHolderGroup();
    let changed = false;
    group.holders = group.holders.map(item => {
      if (item.id !== wallet.holderId) return item;
      changed = true;
      return {
        ...item,
        tokenName: wallet.tokenName,
        walletBalance: wallet.balance,
        totalEarned: wallet.totalEarned,
        updatedAt: new Date().toISOString()
      };
    });
    if (changed) saveHolderGroup(group);
  }

  function dedupeHolders(holders) {
    const seen = new Set();
    return holders.filter(holder => {
      const key = holder.phoneDigits || holder.referralCode || holder.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function wrapShopActions() {
    retryWrap("enterShopping", function () {
      setTimeout(() => awardVisit(), 200);
    });
    retryWrap("toggleFavorite", function (args) {
      const itemId = trim(args[0]);
      if (!itemId || !isFavoriteNow(itemId)) return;
      awardTokens("favorite", REWARDS.favorite, "Produto favoritado", `favorite:${itemId}`);
    });
    retryWrap("shareShopping", function () {
      awardTokens("share", REWARDS.share, "Shopping compartilhado", `share:shopping:${todayKey()}`);
    });
    retryWrap("shareStore", function (args) {
      const storeId = trim(args[0]) || "loja";
      awardTokens("share", REWARDS.share, "Loja compartilhada", `share:store:${storeId}:${todayKey()}`);
    });
    retryWrap("shareCurrentStore", function () {
      awardTokens("share", REWARDS.share, "Loja compartilhada", `share:store:current:${todayKey()}`);
    });
    retryWrap("shareProduct", function (args) {
      const itemId = trim(args[0]) || "produto";
      awardTokens("share", REWARDS.share, "Produto compartilhado", `share:product:${itemId}:${todayKey()}`);
    });
    retryWrap("buyProduct", function (args) {
      const itemId = trim(args[0]);
      const product = findProduct(itemId);
      if (!product || !isValidLink(productLink(product))) return;
      awardTokens("buyClick", REWARDS.buyClick, "Clique em oferta", `buy:${itemId}:${todayKey()}`);
      queueSocialSignal(product);
    });
  }

  function retryWrap(name, after, tries) {
    const total = tries == null ? 60 : tries;
    if (window[`__ai360Wrapped_${name}`]) return;
    const original = window[name];
    if (typeof original !== "function") {
      if (total > 0) setTimeout(() => retryWrap(name, after, total - 1), 250);
      return;
    }
    window[name] = function () {
      const args = Array.from(arguments);
      const result = original.apply(this, arguments);
      try { after(args, result); } catch (error) {}
      return result;
    };
    window[`__ai360Wrapped_${name}`] = true;
  }

  function isFavoriteNow(itemId) {
    try {
      const ids = JSON.parse(localStorage.getItem("impacto360Favorites") || "[]");
      return Array.isArray(ids) && ids.includes(itemId);
    } catch (error) {
      return false;
    }
  }

  function queueSocialSignal(product) {
    const robot = loadRobot();
    if (!robot.active) return;
    const key = `${todayKey()}:${product.id}:whatsapp`;
    if (robot.queue.some(item => item.key === key)) return;
    const store = findStore(product.storeId);
    robot.queue.push(buildCampaign(product, store, "whatsapp", robot.queue.length));
    robot.queue = robot.queue.slice(-120);
    saveRobot(robot);
  }

  function installAdminWatcher() {
    if (adminTimer) return;
    adminTimer = setInterval(() => {
      installAdminPanel();
      attachSocialCardButton();
    }, 700);
    installAdminPanel();
    attachSocialCardButton();
  }

  function installAdminPanel() {
    if (!isAdminRoute() || !isAdminUnlocked()) return;
    const root = document.querySelector("[data-root]") || document.querySelector(".agent-shell");
    if (!root) return;
    let panel = document.getElementById("ai360SocialRewardsPanel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "ai360SocialRewardsPanel";
      panel.className = "ai360-social-panel";
      root.appendChild(panel);
      panel.addEventListener("click", handleAdminClick);
      panel.addEventListener("change", handleAdminChange);
    }
    renderAdminPanel();
  }

  function attachSocialCardButton() {
    if (!isAdminRoute() || !isAdminUnlocked()) return;
    const cards = Array.from(document.querySelectorAll(".agent-card"));
    const card = cards.find(item => /Agente Social 360/i.test(item.textContent || ""));
    if (!card || card.querySelector("[data-ai360-open-social]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.ai360OpenSocial = "true";
    button.textContent = "Abrir robo social";
    button.addEventListener("click", () => {
      installAdminPanel();
      document.getElementById("ai360SocialRewardsPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    card.appendChild(button);
  }

  function renderAdminPanel() {
    const panel = document.getElementById("ai360SocialRewardsPanel");
    if (!panel || !isAdminUnlocked()) return;
    const robot = loadRobot();
    const wallet = loadWallet();
    const holderGroup = loadHolderGroup();
    const holders = (holderGroup.holders || []).filter(item => item.status !== "removido");
    const holderCount = countActiveHolders(holderGroup);
    const ready = robot.queue.filter(item => ["pronto", "agendado"].includes(item.status)).length;
    const sentToday = robot.history.filter(item => dayFromIso(item.at) === todayKey()).length;
    const latest = robot.queue.slice(0, 8).map(item => `
      <li>
        <span>${escapeHtml(CHANNEL_LABELS[item.channel] || item.channel)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <em>${escapeHtml(STATUS_LABEL[item.status] || item.status)}</em>
      </li>
    `).join("");
    panel.innerHTML = `
      <header class="ai360-social-head">
        <div>
          <span>ROBO SOCIAL 360</span>
          <h2>Area restrita: tokens e grupo impacto360</h2>
          <p>Acompanha cadastros com nome e Zap/WhatsApp, libera tokens somente apos cadastro e mantem a fila de divulgacao.</p>
        </div>
        <strong class="${robot.active ? "on" : "off"}">${robot.active ? "Ativo" : "Pausado"}</strong>
      </header>
      <div class="ai360-social-stats">
        <span><b>${ready}</b> campanhas prontas</span>
        <span><b>${sentToday}</b> envios hoje</span>
        <span><b>${wallet.balance}</b> tokens locais</span>
        <span><b>${holderCount}</b> grupo impacto360</span>
        <span><b>${robot.dailyLimit}</b> limite diario</span>
      </div>
      <div class="ai360-social-controls">
        <label>Servidor seguro
          <input data-ai360-social-field="endpoint" value="${escapeAttr(robot.endpoint)}" placeholder="${DEFAULT_ENDPOINT}">
        </label>
        <label>Limite por dia
          <input data-ai360-social-field="dailyLimit" type="number" min="1" max="80" value="${escapeAttr(robot.dailyLimit)}">
        </label>
        <label class="ai360-check">
          <input data-ai360-social-field="autoPublish" type="checkbox" ${robot.autoPublish ? "checked" : ""}>
          Enviar automaticamente para o servidor
        </label>
      </div>
      <div class="ai360-social-actions">
        <button type="button" data-ai360-social-action="build">Gerar campanhas</button>
        <button type="button" data-ai360-social-action="activate">Ativar robo</button>
        <button type="button" data-ai360-social-action="pause">Pausar</button>
        <button type="button" data-ai360-social-action="publish">Publicar proxima via servidor</button>
        <button type="button" data-ai360-social-action="export">Exportar fila</button>
        <button type="button" data-ai360-social-action="export-holders">Exportar detentores</button>
        <button type="button" data-ai360-social-action="export-holders-csv">Exportar CSV</button>
      </div>
      <div class="ai360-social-note">
        As chaves reais ficam no servidor ou no arquivo .env. O GitHub Pages nunca recebe token de Instagram, Facebook, TikTok, YouTube ou WhatsApp.
      </div>
      <section class="ai360-token-holders">
        <header>
          <div>
            <h3>${escapeHtml(holderGroup.groupName)}</h3>
            <p>Ambiente restrito para acompanhar quem concluiu o cadastro. Nome, Zap/WhatsApp e autorizacao sao obrigatorios.</p>
          </div>
          <strong>${holderCount} pessoa(s)</strong>
        </header>
        <ul>${renderHolderRows(holders)}</ul>
      </section>
      <section class="ai360-social-queue">
        <h3>Fila de divulgacao</h3>
        <ul>${latest || "<li><strong>Nenhuma campanha ainda.</strong><em>Use Gerar campanhas.</em></li>"}</ul>
      </section>
    `;
  }

  function handleAdminClick(event) {
    const button = event.target.closest("[data-ai360-social-action]");
    if (!button) return;
    const action = button.dataset.ai360SocialAction;
    if (action === "build") {
      const added = buildCampaignQueue();
      showLocalToast(`${added} campanhas geradas para o robo social`);
    }
    if (action === "activate") {
      const robot = loadRobot();
      robot.active = true;
      robot.autoPublish = true;
      robot.approvalRequired = false;
      saveRobot(robot);
      showLocalToast("Robo social ativado");
      startAutoRobot();
    }
    if (action === "pause") {
      const robot = loadRobot();
      robot.active = false;
      robot.autoPublish = false;
      saveRobot(robot);
      showLocalToast("Robo social pausado");
    }
    if (action === "publish") {
      publishNextCampaign(true);
    }
    if (action === "export") {
      downloadText("impacto360-fila-robo-social.json", JSON.stringify(loadRobot(), null, 2));
    }
    if (action === "export-holders") {
      downloadText("impacto360-detentores-tokens.json", JSON.stringify(loadHolderGroup(), null, 2));
    }
    if (action === "export-holders-csv") {
      downloadText("impacto360-detentores-tokens.csv", holdersToCsv(loadHolderGroup().holders), "text/csv;charset=utf-8");
    }
  }

  function handleAdminChange(event) {
    const field = event.target.closest("[data-ai360-social-field]");
    if (!field) return;
    const robot = loadRobot();
    if (field.dataset.ai360SocialField === "endpoint") robot.endpoint = trim(field.value) || DEFAULT_ENDPOINT;
    if (field.dataset.ai360SocialField === "dailyLimit") robot.dailyLimit = Math.max(1, Number(field.value) || 12);
    if (field.dataset.ai360SocialField === "autoPublish") robot.autoPublish = !!field.checked;
    saveRobot(robot);
  }

  function renderHolderRows(holders) {
    const rows = holders
      .slice()
      .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))
      .slice(0, 10)
      .map(holder => `
        <li>
          <strong>${escapeHtml(holder.name || "Cliente sem nome")}</strong>
          <span>${escapeHtml(maskPhone(holder.phoneDigits || holder.phone))}</span>
          <span>${escapeHtml(holder.groupName || HOLDER_GROUP_NAME)}</span>
          <b>${Number(holder.walletBalance || 0)} tokens</b>
        </li>
      `).join("");
    return rows || "<li><strong>Nenhum cadastro ainda.</strong><span>O formulario do cliente alimenta o grupo impacto360.</span></li>";
  }

  function holdersToCsv(holders) {
    const header = ["id", "nome", "whatsapp", "grupo", "codigo", "tokens", "totalGanho", "status", "consentimentoEm", "atualizadoEm"];
    const rows = (holders || []).map(holder => [
      holder.id,
      holder.name,
      holder.phone,
      holder.groupName || HOLDER_GROUP_NAME,
      holder.referralCode,
      holder.walletBalance,
      holder.totalEarned,
      holder.status,
      holder.consentAt,
      holder.updatedAt
    ].map(csvCell).join(","));
    return [header.join(","), ...rows].join("\n");
  }

  function buildCampaignQueue() {
    const robot = loadRobot();
    const existing = new Set(robot.queue.map(item => item.key));
    const stores = getStores();
    const products = getProducts()
      .filter(isCampaignProduct)
      .sort((a, b) => scoreProduct(b) - scoreProduct(a))
      .slice(0, 12);
    let added = 0;
    for (const product of products) {
      const store = stores.find(item => item.id === product.storeId) || {};
      for (const channel of CHANNELS) {
        if (added >= robot.dailyLimit) break;
        const campaign = buildCampaign(product, store, channel, robot.queue.length + added);
        if (existing.has(campaign.key)) continue;
        robot.queue.push(campaign);
        existing.add(campaign.key);
        added += 1;
      }
      if (added >= robot.dailyLimit) break;
    }
    robot.active = true;
    robot.queue = robot.queue.slice(-160);
    saveRobot(robot);
    return added;
  }

  function buildCampaign(product, store, channel, index) {
    const title = trim(product.name || product.nome || "Oferta Impacto 360");
    const link = productLink(product);
    const price = trim(product.price || product.preco || "");
    const image = productImage(product);
    const storeName = trim(store.name || store.commercialName || "Impacto 360 Afiliado");
    const schedule = new Date(Date.now() + (index + 1) * 45 * 60 * 1000).toISOString();
    return {
      id: `ai360-${Date.now()}-${safeId(product.id || title)}-${channel}`,
      key: `${todayKey()}:${product.id || title}:${channel}`,
      channel,
      title,
      storeId: product.storeId || "",
      storeName,
      price,
      image,
      link,
      caption: buildCaption(product, store, channel),
      hashtags: buildHashtags(product, store),
      status: "agendado",
      scheduledAt: schedule,
      createdAt: new Date().toISOString()
    };
  }

  function buildCaption(product, store, channel) {
    const title = trim(product.name || product.nome || "Oferta selecionada");
    const price = trim(product.price || product.preco || "");
    const description = trim(product.description || product.descricaoCurta || "").slice(0, 180);
    const storeName = trim(store.name || store.commercialName || "Impacto 360 Afiliado");
    const link = productLink(product);
    const tags = buildHashtags(product, store).join(" ");
    if (channel === "whatsapp") {
      return `Oferta IMPACTO 360\n\n${title}\n${price}\n\n${description}\n\nComprar: ${link}\n\n${tags}`;
    }
    if (channel === "tiktok" || channel === "youtubeShorts") {
      return `${title} ${price}\nDestaque da loja ${storeName}. Confira antes que mude.\n${link}\n${tags}`;
    }
    return `${title}\n\n${description}\n\nPreco: ${price}\nLoja: ${storeName}\nLink: ${link}\n\n${tags}`;
  }

  function buildHashtags(product, store) {
    const base = ["#Impacto360", "#Afiliado", "#Ofertas"];
    const category = trim(product.category || product.categoria || store.category || "").replace(/\s+/g, "");
    if (category) base.push(`#${category.slice(0, 26)}`);
    return Array.from(new Set(base));
  }

  async function publishNextCampaign(manual) {
    const robot = loadRobot();
    if (!robot.active && !manual) return;
    if (Date.now() < Number(robot.quietUntil || 0) && !manual) return;
    const sentToday = robot.history.filter(item => dayFromIso(item.at) === todayKey()).length;
    if (sentToday >= robot.dailyLimit) return;
    const campaign = robot.queue.find(item => ["pronto", "agendado", "falha"].includes(item.status));
    if (!campaign) {
      if (manual) showLocalToast("Nao ha campanha pendente na fila");
      return;
    }
    try {
      const response = await fetch(robot.endpoint || DEFAULT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "impacto360-github-pages", version: VERSION, campaign })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
      campaign.status = data.mode === "dry-run" || data.mode === "fila-segura" ? "enviado" : "publicado";
      campaign.sentAt = new Date().toISOString();
      campaign.serverResponse = { mode: data.mode || "servidor", id: data.id || "" };
      robot.history.unshift({ id: campaign.id, channel: campaign.channel, title: campaign.title, at: campaign.sentAt, mode: campaign.serverResponse.mode });
      robot.history = robot.history.slice(0, 160);
      saveRobot(robot);
      awardTokens("socialClick", REWARDS.socialClick, "Campanha enviada", `social:${campaign.id}`);
      if (manual) showLocalToast("Campanha enviada ao servidor social");
    } catch (error) {
      campaign.status = "falha";
      campaign.error = error.message;
      campaign.lastErrorAt = new Date().toISOString();
      robot.quietUntil = Date.now() + 10 * 60 * 1000;
      saveRobot(robot);
      if (manual) showLocalToast("Servidor social indisponivel. A fila ficou salva.");
    }
  }

  function startAutoRobot() {
    if (autoTimer) return;
    autoTimer = setInterval(() => {
      const robot = loadRobot();
      if (robot.active && robot.autoPublish) publishNextCampaign(false);
    }, 60000);
    setTimeout(() => {
      const robot = loadRobot();
      if (robot.active && robot.autoPublish) publishNextCampaign(false);
    }, 6000);
  }

  function isCampaignProduct(product) {
    if (!product || String(product.status || "").toLowerCase() === "rascunho") return false;
    if (product.aprovadoParaPublicacao === false) return false;
    if (!isValidLink(productLink(product))) return false;
    if (!productImage(product)) return false;
    if (product.tipoConteudo === "postagem_loja_musica") return false;
    return true;
  }

  function scoreProduct(product) {
    let score = 0;
    if (/oferta|imperdivel|recomendado|mais vendido/i.test([product.badge, product.description, product.name].join(" "))) score += 8;
    if (product.source === "Mercado Livre") score += 4;
    if (product.price || product.preco) score += 2;
    return score;
  }

  function findProduct(itemId) {
    return getProducts().find(item => String(item.id) === String(itemId));
  }

  function findStore(storeId) {
    return getStores().find(item => String(item.id) === String(storeId)) || {};
  }

  function productLink(product) {
    return trim(product?.linkCompra || product?.linkAfiliado || product?.affiliateLink || product?.linkComissionado || product?.linkPlataforma || product?.link_original_afiliado || product?.url || product?.linkOriginal);
  }

  function productImage(product) {
    const image = trim(product?.fotoPrincipal || product?.imagemPrincipal || product?.image || product?.imagem);
    if (/placeholder|sem[-_ ]?(foto|imagem)|COLOCAR_|URL_|LINK_/i.test(image)) return "";
    return image;
  }

  function isValidLink(link) {
    return /^https?:\/\//i.test(link) && !/COLOCAR_|URL_|LINK_|placeholder/i.test(link);
  }

  function isAdminRoute() {
    const route = new URLSearchParams(location.search).get("route") || location.pathname;
    return route.startsWith("/admin/");
  }

  function isAdminUnlocked() {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) === "ok";
    } catch (error) {
      return false;
    }
  }

  function exposeApi() {
    window.__ai360Rewards = {
      version: VERSION,
      getWallet: loadWallet,
      award: awardTokens,
      render: renderRewardsWidget
    };
    window.__ai360SocialRobot = {
      version: VERSION,
      getState: loadRobot,
      saveState: saveRobot,
      buildQueue: buildCampaignQueue,
      publishNext: publishNextCampaign,
      renderAdmin: renderAdminPanel
    };
    window.__ai360TokenHolders = {
      version: VERSION,
      groupName: HOLDER_GROUP_NAME,
      getGroup: loadHolderGroup,
      count: () => countActiveHolders(loadHolderGroup())
    };
  }

  function showLocalToast(message) {
    if (typeof window.showToast === "function") {
      try { window.showToast(message); return; } catch (error) {}
    }
    let toast = document.getElementById("ai360SocialToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "ai360SocialToast";
      toast.className = "ai360-social-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showLocalToast.timer);
    showLocalToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 500);
  }

  function cleanPhone(value) {
    return trim(value).replace(/\D+/g, "").slice(0, 14);
  }

  function isValidPhone(value) {
    const digits = cleanPhone(value);
    return digits.length >= 10 && digits.length <= 14;
  }

  function maskPhone(value) {
    const digits = cleanPhone(value);
    if (!digits) return "nao informado";
    const last = digits.slice(-4);
    const ddd = digits.length >= 10 ? digits.slice(Math.max(0, digits.length - 11), Math.max(0, digits.length - 9)) : "";
    return ddd ? `(${ddd}) ****-${last}` : `****-${last}`;
  }

  function csvCell(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function dayFromIso(value) {
    return trim(value).slice(0, 10);
  }

  function safeId(value) {
    return trim(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80) || "campanha";
  }

  function trim(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return trim(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function addStyle() {
    if (document.getElementById("ai360SocialRewardsStyle")) return;
    const style = document.createElement("style");
    style.id = "ai360SocialRewardsStyle";
    style.textContent = `
      .ai360-rewards-widget{position:fixed;right:14px;bottom:14px;z-index:9994;font-family:Inter,system-ui,sans-serif;color:#08192f}
      .ai360-rewards-widget>[data-ai360-reward-toggle]{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;min-height:46px;border:0;border-radius:12px;padding:7px 11px;background:#fff4c7;color:#08192f;box-shadow:0 16px 42px rgba(8,25,47,.22);font-weight:900}
      .ai360-rewards-widget>[data-ai360-reward-toggle] strong{display:grid;place-items:center;min-width:34px;height:30px;border-radius:9px;background:#0e766e;color:#fff}
      .ai360-rewards-widget>[data-ai360-reward-toggle] span{font-size:11px;text-transform:uppercase}
      .ai360-rewards-widget section{width:min(320px,calc(100vw - 24px));margin-bottom:8px;padding:14px;border:1px solid #dce8f7;border-radius:12px;background:#fff;box-shadow:0 20px 48px rgba(8,25,47,.22)}
      .ai360-rewards-widget h3{margin:0 0 5px;font-size:17px}.ai360-rewards-widget p{margin:0 0 10px;color:#56667a;font-size:13px}
      .ai360-token-notice{display:grid;gap:3px;margin:8px 0;padding:9px;border:1px solid #bee7f2;border-radius:10px;background:#effbff;color:#0a4f66}.ai360-token-notice strong{font-size:12px;text-transform:uppercase}.ai360-token-notice span{font-size:12px;line-height:1.35}
      .ai360-token-total{display:flex;align-items:end;gap:8px;margin:8px 0;padding:10px;border-radius:10px;background:#eef8f7}.ai360-token-total strong{font-size:32px;line-height:1;color:#0e766e}.ai360-token-total span{font-size:11px;font-weight:900;text-transform:uppercase}
      .ai360-holder-status{display:grid;gap:2px;margin:8px 0;padding:9px;border:1px solid #f1d58f;border-radius:10px;background:#fff8df}.ai360-holder-status strong{font-size:13px}.ai360-holder-status span{font-size:12px;color:#725013}.ai360-holder-status.registered{border-color:#bdebdc;background:#eef8f7}.ai360-holder-status.registered span{color:#0c6b46}
      .ai360-reward-rules{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:10px 0}.ai360-reward-rules span{display:grid;gap:2px;place-items:center;min-height:42px;border:1px solid #e4edf6;border-radius:8px;background:#f7fbff;font-size:10px;font-weight:900;text-transform:uppercase;text-align:center}.ai360-reward-rules b{color:#1d5cff;font-size:13px}
      .ai360-holder-form{display:grid;gap:8px;margin:10px 0}.ai360-holder-form label{display:grid;gap:4px;font-size:11px;font-weight:900;color:#243750}.ai360-holder-form input{min-height:38px;border:1px solid #c9d9e8;border-radius:8px;padding:8px;font:inherit}.ai360-holder-consent{grid-template-columns:auto 1fr!important;align-items:start;font-weight:700!important;line-height:1.35}.ai360-holder-consent input{min-height:auto;margin-top:2px}.ai360-holder-form button{min-height:40px;border:0;border-radius:9px;background:#1d5cff;color:#fff;font-weight:950}
      .ai360-rewards-widget small{font-weight:900;color:#1d5cff}.ai360-rewards-widget ul{margin:10px 0 0;padding:0;list-style:none}.ai360-rewards-widget li{display:flex;gap:6px;padding:6px 0;border-top:1px solid #eef2f7;font-size:12px}
      .ai360-robot-mini{display:flex;justify-content:space-between;gap:8px;margin-top:10px;padding:8px;border-radius:9px;background:#fff8df;font-size:12px}
      .ai360-social-panel{margin-top:16px;padding:18px;border:1px solid #cfe3f3;border-radius:14px;background:#fff;color:#08192f}
      .ai360-social-head{display:flex;justify-content:space-between;gap:16px;align-items:start}.ai360-social-head span{font-size:10px;font-weight:950;color:#0e766e;letter-spacing:.08em}.ai360-social-head h2{margin:4px 0;font-size:25px}.ai360-social-head p{margin:0;color:#56667a}
      .ai360-social-head>strong{padding:8px 11px;border-radius:999px;background:#fdecec;color:#9f1239;font-size:12px}.ai360-social-head>strong.on{background:#ddf7ef;color:#0c6b46}
      .ai360-social-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:14px 0}.ai360-social-stats span{padding:11px;border-radius:10px;background:#f4f8fc;font-size:12px}.ai360-social-stats b{display:block;font-size:24px}
      .ai360-social-controls{display:grid;grid-template-columns:2fr 120px 1.2fr;gap:10px;align-items:end}.ai360-social-controls label{display:grid;gap:5px;font-size:12px;font-weight:900}.ai360-social-controls input{min-height:40px;border:1px solid #c9d9e8;border-radius:8px;padding:8px}.ai360-check{display:flex!important;grid-template-columns:auto 1fr;align-items:center;gap:7px}.ai360-check input{min-height:auto}
      .ai360-social-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.ai360-social-actions button,.agent-card [data-ai360-open-social]{min-height:40px;border:0;border-radius:9px;padding:0 12px;background:#081f42;color:#fff;font-weight:900}.ai360-social-actions button:first-child{background:#1d5cff}.ai360-social-actions button:nth-child(2){background:#0e766e}
      .ai360-social-note{padding:10px;border:1px solid #f1d58f;border-radius:9px;background:#fff8df;color:#725013;font-size:12px;font-weight:800}
      .ai360-token-holders{margin-top:14px;padding:14px;border:1px solid #d7e8f7;border-radius:12px;background:#f8fbff}.ai360-token-holders header{display:flex;justify-content:space-between;gap:12px;align-items:start}.ai360-token-holders h3{margin:0 0 4px}.ai360-token-holders p{margin:0;color:#56667a;font-size:12px}.ai360-token-holders header>strong{white-space:nowrap;padding:8px 10px;border-radius:999px;background:#ddf7ef;color:#0c6b46;font-size:12px}.ai360-token-holders ul{display:grid;gap:8px;margin:12px 0 0;padding:0;list-style:none}.ai360-token-holders li{display:grid;grid-template-columns:1.2fr 120px 1fr 80px;gap:8px;align-items:center;padding:9px;border:1px solid #e4edf6;border-radius:9px;background:#fff;font-size:12px}.ai360-token-holders li span{color:#56667a}.ai360-token-holders li b{color:#1d5cff}
      .ai360-social-queue h3{margin:16px 0 8px}.ai360-social-queue ul{display:grid;gap:8px;margin:0;padding:0;list-style:none}.ai360-social-queue li{display:grid;grid-template-columns:120px 1fr 150px;gap:8px;align-items:center;padding:9px;border:1px solid #e4edf6;border-radius:9px}.ai360-social-queue span{font-size:11px;font-weight:900;color:#1d5cff}.ai360-social-queue strong{font-size:13px}.ai360-social-queue em{font-style:normal;font-size:11px;font-weight:900;color:#0e766e}
      .ai360-social-toast{position:fixed;left:50%;bottom:24px;z-index:10040;transform:translateX(-50%) translateY(20px);opacity:0;padding:12px 14px;border-radius:10px;background:#081f42;color:#fff;font:800 13px Inter,system-ui;box-shadow:0 16px 42px rgba(8,25,47,.24);transition:.18s ease}
      .ai360-social-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      @media(max-width:760px){.ai360-rewards-widget{right:10px;bottom:10px}.ai360-social-panel{padding:13px}.ai360-social-head,.ai360-token-holders header{display:block}.ai360-social-stats,.ai360-social-controls{grid-template-columns:1fr}.ai360-reward-rules{grid-template-columns:repeat(2,1fr)}.ai360-social-queue li,.ai360-token-holders li{grid-template-columns:1fr}.ai360-social-head h2{font-size:20px}}
    `;
    document.head.appendChild(style);
  }
})();
