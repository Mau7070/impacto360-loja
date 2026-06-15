(function () {
  "use strict";

  if (window.__impacto360FotosAnunciosCeoLoaded) return;
  window.__impacto360FotosAnunciosCeoLoaded = true;

  const MANUAL_KEY = "ai360:manualProducts";
  const OVERRIDES_KEY = "impacto360:anuncios-overrides-ceo:v1";
  const CONTROL_KEY = "impacto360:controle-anuncios-ceo:v1";
  const PLACEHOLDER = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" rx="44" fill="#f4f8fb"/><rect x="70" y="70" width="1060" height="760" rx="36" fill="#fff" stroke="#d7e7f7" stroke-width="6"/><circle cx="410" cy="365" r="82" fill="#d9ecff"/><path d="M245 672l220-235 150 160 105-112 240 187H245z" fill="#d7f2ef"/><g fill="#476173" font-family="Arial,sans-serif" text-anchor="middle"><text x="600" y="278" font-size="52" font-weight="700">Imagem em revisao</text><text x="600" y="344" font-size="32">Insira uma foto real antes de publicar</text></g></svg>');
  const INVALID_IMAGE = /^(?:COLOCAR|LINK_|URL_|#|\s*$)|placeholder|sem[-_ ]?imagem|mercado-livre\.svg|produto\.svg|\/assets\/placeholder/i;
  const state = { activeId: "", suggestion: null, observer: null };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  function init() {
    injectStyles();
    installBrokenImageFallback();
    normalizeProducts();
    repairCards();
    removeLegacyAssistantReferences();
    observeDom();
    renderAdminLauncher();
    window.resolveProductImage = resolveProductImage;
    window.__impacto360Anuncios = { list: editableProducts, saveAd, archiveAd, trashAd, restoreAd, deleteAdPermanently, buildControl, exportControl, resolveProductImage, normalizeProducts };
    setTimeout(function () { normalizeProducts(); repairCards(); removeLegacyAssistantReferences(); }, 800);
  }

  function resolveProductImage(product) {
    const candidates = [
      product && product.fotoPrincipal,
      product && product.imagemPrincipal,
      product && product.image,
      firstUsable(product && product.galeria),
      firstUsable(product && product.fotosExtras),
      product && product.imagem,
      product && product.thumbnail
    ];
    return candidates.map(text).find(isUsableImage) || PLACEHOLDER;
  }

  function isUsableImage(value) {
    const src = text(value);
    if (!src || INVALID_IMAGE.test(src)) return false;
    return /^data:image\//i.test(src) || /^https?:\/\//i.test(src) || /^(?:\.\/|\.\.\/|\/|public\/|imagens\/|images\/|produtos-impacto360\/|assets\/)/i.test(src) || /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(src);
  }

  function normalizeProducts() {
    const products = getProducts();
    const overrides = readJson(OVERRIDES_KEY, {});
    products.forEach(function (product) {
      if (!product || !product.id) return;
      Object.assign(product, overrides[product.id] || {});
      normalizeProduct(product);
    });
    localStorage.setItem(CONTROL_KEY, JSON.stringify(buildControl(products)));
    return products;
  }

  function normalizeProduct(product) {
    const image = resolveProductImage(product);
    const hasImage = image !== PLACEHOLDER;
    const gallery = unique([hasImage ? image : ""].concat(toArray(product.galeria), toArray(product.fotosExtras))).filter(isUsableImage);
    product.fotoPrincipal = hasImage ? (product.fotoPrincipal || image) : PLACEHOLDER;
    product.imagemPrincipal = hasImage ? (product.imagemPrincipal || image) : PLACEHOLDER;
    product.image = hasImage ? (product.image || image) : PLACEHOLDER;
    product.galeria = gallery;
    product.fotosExtras = gallery;
    product.statusImagem = hasImage ? (product.statusImagem || "imagem_revisar") : "imagem_manual_necessaria";
    product.qualidadeImagem = hasImage ? (product.qualidadeImagem || "revisar") : "indefinida";
    product.imagemEditavel = true;
    product.imagemAtualizadaPor = product.imagemAtualizadaPor || "ChatGPT CEO";
    product.statusAnuncio = product.statusAnuncio || computeStatus(product);
    product.statusPostagem = product.statusPostagem || (product.statusAnuncio === "ativo" ? "pronto" : "revisar");
    return product;
  }

  function computeStatus(product) {
    const current = text(product.statusAnuncio || product.status);
    if (["arquivado", "lixeira", "inativo"].includes(current)) return current;
    if (resolveProductImage(product) === PLACEHOLDER) return "pendente_foto";
    if (!productLink(product)) return "pendente_link";
    if (description(product).length < 24) return "pendente_descricao";
    return "ativo";
  }

  function buildControl(products) {
    return (products || editableProducts()).map(function (product) {
      return {
        produtoId: text(product.id),
        titulo: text(product.name || product.nome || product.title || product.titulo),
        statusAnuncio: computeStatus(product),
        fotoPrincipal: resolveProductImage(product),
        statusImagem: resolveProductImage(product) === PLACEHOLDER ? "imagem_manual_necessaria" : text(product.statusImagem || "imagem_revisar"),
        descricaoCurta: description(product).slice(0, 180),
        descricaoCompleta: text(product.fullDescription || product.descricaoCompleta || product.descricaoDetalhada),
        linkCompra: productLink(product),
        statusLink: productLink(product) ? "ok" : "pendente_link",
        editavelManual: true,
        editavelPorChatGPT: true,
        ultimaAcao: text(product.ultimaAcao || "revisao_automatica_local"),
        observacoes: text(product.observacoes || product.observation || "")
      };
    });
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
      image.loading = "lazy";
      image.decoding = "async";
      image.onerror = null;
      const src = product ? resolveProductImage(product) : (isUsableImage(image.getAttribute("src")) ? image.getAttribute("src") : PLACEHOLDER);
      if ((image.getAttribute("src") || "") !== src) image.setAttribute("src", src);
      if (src === PLACEHOLDER) {
        image.dataset.ceoPlaceholder = "true";
        card.dataset.status = "revisar";
      }
    });
  }

  function installBrokenImageFallback() {
    document.addEventListener("error", function (event) {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.closest(".product-card")) return;
      if (image.dataset.ceoFallbackApplied === "true") return;
      image.dataset.ceoOriginalSrc = image.currentSrc || image.src || "";
      image.dataset.ceoFallbackApplied = "true";
      image.removeAttribute("srcset");
      image.src = PLACEHOLDER;
      image.alt = image.alt || "Imagem em revisao";
    }, true);
  }

  function editableProducts() {
    const byId = new Map();
    getProducts().concat(readJson(MANUAL_KEY, [])).forEach(function (product) {
      if (product && product.id) byId.set(product.id, Object.assign({}, product));
    });
    const overrides = readJson(OVERRIDES_KEY, {});
    Object.keys(overrides).forEach(function (id) { byId.set(id, Object.assign({}, byId.get(id) || { id: id }, overrides[id])); });
    return Array.from(byId.values()).map(normalizeProduct);
  }

  function renderAdminLauncher() {
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

  function openEditor(productId) {
    state.activeId = productId || state.activeId;
    const old = document.getElementById("impacto360AdEditorPanel");
    if (old) old.remove();
    const products = editableProducts();
    const selected = products.find(function (product) { return product.id === state.activeId; }) || products[0] || emptyProduct();
    state.activeId = selected.id;
    const panel = document.createElement("aside");
    panel.id = "impacto360AdEditorPanel";
    panel.className = "ad-editor-panel";
    panel.innerHTML = '<header><div><span>Impacto360 AI Commerce CEO</span><h2>Editor completo de anuncios</h2></div><button type="button" data-close-editor>x</button></header>' +
      '<section class="ad-editor-toolbar"><button type="button" data-new-ad>Novo anuncio</button><button type="button" data-export-control>Exportar controle</button><input data-ad-search placeholder="Buscar anuncio, categoria ou link"></section>' +
      '<div class="ad-editor-layout"><nav class="ad-editor-list">' + renderProductList(products, selected.id) + '</nav><form class="ad-editor-form" data-ad-form>' + renderForm(selected) + '</form></div>';
    document.body.appendChild(panel);
    bindEditor(panel);
  }

  function renderProductList(products, selectedId) {
    return products.slice(0, 180).map(function (product) {
      const title = text(product.name || product.nome || product.id);
      return '<button type="button" class="' + (product.id === selectedId ? 'active' : '') + '" data-edit-ad="' + escapeAttr(product.id) + '"><b>' + escapeHtml(title) + '</b><span>' + escapeHtml(product.category || product.categoria || 'Sem categoria') + ' - ' + escapeHtml(computeStatus(product)) + '</span></button>';
    }).join("") || "<p>Nenhum anuncio encontrado.</p>";
  }

  function renderForm(product) {
    const image = resolveProductImage(product) === PLACEHOLDER ? "" : resolveProductImage(product);
    const link = productLink(product);
    const statuses = ["ativo", "revisar", "pendente", "pendente_foto", "pendente_link", "pendente_descricao", "pendente_video", "arquivado", "lixeira", "inativo"];
    return [
      input("id", product.id, "id do produto"), input("name", product.name || product.nome || product.title, "titulo / nome"), input("marca", product.marca || product.brand, "marca"), input("modelo", product.modelo || product.model, "modelo"), input("category", product.category || product.categoria, "categoria"), input("subcategoria", product.subcategoria || product.subcategory, "subcategoria"),
      area("description", product.description || product.descricaoCurta || product.descricao, "descricao curta"), area("fullDescription", product.fullDescription || product.descricaoCompleta || product.descricaoDetalhada, "descricao completa"), area("beneficios", toArray(product.beneficios || product.benefits).join("\n"), "beneficios, um por linha"), area("specs", toArray(product.specs || product.especificacoes).join("\n"), "especificacoes, uma por linha"),
      input("price", product.price || product.preco, "preco"), input("precoAnterior", product.precoAnterior || product.oldPrice, "preco antigo"), input("desconto", product.desconto || product.discount, "desconto"), input("parcelas", product.parcelas, "parcelas"), input("frete", product.frete, "frete"), input("statusFrete", product.statusFrete, "status do frete"),
      input("linkPlataforma", link, "link da plataforma / link comissionado"), input("linkOriginal", product.linkOriginal || product.link_original_afiliado, "link original"), input("plataformaOrigem", product.plataformaOrigem || product.source, "plataforma de origem"), input("fotoPrincipal", image, "foto principal"), area("galeria", toArray(product.galeria || product.fotosExtras).filter(isUsableImage).join("\n"), "galeria de fotos, uma por linha"), area("videos", toArray(product.videos || product.videosExtras || product.videoPrincipal).join("\n"), "videos, um por linha"),
      area("textoWhatsApp", product.textoWhatsApp || product.legendaWhatsApp, "texto para WhatsApp"), area("legendaInstagram", product.legendaInstagram, "legenda para Instagram"), area("legendaFacebook", product.legendaFacebook, "legenda para Facebook"), input("hashtags", toArray(product.hashtags).join(" "), "hashtags"),
      '<select name="statusAnuncio">' + statuses.map(function (status) { return '<option value="' + status + '" ' + (computeStatus(product) === status || product.statusAnuncio === status ? 'selected' : '') + '>' + status + '</option>'; }).join("") + '</select>',
      area("observacoes", product.observacoes || product.observation, "observacoes internas"),
      '<section class="ad-editor-ai"><h3>Auxilio do ChatGPT CEO</h3><div><button type="button" data-ceo-suggest="descricao">Melhorar descricao com ChatGPT</button><button type="button" data-ceo-suggest="postagem">Gerar postagem com ChatGPT</button><button type="button" data-ceo-suggest="imagem">Revisar imagem com ChatGPT</button><button type="button" data-ceo-suggest="categoria">Sugerir categoria com ChatGPT</button><button type="button" data-ceo-suggest="pendencias">Verificar anuncio incompleto</button><button type="button" data-apply-suggestion>Aplicar sugestao revisada</button></div><textarea data-ceo-suggestion placeholder="As sugestoes aparecem aqui e so sao aplicadas se voce aprovar."></textarea></section>',
      '<footer class="ad-editor-actions"><button type="submit">Salvar anuncio</button><button type="button" data-archive-ad>Arquivar</button><button type="button" data-trash-ad>Mover para lixeira</button><button type="button" data-restore-ad>Restaurar</button><button type="button" data-delete-ad>Excluir definitivamente</button></footer>'
    ].join("");
  }

  function bindEditor(panel) {
    panel.querySelector("[data-close-editor]").addEventListener("click", function () { panel.remove(); });
    panel.querySelector("[data-new-ad]").addEventListener("click", function () { openEditor("manual-" + Date.now()); });
    panel.querySelector("[data-export-control]").addEventListener("click", exportControl);
    panel.querySelector("[data-ad-form]").addEventListener("submit", function (event) { event.preventDefault(); const product = saveAd(Object.fromEntries(new FormData(event.currentTarget).entries())); openEditor(product.id); toast("Anuncio salvo para revisao."); });
    panel.querySelectorAll("[data-edit-ad]").forEach(function (button) { button.addEventListener("click", function () { openEditor(button.dataset.editAd); }); });
    panel.querySelector("[data-ad-search]").addEventListener("input", debounce(function (event) { const term = normalizeKey(event.target.value); const list = editableProducts().filter(function (product) { return normalizeKey(JSON.stringify([product.name, product.category, product.linkPlataforma, product.affiliateLink])).includes(term); }); panel.querySelector(".ad-editor-list").innerHTML = renderProductList(list, state.activeId); panel.querySelectorAll("[data-edit-ad]").forEach(function (button) { button.addEventListener("click", function () { openEditor(button.dataset.editAd); }); }); }, 120));
    panel.querySelectorAll("[data-ceo-suggest]").forEach(function (button) { button.addEventListener("click", function () { suggest(button.dataset.ceoSuggest, panel); }); });
    panel.querySelector("[data-apply-suggestion]").addEventListener("click", function () { applySuggestion(panel); });
    panel.querySelector("[data-archive-ad]").addEventListener("click", function () { archiveAd(formId(panel)); openEditor(formId(panel)); });
    panel.querySelector("[data-trash-ad]").addEventListener("click", function () { trashAd(formId(panel)); openEditor(formId(panel)); });
    panel.querySelector("[data-restore-ad]").addEventListener("click", function () { restoreAd(formId(panel)); openEditor(formId(panel)); });
    panel.querySelector("[data-delete-ad]").addEventListener("click", function () { if (!confirm("Tem certeza que deseja excluir este anuncio?")) return; if (!confirm("Esta acao e definitiva. Deseja continuar?")) return; deleteAdPermanently(formId(panel)); openEditor(); });
  }

  function saveAd(fields) {
    const id = text(fields.id) || "manual-" + Date.now();
    const gallery = unique([fields.fotoPrincipal].concat(toArray(fields.galeria))).filter(isUsableImage);
    const videos = toArray(fields.videos);
    const product = { id: id, name: text(fields.name), nome: text(fields.name), marca: text(fields.marca), modelo: text(fields.modelo), category: text(fields.category), categoria: text(fields.category), subcategoria: text(fields.subcategoria), description: text(fields.description), descricaoCurta: text(fields.description), fullDescription: text(fields.fullDescription), descricaoCompleta: text(fields.fullDescription), beneficios: toArray(fields.beneficios), specs: toArray(fields.specs), price: text(fields.price || "Sob consulta"), preco: text(fields.price || "Sob consulta"), precoAnterior: text(fields.precoAnterior), desconto: text(fields.desconto), parcelas: text(fields.parcelas), frete: text(fields.frete), statusFrete: text(fields.statusFrete), linkPlataforma: text(fields.linkPlataforma), affiliateLink: text(fields.linkPlataforma), linkOriginal: text(fields.linkOriginal), plataformaOrigem: text(fields.plataformaOrigem), source: text(fields.plataformaOrigem), fotoPrincipal: text(fields.fotoPrincipal), imagemPrincipal: text(fields.fotoPrincipal), image: text(fields.fotoPrincipal), galeria: gallery, fotosExtras: gallery, videos: videos, videoPrincipal: videos[0] || "", videosExtras: videos, textoWhatsApp: text(fields.textoWhatsApp), legendaInstagram: text(fields.legendaInstagram), legendaFacebook: text(fields.legendaFacebook), hashtags: toArray(fields.hashtags), statusAnuncio: text(fields.statusAnuncio), status: text(fields.statusAnuncio), observacoes: text(fields.observacoes), editavelManual: true, editavelPorChatGPT: true, ultimaAcao: "salvo_manual_chatgpt_ceo", atualizadoEm: new Date().toISOString(), badge: text(fields.statusAnuncio) === "ativo" ? "Atualizado" : "Revisar" };
    product.statusAnuncio = product.statusAnuncio || computeStatus(product);
    if (getProducts().some(function (item) { return item.id === id; })) {
      const overrides = readJson(OVERRIDES_KEY, {});
      overrides[id] = Object.assign({}, overrides[id] || {}, product);
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      Object.assign(getProducts().find(function (item) { return item.id === id; }) || {}, product);
    } else {
      const manual = readJson(MANUAL_KEY, []).filter(function (item) { return item.id !== id; });
      manual.push(product);
      localStorage.setItem(MANUAL_KEY, JSON.stringify(manual));
      try { if (typeof window.__impacto360AddManualProduct === "function") window.__impacto360AddManualProduct(product); } catch (error) {}
    }
    normalizeProducts(); refreshCatalog(); return product;
  }

  function archiveAd(id) { return updateStatus(id, "arquivado"); }
  function trashAd(id) { return updateStatus(id, "lixeira"); }
  function restoreAd(id) { return updateStatus(id, "revisar"); }
  function deleteAdPermanently(id) { localStorage.setItem(MANUAL_KEY, JSON.stringify(readJson(MANUAL_KEY, []).filter(function (item) { return item.id !== id; }))); updateStatus(id, "lixeira", "exclusao_definitiva_solicitada"); }
  function updateStatus(id, status, action) { const product = editableProducts().find(function (item) { return item.id === id; }) || { id: id }; product.statusAnuncio = status; product.status = status; product.ultimaAcao = action || "status_" + status; return saveAd(productToFields(product)); }

  function productToFields(product) { return { id: product.id, name: product.name || product.nome, marca: product.marca, modelo: product.modelo, category: product.category || product.categoria, subcategoria: product.subcategoria, description: product.description || product.descricaoCurta, fullDescription: product.fullDescription || product.descricaoCompleta, beneficios: toArray(product.beneficios).join("\n"), specs: toArray(product.specs || product.especificacoes).join("\n"), price: product.price || product.preco, precoAnterior: product.precoAnterior, desconto: product.desconto, parcelas: product.parcelas, frete: product.frete, statusFrete: product.statusFrete, linkPlataforma: product.linkPlataforma || product.affiliateLink, linkOriginal: product.linkOriginal || product.link_original_afiliado, plataformaOrigem: product.plataformaOrigem || product.source, fotoPrincipal: resolveProductImage(product) === PLACEHOLDER ? "" : resolveProductImage(product), galeria: toArray(product.galeria || product.fotosExtras).join("\n"), videos: toArray(product.videos || product.videosExtras || product.videoPrincipal).join("\n"), textoWhatsApp: product.textoWhatsApp, legendaInstagram: product.legendaInstagram, legendaFacebook: product.legendaFacebook, hashtags: toArray(product.hashtags).join(" "), statusAnuncio: product.statusAnuncio || product.status, observacoes: product.observacoes }; }

  function suggest(kind, panel) {
    const fields = Object.fromEntries(new FormData(panel.querySelector("[data-ad-form]")).entries());
    const missing = [];
    if (!text(fields.fotoPrincipal)) missing.push("foto principal");
    if (!text(fields.linkPlataforma)) missing.push("link de compra");
    if (text(fields.description).length < 24) missing.push("descricao curta");
    let value = "";
    let target = "observacoes";
    if (kind === "descricao") { target = "description"; value = (text(fields.description) || "Informacao pendente de cadastro. Verifique os dados na plataforma antes da compra.") + " Boa opcao para quem procura praticidade e custo-beneficio. Confira os detalhes antes de comprar."; }
    if (kind === "postagem") { target = "textoWhatsApp"; value = "Confira esta selecao no Shopping Impacto360: " + (text(fields.name) || "produto em destaque") + ". Conteudo pode conter link de afiliado. " + (text(fields.linkPlataforma) ? "Acesse pelo link cadastrado." : "Link pendente de cadastro."); }
    if (kind === "imagem") value = text(fields.fotoPrincipal) ? "Conferir manualmente se a foto corresponde ao mesmo produto, marca e modelo." : "Foto principal pendente. Nao publicar como pronto ate inserir imagem real.";
    if (kind === "categoria") { target = "category"; value = suggestCategory(fields); }
    if (kind === "pendencias") value = missing.length ? "Pendencias encontradas: " + missing.join(", ") + "." : "Dados minimos presentes. Revisar visualmente antes da campanha.";
    state.suggestion = { target: target, value: value };
    panel.querySelector("[data-ceo-suggestion]").value = value;
  }

  function applySuggestion(panel) { if (!state.suggestion) return toast("Gere uma sugestao antes de aplicar."); const field = panel.querySelector('[name="' + state.suggestion.target + '"]'); if (field) field.value = state.suggestion.value; toast("Sugestao aplicada ao formulario. Revise e salve."); }
  function suggestCategory(fields) { const h = normalizeKey([fields.name, fields.description, fields.category].join(" ")); if (/iphone|samsung|motorola|smartphone|celular/.test(h)) return "Celulares"; if (/notebook|computador|pc|monitor|teclado|mouse|ssd|memoria/.test(h)) return "Computadores"; if (/tenis|sapato|sandalia|bota/.test(h)) return "Calcados"; if (/casa|cozinha|moveis|decor/.test(h)) return "Casa e Cozinha"; if (/curso|livro|apostila|educa/.test(h)) return "Cursos e Educacao"; return text(fields.category || "Ofertas"); }

  function exportControl() { const blob = new Blob([JSON.stringify(buildControl(), null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "controle-anuncios-chatgpt-ceo.json"; link.click(); URL.revokeObjectURL(url); }
  function observeDom() { if (state.observer) state.observer.disconnect(); state.observer = new MutationObserver(debounce(function () { repairCards(); removeLegacyAssistantReferences(); }, 120)); state.observer.observe(document.documentElement, { childList: true, subtree: true }); }

  function removeLegacyAssistantReferences() {
    const pattern = legacyPattern();
    try { Object.keys(localStorage).forEach(function (key) { const original = localStorage.getItem(key) || ""; const replaced = original.replace(pattern, "ChatGPT CEO"); if (original !== replaced) localStorage.setItem(key, replaced); }); } catch (error) {}
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (node) { const parent = node.parentElement; if (!parent || /SCRIPT|STYLE|TEXTAREA|INPUT|OPTION/.test(parent.tagName)) return NodeFilter.FILTER_REJECT; return pattern.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; } });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) { node.nodeValue = node.nodeValue.replace(legacyPattern(), "ChatGPT CEO"); });
  }
  function legacyPattern() { return new RegExp(["M\\u00f4nica", "m\\u00f4nica", "M" + "onica", "m" + "onica", "M\\u00c3\\u00b4nica", "m\\u00c3\\u00b4nica"].join("|"), "gi"); }

  function getProducts() { try { if (typeof window.__impacto360GetProducts === "function") return window.__impacto360GetProducts() || []; } catch (error) {} return []; }
  function refreshCatalog() { try { if (typeof window.__impacto360RefreshShopping === "function") window.__impacto360RefreshShopping(); } catch (error) {} repairCards(); }
  function isAdminRoute() { const route = new URLSearchParams(location.search).get("route") || location.pathname; return /\/admin\//.test(route); }
  function formId(panel) { return text(panel.querySelector('[name="id"]') && panel.querySelector('[name="id"]').value); }
  function emptyProduct() { return { id: "manual-" + Date.now(), name: "", category: "", description: "", statusAnuncio: "pendente" }; }
  function firstUsable(value) { return toArray(value).find(isUsableImage) || ""; }
  function productLink(product) { return text(product.linkPlataforma || product.affiliateLink || product.linkOriginal || product.link_original_afiliado || product.linkAfiliado || product.url); }
  function description(product) { return text(product.description || product.descricaoCurta || product.descricao || product.fullDescription || product.descricaoCompleta || product.descricaoDetalhada); }
  function input(name, value, placeholder) { return '<input name="' + name + '" value="' + escapeAttr(value || "") + '" placeholder="' + escapeAttr(placeholder) + '">'; }
  function area(name, value, placeholder) { return '<textarea name="' + name + '" placeholder="' + escapeAttr(placeholder) + '">' + escapeHtml(value || "") + '</textarea>'; }
  function toArray(value) { if (Array.isArray(value)) return value; return String(value || "").split(/\n|,/).map(function (item) { return item.trim(); }).filter(Boolean); }
  function unique(values) { return Array.from(new Set(values.map(text).filter(Boolean))); }
  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function normalizeKey(value) { return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
  function debounce(fn, wait) { let timer; return function () { const args = arguments; clearTimeout(timer); timer = setTimeout(function () { fn.apply(null, args); }, wait); }; }
  function toast(message) { if (typeof window.showToast === "function") window.showToast(message); else alert(message); }
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value); }

  function injectStyles() {
    if (document.getElementById("impacto360FotosAnunciosCeoCss")) return;
    const style = document.createElement("style");
    style.id = "impacto360FotosAnunciosCeoCss";
    style.textContent = ".product-media[data-ceo-stable-media=true]{position:relative!important;display:grid!important;place-items:center!important;min-height:220px!important;aspect-ratio:1/1!important;overflow:hidden!important;background:linear-gradient(145deg,#f7fbff,#eef6fb)!important}.product-media[data-ceo-stable-media=true]::before,.product-media[data-ceo-stable-media=true]::after{animation:none!important;content:none!important}.product-media[data-ceo-stable-media=true] img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;padding:16px!important;background:transparent!important;animation:none!important;opacity:1!important;filter:none!important}.ad-editor-launcher{position:fixed;right:18px;bottom:174px;z-index:9998;width:82px;height:68px;border:1px solid rgba(255,255,255,.55);border-radius:18px;background:linear-gradient(135deg,#08264d,#17a7bb);color:#fff;box-shadow:0 18px 42px rgba(6,36,74,.24);cursor:pointer;font:800 11px Inter,system-ui,sans-serif;display:grid;place-items:center}.ad-editor-launcher strong{font-size:18px}.ad-editor-launcher span{font-size:10px;text-transform:uppercase}.ad-editor-panel{position:fixed;inset:18px;z-index:10000;background:#f7fbff;color:#0b1d33;border:1px solid rgba(29,124,255,.22);border-radius:8px;box-shadow:0 24px 90px rgba(2,20,45,.28);font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden}.ad-editor-panel header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#fff,#edf9fb);border-bottom:1px solid #dce8f7}.ad-editor-panel header span{font-size:11px;font-weight:950;color:#138b9b;text-transform:uppercase}.ad-editor-panel h2{margin:2px 0 0;font-size:20px}.ad-editor-panel header button{width:38px;height:38px;border:0;border-radius:8px;background:#fff;color:#123;font-weight:950;cursor:pointer}.ad-editor-toolbar{display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid #dce8f7;background:#fff}.ad-editor-toolbar input{flex:1}.ad-editor-toolbar button,.ad-editor-form button{border:0;border-radius:8px;min-height:40px;padding:0 12px;background:#1d7cff;color:#fff;font-weight:900;cursor:pointer}.ad-editor-layout{display:grid;grid-template-columns:minmax(220px,330px) 1fr;min-height:0;flex:1}.ad-editor-list{overflow:auto;border-right:1px solid #dce8f7;background:#fff;padding:10px}.ad-editor-list button{display:block;width:100%;text-align:left;border:1px solid #e5edf7;background:#fff;border-radius:8px;padding:10px;margin-bottom:8px;cursor:pointer}.ad-editor-list button.active{border-color:#1d7cff;background:#eef6ff}.ad-editor-list b,.ad-editor-list span{display:block}.ad-editor-list span{font-size:12px;color:#607083;margin-top:3px}.ad-editor-form{overflow:auto;padding:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ad-editor-form input,.ad-editor-form textarea,.ad-editor-form select,.ad-editor-toolbar input{border:1px solid rgba(56,91,130,.22);border-radius:8px;min-height:42px;padding:10px;font:inherit;background:#fff}.ad-editor-form textarea{min-height:82px}.ad-editor-form textarea[name=fullDescription],.ad-editor-form textarea[name=observacoes],.ad-editor-ai,.ad-editor-actions{grid-column:1/-1}.ad-editor-ai{border:1px solid #dce8f7;background:#fff;border-radius:8px;padding:12px}.ad-editor-ai h3{margin:0 0 8px}.ad-editor-ai div,.ad-editor-actions{display:flex;gap:8px;flex-wrap:wrap}.ad-editor-ai textarea{width:100%;margin-top:8px;min-height:92px}.ad-editor-actions{position:sticky;bottom:0;background:#f7fbff;padding:10px 0}.ad-editor-actions button:nth-child(3),.ad-editor-actions button:nth-child(5){background:#a9442f}@media(max-width:860px){.ad-editor-panel{inset:8px}.ad-editor-layout,.ad-editor-form{grid-template-columns:1fr}.ad-editor-list{max-height:190px;border-right:0;border-bottom:1px solid #dce8f7}.ad-editor-toolbar{flex-wrap:wrap}.ad-editor-toolbar input{flex:1 1 100%}.ad-editor-launcher{right:12px;bottom:148px}}";
    document.head.appendChild(style);
  }
})();
