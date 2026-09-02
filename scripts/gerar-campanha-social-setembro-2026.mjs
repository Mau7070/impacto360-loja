import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
const sharp = require("C:/Users/PMNB/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const QRCode = require(path.join(root, "tools", "qrcode", "node_modules", "qrcode"));
const ffmpeg = firstExisting([
  ...findFiles(path.join(root, "tools", "ffmpeg"), "ffmpeg.exe"),
]);
const ffprobe = path.join(path.dirname(ffmpeg), "ffprobe.exe");
const campaign = readJson(path.join(root, "dados", "campanha-setembro-2026-produtos.json"));
const outputRoot = path.resolve(root, "..", "..", "outputs", "campanha-setembro-impacto360-2026-09-02");
const posterDir = path.join(outputRoot, "posters");
const videoDir = path.join(outputRoot, "videos");
const sourceImageDir = path.join(outputRoot, "source-images");

for (const dir of [outputRoot, posterDir, videoDir, sourceImageDir]) fs.mkdirSync(dir, { recursive: true });

const slots = [];
for (const product of campaign.products) {
  const number = String(product.position).padStart(2, "0");
  const safeName = slugify(product.title).slice(0, 54);
  const posterPath = path.join(posterDir, `${number}-${safeName}.png`);
  const videoPath = path.join(videoDir, `${number}-${product.date}-${safeName}.mp4`);
  const imagePath = await resolveProductImage(product.image, number);
  await createPoster({ product, imagePath, posterPath });
  createVideo(posterPath, videoPath);
  const media = probeVideo(videoPath);
  slots.push(buildSlot(product, videoPath, posterPath, media));
  console.log(`[${number}/29] ${product.title}`);
}

const agenda = {
  generatedAt: new Date().toISOString(),
  timezone: "America/Sao_Paulo",
  period: { start: "2026-09-02", end: "2026-09-30" },
  frequency: "diária",
  networks: {
    youtube: { destination: "YouTube Shorts", time: "18:30", externalLinksClickableInDescription: true },
    facebook: { destination: "Página Impacto360", time: "19:00", externalLinksClickableInPost: true },
    tiktok: {
      destination: "TikTok",
      time: "20:00",
      externalLinksClickableInCaption: false,
      note: "A URL fica escrita na legenda e no vídeo; anexar um link de produto somente se a conta mostrar um recurso nativo compatível.",
    },
  },
  policy: {
    oneExactProductPerVideo: true,
    priceClaims: false,
    inventoryClaims: false,
    everyPostContainsProductStoreUrl: true,
    affiliateDisclosure: "A Impacto360 pode receber comissão pela indicação, sem custo adicional.",
  },
  slots,
};

writeJson(path.join(outputRoot, "agenda-setembro-2026.json"), agenda);
writeCsv(path.join(outputRoot, "agenda-setembro-2026.csv"), slots);
writeReport(path.join(outputRoot, "RELATORIO-CAMPANHA.md"), agenda);

console.log(JSON.stringify({
  outputRoot,
  products: campaign.products.length,
  videos: slots.length,
  facebookPosts: slots.length,
  youtubePosts: slots.length,
  tiktokPosts: slots.length,
}, null, 2));

async function createPoster({ product, imagePath, posterPath }) {
  const width = 720;
  const height = 1280;
  const background = await sharp(imagePath)
    .resize(width, height, { fit: "cover" })
    .blur(28)
    .modulate({ brightness: 0.48, saturation: 1.15 })
    .png()
    .toBuffer();
  const hero = await sharp(imagePath)
    .resize(610, 650, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({ top: 18, bottom: 18, left: 18, right: 18, background: "#ffffff" })
    .png()
    .toBuffer();
  const qr = await QRCode.toBuffer(product.storeUrl, {
    type: "png",
    width: 148,
    margin: 1,
    color: { dark: "#08111FFF", light: "#FFFFFFFF" },
  });
  const titleLines = wrap(product.title, 29, 3);
  const titleSvg = textSvg(width, 210, titleLines, 40, 50, "#ffffff", 700);
  const footerSvg = Buffer.from(`
    <svg width="720" height="270" xmlns="http://www.w3.org/2000/svg">
      <rect width="720" height="270" rx="34" fill="#08111f" fill-opacity="0.96"/>
      <text x="36" y="56" font-family="Arial" font-size="27" font-weight="700" fill="#ffb000">OFERTA SELECIONADA</text>
      <text x="36" y="98" font-family="Arial" font-size="25" font-weight="700" fill="#ffffff">Confira preço e condições atuais</text>
      <text x="36" y="142" font-family="Arial" font-size="20" fill="#dce8f7">Escaneie o QR Code ou abra o link da legenda</text>
      <text x="36" y="188" font-family="Arial" font-size="18" fill="#8fe3ff">${escapeXml(shortDisplayUrl(product.storeUrl))}</text>
      <text x="36" y="230" font-family="Arial" font-size="15" fill="#a9b8ca">Publicidade afiliada • sem custo adicional</text>
    </svg>
  `);
  const brandSvg = Buffer.from(`
    <svg width="720" height="78" xmlns="http://www.w3.org/2000/svg">
      <rect width="720" height="78" fill="#08111f"/>
      <text x="34" y="51" font-family="Arial" font-size="33" font-weight="800" fill="#ffffff">IMPACTO<tspan fill="#ffb000">360</tspan></text>
      <text x="680" y="49" text-anchor="end" font-family="Arial" font-size="18" fill="#b9c8da">ACHADOS DE SETEMBRO</text>
    </svg>
  `);
  await sharp(background)
    .composite([
      { input: brandSvg, top: 0, left: 0 },
      { input: titleSvg, top: 88, left: 0 },
      { input: hero, top: 292, left: 37 },
      { input: footerSvg, top: 1000, left: 0 },
      { input: qr, top: 1065, left: 538 },
    ])
    .png({ compressionLevel: 8 })
    .toFile(posterPath);
}

function createVideo(posterPath, videoPath) {
  const filter = "scale=760:1350,zoompan=z='min(zoom+0.0006,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=240:s=720x1280:fps=30,format=yuv420p";
  const result = spawnSync(ffmpeg, [
    "-y", "-loop", "1", "-i", posterPath,
    "-vf", filter,
    "-t", "8", "-r", "30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
    "-movflags", "+faststart", "-an", videoPath,
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`FFmpeg falhou para ${videoPath}: ${result.stderr}`);
}

function probeVideo(videoPath) {
  const result = spawnSync(ffprobe, [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,duration:format=duration,size",
    "-of", "json", videoPath,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`FFprobe falhou para ${videoPath}: ${result.stderr}`);
  const data = JSON.parse(result.stdout);
  const stream = data.streams?.[0] || {};
  const format = data.format || {};
  if (stream.codec_name !== "h264" || stream.width !== 720 || stream.height !== 1280 || Number(format.duration) < 7.9 || Number(format.size) < 50_000) {
    throw new Error(`Vídeo inválido: ${videoPath}`);
  }
  return { codec: stream.codec_name, width: stream.width, height: stream.height, duration: Number(format.duration), bytes: Number(format.size) };
}

function buildSlot(product, videoFile, posterFile, media) {
  const disclosure = "A Impacto360 pode receber comissão pela indicação, sem custo adicional.";
  const tags = hashtagsFor(product);
  const lead = leadFor(product);
  return {
    slotId: `${product.date}-${String(product.position).padStart(2, "0")}`,
    date: product.date,
    productId: product.productId,
    title: product.title,
    category: product.category,
    storeUrl: product.storeUrl,
    affiliateUrl: product.affiliateLink,
    sourceProductUrl: product.sourceProductUrl,
    videoFile,
    posterFile,
    media,
    youtube: {
      time: "18:30",
      title: compact(`${product.title} | Achado Impacto360 #Shorts`, 98),
      description: `Confira o produto: ${product.storeUrl}\n\n${lead}\n\n${disclosure}\n\n${tags} #Shorts`,
      linkExpectedClickable: true,
    },
    facebook: {
      time: "19:00",
      caption: `🔥 ${lead}\n\nVeja detalhes e condições atualizadas: ${product.storeUrl}\n\n${disclosure}\n\n${tags}`,
      linkExpectedClickable: true,
    },
    tiktok: {
      time: "20:00",
      caption: `🔥 ${lead}\n\nLink Impacto360: ${product.storeUrl}\n${disclosure}\n\n${tags}`,
      urlPresentInCaption: true,
      urlVisibleInVideo: true,
      qrCodeTargetsStoreUrl: true,
      nativeClickableLinkRequiredIfAvailable: true,
      captionUrlExpectedClickable: false,
    },
  };
}

function leadFor(product) {
  if (product.category.startsWith("Bicicletas")) return `Treino em casa ganha outro nível com ${product.title}.`;
  if (product.category === "Celulares") return `Tecnologia em destaque: conheça ${product.title}.`;
  if (product.category.startsWith("TVs")) return `Cinema, jogos e streaming em tela grande com ${product.title}.`;
  return `Achado viral do dia: ${product.title}.`;
}

function hashtagsFor(product) {
  if (product.category.startsWith("Bicicletas")) return "#Impacto360 #BicicletaErgometrica #FitnessEmCasa #Achadinhos";
  if (product.category === "Celulares") return "#Impacto360 #Celulares #Tecnologia #Lancamentos";
  if (product.category.startsWith("TVs")) return "#Impacto360 #SmartTV #CinemaEmCasa #Tecnologia";
  return "#Impacto360 #ProdutosVirais #Achadinhos #ComprasOnline";
}

function writeCsv(file, slots) {
  const rows = [["data", "rede", "hora", "produto", "link_loja", "video"]];
  for (const slot of slots) {
    for (const network of ["youtube", "facebook", "tiktok"]) {
      rows.push([slot.date, network, slot[network].time, slot.title, slot.storeUrl, slot.videoFile]);
    }
  }
  fs.writeFileSync(file, `${rows.map(row => row.map(csv).join(",")).join("\n")}\n`, "utf8");
}

function writeReport(file, agenda) {
  const table = agenda.slots.map(slot => `| ${slot.date} | ${slot.title.replaceAll("|", "-")} | ${slot.storeUrl} |`).join("\n");
  const text = `# Campanha Impacto360 — setembro de 2026\n\nPeríodo: 02/09/2026 a 30/09/2026. Fuso: America/Sao_Paulo.\n\n- 29 produtos e 29 vídeos verticais exclusivos.\n- YouTube Shorts: 18:30.\n- Facebook Impacto360: 19:00.\n- TikTok: 20:00.\n- Toda legenda contém a URL individual da loja.\n- Facebook e YouTube tornam URLs externas clicáveis. No TikTok, a URL da legenda pode aparecer apenas como texto; o vídeo também contém QR Code e URL visível.\n- Nenhum preço, estoque ou desconto fixo foi incluído.\n\n| Data | Produto | Link individual |\n|---|---|---|\n${table}\n`;
  fs.writeFileSync(file, text, "utf8");
}

function textSvg(width, height, lines, fontSize, lineHeight, color, weight) {
  const tspans = lines.map((line, index) => `<tspan x="360" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="28" fill="#08111f" fill-opacity="0.90"/><text x="360" y="${fontSize + 16}" text-anchor="middle" font-family="Arial" font-size="${fontSize}" font-weight="${weight}" fill="${color}">${tspans}</text></svg>`);
}

function wrap(value, max, maxLines) {
  const words = String(value).replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  for (const word of words) {
    const current = lines.at(-1) || "";
    if (!current || `${current} ${word}`.length > max) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(1, max - 1)).trim()}…`;
    return kept;
  }
  return lines;
}

async function resolveProductImage(relative, number) {
  if (/^https:\/\//i.test(String(relative || ""))) {
    const response = await fetch(relative, { headers: { "user-agent": "Impacto360SocialCampaign/1.0" } });
    if (!response.ok) throw new Error(`Falha ao baixar imagem reutilizada (${response.status}): ${relative}`);
    const contentType = response.headers.get("content-type") || "";
    const ext = contentType.includes("webp") ? ".webp" : contentType.includes("png") ? ".png" : ".jpg";
    const file = path.join(sourceImageDir, `${number}-reutilizada${ext}`);
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    return file;
  }
  const clean = String(relative || "").replace(/^\/+/, "");
  const candidates = [path.join(root, clean), path.join(root, "pacote-github-pages-pronto", clean)];
  const found = candidates.find(file => fs.existsSync(file));
  if (!found) throw new Error(`Imagem do produto não encontrada: ${relative}`);
  return found;
}

function shortDisplayUrl(url) {
  return String(url).replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function compact(value, max) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function slugify(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function findFiles(directory, name) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...findFiles(current, name));
    else if (entry.name.toLowerCase() === name.toLowerCase()) found.push(current);
  }
  return found;
}

function firstExisting(files) {
  const file = files.find(value => fs.existsSync(value));
  if (!file) throw new Error("FFmpeg não encontrado em tools/ffmpeg.");
  return file;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
