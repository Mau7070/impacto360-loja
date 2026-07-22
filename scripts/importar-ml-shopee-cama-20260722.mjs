import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const today = "2026-07-22";
const now = "2026-07-22T00:00:00-03:00";
const rotationGroup = "marketplaces-cama-quarto-20260722";
const imageFolder = path.posix.join("public", "images", "anuncios", "marketplaces-cama-20260722");

const platformArgs = process.argv
  .find((arg) => arg.startsWith("--platforms="))
  ?.split("=")[1]
  ?.split(",")
  ?.map((value) => value.trim().toLowerCase())
  ?.filter(Boolean);
const requestedPlatforms = new Set(platformArgs?.length ? platformArgs : ["ml", "shopee"]);

const files = {
  mlLinks: path.join(root, "dados", "mercado-livre-cama-links-afiliados-20260722.json"),
  shopeeLinks: path.join(root, "dados", "shopee-cama-links-afiliados-20260722.json"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  importedProducts: path.join(root, "dados", "produtos-importados-ml-shopee-cama-20260722.json"),
  reportJson: path.join(root, "dados", "relatorio-importacao-ml-shopee-cama-20260722.json"),
  reportMarkdown: path.join(root, "dados", "relatorio-importacao-ml-shopee-cama-20260722.md"),
  mainReport: path.join(root, "RELATORIO_MELHORIAS_IMPACTO360.md"),
};

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value, size = 74) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, size) || "produto-cama";
}

function shortHash(value, size = 8) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, size);
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compactTitle(value) {
  const title = cleanText(value)
    .replace(/\b(Envio\s+imediato|Promo[cç][aã]o|Oferta|Frete\s+gr[aá]tis)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return title.length > 82 ? title.slice(0, 79).trim() : title;
}

function cleanPrice(value, platform) {
  const text = cleanText(value)
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s+-\s+/g, " - ");
  return text || `Preco na ${platform}`;
}

function parseRating(value) {
  const number = Number(String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0] || 0);
  return Number.isFinite(number) ? number : 0;
}

function detectSubcategory(title) {
  const text = normalize(title);
  if (/protetor|capa.*colchao|capa.*travesseiro/.test(text)) return "Protetores de colchao";
  if (/edredom|coberdrom|cobertor|manta/.test(text)) return "Cobertores e edredons";
  if (/colcha|cobre\s*leito|bouti|boutis/.test(text)) return "Colchas e cobre-leitos";
  if (/fronha|travesseiro/.test(text)) return "Fronhas e travesseiros";
  if (/lencol|jogo.*cama|roupa.*cama/.test(text)) return "Jogos de cama e lencois";
  return "Cama e quarto";
}

function detectBrand(title, fallback) {
  const brands = [
    "Altenburg",
    "Buddemeyer",
    "Dohler",
    "Fibrasca",
    "Karsten",
    "Kacyumara",
    "Jolitex",
    "Santista",
    "Teka",
    "Vilela Enxovais",
  ];
  const text = normalize(title);
  return brands.find((brand) => text.includes(normalize(brand))) || fallback;
}

function imageExtension(contentType, url) {
  if (/webp/i.test(contentType)) return ".webp";
  if (/png/i.test(contentType)) return ".png";
  if (/jpe?g/i.test(contentType)) return ".jpg";
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return [".webp", ".png", ".jpg", ".jpeg"].includes(ext) ? ext : ".jpg";
  } catch {
    return ".jpg";
  }
}

function firstLink(product) {
  return String(product?.affiliateLink || product?.linkCompra || product?.linkAfiliado || product?.linkComissionado || "")
    .trim()
    .toLowerCase();
}

function backupFiles() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  const backupDir = path.join(root, "backups", `${stamp}-pre-importacao-ml-shopee-cama`);
  const relativeFiles = [
    "dados/products.json",
    "dados/stores.json",
    "dados/banners-anuncios.json",
    "index.html",
    "impacto360.html",
    "pacote-github-pages-pronto/dados/products.json",
    "pacote-github-pages-pronto/dados/stores.json",
    "pacote-github-pages-pronto/dados/banners-anuncios.json",
    "pacote-github-pages-pronto/index.html",
    "RELATORIO_MELHORIAS_IMPACTO360.md",
  ];
  for (const relative of relativeFiles) {
    const source = path.join(root, relative);
    if (!fs.existsSync(source)) continue;
    const target = path.join(backupDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  return backupDir;
}

async function downloadImage(item, productId) {
  const url = String(item.img || "").trim();
  if (!/^https?:\/\//i.test(url)) throw new Error(`Imagem invalida para ${item.title}: ${url}`);

  const response = await fetch(url, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 Impacto360 marketplace catalog importer",
    },
  });
  if (!response.ok) throw new Error(`Falha ao baixar imagem ${productId}: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!/^image\//i.test(contentType)) throw new Error(`Conteudo de imagem invalido ${productId}: ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 900) throw new Error(`Imagem pequena demais ${productId}: ${bytes.length} bytes`);
  const ext = imageExtension(contentType, url);
  const filename = `${productId}${ext}`;
  const relative = path.posix.join(imageFolder, filename);
  for (const base of [root, packageDir]) {
    const target = path.join(base, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return relative;
}

function validatePlatformSource(source, platform) {
  const products = Array.isArray(source?.products) ? source.products : [];
  if (products.length < 50) {
    throw new Error(`${platform}: esperados pelo menos 50 produtos, encontrados ${products.length}.`);
  }
  for (const item of products.slice(0, 50)) {
    if (!item.title || !item.priceText || !item.img || !item.productUrl || !item.affiliateLink) {
      throw new Error(`${platform}: produto incompleto: ${JSON.stringify(item).slice(0, 220)}`);
    }
    if (platform === "Mercado Livre" && !/^https:\/\/meli\.la\//i.test(item.affiliateLink)) {
      throw new Error(`Mercado Livre: link nao oficial: ${item.affiliateLink}`);
    }
    if (platform === "Shopee" && !/^https:\/\/s\.shopee\.com\.br\//i.test(item.affiliateLink)) {
      throw new Error(`Shopee: shortlink oficial ausente: ${item.affiliateLink}`);
    }
  }
}

function makeProduct(item, image, index, platform) {
  const title = compactTitle(item.title);
  const slug = slugify(title);
  const platformKey = platform === "Mercado Livre" ? "ml" : "shopee";
  const id = `${platformKey}-cama-20260722-${shortHash(item.affiliateLink, 10)}`;
  const price = cleanPrice(item.priceText, platform);
  const rating = parseRating(item.rating);
  const subcategory = detectSubcategory(title);
  const brand = detectBrand(title, platform);
  const sourceLabel = platform === "Mercado Livre" ? "Mercado Livre" : "Shopee";
  const ratingText = rating ? ` com avaliacao ${rating.toFixed(1)}` : "";
  const summary = `${title}. Produto de cama e quarto selecionado na ${sourceLabel}${ratingText}.`;
  const details = `Confira medidas, cor, material, frete, estoque e reputacao do vendedor diretamente na ${sourceLabel}.`;
  const affiliateLink = item.affiliateLink;
  const order = String(index + 1).padStart(2, "0");
  const hashtagPlatform = platform === "Mercado Livre" ? "#MercadoLivre" : "#Shopee";

  return {
    id,
    storeId: "impacto-casa",
    name: title,
    nome: title,
    title,
    slug,
    brand,
    marca: brand,
    creator: sourceLabel,
    produtor: sourceLabel,
    description: summary,
    descricaoCurta: summary,
    fullDescription: `${summary} ${details}`,
    descricaoDetalhada: `${summary} ${details}`,
    descricaoCompleta: `${summary} ${details}`,
    textoCatalogo: `${title} - ${price} - ${sourceLabel}.`,
    price,
    preco: price,
    precoPromocional: price,
    precoAnterior: null,
    parcelas: "",
    frete: `Conferir frete na ${sourceLabel}`,
    disponibilidade: `Conferir disponibilidade na ${sourceLabel}`,
    image,
    imagemPrincipal: image,
    fotoPrincipal: image,
    imagem: image,
    galeria: [image],
    fotosExtras: [image],
    fonteMidia: `${sourceLabel} - imagem publica do produto`,
    category: "Casa, Cama e Banho",
    categoria: "Casa, Cama e Banho",
    subcategoria: subcategory,
    badge: sourceLabel,
    buttonLabel: "Ver oferta",
    actionType: "buy",
    affiliateLink,
    linkAfiliado: affiliateLink,
    linkComissionado: affiliateLink,
    linkCompra: affiliateLink,
    linkPlataforma: affiliateLink,
    urlProduto: affiliateLink,
    linkOriginal: affiliateLink,
    linkPrincipalFonte: item.productUrl,
    linkProdutoApenasLeitura: item.productUrl,
    sourceProductLink: item.productUrl,
    linkResolvidoApenasLeitura: affiliateLink,
    tipoLink: platform === "Mercado Livre" ? "meli_la_afiliados" : "shopee_shortlink_afiliados",
    linkStatus: platform === "Mercado Livre"
      ? "link oficial meli.la gerado no painel Mercado Livre Afiliados"
      : "shortlink oficial s.shopee.com.br gerado no painel Shopee Afiliados",
    statusLink: "confirmado",
    statusImagem: "foto real baixada da pagina publica do produto",
    source: sourceLabel,
    origem: `${sourceLabel} Afiliados`,
    plataformaOrigem: sourceLabel,
    status: "ativo",
    statusAnuncio: "ativo",
    aprovadoParaPublicacao: true,
    publicar: true,
    publicarNaHome: index < 30,
    destaqueHome: index < 16,
    geraComissao: true,
    editavelManual: true,
    editable: true,
    editavelPorChatGPT: true,
    atualizadoEm: today,
    publicadoEm: today,
    ultimaRevisao: today,
    rotationGroup,
    homeRotationAdId: `ad-${id}`,
    rating,
    nota: rating,
    reviewRating: rating,
    beneficios: [
      rating ? `Avaliacao vista na plataforma: ${rating.toFixed(1)} de 5.` : "Oferta selecionada em pagina publica da plataforma.",
      "Foto real preservada no acervo da loja.",
      `Link de compra usa afiliado oficial da ${sourceLabel}.`,
    ],
    specs: {
      plataforma: sourceLabel,
      consulta: item.query || "",
      precoVisto: price,
      avaliacaoVista: rating || "",
      posicaoCuradoria: order,
    },
    ofertas: {
      fonte: sourceLabel,
      precoVisto: price,
      avaliacaoVista: rating || "",
      consulta: item.query || "",
      coletadoEm: today,
    },
    marketplace: {
      platform: sourceLabel,
      affiliateUrl: affiliateLink,
      sourceUrl: item.productUrl,
      query: item.query || "",
      rating: rating || "",
      priceSeen: price,
      selectedOrder: index + 1,
    },
    observacoesInternas: [
      `Importacao ${sourceLabel} Cama e Quarto 2026-07-22.`,
      "Produto com imagem e link oficial de afiliado antes da publicacao.",
    ],
    textoWhatsApp: `Oferta ${sourceLabel} no IMPACTO 360 AFILIADO\n\n${title}\n${price}\n\n${affiliateLink}`,
    legendaWhatsApp: `Oferta ${sourceLabel} no IMPACTO 360 AFILIADO\n\n${title}\n${price}\n\n${affiliateLink}`,
    legendaInstagram: `${title}\n\n${price} | Oferta ${sourceLabel}. Confira no link da loja. #Impacto360 ${hashtagPlatform} #CamaEBanho`,
    legendaFacebook: `${title} - ${price}. Oferta ${sourceLabel} selecionada pela Impacto360 Afiliado: ${affiliateLink}`,
    hashtags: ["#Impacto360", hashtagPlatform, "#CamaEBanho", "#Quarto", "#Oferta"],
  };
}

function ensureStore(stores) {
  const store = stores.find((item) => item.id === "impacto-casa");
  if (!store) throw new Error("Loja impacto-casa nao encontrada.");
  const additions = [
    "Cama e banho",
    "Jogos de cama",
    "Lencois",
    "Cobertores e edredons",
    "Colchas",
    "Protetores de colchao",
    "Fronhas e travesseiros",
    "Mercado Livre cama e quarto",
    "Shopee cama e quarto",
  ];
  store.subcategories = Array.from(new Set([...(store.subcategories || []), ...additions]));
  store.section = "Cama, casa e organizacao";
  store.description = "Casa, cozinha, organizacao e cama/banho com ofertas selecionadas.";
  return stores;
}

function makeBanner(product, index) {
  return {
    id: `banner-${product.id}`,
    productId: product.id,
    storeId: product.storeId,
    image: product.image,
    title: product.name,
    description: `${product.price} | ${product.source}.`,
    link: product.linkCompra,
    active: true,
    order: index + 1,
    source: product.source,
    category: product.subcategoria,
    rotationGroup,
    curatedAt: today,
  };
}

function makeAd(product, index) {
  return {
    id: `ad-${product.id}`,
    priority: index + 1,
    productId: product.id,
    storeId: product.storeId,
    image: product.image,
    title: product.name,
    description: `${product.price} | ${product.source}.`,
    buttonLabel: "Ver oferta",
    link: product.linkCompra,
    startDate: today,
    endDate: "",
    active: true,
    source: product.source,
    category: product.subcategoria,
    rotationGroup,
    curatedAt: today,
  };
}

function updateBanners(products) {
  const data = readJson(files.banners, { settings: {}, banners: [], ads: [] });
  const previousPrefixes = ["banner-mercado-livre-cama-20260722-", "banner-shopee-cama-20260722-"];
  const previousAdPrefixes = ["ad-mercado-livre-cama-20260722-", "ad-shopee-cama-20260722-"];
  const existingBanners = (Array.isArray(data.banners) ? data.banners : [])
    .filter((item) => !previousPrefixes.some((prefix) => String(item.id || "").startsWith(prefix)))
    .filter((item) => item.rotationGroup !== rotationGroup)
    .map((item) => ({ ...item, order: Number(item.order || 0) + Math.min(products.length, 16) }));
  const existingAds = (Array.isArray(data.ads) ? data.ads : [])
    .filter((item) => !previousAdPrefixes.some((prefix) => String(item.id || "").startsWith(prefix)))
    .filter((item) => item.rotationGroup !== rotationGroup)
    .map((item) => ({ ...item, priority: Number(item.priority || 0) + products.length }));
  data.banners = [
    ...products.slice(0, 16).map(makeBanner),
    ...existingBanners,
  ];
  data.ads = [
    ...products.map(makeAd),
    ...existingAds,
  ];
  data.settings = {
    bannerRotationMs: 6500,
    adRotationMs: 5200,
    ...(data.settings || {}),
    updatedAt: today,
    latestRotationGroup: rotationGroup,
  };
  writeJson(files.banners, data);
  writeJson(path.join(packageDir, "dados", "banners-anuncios.json"), data);
  return { banners: products.slice(0, 16).length, ads: products.length };
}

function replaceInlineArray(html, variableName, value) {
  const marker = `let ${variableName} =`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return html;
  const arrayStart = html.indexOf("[", markerIndex);
  if (arrayStart < 0) throw new Error(`Array ${variableName} nao encontrado no HTML.`);

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

function syncPackageAndHtml(products, stores) {
  writeJson(path.join(packageDir, "dados", "products.json"), products);
  writeJson(path.join(packageDir, "dados", "stores.json"), stores);
  for (const file of [
    path.join(root, "index.html"),
    path.join(root, "impacto360.html"),
    path.join(packageDir, "index.html"),
  ]) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const next = replaceInlineArray(replaceInlineArray(html, "stores", stores), "products", products);
    fs.writeFileSync(file, next, "utf8");
  }
}

function appendMainReport(report) {
  const section = [
    "",
    `## Importacao Mercado Livre e Shopee Cama e Quarto - ${today}`,
    "",
    `- Backup criado antes da escrita: ${path.relative(root, report.backupDir).replace(/\\/g, "/")}`,
    `- Produtos Mercado Livre publicados: ${report.counts["Mercado Livre"] || 0}`,
    `- Produtos Shopee publicados: ${report.counts.Shopee || 0}`,
    `- Anuncios rotativos adicionados: ${report.bannerStats.ads}`,
    `- Banners rotativos adicionados: ${report.bannerStats.banners}`,
    `- Grupo de rotacao: ${rotationGroup}`,
    "- Links Mercado Livre aceitos somente com formato oficial meli.la.",
    "- Links Shopee aceitos somente com formato oficial s.shopee.com.br.",
  ].join("\n");
  fs.appendFileSync(files.mainReport, `${section}\n`, "utf8");
}

function makeMarkdownReport(report) {
  const lines = [
    `# Relatorio importacao ML/Shopee cama e quarto - ${today}`,
    "",
    `Backup: ${path.relative(root, report.backupDir).replace(/\\/g, "/")}`,
    `Grupo de rotacao: ${rotationGroup}`,
    "",
    "## Totais",
    "",
    `- Mercado Livre: ${report.counts["Mercado Livre"] || 0}`,
    `- Shopee: ${report.counts.Shopee || 0}`,
    `- Produtos novos: ${report.products.length}`,
    `- Ads rotativos: ${report.bannerStats.ads}`,
    `- Banners rotativos: ${report.bannerStats.banners}`,
    "",
    "## Produtos",
    "",
    ...report.products.map((product, index) => (
      `${index + 1}. ${product.source} - ${product.title} - ${product.price} - ${product.affiliateLink}`
    )),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

const sources = [];
if (requestedPlatforms.has("ml")) {
  const mlSource = readJson(files.mlLinks);
  validatePlatformSource(mlSource, "Mercado Livre");
  sources.push({ platform: "Mercado Livre", products: mlSource.products.slice(0, 50) });
}
if (requestedPlatforms.has("shopee")) {
  const shopeeSource = readJson(files.shopeeLinks);
  validatePlatformSource(shopeeSource, "Shopee");
  sources.push({ platform: "Shopee", products: shopeeSource.products.slice(0, 50) });
}
if (!sources.length) throw new Error("Nenhuma plataforma solicitada para importacao.");

const backupDir = backupFiles();
const incomingProducts = [];
for (const source of sources) {
  for (const item of source.products) {
    const title = compactTitle(item.title);
    const productId = `${source.platform === "Mercado Livre" ? "ml" : "shopee"}-cama-20260722-${shortHash(item.affiliateLink, 10)}`;
    const image = await downloadImage(item, productId);
    incomingProducts.push(makeProduct(item, image, incomingProducts.length, source.platform));
  }
}

const incomingIds = new Set(incomingProducts.map((product) => product.id));
const incomingLinks = new Set(incomingProducts.map(firstLink));
const products = readJson(files.products, []);
const previousImportIds = /^(mercado-livre|ml|shopee)-cama-20260722-/;
const nextProducts = [
  ...incomingProducts,
  ...products.filter((product) => (
    !previousImportIds.test(String(product.id || ""))
    && product.rotationGroup !== rotationGroup
    && !incomingIds.has(String(product.id))
    && !incomingLinks.has(firstLink(product))
  )),
];
const stores = ensureStore(readJson(files.stores, []));

writeJson(files.products, nextProducts);
writeJson(files.stores, stores);
syncPackageAndHtml(nextProducts, stores);
const bannerStats = updateBanners(incomingProducts);
writeJson(files.importedProducts, incomingProducts);
writeJson(path.join(packageDir, "dados", "produtos-importados-ml-shopee-cama-20260722.json"), incomingProducts);

const counts = incomingProducts.reduce((acc, product) => {
  acc[product.source] = (acc[product.source] || 0) + 1;
  return acc;
}, {});
const report = {
  generatedAt: now,
  backupDir,
  rotationGroup,
  requestedPlatforms: [...requestedPlatforms],
  counts,
  bannerStats,
  products: incomingProducts.map((product) => ({
    id: product.id,
    source: product.source,
    title: product.title,
    price: product.price,
    subcategoria: product.subcategoria,
    affiliateLink: product.affiliateLink,
    productUrl: product.sourceProductLink,
    image: product.image,
  })),
};
writeJson(files.reportJson, report);
writeJson(path.join(packageDir, "dados", "relatorio-importacao-ml-shopee-cama-20260722.json"), report);
fs.writeFileSync(files.reportMarkdown, makeMarkdownReport(report), "utf8");
fs.writeFileSync(path.join(packageDir, "dados", "relatorio-importacao-ml-shopee-cama-20260722.md"), makeMarkdownReport(report), "utf8");
appendMainReport(report);

console.log(`Importados ${incomingProducts.length} produtos de cama e quarto.`);
console.log(`Totais: ${JSON.stringify(counts)}`);
console.log(`Banners/ads: ${JSON.stringify(bannerStats)}`);
