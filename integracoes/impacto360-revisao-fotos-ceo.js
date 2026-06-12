(function () {
  "use strict";

  const CONTROL_KEY = "impacto360:controle-imagens-chatgpt-ceo";
  const OVERRIDES_KEY = "impacto360:imagem-overrides-chatgpt-ceo";
  const PLACEHOLDER_RE = /placeholder|COLOCAR|sem[-_ ]?imagem|produto\.svg|mercado-livre\.svg/i;
  const state = { products: [], records: [] };

  waitForCatalog();
  renderLauncher();
  protectBrokenImages();
  removeLegacyAssistantReferences();

  window.__impacto360ImageReview = {
    normalizeAll,
    getRecords: () => state.records.slice(),
    getProducts: () => state.products.slice(),
    saveProductImageEdit,
    markImagePending,
    markImageReviewed,
    restorePreviousImage,
    exportControlJson,
    removeLegacyAssistantReferences
  };

  function waitForCatalog(attempt = 0) {
    const products = getProducts();
    if (products.length || attempt > 30) {
      state.products = products;
      normalizeAll();
      return;
    }
    setTimeout(() => waitForCatalog(attempt + 1), 200);
  }

  function normalizeAll() {
    const products = getProducts();
    const overrides = readJson(OVERRIDES_KEY, {});
    const seen = new Map();
    products.forEach((product) => {
      Object.assign(product, overrides[product.id] || {});
      normalizeProduct(product, seen);
    });
    state.products = products;
    state.records = products.map(buildControlRecord);
    localStorage.setItem(CONTROL_KEY, JSON.stringify(state.records));
    return state.records;
  }

  function normalizeProduct(product, seen) {
    const image = text(product.fotoPrincipal || product.imagemPrincipal || product.image || product.imagem);
    const gallery = unique([image, ...(product.galeria || []), ...(product.fotosExtras || [])].map(text).filter(Boolean));
    const placeholder = !image || PLACEHOLDER_RE.test(image);
    const duplicateOf = image && seen.has(image) ? seen.get(image) : "";
    if (image && !seen.has(image)) seen.set(image, product.id);

    product.fotoPrincipal = image;
    product.imagemPrincipal = image;
    product.image = image || "/assets/placeholder-produto.svg";
    product.fotosExtras = unique(product.fotosExtras || gallery);
    product.galeria = gallery;
    product.statusImagem = product.statusImagem || (placeholder ? "imagem_manual_necessaria" : "imagem_ok");
    product.qualidadeImagem = product.qualidadeImagem || (placeholder ? "indefinida" : (gallery.length > 1 ? "alta" : "media"));
    product.observacaoImagem = product.observacaoImagem || (placeholder ? "Imagem pendente: inserir foto real correspondente ao produto antes de publicar." : "Imagem existente preservada. Validar visualmente antes de campanha.");
    product.imagemEditavel = true;
    product.imagemAtualizadaPor = product.imagemAtualizadaPor || "ChatGPT CEO";
    product.possivelDuplicado = Boolean(duplicateOf);
    product.duplicadoDe = duplicateOf;
    product.acaoDuplicidade = duplicateOf ? "revisar_manual" : (product.acaoDuplicidade || "");
    product.statusPostagem = buildPostStatus(product, placeholder);
    if (placeholder) appendPending(product, "imagem_manual_necessaria");
    return product;
  }

  function buildPostStatus(product, placeholder) {
    const hasDescription = text(product.description || product.descricaoCurta || product.descricaoDetalhada).length >= 24;
    const hasLink = Boolean(text(product.affiliateLink || product.linkPlataforma || product.linkOriginal));
    return !placeholder && hasDescription && hasLink ? "pronto" : "revisar";
  }

  function buildControlRecord(product) {
    return {
      produtoId: text(product.id),
      titulo: text(product.name || product.nome),
      categoria: text(product.category || product.categoria),
      descricaoAtual: text(product.description || product.descricaoCurta || product.descricaoDetalhada).slice(0, 120),
      fotoPrincipalAtual: text(product.fotoPrincipal || product.imagemPrincipal || product.image),
      fotoPrincipalSugerida: "",
      fotosExtrasSugeridas: [],
      statusImagem: text(product.statusImagem || "imagem_revisar"),
      qualidadeImagem: text(product.qualidadeImagem || "indefinida"),
      motivoRevisao: text(product.observacaoImagem),
      acaoRecomendada: product.statusImagem === "imagem_ok" ? "validar" : "inserir foto real",
      editadoManual: Boolean(product.editadoManualImagem),
      editadoPorChatGPT: Boolean(product.editadoPorChatGPT),
      aprovadoParaPublicacao: product.statusImagem === "imagem_ok" && product.statusPostagem === "pronto",
      possivelDuplicado: Boolean(product.possivelDuplicado),
      duplicadoDe: text(product.duplicadoDe),
      acaoDuplicidade: text(product.acaoDuplicidade),
      observacoes: ""
    };
  }

  function saveProductImageEdit(productId, data) {
    const product = getProducts().find((item) => item.id === productId);
    if (!product) return null;
    const previous = text(product.fotoPrincipal || product.imagemPrincipal || product.image);
    const nextImage = text(data.fotoPrincipal || data.imagemPrincipal || previous);
    const gallery = unique([nextImage, ...(toArray(data.galeria || data.fotosExtras))].map(text).filter(Boolean));
    const patch = {
      fotoPrincipalAnterior: previous,
      fotoPrincipal: nextImage,
      imagemPrincipal: nextImage,
      image: nextImage || "/assets/placeholder-produto.svg",
      fotosExtras: gallery,
      galeria: gallery,
      statusImagem: text(data.statusImagem || (nextImage && !PLACEHOLDER_RE.test(nextImage) ? "imagem_ok" : "imagem_pendente")),
      qualidadeImagem: text(data.qualidadeImagem || "media"),
      observacaoImagem: text(data.observacaoImagem || "Imagem editada manualmente no painel administrativo."),
      imagemEditavel: true,
      imagemAtualizadaPor: "ChatGPT CEO",
      editadoManualImagem: true,
      ultimaRevisaoImagem: new Date().toISOString()
    };
    Object.assign(product, patch);
    const overrides = readJson(OVERRIDES_KEY, {});
    overrides[productId] = { ...(overrides[productId] || {}), ...patch };
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    normalizeAll();
    return product;
  }

  function markImagePending(productId, note) {
    return saveProductImageEdit(productId, { statusImagem: "imagem_manual_necessaria", qualidadeImagem: "indefinida", observacaoImagem: note || "Imagem pendente para revisão manual." });
  }

  function markImageReviewed(productId) {
    return saveProductImageEdit(productId, { statusImagem: "imagem_ok", qualidadeImagem: "alta", observacaoImagem: "Imagem revisada e aprovada para vitrine e postagem." });
  }

  function restorePreviousImage(productId) {
    const product = getProducts().find((item) => item.id === productId);
    if (!product || !product.fotoPrincipalAnterior) return null;
    return saveProductImageEdit(productId, { fotoPrincipal: product.fotoPrincipalAnterior, statusImagem: "imagem_revisar", qualidadeImagem: "indefinida", observacaoImagem: "Imagem anterior restaurada. Revisar antes de publicar." });
  }

  function renderLauncher() {
    if (document.getElementById("impacto360ImageReviewLauncher")) return;
    const button = document.createElement("button");
    button.id = "impacto360ImageReviewLauncher";
    button.type = "button";
    button.className = "image-review-launcher";
    button.setAttribute("aria-label", "Abrir revisão de fotos do ChatGPT CEO");
    button.innerHTML = "<strong>CEO</strong><span>Fotos</span>";
    button.addEventListener("click", togglePanel);
    document.body.appendChild(button);
    injectStyle();
  }

  function togglePanel() {
    const current = document.getElementById("impacto360ImageReviewPanel");
    if (current) { current.remove(); return; }
    normalizeAll();
    const pending = state.records.filter((item) => item.statusImagem !== "imagem_ok").slice(0, 40);
    const panel = document.createElement("aside");
    panel.id = "impacto360ImageReviewPanel";
    panel.className = "image-review-panel";
    panel.innerHTML = `
      <header><div><span>Impacto360 AI Commerce CEO</span><h2>Revisão de fotos e textos</h2></div><button type="button" data-close-image-review aria-label="Fechar">×</button></header>
      <section class="image-review-summary"><strong>${state.records.length}</strong><span>produtos</span><strong>${pending.length}</strong><span>pendentes exibidos</span></section>
      <p class="image-review-note">Nenhuma foto é inventada ou trocada automaticamente. Produtos com placeholder ficam em revisão até validação manual.</p>
      <div class="image-review-list">${pending.length ? pending.map(renderItem).join("") : "<p>Nenhuma pendência de imagem encontrada.</p>"}</div>
      <footer><button type="button" data-export-image-control>Exportar controle JSON</button></footer>
    `;
    document.body.appendChild(panel);
    panel.querySelector("[data-close-image-review]").addEventListener("click", () => panel.remove());
    panel.querySelector("[data-export-image-control]").addEventListener("click", exportControlJson);
    panel.querySelectorAll("[data-copy-image-suggestion]").forEach((button) => button.addEventListener("click", () => copySuggestion(button.dataset.copyImageSuggestion)));
    panel.querySelectorAll("[data-image-pending]").forEach((button) => button.addEventListener("click", () => { markImagePending(button.dataset.imagePending); panel.remove(); togglePanel(); }));
    panel.querySelectorAll("[data-image-reviewed]").forEach((button) => button.addEventListener("click", () => { markImageReviewed(button.dataset.imageReviewed); panel.remove(); togglePanel(); }));
  }

  function renderItem(item) {
    return `<article><b>${escapeHtml(item.titulo || item.produtoId)}</b><span>${escapeHtml(item.categoria || "Categoria pendente")}</span><small>${escapeHtml(item.statusImagem)} - ${escapeHtml(item.acaoRecomendada)}</small><div><button type="button" data-copy-image-suggestion="${escapeAttr(item.produtoId)}">Copiar sugestão</button><button type="button" data-image-pending="${escapeAttr(item.produtoId)}">Manter pendente</button><button type="button" data-image-reviewed="${escapeAttr(item.produtoId)}">Marcar revisada</button></div></article>`;
  }

  function copySuggestion(productId) {
    const product = getProducts().find((item) => item.id === productId);
    const content = [
      "Sugestão segura do ChatGPT CEO",
      "",
      product?.name || product?.nome || productId,
      product?.description || product?.descricaoCurta || "Informação pendente de cadastro. Verifique os dados na plataforma antes da compra.",
      "",
      product?.affiliateLink || product?.linkOriginal ? `Link: ${product.affiliateLink || product.linkOriginal}` : "Link pendente de cadastro.",
      "Não publicar como postagem pronta antes de validar foto principal, link e descrição mínima."
    ].join("\n");
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(content).catch(() => fallbackCopy(content));
    else fallbackCopy(content);
  }

  function exportControlJson() {
    const blob = new Blob([JSON.stringify(state.records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "controle-imagens-chatgpt-ceo.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function protectBrokenImages() {
    document.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.closest(".product-card")) return;
      image.dataset.originalSrc = image.dataset.originalSrc || image.src;
      image.src = "/assets/placeholder-produto.svg";
      image.alt = image.alt || "Imagem pendente de revisão";
    }, true);
  }

  function removeLegacyAssistantReferences() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (!/impacto360|ai360|assistant|chat|ceo|crm/i.test(key)) return;
        const original = localStorage.getItem(key) || "";
        const replaced = original.replace(/M(?:ô|o)nica/gi, "ChatGPT CEO");
        if (original !== replaced) localStorage.setItem(key, replaced);
      });
    } catch (error) {}
  }

  function appendPending(product, value) {
    const list = Array.isArray(product.pendencias) ? product.pendencias : [];
    if (!list.includes(value)) list.push(value);
    product.pendencias = list;
  }

  function getProducts() {
    try { if (typeof window.__impacto360GetProducts === "function") return window.__impacto360GetProducts() || []; } catch (error) {}
    return [];
  }

  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function toArray(value) { return Array.isArray(value) ? value : String(value || "").split(/\n|,/); }
  function unique(values) { return [...new Set(values.map(text).filter(Boolean))]; }
  function text(value) { return String(value ?? "").trim(); }
  function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value); }
  function fallbackCopy(value) { const area = document.createElement("textarea"); area.value = value; area.style.position = "fixed"; area.style.left = "-9999px"; document.body.appendChild(area); area.select(); try { document.execCommand("copy"); } catch (error) {} document.body.removeChild(area); }

  function injectStyle() {
    const style = document.createElement("style");
    style.textContent = `.image-review-launcher{position:fixed;right:18px;bottom:174px;z-index:9997;width:66px;height:66px;border:1px solid rgba(255,255,255,.5);border-radius:22px;background:linear-gradient(135deg,#08305f,#18b7c6);color:#fff;box-shadow:0 18px 42px rgba(6,36,74,.24);cursor:pointer;display:grid;place-items:center;font:800 11px Inter,system-ui,sans-serif}.image-review-launcher strong{font-size:17px}.image-review-panel{position:fixed;right:18px;bottom:250px;z-index:9998;width:min(680px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;background:#fff;color:#0b1d33;border:1px solid rgba(29,124,255,.2);border-radius:8px;box-shadow:0 24px 76px rgba(2,20,45,.24);font-family:Inter,system-ui,sans-serif}.image-review-panel header{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:15px 16px;background:linear-gradient(135deg,#f7fbff,#edf9fb);border-bottom:1px solid #dce8f7}.image-review-panel header span{font-size:11px;font-weight:900;color:#138b9b;text-transform:uppercase}.image-review-panel h2{margin:3px 0 0;font-size:19px}.image-review-panel header button{border:0;background:#fff;border-radius:8px;width:36px;height:36px;font-size:22px;cursor:pointer}.image-review-summary{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:8px;padding:12px 16px;background:#fbfdff}.image-review-summary strong{color:#1d5cff}.image-review-note{margin:0 16px 12px;border-radius:8px;background:#fff7da;color:#6a4a00;padding:10px;font-size:13px;line-height:1.4}.image-review-list{display:grid;gap:10px;padding:0 16px 14px}.image-review-list article{border:1px solid #e4edf8;border-radius:8px;padding:11px;background:#fff}.image-review-list b,.image-review-list span,.image-review-list small{display:block}.image-review-list span,.image-review-list small{color:#607083;font-size:12px;margin-top:3px}.image-review-list div{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.image-review-panel button[data-copy-image-suggestion],.image-review-panel button[data-image-pending],.image-review-panel button[data-image-reviewed],.image-review-panel footer button{border:0;border-radius:8px;min-height:34px;padding:0 10px;background:#1d7cff;color:#fff;font-weight:900;cursor:pointer}.image-review-panel button[data-image-pending]{background:#eef5ff;color:#17314f}.image-review-panel button[data-image-reviewed]{background:#0d8f61}.image-review-panel footer{padding:0 16px 16px}@media(max-width:760px){.image-review-launcher{right:12px;bottom:150px}.image-review-panel{left:10px;right:10px;bottom:220px;width:auto}.image-review-summary{grid-template-columns:auto 1fr}}`;
    document.head.appendChild(style);
  }
})();
