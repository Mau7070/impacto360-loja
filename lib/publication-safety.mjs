import crypto from "node:crypto";

const SITE_URL = "https://impacto360afiliado.com.br";
const STOP_WORDS = new Set("a o as os de da do das dos e em para por com sem um uma kit produto oferta confira impacto360".split(" "));
const INACTIVE_STATUS = /remov|inativ|indispon|esgot|cancel|exclu|rascunho|revisao|pendente|duplicado/i;
const ACTIVE_STATUS = /ativ|disponivel|aprovado|publicado/i;
const PLACEHOLDER = /placeholder|sem[-_ ]?(foto|imagem)|COLOCAR_|URL_|LINK_|pendente/i;

export const SUPPORTED_CHANNELS = new Set([
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
  "youtubeShorts",
  "youtube",
  "x",
  "twitter",
  "pinterest",
  "threads",
  "linkedin",
]);

export function productShortCode(productOrId) {
  const id = clean(typeof productOrId === "object" ? productOrId?.id : productOrId);
  if (!id) return "";
  return crypto.createHash("sha256").update(id).digest("hex").slice(0, 10);
}

export function productShortUrl(productOrId, siteUrl = SITE_URL) {
  const code = productShortCode(productOrId);
  return code ? `${String(siteUrl).replace(/\/$/, "")}/p/${code}/` : "";
}

export function productAffiliateUrl(product) {
  return firstFilled(product, [
    "linkCompra",
    "linkAfiliado",
    "affiliateLink",
    "linkComissionado",
    "linkPlataforma",
    "link_original_afiliado",
    "urlProduto",
    "linkOriginal",
    "link",
  ]);
}

export function productImage(product) {
  const image = firstFilled(product, ["fotoPrincipal", "imagemPrincipal", "image", "imagem"]);
  return PLACEHOLDER.test(image) ? "" : image;
}

export function productTitle(product) {
  return firstFilled(product, ["name", "nome", "title", "titulo"]);
}

export function inferMarketplace(value) {
  const haystack = clean(typeof value === "object"
    ? [value?.source, value?.origem, value?.partner, value?.plataforma, productAffiliateUrl(value)].join(" ")
    : value).toLowerCase();
  if (/amazon|amzn\./.test(haystack)) return "amazon";
  if (/mercado\s*livre|mercadolivre|meli\.la/.test(haystack)) return "mercado-livre";
  if (/shopee/.test(haystack)) return "shopee";
  if (/hotmart/.test(haystack)) return "hotmart";
  if (/aliexpress/.test(haystack)) return "aliexpress";
  return "outro";
}

export function isGenericMarketplaceUrl(value) {
  const parsed = safeUrl(value);
  if (!parsed) return true;
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (["mercadolivre.com.br", "shopee.com.br", "amazon.com.br"].includes(host) && path === "/") return true;
  return /\/(?:search|busca|pesquisa|category|categoria|departments?|stores?)(?:\/|$)/i.test(path)
    || /[?&](?:q|query|keyword|search)=/i.test(parsed.search);
}

export function isSpecificAffiliateUrl(value, expectedMarketplace = "") {
  const parsed = safeUrl(value);
  if (!parsed || !/^https:$/.test(parsed.protocol) || isGenericMarketplaceUrl(value)) return false;
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const path = parsed.pathname;
  const marketplace = expectedMarketplace || inferMarketplace(value);
  if (marketplace === "amazon") {
    return ((host === "amazon.com.br" || host.endsWith(".amazon.com.br")) && /\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/i.test(path) && parsed.searchParams.has("tag"))
      || (host === "amzn.to" && path.length > 2);
  }
  if (marketplace === "mercado-livre") {
    return (host === "meli.la" && path.length > 2)
      || ((host === "mercadolivre.com.br" || host.endsWith(".mercadolivre.com.br")) && /MLB[A-Z0-9_-]+/i.test(`${path}${parsed.search}`));
  }
  if (marketplace === "shopee") {
    return (host === "s.shopee.com.br" && path.length > 2)
      || ((host === "shopee.com.br" || host.endsWith(".shopee.com.br")) && (/\/product\/\d+\/\d+/i.test(path) || /-i\.\d+\.\d+/i.test(path)));
  }
  if (marketplace === "hotmart") return host.endsWith("hotmart.com") && path.length > 2;
  if (marketplace === "aliexpress") return host.endsWith("aliexpress.com") && /\/item\/\d+\.html/i.test(path);
  return false;
}

export function titleSimilarity(left, right) {
  const a = importantTokens(left);
  const b = importantTokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter(token => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / Math.max(1, union);
}

export function buildCatalogIndex(products) {
  const byId = new Map();
  const duplicateIds = new Set();
  for (const product of Array.isArray(products) ? products : []) {
    const id = clean(product?.id);
    if (!id) continue;
    if (byId.has(id)) duplicateIds.add(id);
    else byId.set(id, product);
  }
  return { byId, duplicateIds };
}

export function findProductByEvidence(campaign, catalog) {
  const index = catalog?.byId instanceof Map ? catalog : buildCatalogIndex(catalog);
  const id = clean(campaign?.productId || campaign?.catalogProductId || campaign?.impacto360ProductId);
  if (id && index.byId.has(id)) return { product: index.byId.get(id), score: 1, method: "id" };
  let best = { product: null, score: 0, method: "title" };
  for (const product of index.byId.values()) {
    const score = Math.max(
      titleSimilarity(campaign?.title, productTitle(product)),
      titleSimilarity(campaign?.title, product?.socialVideo?.sourceTitle),
    );
    if (score > best.score) best = { product, score, method: "title" };
  }
  return best;
}

export function validateProductForPublication(product, campaign = {}, options = {}) {
  const id = clean(product?.id);
  const marketplace = inferMarketplace(product || campaign?.affiliateLink || campaign?.link);
  const affiliateUrl = productAffiliateUrl(product);
  const expectedShortUrl = productShortUrl(product, options.siteUrl || SITE_URL);
  const campaignLink = clean(campaign?.link || campaign?.storeLink || campaign?.shortUrl);
  const catalogTitle = productTitle(product);
  const sourceTitle = clean(product?.socialVideo?.sourceTitle);
  const titleScore = Math.max(titleSimilarity(campaign?.title, catalogTitle), titleSimilarity(campaign?.title, sourceTitle));
  const campaignImage = clean(campaign?.image || campaign?.imagem);
  const campaignVideoHash = clean(campaign?.videoSha256);
  const catalogVideoHash = clean(product?.socialVideo?.videoSha256);
  const mediaMatch = Boolean(
    (campaignImage && productImage(product) && normalizePath(campaignImage) === normalizePath(productImage(product)))
    || (campaignVideoHash && catalogVideoHash && campaignVideoHash === catalogVideoHash),
  );
  const activeOffer = Array.isArray(product?.ofertas)
    && product.ofertas.some(offer => !INACTIVE_STATUS.test(clean(offer?.status)) && isSpecificAffiliateUrl(productAffiliateUrl(offer), inferMarketplace(offer)));
  const status = clean(product?.status || product?.statusAnuncio || product?.availability || product?.disponibilidade);
  const marketplaceActive = Boolean(product)
    && product?.aprovadoParaPublicacao !== false
    && product?.publicar !== false
    && !INACTIVE_STATUS.test(status)
    && (ACTIVE_STATUS.test(status) || activeOffer || product?.geraComissao === true);
  const productIdMatches = !campaign?.productId || clean(campaign.productId) === id;
  const campaignPrice = clean(campaign?.price);
  const catalogPrice = firstFilled(product, ["price", "preco", "precoAtual", "precoPromocional"])
    || firstFilled(Array.isArray(product?.ofertas) ? product.ofertas[0] : null, ["price", "preco"]);
  const checks = {
    productExists: Boolean(product),
    catalogRegistered: Boolean(product && options.catalogRegistered !== false),
    productIdMatches,
    marketplaceActive,
    affiliateLinkValid: isSpecificAffiliateUrl(affiliateUrl, marketplace),
    shortLinkValid: Boolean(campaignLink && campaignLink === expectedShortUrl),
    imageMatch: mediaMatch,
    titleMatch: Boolean(campaign?.title && titleScore >= (options.titleThreshold ?? 0.75)),
    descriptionMatch: descriptionMatches(product, campaign),
    priceMatch: !campaignPrice || (Boolean(catalogPrice) && normalizePrice(campaignPrice) === normalizePrice(catalogPrice)),
    channelSupported: SUPPORTED_CHANNELS.has(clean(campaign?.channel || options.defaultChannel || "facebook")),
    duplicateProductId: Boolean(options.duplicateProductId),
  };
  const readyToPublish = Object.entries(checks).every(([key, value]) => key === "duplicateProductId" ? value === false : value === true);
  const failures = Object.entries(checks)
    .filter(([key, value]) => key === "duplicateProductId" ? value === true : value === false)
    .map(([key]) => key);
  return {
    ...checks,
    readyToPublish,
    failures,
    productId: id,
    marketplace,
    affiliateUrl,
    expectedShortUrl,
    titleScore: Number(titleScore.toFixed(4)),
  };
}

export async function revalidateBeforePublication(product, campaign, options = {}) {
  const base = validateProductForPublication(product, campaign, options);
  if (!base.readyToPublish) return { ...base, liveValidation: false, readyToPublish: false };
  const fetcher = options.fetchImpl || globalThis.fetch;
  if (typeof fetcher !== "function") {
    return { ...base, liveValidation: false, readyToPublish: false, failures: [...base.failures, "liveFetchUnavailable"] };
  }
  const shortCheck = await fetchAndInspect(fetcher, base.expectedShortUrl, {
    expectedMarketplace: "impacto360",
    expectedTitle: productTitle(product),
    expectedBodyValue: base.affiliateUrl,
    timeoutMs: options.timeoutMs,
  });
  const marketplaceCheck = await fetchAndInspect(fetcher, base.affiliateUrl, {
    expectedMarketplace: base.marketplace,
    timeoutMs: options.timeoutMs,
  });
  const failures = [...base.failures];
  if (!shortCheck.ok) failures.push("shortLinkLive");
  if (!marketplaceCheck.ok) failures.push("marketplaceLive");
  return {
    ...base,
    shortLinkLive: shortCheck.ok,
    marketplaceLive: marketplaceCheck.ok,
    liveValidation: true,
    live: { shortLink: shortCheck, marketplace: marketplaceCheck },
    failures,
    readyToPublish: base.readyToPublish && shortCheck.ok && marketplaceCheck.ok,
  };
}

export function classifyPublication(publication, validation) {
  const state = clean(publication?.status || publication?.publicationStatus).toLowerCase();
  const scheduled = Boolean(publication?.scheduledAt || publication?.date || /agend/.test(state));
  const published = /publicad|enviado/.test(state);
  if (state === "cancelado_por_auditoria") return "CANCELAR_AGENDAMENTO";
  if (validation?.readyToPublish) return "OK";
  if (!validation?.productExists || !validation?.catalogRegistered) {
    if (/aguardando|pendente|revisao/.test(state)) return "LOCALIZAR_PRODUTO";
    return scheduled ? "CANCELAR_AGENDAMENTO" : "CADASTRAR_PRODUTO";
  }
  if (!validation?.productIdMatches || !validation?.titleMatch || !validation?.imageMatch) return "REVISÃO_MANUAL";
  if (!validation?.marketplaceActive) return published ? "EXCLUIR_PUBLICACAO" : (scheduled ? "CANCELAR_AGENDAMENTO" : "REVISÃO_MANUAL");
  if (!validation?.affiliateLinkValid || !validation?.shortLinkValid) return "CORRIGIR_LINK";
  return "REVISÃO_MANUAL";
}

export function isUnequivocallyUnsafePendingPublication(publication = {}) {
  return clean(publication.publicationStatus).toLowerCase() === "aguardando_revisao_visual_e_link_afiliado"
    && !clean(publication.catalogProductId)
    && !clean(publication.affiliateLink)
    && !clean(publication.storeLink)
    && !clean(publication.caption);
}

export function applySafeCancellation(publication = {}, timestamp = new Date().toISOString()) {
  if (!isUnequivocallyUnsafePendingPublication(publication)) {
    return { changed: false, item: publication, action: null };
  }
  const previousPublicationStatus = clean(publication.publicationStatus);
  const item = {
    ...publication,
    publicationStatus: "cancelado_por_auditoria",
  };
  return {
    changed: true,
    item,
    action: {
      acao: "CANCELAR_AGENDAMENTO",
      motivo: item.auditReason,
      status_anterior: previousPublicationStatus,
      status_novo: item.publicationStatus,
      data: timestamp,
      resultado: "cancelado_na_fila_local",
    },
  };
}

export function sanitizeCampaign(campaign = {}) {
  return {
    id: limited(campaign.id, 120),
    productId: limited(campaign.productId || campaign.catalogProductId, 220),
    channel: limited(campaign.channel, 40),
    title: limited(campaign.title, 220),
    storeId: limited(campaign.storeId, 120),
    storeName: limited(campaign.storeName, 180),
    price: limited(campaign.price, 80),
    image: limited(campaign.image, 500),
    videoSha256: limited(campaign.videoSha256, 64),
    link: limited(campaign.link || campaign.storeLink || campaign.shortUrl, 500),
    caption: limited(campaign.caption, 2000),
    scheduledAt: limited(campaign.scheduledAt, 80),
    hashtags: Array.isArray(campaign.hashtags) ? campaign.hashtags.slice(0, 12).map(item => limited(item, 40)).filter(Boolean) : [],
  };
}

async function fetchAndInspect(fetcher, url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(options.timeoutMs) || 10000);
  try {
    const response = await fetcher(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Impacto360PublicationSafety/1.0", accept: "text/html,application/xhtml+xml" },
    });
    const finalUrl = clean(response?.url || url);
    const body = typeof response?.text === "function" ? await response.text() : "";
    const statusOk = Number(response?.status) >= 200 && Number(response?.status) < 400;
    const domainOk = options.expectedMarketplace === "impacto360"
      ? safeUrl(finalUrl)?.hostname === "impacto360afiliado.com.br"
      : inferMarketplace(finalUrl) === options.expectedMarketplace;
    const normalizedBody = normalize(body);
    const expectedTitleTokens = [...importantTokens(options.expectedTitle)].slice(0, 5);
    const titleOk = !options.expectedTitle || (expectedTitleTokens.length > 0 && expectedTitleTokens.every(token => normalizedBody.includes(token)));
    const bodyOk = !options.expectedBodyValue || decodeHtml(body).includes(options.expectedBodyValue);
    return { ok: Boolean(statusOk && domainOk && titleOk && bodyOk), status: Number(response?.status) || 0, finalUrl, statusOk, domainOk, titleOk, bodyOk };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: "", error: error?.name === "AbortError" ? "timeout" : clean(error?.message) };
  } finally {
    clearTimeout(timer);
  }
}

function descriptionMatches(product, campaign) {
  const caption = clean(campaign?.caption);
  if (!caption) return true;
  return !extractUrls(caption).some(url => inferMarketplace(url) !== "outro");
}

function normalizePrice(value) {
  return clean(value).replace(/[^0-9,.-]+/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
}

function importantTokens(value) {
  return new Set(normalize(value).split(" ").filter(token => token.length >= 3 && !STOP_WORDS.has(token)));
}

function normalize(value) {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePath(value) {
  return clean(value).replace(/^https?:\/\/[^/]+\//i, "").replace(/^\.?\//, "").toLowerCase();
}

function firstFilled(object, keys) {
  for (const key of keys) {
    const value = clean(object?.[key]);
    if (value) return value;
  }
  return "";
}

function safeUrl(value) {
  try { return new URL(clean(value)); } catch { return null; }
}

function extractUrls(value) {
  return clean(value).match(/https?:\/\/[^\s<>'"]+/gi) || [];
}

function decodeHtml(value) {
  return clean(value).replaceAll("&amp;", "&");
}

function limited(value, max) {
  return clean(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max);
}

function clean(value) {
  return String(value ?? "").trim();
}
