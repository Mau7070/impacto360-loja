import fs from "node:fs";
import path from "node:path";
import { productLinkLabel, productShortUrl } from "./product-short-links.mjs";

const root = process.cwd();
const sourceDir = path.join(root, "dados", "social-videos-20260730");
const crossmatchPath = path.join(sourceDir, "cruzamento-catalogo.json");
const manualReviewPath = path.join(sourceDir, "revisoes-manuais.json");
const outputJsonPath = path.join(sourceDir, "calendario-3-por-dia.json");
const outputCsvPath = path.join(sourceDir, "calendario-3-por-dia.csv");
const startDate = process.argv[2] || "2026-07-31";
const postsPerDay = 3;
const siteUrl = "https://impacto360afiliado.com.br";

const crossmatch = readJson(crossmatchPath);
const manualReviews = fs.existsSync(manualReviewPath)
  ? readJson(manualReviewPath)
  : { reviews: [] };
const manualByHash = new Map(
  (manualReviews.reviews || []).map(review => [review.videoSha256, review])
);

const excluded = [];
const candidates = [];

for (const item of crossmatch.research || []) {
  const manual = manualByHash.get(item.videoSha256);
  const reasons = [];

  if (item.matchStatus === "revisao_conflito_video") {
    reasons.push("Mesmo conteúdo de vídeo associado a produtos diferentes.");
  }
  if (manual?.decision === "bloqueado") {
    reasons.push(manual.reason || "Revisão manual bloqueou o vínculo.");
  }

  if (reasons.length) {
    excluded.push({
      videoNumber: item.videoNumber,
      title: item.title,
      videoSha256: item.videoSha256,
      reasons
    });
    continue;
  }

  candidates.push(item);
}

candidates.sort((a, b) =>
  a.videoNumber - b.videoNumber
  || a.normalizedTitle.localeCompare(b.normalizedTitle, "pt-BR")
);

const schedule = candidates.map((item, index) => {
  const dayOffset = Math.floor(index / postsPerDay);
  const slot = (index % postsPerDay) + 1;
  const date = addUtcDays(startDate, dayOffset);
  const searchLink = `${siteUrl}/buscar/?q=${encodeURIComponent(item.title)}`;
  const productLink = item.catalogProductId
    ? productShortUrl(item.catalogProductId, siteUrl)
    : searchLink;
  const affiliateLink = item.affiliateLink || "";
  const approved = item.matchStatus === "pronto" && Boolean(affiliateLink);

  return {
    sequence: index + 1,
    date,
    slot,
    videoNumber: item.videoNumber,
    title: item.title,
    normalizedTitle: item.normalizedTitle,
    sourceMarketplace: item.sourceMarketplace,
    sourceUrl: item.sourceUrl,
    sourceZip: item.sourceZip,
    sourceZipPath: item.sourceZipPath,
    videoEntry: item.videoEntry,
    videoSha256: item.videoSha256,
    catalogProductId: item.catalogProductId || "",
    affiliateMarketplace: item.marketplace || "",
    affiliateLink,
    storeLink: approved ? productLink : "",
    linkLabel: approved ? productLinkLabel({ name: item.title }) : "",
    publicationStatus: approved
      ? "pronto_para_preparar"
      : "aguardando_revisao_visual_e_link_afiliado",
    caption: approved
      ? buildCaption(item.title, productLink)
      : "",
    hashtags: approved
      ? ["#Impacto360", "#Achadinhos", "#Oferta", "#ComprasOnline"]
      : []
  };
});

const document = {
  generatedAt: new Date().toISOString(),
  startDate,
  postsPerDay,
  rules: {
    noDuplicateVideoHash: true,
    requiresVisualReview: true,
    requiresConfirmedAffiliateLink: true,
    neverPublishesPendingItems: true,
    pricesAreNotCopiedFromVideoTitles: true
  },
  summary: {
    scheduled: schedule.length,
    excluded: excluded.length,
    readyToPrepare: schedule.filter(item => item.publicationStatus === "pronto_para_preparar").length,
    pendingReviewAndAffiliateLink: schedule.filter(item => item.publicationStatus !== "pronto_para_preparar").length,
    firstDate: schedule[0]?.date || "",
    lastDate: schedule.at(-1)?.date || ""
  },
  excluded,
  schedule
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
fs.writeFileSync(outputCsvPath, toCsv(schedule), "utf8");

console.log(JSON.stringify(document.summary, null, 2));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function addUtcDays(isoDate, dayOffset) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Data inicial inválida: ${isoDate}`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function buildCaption(title, link) {
  return [
    title,
    "",
    "Confira detalhes, disponibilidade e condições atualizadas na Impacto360:",
    link,
    "",
    "Este conteúdo pode conter link de afiliado."
  ].join("\n");
}

function toCsv(rows) {
  const columns = [
    "sequence",
    "date",
    "slot",
    "videoNumber",
    "title",
    "sourceMarketplace",
    "sourceUrl",
    "sourceZip",
    "videoEntry",
    "videoSha256",
    "catalogProductId",
    "affiliateMarketplace",
    "affiliateLink",
    "storeLink",
    "publicationStatus",
    "caption",
    "hashtags"
  ];
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map(column => {
      const value = column === "hashtags" ? row.hashtags.join(" ") : row[column];
      return csvCell(value);
    }).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}
