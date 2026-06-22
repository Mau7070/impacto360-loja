(function () {
  "use strict";
  const KEY = "ai360:marketingContent:v1";
  const AUTH = "impacto360:sala-agentes:auth:v2";
  const PASSWORD = "Impacto360!Sala#J7K9-2026";
  let data = { settings: { bannerRotationMs: 6500, adRotationMs: 5200 }, banners: [], ads: [] };
  let editBanner = "";
  let editAd = "";
  setTimeout(start, 900);

  async function start(message) {
    await load();
    style();
    document.body.className = "";
    document.body.innerHTML = '<main class="promo-admin"><section id="promoAdmin"></section></main>';
    if (sessionStorage.getItem(AUTH) === "ok") manager(message); else login(message);
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

  function login(message) {
    const root = document.getElementById("promoAdmin");
    root.innerHTML = '<section class="promo-card login"><b>360</b><h1>Gestao de Banners e Anuncios Promocionais</h1><p>Area administrativa protegida.</p><form id="promoLogin"><input type="password" name="password" placeholder="Senha administrativa"><button>Entrar</button></form><small>' + esc(message || "") + '</small></section>';
    document.getElementById("promoLogin").onsubmit = function (event) {
      event.preventDefault();
      if (new FormData(event.currentTarget).get("password") !== PASSWORD) return login("Senha incorreta.");
      sessionStorage.setItem(AUTH, "ok");
      manager("Acesso liberado.");
    };
  }

  function manager(message) {
    const root = document.getElementById("promoAdmin");
    const banner = data.banners.find(function (item) { return item.id === editBanner; }) || emptyBanner();
    const ad = data.ads.find(function (item) { return item.id === editAd; }) || emptyAd();
    root.innerHTML = '<header><div><small>IMPACTO 360</small><h1>Gestao de Banners e Anuncios Promocionais</h1><p>' + esc(message || "Cadastre e organize as campanhas.") + '</p></div><div><a href="/">Ver loja</a><button id="logout">Sair</button></div></header>' +
      '<section class="promo-card"><h2>Intervalos</h2><form id="settings"><input type="number" min="3000" name="bannerRotationMs" value="' + num(data.settings.bannerRotationMs, 6500) + '" placeholder="Banners em ms"><input type="number" min="3000" name="adRotationMs" value="' + num(data.settings.adRotationMs, 5200) + '" placeholder="Anuncios em ms"><button>Salvar</button></form></section>' +
      '<section class="grid"><article class="promo-card"><h2>Banner</h2><form id="bannerForm">' + fieldsBanner(banner) + '<button>Salvar banner</button><button type="button" id="newBanner">Novo</button></form></article>' +
      '<article class="promo-card"><h2>Anuncio</h2><form id="adForm">' + fieldsAd(ad) + '<button>Salvar anuncio</button><button type="button" id="newAd">Novo</button></form></article></section>' +
      '<section class="grid"><article class="promo-card"><h2>Banners cadastrados</h2>' + list(data.banners, "banner") + '</article><article class="promo-card"><h2>Anuncios cadastrados</h2>' + list(data.ads, "ad") + '</article></section>';
    bind();
  }

  function fieldsBanner(item) {
    return input("id", item.id, "hidden") + input("image", item.image, "text", "Imagem") + input("title", item.title, "text", "Titulo opcional") + area("description", item.description, "Descricao") + input("link", item.link, "url", "Link") + status(item.active) + input("order", item.order, "number", "Ordem");
  }

  function fieldsAd(item) {
    return input("id", item.id, "hidden") + input("image", item.image, "text", "Imagem") + input("title", item.title, "text", "Titulo") + area("description", item.description, "Descricao") + input("buttonLabel", item.buttonLabel, "text", "Texto do botao") + input("link", item.link, "url", "Link") + input("startDate", item.startDate, "date") + input("endDate", item.endDate, "date") + status(item.active) + input("priority", item.priority, "number", "Prioridade");
  }

  function bind() {
    document.getElementById("logout").onclick = function () { sessionStorage.removeItem(AUTH); login("Sessao encerrada."); };
    document.getElementById("newBanner").onclick = function () { editBanner = ""; manager("Novo banner."); };
    document.getElementById("newAd").onclick = function () { editAd = ""; manager("Novo anuncio."); };
    document.getElementById("settings").onsubmit = function (event) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      data.settings = { bannerRotationMs: num(values.bannerRotationMs, 6500), adRotationMs: num(values.adRotationMs, 5200) };
      save("Intervalos salvos.");
    };
    document.getElementById("bannerForm").onsubmit = function (event) { event.preventDefault(); saveItem("banner", Object.fromEntries(new FormData(event.currentTarget))); };
    document.getElementById("adForm").onsubmit = function (event) { event.preventDefault(); saveItem("ad", Object.fromEntries(new FormData(event.currentTarget))); };
    document.querySelectorAll("[data-edit]").forEach(function (button) {
      button.onclick = function () { if (button.dataset.kind === "banner") editBanner = button.dataset.edit; else editAd = button.dataset.edit; manager("Item carregado."); };
    });
    document.querySelectorAll("[data-toggle]").forEach(function (button) {
      button.onclick = function () { toggle(button.dataset.kind, button.dataset.toggle); };
    });
    document.querySelectorAll("[data-delete]").forEach(function (button) {
      button.onclick = function () { if (confirm("Excluir este item?")) remove(button.dataset.kind, button.dataset.delete); };
    });
  }

  function saveItem(kind, values) {
    const active = values.active === "true";
    if (active && !safe(values.link)) return manager("Item ativo precisa de link HTTPS.");
    if (kind === "ad" && values.endDate && values.startDate && values.endDate < values.startDate) return manager("Data final invalida.");
    const key = kind === "banner" ? "banners" : "ads";
    const id = values.id || kind + "-" + Date.now();
    const item = kind === "banner"
      ? { id: id, image: values.image, title: values.title, description: values.description, link: values.link, active: active, order: num(values.order, 1) }
      : { id: id, image: values.image, title: values.title, description: values.description, buttonLabel: values.buttonLabel, link: values.link, startDate: values.startDate, endDate: values.endDate, active: active, priority: num(values.priority, 1) };
    data[key] = data[key].filter(function (old) { return old.id !== id; }).concat(item);
    if (kind === "banner") editBanner = id; else editAd = id;
    save("Item salvo.");
  }

  function toggle(kind, id) {
    const item = (kind === "banner" ? data.banners : data.ads).find(function (row) { return row.id === id; });
    if (!item) return;
    if (!item.active && !safe(item.link)) return manager("Nao e possivel ativar sem link HTTPS.");
    item.active = !item.active;
    save("Status atualizado.");
  }

  function remove(kind, id) {
    const key = kind === "banner" ? "banners" : "ads";
    data[key] = data[key].filter(function (item) { return item.id !== id; });
    save("Item excluido.");
  }

  function save(message) {
    localStorage.setItem(KEY, JSON.stringify(data));
    manager(message);
  }

  function list(items, kind) {
    return items.map(function (item) {
      return '<p><b>' + esc(item.title || item.id) + '</b><br>' + (item.active ? "Ativo" : "Inativo") + '<br><button data-edit="' + esc(item.id) + '" data-kind="' + kind + '">Editar</button><button data-toggle="' + esc(item.id) + '" data-kind="' + kind + '">' + (item.active ? "Desativar" : "Ativar") + '</button><button data-delete="' + esc(item.id) + '" data-kind="' + kind + '">Excluir</button></p>';
    }).join("") || "Nenhum item.";
  }

  function input(name, value, type, placeholder) { return '<input name="' + name + '" type="' + type + '" value="' + esc(value == null ? "" : value) + '"' + (placeholder ? ' placeholder="' + placeholder + '"' : "") + '>'; }
  function area(name, value, placeholder) { return '<textarea name="' + name + '" placeholder="' + placeholder + '">' + esc(value || "") + '</textarea>'; }
  function status(active) { return '<select name="active"><option value="true" ' + (active ? "selected" : "") + '>Ativo</option><option value="false" ' + (!active ? "selected" : "") + '>Inativo</option></select>'; }
  function safe(value) { return /^https:\/\//i.test(String(value || "")) || /^(?:\/|#|\?)/.test(String(value || "")); }
  function num(value, fallback) { return Math.max(1, Number(value) || fallback); }
  function emptyBanner() { return { id: "", image: "", title: "", description: "", link: "", active: false, order: 1 }; }
  function emptyAd() { return { id: "", image: "", title: "", description: "", buttonLabel: "Ver oferta", link: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", active: false, priority: 1 }; }
  function esc(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function style() {
    const css = document.createElement("style");
    css.textContent = '.promo-admin{min-height:100vh;padding:16px;background:#f3f8fe;color:#08192f;font-family:Arial,sans-serif}.promo-admin>section{width:min(1100px,100%);margin:auto}.promo-admin header{display:flex;justify-content:space-between;align-items:end;padding:22px;border-radius:14px;background:#081f42;color:#fff}.promo-admin header div:last-child{display:flex;gap:8px}.promo-admin a,.promo-admin button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;border:0;border-radius:8px;padding:0 12px;background:#1d5cff;color:#fff;text-decoration:none;font-weight:bold}.promo-card{margin-top:14px;padding:18px;border:1px solid #dce8f7;border-radius:12px;background:#fff}.login{max-width:520px;margin:9vh auto}.login>b{display:grid;place-items:center;width:54px;height:54px;border-radius:12px;background:#1d5cff;color:#fff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.promo-card input,.promo-card textarea,.promo-card select{width:100%;min-height:42px;margin:5px 0 9px;padding:9px;border:1px solid #c9dcea;border-radius:7px;background:#fff}.promo-card textarea{min-height:80px}.promo-card p{padding:9px 0;border-top:1px solid #e3edf5}.promo-card p button{min-height:34px;margin:4px 4px 0 0}@media(max-width:760px){.grid{grid-template-columns:1fr}.promo-admin header{align-items:start;flex-direction:column;gap:12px}}';
    document.head.appendChild(css);
  }
})();
