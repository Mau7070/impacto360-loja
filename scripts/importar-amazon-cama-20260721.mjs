import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const today = "2026-07-21";
const affiliateTag = "910556142-20";
const importPrefix = "amazon-cama-20260721-";
const rotationGroup = "amazon-cama-quarto-20260721";

const files = {
  selection: path.join(root, "dados", "amazon-cama-selecao-20260721.json"),
  mlCandidates: path.join(root, "dados", "mercado-livre-cama-candidatos-publicos-20260721.json"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  reportJson: path.join(root, "dados", "relatorio-importacao-cama-quarto-20260721.json"),
  reportMarkdown: path.join(root, "dados", "relatorio-importacao-cama-quarto-20260721.md"),
  pendingJson: path.join(root, "dados", "pendencias-afiliados-cama-quarto-20260721.json"),
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

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 82);
}

function compactTitle(value) {
  const title = String(value || "").replace(/\s+/g, " ").trim();
  return title.length > 118 ? `${title.slice(0, 115).trim()}...` : title;
}

function endVariant(value) {
  const title = String(value || "").replace(/\s+/g, " ").trim();
  return title.match(/\(([^()]{2,42})\)\s*$/)?.[1]
    || title.match(/\s-\s([^-,|]{2,42})$/)?.[1]
    || "";
}

function commercialTitle(item, index) {
  const raw = String(item.title || "").replace(/\s+/g, " ").trim();
  const asin = String(item.asin || "").trim().toUpperCase();
  const text = normalize(raw);
  const variant = endVariant(raw).split(",")[0].trim();
  const suffix = variant ? ` - ${variant}` : "";

  if (asin === "B09G9BZ2LF") return "Protetor de Colchao Queen Fibrasca O Silencioso";
  if (asin === "B0F9GXLZB2") return "Kit Colcha Bouti Queen Teka - Modelo A";
  if (asin === "B0F9HJRMLW") return "Kit Colcha Bouti Queen Teka - Modelo B";
  if (asin === "B0F7MNR3MM") return "Kit Cobre Leito Queen MontBlanc Chumbo";
  if (asin === "B0GTQQ16QS") return "Kit 2 Mantas Fleece Soft Touch Casal Cinza";
  if (asin === "B0GZ8B9HLX") return "Protetor de Colchao Queen Altenburg Impermeavel";
  if (asin === "B0GY55P21K") return "Lencol Queen Lyor Saphira Rosa";
  if (asin === "B0GY59RH6X") return "Jogo de Cama Casal Lyor Serenata";
  if (asin === "B0GY5KCJ36") return "Jogo de Cama Queen Lyor Serenata";
  if (asin === "B0DLZGFYSJ") return "Coberdrom Edredom King Sherpa - Cinza";
  if (asin === "B0DLZW1J9F") return "Coberdrom Edredom King Sherpa - Bege";
  if (asin === "B0GD91X917") return "Kit Cobre Leito Queen Casa Dona - Floral Rosa";
  if (asin === "B0CC6C8VCX") return "Kit 4 Fronhas Percal 200 Fios - Cinza";
  if (asin === "B09QL7RY44") return "Kit 6 Fronhas Percal 200 Fios - Branco";

  if (/jogo de cama queen percal 400 fios/.test(text)) return `Jogo de Cama Queen 400 Fios${suffix}`;
  if (/jogo de cama casal percal 400 fios/.test(text)) return `Jogo de Cama Casal 400 Fios${suffix}`;
  if (/cobre leito colcha casal queen.*bulet/.test(text)) return `Cobre Leito Queen Bulet${suffix}`;
  if (/kit colcha bouti queen.*teka/.test(text)) return `Kit Colcha Bouti Queen Teka - Modelo ${index + 1}`;
  if (/kit cobre leito colcha boutis/.test(text)) return `Kit Cobre Leito Boutis Queen${suffix}`;
  if (/cobertor king corttex lumini/.test(text)) return `Cobertor King Corttex Lumini${suffix}`;
  if (/capa de colchao impermeavel matelado/.test(text)) return `Capa de Colchao Impermeavel Matelada${suffix}`;
  if (/kit 2 mantinha fleece/.test(text)) return `Kit 2 Mantas Fleece Soft Touch${suffix}`;
  if (/jogo de cama hotel motel pousada airbnb/.test(text)) return "Jogo de Cama Hotel Teka Profiline Queen";
  if (/cobertor casal queen grosso fofao/.test(text)) return `Cobertor Queen Fofao Sherpa${suffix}`;
  if (/protetor de colchao queen altenburg sono saude/.test(text)) return "Protetor de Colchao Queen Altenburg Sono Saude";
  if (/manta casal cobertor microfibra/.test(text)) return "Manta Casal Microfibra Toque de Seda";
  if (/protetor de colchao queen impermeavel tecido jacquard/.test(text)) return "Protetor de Colchao Queen Jacquard Impermeavel";
  if (/edredom roma/.test(text)) return `Edredom Roma Micropercal${suffix}`;
  if (/jogo de lencol queen karsten/.test(text)) return `Jogo de Lencol Queen Karsten${suffix}`;
  if (/jogo de lencol cama casal/.test(text)) return "Jogo de Lencol Casal Algodao Cozzilar";

  const compact = compactTitle(raw)
    .replace(/,?\s*Anti[aá]caro,?\s*/gi, " ")
    .replace(/,?\s*Anti-pilling,?\s*/gi, " ")
    .replace(/\s+com\s+Toque\s+Macio/gi, "")
    .replace(/\s+Tamanhos\s+Solteiro,\s*Casal,\s*Queen\s+e\s+King/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return compact.length > 74 ? compact.slice(0, 71).trim() : compact;
}

function cleanPrice(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function parseRating(value) {
  const number = Number(String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0] || 0);
  return Number.isFinite(number) ? number : 0;
}

function imageExtension(contentType, url) {
  if (/webp/i.test(contentType)) return ".webp";
  if (/png/i.test(contentType)) return ".png";
  if (/jpe?g/i.test(contentType)) return ".jpg";
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return [".webp", ".png", ".jpg", ".jpeg"].includes(ext) ? ext : ".jpg";
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function backupFiles() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  const backupDir = path.join(root, "backups", `${stamp}-pre-importacao-cama-quarto`);
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
  if (!/^https:\/\/m\.media-amazon\.com\//i.test(url)) {
    throw new Error(`Imagem Amazon invalida para ${item.asin}: ${url}`);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem ${item.asin}: HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!/^image\//i.test(contentType)) {
    throw new Error(`Conteudo de imagem invalido para ${item.asin}: ${contentType}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) {
    throw new Error(`Imagem pequena demais para ${item.asin}: ${bytes.length} bytes`);
  }
  const ext = imageExtension(contentType, url);
  const filename = `${productId}${ext}`;
  const relative = path.posix.join("public", "images", "anuncios", "amazon-cama-20260721", filename);
  for (const base of [root, packageDir]) {
    const target = path.join(base, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return relative;
}

function detectSubcategory(title) {
  const text = normalize(title);
  if (/protetor|capa de colchao/.test(text)) return "Protetores de colchao";
  if (/edredom|coberdrom|cobertor|manta/.test(text)) return "Cobertores e edredons";
  if (/colcha|cobre leito|bouti|boutis/.test(text)) return "Colchas e cobre-leitos";
  if (/fronha|travesseiro/.test(text)) return "Fronhas e travesseiros";
  if (/lencol|jogo de cama|roupa de cama/.test(text)) return "Jogos de cama e lencois";
  return "Cama e quarto";
}

function detectBrand(title) {
  const brands = [
    "Kacyumara",
    "Fibrasca",
    "Teka",
    "Bulet",
    "Wolff",
    "Altenburg",
    "Buddemeyer",
    "Lyor",
    "Karsten",
    "Corttex",
    "Casa Dona",
    "Cozzilar",
  ];
  const text = normalize(title);
  return brands.find((brand) => text.includes(normalize(brand))) || "Amazon Brasil";
}

function makeProduct(item, image, index) {
  const asin = String(item.asin || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) throw new Error(`ASIN invalido: ${asin}`);
  const title = commercialTitle(item, index);
  const slug = slugify(title) || asin.toLowerCase();
  const id = `${importPrefix}${slug}-${asin.toLowerCase()}`;
  const rating = parseRating(item.rating || item.ratingText);
  const price = cleanPrice(item.priceText);
  const sourceUrl = `https://www.amazon.com.br/dp/${asin}/`;
  const affiliateUrl = `https://www.amazon.com.br/dp/${asin}/?tag=${affiliateTag}`;
  const subcategory = detectSubcategory(title);
  const brand = detectBrand(title);
  const summary = `${title}. Produto de cama e quarto selecionado na Amazon Brasil com avaliacao ${rating.toFixed(1)}.`;
  const details = "Confira medidas, cor, composicao, frete, estoque e garantia diretamente na Amazon antes da compra.";
  const order = String(index + 1).padStart(2, "0");

  return {
    id,
    storeId: "impacto-casa",
    name: title,
    nome: title,
    title,
    slug,
    brand,
    marca: brand,
    creator: "Amazon Brasil",
    produtor: "Amazon Brasil",
    description: summary,
    descricaoCurta: summary,
    fullDescription: `${summary} ${details}`,
    descricaoDetalhada: `${summary} ${details}`,
    descricaoCompleta: `${summary} ${details}`,
    textoCatalogo: `${title} - ${price} - avaliacao ${rating.toFixed(1)} na Amazon Brasil.`,
    price,
    preco: price,
    precoPromocional: price,
    precoAnterior: null,
    parcelas: "",
    frete: "Conferir frete na Amazon",
    disponibilidade: "Conferir disponibilidade na Amazon",
    image,
    imagemPrincipal: image,
    fotoPrincipal: image,
    imagem: image,
    galeria: [image],
    fotosExtras: [image],
    fonteMidia: "Amazon Brasil - imagem publica do resultado de busca",
    category: "Casa, Cama e Banho",
    categoria: "Casa, Cama e Banho",
    subcategoria: subcategory,
    badge: "Amazon",
    buttonLabel: "Ver oferta",
    actionType: "buy",
    affiliateLink: affiliateUrl,
    linkAfiliado: affiliateUrl,
    linkComissionado: affiliateUrl,
    linkCompra: affiliateUrl,
    linkPlataforma: affiliateUrl,
    urlProduto: affiliateUrl,
    linkOriginal: affiliateUrl,
    linkPrincipalFonte: sourceUrl,
    linkProdutoApenasLeitura: sourceUrl,
    sourceProductLink: sourceUrl,
    linkResolvidoApenasLeitura: affiliateUrl,
    tipoLink: "amazon_associados",
    linkStatus: `link de afiliado Amazon confirmado com StoreID ${affiliateTag}`,
    statusLink: "confirmado",
    statusImagem: "foto real baixada da Amazon Brasil",
    source: "Amazon",
    origem: "Amazon Associados",
    plataformaOrigem: "Amazon",
    status: "ativo",
    statusAnuncio: "ativo",
    aprovadoParaPublicacao: true,
    publicar: true,
    publicarNaHome: index < 24,
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
    beneficios: [
      `Avaliacao vista na Amazon: ${rating.toFixed(1)} de 5.`,
      "Foto real preservada no acervo da loja.",
      "Link de compra usa tag Amazon Associados da Impacto360.",
    ],
    specs: {
      asin,
      consultaAmazon: item.query || "",
      precoVistoAmazon: price,
      avaliacaoVistaAmazon: rating,
      afiliadoAmazon: affiliateTag,
      posicaoCuradoria: order,
    },
    ofertas: {
      fonte: "Amazon Brasil",
      asin,
      precoVistoAmazon: price,
      avaliacaoVistaAmazon: rating,
      consulta: item.query || "",
      coletadoEm: today,
    },
    amazon: {
      asin,
      affiliateTag,
      affiliateUrl,
      sourceUrl,
      query: item.query || "",
      rating,
      priceSeen: price,
      bestSellerBadgeVisible: Boolean(item.bestSeller),
      primeBadgeVisible: Boolean(item.prime),
    },
    observacoesInternas: [
      "Importacao Amazon Cama e Quarto 2026-07-21.",
      "Produto selecionado em busca publica Amazon Brasil.",
      "Mercado Livre e Shopee nao foram publicados sem shortlink oficial de afiliado.",
    ],
    textoWhatsApp: `Oferta Amazon no IMPACTO 360 AFILIADO\n\n${title}\n${price}\nAvaliacao: ${rating.toFixed(1)}\n\n${affiliateUrl}`,
    legendaWhatsApp: `Oferta Amazon no IMPACTO 360 AFILIADO\n\n${title}\n${price}\nAvaliacao: ${rating.toFixed(1)}\n\n${affiliateUrl}`,
    legendaInstagram: `${title}\n\n${price} | avaliacao ${rating.toFixed(1)} na Amazon. Confira no link da loja. #Impacto360 #Amazon #CamaEBanho`,
    legendaFacebook: `${title} - ${price}. Oferta Amazon selecionada pela Impacto360 Afiliado: ${affiliateUrl}`,
    hashtags: ["#Impacto360", "#Amazon", "#CamaEBanho", "#Quarto", "#Oferta"],
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
    description: `${product.price} | ${Number(product.rating).toFixed(1)} estrelas na Amazon.`,
    link: product.linkCompra,
    active: true,
    order: index + 1,
    source: "Amazon Associados",
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
    description: `${product.price} | avaliacao ${Number(product.rating).toFixed(1)} na Amazon.`,
    buttonLabel: "Ver oferta",
    link: product.linkCompra,
    startDate: today,
    endDate: "",
    active: true,
    source: "Amazon Associados",
    category: product.subcategoria,
    rotationGroup,
    curatedAt: today,
  };
}

function updateBanners(products) {
  const data = readJson(files.banners, { settings: {}, banners: [], ads: [] });
  const existingBanners = (Array.isArray(data.banners) ? data.banners : [])
    .filter((item) => !String(item.id || "").startsWith(`banner-${importPrefix}`))
    .map((item) => ({ ...item, order: Number(item.order || 0) + 12 }));
  const existingAds = (Array.isArray(data.ads) ? data.ads : [])
    .filter((item) => !String(item.id || "").startsWith(`ad-${importPrefix}`))
    .map((item) => ({ ...item, priority: Number(item.priority || 0) + products.length }));
  data.banners = [
    ...products.slice(0, 12).map(makeBanner),
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
  return { banners: products.slice(0, 12).length, ads: products.length };
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

function syncAuxiliaryFiles() {
  for (const file of [files.selection, files.mlCandidates, files.reportJson, files.reportMarkdown, files.pendingJson]) {
    if (!fs.existsSync(file)) continue;
    const relative = path.relative(root, file);
    const target = path.join(packageDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
}

function validateProducts(products) {
  const errors = [];
  const ids = new Set();
  for (const product of products) {
    if (ids.has(product.id)) errors.push(`ID duplicado: ${product.id}`);
    ids.add(product.id);
    if (!product.linkCompra.includes(`tag=${affiliateTag}`)) errors.push(`Link Amazon sem tag: ${product.id}`);
    if (!fs.existsSync(path.join(root, product.image))) errors.push(`Imagem local ausente: ${product.id}`);
    if (parseRating(product.rating) < 4.2) errors.push(`Avaliacao baixa: ${product.id}`);
    if (!/^R\$\s?\d/.test(product.price)) errors.push(`Preco invalido: ${product.id}`);
    if (product.status !== "ativo" || product.aprovadoParaPublicacao !== true) errors.push(`Produto nao ativo: ${product.id}`);
  }
  return errors;
}

function checkpoint(products, count) {
  const slice = products.slice(0, count);
  const errors = validateProducts(slice);
  return {
    importedUntil: count,
    checkedProducts: slice.length,
    ok: errors.length === 0,
    errors,
  };
}

function writeReports({ backupDir, products, bannerCounts, originalCount, finalCount, mlCandidates }) {
  const checkpoints = [20, 40, 50].map((count) => checkpoint(products, count));
  const pending = {
    generatedAt: new Date().toISOString(),
    requested: {
      amazon: 50,
      mercadoLivre: 50,
      shopee: 50,
    },
    published: {
      amazon: products.length,
      mercadoLivre: 0,
      shopee: 0,
    },
    mercadoLivre: {
      status: "pendente_link_afiliado_oficial",
      reason: "Foram encontrados 50 candidatos publicos, mas os links visiveis nao sao meli.la gerados no painel de afiliados da loja.",
      requiredAction: "Gerar ou exportar 50 links oficiais meli.la para estes produtos antes de publicar.",
      candidateFile: "dados/mercado-livre-cama-candidatos-publicos-20260721.json",
      candidateCount: mlCandidates.length,
    },
    shopee: {
      status: "pendente_login_ou_shortlink_oficial",
      reason: "A busca da Shopee redirecionou para verificacao/login e o painel de afiliados tambem pede login para gerar links.",
      requiredAction: "Entrar no painel Shopee Afiliados e gerar/exportar shortlinks oficiais s.shopee.com.br.",
    },
  };
  writeJson(files.pendingJson, pending);

  const report = {
    generatedAt: new Date().toISOString(),
    date: today,
    backupDir,
    rotationGroup,
    affiliateTag,
    source: "Amazon Brasil / Amazon Associados",
    productsBefore: originalCount,
    productsAfter: finalCount,
    importedAmazonProducts: products.length,
    bannerCounts,
    checkpoints,
    pending,
    products: products.map((product) => ({
      id: product.id,
      asin: product.amazon.asin,
      title: product.name,
      price: product.price,
      rating: product.rating,
      storeId: product.storeId,
      subcategory: product.subcategoria,
      link: product.linkCompra,
      image: product.image,
      directPageExpected: `/produto/${slugify(product.name)}/`,
    })),
    validations: {
      errors: validateProducts(products),
      activeWithoutImage: products.filter((product) => !fs.existsSync(path.join(root, product.image))).length,
      activeWithoutAffiliateTag: products.filter((product) => !String(product.linkCompra).includes(`tag=${affiliateTag}`)).length,
      lowRating: products.filter((product) => Number(product.rating) < 4.2).length,
    },
  };
  writeJson(files.reportJson, report);

  const lines = [
    "# Relatorio Amazon Cama e Quarto 2026-07-21",
    "",
    `- Backup criado: \`${path.relative(root, backupDir)}\`.`,
    `- Produtos Amazon publicados: ${products.length}.`,
    `- Banners do topo adicionados ao rodizio: ${bannerCounts.banners}.`,
    `- Anuncios adicionados ao painel rotatorio: ${bannerCounts.ads}.`,
    `- StoreID/tag Amazon usada: \`${affiliateTag}\`.`,
    "- Mercado Livre: 50 candidatos coletados, mas nao publicados sem shortlink oficial `meli.la`.",
    "- Shopee: nao publicado; site/painel exigiu login para gerar shortlink oficial.",
    "",
    "## Conferencias a cada etapa",
    "",
    ...checkpoints.map((item) => `- ${item.importedUntil} produtos: ${item.ok ? "OK" : `falhas: ${item.errors.join("; ")}`}`),
    "",
    "## Produtos Amazon publicados",
    "",
    ...products.map((product, index) => `${index + 1}. ${product.name} | ${product.price} | avaliacao ${Number(product.rating).toFixed(1)} | ${product.linkCompra}`),
    "",
    "## Pendencias protegidas",
    "",
    "- Mercado Livre e Shopee nao foram publicados com link publico para nao perder rastreamento de comissao.",
    "- Para concluir os 100 itens restantes, forneca/exporte os links oficiais `meli.la` e `s.shopee.com.br` dos produtos selecionados.",
  ];
  fs.writeFileSync(files.reportMarkdown, `${lines.join("\n")}\n`, "utf8");

  const append = [
    "",
    "## Importacao Amazon Cama e Quarto - 2026-07-21",
    "",
    "- Corrigido o pedido de importacao com seguranca: 50 produtos Amazon de cama/quarto foram publicados com foto local, preco, avaliacao e link Amazon Associados.",
    `- Tag Amazon usada nos links: \`${affiliateTag}\`.`,
    `- Rodizio atualizado: ${bannerCounts.banners} banners e ${bannerCounts.ads} anuncios no grupo \`${rotationGroup}\`.`,
    "- Mercado Livre: 50 candidatos publicos foram coletados, mas ficaram pendentes porque nao havia link oficial `meli.la` da conta.",
    "- Shopee: ficou pendente porque a pagina de busca e o painel de afiliados pediram login/verificacao para gerar shortlinks oficiais.",
    `- Relatorio tecnico: \`dados/relatorio-importacao-cama-quarto-20260721.md\`.`,
  ].join("\n");
  const current = fs.existsSync(files.mainReport) ? fs.readFileSync(files.mainReport, "utf8") : "# RELATORIO DE MELHORIAS IMPACTO360\n";
  const withoutOld = current.replace(/\n## Importacao Amazon Cama e Quarto - 2026-07-21[\s\S]*?(?=\n## |\s*$)/, "");
  fs.writeFileSync(files.mainReport, `${withoutOld.trimEnd()}${append}\n`, "utf8");
  return report;
}

const selection = readJson(files.selection);
if (!selection || selection.affiliateTag !== affiliateTag) {
  throw new Error("Selecao Amazon ausente ou tag divergente.");
}
const selected = uniqueBy(selection.products || [], (item) => String(item.asin || "").toUpperCase()).slice(0, 50);
if (selected.length !== 50) {
  throw new Error(`Esperados 50 produtos Amazon; encontrados ${selected.length}.`);
}

const backupDir = backupFiles();
const originalProducts = readJson(files.products, []);
const stores = ensureStore(readJson(files.stores, []));
const products = [];
for (const [index, item] of selected.entries()) {
  const title = commercialTitle(item, index);
  const productId = `${importPrefix}${slugify(title) || item.asin.toLowerCase()}-${String(item.asin).toLowerCase()}`;
  const image = await downloadImage(item, productId);
  products.push(makeProduct(item, image, index));
}
const validationErrors = validateProducts(products);
if (validationErrors.length) {
  throw new Error(`Validacao falhou:\n${validationErrors.join("\n")}`);
}

const nextProducts = [
  ...products,
  ...originalProducts.filter((product) => !String(product.id || "").startsWith(importPrefix)),
];
writeJson(files.products, nextProducts);
writeJson(files.stores, stores);
const bannerCounts = updateBanners(products);
syncPackageAndHtml(nextProducts, stores);

const mlCandidates = readJson(files.mlCandidates, { products: [] })?.products || [];
const report = writeReports({
  backupDir,
  products,
  bannerCounts,
  originalCount: originalProducts.length,
  finalCount: nextProducts.length,
  mlCandidates,
});
syncAuxiliaryFiles();

console.log(`Amazon cama/quarto publicado: ${products.length} produtos.`);
console.log(`Rodizio: ${bannerCounts.banners} banners e ${bannerCounts.ads} anuncios.`);
console.log(`Pendencias protegidas ML/Shopee: ${report.pending.mercadoLivre.candidateCount} candidatos ML, Shopee aguardando login/shortlink.`);
console.log(`Backup: ${path.relative(root, backupDir)}`);
console.log(`Relatorio: ${path.relative(root, files.reportMarkdown)}`);
