import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "dados", "social-videos-20260730");
const crossmatchPath = path.join(sourceDir, "cruzamento-catalogo.json");
const confirmedPath = path.join(sourceDir, "produtos-confirmados.json");
const outputDir = path.join(sourceDir, "importacao-marketplaces-20260812");

const crossmatch = readJson(crossmatchPath);
const confirmed = readJson(confirmedPath);
const confirmedHashes = new Set((confirmed.items || []).map(item => item.videoSha256));

const items = [...(crossmatch.ready || []), ...(crossmatch.research || [])]
  .filter(item => item.hasVideo && !confirmedHashes.has(item.videoSha256))
  .map(item => ({
    videoNumber: Number(item.videoNumber),
    videoSha256: item.videoSha256,
    title: item.title,
    normalizedTitle: item.normalizedTitle,
    sourceMarketplace: item.sourceMarketplace || "sem_classificacao",
    sourceUrl: item.sourceUrl || "",
    canonicalSourceUrl: canonicalizeSourceUrl(item.sourceUrl || ""),
    sourceZip: item.sourceZip,
    videoEntry: item.videoEntry,
    matchStatus: item.matchStatus,
  }))
  .sort((left, right) => left.videoNumber - right.videoNumber);

const shopeeReady = items.filter(item =>
  item.sourceMarketplace === "shopee" &&
  /^https:\/\/shopee\.com\.br\/product\/\d+\/\d+$/.test(item.canonicalSourceUrl)
);
const shopeeInvalid = items.filter(item =>
  item.sourceMarketplace === "shopee" &&
  !/^https:\/\/shopee\.com\.br\/product\/\d+\/\d+$/.test(item.canonicalSourceUrl)
);
const otherMarketplaces = items.filter(item => item.sourceMarketplace !== "shopee");

const shopeeBatches = chunk(shopeeReady, 5).map((batch, index) => ({
  batchId: `shopee-${String(index + 1).padStart(4, "0")}`,
  status: "aguardando_link_afiliado",
  links: batch.map(item => item.canonicalSourceUrl),
  items: batch,
}));

const output = {
  generatedAt: new Date().toISOString(),
  source: "dados/social-videos-20260730/cruzamento-catalogo.json",
  rules: {
    shopeeBatchSize: 5,
    deduplicationKey: "videoSha256",
    confirmedItemsExcluded: confirmedHashes.size,
    importGate: "Somente produto, foto e link afiliado confirmados podem entrar no catalogo.",
    ambiguousMatches: "Itens ambiguos permanecem em revisao e nao sao publicados automaticamente.",
  },
  summary: {
    pendingUniqueProducts: items.length,
    shopeeReadyForAffiliateConversion: shopeeReady.length,
    shopeeBatches: shopeeBatches.length,
    shopeeInvalidUrls: shopeeInvalid.length,
    amazonSources: otherMarketplaces.filter(item => item.sourceMarketplace === "amazon").length,
    otherSources: otherMarketplaces.filter(item => item.sourceMarketplace === "outro").length,
    missingOrInvalidSources: otherMarketplaces.filter(item =>
      item.sourceMarketplace === "sem_link" || item.sourceMarketplace === "link_invalido"
    ).length,
  },
  shopeeBatches,
  shopeeInvalid,
  otherMarketplaces,
};

fs.mkdirSync(outputDir, { recursive: true });
writeJson(path.join(outputDir, "fila.json"), output);
writeCsv(
  path.join(outputDir, "shopee-lotes.csv"),
  shopeeBatches.flatMap(batch => batch.items.map(item => ({
    batchId: batch.batchId,
    status: batch.status,
    videoNumber: item.videoNumber,
    title: item.title,
    sourceUrl: item.canonicalSourceUrl,
    videoSha256: item.videoSha256,
  }))),
  ["batchId", "status", "videoNumber", "title", "sourceUrl", "videoSha256"]
);
writeCsv(
  path.join(outputDir, "outras-origens.csv"),
  otherMarketplaces,
  ["videoNumber", "title", "sourceMarketplace", "sourceUrl", "canonicalSourceUrl", "videoSha256"]
);
fs.writeFileSync(path.join(outputDir, "RELATORIO.md"), reportMarkdown(output), "utf8");

console.log(JSON.stringify(output.summary, null, 2));

function canonicalizeSourceUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const shopeeProduct = text.match(/\/product\/(\d+)\/(\d+)/i);
  const shopeeSlug = text.match(/-i\.(\d+)\.(\d+)/i);
  const shopee = shopeeProduct || shopeeSlug;
  if (shopee) return `https://shopee.com.br/product/${shopee[1]}/${shopee[2]}`;
  try {
    const url = new URL(text);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeCsv(file, rows, columns) {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map(column => csvCell(row[column])).join(","));
  }
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function reportMarkdown(value) {
  const summary = value.summary;
  return [
    "# Fila de importacao dos videos",
    "",
    `Gerada em: ${value.generatedAt}`,
    "",
    `- Produtos unicos pendentes: ${summary.pendingUniqueProducts}`,
    `- Links Shopee prontos para conversao: ${summary.shopeeReadyForAffiliateConversion}`,
    `- Lotes Shopee de ate cinco links: ${summary.shopeeBatches}`,
    `- URLs Shopee invalidas: ${summary.shopeeInvalidUrls}`,
    `- Origens Amazon: ${summary.amazonSources}`,
    `- Outras origens que exigem equivalente: ${summary.otherSources}`,
    `- Origem ausente ou invalida: ${summary.missingOrInvalidSources}`,
    "",
    "Nenhum item desta fila deve ser publicado sem confirmar pagina, foto e link afiliado.",
    "",
  ].join("\n");
}
