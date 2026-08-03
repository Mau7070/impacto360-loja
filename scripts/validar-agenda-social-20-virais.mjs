import fs from "node:fs";
import path from "node:path";

const agendaPath = process.argv[2] || "C:\\Users\\PMNB\\Documents\\Codex\\2026-07-28\\files-mentioned-by-the-user-atue\\outputs\\agenda-social-2026-08-04-a-13\\agenda.json";
const agenda = JSON.parse(fs.readFileSync(agendaPath, "utf8").replace(/^\uFEFF/, ""));
const root = path.dirname(agendaPath);
const results = [];

assert(agenda.slots.length === 20, "agenda", "20 slots", agenda.slots.length);
assert(new Set(agenda.slots.map(slot => slot.videoSha256)).size === 20, "agenda", "20 vídeos únicos", "duplicação detectada");
assert(new Set(agenda.slots.map(slot => slot.generalProduct.storeUrl)).size === 20, "agenda", "20 produtos gerais únicos", "duplicação detectada");
assert(new Set(agenda.slots.map(slot => slot.linkedinProduct.storeUrl)).size === 20, "agenda", "20 produtos LinkedIn únicos", "duplicação detectada");
assert(agenda.facebookGroupRuns.length === 40, "facebook", "40 execuções de grupos", agenda.facebookGroupRuns.length);
assert(new Set(agenda.facebookGroupRuns.map(run => `${run.date}|${run.time}|${run.group}`)).size === 40, "facebook", "40 destinos/horários únicos", "duplicação detectada");
assert(new Set(agenda.facebookGroupRuns.map(run => `${run.group}|${run.sourceSlotId}`)).size === 40, "facebook", "nenhum vídeo repetido no mesmo grupo", "duplicação detectada");

for (const slot of agenda.slots) {
  const stat = fs.existsSync(slot.videoFile) ? fs.statSync(slot.videoFile) : null;
  assert(Boolean(stat?.isFile() && stat.size > 0), slot.slotId, "MP4 existe e não está vazio", slot.videoFile);
  assert(path.extname(slot.videoFile).toLowerCase() === ".mp4", slot.slotId, "extensão MP4", slot.videoFile);
  assert(/^https:\/\/impacto360afiliado\.com\.br\/p\/[a-f0-9]{10}\/$/.test(slot.generalProduct.storeUrl), slot.slotId, "URL geral curta", slot.generalProduct.storeUrl);
  assert(/^https:\/\/impacto360afiliado\.com\.br\/p\/[a-f0-9]{10}\/$/.test(slot.linkedinProduct.storeUrl), slot.slotId, "URL LinkedIn curta", slot.linkedinProduct.storeUrl);
  assert(slot.captions.instagramStoryStickerUrl === slot.generalProduct.storeUrl, slot.slotId, "figurinha do Instagram usa URL curta", slot.captions.instagramStoryStickerUrl);
  const captions = Object.values(slot.captions).join("\n");
  assert(!captions.includes(slot.generalProduct.affiliateUrl), slot.slotId, "link afiliado bruto não aparece nas legendas gerais", "link exposto");
  assert(!captions.includes(slot.linkedinProduct.affiliateUrl), slot.slotId, "link afiliado bruto não aparece na legenda LinkedIn", "link exposto");
}

const urls = new Map();
for (const slot of agenda.slots) {
  urls.set(slot.generalProduct.storeUrl, slot.generalProduct);
  urls.set(slot.linkedinProduct.storeUrl, slot.linkedinProduct);
}

for (const [url, product] of urls) {
  try {
    const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "Impacto360AgendaAudit/1.0" } });
    const html = await response.text();
    const decodedHtml = html.replaceAll("&amp;", "&");
    const titleTokens = importantTokens(product.title).slice(0, 4);
    assert(response.status === 200, product.id, "página responde 200", response.status);
    assert(titleTokens.length >= 1 && titleTokens.every(token => normalize(decodedHtml).includes(token)), product.id, "página exibe o produto correto", titleTokens.join(", "));
    assert(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=/i.test(html) || /<img\b/i.test(html), product.id, "página carrega referência de imagem", url);
    assert(decodedHtml.includes(product.affiliateUrl), product.id, "link afiliado permanece dentro da página", product.affiliateUrl);
  } catch (error) {
    results.push({ ok: false, scope: product.id, expected: "página pública validada", actual: error.message });
  }
}

const okCount = results.filter(item => item.ok).length;
const failures = results.filter(item => !item.ok);
const report = {
  generatedAt: new Date().toISOString(),
  agendaPath,
  summary: { checks: results.length, passed: okCount, failed: failures.length },
  failures,
  results,
};

fs.writeFileSync(path.join(root, "relatorio-validacao.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# Validação da agenda social — 20 vídeos virais",
  "",
  `- Slots: ${agenda.slots.length}`,
  `- Vídeos únicos: ${new Set(agenda.slots.map(slot => slot.videoSha256)).size}`,
  `- Produtos gerais únicos: ${new Set(agenda.slots.map(slot => slot.generalProduct.storeUrl)).size}`,
  `- Produtos LinkedIn únicos: ${new Set(agenda.slots.map(slot => slot.linkedinProduct.storeUrl)).size}`,
  `- Execuções em grupos Facebook: ${agenda.facebookGroupRuns.length}`,
  `- Verificações aprovadas: ${okCount}`,
  `- Falhas: ${failures.length}`,
  "",
  failures.length ? "## Falhas\n\n" + failures.map(item => `- ${item.scope}: ${item.expected}; obtido: ${item.actual}`).join("\n") : "Todas as verificações passaram.",
  "",
].join("\n");
fs.writeFileSync(path.join(root, "RELATORIO-VALIDACAO.md"), markdown, "utf8");

console.log(JSON.stringify(report.summary, null, 2));
if (failures.length) process.exitCode = 1;

function assert(ok, scope, expected, actual) {
  results.push({ ok: Boolean(ok), scope, expected, actual });
}

function normalize(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function importantTokens(value) {
  const stop = new Set("a o as os de da do das dos e em para por com sem um uma kit livro curso".split(" "));
  return normalize(value).split(" ").filter(token => token.length >= 4 && !stop.has(token));
}
