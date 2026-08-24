import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const ffmpeg = path.join(os.tmpdir(), "impacto360-ffmpeg-20260824", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const report = JSON.parse(fs.readFileSync(path.join(root, "dados", "relatorio-importacao-academia-mercado-livre-20-20260824.json"), "utf8"));
const outputDir = path.join(root, "dados", "campanha-academia-20260825-a-0913");
const videoDir = path.join(outputDir, "videos");
fs.mkdirSync(videoDir, { recursive: true });

const notice = "A Impacto360 pode receber comissão pela indicação, sem custo adicional.";
const networks = ["instagram", "facebook", "tiktok", "x", "youtube_shorts", "pinterest", "threads", "whatsapp"];
const slots = [];
const slugify = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

for (let index = 0; index < report.imported.length; index += 1) {
  const product = report.imported[index];
  const sourceImage = path.join(root, product.image.replaceAll("/", path.sep));
  const videoFile = path.join(videoDir, `${String(index + 1).padStart(2, "0")}-${product.externalId.toLowerCase()}.mp4`);
  const filter = [
    "scale=1080:1350:force_original_aspect_ratio=decrease",
    "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x07121E",
    "zoompan=z='min(zoom+0.00045,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=250:s=1080x1920:fps=25",
    "fade=t=in:st=0:d=0.5",
    "fade=t=out:st=9.2:d=0.8",
  ].join(",");
  execFileSync(ffmpeg, [
    "-y", "-loop", "1", "-i", sourceImage,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-vf", filter, "-t", "10", "-r", "25",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", videoFile,
  ], { stdio: "ignore" });
  const day = new Date("2026-08-25T12:00:00-03:00");
  day.setDate(day.getDate() + index);
  const date = day.toISOString().slice(0, 10);
  const storeUrl = `https://impacto360afiliado.com.br/produto/${slugify(product.title)}/`;
  const baseCaption = `${product.title}\n\nVeja os detalhes na Impacto360: ${storeUrl}\n\n${notice}`;
  const videoSha256 = crypto.createHash("sha256").update(fs.readFileSync(videoFile)).digest("hex");
  slots.push({
    slotId: `academia-ml-${date}-1800`, date, time: "18:00", timezone: "America/Sao_Paulo",
    productId: product.id, externalId: product.externalId, title: product.title,
    storeUrl, affiliateAuditUrl: product.affiliateUrl, videoFile, videoSha256, networks,
    instagramStoryStickerUrl: storeUrl, instagramStoryStickerLabel: "Ver produto",
    nativeAudio: { required: true, source: "biblioteca oficial da própria plataforma", selection: "áudio musical em tendência compatível com uso comercial" },
    captions: Object.fromEntries(networks.map(network => [network, `${baseCaption}\n\n#Impacto360 #Academia #Fitness #Treino #MercadoLivre`])),
    status: "pronto_para_agendar",
  });
}

const agenda = {
  generatedAt: new Date().toISOString(), startDate: "2026-08-25", endDate: "2026-09-13",
  timezone: "America/Sao_Paulo", schedule: "1 publicação diária às 18:00", slotCount: slots.length,
  policy: {
    linkedinExcluded: "Produtos físicos não serão publicados no LinkedIn; preferência registrada para livros e cursos.",
    noPricesInCaptions: true, noAffiliateUrlInCaptions: true,
    disclosure: notice,
    nativeMusicOnly: true,
    clickableStoreLinkRequired: true,
    finalSubmissionRequiresActionTimeConfirmation: true,
  },
  slots,
};
fs.writeFileSync(path.join(outputDir, "agenda.json"), `${JSON.stringify(agenda, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ videos: slots.length, agenda: path.join(outputDir, "agenda.json") }, null, 2));
