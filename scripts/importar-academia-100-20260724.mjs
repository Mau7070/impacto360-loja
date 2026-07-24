import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const today = "2026-07-24";
const rotationGroup = "academia-100-20260724";
const importPrefix = "academia-20260724-";
const imageFolder = path.posix.join("public", "images", "anuncios", "academia-20260724");
const validateOnly = process.argv.includes("--validate-only");

const files = {
  selection: path.join(root, "dados", "curadoria-academia-20260723.tsv"),
  mlMetadata: path.join(root, "dados", "curadoria-mercado-livre-metadados-20260723.tsv"),
  shopeeSelection: path.join(root, "dados", "curadoria-shopee-verificada-20260724.tsv"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  reportJson: path.join(root, "dados", "relatorio-importacao-academia-100-20260724.json"),
  reportMarkdown: path.join(root, "dados", "relatorio-importacao-academia-100-20260724.md"),
  importedProducts: path.join(root, "dados", "produtos-importados-academia-100-20260724.json"),
  mainReport: path.join(root, "RELATORIO_MELHORIAS_IMPACTO360.md"),
};

const platformRules = {
  amazon: {
    count: 33,
    label: "Amazon",
    affiliate: /^https:\/\/www\.amazon\.com\.br\/dp\/[A-Z0-9]{10}\?tag=910556142-20$/i,
    minCommission: 8,
  },
  "mercado-livre": {
    count: 34,
    label: "Mercado Livre",
    affiliate: /^https:\/\/meli\.la\/[A-Za-z0-9]+$/i,
    minCommission: 16,
  },
  shopee: {
    count: 33,
    label: "Shopee",
    affiliate: /^https:\/\/s\.shopee\.com\.br\/[A-Za-z0-9]+$/i,
    minCommission: 8,
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
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value, limit = 82) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, limit);
}

function shortHash(value, size = 10) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, size);
}

function number(value) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function commercialTitle(value) {
  let title = cleanText(value)
    .replace(/\bEmagrecimento\b/gi, "")
    .replace(/\bSa[uÃº]de Bem Estar\b/gi, "")
    .replace(/\bGanhe For[cÃ§]a,?\s*Resist[eÃª]ncia e Abd[oÃ´]men Definido\b/gi, "")
    .replace(/\bSeguran[cÃ§]a e Durabilidade\b/gi, "")
    .replace(/\bBarato e de Qualidade\b/gi, "")
    .replace(/\bEnvio em 24 ?horas?\b/gi, "")
    .replace(/\bEnvio em 24 ?hrs?\b/gi, "")
    .replace(/\bEnvio R[aÃ¡]pido\b/gi, "")
    .replace(/\bOferta Limitada\b/gi, "")
    .replace(/\bOferta\b/gi, "")
    .replace(/\bPromo[cÃ§][aÃ£]o\b/gi, "")
    .replace(/\bOriginal\b/gi, "")
    .replace(/\bProte[cç][aã]o Tendinit\w*\b/gi, "")
    .replace(/\bFisioterapia\b/gi, "")
    .replace(/\bMais Pegada E Menos Suor\b/gi, "")
    .replace(/\bProte[cç][aã]o Contra Calos\b/gi, "")
    .replace(/\bAnti Calo\b/gi, "")
    .replace(/\bNao Se Aplica\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:])/g, "$1")
    .trim();
  if (title.length <= 92) return title;
  title = title.slice(0, 92);
  return title.replace(/\s+\S*$/, "").replace(/[,:;/-]+$/, "").trim();
}

function detectSubcategory(title) {
  const text = normalize(title);
  if (/halter|anilha|barra|kettlebell|musculacao|puxador|strap|cinturao/.test(text)) return "Musculacao";
  if (/elast|mini band|extensor|funcional|caneleira|tornozeleira|munhequeira|luva|cotoveleira/.test(text)) return "Treino funcional";
  if (/pilates|yoga|colchonete|tapete|tatame|anel|arco/.test(text)) return "Yoga, Pilates e mobilidade";
  if (/bicicleta|spinning|corda de pular|jump|abdominal|corrida|caminhada/.test(text)) return "Cardio e corrida";
  if (/camisa|camiseta|bermuda|short|legging|top|conjunto|tenis/.test(text)) return "Vestuario fitness";
  if (/garrafa|squeeze|coqueteleira|copo/.test(text)) return "Hidratacao";
  if (/bolsa|lancheira|mochila|pochete|mala|necessaire/.test(text)) return "Bolsas e organizacao";
  return "Acessorios de academia";
}

function readVerifiedShopee() {
  return parseTsv(files.shopeeSelection).map((item) => ({
    platform: "shopee",
    id: item.item_id,
    title: item.titulo,
    productUrl: item.url_publica,
    affiliateLink: item.link_afiliado,
    image: item.imagem,
    rating: item.avaliacao,
    reviewCount: "",
    sold: cleanText(item.vendas).replace(/\s+vendas$/i, ""),
    commissionRate: item.comissao_percentual,
    priceText: item.preco,
    purchaseSignal: `${item.vendas} na Shopee`,
  }));
}

function detectBrand(title, platform) {
  const brands = [
    "BlenderBottle", "Dark Lab", "Dux", "Kappa", "Laizen", "Lupo", "Muvin",
    "Odin Fit", "Olimp", "Reativo", "Selene", "Songmics", "Vollo", "Won",
  ];
  const text = normalize(title);
  return brands.find((brand) => text.includes(normalize(brand))) || platformRules[platform].label;
}

function formatPrice(value) {
  const text = cleanText(value).replace(/\u00a0/g, " ");
  if (!/^R\$\s?\d/.test(text)) return "";
  return text.replace(/^R\$\s*/, "R$ ");
}

function mergeMetadata(rows) {
  const mlMetadata = new Map(parseTsv(files.mlMetadata).map((item) => [item.affiliateLink, item]));
  return rows.map((item) => {
    const metadata = item.platform === "mercado-livre" ? mlMetadata.get(item.affiliateLink) : null;
    return {
      ...item,
      image: item.image || metadata?.image || "",
      priceText: item.priceText || metadata?.priceText || "",
      rating: number(item.rating),
      reviewCount: number(item.reviewCount),
      commissionRate: number(item.commissionRate),
    };
  });
}

function validateSelection(items) {
  const errors = [];
  const counts = Object.fromEntries(Object.keys(platformRules).map((platform) => [
    platform,
    items.filter((item) => item.platform === platform).length,
  ]));
  if (items.length !== 100) errors.push(`Total incompleto: ${items.length}/100.`);

  for (const [platform, rule] of Object.entries(platformRules)) {
    if (counts[platform] !== rule.count) {
      errors.push(`${rule.label}: ${counts[platform]}/${rule.count} produtos.`);
    }
  }

  const affiliateLinks = new Set();
  const productKeys = new Set();
  for (const [index, item] of items.entries()) {
    const rule = platformRules[item.platform];
    if (!rule) {
      errors.push(`Linha ${index + 2}: plataforma desconhecida: ${item.platform}.`);
      continue;
    }
    if (!item.title || !/^https:\/\//i.test(item.productUrl)) errors.push(`${rule.label}: produto sem titulo ou URL-fonte.`);
    if (!rule.affiliate.test(item.affiliateLink)) errors.push(`${rule.label}: link afiliado invalido: ${item.affiliateLink}`);
    if (affiliateLinks.has(item.affiliateLink)) errors.push(`Link afiliado duplicado: ${item.affiliateLink}`);
    affiliateLinks.add(item.affiliateLink);
    const productKey = item.platform === "amazon" ? item.id.toUpperCase() : item.productUrl.replace(/[?#].*$/, "");
    if (!productKey || productKeys.has(productKey)) errors.push(`Produto duplicado ou sem identificador: ${item.title}`);
    productKeys.add(productKey);
    if (item.rating < 4.5) errors.push(`${rule.label}: avaliacao abaixo de 4.5: ${item.title}`);
    if (item.commissionRate < rule.minCommission) {
      errors.push(`${rule.label}: comissao ${item.commissionRate}% abaixo do minimo ${rule.minCommission}%: ${item.title}`);
    }
    if (!/^https:\/\//i.test(item.image)) errors.push(`${rule.label}: imagem ausente: ${item.title}`);
    if (!formatPrice(item.priceText)) errors.push(`${rule.label}: preco ausente: ${item.title}`);
    if (item.platform === "amazon") {
      if (!/^[A-Z0-9]{10}$/.test(item.id)) errors.push(`Amazon: ASIN invalido: ${item.id}`);
      if (item.reviewCount < 50) errors.push(`Amazon: menos de 50 avaliacoes: ${item.title}`);
    }
    if (item.platform === "mercado-livre" && !item.sold) errors.push(`Mercado Livre: volume vendido ausente: ${item.title}`);
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
  return shortHash(item.affiliateLink, 12);
}

function makeProduct(item, image, index) {
  const rule = platformRules[item.platform];
  const title = commercialTitle(item.title);
  const slug = slugify(title) || platformId(item);
  const id = `${importPrefix}${item.platform}-${platformId(item)}`;
  const price = formatPrice(item.priceText);
  const subcategory = detectSubcategory(title);
  const brand = detectBrand(title, item.platform);
  const rating = number(item.rating);
  const commission = number(item.commissionRate);
  const sourceLabel = rule.label;
  const interest = item.reviewCount
    ? `${item.reviewCount.toLocaleString("pt-BR")} avaliacoes`
    : item.sold
      ? `${item.sold} vendidos`
      : "boa avaliacao na plataforma";
  const summary = `${title}. Selecionado na ${sourceLabel} com nota ${rating.toFixed(1)} e ${interest}.`;
  const details = `Confira tamanho, material, variacoes, preco, frete, estoque e condicoes diretamente na ${sourceLabel} antes da compra.`;
  const affiliateLink = item.affiliateLink;
  const badge = `${rating.toFixed(1)} estrelas`;

  return {
    id,
    storeId: "impacto-sport",
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
    category: "Esporte e Fitness",
    categoria: "Esporte e Fitness",
    subcategoria: subcategory,
    badge,
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
    tipoLink: item.platform === "amazon" ? "amazon_associados" : item.platform === "mercado-livre" ? "meli_la_afiliados" : "shopee_shortlink_afiliados",
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
    publicarNaHome: index < 30,
    destaqueHome: index < 12,
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
      posicaoCuradoria: index + 1,
    },
    marketplace: {
      platform: sourceLabel,
      affiliateUrl: affiliateLink,
      sourceUrl: item.productUrl,
      rating,
      reviewCount: item.reviewCount || "",
      sold: item.sold || "",
      commissionRate: commission,
      priceSeen: price,
      selectedOrder: index + 1,
      curatedAt: today,
    },
    googleAdsRevisao: {
      adequadoPrimeiraDivulgacao: true,
      motivo: "Produto fisico comum do nicho fitness, sem suplemento e sem promessa de resultado.",
      cuidados: [
        "Nao prometer emagrecimento, cura, prevencao de lesao ou desempenho garantido.",
        "Nao anunciar preco fixo sem confirmar na plataforma.",
        "Conferir disponibilidade, frete e variacoes antes da divulgacao.",
      ],
    },
    observacoesInternas: `Curadoria academia ${today}: nota, comissao, link e imagem verificados antes da publicacao.`,
    textoWhatsApp: `Oferta ${sourceLabel} no IMPACTO 360\n\n${title}\n${price} | nota ${rating.toFixed(1)}\n\n${affiliateLink}`,
    legendaWhatsApp: `Oferta ${sourceLabel} no IMPACTO 360\n\n${title}\n${price} | nota ${rating.toFixed(1)}\n\n${affiliateLink}`,
    legendaInstagram: `${title}\n\nNota ${rating.toFixed(1)} | ${price}. Confira condicoes no link da loja.\n\n#Impacto360 #Academia #Fitness`,
    legendaFacebook: `${title} - nota ${rating.toFixed(1)} - ${price}. Oferta selecionada: ${affiliateLink}`,
    hashtags: ["#Impacto360", "#Academia", "#Fitness", "#Treino", `#${sourceLabel.replace(/\s+/g, "")}`],
  };
}

function ensureStore(stores) {
  const store = stores.find((item) => item.id === "impacto-sport");
  if (!store) throw new Error("Loja impacto-sport nao encontrada.");
  const additions = [
    "Academia em casa",
    "Musculacao",
    "Treino funcional",
    "Yoga e Pilates",
    "Cardio e corrida",
    "Vestuario fitness",
    "Acessorios de treino",
    "Hidratacao",
    "Amazon academia",
    "Mercado Livre academia",
    "Shopee academia",
  ];
  store.subcategories = Array.from(new Set([...(store.subcategories || []), ...additions]));
  store.section = "Academia, treino e vida ativa";
  store.description = "Equipamentos, acessorios, vestuario e itens para academia com curadoria por avaliacao e comissao.";
  return stores;
}

function scoreProduct(product) {
  const sold = String(product.vendidos || "").toLowerCase();
  const soldScore = (Number.parseFloat(sold.replace(",", ".")) || 0) * (sold.includes("mil") ? 1000 : 1);
  return product.rating * 100000 + product.commissionRate * 1000 + Number(product.reviewCount || 0) + soldScore;
}

function balancedHighlights(products, perPlatform) {
  const selected = [];
  for (const source of ["Amazon", "Mercado Livre", "Shopee"]) {
    selected.push(
      ...products
        .filter((product) => product.source === source)
        .sort((a, b) => scoreProduct(b) - scoreProduct(a))
        .slice(0, perPlatform)
    );
  }
  return selected.sort((a, b) => scoreProduct(b) - scoreProduct(a));
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
  const highlights = balancedHighlights(products, 4);
  const existingBanners = (Array.isArray(data.banners) ? data.banners : [])
    .filter((item) => item.rotationGroup !== rotationGroup && !String(item.id || "").includes(importPrefix))
    .map((item) => ({ ...item, order: Number(item.order || 0) + highlights.length }));
  const existingAds = (Array.isArray(data.ads) ? data.ads : [])
    .filter((item) => item.rotationGroup !== rotationGroup && !String(item.id || "").includes(importPrefix))
    .map((item) => ({ ...item, priority: Number(item.priority || 0) + products.length }));
  data.banners = [...highlights.map(makeBanner), ...existingBanners];
  data.ads = [...products.map(makeAd), ...existingAds];
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
  const backupDir = path.join(root, "backups", `${stamp}-pre-importacao-academia-100`);
  const relativeFiles = [
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
  for (const file of [files.selection, files.mlMetadata, files.shopeeSelection, files.reportJson, files.reportMarkdown, files.importedProducts]) {
    if (!fs.existsSync(file)) continue;
    const relative = path.relative(root, file);
    const target = path.join(packageDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
}

function makeReport(report) {
  const lines = [
    `# Relatorio de importacao - 100 produtos de academia - ${today}`,
    "",
    `Backup: ${path.relative(root, report.backupDir).replace(/\\/g, "/")}`,
    "",
    "## Totais publicados",
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
    "- Links oficiais de afiliado verificados antes da importacao.",
    "- Imagens reais dos anuncios armazenadas localmente.",
    "- Sem suplementos e sem promessas de emagrecimento, cura ou desempenho garantido.",
    "",
    "## Produtos",
    "",
    ...report.products.map((product, index) => (
      `${index + 1}. ${product.source} - ${product.title} - ${product.price} - nota ${product.rating.toFixed(1)} - comissao ${product.commissionRate}%`
    )),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

const selection = mergeMetadata([...parseTsv(files.selection), ...readVerifiedShopee()]);
const validation = validateSelection(selection);
if (validateOnly || !validation.ok) {
  console.log(JSON.stringify({
    ready: validation.ok,
    total: selection.length,
    counts: validation.counts,
    errors: validation.errors,
  }, null, 2));
  if (!validation.ok) process.exitCode = 2;
} else {
  const currentProducts = readJson(files.products, []);
  const currentStores = ensureStore(readJson(files.stores, []));
  if (!Array.isArray(currentProducts) || !Array.isArray(currentStores)) {
    throw new Error("Catalogo principal invalido.");
  }

  const images = await mapLimit(selection, 6, async (item) => {
    const id = `${importPrefix}${item.platform}-${platformId(item)}`;
    return downloadImage(item, id);
  });

  const importedProducts = selection.map((item, index) => makeProduct(item, images[index], index));
  const importedIds = new Set(importedProducts.map((product) => product.id));
  if (importedIds.size !== 100) throw new Error(`IDs unicos invalidos: ${importedIds.size}/100.`);
  if (importedProducts.some((product) => !fs.existsSync(path.join(root, product.image)))) {
    throw new Error("Uma ou mais imagens locais nao foram gravadas.");
  }

  const backupDir = backupFiles();
  const nextProducts = [
    ...importedProducts,
    ...currentProducts.filter((product) => !String(product.id || "").startsWith(importPrefix)),
  ];
  const bannerStats = updateBanners(importedProducts);
  syncData(nextProducts, currentStores, bannerStats.data);
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
      mercadoLivreCommission: 16,
      shopeeCommission: 8,
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
  fs.writeFileSync(files.reportMarkdown, makeReport({ ...report, products: importedProducts }), "utf8");
  fs.appendFileSync(files.mainReport, [
    "",
    `## Importacao de 100 produtos de academia - ${today}`,
    "",
    `- Amazon: ${validation.counts.amazon}`,
    `- Mercado Livre: ${validation.counts["mercado-livre"]}`,
    `- Shopee: ${validation.counts.shopee}`,
    "- Nota minima: 4,5.",
    "- Links, comissoes, precos e imagens verificados antes da publicacao.",
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
