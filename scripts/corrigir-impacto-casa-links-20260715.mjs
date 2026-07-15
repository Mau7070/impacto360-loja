import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const now = "2026-07-15T12:53:00-03:00";

const files = {
  products: path.join(root, "dados", "products.json"),
  packageProducts: path.join(packageDir, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  packageStores: path.join(packageDir, "dados", "stores.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  packageBanners: path.join(packageDir, "dados", "banners-anuncios.json"),
  report: path.join(root, "dados", "relatorio-auditoria-impacto-casa-links-2026-07-15.json"),
  packageReport: path.join(packageDir, "dados", "relatorio-auditoria-impacto-casa-links-2026-07-15.json"),
};

const mlCorrections = [
  {
    id: "importado-ml-jogo-de-panelas-mimo-style-premium-9-pecas-inducao-22b4057d",
    previous: "https://meli.la/1uLrkhD.",
    corrected: "https://meli.la/1uLrkhD",
    reason: "Removido ponto final que fazia o shortlink retornar 404.",
  },
  {
    id: "importado-ml-jogo-de-panelas-panelux-magnific-inducao-aa37d6c5",
    previous: "https://meli.la/14z7r5o.",
    corrected: "https://meli.la/14z7r5o",
    reason: "Removido ponto final que fazia o shortlink retornar 404.",
  },
];

const amazonCorrection = {
  id: "importado-amazon-britania-forno-eletrico-bfe55p-dupla-resistencia-220-v-209b3bce",
  previous: "https://link.amazon/B019MKKA8",
  previousFinalAsin: "B0CBL62176",
  corrected: "https://www.amazon.com.br/dp/B0CBL5C5D4?tag=910556142-20",
  source: "https://www.amazon.com.br/dp/B0CBL5C5D4",
  expectedAsin: "B0CBL5C5D4",
  reason: "O link anterior levava ao ASIN B0CBL62176 (Britania BFE55P 127V), diferente do produto cadastrado Britania BFE55P 52L 220V.",
};

const linkFields = [
  "affiliateLink",
  "linkAfiliado",
  "linkCompra",
  "linkComissionado",
  "linkPlataforma",
  "linkOriginal",
  "urlProduto",
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

function replaceInTextFields(product, previous, corrected) {
  for (const [key, value] of Object.entries(product)) {
    if (typeof value === "string" && value.includes(previous)) {
      product[key] = value.split(previous).join(corrected);
    }
  }
}

function setProductLink(product, link, source) {
  for (const field of linkFields) product[field] = link;
  product.linkPrincipalFonte = source;
  product.linkProdutoApenasLeitura = source;
  product.linkResolvidoApenasLeitura = source;
}

function correctProducts(products) {
  const changes = [];
  const byId = new Map(products.map((product) => [product.id, product]));

  for (const correction of mlCorrections) {
    const product = byId.get(correction.id);
    if (!product) throw new Error(`Produto nao encontrado: ${correction.id}`);
    for (const field of linkFields) {
      if (product[field] === correction.previous) product[field] = correction.corrected;
    }
    if (product.validacaoOnline?.requestedUrl === correction.previous) {
      product.validacaoOnline.requestedUrl = correction.corrected;
    }
    product.linkStatus = "link de afiliado corrigido";
    product.ultimaRevisao = "2026-07-15";
    product.auditoriaLinksImpactoCasa = {
      checkedAt: now,
      status: "corrigido",
      previousAffiliateLink: correction.previous,
      correctedAffiliateLink: correction.corrected,
      reason: correction.reason,
    };
    changes.push({ id: correction.id, name: product.name || product.nome, action: "corrigido_link_mercado_livre", ...correction });
  }

  const amazonProduct = byId.get(amazonCorrection.id);
  if (!amazonProduct) throw new Error(`Produto nao encontrado: ${amazonCorrection.id}`);
  replaceInTextFields(amazonProduct, amazonCorrection.previous, amazonCorrection.corrected);
  setProductLink(amazonProduct, amazonCorrection.corrected, amazonCorrection.source);
  amazonProduct.linkStatus = "link de afiliado Amazon corrigido para o ASIN do produto cadastrado";
  amazonProduct.ultimaRevisao = "2026-07-15";
  amazonProduct.observacoes = "Corrigido em 2026-07-15: link anterior levava a versao 127V; link atual aponta para Britania BFE55P 52L 220V.";
  amazonProduct.auditoriaLinksImpactoCasa = {
    checkedAt: now,
    status: "corrigido",
    previousAffiliateLink: amazonCorrection.previous,
    previousFinalAsin: amazonCorrection.previousFinalAsin,
    correctedAffiliateLink: amazonCorrection.corrected,
    expectedAsin: amazonCorrection.expectedAsin,
    sourceProductLink: amazonCorrection.source,
    reason: amazonCorrection.reason,
  };
  amazonProduct.validacaoOnline = {
    ...(amazonProduct.validacaoOnline || {}),
    requestedUrl: amazonCorrection.source,
    finalUrl: amazonCorrection.source,
    sourceProductLink: amazonCorrection.source,
    affiliateLinkCadastrado: amazonCorrection.corrected,
    validationLinkUsadoParaFoto: amazonCorrection.source,
    checkedAt: "2026-07-15",
    linkMatchStatus: "corrigido_para_produto_cadastrado",
  };
  changes.push({
    id: amazonCorrection.id,
    name: amazonProduct.name || amazonProduct.nome,
    action: "corrigido_link_amazon",
    ...amazonCorrection,
  });

  return changes;
}

function correctBanners(bannerData) {
  const changes = [];
  const corrections = [
    ...mlCorrections,
    amazonCorrection,
  ];
  const groups = Array.isArray(bannerData)
    ? [["root", bannerData]]
    : [
      ["banners", Array.isArray(bannerData?.banners) ? bannerData.banners : []],
      ["ads", Array.isArray(bannerData?.ads) ? bannerData.ads : []],
    ];
  for (const [group, banners] of groups) {
    for (const banner of banners) {
      for (const correction of corrections) {
        if (banner.link === correction.previous) {
          banner.link = correction.corrected;
          banner.auditNote = `Link corrigido em 2026-07-15: ${correction.reason}`;
          changes.push({ group, id: banner.id, title: banner.title, action: "corrigido", previous: correction.previous, corrected: correction.corrected });
        } else if (
          banner.link === correction.corrected
          && String(banner.auditNote || "").includes("Link corrigido em 2026-07-15")
        ) {
          changes.push({ group, id: banner.id, title: banner.title, action: "ja_corrigido", previous: correction.previous, corrected: correction.corrected });
        }
      }
    }
  }
  return changes;
}

const products = readJson(files.products, []);
const stores = readJson(files.stores, []);
const banners = readJson(files.banners, []);

const productChanges = correctProducts(products);
const bannerChanges = correctBanners(banners);

writeJson(files.products, products);
writeJson(files.packageProducts, products);
writeJson(files.stores, stores);
writeJson(files.packageStores, stores);
writeJson(files.banners, banners);
writeJson(files.packageBanners, banners);
syncHtml(products, stores);

const report = {
  generatedAt: now,
  scope: "Loja IMPACTO CASA - produtos ativos",
  rules: [
    "Nao remover produto quando a pagina de origem existe e o problema e apenas link de afiliado divergente ou malformado.",
    "Remover somente itens inexistentes confirmados; nesta rodada nenhum produto ativo precisou ser removido.",
  ],
  summary: {
    productLinksCorrected: productChanges.length,
    bannerLinksCorrected: bannerChanges.length,
    removedProducts: 0,
  },
  productChanges,
  bannerChanges,
};

writeJson(files.report, report);
writeJson(files.packageReport, report);

console.log(JSON.stringify(report.summary, null, 2));
