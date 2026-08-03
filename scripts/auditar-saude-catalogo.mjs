import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const generatedAt = new Date();
const reportDate = option("--date", generatedAt.toISOString().slice(0, 10).replaceAll("-", ""));
const priceValidityDays = Math.max(1, Number(option("--price-valid-days", process.env.IMPACTO360_PRICE_VALIDITY_DAYS || 7)));
const applyQuarantine = args.includes("--apply-quarantine");
const outputDir = path.resolve(option("--output", path.join(root, "backups", `saude-catalogo-${reportDate}`)));
const productsPath = path.join(root, "dados", "products.json");
const publicCatalogPath = path.join(root, "dados", "catalogo-publico.json");

const linkFields = [
  "linkCompra", "linkAfiliado", "affiliateLink", "linkComissionado",
  "linkPlataforma", "link_original_afiliado", "urlProduto", "url", "linkOriginal",
];
const imageFields = [
  "fotoPrincipal", "imagemPrincipal", "image", "imagem", "imageUrl",
  "thumbnail", "foto", "productImage", "src",
];
const priceDateFields = [
  "precoAtualizadoEm", "priceUpdatedAt", "ultimaVerificacaoPreco",
  "dataUltimaVerificacao", "ultimaVerificacao", "lastChecked",
];
const storeCategoryById = new Map([
  ["impacto-mobile", "celulares-e-tecnologia"],
  ["impacto-tech-computadores", "celulares-e-tecnologia"],
  ["impacto-eletronicos", "celulares-e-tecnologia"],
  ["impacto-games", "games-e-setup"],
  ["impacto-casa", "casa-e-cozinha"],
  ["impacto-decor", "casa-e-cozinha"],
  ["impacto-sport", "esporte-e-fitness"],
  ["impacto-moda", "moda-e-calcados"],
  ["grife-prime", "moda-e-calcados"],
  ["impacto-calcados", "moda-e-calcados"],
  ["impacto-ferramentas", "ferramentas"],
  ["impacto-brinquedos", "brinquedos-e-escolar"],
  ["impacto-kids", "brinquedos-e-escolar"],
  ["impacto-livraria", "livros-papelaria-e-fe"],
  ["impacto-fe", "livros-papelaria-e-fe"],
  ["impacto-montaria", "montaria-e-cavalgada"],
  ["impacto-auto", "auto-e-moto"],
  ["impacto-beauty-care", "beleza-e-cuidados"],
  ["impacto-pet", "pets"],
  ["impacto-educa", "cursos-e-educacao"],
  ["impacto-music-studio", "servicos-digitais"],
  ["impacto-academico", "servicos-digitais"],
  ["impacto-personalizados", "servicos-digitais"],
  ["impacto-criadores", "servicos-digitais"],
  ["impacto-ofertas", "ofertas-e-parceiros"],
  ["lojas-parceiras", "ofertas-e-parceiros"],
]);

function readJson(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function first(product, fields) {
  for (const field of fields) {
    const value = product?.[field];
    if (["string", "number", "boolean"].includes(typeof value) && text(value)) return text(value);
  }
  return "";
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function categorySlug(product) {
  const storeCategory = storeCategoryById.get(text(product.storeId));
  if (storeCategory) {
    if (storeCategory === "casa-e-cozinha" && /eletrodomestico|eletroportatil|pequenos eletros/.test(normalize(first(product, ["subcategoria", "subcategory"])))) {
      return "eletrodomesticos";
    }
    return storeCategory;
  }
  return slug(first(product, ["category", "categoria", "departamento"]));
}

function productLink(product) {
  return first(product, linkFields);
}

function productImage(product) {
  const gallery = [
    ...(Array.isArray(product?.galeria) ? product.galeria : []),
    ...(Array.isArray(product?.fotosExtras) ? product.fotosExtras : []),
  ];
  return [...imageFields.map(field => product?.[field]), ...gallery].map(text).find(Boolean) || "";
}

function linkStructure(value) {
  const raw = text(value);
  if (!raw) return { valid: false, platform: "Outra", reason: "link_ausente", direct: false };
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { valid: false, platform: "Outra", reason: "url_malformada", direct: false };
  }
  if (!/^https?:$/.test(url.protocol)) return { valid: false, platform: "Outra", reason: "protocolo_invalido", direct: false };
  const host = url.hostname.toLowerCase();
  const pathname = decodeURIComponent(url.pathname).toLowerCase();
  if (host === "meli.la" || host.endsWith(".meli.la")) return { valid: pathname.length > 1, platform: "Mercado Livre", reason: "atalho_afiliado", direct: false };
  if (host === "s.shopee.com.br") return { valid: pathname.length > 1, platform: "Shopee", reason: "atalho_afiliado", direct: false };
  if (host.endsWith("link.amazon") || host.endsWith("amzn.to")) return { valid: pathname.length > 1, platform: "Amazon", reason: "atalho_afiliado", direct: false };
  if (host.includes("mercadolivre.com")) {
    const direct = host.startsWith("produto.") || /\/(?:p|up)\//.test(pathname) || /\/mlb-?\d+/.test(pathname);
    return { valid: direct, platform: "Mercado Livre", reason: direct ? "produto_direto" : "pagina_generica", direct };
  }
  if (host.includes("amazon.")) {
    const direct = /\/(?:dp|gp\/product)\/[a-z0-9]{10}(?:[/?]|$)/i.test(pathname);
    return { valid: direct, platform: "Amazon", reason: direct ? "produto_direto" : "pagina_generica", direct };
  }
  if (host.includes("shopee.com.br")) {
    const direct = /\/product\/\d+\/\d+/.test(pathname);
    return { valid: direct, platform: "Shopee", reason: direct ? "produto_direto" : "pagina_generica", direct };
  }
  if (host.includes("google.")) return { valid: false, platform: "Outra", reason: "link_de_busca", direct: false };
  return { valid: true, platform: "Outra", reason: "url_externa", direct: true };
}

function cleanLink(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return text(value);
  }
}

function priceNumber(value) {
  const raw = text(value);
  if (!raw || /consultar|conferir|parceiro|indispon/i.test(normalize(raw))) return null;
  const number = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function priceAudit(product) {
  const raw = first(product, ["price", "preco", "precoPromocional", "precoAtual"]);
  const value = priceNumber(raw);
  const rawDate = first(product, priceDateFields);
  const checkedAt = rawDate ? new Date(rawDate) : null;
  if (!value) return { raw, value: null, status: "not_numeric", checkedAt: "", validUntil: "" };
  if (!checkedAt || Number.isNaN(checkedAt.getTime())) return { raw, value, status: "unverified", checkedAt: "", validUntil: "" };
  const validUntil = new Date(checkedAt.getTime() + priceValidityDays * 86_400_000);
  return {
    raw,
    value,
    status: validUntil.getTime() >= generatedAt.getTime() ? "current" : "expired",
    checkedAt: checkedAt.toISOString(),
    validUntil: validUntil.toISOString(),
  };
}

function imageAudit(value) {
  const image = text(value);
  if (!image || /placeholder|sem[-_ ]?(foto|imagem)|COLOCAR_|URL_|LINK_/i.test(image)) {
    return { valid: false, kind: "missing", reason: "imagem_ausente_ou_placeholder", bytes: 0, hash: "" };
  }
  if (/^https?:\/\//i.test(image) || image.startsWith("data:image/")) {
    return { valid: true, kind: "remote", reason: "imagem_remota", bytes: 0, hash: "" };
  }
  const file = path.join(root, image.replace(/^\/+/, ""));
  if (!fs.existsSync(file)) return { valid: false, kind: "local", reason: "arquivo_local_ausente", bytes: 0, hash: "" };
  const stat = fs.statSync(file);
  const hash = stat.size ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : "";
  return {
    valid: stat.isFile() && stat.size > 512,
    kind: "local",
    reason: stat.size > 512 ? "arquivo_local_ok" : "arquivo_local_vazio_ou_minimo",
    bytes: stat.size,
    hash,
  };
}

function hasMojibake(value) {
  return /Ã.|Â.|â€|�/.test(text(value));
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

const products = readJson(productsPath);
const publicCatalog = readJson(publicCatalogPath);
const publicById = new Map(publicCatalog.map(product => [text(product.id), product]));
const rows = products.map((product, index) => {
  const id = text(product.id);
  const name = first(product, ["name", "nome", "title"]);
  const category = first(product, ["category", "categoria", "departamento"]);
  const environment = categorySlug(product);
  const expectedEnvironment = storeCategoryById.get(text(product.storeId)) || "";
  const link = productLink(product);
  const structure = linkStructure(link);
  const image = productImage(product);
  const imageState = imageAudit(image);
  const price = priceAudit(product);
  const publicProduct = publicById.get(id);
  const issues = [];
  const blockers = [];
  if (!id) blockers.push("id_ausente");
  if (!name) blockers.push("titulo_ausente");
  if (name && (normalize(name).length < 6 || /^(produto|oferta|item)$/.test(normalize(name)))) issues.push("titulo_generico");
  if (hasMojibake(name) || hasMojibake(category) || hasMojibake(first(product, ["subcategoria", "subcategory"]))) issues.push("texto_com_mojibake");
  if (!structure.valid) blockers.push(`link_${structure.reason}`);
  if (!imageState.valid) blockers.push(imageState.reason);
  if (expectedEnvironment && ![expectedEnvironment, "eletrodomesticos"].includes(environment)) issues.push("ambiente_incompativel_com_loja");
  if (publicProduct && text(publicProduct.link) !== link) blockers.push("link_publico_nao_preservado");
  if (price.status === "expired" || price.status === "unverified") issues.push(`preco_${price.status}`);
  return {
    index: index + 1,
    id,
    name,
    storeId: text(product.storeId),
    category,
    subcategory: first(product, ["subcategoria", "subcategory"]),
    environment,
    expectedEnvironment,
    platform: structure.platform,
    link,
    linkValid: structure.valid,
    linkReason: structure.reason,
    image,
    imageValid: imageState.valid,
    imageReason: imageState.reason,
    imageBytes: imageState.bytes,
    imageHash: imageState.hash,
    priceRaw: price.raw,
    priceValue: price.value,
    priceStatus: price.status,
    priceCheckedAt: price.checkedAt,
    priceValidUntil: price.validUntil,
    rating: first(product, ["rating", "nota", "reviewRating", "avaliacao"]),
    availability: first(product, ["disponibilidade", "availability", "estoque"]),
    public: Boolean(publicProduct),
    publicLinkPreserved: !publicProduct || text(publicProduct.link) === link,
    issues,
    blockers,
    decision: blockers.length ? "quarantine_recommended" : issues.length ? "manual_review" : "publishable",
  };
});

function addDuplicateIssue(groups, issue, severity = "review") {
  for (const entries of groups.values()) {
    if (entries.length < 2) continue;
    for (const row of entries) {
      if (!row.issues.includes(issue)) row.issues.push(issue);
      if (severity === "blocker" && !row.blockers.includes(issue)) row.blockers.push(issue);
      row.decision = row.blockers.length ? "quarantine_recommended" : "manual_review";
    }
  }
}

const byTitle = new Map();
const byLink = new Map();
const byImageHash = new Map();
for (const row of rows) {
  const titleKey = normalize(row.name);
  const linkKey = cleanLink(row.link);
  if (titleKey) byTitle.set(titleKey, [...(byTitle.get(titleKey) || []), row]);
  if (linkKey) byLink.set(linkKey, [...(byLink.get(linkKey) || []), row]);
  if (row.imageHash) byImageHash.set(row.imageHash, [...(byImageHash.get(row.imageHash) || []), row]);
}
addDuplicateIssue(byTitle, "titulo_duplicado");
addDuplicateIssue(byLink, "link_afiliado_duplicado", "blocker");
for (const entries of byImageHash.values()) {
  if (entries.length < 2) continue;
  const differentTitles = new Set(entries.map(row => normalize(row.name))).size > 1;
  if (!differentTitles) continue;
  for (const row of entries) {
    row.issues.push("imagem_repetida_em_titulos_diferentes");
    if (!row.blockers.length) row.decision = "manual_review";
  }
}

const publicCasaIds = new Set(
  publicCatalog.filter(product => categorySlug(product) === "casa-e-cozinha").map(product => text(product.id)),
);
const publicToolsIds = new Set(
  publicCatalog.filter(product => categorySlug(product) === "ferramentas").map(product => text(product.id)),
);
const recentToolsIds = new Set(
  publicCatalog
    .filter(product => /^ferramentas-20260724-/.test(text(product.id)))
    .map(product => text(product.id)),
);
const focusRows = rows.filter(row => publicCasaIds.has(row.id));
const toolsRows = rows.filter(row => publicToolsIds.has(row.id));
const masterCasaRows = rows.filter(row => row.environment === "casa-e-cozinha");
const masterToolsRows = rows.filter(row => row.environment === "ferramentas");
const decisionCounts = rows.reduce((result, row) => {
  result[row.decision] = (result[row.decision] || 0) + 1;
  return result;
}, {});
const focusDecisionCounts = focusRows.reduce((result, row) => {
  result[row.decision] = (result[row.decision] || 0) + 1;
  return result;
}, {});

const report = {
  generatedAt: generatedAt.toISOString(),
  priceValidityDays,
  appliedQuarantine: applyQuarantine,
  safety: {
    permanentDeletion: false,
    affiliateParametersPreserved: true,
    quarantineIsReversible: true,
  },
  totals: {
    sourceProducts: products.length,
    publicProducts: publicCatalog.length,
    casaECozinha: focusRows.length,
    casaECozinhaMaster: masterCasaRows.length,
    ferramentas: toolsRows.length,
    ferramentasMaster: masterToolsRows.length,
    ferramentasInCorrectEnvironment: toolsRows.filter(row => row.storeId === "impacto-ferramentas").length,
    ferramentasRecentes20260724: recentToolsIds.size,
    ferramentasRecentesNoAmbienteCorreto: rows.filter(row => recentToolsIds.has(row.id) && row.environment === "ferramentas").length,
    decisionCounts,
    casaDecisionCounts: focusDecisionCounts,
    currentPrices: rows.filter(row => row.priceStatus === "current").length,
    hiddenUnverifiedPrices: rows.filter(row => ["expired", "unverified"].includes(row.priceStatus)).length,
  },
  duplicateGroups: {
    titles: [...byTitle.values()].filter(entries => entries.length > 1).map(entries => entries.map(row => row.id)),
    links: [...byLink.values()].filter(entries => entries.length > 1).map(entries => entries.map(row => row.id)),
    imagesAcrossDifferentTitles: [...byImageHash.values()]
      .filter(entries => entries.length > 1 && new Set(entries.map(row => normalize(row.name))).size > 1)
      .map(entries => entries.map(row => row.id)),
  },
  casaECozinha: focusRows,
  allProducts: rows,
};

if (applyQuarantine) {
  const byId = new Map(rows.map(row => [row.id, row]));
  const updated = products.map(product => {
    const row = byId.get(text(product.id));
    if (!row || row.decision === "publishable") return product;
    const quarantine = row.decision === "quarantine_recommended";
    return {
      ...product,
      status: quarantine ? "quarentena" : "revisao_manual",
      aprovadoParaPublicacao: false,
      publicar: false,
      auditoriaSaude: {
        data: generatedAt.toISOString(),
        decisao: row.decision,
        motivos: [...row.blockers, ...row.issues],
        statusAnterior: text(product.status),
        reversivel: true,
      },
    };
  });
  writeJson(productsPath, updated);
}

fs.mkdirSync(outputDir, { recursive: true });
writeJson(path.join(outputDir, "auditoria-saude-catalogo.json"), report);

const csvHeaders = [
  "index", "id", "name", "storeId", "category", "subcategory", "environment",
  "platform", "link", "linkValid", "image", "imageValid", "priceRaw",
  "priceStatus", "priceCheckedAt", "rating", "availability", "public",
  "decision", "blockers", "issues",
];
const csv = [
  csvHeaders.join(","),
  ...focusRows.map(row => csvHeaders.map(key => csvCell(Array.isArray(row[key]) ? row[key].join(" | ") : row[key])).join(",")),
].join("\n");
fs.writeFileSync(path.join(outputDir, "auditoria-casa-e-cozinha-188.csv"), `${csv}\n`, "utf8");

const markdown = [
  "# Auditoria privada de saúde do catálogo",
  "",
  `Gerado em: ${generatedAt.toISOString()}`,
  "",
  "## Segurança aplicada",
  "",
  "- Nenhum produto foi apagado permanentemente.",
  "- Links de afiliado e parâmetros foram preservados.",
  "- Itens duvidosos ficam recomendados para revisão ou quarentena reversível.",
  `- Preços numéricos só são considerados atuais por ${priceValidityDays} dias após verificação registrada.`,
  "",
  "## Totais",
  "",
  `- Produtos na origem: ${products.length}.`,
  `- Produtos no catálogo público atual: ${publicCatalog.length}.`,
  `- Casa e Cozinha auditados: ${focusRows.length}.`,
  `- Ferramentas no ambiente Ferramentas: ${toolsRows.length}.`,
  `- Publicáveis sem alerta: ${decisionCounts.publishable || 0}.`,
  `- Revisão manual: ${decisionCounts.manual_review || 0}.`,
  `- Quarentena recomendada: ${decisionCounts.quarantine_recommended || 0}.`,
  "",
  "## Casa e Cozinha",
  "",
  `- Publicáveis sem alerta: ${focusDecisionCounts.publishable || 0}.`,
  `- Revisão manual: ${focusDecisionCounts.manual_review || 0}.`,
  `- Quarentena recomendada: ${focusDecisionCounts.quarantine_recommended || 0}.`,
  "",
  "Os detalhes produto a produto estão no JSON e no CSV privados.",
  "",
].join("\n");
fs.writeFileSync(path.join(outputDir, "auditoria-saude-catalogo.md"), markdown, "utf8");

const dashboardData = JSON.stringify(focusRows).replace(/</g, "\\u003c");
const dashboard = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Saúde do catálogo Impacto360</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#10213a;background:#f4f7fb}*{box-sizing:border-box}body{margin:0}.wrap{width:min(1400px,calc(100% - 28px));margin:auto;padding:28px 0}
h1{margin:0}.notice{padding:12px;border:1px solid #f0c36a;background:#fff8df;border-radius:10px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.stat{padding:16px;background:#fff;border:1px solid #dbe6f2;border-radius:12px}.stat b{display:block;font-size:28px}
.tools{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.tools input,.tools select{min-height:44px;padding:8px 10px;border:1px solid #b8c9dc;border-radius:8px;background:#fff}
.table{overflow:auto;border:1px solid #dbe6f2;border-radius:12px;background:#fff}table{width:100%;border-collapse:collapse;min-width:1100px}th,td{padding:10px;border-bottom:1px solid #edf2f7;text-align:left;vertical-align:top;font-size:12px}th{position:sticky;top:0;background:#102f55;color:#fff}.pill{display:inline-block;padding:4px 7px;border-radius:999px;font-weight:800}.publishable{background:#dcfce7;color:#166534}.manual_review{background:#fef3c7;color:#92400e}.quarantine_recommended{background:#fee2e2;color:#991b1b}
@media(max-width:760px){.stats{grid-template-columns:repeat(2,1fr)}.wrap{width:min(100% - 18px,1400px);padding-top:18px}}
</style></head><body><main class="wrap"><h1>Saúde do catálogo — Casa e Cozinha</h1>
<p class="notice">Relatório privado. Não publicar no site sem autenticação. Nenhum produto foi apagado; quarentena e revisão são reversíveis.</p>
<section class="stats"><div class="stat"><b id="total"></b>auditados</div><div class="stat"><b id="ok"></b>publicáveis</div><div class="stat"><b id="review"></b>revisão</div><div class="stat"><b id="quarantine"></b>quarentena</div></section>
<div class="tools"><input id="q" type="search" placeholder="Buscar produto, ID ou motivo"><select id="decision"><option value="">Todas as decisões</option><option>publishable</option><option>manual_review</option><option>quarantine_recommended</option></select></div>
<div class="table"><table><thead><tr><th>#</th><th>Produto</th><th>Plataforma</th><th>Preço</th><th>Link</th><th>Imagem</th><th>Decisão</th><th>Motivos</th></tr></thead><tbody id="rows"></tbody></table></div>
</main><script>const data=${dashboardData};const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));const render=()=>{const q=document.querySelector("#q").value.toLowerCase();const d=document.querySelector("#decision").value;const view=data.filter(r=>(!d||r.decision===d)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));document.querySelector("#rows").innerHTML=view.map(r=>\`<tr><td>\${r.index}</td><td><b>\${esc(r.name)}</b><br><small>\${esc(r.id)}</small></td><td>\${esc(r.platform)}</td><td>\${esc(r.priceRaw||"Consultar")}<br><small>\${esc(r.priceStatus)}</small></td><td>\${r.linkValid?"OK":"Falha"}<br><small>\${esc(r.linkReason)}</small></td><td>\${r.imageValid?"OK":"Falha"}<br><small>\${esc(r.imageReason)}</small></td><td><span class="pill \${r.decision}">\${esc(r.decision)}</span></td><td>\${esc([...r.blockers,...r.issues].join(" | ")||"-")}</td></tr>\`).join("")};document.querySelector("#total").textContent=data.length;document.querySelector("#ok").textContent=data.filter(r=>r.decision==="publishable").length;document.querySelector("#review").textContent=data.filter(r=>r.decision==="manual_review").length;document.querySelector("#quarantine").textContent=data.filter(r=>r.decision==="quarantine_recommended").length;document.querySelector("#q").addEventListener("input",render);document.querySelector("#decision").addEventListener("change",render);render();</script></body></html>`;
fs.writeFileSync(path.join(outputDir, "painel-privado-saude-catalogo.html"), dashboard, "utf8");

console.log(JSON.stringify({
  outputDir,
  totals: report.totals,
  files: fs.readdirSync(outputDir),
}, null, 2));
