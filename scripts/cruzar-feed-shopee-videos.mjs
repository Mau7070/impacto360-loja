import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "dados", "social-videos-20260730");
const queueDir = path.join(dataDir, "importacao-marketplaces-20260812");
const queuePath = path.join(queueDir, "fila.json");
const feedPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(queueDir, "shopee-feed-oficial-20260812.csv");
const outputPath = path.join(queueDir, "shopee-feed-cruzamento.json");
const outputCsvPath = path.join(queueDir, "shopee-feed-correspondencias.csv");

const queue = readJson(queuePath);
const pendingShopee = queue.shopeeBatches.flatMap(batch => batch.items);
const pendingByItemId = new Map();
for (const item of pendingShopee) {
  const itemId = shopeeItemId(item.canonicalSourceUrl);
  if (!itemId) continue;
  const group = pendingByItemId.get(itemId) || [];
  group.push(item);
  pendingByItemId.set(itemId, group);
}

const parsed = parseCsv(fs.readFileSync(feedPath, "utf8"));
const header = parsed.rows.shift() || [];
const headerIndex = new Map(header.map((name, index) => [name.replace(/^\uFEFF/, ""), index]));
const requiredColumns = [
  "itemid",
  "sale_price",
  "price",
  "description",
  "title",
  "image_link",
  "product_link",
  "product_short link",
];
for (const column of requiredColumns) {
  if (!headerIndex.has(column)) throw new Error(`Coluna ausente no feed: ${column}`);
}

const matches = [];
const rejected = [];
for (const row of parsed.rows) {
  if (row.length !== header.length) {
    rejected.push({ reason: "numero_de_colunas_invalido", columns: row.length });
    continue;
  }
  const itemId = cell(row, "itemid");
  const pendingItems = pendingByItemId.get(itemId);
  if (!pendingItems?.length) continue;

  const affiliateLink = cell(row, "product_short link");
  const imageUrl = cell(row, "image_link");
  const sourceProductUrl = cell(row, "product_link");
  const validAffiliate = /^https:\/\/s\.shopee\.com\.br\/[A-Za-z0-9_-]+$/.test(affiliateLink);
  const validImage = /^https:\/\//.test(imageUrl);
  const validProductUrl = /shopee\.com\.br/i.test(sourceProductUrl);

  for (const pending of pendingItems) {
    const match = {
      videoNumber: pending.videoNumber,
      videoSha256: pending.videoSha256,
      sourceTitle: pending.title,
      sourceUrl: pending.canonicalSourceUrl,
      itemId,
      feedTitle: cell(row, "title"),
      description: cell(row, "description"),
      price: cell(row, "price"),
      salePrice: cell(row, "sale_price"),
      imageUrl,
      shopName: cell(row, "shop_name"),
      productUrl: sourceProductUrl,
      affiliateLink,
      checks: {
        exactItemId: true,
        activeInOfficialDailyFeed: true,
        validAffiliate,
        validImage,
        validProductUrl,
      },
    };
    match.status = Object.values(match.checks).every(Boolean)
      ? "pronto_para_revisao_visual"
      : "bloqueado_dados_incompletos";
    matches.push(match);
  }
}

const matchedHashes = new Set(matches.map(item => item.videoSha256));
const missing = pendingShopee
  .filter(item => !matchedHashes.has(item.videoSha256))
  .map(item => ({
    videoNumber: item.videoNumber,
    videoSha256: item.videoSha256,
    title: item.title,
    sourceUrl: item.canonicalSourceUrl,
    itemId: shopeeItemId(item.canonicalSourceUrl),
    status: "nao_localizado_no_trecho_do_feed",
  }));

const result = {
  generatedAt: new Date().toISOString(),
  feedPath: path.relative(root, feedPath).replaceAll("\\", "/"),
  feedBytes: fs.statSync(feedPath).size,
  parser: {
    completeRows: parsed.rows.length,
    discardedTrailingRecord: parsed.discardedTrailingRecord,
    rejectedRows: rejected.length,
    columns: header.length,
  },
  summary: {
    pendingShopeeProducts: pendingShopee.length,
    exactItemIdMatches: matches.length,
    readyForVisualReview: matches.filter(item => item.status === "pronto_para_revisao_visual").length,
    blockedIncomplete: matches.filter(item => item.status !== "pronto_para_revisao_visual").length,
    notLocatedInPartialFeed: missing.length,
  },
  matches,
  missing,
};

writeJson(outputPath, result);
writeCsv(outputCsvPath, matches, [
  "videoNumber",
  "sourceTitle",
  "feedTitle",
  "itemId",
  "price",
  "salePrice",
  "shopName",
  "imageUrl",
  "productUrl",
  "affiliateLink",
  "status",
  "videoSha256",
]);
console.log(JSON.stringify(result.summary, null, 2));

function cell(row, name) {
  return String(row[headerIndex.get(name)] || "").trim();
}

function shopeeItemId(url) {
  return String(url || "").match(/\/product\/\d+\/(\d+)/i)?.[1] || "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  let index = 0;
  for (; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
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
  const hasTrailingData = row.length > 0 || value.length > 0 || quoted;
  return { rows, discardedTrailingRecord: hasTrailingData };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeCsv(file, rows, columns) {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) lines.push(columns.map(column => csvCell(row[column])).join(","));
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
