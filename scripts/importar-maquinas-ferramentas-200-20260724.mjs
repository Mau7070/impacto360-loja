import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const today = "2026-07-24";
const rotationGroup = "maquinas-ferramentas-200-20260724";
const importPrefix = "ferramentas-20260724-";
const imageFolder = path.posix.join("public", "images", "anuncios", "ferramentas-20260724");
const validateOnly = process.argv.includes("--validate-only");

const files = {
  selection: path.join(root, "dados", "curadoria-maquinas-ferramentas-20260724.tsv"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  reportJson: path.join(root, "dados", "relatorio-importacao-maquinas-ferramentas-200-20260724.json"),
  reportMarkdown: path.join(root, "dados", "relatorio-importacao-maquinas-ferramentas-200-20260724.md"),
  importedProducts: path.join(root, "dados", "produtos-importados-maquinas-ferramentas-200-20260724.json"),
  mainReport: path.join(root, "RELATORIO_MELHORIAS_IMPACTO360.md"),
};

const platformRules = {
  amazon: {
    count: 85,
    label: "Amazon",
    affiliate: /^https:\/\/www\.amazon\.com\.br\/dp\/[A-Z0-9]{10}\?tag=910556142-20$/i,
    minCommission: 8,
  },
  "mercado-livre": {
    count: 85,
    label: "Mercado Livre",
    affiliate: /^https:\/\/meli\.la\/[A-Za-z0-9]+$/i,
    minCommission: 12,
  },
  shopee: {
    count: 30,
    label: "Shopee",
    affiliate: /^https:\/\/s\.shopee\.com\.br\/[A-Za-z0-9]+$/i,
    minCommission: 15,
  },
};

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseTsv(file) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split("\t");
  return lines.slice(1).map((line, index) => {
    const values = line.split("\t");
    if (values.length !== headers.length) {
      throw new Error(`${path.basename(file)}: linha ${index + 2} tem ${values.length} colunas; esperadas ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column] || ""]));
  });
}

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function canonicalUrl(value) {
  return cleanText(value).replace(/[?#].*$/, "").toLowerCase();
}

function slugify(value, limit = 82) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, limit);
}

function shortHash(value, size = 12) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, size);
}

function number(value) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value) {
  const text = cleanText(value).replace(/\u00a0/g, " ");
  if (!/^R\$\s?\d/.test(text)) return "";
  return text.replace(/^R\$\s*/, "R$ ");
}

function commercialTitle(value) {
  let title = cleanText(value)
    .replace(/\boferta\b/gi, "")
    .replace(/\bpromo[cç][aã]o\b/gi, "")
    .replace(/\boriginal\b/gi, "")
    .replace(/\benvio r[aá]pido\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (title.length <= 96) return title;
  title = title.slice(0, 96);
  return title.replace(/\s+\S*$/, "").replace(/[,:;/-]+$/, "").trim();
}

function detectSubcategory(title) {
  const text = normalize(title);
  if (/furadeira|parafusadeira|chave de impacto/.test(text)) return "Furadeiras e parafusadeiras";
  if (/serra|tico.?tico|cortadora|policorte/.test(text)) return "Serras e corte";
  if (/esmerilhadeira|lixadeira|retificadeira|multiferramenta/.test(text)) return "Lixamento e acabamento";
  if (/martelete|rompedor|demolidor/.test(text)) return "Marteletes e demolição";
  if (/solda|inversora|mig|eletrodo/.test(text)) return "Solda";
  if (/compressor|pistola de pintura/.test(text)) return "Compressores e pintura";
  if (/lavadora|alta pressao|lava jato/.test(text)) return "Lavadoras de alta pressão";
  if (/tupia|plaina/.test(text)) return "Marcenaria";
  if (/alicate|chave|soquete|trena|estilete|ferramenta/.test(text)) return "Ferramentas manuais";
  if (/bolsa|caixa|carrinho|maleta|organizador/.test(text)) return "Organização de ferramentas";
  return "Máquinas e ferramentas em geral";
}

function detectBrand(title, platform) {
  const brands = [
    "Black+Decker", "Bosch", "Craftsman", "Dewalt", "Dremel", "Einhell", "Gradiente",
    "Irwin", "Klein Tools", "Knipex", "Makita", "Milwaukee", "Neiko", "Philco",
    "Skil", "Sparta", "Vonder", "Wap", "Wera",
  ];
  const text = normalize(title);
  return brands.find((brand) => text.includes(normalize(brand))) || platformRules[platform].label;
}

function normalizeSelection(rows) {
  return rows.map((item) => ({
    platform: cleanText(item.platform).toLowerCase(),
    id: cleanText(item.external_id),
    title: cleanText(item.title),
    priceText: cleanText(item.price),
    rating: number(item.rating),
    reviewCount: number(item.review_count),
    sold: cleanText(item.sold),
    commissionRate: number(item.commission_rate),
    productUrl: cleanText(item.source_url),
    affiliateLink: cleanText(item.affiliate_link),
    image: cleanText(item.image_url),
    purchaseSignal: cleanText(item.purchase_signal),
    selectedOrder: number(item.selected_order),
  }));
}

function catalogProductKeys(products) {
  const keys = new Set();
  for (const product of products) {
    if (String(product.id || "").startsWith(importPrefix)) continue;
    for (const value of [
      product.marketplace?.sourceUrl,
      product.sourceProductLink,
      product.linkPrincipalFonte,
      product.affiliateLink,
    ]) {
      const text = cleanText(value);
      if (!text) continue;
      keys.add(canonicalUrl(text));
      const amazon = text.match(/(?:dp\/|gp\/product\/)([A-Z0-9]{10})/i)?.[1];
      const mercadoLivre = text.match(/MLB\d+/i)?.[0];
      if (amazon) keys.add(`amazon:${amazon.toUpperCase()}`);
      if (mercadoLivre) keys.add(`mercado-livre:${mercadoLivre.toUpperCase()}`);
    }
  }
  return keys;
}

function validateSelection(items, currentProducts) {
  const errors = [];
  const counts = Object.fromEntries(Object.keys(platformRules).map((platform) => [
    platform,
    items.filter((item) => item.platform === platform).length,
  ]));
  if (items.length !== 200) errors.push(`Total incompleto: ${items.length}/200.`);
  for (const [platform, rule] of Object.entries(platformRules)) {
    if (counts[platform] !== rule.count) errors.push(`${rule.label}: ${counts[platform]}/${rule.count} produtos.`);
  }

  const affiliateLinks = new Set();
  const productKeys = new Set();
  const catalogKeys = catalogProductKeys(currentProducts);
  for (const [index, item] of items.entries()) {
    const rule = platformRules[item.platform];
    if (!rule) {
      errors.push(`Linha ${index + 2}: plataforma desconhecida: ${item.platform}.`);
      continue;
    }
    if (!item.id || !item.title || !/^https:\/\//i.test(item.productUrl)) {
      errors.push(`${rule.label}: produto sem identificador, titulo ou URL-fonte.`);
    }
    if (!rule.affiliate.test(item.affiliateLink)) errors.push(`${rule.label}: link afiliado invalido: ${item.affiliateLink}`);
    const affiliateKey = canonicalUrl(item.affiliateLink);
    if (affiliateLinks.has(affiliateKey)) errors.push(`Link afiliado duplicado: ${item.affiliateLink}`);
    affiliateLinks.add(affiliateKey);

    const productKey = `${item.platform}:${item.id.toUpperCase()}`;
    if (productKeys.has(productKey)) errors.push(`Produto duplicado no lote: ${item.title}`);
    productKeys.add(productKey);
    if (catalogKeys.has(productKey) || catalogKeys.has(canonicalUrl(item.productUrl)) || catalogKeys.has(affiliateKey)) {
      errors.push(`Produto ja existente no catalogo: ${item.platform} ${item.id} - ${item.title}`);
    }
    if (item.rating < 4.5) errors.push(`${rule.label}: avaliacao abaixo de 4.5: ${item.title}`);
    if (item.commissionRate < rule.minCommission) {
      errors.push(`${rule.label}: comissao ${item.commissionRate}% abaixo do minimo ${rule.minCommission}%: ${item.title}`);
    }
    if (!/^https:\/\//i.test(item.image)) errors.push(`${rule.label}: imagem ausente: ${item.title}`);
    if (!formatPrice(item.priceText)) errors.push(`${rule.label}: preco ausente: ${item.title}`);
    if (item.platform === "amazon" && item.reviewCount < 50) {
      errors.push(`Amazon: menos de 50 avaliacoes: ${item.title}`);
    }
    if (item.platform === "mercado-livre" && !item.sold) {
      errors.push(`Mercado Livre: volume vendido ausente: ${item.title}`);
    }
    if (item.platform === "shopee" && !item.sold) {
      errors.push(`Shopee: volume vendido ausente: ${item.title}`);
    }
  }
  return { ok: errors.length === 0, counts, errors };
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

function amazonHighResolution(url) {
  return String(url).replace(/\._AC_[A-Z]*\d+_\./i, "._AC_SL1200_.");
}

async function fetchImage(url, fallbackUrl) {
  const request = async (target) => {
    const response = await fetch(target, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "Mozilla/5.0 Impacto360 catalog importer",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!/^image\//i.test(contentType)) throw new Error(`conteudo ${contentType || "desconhecido"}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1800) throw new Error(`imagem pequena: ${bytes.length} bytes`);
    return { bytes, contentType, finalUrl: target };
  };
  try {
    return await request(url);
  } catch (error) {
    if (!fallbackUrl || fallbackUrl === url) throw error;
    return request(fallbackUrl);
  }
}

async function downloadImage(item, id) {
  const originalUrl = item.image;
  const optimizedUrl = item.platform === "amazon" ? amazonHighResolution(originalUrl) : originalUrl;
  const { bytes, contentType, finalUrl } = await fetchImage(optimizedUrl, originalUrl);
  const ext = imageExtension(contentType, finalUrl);
  const relative = path.posix.join(imageFolder, `${id}${ext}`);
  for (const base of [root, packageDir]) {
    const target = path.join(base, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return relative;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function platformId(item) {
  if (item.platform === "amazon") return item.id.toLowerCase();
  return `${item.id.toLowerCase()}-${shortHash(item.affiliateLink, 8)}`;
}

function makeProduct(item, image, index) {
  const rule = platformRules[item.platform];
  const title = commercialTitle(item.title);
  const id = `${importPrefix}${item.platform}-${platformId(item)}`;
  const price = formatPrice(item.priceText);
  const rating = number(item.rating);
  const commission = number(item.commissionRate);
  const sourceLabel = rule.label;
  const interest = item.reviewCount
    ? `${item.reviewCount.toLocaleString("pt-BR")} avaliacoes`
    : `${item.sold} vendidos`;
  const summary = `${title}. Selecionado na ${sourceLabel} com nota ${rating.toFixed(1)} e ${interest}.`;
  const details = `Confira voltagem, medidas, acessorios, garantia, preco, frete, estoque e condicoes diretamente na ${sourceLabel} antes da compra.`;
  const subcategory = detectSubcategory(title);
  const affiliateLink = item.affiliateLink;

  return {
    id,
    storeId: "impacto-ferramentas",
    name: title,
    nome: title,
    title,
    slug: slugify(title) || platformId(item),
    brand: detectBrand(title, item.platform),
    marca: detectBrand(title, item.platform),
    creator: sourceLabel,
    produtor: sourceLabel,
    description: summary,
    descricaoCurta: summary,
    fullDescription: `${summary} ${details}`,
    descricaoDetalhada: `${summary} ${details}`,
    descricaoCompleta: `${summary} ${details}`,
    textoCatalogo: `${title} - ${price} - nota ${rating.toFixed(1)} na ${sourceLabel}.`,
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
    fonteMidia: `${sourceLabel} - imagem real do anuncio verificada em sessao logada`,
    category: "Casa e Família",
    categoria: "Casa e Família",
    subcategoria: subcategory,
    badge: `${rating.toFixed(1)} estrelas`,
    buttonLabel: "Ver oferta",
    chamadaCompra: `Ver oferta na ${sourceLabel}`,
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
    linkResolvidoApenasLeitura: item.productUrl,
    sourceProductLink: item.productUrl,
    tipoLink: item.platform === "amazon"
      ? "amazon_associados"
      : item.platform === "mercado-livre"
        ? "meli_la_afiliados"
        : "shopee_shortlink_afiliados",
    linkStatus: `link oficial de afiliado ${sourceLabel} confirmado`,
    statusLink: "confirmado",
    statusImagem: "imagem real verificada e armazenada localmente",
    source: sourceLabel,
    origem: `${sourceLabel} Afiliados`,
    plataformaOrigem: sourceLabel,
    status: "ativo",
    statusAnuncio: "ativo",
    aprovadoParaPublicacao: true,
    publicar: true,
    publicarNaHome: index < 36,
    destaqueHome: index < 15,
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
    avaliacao: rating.toFixed(1),
    reviewCount: item.reviewCount || null,
    vendidos: item.sold || "",
    commissionRate: commission,
    comissao: `${commission}%`,
    purchaseSignal: item.purchaseSignal || "",
    beneficios: [
      `Avaliacao verificada: ${rating.toFixed(1)} de 5.`,
      item.reviewCount ? `${item.reviewCount.toLocaleString("pt-BR")} avaliacoes registradas na curadoria.` : `${item.sold} vendidos exibidos na curadoria.`,
      `Link oficial de afiliado ${sourceLabel} preservado.`,
    ],
    specs: {
      plataforma: sourceLabel,
      precoVisto: price,
      avaliacaoVista: rating,
      avaliacoes: item.reviewCount || "",
      vendidos: item.sold || "",
      comissaoVerificada: `${commission}%`,
      posicaoCuradoria: item.selectedOrder || index + 1,
    },
    marketplace: {
      platform: sourceLabel,
      externalId: item.id,
      affiliateUrl: affiliateLink,
      sourceUrl: item.productUrl,
      rating,
      reviewCount: item.reviewCount || "",
      sold: item.sold || "",
      commissionRate: commission,
      priceSeen: price,
      selectedOrder: item.selectedOrder || index + 1,
      curatedAt: today,
    },
    googleAdsRevisao: {
      adequadoPrimeiraDivulgacao: true,
      motivo: "Produto fisico comum de maquinas e ferramentas, sem promessa de resultado garantido.",
      cuidados: [
        "Nao prometer desempenho, seguranca ou durabilidade garantidos.",
        "Nao anunciar preco fixo sem confirmar na plataforma.",
        "Conferir voltagem, garantia, frete, estoque e acessorios antes da divulgacao.",
      ],
    },
    observacoesInternas: `Curadoria de maquinas e ferramentas ${today}: nota, comissao, link e imagem verificados antes da importacao.`,
    textoWhatsApp: `Oferta ${sourceLabel} no IMPACTO 360\n\n${title}\n${price} | nota ${rating.toFixed(1)}\n\n${affiliateLink}`,
    legendaWhatsApp: `Oferta ${sourceLabel} no IMPACTO 360\n\n${title}\n${price} | nota ${rating.toFixed(1)}\n\n${affiliateLink}`,
    legendaInstagram: `${title}\n\nNota ${rating.toFixed(1)} | ${price}. Confira condicoes no link da loja.\n\n#Impacto360 #Ferramentas #Maquinas`,
    legendaFacebook: `${title} - nota ${rating.toFixed(1)} - ${price}. Oferta selecionada: ${affiliateLink}`,
    hashtags: ["#Impacto360", "#Ferramentas", "#Maquinas", "#Oficina", `#${sourceLabel.replace(/\s+/g, "")}`],
  };
}

function ensureStore(stores, coverImage) {
  const storeData = {
    id: "impacto-ferramentas",
    slug: "impacto-ferramentas",
    route: "/loja/impacto-ferramentas",
    name: "IMPACTO FERRAMENTAS",
    commercialName: "Máquinas e Ferramentas",
    floor: "terreo",
    category: "Casa e Família",
    type: "products",
    theme: "home",
    icon: "TOOLS",
    color: "#d97706",
    gradient: "linear-gradient(135deg,#fff7ed,#ffffff 45%,#e7eef7)",
    description: "Máquinas, ferramentas elétricas e itens de oficina selecionados por avaliação e comissão.",
    subcategories: [
      "Furadeiras e parafusadeiras",
      "Serras e corte",
      "Lixamento e acabamento",
      "Marteletes e demolição",
      "Solda",
      "Compressores e pintura",
      "Lavadoras de alta pressão",
      "Marcenaria",
      "Ferramentas manuais",
      "Organização de ferramentas",
      "Amazon ferramentas",
      "Mercado Livre ferramentas",
      "Shopee ferramentas",
    ],
    section: "Máquinas, ferramentas e oficina",
    active: true,
    coverImage,
  };
  const index = stores.findIndex((item) => item.id === storeData.id);
  if (index >= 0) stores[index] = { ...stores[index], ...storeData };
  else stores.push(storeData);
  return stores;
}

function scoreProduct(product) {
  const sold = String(product.vendidos || "").toLowerCase();
  const soldScore = (Number.parseFloat(sold.replace(",", ".")) || 0) * (sold.includes("mil") ? 1000 : 1);
  return product.rating * 100000 + product.commissionRate * 1000 + Number(product.reviewCount || 0) + soldScore;
}

function balancedHighlights(products, perPlatform) {
  return ["Amazon", "Mercado Livre", "Shopee"]
    .flatMap((source) => products.filter((product) => product.source === source).sort((a, b) => scoreProduct(b) - scoreProduct(a)).slice(0, perPlatform))
    .sort((a, b) => scoreProduct(b) - scoreProduct(a));
}

function makeBanner(product, index) {
  return {
    id: `banner-${product.id}`,
    productId: product.id,
    storeId: product.storeId,
    image: product.image,
    title: product.name,
    description: `${product.price} | nota ${Number(product.rating).toFixed(1)} | ${product.source}`,
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
    description: `${product.price} | nota ${Number(product.rating).toFixed(1)} | ${product.source}`,
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
  const highlights = balancedHighlights(products, 5);
  const oldBanners = (Array.isArray(data.banners) ? data.banners : [])
    .filter((item) => item.rotationGroup !== rotationGroup && !String(item.id || "").includes(importPrefix))
    .map((item) => ({ ...item, order: Number(item.order || 0) + highlights.length }));
  const oldAds = (Array.isArray(data.ads) ? data.ads : [])
    .filter((item) => item.rotationGroup !== rotationGroup && !String(item.id || "").includes(importPrefix))
    .map((item) => ({ ...item, priority: Number(item.priority || 0) + products.length }));
  data.banners = [...highlights.map(makeBanner), ...oldBanners];
  data.ads = [...products.map(makeAd), ...oldAds];
  data.settings = {
    ...(data.settings || {}),
    bannerRotationMs: 6500,
    adRotationMs: 5200,
    updatedAt: today,
    latestRotationGroup: rotationGroup,
  };
  return { data, banners: highlights.length, ads: products.length };
}

function backupFiles() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  const backupDir = path.join(root, "backups", `${stamp}-pre-importacao-maquinas-ferramentas-200`);
  for (const relative of [
    "dados/products.json",
    "dados/stores.json",
    "dados/banners-anuncios.json",
    "index.html",
    "impacto360.html",
    "sitemap.xml",
    "pacote-github-pages-pronto/dados/products.json",
    "pacote-github-pages-pronto/dados/stores.json",
    "pacote-github-pages-pronto/dados/banners-anuncios.json",
    "pacote-github-pages-pronto/index.html",
    "RELATORIO_MELHORIAS_IMPACTO360.md",
  ]) {
    const source = path.join(root, relative);
    if (!fs.existsSync(source)) continue;
    const target = path.join(backupDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  return backupDir;
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
      if (depth === 0) return `${html.slice(0, arrayStart)}${JSON.stringify(value, null, 2)}${html.slice(i + 1)}`;
    }
  }
  throw new Error(`Fim do array ${variableName} nao encontrado.`);
}

function syncData(products, stores, banners) {
  writeJson(files.products, products);
  writeJson(files.stores, stores);
  writeJson(files.banners, banners);
  writeJson(path.join(packageDir, "dados", "products.json"), products);
  writeJson(path.join(packageDir, "dados", "stores.json"), stores);
  writeJson(path.join(packageDir, "dados", "banners-anuncios.json"), banners);
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

function syncAuxiliaryFiles() {
  for (const file of [files.selection, files.reportJson, files.reportMarkdown, files.importedProducts]) {
    if (!fs.existsSync(file)) continue;
    const target = path.join(packageDir, path.relative(root, file));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
}

function makeReport(report) {
  return [
    `# Relatorio de importacao - 200 maquinas e ferramentas - ${today}`,
    "",
    `Backup: ${path.relative(root, report.backupDir).replace(/\\/g, "/")}`,
    "",
    "## Totais importados",
    "",
    `- Amazon: ${report.counts.amazon}`,
    `- Mercado Livre: ${report.counts["mercado-livre"]}`,
    `- Shopee: ${report.counts.shopee}`,
    `- Total: ${report.products.length}`,
    `- Banners: ${report.bannerStats.banners}`,
    `- Anuncios rotativos: ${report.bannerStats.ads}`,
    "",
    "## Criterios",
    "",
    "- Nota minima: 4,5.",
    "- Amazon: comissao oficial de 8% para Ferramentas.",
    "- Mercado Livre: comissao minima de 12%.",
    "- Shopee: comissao minima de 15%.",
    "- Links oficiais de afiliado, precos e imagens verificados antes da importacao.",
    "- Produtos ja existentes no catalogo foram rejeitados pela validacao.",
    "",
    "## Produtos",
    "",
    ...report.products.map((product, index) => (
      `${index + 1}. ${product.source} - ${product.title} - ${product.price} - nota ${product.rating.toFixed(1)} - comissao ${product.commissionRate}%`
    )),
    "",
  ].join("\n");
}

const currentProducts = readJson(files.products, []);
const selection = normalizeSelection(parseTsv(files.selection));
const validation = validateSelection(selection, currentProducts);

if (validateOnly || !validation.ok) {
  console.log(JSON.stringify({
    ready: validation.ok,
    total: selection.length,
    counts: validation.counts,
    errors: validation.errors,
  }, null, 2));
  if (!validation.ok) process.exitCode = 2;
} else {
  const currentStores = readJson(files.stores, []);
  if (!Array.isArray(currentProducts) || !Array.isArray(currentStores)) {
    throw new Error("Catalogo principal invalido.");
  }

  const backupDir = backupFiles();
  const images = await mapLimit(selection, 6, async (item) => {
    const id = `${importPrefix}${item.platform}-${platformId(item)}`;
    return downloadImage(item, id);
  });
  const importedProducts = selection.map((item, index) => makeProduct(item, images[index], index));
  if (new Set(importedProducts.map((product) => product.id)).size !== 200) {
    throw new Error("IDs unicos invalidos: esperado 200.");
  }
  if (importedProducts.some((product) => !fs.existsSync(path.join(root, product.image)))) {
    throw new Error("Uma ou mais imagens locais nao foram gravadas.");
  }

  const nextProducts = [
    ...importedProducts,
    ...currentProducts.filter((product) => !String(product.id || "").startsWith(importPrefix)),
  ];
  const nextStores = ensureStore(currentStores, importedProducts[0].image);
  const bannerStats = updateBanners(importedProducts);
  syncData(nextProducts, nextStores, bannerStats.data);
  writeJson(files.importedProducts, importedProducts);

  const report = {
    generatedAt: new Date().toISOString(),
    backupDir,
    rotationGroup,
    counts: validation.counts,
    bannerStats: { banners: bannerStats.banners, ads: bannerStats.ads },
    thresholds: {
      rating: 4.5,
      amazonCommission: 8,
      mercadoLivreCommission: 12,
      shopeeCommission: 15,
    },
    products: importedProducts.map((product) => ({
      id: product.id,
      source: product.source,
      title: product.title,
      rating: product.rating,
      commissionRate: product.commissionRate,
      price: product.price,
      image: product.image,
      affiliateLink: product.affiliateLink,
    })),
  };
  writeJson(files.reportJson, report);
  fs.writeFileSync(files.reportMarkdown, `${makeReport({ ...report, products: importedProducts })}\n`, "utf8");
  fs.appendFileSync(files.mainReport, [
    "",
    `## Importacao de 200 maquinas e ferramentas - ${today}`,
    "",
    `- Amazon: ${validation.counts.amazon}`,
    `- Mercado Livre: ${validation.counts["mercado-livre"]}`,
    `- Shopee: ${validation.counts.shopee}`,
    "- Nota minima: 4,5.",
    "- Links, comissoes, precos e imagens verificados antes da importacao.",
    `- Backup: ${path.relative(root, backupDir).replace(/\\/g, "/")}`,
    "",
  ].join("\n"), "utf8");
  syncAuxiliaryFiles();
  console.log(JSON.stringify({
    ok: true,
    total: importedProducts.length,
    counts: validation.counts,
    backup: path.relative(root, backupDir).replace(/\\/g, "/"),
    report: path.relative(root, files.reportJson).replace(/\\/g, "/"),
  }, null, 2));
}
