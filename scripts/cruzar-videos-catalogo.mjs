import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "dados", "social-videos-20260730");
const inventoryPath = path.join(sourceDir, "inventario-videos.json");
const productsPath = path.join(root, "dados", "products.json");
const outputPath = path.join(sourceDir, "cruzamento-catalogo.json");
const readyCsvPath = path.join(sourceDir, "produtos-prontos-redes.csv");
const researchCsvPath = path.join(sourceDir, "fila-pesquisa-marketplaces.csv");

const inventory = readJson(inventoryPath);
const products = readJson(productsPath);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter(token => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function tokenSimilarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return (2 * intersection) / (a.size + b.size);
}

function numericTokens(value) {
  return [...new Set(normalize(value).match(/\b\d+(?:\d+)?\b/g) || [])].sort();
}

function compatibleNumbers(left, right) {
  const a = numericTokens(left);
  const b = numericTokens(right);
  if (!a.length || !b.length) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

function firstAffiliateLink(product) {
  const fields = [
    "affiliateLink",
    "linkAfiliado",
    "linkComissionado",
    "linkCompra",
    "linkPlataforma",
    "urlProduto",
    "link",
  ];
  for (const field of fields) {
    const value = String(product?.[field] || "").trim();
    if (value) return value;
  }
  return "";
}

function marketplaceFromLink(link) {
  let host;
  try {
    host = new URL(link).hostname.toLowerCase();
  } catch {
    return "";
  }
  if (host === "amzn.to" || host.endsWith(".amazon.com.br") || host === "amazon.com.br") return "amazon";
  if (host === "meli.la" || host.endsWith(".mercadolivre.com.br") || host === "mercadolivre.com.br") return "mercado_livre";
  if (host === "s.shopee.com.br" || host.endsWith(".shopee.com.br") || host === "shopee.com.br") return "shopee";
  return "";
}

function affiliateConfirmed(product, link) {
  const marketplace = marketplaceFromLink(link);
  if (!marketplace || product?.geraComissao !== true) return false;
  const status = normalize(`${product?.statusLink || ""} ${product?.linkStatus || ""} ${product?.tipoLink || ""}`);
  if (status.includes("pendente") || status.includes("nao confirmado") || status.includes("sem link")) return false;
  if (marketplace === "amazon") {
    return /(?:[?&]tag=)|amzn\.to/i.test(link);
  }
  if (marketplace === "shopee") {
    return /^https:\/\/s\.shopee\.com\.br\//i.test(link)
      || (status.includes("shortlink") && status.includes("confirm"));
  }
  return /^https:\/\/meli\.la\//i.test(link)
    || status.includes("confirm")
    || status.includes("comission");
}

function sourceKeys(value) {
  const text = String(value || "");
  const keys = new Set();
  for (const match of text.matchAll(/\b(MLBU?)-?(\d+)\b/gi)) {
    keys.add(`${match[1].toUpperCase()}${match[2]}`);
  }
  for (const match of text.matchAll(/\/dp\/([A-Z0-9]{10})\b/gi)) {
    keys.add(`ASIN:${match[1].toUpperCase()}`);
  }
  try {
    const url = new URL(text);
    const shopeeProduct = url.pathname.match(/\/product\/(\d+)\/(\d+)/i);
    const shopeeSlug = url.pathname.match(/-i\.(\d+)\.(\d+)/i);
    const shopee = shopeeProduct || shopeeSlug;
    if (shopee) keys.add(`SHOPEE:${shopee[1]}:${shopee[2]}`);
  } catch {
    // Links ausentes ou invalidos ficam sem chave.
  }
  return [...keys];
}

function catalogSourceKeys(product) {
  const values = [
    product?.affiliateLink,
    product?.linkPrincipalFonte,
    product?.linkProdutoApenasLeitura,
    product?.linkResolvidoApenasLeitura,
    product?.sourceProductLink,
    product?.marketplace?.externalId,
    product?.marketplace?.sourceUrl,
    product?.marketplace?.affiliateUrl,
    product?.shopee?.productUrl,
    product?.shopee?.affiliateLink,
  ];
  return [...new Set(values.flatMap(sourceKeys))];
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(file, rows, columns) {
  const lines = [columns.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(columns.map(column => csvEscape(row[column])).join(","));
  }
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

const STOP_WORDS = new Set([
  "a", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "para", "por",
  "um", "uma", "novo", "nova", "original", "produto", "peca", "pc", "pcs",
]);

const catalog = products
  .map(product => {
    const title = product.name || product.nome || product.title || "";
    const affiliateLink = firstAffiliateLink(product);
    return {
      product,
      title,
      normalizedTitle: normalize(title),
      affiliateLink,
      marketplace: marketplaceFromLink(affiliateLink),
      affiliateConfirmed: affiliateConfirmed(product, affiliateLink),
      sourceKeys: catalogSourceKeys(product),
    };
  })
  .filter(item => item.title && item.affiliateConfirmed);

const catalogByTitle = new Map();
const catalogBySourceKey = new Map();
for (const item of catalog) {
  const titleList = catalogByTitle.get(item.normalizedTitle) || [];
  titleList.push(item);
  catalogByTitle.set(item.normalizedTitle, titleList);
  for (const key of item.sourceKeys) {
    const keyList = catalogBySourceKey.get(key) || [];
    keyList.push(item);
    catalogBySourceKey.set(key, keyList);
  }
}

const videoItems = inventory.items.filter(item => item.hasVideo);
const contentConflicts = new Set();
for (const group of Object.values(Object.groupBy(videoItems, item => item.videoSha256))) {
  if (!group?.length || group.length < 2) continue;
  if (new Set(group.map(item => item.normalizedTitle)).size > 1) {
    for (const item of group) contentConflicts.add(`${item.sourceZip}|${item.videoEntry}`);
  }
}

const canonicalByTitle = new Map();
for (const item of videoItems) {
  const current = canonicalByTitle.get(item.normalizedTitle);
  if (!current || Number(item.videoNumber) < Number(current.videoNumber)) {
    canonicalByTitle.set(item.normalizedTitle, item);
  }
}

const results = [];
for (const item of canonicalByTitle.values()) {
  const itemKey = `${item.sourceZip}|${item.videoEntry}`;
  if (contentConflicts.has(itemKey)) {
    results.push({
      ...item,
      matchStatus: "revisao_conflito_video",
      matchReason: "O mesmo arquivo de video aparece associado a titulos de produtos diferentes.",
      candidateCount: 0,
      catalogProductId: "",
      catalogTitle: "",
      marketplace: "",
      affiliateLink: "",
      similarity: 0,
    });
    continue;
  }

  const sourceMatches = sourceKeys(item.sourceUrl)
    .flatMap(key => catalogBySourceKey.get(key) || []);
  const exactMatches = catalogByTitle.get(item.normalizedTitle) || [];
  const directMatches = [...new Map([...sourceMatches, ...exactMatches].map(match => [match.product.id, match])).values()];

  if (directMatches.length === 1) {
    const match = directMatches[0];
    results.push({
      ...item,
      matchStatus: sourceMatches.length ? "pronto_chave_origem" : "pronto_titulo_exato",
      matchReason: sourceMatches.length
        ? "Produto de origem ja existe no catalogo com link afiliado confirmado."
        : "Titulo normalizado ja existe no catalogo com link afiliado confirmado.",
      candidateCount: 1,
      catalogProductId: match.product.id,
      catalogTitle: match.title,
      marketplace: match.marketplace,
      affiliateLink: match.affiliateLink,
      similarity: 1,
    });
    continue;
  }

  if (directMatches.length > 1) {
    results.push({
      ...item,
      matchStatus: "revisao_multiplos_exatos",
      matchReason: "Mais de um produto do catalogo corresponde exatamente.",
      candidateCount: directMatches.length,
      catalogProductId: "",
      catalogTitle: directMatches.map(match => match.title),
      marketplace: "",
      affiliateLink: "",
      similarity: 1,
    });
    continue;
  }

  const fuzzyCandidates = catalog
    .map(candidate => ({
      candidate,
      similarity: tokenSimilarity(item.title, candidate.title),
    }))
    .filter(({ candidate, similarity }) =>
      similarity >= 0.72 && compatibleNumbers(item.title, candidate.title))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 5);
  const best = fuzzyCandidates[0];
  results.push({
    ...item,
    matchStatus: best ? "revisao_candidato_catalogo" : "pesquisar_marketplaces",
    matchReason: best
      ? "Ha candidato semelhante, mas a correspondencia exige revisao visual."
      : "Nenhum produto equivalente com link afiliado confirmado foi encontrado no catalogo.",
    candidateCount: fuzzyCandidates.length,
    catalogProductId: best?.candidate.product.id || "",
    catalogTitle: best?.candidate.title || "",
    marketplace: best?.candidate.marketplace || "",
    affiliateLink: "",
    similarity: best?.similarity || 0,
    candidates: fuzzyCandidates.map(({ candidate, similarity }) => ({
      productId: candidate.product.id,
      title: candidate.title,
      marketplace: candidate.marketplace,
      affiliateLink: candidate.affiliateLink,
      similarity,
    })),
  });
}

results.sort((left, right) => Number(left.videoNumber) - Number(right.videoNumber));
const ready = results.filter(item => item.matchStatus.startsWith("pronto_"));
const research = results.filter(item => !item.matchStatus.startsWith("pronto_"));
const statusCounts = Object.fromEntries(
  Object.entries(Object.groupBy(results, item => item.matchStatus))
    .map(([status, group]) => [status, group.length])
    .sort(([left], [right]) => left.localeCompare(right)),
);
const marketplaceCounts = Object.fromEntries(
  Object.entries(Object.groupBy(ready, item => item.marketplace))
    .map(([marketplace, group]) => [marketplace, group.length])
    .sort(([left], [right]) => left.localeCompare(right)),
);

const report = {
  generatedAt: new Date().toISOString(),
  inventoryRecords: inventory.summary.recordCount,
  videoRecords: videoItems.length,
  uniqueProductTitles: canonicalByTitle.size,
  catalogProducts: products.length,
  catalogProductsWithConfirmedAffiliateLink: catalog.length,
  readyCount: ready.length,
  researchCount: research.length,
  statusCounts,
  marketplaceCounts,
  rules: {
    duplicateTitles: "Somente o menor numero de video de cada titulo normalizado segue para a fila.",
    conflictingContent: "Videos identicos vinculados a titulos diferentes sao bloqueados para revisao.",
    automaticMatch: "Somente chave de origem ou titulo normalizado exato com link afiliado confirmado.",
    fuzzyMatch: "Nunca e publicado automaticamente; permanece como candidato para revisao.",
  },
  ready,
  research,
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeCsv(readyCsvPath, ready, [
  "videoNumber",
  "title",
  "sourceZip",
  "videoEntry",
  "catalogProductId",
  "catalogTitle",
  "marketplace",
  "affiliateLink",
  "matchStatus",
]);
writeCsv(researchCsvPath, research, [
  "videoNumber",
  "title",
  "sourceMarketplace",
  "sourceUrl",
  "matchStatus",
  "matchReason",
  "candidateCount",
  "catalogProductId",
  "catalogTitle",
  "marketplace",
  "similarity",
]);

console.log(JSON.stringify({
  outputPath,
  readyCsvPath,
  researchCsvPath,
  uniqueProductTitles: report.uniqueProductTitles,
  readyCount: report.readyCount,
  researchCount: report.researchCount,
  statusCounts,
  marketplaceCounts,
}, null, 2));
