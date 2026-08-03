import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "dados", "social-videos-20260730");
const limit = Math.max(20, Number(valueAfter("--limit") || 80));
const output = path.resolve(valueAfter("--output") || path.join(sourceDir, "candidatos-virais.json"));
const excludeAgenda = valueAfter("--exclude-agenda");

const metadata = readJson(path.join(sourceDir, "metadata-videos.json"));
const inventory = readJson(path.join(sourceDir, "inventario-videos.json"));
const catalog = readJson(path.join(root, "dados", "catalogo-publico.json"));
const inventoryByHash = new Map(inventory.items.map(item => [item.videoSha256, item]));
const excludedNumbers = new Set();
const excludedHashes = new Set();

if (excludeAgenda && fs.existsSync(excludeAgenda)) {
  const agenda = readJson(excludeAgenda);
  for (const slot of agenda.slots || agenda.schedule || []) {
    const source = String(slot.videoSource || "");
    const number = slot.videoNumber || source.match(/(?:^|[\\/])VIDEO\s*0*(\d+)/i)?.[1];
    if (number) excludedNumbers.add(Number(number));
    if (slot.videoSha256) excludedHashes.add(slot.videoSha256);
  }
}

const stopWords = new Set(normalize(`a o as os de da do das dos em para por com sem e ou um uma
  kit conjunto produto modelo tipo cor tamanho pc pcs unidade unidades novo nova casa
  profissional portatil pratico pratica multifuncional ajustavel original universal
  preto preta branco branca azul rosa grande pequeno pequena`).split(" "));
const viralTerms = new Map(Object.entries({
  automatico: 7, automatica: 7, eletrico: 6, eletrica: 6, semfio: 6, dobravel: 6,
  organizador: 7, armazenamento: 5, limpeza: 7, limpador: 7, removedor: 6,
  corta: 5, cortador: 6, descascador: 7, dispenser: 6, impermeavel: 5,
  magnetico: 6, magnetica: 6, recarregavel: 5, usb: 4, led: 4,
  cozinha: 5, banheiro: 4, carro: 5, pet: 5, gato: 4, cachorro: 4,
  maquiagem: 5, cabelo: 5, unha: 5, sapato: 4, aspirador: 8, robo: 8,
  selante: 6, reparo: 6, ferramenta: 5, antiaderente: 5, airfryer: 7,
}));
const unsafeTerms = /arma|defesa pessoal|emagre|cura|tratamento|medic|infalivel|milagre|pirata|replica/i;

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter(token => token.length >= 3 && !stopWords.has(token));
}

function productMatch(videoTokens, videoNormalized, product) {
  const productTokens = product._allTokens;
  const productNameTokens = product._nameTokens;
  const intersection = productNameTokens.filter(token => videoTokens.includes(token));
  const videoWeight = videoTokens.reduce((sum, token) => sum + token.length, 0) || 1;
  const productWeight = productNameTokens.reduce((sum, token) => sum + token.length, 0) || 1;
  const overlapWeight = intersection.reduce((sum, token) => sum + token.length, 0);
  const productCoverage = overlapWeight / productWeight;
  const videoCoverage = overlapWeight / videoWeight;
  const categoryOverlap = productTokens.filter(token => videoTokens.includes(token)).length;
  const exactBoost = videoNormalized.includes(product._normalizedName) || product._normalizedName.includes(videoNormalized) ? 0.2 : 0;
  const score = Math.min(1, productCoverage * 0.58 + videoCoverage * 0.32 + Math.min(0.1, categoryOverlap * 0.015) + exactBoost);
  return { score, intersection, productCoverage, videoCoverage };
}

function viralScore(video, item, match) {
  const duration = Number(video.durationSeconds || 0);
  const durationScore = duration >= 7 && duration <= 22 ? 24 : duration >= 5 && duration <= 30 ? 16 : 5;
  const resolutionScore = video.width >= 1080 ? 12 : video.width >= 720 ? 9 : 4;
  const normalized = normalize(item.title);
  const keywordScore = [...viralTerms].reduce((sum, [term, points]) => sum + (normalized.includes(term) ? points : 0), 0);
  const marketplaceScore = /shopee|amazon|mercado livre/i.test(item.sourceMarketplace || "") ? 8 : 0;
  const matchScore = Math.round(match.score * 38);
  const unsafePenalty = unsafeTerms.test(normalized) ? 30 : 0;
  const titlePenalty = normalized.split(" ").length > 28 ? 5 : 0;
  return Math.max(0, durationScore + resolutionScore + Math.min(24, keywordScore) + marketplaceScore + matchScore - unsafePenalty - titlePenalty);
}

const bestVideoByHash = new Map();
for (const video of metadata.items) {
  if (video.status !== "ok" || video.orientation !== "vertical") continue;
  if (excludedNumbers.has(Number(video.videoNumber)) || excludedHashes.has(video.videoSha256)) continue;
  const item = inventoryByHash.get(video.videoSha256);
  if (!item?.sourceUrl || !/^https:\/\//i.test(item.sourceUrl)) continue;
  const previous = bestVideoByHash.get(video.videoSha256);
  if (!previous || video.width * video.height > previous.width * previous.height) bestVideoByHash.set(video.videoSha256, video);
}

const catalogIndex = catalog.map(product => ({
  ...product,
  _allTokens: [...new Set(tokens([product.name, product.brand, product.model, product.category, product.subcategory].join(" ")))],
  _nameTokens: [...new Set(tokens(product.name))],
  _normalizedName: normalize(product.name),
}));

const candidates = [];
for (const video of bestVideoByHash.values()) {
  const item = inventoryByHash.get(video.videoSha256);
  const videoTokens = [...new Set(tokens(item.title))];
  const videoNormalized = normalize(item.title);
  const matches = catalogIndex
    .map(product => ({ product, ...productMatch(videoTokens, videoNormalized, product) }))
    .filter(match => match.intersection.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const best = matches[0];
  const runnerUp = matches[1];
  if (!best || best.score < 0.39) continue;
  const margin = best.score - (runnerUp?.score || 0);
  candidates.push({
    videoNumber: video.videoNumber,
    videoSha256: video.videoSha256,
    title: item.title,
    sourceZip: item.sourceZip,
    sourceZipPath: item.sourceZipPath,
    videoEntry: item.videoEntry,
    sourceMarketplace: item.sourceMarketplace,
    sourceUrl: item.sourceUrl,
    durationSeconds: video.durationSeconds,
    resolution: video.resolution,
    viralScore: viralScore(video, item, best),
    matchScore: Number(best.score.toFixed(4)),
    matchMargin: Number(margin.toFixed(4)),
    matchedTerms: best.intersection,
    product: {
      id: best.product.id,
      name: best.product.name,
      storeId: best.product.storeId,
      marketplace: best.product.partner,
      affiliateLink: best.product.link,
      shortUrl: best.product.shortUrl,
      shortPath: best.product.shortPath,
      image: best.product.image,
      slug: best.product.slug,
    },
    alternativeMatches: matches.slice(1).map(match => ({
      id: match.product.id,
      name: match.product.name,
      score: Number(match.score.toFixed(4)),
      matchedTerms: match.intersection,
    })),
    reviewStatus: "aguardando_revisao_visual",
  });
}

candidates.sort((a, b) => b.viralScore - a.viralScore || b.matchScore - a.matchScore || a.videoNumber - b.videoNumber);
const result = {
  generatedAt: new Date().toISOString(),
  criteria: {
    source: "metadata tecnica, demonstrabilidade do titulo e correspondencia com catalogo afiliado",
    viralPotentialIsEstimate: true,
    requiresVisualReview: true,
    minimumMatchScore: 0.39,
    noDuplicateVideoHash: true,
  },
  summary: {
    videosAnalyzed: bestVideoByHash.size,
    candidatesFound: candidates.length,
    emitted: Math.min(limit, candidates.length),
    excludedAgendaVideoNumbers: excludedNumbers.size,
  },
  candidates: candidates.slice(0, limit),
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result.summary, null, 2));

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : "";
}
