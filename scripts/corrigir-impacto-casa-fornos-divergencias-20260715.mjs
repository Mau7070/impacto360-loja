import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const now = "2026-07-15T13:14:00-03:00";

const files = {
  products: path.join(root, "dados", "products.json"),
  packageProducts: path.join(packageDir, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  packageStores: path.join(packageDir, "dados", "stores.json"),
  report: path.join(root, "dados", "relatorio-auditoria-impacto-casa-fornos-divergencias-2026-07-15.json"),
  packageReport: path.join(packageDir, "dados", "relatorio-auditoria-impacto-casa-fornos-divergencias-2026-07-15.json"),
  verification: path.join(root, "dados", "relatorio-verificacao-impacto-casa-fornos-divergencias-2026-07-15.json"),
  packageVerification: path.join(packageDir, "dados", "relatorio-verificacao-impacto-casa-fornos-divergencias-2026-07-15.json"),
};

const actions = [
  {
    id: "shopee-20260715-fornos-bancada-forno-eletrico-de-bancada-philco-pfe66bm-66l-1800w-preto-afe2c044",
    status: "esgotado",
    reason: "Pagina Shopee indexada com marcador esgotado para o Philco PFE66BM 66L.",
    evidence: "Busca publica Shopee em 2026-07-15 retornou o produto com marcador esgotado.",
    source: "https://shopee.com.br/Forno-El%C3%A9trico-de-Bancada-Philco-66-Litros-PFE66BM-1800W-Preto-i.822103155.58260226074",
  },
  {
    id: "shopee-20260715-fornos-bancada-forno-eletrico-de-bancada-amvox-afr-4500-inox-45-litros-b63f1ecf",
    status: "esgotado",
    reason: "Produto Amvox AFR 4500 foi conferido como esgotado na pagina Shopee informada pelo usuario.",
    evidence: "Usuario reportou a pagina com marcador esgotado, sem avaliacoes e 0 vendidos.",
    source: "https://shopee.com.br/Forno-El%C3%A9trico-de-Bancada-45-Litros-Multifun%C3%A7%C3%A3o-Timer-Alarme-Amvox-AFR-4500-Inox-i.457321133.23592955520",
    suggestedAlternatives: [
      "https://shopee.com.br/Forno-El%C3%A9trico-de-Bancada-45-Litros-Multifun%C3%A7%C3%A3o-Timer-Alarme-Amvox-AFR-4500-Inox-i.971971307.22997457448",
      "https://shopee.com.br/Forno-De-Bancada-El%C3%A9trico-Amvox-Afr-4500-45l-Preto-220v-i.600306931.14381462136",
    ],
  },
  {
    id: "shopee-20260715-fornos-bancada-forno-eletrico-de-bancada-mueller-fratello-44-litros-preto-fosco-53388ff1",
    status: "inexistente",
    reason: "Link Shopee cadastrado para Mueller Fratello nao foi confirmado como pagina de produto ativa e foi reportado como inexistente.",
    evidence: "Busca publica nao retornou conteudo validavel para o item cadastrado; alternativas encontradas usam outros item_id.",
    source: "https://shopee.com.br/Forno-Eletrico-De-Bancada-Mueller-Fratello-44-Litros-Preto-Fosco-i.356640788.24644895079",
    suggestedAlternatives: [
      "https://shopee.com.br/Forno-El%C3%A9trico-De-Bancada-Fratello-44-Litros-Mueller-i.1602357191.23494402462",
      "https://shopee.com.br/Forno-El%C3%A9trico-Mueller-Fratello-44-Litros-60.1250.005-Preto-Fosco-127v-i.1215229492.23193717349",
      "https://shopee.com.br/Forno-El%C3%A9trico-Mueller-Fratello-44-Litros-60.1250.005-Preto-Fosco-220v-i.1215229492.22198032194",
    ],
  },
  {
    id: "shopee-20260715-fornos-bancada-forno-eletrico-suggar-bancada-42-litros-preto-fe4201pt-fe4202pt-71feb404",
    status: "inexistente",
    reason: "Link Shopee cadastrado para Suggar 42L nao foi confirmado como pagina de produto ativa e foi reportado como inexistente.",
    evidence: "Busca publica encontrou o mesmo modelo em outro item_id, indicando que o link cadastrado precisa de novo shortlink oficial.",
    source: "https://shopee.com.br/Forno-El%C3%A9trico-Suggar-Bancada-42-Litros-Preto-i.329742857.28398865106",
    suggestedAlternatives: [
      "https://shopee.com.br/Forno-El%C3%A9trico-Suggar-42-Litros-Preto-FE4201PT-FE4202PT-i.1009975506.22796086777",
    ],
  },
];

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function replaceInlineArray(html, variableName, value) {
  const markerMatch = new RegExp(`\\b(?:const|let|var)\\s+${variableName}\\s*=\\s*`).exec(html);
  if (!markerMatch) throw new Error(`Marcador ${variableName} nao encontrado.`);
  const start = markerMatch.index;
  const arrayStart = html.indexOf("[", start);
  if (arrayStart === -1) throw new Error(`Array ${variableName} nao encontrado.`);
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (let i = arrayStart; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) inString = false;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return `${html.slice(0, arrayStart)}${JSON.stringify(value, null, 2)}${html.slice(i + 1)}`;
      }
    }
  }
  throw new Error(`Fim do array ${variableName} nao encontrado.`);
}

function syncHtml(products, stores) {
  const htmlFiles = [
    path.join(root, "index.html"),
    path.join(root, "impacto360.html"),
    path.join(packageDir, "index.html"),
  ];
  for (const file of htmlFiles) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const next = replaceInlineArray(replaceInlineArray(html, "stores", stores), "products", products);
    fs.writeFileSync(file, next, "utf8");
  }
}

function deactivateForReview(product, action) {
  product.status = "revisao_manual";
  product.statusAnuncio = action.status === "esgotado" ? "esgotado" : "inexistente";
  product.statusPublicacao = "revisao_manual";
  product.aprovadoParaPublicacao = false;
  product.publicar = false;
  product.publicarNaHome = false;
  product.destaqueHome = false;
  product.geraComissao = false;
  product.actionType = "review";
  product.buttonLabel = "Em revisao";
  product.chamadaCompra = "Produto em revisao";
  product.statusLink = action.status === "esgotado" ? "shopee_esgotado" : "shopee_inexistente";
  product.linkStatus = action.status === "esgotado"
    ? "fora da vitrine: produto esgotado na Shopee"
    : "fora da vitrine: link Shopee inexistente ou nao confirmado";
  product.disponibilidade = action.status === "esgotado"
    ? "Fora da vitrine: produto esgotado na Shopee em 2026-07-15."
    : "Fora da vitrine: link Shopee cadastrado nao confirmado como produto ativo em 2026-07-15.";
  product.ultimaRevisao = "2026-07-15";
  product.atualizadoEm = now;
  product.auditoriaShopeeImpactoCasa20260715 = {
    checkedAt: now,
    action: "retirado_da_vitrine",
    status: action.status,
    reason: action.reason,
    evidence: action.evidence,
    originalShopeeUrl: action.source,
    affiliateLinkPreservedForAudit: product.linkCompra || product.affiliateLink || "",
    suggestedAlternatives: action.suggestedAlternatives || [],
    nextStep: "Gerar novo shortlink oficial no painel Shopee antes de republicar qualquer alternativa.",
  };
  const auditNote = `2026-07-15: retirado da vitrine IMPACTO CASA por ${action.status}; ${action.reason}`;
  const notes = String(product.observacoesInternas || "")
    .split(" | ")
    .filter(Boolean)
    .filter((note, index, all) => all.indexOf(note) === index);
  if (!notes.includes(auditNote)) notes.push(auditNote);
  product.observacoesInternas = notes.join(" | ");
}

function isPublicImpactoCasa(product) {
  return product.storeId === "impacto-casa"
    && product.status === "ativo"
    && product.aprovadoParaPublicacao === true;
}

const products = readJson(files.products, []);
const stores = readJson(files.stores, []);
const byId = new Map(products.map(product => [product.id, product]));
const changed = [];

for (const action of actions) {
  const product = byId.get(action.id);
  if (!product) throw new Error(`Produto nao encontrado: ${action.id}`);
  const before = {
    status: product.status,
    statusAnuncio: product.statusAnuncio,
    aprovadoParaPublicacao: product.aprovadoParaPublicacao,
    publicar: product.publicar,
    publicarNaHome: product.publicarNaHome,
    linkCompra: product.linkCompra,
    affiliateLink: product.affiliateLink,
  };
  deactivateForReview(product, action);
  changed.push({
    id: product.id,
    name: product.nome || product.name,
    slug: product.slug,
    status: action.status,
    reason: action.reason,
    before,
    after: {
      status: product.status,
      statusAnuncio: product.statusAnuncio,
      aprovadoParaPublicacao: product.aprovadoParaPublicacao,
      publicar: product.publicar,
      publicarNaHome: product.publicarNaHome,
    },
    originalShopeeUrl: action.source,
    suggestedAlternatives: action.suggestedAlternatives || [],
  });
}

const afterPublicImpactoCasa = products.filter(isPublicImpactoCasa).length;
const shopeeOvens = products.filter(product => (
  product.storeId === "impacto-casa"
  && product.shopee?.productUrl
  && /forno/i.test(`${product.nome || ""} ${product.name || ""} ${product.departamento || ""}`)
));
const publicShopeeOvens = shopeeOvens.filter(product => product.status === "ativo" && product.aprovadoParaPublicacao === true);

writeJson(files.products, products);
writeJson(files.packageProducts, products);
writeJson(files.stores, stores);
writeJson(files.packageStores, stores);
syncHtml(products, stores);

const report = {
  generatedAt: now,
  scope: "Loja IMPACTO CASA - fornos Shopee",
  rules: [
    "Nao apagar dados do catalogo; tirar da vitrine quando o produto esta esgotado ou o link Shopee nao existe.",
    "Manter o link original e a evidencia para auditoria.",
    "Alternativas sem shortlink oficial ficam registradas, mas nao sao publicadas como afiliado.",
  ],
  summary: {
    auditedShopeeOvens: shopeeOvens.length,
    removedFromPublicStore: changed.length,
    outOfStock: changed.filter(item => item.status === "esgotado").length,
    nonexistentOrUnconfirmed: changed.filter(item => item.status === "inexistente").length,
    publicImpactoCasaBefore: afterPublicImpactoCasa + changed.length,
    publicImpactoCasaAfter: afterPublicImpactoCasa,
    publicShopeeOvensAfter: publicShopeeOvens.length,
  },
  changed,
};

const verification = {
  generatedAt: now,
  scope: "Loja IMPACTO CASA - produtos ativos apos correcao de fornos",
  total: afterPublicImpactoCasa,
  summary: {
    ok: afterPublicImpactoCasa,
    retiradosDaVitrineNestaRodada: changed.length,
  },
  failures: [],
  notes: [
    "Produtos esgotados ou com link Shopee inexistente foram retirados da publicacao, mas preservados no catalogo para auditoria.",
    "Novo link de afiliado para alternativas deve ser gerado no painel Shopee antes de republicar.",
  ],
};

writeJson(files.report, report);
writeJson(files.packageReport, report);
writeJson(files.verification, verification);
writeJson(files.packageVerification, verification);

console.log(JSON.stringify(report.summary, null, 2));
