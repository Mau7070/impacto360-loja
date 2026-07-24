import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LINK_FIELDS = [
  "linkCompra",
  "linkAfiliado",
  "affiliateLink",
  "linkComissionado",
  "linkPlataforma",
  "link_original_afiliado",
  "urlProduto",
  "url",
  "linkOriginal",
];

const IDENTITY_FIELDS = [
  "linkProdutoApenasLeitura",
  "linkResolvidoApenasLeitura",
  "sourceProductLink",
  "linkPrincipalFonte",
  "linkFinal",
  "permalinkPublico",
];

const SERVICE_STORES = new Set([
  "impacto-music-studio",
  "impacto-academico",
  "impacto-personalizados",
  "impacto-criadores",
]);

const STOPWORDS = new Set([
  "a", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "no", "na",
  "nos", "nas", "o", "os", "para", "por", "um", "uma", "the", "compre",
  "comprar", "oferta", "mercado", "livre", "amazon", "shopee", "brasil",
]);

const KNOWN_BRANDS = new Set([
  "acer", "adidas", "alexa", "amazon", "apple", "arno", "asus", "black decker",
  "bosch", "brastemp", "britania", "canon", "columbia", "consul", "craftsman",
  "dell", "dewalt", "dremel", "electrolux", "elgin", "epson", "fila", "fischer",
  "foxlux", "garmin", "gradiente", "hp", "intelbras", "irwin", "karcher",
  "kingston", "klein tools", "knipex", "lenovo", "lg", "liftness", "makita",
  "mallory", "melissa", "midea", "milwaukee", "mondial", "motorola", "mueller",
  "new balance", "nike", "oster", "panasonic", "philco", "philips", "puma",
  "samsung", "seagate", "skil", "sony", "tramontina", "vonder", "wap", "wera",
  "xiaomi",
]);

const argv = process.argv.slice(2);
const option = name => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : "";
};

const root = path.resolve(option("--root") || process.cwd());
const applyChanges = argv.includes("--apply");
const concurrency = Math.max(1, Number(option("--concurrency") || 4));
const timeoutMs = Math.max(5_000, Number(option("--timeout-ms") || 22_000));
const requestDelayMs = Math.max(0, Number(option("--delay-ms") || 180));
const maxProducts = Math.max(0, Number(option("--max-products") || 0));
const reportDate = option("--date") || new Date().toISOString().slice(0, 10).replaceAll("-", "");
const cachePath = path.resolve(
  option("--cache")
    || path.join(root, "..", `auditoria-links-cache-${reportDate}.json`),
);

const productsPath = path.join(root, "dados", "products.json");
const reportJsonPath = path.join(root, "dados", `relatorio-auditoria-completa-produtos-${reportDate}.json`);
const reportMarkdownPath = path.join(root, "dados", `relatorio-auditoria-completa-produtos-${reportDate}.md`);

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

function firstUrl(product, fields) {
  for (const field of fields) {
    const value = text(product?.[field]);
    if (/^https?:\/\//i.test(value)) return value;
  }
  return "";
}

function primaryLink(product) {
  return firstUrl(product, LINK_FIELDS);
}

function identityCandidates(product) {
  const values = [
    text(product?.marketplace?.sourceUrl),
    ...IDENTITY_FIELDS.map(field => text(product?.[field])),
  ];
  return [...new Set(values.filter(value => /^https?:\/\//i.test(value)))];
}

function cleanUrl(value) {
  try {
    const url = new URL(text(value));
    url.hash = "";
    return url.href;
  } catch {
    return text(value);
  }
}

function hostOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function productKeyFromUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const pathname = decodeURIComponent(url.pathname);
    if (host.includes("amazon.")) {
      const match = pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
      return match ? `amazon:${match[1].toUpperCase()}` : "";
    }
    if (host.includes("mercadolivre.com")) {
      const itemFilter = decodeURIComponent(url.searchParams.get("pdp_filters") || "")
        .match(/item_id:?(MLB\d+)/i);
      const itemPath = pathname.match(/MLB[-_]?(\d+)/i);
      const catalogPath = pathname.match(/\/p\/(MLB\d+)/i);
      if (itemFilter) return `mercadolivre:${itemFilter[1].toUpperCase()}`;
      if (itemPath) return `mercadolivre:MLB${itemPath[1]}`;
      if (catalogPath) return `mercadolivre:${catalogPath[1].toUpperCase()}`;
      return "";
    }
    if (host.includes("shopee.com.br")) {
      const match = pathname.match(/\/product\/(\d+)\/(\d+)/i);
      return match ? `shopee:${match[1]}:${match[2]}` : "";
    }
    if (host.includes("hotmart.com")) {
      const match = pathname.match(/\/([A-Z]\d+[A-Z])(?:[/?]|$)/i);
      return match ? `hotmart:${match[1].toUpperCase()}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function linkStructure(value, { allowShort = true } = {}) {
  const urlText = text(value);
  if (!urlText) return { valid: false, reason: "link_ausente", platform: "Outra", direct: false };
  if (!/^https?:\/\//i.test(urlText)) {
    return { valid: false, reason: "link_placeholder_ou_invalido", platform: "Outra", direct: false };
  }
  let url;
  try {
    url = new URL(urlText);
  } catch {
    return { valid: false, reason: "url_malformada", platform: "Outra", direct: false };
  }
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  if (host.includes("google.")) {
    return { valid: false, reason: "link_de_busca_google", platform: "Outra", direct: false };
  }
  if (host === "meli.la" || host.endsWith(".meli.la")) {
    return {
      valid: allowShort && Boolean(pathname.replaceAll("/", "")),
      reason: allowShort ? "atalho_afiliado" : "atalho_sem_destino_direto",
      platform: "Mercado Livre",
      direct: false,
    };
  }
  if (host.endsWith("link.amazon") || host.endsWith("amzn.to")) {
    return {
      valid: allowShort && Boolean(pathname.replaceAll("/", "")),
      reason: allowShort ? "atalho_afiliado" : "atalho_sem_destino_direto",
      platform: "Amazon",
      direct: false,
    };
  }
  if (host === "s.shopee.com.br") {
    return {
      valid: allowShort && Boolean(pathname.replaceAll("/", "")),
      reason: allowShort ? "atalho_afiliado" : "atalho_sem_destino_direto",
      platform: "Shopee",
      direct: false,
    };
  }
  if (host === "go.hotmart.com") {
    return {
      valid: allowShort && Boolean(pathname.replaceAll("/", "")),
      reason: allowShort ? "atalho_afiliado" : "atalho_sem_destino_direto",
      platform: "Hotmart",
      direct: false,
    };
  }
  if (host.includes("amazon.")) {
    const direct = /\/(?:dp|gp\/product)\/[a-z0-9]{10}(?:[/?]|$)/i.test(pathname);
    return {
      valid: direct,
      reason: direct ? "produto_direto" : "pagina_generica_amazon",
      platform: "Amazon",
      direct,
    };
  }
  if (host.includes("mercadolivre.com")) {
    if (host.startsWith("lista.") || pathname.includes("/loja/") || pathname === "/") {
      return { valid: false, reason: "busca_ou_loja_mercado_livre", platform: "Mercado Livre", direct: false };
    }
    const direct = (
      host.startsWith("produto.")
      || pathname.includes("/p/")
      || pathname.includes("/up/")
      || /\/mlb-?\d+/i.test(pathname)
    );
    return {
      valid: direct,
      reason: direct ? "produto_direto" : "pagina_generica_mercado_livre",
      platform: "Mercado Livre",
      direct,
    };
  }
  if (host.includes("shopee.com.br")) {
    const direct = /\/product\/\d+\/\d+/i.test(pathname);
    return {
      valid: direct,
      reason: direct ? "produto_direto" : "pagina_generica_shopee",
      platform: "Shopee",
      direct,
    };
  }
  if (host.includes("hotmart.com")) {
    const direct = pathname.includes("/marketplace/produtos/");
    return {
      valid: direct,
      reason: direct ? "produto_direto" : "pagina_generica_hotmart",
      platform: "Hotmart",
      direct,
    };
  }
  return { valid: true, reason: "url_externa", platform: "Outra", direct: true };
}

function identityUrl(product, primary) {
  for (const candidate of identityCandidates(product)) {
    if (linkStructure(candidate, { allowShort: false }).valid) return cleanUrl(candidate);
  }
  return linkStructure(primary, { allowShort: false }).valid ? cleanUrl(primary) : "";
}

function decodeHtml(value) {
  return text(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*([\"'])([\\s\\S]*?)\\1`, "i"));
  return match ? decodeHtml(match[2]) : "";
}

function extractPageTitle(body) {
  for (const tag of body.match(/<meta\b[^>]*>/gi) || []) {
    const key = (attribute(tag, "property") || attribute(tag, "name")).toLowerCase();
    if (key === "og:title" || key === "twitter:title") {
      const content = attribute(tag, "content");
      if (content) return content;
    }
  }
  const amazon = body.match(/<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i);
  if (amazon?.[1]) return decodeHtml(amazon[1]);
  const documentTitle = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtml(documentTitle?.[1] || "");
}

async function readLimitedBody(response, limit = 2_500_000) {
  if (!response.body?.getReader) return (await response.text()).slice(0, limit);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let bytes = 0;
  while (bytes < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    result += decoder.decode(value, { stream: true });
    if (bytes >= limit) {
      await reader.cancel();
      break;
    }
  }
  result += decoder.decode();
  return result;
}

function pageSignals(status, finalUrl, body, title) {
  const normalizedBody = normalize(body.slice(0, 500_000));
  const normalizedTitle = normalize(title);
  const challenge = (
    status === 401
    || status === 403
    || status === 429
    || status >= 500
    || /robot check|captcha|access denied|acesso negado|unusual traffic|verifique se voce e humano/.test(normalizedBody)
  );
  const notFound = (
    status === 404
    || status === 410
    || /pagina nao encontrada|produto nao encontrado|anuncio finalizado|anuncio excluido|esta pagina nao existe|erro 404/.test(normalizedTitle)
  );
  const finalStructure = linkStructure(finalUrl, { allowShort: false });
  return { challenge, notFound, finalStructure };
}

async function fetchAudit(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.7",
        accept: "text/html,application/xhtml+xml",
        "cache-control": "no-cache",
      },
    });
    const body = await readLimitedBody(response);
    const pageTitle = extractPageTitle(body);
    const signals = pageSignals(response.status, response.url, body, pageTitle);
    let state = "accessible";
    if (signals.notFound) state = "confirmed_invalid";
    else if (signals.challenge) state = "inconclusive";
    else if (!response.ok && response.status >= 400) state = "inconclusive";
    else if (!pageTitle && !signals.finalStructure.direct) state = "inconclusive";
    return {
      requestedUrl: url,
      status: response.status,
      finalUrl: response.url,
      pageTitle,
      state,
      reason: signals.notFound
        ? "pagina_nao_encontrada_ou_anuncio_finalizado"
        : signals.challenge
          ? "bloqueio_ou_limitacao_do_marketplace"
          : state === "inconclusive"
            ? "resposta_sem_identidade_confirmavel"
            : "pagina_acessivel",
      finalProductKey: productKeyFromUrl(response.url),
      durationMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      requestedUrl: url,
      status: 0,
      finalUrl: "",
      pageTitle: "",
      state: "inconclusive",
      reason: error?.name === "AbortError" ? "tempo_esgotado" : "erro_de_rede",
      error: `${error?.name || "Error"}: ${error?.message || error}`,
      finalProductKey: "",
      durationMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function similarity(expected, actual) {
  const expectedTokens = tokens(expected);
  const actualTokens = tokens(actual);
  const expectedSet = new Set(expectedTokens);
  const actualSet = new Set(actualTokens);
  const intersection = [...expectedSet].filter(token => actualSet.has(token)).length;
  const union = new Set([...expectedSet, ...actualSet]).size || 1;
  const overlap = intersection / union;
  const coverage = intersection / Math.max(1, expectedSet.size);
  const expectedNormalized = normalize(expected);
  const actualNormalized = normalize(actual);
  const substring = (
    expectedNormalized.includes(actualNormalized)
    || actualNormalized.includes(expectedNormalized)
  );
  const expectedModels = expectedTokens.filter(token => /\d/.test(token));
  const actualModels = actualTokens.filter(token => /\d/.test(token));
  const modelMatch = expectedModels.some(token => actualSet.has(token));
  const safe = substring || coverage >= 0.58 || overlap >= 0.42 || (modelMatch && coverage >= 0.30);
  return {
    safe,
    overlap: Number(overlap.toFixed(4)),
    coverage: Number(coverage.toFixed(4)),
    modelMatch,
    expectedModels,
    actualModels,
  };
}

function brandFromTitle(value) {
  const normalized = normalize(value);
  return [...KNOWN_BRANDS]
    .sort((a, b) => b.length - a.length)
    .find(brand => normalized.includes(brand)) || "";
}

function genericMarketplaceTitle(value) {
  const normalized = normalize(value)
    .replace(/\b(com br|brasil|oficial|site|compras online)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (
    /^(mercado livre|mercado libre|amazon|shopee|hotmart)$/.test(normalized)
    || /^(entrar|login|acesso negado|access denied|robot check)$/.test(normalized)
    || /^(minhas listas de recomendacoes|minha lista de recomendacoes)$/.test(normalized)
  );
}

function trustedCachedResult(result) {
  if (!result) return null;
  const title = decodeHtml(result.pageTitle);
  const titleNotFound = /pagina nao encontrada|produto nao encontrado|anuncio finalizado|anuncio excluido|esta pagina nao existe|erro 404/.test(normalize(title));
  const directFinal = linkStructure(result.finalUrl, { allowShort: false }).valid;
  if (
    result.state === "confirmed_invalid"
    && result.status >= 200
    && result.status < 400
    && directFinal
    && title
    && !titleNotFound
  ) {
    return {
      ...result,
      pageTitle: title,
      state: "accessible",
      reason: "pagina_acessivel",
      correctedFromCachedFalsePositive: true,
    };
  }
  return { ...result, pageTitle: title };
}

function titleFromProductUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    let pathname = decodeURIComponent(url.pathname);
    if (host.includes("mercadolivre.com")) {
      pathname = pathname
        .replace(/^\/MLB-?\d+-/i, "")
        .replace(/^\/produto\/MLB-?\d+-/i, "")
        .replace(/\/(?:p|up)\/MLB[A-Z0-9-]+.*$/i, "")
        .replace(/-_JM$/i, "")
        .replace(/^\/+|\/+$/g, "")
        .replace(/-/g, " ");
      return pathname;
    }
    if (host.includes("amazon.")) {
      pathname = pathname
        .replace(/\/(?:dp|gp\/product)\/[A-Z0-9]{10}.*$/i, "")
        .replace(/^\/+|\/+$/g, "")
        .replace(/-/g, " ");
      return pathname;
    }
  } catch {
    return "";
  }
  return "";
}

function identityAssessment(product, result, identityUrlValue = "") {
  const expected = text(product.name || product.nome || product.title);
  const urlTitle = titleFromProductUrl(identityUrlValue);
  const urlComparison = urlTitle ? similarity(expected, urlTitle) : null;
  if (urlComparison?.safe) {
    return {
      state: "matching",
      confirmedMismatch: false,
      reason: "identidade_correspondente_na_url_direta",
      pageTitle: result?.pageTitle || "",
      urlTitle,
      expectedTitle: expected,
      ...urlComparison,
    };
  }
  const resultTitle = decodeHtml(result?.pageTitle);
  if (!result || result.state !== "accessible" || !resultTitle) {
    return {
      state: result?.state || "not_checked",
      confirmedMismatch: false,
      reason: result?.reason || "identidade_nao_verificada",
      pageTitle: resultTitle,
    };
  }
  if (genericMarketplaceTitle(resultTitle)) {
    return {
      state: "inconclusive",
      confirmedMismatch: false,
      reason: "titulo_generico_do_marketplace",
      pageTitle: resultTitle,
      urlTitle,
      expectedTitle: expected,
    };
  }
  const comparison = similarity(expected, resultTitle);
  const expectedBrand = normalize(product.brand || product.marca || brandFromTitle(expected));
  const actualBrand = normalize(brandFromTitle(resultTitle));
  const brandConflict = Boolean(expectedBrand && actualBrand && expectedBrand !== actualBrand);
  const modelConflict = Boolean(
    comparison.expectedModels.length
    && comparison.actualModels.length
    && !comparison.modelMatch,
  );
  const confirmedMismatch = !comparison.safe && (
    brandConflict
    || modelConflict
    || (comparison.coverage < 0.12 && comparison.overlap < 0.08)
  );
  return {
    state: confirmedMismatch ? "confirmed_mismatch" : comparison.safe ? "matching" : "uncertain",
    confirmedMismatch,
    reason: confirmedMismatch
      ? "titulo_destino_nao_corresponde_ao_produto"
      : comparison.safe
        ? "titulo_correspondente"
        : "similaridade_insuficiente_sem_conflito_forte",
    pageTitle: resultTitle,
    expectedTitle: expected,
    expectedBrand,
    actualBrand,
    brandConflict,
    modelConflict,
    ...comparison,
  };
}

function isServiceWithoutExternalLink(product) {
  return SERVICE_STORES.has(text(product.storeId))
    && ["quote", "contact", "whatsapp"].includes(text(product.actionType).toLowerCase());
}

function qualityScore(product) {
  let score = 0;
  if (text(product.status).toLowerCase() === "ativo") score += 8;
  if (product.aprovadoParaPublicacao === true) score += 6;
  if (text(product.image || product.imagemPrincipal || product.fotoPrincipal)) score += 3;
  if (text(product.description || product.descricaoCurta)) score += 2;
  if (text(product.price || product.preco)) score += 1;
  return score;
}

function summarizeProduct(product) {
  return {
    id: text(product.id),
    name: text(product.name || product.nome || product.title),
    storeId: text(product.storeId),
    status: text(product.status),
    approved: product.aprovadoParaPublicacao === true,
    link: primaryLink(product),
  };
}

const allProducts = readJson(productsPath, []);
const products = maxProducts ? allProducts.slice(0, maxProducts) : allProducts;
const cache = readJson(cachePath, {});
const productInputs = products.map(product => {
  const primary = primaryLink(product);
  return {
    product,
    primary,
    primaryStructure: linkStructure(primary),
    identity: identityUrl(product, primary),
  };
});

const urls = [...new Set(productInputs.flatMap(input => {
  if (isServiceWithoutExternalLink(input.product)) return [];
  const candidates = [];
  if (input.primaryStructure.valid) candidates.push(cleanUrl(input.primary));
  if (input.identity) candidates.push(cleanUrl(input.identity));
  return candidates;
}).filter(Boolean))];

const pendingUrls = urls.filter(url => !cache[url]);
let completed = 0;
let cacheWrites = 0;
let nextIndex = 0;

async function worker(workerId) {
  while (true) {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= pendingUrls.length) return;
    const url = pendingUrls[index];
    if (requestDelayMs) await new Promise(resolve => setTimeout(resolve, requestDelayMs * workerId));
    let result = await fetchAudit(url);
    if (result.state === "inconclusive" && ["erro_de_rede", "tempo_esgotado"].includes(result.reason)) {
      await new Promise(resolve => setTimeout(resolve, 750));
      result = await fetchAudit(url);
    }
    cache[url] = result;
    completed += 1;
    if (completed % 10 === 0 || completed === pendingUrls.length) {
      writeJsonAtomic(cachePath, cache);
      cacheWrites += 1;
      console.log(`Progresso online: ${completed}/${pendingUrls.length} novas URLs verificadas`);
    }
  }
}

console.log(JSON.stringify({
  products: products.length,
  uniqueUrls: urls.length,
  cachedUrls: urls.length - pendingUrls.length,
  pendingUrls: pendingUrls.length,
  concurrency,
  timeoutMs,
  requestDelayMs,
  applyChanges,
  cachePath,
}, null, 2));

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));
if (pendingUrls.length && !cacheWrites) writeJsonAtomic(cachePath, cache);

const decisions = productInputs.map(input => {
  const serviceExempt = isServiceWithoutExternalLink(input.product);
  const primaryResult = input.primary ? trustedCachedResult(cache[cleanUrl(input.primary)] || null) : null;
  const identityResult = input.identity
    ? trustedCachedResult(cache[cleanUrl(input.identity)] || null)
    : primaryResult;
  const primaryAssessment = identityAssessment(input.product, primaryResult, "");
  const directIdentityAssessment = identityAssessment(input.product, identityResult, input.identity);
  let assessment = directIdentityAssessment;
  let assessmentEvidence = "identity_url";
  if (primaryAssessment.state === "matching" || primaryAssessment.confirmedMismatch) {
    assessment = primaryAssessment;
    assessmentEvidence = "affiliate_destination";
  } else if (!input.identity) {
    assessment = primaryAssessment;
    assessmentEvidence = "affiliate_destination";
  }
  const finalStructure = linkStructure(primaryResult?.finalUrl, { allowShort: false });
  let decision = "keep";
  let reason = "link_e_identidade_sem_invalidade_confirmada";

  if (serviceExempt) {
    decision = "keep_service";
    reason = "servico_interno_por_orcamento_sem_link_externo";
  } else if (!input.primary) {
    decision = "delete_confirmed";
    reason = "produto_sem_link_de_compra";
  } else if (!input.primaryStructure.valid) {
    decision = "delete_confirmed";
    reason = input.primaryStructure.reason;
  } else if (primaryResult?.state === "confirmed_invalid") {
    decision = "delete_confirmed";
    reason = primaryResult.reason;
  } else if (
    primaryResult?.state === "accessible"
    && !finalStructure.valid
    && assessment.state !== "matching"
    && /pagina_generica|busca_ou_loja/.test(finalStructure.reason)
  ) {
    if (!input.identity || assessment.confirmedMismatch) {
      decision = "delete_confirmed";
      reason = "atalho_redirecionou_para_pagina_generica";
    } else {
      decision = "manual_review";
      reason = "atalho_generico_com_identidade_direta_nao_conclusiva";
    }
  } else if (assessment.confirmedMismatch) {
    decision = "delete_confirmed";
    reason = assessment.reason;
  } else if (assessment.state === "uncertain") {
    decision = "manual_review";
    reason = assessment.reason;
  } else if (
    primaryResult?.state === "accessible"
    && !finalStructure.valid
    && !assessment.pageTitle
  ) {
    decision = "manual_review";
    reason = "atalho_nao_chegou_a_uma_pagina_de_produto_confirmavel";
  } else if (
    primaryResult?.state === "inconclusive"
    && (!identityResult || identityResult.state === "inconclusive")
  ) {
    decision = "keep_inconclusive";
    reason = "marketplace_bloqueou_auditoria_automatica";
  }

  return {
    ...summarizeProduct(input.product),
    platform: input.primaryStructure.platform,
    identityUrl: input.identity,
    decision,
    reason,
    primaryCheck: primaryResult,
    identityCheck: identityResult,
    identityAssessment: { ...assessment, evidence: assessmentEvidence },
    primaryIdentityAssessment: primaryAssessment,
    directIdentityAssessment,
    productKey: assessmentEvidence === "affiliate_destination"
      ? (primaryResult?.finalProductKey || productKeyFromUrl(input.primary) || "")
      : (
        identityResult?.finalProductKey
        || productKeyFromUrl(input.identity)
        || primaryResult?.finalProductKey
        || productKeyFromUrl(input.primary)
        || ""
      ),
  };
});

const decisionById = new Map(decisions.map(decision => [decision.id, decision]));
const productGroups = new Map();
for (const decision of decisions) {
  if (!decision.productKey || decision.decision === "delete_confirmed") continue;
  if (!productGroups.has(decision.productKey)) productGroups.set(decision.productKey, []);
  productGroups.get(decision.productKey).push(decision);
}

const duplicateRemovals = [];
for (const [productKey, grouped] of productGroups) {
  if (grouped.length < 2) continue;
  const productsInGroup = grouped
    .map(decision => ({ decision, product: products.find(product => text(product.id) === decision.id) }))
    .filter(item => item.product)
    .sort((a, b) => qualityScore(b.product) - qualityScore(a.product));
  const keeper = productsInGroup[0];
  for (const duplicate of productsInGroup.slice(1)) {
    const sameIdentity = similarity(keeper.decision.name, duplicate.decision.name).safe;
    if (!sameIdentity) continue;
    duplicate.decision.decision = "delete_confirmed";
    duplicate.decision.reason = "produto_duplicado_mesma_identidade_externa";
    duplicate.decision.duplicateOf = keeper.decision.id;
    duplicateRemovals.push({
      productKey,
      keep: keeper.decision.id,
      remove: duplicate.decision.id,
    });
  }
}

const deleteIds = new Set(
  decisions.filter(decision => decision.decision === "delete_confirmed").map(decision => decision.id),
);
const reviewIds = new Set(
  decisions.filter(decision => decision.decision === "manual_review").map(decision => decision.id),
);
const remainingProducts = allProducts
  .filter(product => !deleteIds.has(text(product.id)))
  .map(product => {
    if (!reviewIds.has(text(product.id))) return product;
    return {
      ...product,
      status: "revisao_manual",
      aprovadoParaPublicacao: false,
      publicar: false,
      revisaoOnline: {
        data: new Date().toISOString().slice(0, 10),
        motivo: decisionById.get(text(product.id))?.reason || "revisao_manual",
      },
    };
  });

const decisionCounts = Object.fromEntries(
  [...new Set(decisions.map(decision => decision.decision))]
    .sort()
    .map(key => [key, decisions.filter(decision => decision.decision === key).length]),
);
const platformCounts = Object.fromEntries(
  [...new Set(decisions.map(decision => decision.platform))]
    .sort()
    .map(key => [key, decisions.filter(decision => decision.platform === key).length]),
);
const onlineStates = Object.fromEntries(
  ["accessible", "confirmed_invalid", "inconclusive", "not_checked"].map(state => [
    state,
    decisions.filter(decision => (
      decision.primaryCheck?.state === state
      || (!decision.primaryCheck && state === "not_checked")
    )).length,
  ]),
);

const report = {
  generatedAt: new Date().toISOString(),
  applied: applyChanges,
  criteria: {
    deleteOnlyWhen: [
      "produto sem link de compra e sem excecao de servico interno",
      "link estruturalmente de busca, loja, placeholder ou URL invalida",
      "HTTP 404/410 ou pagina explicitamente removida/finalizada",
      "titulo do destino com conflito forte de marca/modelo",
      "duplicidade confirmada pela mesma identidade externa",
    ],
    preserveWhen: [
      "HTTP 401/403/429/5xx, CAPTCHA, timeout ou bloqueio do marketplace",
      "similaridade baixa sem conflito forte",
      "servico interno por orcamento sem link externo",
    ],
  },
  totals: {
    analyzedProducts: products.length,
    originalProducts: allProducts.length,
    remainingProducts: remainingProducts.length,
    confirmedDeletions: deleteIds.size,
    movedToManualReview: reviewIds.size,
    uniqueUrls: urls.length,
    newNetworkChecks: pendingUrls.length,
    cachedNetworkChecks: urls.length - pendingUrls.length,
  },
  decisionCounts,
  platformCounts,
  onlineStates,
  duplicateRemovals,
  deleted: decisions.filter(decision => decision.decision === "delete_confirmed"),
  movedToManualReview: decisions.filter(decision => decision.decision === "manual_review"),
  inconclusivePreserved: decisions.filter(decision => decision.decision === "keep_inconclusive"),
  servicesPreserved: decisions.filter(decision => decision.decision === "keep_service"),
  allDecisions: decisions,
};

function markdown(reportData) {
  const totals = reportData.totals;
  const lines = [
    "# Auditoria completa de produtos e links",
    "",
    `Data: ${reportData.generatedAt.slice(0, 10)}`,
    "",
    "## Resultado",
    "",
    `- Produtos analisados: ${totals.analyzedProducts}.`,
    `- Produtos antes da auditoria: ${totals.originalProducts}.`,
    `- Produtos após a auditoria: ${totals.remainingProducts}.`,
    `- Exclusões confirmadas: ${totals.confirmedDeletions}.`,
    `- Movidos para revisão manual: ${totals.movedToManualReview}.`,
    `- URLs únicas verificadas: ${totals.uniqueUrls}.`,
    "",
    "## Decisões",
    "",
    ...Object.entries(reportData.decisionCounts).map(([key, value]) => `- ${key}: ${value}.`),
    "",
    "## Exclusões com evidência",
    "",
    "| ID | Produto | Motivo | Link | Destino/título observado |",
    "|---|---|---|---|---|",
    ...reportData.deleted.map(item => (
      `| ${item.id} | ${item.name.replaceAll("|", "\\|")} | ${item.reason} | ${item.link || "-"} | ${(item.identityAssessment?.pageTitle || item.primaryCheck?.finalUrl || "-").replaceAll("|", "\\|")} |`
    )),
    "",
    "## Revisão manual preservada",
    "",
    ...reportData.movedToManualReview.map(item => `- ${item.id}: ${item.reason}.`),
    "",
    "Bloqueios automáticos, CAPTCHA, HTTP 403/429, timeout e falhas temporárias não foram usados como motivo de exclusão.",
    "",
  ];
  return lines.join("\n");
}

if (applyChanges) {
  writeJsonAtomic(productsPath, remainingProducts);
}
writeJsonAtomic(reportJsonPath, report);
fs.writeFileSync(reportMarkdownPath, markdown(report), "utf8");

console.log(JSON.stringify({
  ...report.totals,
  decisionCounts,
  platformCounts,
  onlineStates,
  reportJsonPath,
  reportMarkdownPath,
  cachePath,
}, null, 2));
