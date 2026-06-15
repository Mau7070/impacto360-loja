(function () {
  "use strict";

  if (window.__impacto360HotfixImagensTextosCeo) return;
  window.__impacto360HotfixImagensTextosCeo = true;

  const OVERRIDES_KEY = "impacto360:anuncios-overrides-ceo:v2";
  const MANUAL_KEY = "ai360:manualProducts";
  const CONTROL_KEY = "impacto360:controle-anuncios-ceo:v2";
  const PLACEHOLDER = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" rx="42" fill="#f4f8fb"/><rect x="74" y="74" width="1052" height="752" rx="34" fill="#fff" stroke="#d8e8f7" stroke-width="6"/><circle cx="408" cy="360" r="80" fill="#d8ecff"/><path d="M245 668l220-232 150 158 106-112 238 186H245z" fill="#d7f2ef"/><g fill="#476173" font-family="Arial,sans-serif" text-anchor="middle"><text x="600" y="278" font-size="52" font-weight="700">Imagem em revisao</text><text x="600" y="344" font-size="32">Insira uma foto real antes de publicar</text></g></svg>');
  const BAD_IMAGE = /^(?:COLOCAR|LINK_|URL_|#|\s*$)|placeholder|sem[-_ ]?imagem|mercado-livre\.svg|produto\.svg|\/assets\/placeholder/i;
  const state = { activeId: "", suggestion: null, observer: null };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  function init() {
    injectCss();
    installImageFallback();
    normalizeProducts();
    repairCards();
    fixVisibleText();
    removeLegacyAssistantReferences();
    observeChanges();
    renderAdminButton();
    window.resolveProductImage = resolveProductImage;
    window.__impacto360Anuncios = { list: editableProducts, saveAd, archiveAd, trashAd, restoreAd, deleteAdPermanently, exportControl, normalizeProducts, resolveProductImage };
    setTimeout(function () { normalizeProducts(); repairCards(); fixVisibleText(); removeLegacyAssistantReferences(); }, 900);
  }

  function resolveProductImage(product) {
    const sources = [
      product && product.fotoPrincipal,
      product && product.imagemPrincipal,
      product && product.image,
      firstImage(product && product.galeria),
      firstImage(product && product.fotosExtras),
      product && product.imagem,
      product && product.thumbnail
    ];
    return sources.map(cleanImagePath).find(isGoodImage) || PLACEHOLDER;
  }

  function cleanImagePath(value) {
    let src = text(value).replace(/\\/g, "/");
    if (!src) return "";
    src = src.replace(/^(https?:\/\/[^/]+)\/public\/produtos-impacto360\//i, "$1/produtos-impacto360/");
    src = src.replace(/^\/public\/produtos-impacto360\//i, "/produtos-impacto360/");
    src = src.replace(/^(?:\.\/)?public\/produtos-impacto360\//i, "produtos-impacto360/");
    return src;
  }

  function isGoodImage(value) {
    const src = cleanImagePath(value);
    if (!src || BAD_IMAGE.test(src)) return false;
    return /^data:image\//i.test(src) || /^https?:\/\//i.test(src) || /^(?:\.\/|\.\.\/|\/|produtos-impacto360\/|public\/|imagens\/|images\/|assets\/)/i.test(src) || /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(src);
  }

  function normalizeProducts() {
    const overrides = readJson(OVERRIDES_KEY, {});
    const products = getProducts();
    products.forEach(function (product) {
      if (!product || !product.id) return;
      Object.assign(product, overrides[product.id] || {});
      fixObject(product);
      normalizeProduct(product);
    });
    localStorage.setItem(CONTROL_KEY, JSON.stringify(buildControl(products)));
    return products;
  }

  function normalizeProduct(product) {
    const image = resolveProductImage(product);
    const hasRealImage = image !== PLACEHOLDER;
    const gallery = unique([image].concat(toArray(product.galeria), toArray(product.fotosExtras)).map(cleanImagePath)).filter(isGoodImage);
    product.fotoPrincipal = hasRealImage ? cleanImagePath(product.fotoPrincipal || image) : PLACEHOLDER;
    product.imagemPrincipal = hasRealImage ? cleanImagePath(product.imagemPrincipal || image) : PLACEHOLDER;
    product.image = hasRealImage ? cleanImagePath(product.image || image) : PLACEHOLDER;
    product.galeria = gallery.filter(function (src) { return src !== PLACEHOLDER; });
    product.fotosExtras = product.galeria;
    product.statusImagem = hasRealImage ? (product.statusImagem || "imagem_revisar") : "imagem_manual_necessaria";
    product.qualidadeImagem = hasRealImage ? (product.qualidadeImagem || "revisar") : "indefinida";
    product.imagemEditavel = true;
    product.imagemAtualizadaPor = product.imagemAtualizadaPor || "ChatGPT CEO";
    product.statusAnuncio = product.statusAnuncio || statusFor(product);
    return product;
  }

  function repairCards() {
    const byName = new Map();
    editableProducts().forEach(function (product) {
      const key = normalizeKey(product.name || product.nome || product.title || product.titulo || product.id);
      if (key && !byName.has(key)) byName.set(key, product);
    });
    document.querySelectorAll(".product-card").forEach(function (card) {
      const title = normalizeKey((card.querySelector(".product-info h3,h3") || {}).textContent || "");
      const product = byName.get(title);
      const media = card.querySelector(".product-media");
      const image = media && media.querySelector("img");
      if (!media || !image) return;
      media.setAttribute("data-ceo-stable-media", "true");
      image.removeAttribute("srcset");
      image.onerror = null;
      image.loading = "lazy";
      image.decoding = "async";
      const fixedCurrent = cleanImagePath(image.getAttribute("src"));
      const next = product ? resolveProductImage(product) : (isGoodImage(fixedCurrent) ? fixedCurrent : PLACEHOLDER);
      if ((image.getAttribute("src") || "") !== next) image.setAttribute("src", next);
      if (next === PLACEHOLDER) {
        image.dataset.ceoPlaceholder = "true";
        card.dataset.status = "revisar";
      }
    });
  }

  function installImageFallback() {
    document.addEventListener("error", function (event) {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.closest(".product-card")) return;
      const original = img.dataset.originalSrc || img.getAttribute("src") || "";
      const fixed = cleanImagePath(original);
      if (!img.dataset.ceoRetried && fixed && fixed !== original && isGoodImage(fixed)) {
        img.dataset.ceoRetried = "true";
        img.src = fixed;
        return;
      }
      if (img.dataset.ceoFallbackApplied === "true") return;
      img.dataset.ceoFallbackApplied = "true";
      img.removeAttribute("srcset");
      img.src = PLACEHOLDER;
      img.alt = img.alt || "Imagem em revisao";
    }, true);
  }

  function editableProducts() {
    const map = new Map();
    getProducts().concat(readJson(MANUAL_KEY, [])).forEach(function (product) {
      if (product && product.id) map.set(product.id, Object.assign({}, product));
    });
    const overrides = readJson(OVERRIDES_KEY, {});
    Object.keys(overrides).forEach(function (id) { map.set(id, Object.assign({}, map.get(id) || { id: id }, overrides[id])); });
    return Array.from(map.values()).map(function (product) { fixObject(product); return normalizeProduct(product); });
  }

  function buildControl(products) {
    return (products || editableProducts()).map(function (product) {
      return {
        produtoId: text(product.id),
        titulo: text(product.name || product.nome || product.title || product.titulo),
        statusAnuncio: statusFor(product),
        fotoPrincipal: resolveProductImage(product),
        statusImagem: resolveProductImage(product) === PLACEHOLDER ? "imagem_manual_necessaria" : text(product.statusImagem || "imagem_revisar"),
        descricaoCurta: description(product).slice(0, 180),
        descricaoCompleta: text(product.fullDescription || product.descricaoCompleta || product.descricaoDetalhada),
        linkCompra: productLink(product),
        statusLink: productLink(product) ? "ok" : "pendente_link",
        editavelManual: true,
        editavelPorChatGPT: true,
        observacoes: text(product.observacoes || product.observation || "")
      };
    });
  }

  function statusFor(product) {
    const explicit = text(product.statusAnuncio || product.status);
    if (["arquivado", "lixeira", "inativo"].includes(explicit)) return explicit;
    if (resolveProductImage(product) === PLACEHOLDER) return "pendente_foto";
    if (!productLink(product)) return "pendente_link";
    if (description(product).length < 24) return "pendente_descricao";
    return "ativo";
  }

  function renderAdminButton() {
    if (!isAdminRoute() || document.getElementById("impacto360AdEditorLauncher")) return;
    const button = document.createElement("button");
    button.id = "impacto360AdEditorLauncher";
    button.className = "ad-editor-launcher";
    button.type = "button";
    button.innerHTML = "<strong>CEO</strong><span>Anuncios</span>";
    button.setAttribute("aria-label", "Abrir editor de anuncios do ChatGPT CEO");
    button.addEventListener("click", function () { openEditor(); });
    document.body.appendChild(button);
  }

  function openEditor(id) {
    state.activeId = id || state.activeId;
    const old = document.getElementById("impacto360AdEditorPanel");
    if (old) old.remove();
    const products = editableProducts();
    const selected = products.find(function (product) { return product.id === state.activeId; }) || products[0] || emptyProduct();
    state.activeId = selected.id;
    const panel = document.createElement("aside");
    panel.id = "impacto360AdEditorPanel";
    panel.className = "ad-editor-panel";
    panel.innerHTML = '<header><div><span>Impacto360 AI Commerce CEO</span><h2>Editor de anuncios</h2></div><button type="button" data-close-editor>x</button></header>' +
      '<section class="ad-editor-toolbar"><button type="button" data-new-ad>Novo anuncio</button><button type="button" data-export-control>Exportar controle</button><input data-ad-search placeholder="Buscar anuncio"></section>' +
      '<div class="ad-editor-layout"><nav class="ad-editor-list">' + renderProductList(products, selected.id) + '</nav><form class="ad-editor-form" data-ad-form>' + renderForm(selected) + '</form></div>';
    document.body.appendChild(panel);
    bindEditor(panel);
  }

  function renderProductList(products, selectedId) {
    return products.slice(0, 180).map(function (product) {
      return '<button type="button" class="' + (product.id === selectedId ? 'active' : '') + '" data-edit-ad="' + escapeAttr(product.id) + '"><b>' + escapeHtml(product.name || product.nome || product.id) + '</b><span>' + escapeHtml(product.category || product.categoria || 'Sem categoria') + ' - ' + escapeHtml(statusFor(product)) + '</span></button>';
    }).join("") || "<p>Nenhum anuncio encontrado.</p>";
  }

  function renderForm(product) {
    const image = resolveProductImage(product) === PLACEHOLDER ? "" : resolveProductImage(product);
    const statuses = ["ativo", "revisar", "pendente", "pendente_foto", "pendente_link", "pendente_descricao", "pendente_video", "arquivado", "lixeira", "inativo"];
    return [
      input("id", product.id, "id do produto"), input("name", product.name || product.nome || product.title, "titulo / nome"), input("marca", product.marca || product.brand, "marca"), input("modelo", product.modelo || product.model, "modelo"), input("category", product.category || product.categoria, "categoria"), input("subcategoria", product.subcategoria || product.subcategory, "subcategoria"),
      area("description", product.description || product.descricaoCurta || product.descricao, "descricao curta"), area("fullDescription", product.fullDescription || product.descricaoCompleta || product.descricaoDetalhada, "descricao completa"), area("beneficios", toArray(product.beneficios || product.benefits).join("\n"), "beneficios"), area("specs", toArray(product.specs || product.especificacoes).join("\n"), "especificacoes"),
      input("price", product.price || product.preco, "preco"), input("precoAnterior", product.precoAnterior || product.oldPrice, "preco antigo"), input("desconto", product.desconto || product.discount, "desconto"), input("parcelas", product.parcelas, "parcelas"), input("frete", product.frete, "frete"),
      input("linkPlataforma", productLink(product), "link de compra / afiliado"), input("linkOriginal", product.linkOriginal || product.link_original_afiliado, "link original"), input("fotoPrincipal", image, "foto principal"), area("galeria", toArray(product.galeria || product.fotosExtras).map(cleanImagePath).filter(isGoodImage).join("\n"), "galeria de fotos"), area("videos", toArray(product.videos || product.videosExtras || product.videoPrincipal).join("\n"), "videos"),
      area("textoWhatsApp", product.textoWhatsApp || product.legendaWhatsApp, "texto para WhatsApp"), area("legendaInstagram", product.legendaInstagram, "legenda Instagram"), area("legendaFacebook", product.legendaFacebook, "legenda Facebook"), input("hashtags", toArray(product.hashtags).join(" "), "hashtags"),
      '<select name="statusAnuncio">' + statuses.map(function (status) { return '<option value="' + status + '" ' + (statusFor(product) === status || product.statusAnuncio === status ? 'selected' : '') + '>' + status + '</option>'; }).join("") + '</select>',
      area("observacoes", product.observacoes || product.observation, "observacoes"),
      '<section class="ad-editor-ai"><h3>ChatGPT CEO</h3><div><button type="button" data-ceo-suggest="descricao">Melhorar descricao</button><button type="button" data-ceo-suggest="postagem">Gerar postagem</button><button type="button" data-ceo-suggest="imagem">Revisar imagem</button><button type="button" data-ceo-suggest="categoria">Sugerir categoria</button><button type="button" data-ceo-suggest="pendencias">Marcar pendencias</button><button type="button" data-apply-suggestion>Aplicar sugestao</button></div><textarea data-ceo-suggestion placeholder="Sugestoes aparecem aqui para aprovacao."></textarea></section>',
      '<footer class="ad-editor-actions"><button type="submit">Salvar anuncio</button><button type="button" data-archive-ad>Arquivar</button><button type="button" data-trash-ad>Lixeira</button><button type="button" data-restore-ad>Restaurar</button><button type="button" data-delete-ad>Excluir definitivo</button></footer>'
    ].join("");
  }

  function bindEditor(panel) {
    panel.querySelector("[data-close-editor]").addEventListener("click", function () { panel.remove(); });
    panel.querySelector("[data-new-ad]").addEventListener("click", function () { openEditor("manual-" + Date.now()); });
    panel.querySelector("[data-export-control]").addEventListener("click", exportControl);
    panel.querySelector("[data-ad-form]").addEventListener("submit", function (event) { event.preventDefault(); const product = saveAd(Object.fromEntries(new FormData(event.currentTarget).entries())); openEditor(product.id); toast("Anuncio salvo."); });
    panel.querySelectorAll("[data-edit-ad]").forEach(function (button) { button.addEventListener("click", function () { openEditor(button.dataset.editAd); }); });
    panel.querySelector("[data-ad-search]").addEventListener("input", debounce(function (event) { const term = normalizeKey(event.target.value); const list = editableProducts().filter(function (product) { return normalizeKey(JSON.stringify(product)).includes(term); }); panel.querySelector(".ad-editor-list").innerHTML = renderProductList(list, state.activeId); panel.querySelectorAll("[data-edit-ad]").forEach(function (button) { button.addEventListener("click", function () { openEditor(button.dataset.editAd); }); }); }, 120));
    panel.querySelectorAll("[data-ceo-suggest]").forEach(function (button) { button.addEventListener("click", function () { suggest(button.dataset.ceoSuggest, panel); }); });
    panel.querySelector("[data-apply-suggestion]").addEventListener("click", function () { applySuggestion(panel); });
    panel.querySelector("[data-archive-ad]").addEventListener("click", function () { updateStatus(formId(panel), "arquivado"); openEditor(formId(panel)); });
    panel.querySelector("[data-trash-ad]").addEventListener("click", function () { updateStatus(formId(panel), "lixeira"); openEditor(formId(panel)); });
    panel.querySelector("[data-restore-ad]").addEventListener("click", function () { updateStatus(formId(panel), "revisar"); openEditor(formId(panel)); });
    panel.querySelector("[data-delete-ad]").addEventListener("click", function () { if (!confirm("Tem certeza que deseja excluir este anuncio?")) return; if (!confirm("Esta acao e definitiva. Deseja continuar?")) return; deleteAdPermanently(formId(panel)); openEditor(); });
  }

  function saveAd(fields) {
    const id = text(fields.id) || "manual-" + Date.now();
    const gallery = unique([fields.fotoPrincipal].concat(toArray(fields.galeria)).map(cleanImagePath)).filter(isGoodImage);
    const product = { id: id, name: fixMojibake(fields.name), nome: fixMojibake(fields.name), marca: fixMojibake(fields.marca), modelo: fixMojibake(fields.modelo), category: fixMojibake(fields.category), categoria: fixMojibake(fields.category), subcategoria: fixMojibake(fields.subcategoria), description: fixMojibake(fields.description), descricaoCurta: fixMojibake(fields.description), fullDescription: fixMojibake(fields.fullDescription), descricaoCompleta: fixMojibake(fields.fullDescription), beneficios: toArray(fields.beneficios).map(fixMojibake), specs: toArray(fields.specs).map(fixMojibake), price: text(fields.price || "Sob consulta"), preco: text(fields.price || "Sob consulta"), precoAnterior: text(fields.precoAnterior), desconto: text(fields.desconto), parcelas: text(fields.parcelas), frete: fixMojibake(fields.frete), linkPlataforma: text(fields.linkPlataforma), affiliateLink: text(fields.linkPlataforma), linkOriginal: text(fields.linkOriginal), fotoPrincipal: cleanImagePath(fields.fotoPrincipal), imagemPrincipal: cleanImagePath(fields.fotoPrincipal), image: cleanImagePath(fields.fotoPrincipal), galeria: gallery, fotosExtras: gallery, videos: toArray(fields.videos), textoWhatsApp: fixMojibake(fields.textoWhatsApp), legendaInstagram: fixMojibake(fields.legendaInstagram), legendaFacebook: fixMojibake(fields.legendaFacebook), hashtags: toArray(fields.hashtags), statusAnuncio: text(fields.statusAnuncio), status: text(fields.statusAnuncio), observacoes: fixMojibake(fields.observacoes), editavelManual: true, editavelPorChatGPT: true, atualizadoEm: new Date().toISOString() };
    const overrides = readJson(OVERRIDES_KEY, {});
    overrides[id] = Object.assign({}, overrides[id] || {}, product);
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    if (!getProducts().some(function (item) { return item.id === id; })) {
      const manual = readJson(MANUAL_KEY, []).filter(function (item) { return item.id !== id; });
      manual.push(product);
      localStorage.setItem(MANUAL_KEY, JSON.stringify(manual));
      try { if (typeof window.__impacto360AddManualProduct === "function") window.__impacto360AddManualProduct(product); } catch (error) {}
    } else Object.assign(getProducts().find(function (item) { return item.id === id; }) || {}, product);
    normalizeProducts(); refreshCatalog(); return product;
  }

  function updateStatus(id, status) { const product = editableProducts().find(function (item) { return item.id === id; }) || { id: id }; return saveAd({ id: id, name: product.name || product.nome, category: product.category || product.categoria, description: product.description || product.descricaoCurta, fullDescription: product.fullDescription || product.descricaoCompleta, price: product.price || product.preco, linkPlataforma: productLink(product), linkOriginal: product.linkOriginal || product.link_original_afiliado, fotoPrincipal: resolveProductImage(product) === PLACEHOLDER ? "" : resolveProductImage(product), galeria: toArray(product.galeria || product.fotosExtras).join("\n"), statusAnuncio: status, observacoes: product.observacoes }); }
  function archiveAd(id) { return updateStatus(id, "arquivado"); }
  function trashAd(id) { return updateStatus(id, "lixeira"); }
  function restoreAd(id) { return updateStatus(id, "revisar"); }
  function deleteAdPermanently(id) { localStorage.setItem(MANUAL_KEY, JSON.stringify(readJson(MANUAL_KEY, []).filter(function (item) { return item.id !== id; }))); updateStatus(id, "lixeira"); }

  function suggest(kind, panel) {
    const fields = Object.fromEntries(new FormData(panel.querySelector("[data-ad-form]")).entries());
    const missing = [];
    if (!text(fields.fotoPrincipal)) missing.push("foto principal");
    if (!text(fields.linkPlataforma)) missing.push("link de compra");
    if (text(fields.description).length < 24) missing.push("descricao curta");
    let target = "observacoes";
    let value = "";
    if (kind === "descricao") { target = "description"; value = (text(fields.description) || "Informacao pendente de cadastro. Verifique os dados na plataforma antes da compra.") + " Boa opcao para quem procura praticidade e custo-beneficio. Confira os detalhes antes de comprar."; }
    if (kind === "postagem") { target = "textoWhatsApp"; value = "Confira esta selecao no Shopping Impacto360: " + (text(fields.name) || "produto em destaque") + ". Conteudo pode conter link de afiliado. " + (text(fields.linkPlataforma) ? "Acesse pelo link cadastrado." : "Link pendente de cadastro."); }
    if (kind === "imagem") value = text(fields.fotoPrincipal) ? "Conferir manualmente se a foto corresponde ao mesmo produto, marca e modelo." : "Foto principal pendente. Nao publicar como pronto ate inserir imagem real.";
    if (kind === "categoria") { target = "category"; value = suggestCategory(fields); }
    if (kind === "pendencias") value = missing.length ? "Pendencias encontradas: " + missing.join(", ") + "." : "Dados minimos presentes. Revisar visualmente antes da campanha.";
    state.suggestion = { target: target, value: value };
    panel.querySelector("[data-ceo-suggestion]").value = value;
  }

  function applySuggestion(panel) { if (!state.suggestion) return toast("Gere uma sugestao antes de aplicar."); const field = panel.querySelector('[name="' + state.suggestion.target + '"]'); if (field) field.value = state.suggestion.value; toast("Sugestao aplicada. Revise e salve."); }
  function suggestCategory(fields) { const h = normalizeKey([fields.name, fields.description, fields.category].join(" ")); if (/iphone|samsung|motorola|smartphone|celular/.test(h)) return "Celulares"; if (/notebook|computador|pc|monitor|teclado|mouse|ssd|memoria/.test(h)) return "Computadores"; if (/tenis|sapato|sandalia|bota/.test(h)) return "Calcados"; if (/casa|cozinha|moveis|decor/.test(h)) return "Casa e Cozinha"; return text(fields.category || "Ofertas"); }
  function exportControl() { const blob = new Blob([JSON.stringify(buildControl(editableProducts()), null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "controle-anuncios-chatgpt-ceo.json"; a.click(); URL.revokeObjectURL(url); }

  function fixObject(obj, depth) { if (!obj || typeof obj !== "object" || depth > 4) return obj; Object.keys(obj).forEach(function (key) { const value = obj[key]; if (typeof value === "string") obj[key] = /link|url|href|src|image|imagem|foto|video|thumbnail/i.test(key) ? cleanImagePath(value) : fixMojibake(value); else if (Array.isArray(value)) obj[key] = value.map(function (item) { return typeof item === "string" ? (/link|url|href|src|image|imagem|foto|video|thumbnail/i.test(key) ? cleanImagePath(item) : fixMojibake(item)) : item; }); else if (value && typeof value === "object") fixObject(value, (depth || 0) + 1); }); return obj; }
  function fixVisibleText() { if (!document.body) return; ["alt", "title", "aria-label", "placeholder"].forEach(function (attr) { document.querySelectorAll("[" + attr + "]").forEach(function (el) { const before = el.getAttribute(attr); const after = fixMojibake(before); if (before !== after) el.setAttribute(attr, after); }); }); const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { const parent = node.parentElement; if (!parent || /SCRIPT|STYLE/.test(parent.tagName)) return NodeFilter.FILTER_REJECT; return hasMojibake(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; } }); const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode); nodes.forEach(function (node) { node.nodeValue = fixMojibake(node.nodeValue); }); }
  function hasMojibake(value) { return /[\u00c3\u00c2\u00e2\ufffd]/.test(String(value || "")); }
  function fixMojibake(value) { const original = String(value == null ? "" : value); if (!hasMojibake(original) || /^https?:\/\//i.test(original)) return original; let result = original; for (let i = 0; i < 2; i++) { try { const chars = Array.from(result); if (!chars.every(function (ch) { return ch.charCodeAt(0) <= 255; })) break; const decoded = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(chars.map(function (ch) { return ch.charCodeAt(0); }))); if (!decoded || decoded === result || /\ufffd/.test(decoded)) break; result = decoded.replace(/\u00a0/g, " "); } catch (error) { break; } } return result.replace(/\u00c3\u00a1/g, "\u00e1").replace(/\u00c3\u00a0/g, "\u00e0").replace(/\u00c3\u00a3/g, "\u00e3").replace(/\u00c3\u00a7/g, "\u00e7").replace(/\u00c3\u00a9/g, "\u00e9").replace(/\u00c3\u00aa/g, "\u00ea").replace(/\u00c3\u00ad/g, "\u00ed").replace(/\u00c3\u00b3/g, "\u00f3").replace(/\u00c3\u00ba/g, "\u00fa").replace(/\u00c2/g, ""); }
  function removeLegacyAssistantReferences() { const pattern = new RegExp(["M\\u00f4nica", "m\\u00f4nica", "M" + "onica", "m" + "onica", "M\\u00c3\\u00b4nica", "m\\u00c3\\u00b4nica"].join("|"), "gi"); try { Object.keys(localStorage).forEach(function (key) { const before = localStorage.getItem(key) || ""; const after = before.replace(pattern, "ChatGPT CEO"); if (before !== after) localStorage.setItem(key, after); }); } catch (error) {} }
  function observeChanges() { if (state.observer) state.observer.disconnect(); state.observer = new MutationObserver(debounce(function () { repairCards(); fixVisibleText(); removeLegacyAssistantReferences(); }, 140)); state.observer.observe(document.documentElement, { childList: true, subtree: true }); }
  function getProducts() { try { return typeof window.__impacto360GetProducts === "function" ? (window.__impacto360GetProducts() || []) : []; } catch (error) { return []; } }
  function refreshCatalog() { try { if (typeof window.__impacto360RefreshShopping === "function") window.__impacto360RefreshShopping(); } catch (error) {} repairCards(); fixVisibleText(); }
  function isAdminRoute() { const route = new URLSearchParams(location.search).get("route") || location.pathname; return /\/admin\//.test(route); }
  function firstImage(value) { return toArray(value).map(cleanImagePath).find(isGoodImage) || ""; }
  function productLink(product) { return text(product.linkPlataforma || product.affiliateLink || product.linkOriginal || product.link_original_afiliado || product.linkAfiliado || product.url); }
  function description(product) { return fixMojibake(product.description || product.descricaoCurta || product.descricao || product.fullDescription || product.descricaoCompleta || product.descricaoDetalhada); }
  function input(name, value, placeholder) { return '<input name="' + name + '" value="' + esc(value || "") + '" placeholder="' + esc(placeholder) + '">'; }
  function area(name, value, placeholder) { return '<textarea name="' + name + '" placeholder="' + esc(placeholder) + '">' + esc(value || "") + '</textarea>'; }
  function formId(panel) { return text(panel.querySelector('[name="id"]') && panel.querySelector('[name="id"]').value); }
  function emptyProduct() { return { id: "manual-" + Date.now(), name: "", category: "", description: "" }; }
  function toArray(value) { return Array.isArray(value) ? value : String(value || "").split(/\n|,/).map(function (item) { return item.trim(); }).filter(Boolean); }
  function unique(values) { return Array.from(new Set(values.map(text).filter(Boolean))); }
  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function normalizeKey(value) { return fixMojibake(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
  function debounce(fn, wait) { let timer; return function () { const args = arguments; clearTimeout(timer); timer = setTimeout(function () { fn.apply(null, args); }, wait); }; }
  function toast(message) { if (typeof window.showToast === "function") window.showToast(message); else alert(message); }
  function esc(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  const escapeHtml = esc;
  const escapeAttr = esc;

  function injectCss() { if (document.getElementById("impacto360HotfixCss")) return; const style = document.createElement("style"); style.id = "impacto360HotfixCss"; style.textContent = ".product-media[data-ceo-stable-media=true]{position:relative!important;display:grid!important;place-items:center!important;min-height:220px!important;aspect-ratio:1/1!important;overflow:hidden!important;background:linear-gradient(145deg,#f7fbff,#eef6fb)!important}.product-media[data-ceo-stable-media=true]::before,.product-media[data-ceo-stable-media=true]::after{animation:none!important;content:none!important}.product-media[data-ceo-stable-media=true] img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;padding:16px!important;background:transparent!important;animation:none!important;opacity:1!important;filter:none!important}.ad-editor-launcher{position:fixed;right:18px;bottom:174px;z-index:9998;width:82px;height:68px;border:1px solid rgba(255,255,255,.55);border-radius:18px;background:linear-gradient(135deg,#08264d,#17a7bb);color:#fff;box-shadow:0 18px 42px rgba(6,36,74,.24);cursor:pointer;font:800 11px Inter,system-ui,sans-serif;display:grid;place-items:center}.ad-editor-launcher strong{font-size:18px}.ad-editor-launcher span{font-size:10px;text-transform:uppercase}.ad-editor-panel{position:fixed;inset:18px;z-index:10000;background:#f7fbff;color:#0b1d33;border:1px solid rgba(29,124,255,.22);border-radius:8px;box-shadow:0 24px 90px rgba(2,20,45,.28);font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden}.ad-editor-panel header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#fff,#edf9fb);border-bottom:1px solid #dce8f7}.ad-editor-panel header span{font-size:11px;font-weight:950;color:#138b9b;text-transform:uppercase}.ad-editor-panel h2{margin:2px 0 0;font-size:20px}.ad-editor-panel header button{width:38px;height:38px;border:0;border-radius:8px;background:#fff;color:#123;font-weight:950;cursor:pointer}.ad-editor-toolbar{display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid #dce8f7;background:#fff}.ad-editor-toolbar input{flex:1}.ad-editor-toolbar button,.ad-editor-form button{border:0;border-radius:8px;min-height:40px;padding:0 12px;background:#1d7cff;color:#fff;font-weight:900;cursor:pointer}.ad-editor-layout{display:grid;grid-template-columns:minmax(220px,330px) 1fr;min-height:0;flex:1}.ad-editor-list{overflow:auto;border-right:1px solid #dce8f7;background:#fff;padding:10px}.ad-editor-list button{display:block;width:100%;text-align:left;border:1px solid #e5edf7;background:#fff;border-radius:8px;padding:10px;margin-bottom:8px;cursor:pointer}.ad-editor-list button.active{border-color:#1d7cff;background:#eef6ff}.ad-editor-list b,.ad-editor-list span{display:block}.ad-editor-list span{font-size:12px;color:#607083;margin-top:3px}.ad-editor-form{overflow:auto;padding:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ad-editor-form input,.ad-editor-form textarea,.ad-editor-form select,.ad-editor-toolbar input{border:1px solid rgba(56,91,130,.22);border-radius:8px;min-height:42px;padding:10px;font:inherit;background:#fff}.ad-editor-form textarea{min-height:82px}.ad-editor-form textarea[name=fullDescription],.ad-editor-form textarea[name=observacoes],.ad-editor-ai,.ad-editor-actions{grid-column:1/-1}.ad-editor-ai{border:1px solid #dce8f7;background:#fff;border-radius:8px;padding:12px}.ad-editor-ai h3{margin:0 0 8px}.ad-editor-ai div,.ad-editor-actions{display:flex;gap:8px;flex-wrap:wrap}.ad-editor-ai textarea{width:100%;margin-top:8px;min-height:92px}.ad-editor-actions{position:sticky;bottom:0;background:#f7fbff;padding:10px 0}.ad-editor-actions button:nth-child(3),.ad-editor-actions button:nth-child(5){background:#a9442f}@media(max-width:860px){.ad-editor-panel{inset:8px}.ad-editor-layout,.ad-editor-form{grid-template-columns:1fr}.ad-editor-list{max-height:190px;border-right:0;border-bottom:1px solid #dce8f7}.ad-editor-toolbar{flex-wrap:wrap}.ad-editor-toolbar input{flex:1 1 100%}.ad-editor-launcher{right:12px;bottom:148px}}"; document.head.appendChild(style); }
})();
