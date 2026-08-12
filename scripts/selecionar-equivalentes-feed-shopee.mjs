import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const queueDir = path.join(root, "dados", "social-videos-20260730", "importacao-marketplaces-20260812");
const queue = readJson(path.join(queueDir, "fila.json"));
const feedPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(queueDir, "shopee-feed-geral-20260812.csv");

const parsed = parseCsv(fs.readFileSync(feedPath, "utf8"));
const header = parsed.rows.shift() || [];
const index = new Map(header.map((name, position) => [name.replace(/^\uFEFF/, ""), position]));
for (const required of ["itemid", "title", "image_link", "product_link", "product_short link", "price", "sale_price"]) {
  if (!index.has(required)) throw new Error(`Coluna ausente no feed: ${required}`);
}

const feedByTitle = new Map();
for (const row of parsed.rows) {
  if (row.length !== header.length) continue;
  const key = normalize(cell(row, "title"));
  if (!key) continue;
  const products = feedByTitle.get(key) || [];
  products.push({
    itemId: cell(row, "itemid"),
    title: cell(row, "title"),
    imageUrl: cell(row, "image_link"),
    productUrl: cell(row, "product_link"),
    feedAffiliateUrl: cell(row, "product_short link"),
    price: cell(row, "price"),
    salePrice: cell(row, "sale_price"),
  });
  feedByTitle.set(key, products);
}

const pending = queue.shopeeBatches.flatMap(batch => batch.items);
const candidates = [];
for (const item of pending) {
  const matches = feedByTitle.get(normalize(item.title)) || [];
  for (const product of matches) {
    if (product.itemId === itemId(item.canonicalSourceUrl)) continue;
    candidates.push({
      videoNumber: item.videoNumber,
      videoSha256: item.videoSha256,
      sourceTitle: item.title,
      sourceUrl: item.canonicalSourceUrl,
      candidateItemId: product.itemId,
      candidateTitle: product.title,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      feedAffiliateUrl: product.feedAffiliateUrl,
      price: product.price,
      salePrice: product.salePrice,
      matchRule: "titulo_normalizado_identico",
      status: "candidato_para_revisao_visual_e_link_curto",
    });
  }
}

const outputJson = path.join(queueDir, "shopee-equivalentes-titulo-exato.json");
const outputCsv = path.join(queueDir, "shopee-equivalentes-titulo-exato.csv");
fs.writeFileSync(outputJson, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  feedPath: path.relative(root, feedPath).replaceAll("\\", "/"),
  summary: {
    pendingShopeeProducts: pending.length,
    activeFeedProducts: parsed.rows.length,
    exactNormalizedTitleCandidates: candidates.length,
    videosWithCandidate: new Set(candidates.map(item => item.videoSha256)).size,
  },
  candidates,
}, null, 2)}\n`, "utf8");
writeCsv(outputCsv, candidates, [
  "videoNumber", "sourceTitle", "candidateTitle", "candidateItemId", "salePrice", "price",
  "imageUrl", "productUrl", "feedAffiliateUrl", "matchRule", "status", "videoSha256",
]);
console.log(JSON.stringify({
  candidates: candidates.length,
  videosWithCandidate: new Set(candidates.map(item => item.videoSha256)).size,
}, null, 2));

function cell(row, name) {
  return String(row[index.get(name)] || "").trim();
}

function itemId(url) {
  return String(url || "").match(/\/product\/\d+\/(\d+)/i)?.[1] || "";
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let position = 0; position < text.length; position += 1) {
    const char = text[position];
    if (quoted) {
      if (char === '"') {
        if (text[position + 1] === '"') {
          value += '"';
          position += 1;
        } else {
          quoted = false;
        }
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  return { rows };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeCsv(file, rows, columns) {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) lines.push(columns.map(column => csvCell(row[column])).join(","));
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
