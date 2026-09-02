import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputRoot = path.resolve(root, "..", "..", "outputs", "campanha-setembro-impacto360-2026-09-02");
const agendaPath = path.join(outputRoot, "agenda-setembro-2026.json");
const agenda = readJson(agendaPath);
const catalog = readJson(path.join(root, "dados", "catalogo-publico.json"));
const results = [];

check(agenda.slots.length === 29, "agenda", "29 slots", agenda.slots.length);
check(new Set(agenda.slots.map(slot => slot.productId)).size === 29, "agenda", "29 produtos únicos", "duplicação detectada");
check(new Set(agenda.slots.map(slot => slot.storeUrl)).size === 29, "agenda", "29 links individuais únicos", "duplicação detectada");
check(agenda.period.start === "2026-09-02" && agenda.period.end === "2026-09-30", "agenda", "período de 02 a 30/09/2026", agenda.period);

for (let index = 0; index < agenda.slots.length; index += 1) {
  const slot = agenda.slots[index];
  const expectedDate = `2026-09-${String(index + 2).padStart(2, "0")}`;
  const product = catalog.find(item => item.id === slot.productId);
  check(slot.date === expectedDate, slot.slotId, "data diária sequencial", slot.date);
  check(Boolean(product), slot.slotId, "produto presente no catálogo público", slot.productId);
  check(product?.shortUrl === slot.storeUrl, slot.slotId, "link da legenda corresponde ao produto", product?.shortUrl);
  check(/^https:\/\/(?:www\.)?mercadolivre\.com\.br\//i.test(product?.link || "") || /^https:\/\/meli\.la\//i.test(product?.link || ""), slot.slotId, "destino afiliado Mercado Livre", product?.link);
  check(fs.existsSync(slot.videoFile) && fs.statSync(slot.videoFile).size === slot.media.bytes, slot.slotId, "vídeo MP4 existente e íntegro", slot.videoFile);
  check(slot.media.codec === "h264" && slot.media.width === 720 && slot.media.height === 1280 && slot.media.duration >= 7.9, slot.slotId, "vídeo vertical H.264 720x1280", slot.media);
  check(slot.youtube.description.includes(slot.storeUrl), slot.slotId, "YouTube contém link individual", slot.youtube.description);
  check(slot.facebook.caption.includes(slot.storeUrl), slot.slotId, "Facebook contém link individual", slot.facebook.caption);
  check(slot.tiktok.caption.includes(slot.storeUrl), slot.slotId, "TikTok contém link individual", slot.tiktok.caption);
  check(slot.tiktok.qrCodeTargetsStoreUrl && slot.tiktok.urlVisibleInVideo, slot.slotId, "TikTok tem QR Code e URL visível", slot.tiktok);
  check(!Object.values({ youtube: slot.youtube.description, facebook: slot.facebook.caption, tiktok: slot.tiktok.caption }).some(text => text.includes(slot.affiliateUrl)), slot.slotId, "link afiliado bruto não é exposto", slot.affiliateUrl);
  check(!/R\$\s*\d/i.test([slot.youtube.description, slot.facebook.caption, slot.tiktok.caption].join("\n")), slot.slotId, "sem preço desatualizável", "preço encontrado");
  const shortPath = new URL(slot.storeUrl).pathname.replace(/^\//, "");
  check(fs.existsSync(path.join(root, shortPath, "index.html")), slot.slotId, "rota curta local gerada", shortPath);
  check(fs.existsSync(path.join(root, "pacote-github-pages-pronto", shortPath, "index.html")), slot.slotId, "rota curta sincronizada no pacote", shortPath);
}

const failures = results.filter(item => !item.ok);
const report = {
  generatedAt: new Date().toISOString(),
  agendaPath,
  summary: { checks: results.length, passed: results.length - failures.length, failed: failures.length },
  failures,
};
writeJson(path.join(outputRoot, "relatorio-validacao.json"), report);
const markdown = [
  "# Validação da campanha Impacto360 — setembro de 2026",
  "",
  `- Verificações: ${report.summary.checks}`,
  `- Aprovadas: ${report.summary.passed}`,
  `- Falhas: ${report.summary.failed}`,
  "- 29 vídeos verticais H.264, um por produto.",
  "- 87 textos de publicação, todos com a página individual correta da Impacto360.",
  "- Facebook e YouTube: URL externa prevista como clicável.",
  "- TikTok: URL e QR Code presentes; a legenda externa pode não ficar clicável sem recurso nativo da conta.",
  "",
  failures.length ? `## Falhas\n\n${failures.map(item => `- ${item.scope}: ${item.expected}; obtido: ${JSON.stringify(item.actual)}`).join("\n")}` : "Todas as verificações locais passaram.",
  "",
].join("\n");
fs.writeFileSync(path.join(outputRoot, "RELATORIO-VALIDACAO.md"), markdown, "utf8");
console.log(JSON.stringify(report.summary, null, 2));
if (failures.length) process.exitCode = 1;

function check(ok, scope, expected, actual) {
  results.push({ ok: Boolean(ok), scope, expected, actual });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
