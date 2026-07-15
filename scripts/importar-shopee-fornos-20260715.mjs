import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const now = "2026-07-15T12:16:00-03:00";
const today = "2026-07-15";
const importTag = "shopee-fornos-bancada-2026-07-15";
const backupBeforeImport = "backups/2026-07-15-1216-pre-shopee-fornos";

const files = {
  source: path.join(root, "importacoes", "originais", "2026-07-15-shopee-fornos", "fornos-bancada-curados.json"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  packageProducts: path.join(packageDir, "dados", "products.json"),
  packageStores: path.join(packageDir, "dados", "stores.json"),
  importedProducts: path.join(root, "dados", "produtos-importados-shopee-fornos-2026-07-15.json"),
  packageImportedProducts: path.join(packageDir, "dados", "produtos-importados-shopee-fornos-2026-07-15.json"),
  report: path.join(root, "dados", "relatorio-shopee-fornos-2026-07-15.json"),
  packageReport: path.join(packageDir, "dados", "relatorio-shopee-fornos-2026-07-15.json"),
};

const ovenMeta = {
  storeId: "impacto-casa",
  category: "Casa e Cozinha",
  subcategoria: "Pequenos eletros",
  departamento: "Fornos de bancada",
  badge: "Shopee forno de bancada",
};

function readJson(file, fallback = undefined) {
  if (!fs.existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Arquivo nao encontrado: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84) || "produto-shopee";
}

function shortHash(value, size = 8) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, size);
}

function cleanTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstLink(product) {
  return String(product?.affiliateLink || product?.linkCompra || product?.linkAfiliado || product?.linkComissionado || "").trim().toLowerCase();
}

function normalizeUrl(value) {
  const url = String(value || "").trim();
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return `https://${url.slice("http://".length)}`;
  return url;
}

function imageExtensionFromUrl(url) {
  const clean = normalizeUrl(url).split("?")[0].toLowerCase();
  const match = clean.match(/\.(webp|png|jpe?g)$/);
  if (!match) return ".jpg";
  return match[1] === "jpeg" ? ".jpg" : `.${match[1]}`;
}

function imageFileFor(item) {
  const source = item.imageSource || item.existingImage || item.href;
  const extension = item.existingImage ? path.extname(item.existingImage) : imageExtensionFromUrl(source);
  return `public/images/anuncios/shopee-fornos-bancada-${slugify(item.title)}-${shortHash(item.href)}${extension}`;
}

async function downloadOrCopyImage(item) {
  if (item.existingImage) {
    const source = path.join(root, item.existingImage);
    if (!fs.existsSync(source)) throw new Error(`Imagem local nao encontrada: ${item.existingImage}`);
    const packageDestination = path.join(packageDir, item.existingImage);
    fs.mkdirSync(path.dirname(packageDestination), { recursive: true });
    fs.copyFileSync(source, packageDestination);
    return item.existingImage;
  }

  const relative = imageFileFor(item);
  const destination = path.join(root, relative);
  const packageDestination = path.join(packageDir, relative);
  if (!fs.existsSync(destination)) {
    const url = normalizeUrl(item.imageSource);
    const response = await fetch(url, {
      headers: {
        "accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
        "user-agent": "Mozilla/5.0 Impacto360 catalog importer",
      },
    });
    if (!response.ok) throw new Error(`Falha ao baixar imagem ${response.status} ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 2000) throw new Error(`Imagem muito pequena ou invalida: ${url}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
  }
  fs.mkdirSync(path.dirname(packageDestination), { recursive: true });
  fs.copyFileSync(destination, packageDestination);
  return relative;
}

function buildDescription(item) {
  const title = cleanTitle(item.title);
  return `${title} foi selecionado na Shopee para a vitrine Casa e Cozinha da Impacto360, na divisao Fornos de bancada. Destaques: ${item.qualityNotes.join("; ")}. Confira preco, estoque, frete, voltagem, prazo, garantia e reputacao do vendedor diretamente na Shopee antes da compra. Este card pode conter link de afiliado.`;
}

function makeProduct(item, image, index) {
  const title = cleanTitle(item.title);
  const link = item.affiliateLink;
  const slug = slugify(title);
  const id = `shopee-20260715-fornos-bancada-${slug}-${shortHash(link)}`;
  const description = buildDescription(item);
  const specs = [
    `Marca: ${item.brand}`,
    `Capacidade: ${item.capacity}`,
    `Voltagem: ${item.voltage}`,
    item.ratingNote,
    ...item.qualityNotes,
    "Conferir preco, estoque, frete, voltagem e garantia na Shopee antes da compra",
    "Shortlink oficial Shopee gerado na conta logada",
  ];
  const socialText = `Oferta Shopee selecionada no IMPACTO 360 AFILIADO\n\n${title}\n${item.price || "Preco na Shopee"}\n\nDivisao: Casa e Cozinha > Fornos de bancada\n\nVer na Shopee:\n${link}\n\nConfira preco, estoque, frete, voltagem e garantia diretamente na Shopee. Este conteudo pode conter link de afiliado.`;

  return {
    id,
    storeId: ovenMeta.storeId,
    name: title,
    nome: title,
    title,
    slug,
    brand: item.brand,
    marca: item.brand,
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    descricaoCompleta: description,
    textoCatalogo: `${title} - ${description}`,
    price: item.price || "Preco na Shopee",
    preco: item.price || "Preco na Shopee",
    precoPromocional: item.price || "Preco na Shopee",
    precoAnterior: "",
    parcelas: "",
    frete: "Conferir frete e prazo na Shopee",
    image,
    imagemPrincipal: image,
    fotoPrincipal: image,
    imagem: image,
    galeria: [image],
    fotosExtras: [image],
    badge: ovenMeta.badge,
    category: ovenMeta.category,
    categoria: ovenMeta.category,
    subcategoria: ovenMeta.subcategoria,
    departamento: ovenMeta.departamento,
    source: "Shopee",
    origem: "Shopee - link oficial gerado no painel de afiliados",
    plataformaOrigem: "Shopee",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: item.existingImage ? "imagem ja existente e revisada no catalogo Impacto360" : "imagem confirmada em pagina publica de referencia do mesmo modelo",
    statusLink: "shortlink_shopee_oficial_confirmado",
    linkStatus: "Shortlink oficial s.shopee.com.br gerado no Link personalizado da conta Shopee",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    destaqueHome: index < 10,
    publicarNaHome: index < 10,
    publicar: true,
    editable: true,
    editavelManual: true,
    editavelPorChatGPT: true,
    actionType: "buy",
    buttonLabel: "Ver na Shopee",
    chamadaCompra: "Ver na Shopee",
    fonteMidia: item.imageSourcePage,
    ultimaRevisao: today,
    atualizadoEm: now,
    publicadoEm: now,
    origemImportacao: importTag,
    disponibilidade: "Oferta ativa na Shopee no momento da curadoria; confirmar condicoes antes da compra.",
    specs,
    beneficios: [
      "Card publicado na loja IMPACTO CASA.",
      "Produto classificado em Casa e Cozinha > Pequenos eletros > Fornos de bancada.",
      "Destino de compra preservado por shortlink oficial da Shopee.",
    ],
    shopee: {
      productUrl: item.href,
      affiliateLink: link,
      sourceQuery: "forno de bancada alta qualidade",
      selectedAt: now,
      ratingNote: item.ratingNote,
      imageSourcePage: item.imageSourcePage,
    },
    googleAdsRevisao: {
      adequadoPrimeiraDivulgacao: true,
      motivo: "Produto de varejo fisico com destino transparente para marketplace e orientacao de confirmar voltagem e condicoes.",
      cuidados: [
        "Nao anunciar preco fixo sem confirmar se continua igual na Shopee.",
        "Nao prometer disponibilidade, frete gratis ou prazo sem confirmar a pagina do vendedor.",
        "Destacar que a voltagem deve ser conferida antes da compra.",
      ],
    },
    textoWhatsApp: socialText,
    legendaWhatsApp: socialText,
    legendaInstagram: `${title}\n\nCasa e Cozinha > Fornos de bancada\n${item.price || "Preco na Shopee"}\n\nConfira voltagem, frete, estoque e garantia na Shopee pelo link oficial.\n\n#Impacto360 #Shopee #Cozinha #FornoEletrico`,
    legendaFacebook: `${title}\n\nCasa e Cozinha > Fornos de bancada\nPreco: ${item.price || "Preco na Shopee"}\n\nAcesse pela Impacto 360 Afiliado: ${link}`,
    hashtags: ["#Impacto360", "#Shopee", "#Cozinha", "#FornoEletrico"],
    observacoesInternas: "Produto importado em 2026-07-15 apos geracao de shortlink oficial no painel Shopee.",
    affiliateLink: link,
    linkAfiliado: link,
    linkCompra: link,
    linkComissionado: link,
    linkPlataforma: link,
    linkOriginal: link,
    linkPrincipalFonte: item.href,
    linkResolvidoApenasLeitura: item.href,
    linkProdutoApenasLeitura: item.href,
    urlProduto: link,
    ofertas: [
      {
        loja: "Shopee",
        preco: item.price || "Preco na Shopee",
        linkCompra: link,
        linkAfiliado: link,
        linkOriginal: item.href,
      },
    ],
  };
}

function ensureStoreSubcategories(stores) {
  return stores.map(store => {
    if (store.id !== ovenMeta.storeId) return store;
    const subcategories = Array.isArray(store.subcategories) ? store.subcategories : [];
    const additions = ["Fornos de bancada", "Fornos eletricos", "Shopee Casa e Cozinha"];
    return {
      ...store,
      subcategories: [...new Set([...subcategories, ...additions])],
    };
  });
}

function looksLikeCountertopOven(product) {
  const text = normalizeText(`${product.title || product.name || product.nome || ""} ${product.description || product.descricaoCurta || ""}`);
  const includesOven = [
    "forno eletrico",
    "forno de bancada",
    "forno de mesa",
    "forno bancada",
    "air fryer oven",
    "fritadeira forno",
  ].some(marker => text.includes(marker));
  const accessory = [
    "puxador",
    "porta do forno",
    "vidro porta",
    "grade ",
    "resistencia",
    "timer ",
    "painel ",
    "capa ",
    "peca ",
    "reposicao",
    "embutir",
  ].some(marker => text.includes(marker));
  return includesOven && !accessory;
}

function reclassifyExistingOvens(products, incomingIds) {
  const changes = [];
  const nextProducts = products.map(product => {
    if (incomingIds.has(String(product.id))) return product;
    if (!looksLikeCountertopOven(product)) return product;

    const needsUpdate = product.storeId !== ovenMeta.storeId
      || product.category !== ovenMeta.category
      || product.categoria !== ovenMeta.category
      || product.subcategoria !== ovenMeta.subcategoria
      || product.departamento !== ovenMeta.departamento;
    if (!needsUpdate) return product;

    changes.push({
      id: product.id,
      title: product.title || product.name || product.nome,
      from: {
        storeId: product.storeId,
        category: product.category || product.categoria,
        subcategoria: product.subcategoria,
        departamento: product.departamento,
      },
      to: {
        storeId: ovenMeta.storeId,
        category: ovenMeta.category,
        subcategoria: ovenMeta.subcategoria,
        departamento: ovenMeta.departamento,
      },
    });

    return {
      ...product,
      storeId: ovenMeta.storeId,
      category: ovenMeta.category,
      categoria: ovenMeta.category,
      subcategoria: ovenMeta.subcategoria,
      departamento: ovenMeta.departamento,
      ultimaRevisao: today,
      atualizadoEm: product.atualizadoEm || now,
    };
  });
  return { products: nextProducts, changes };
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

const source = readJson(files.source);
const sourceProducts = Array.isArray(source.products) ? source.products : [];
if (sourceProducts.length !== 15) {
  throw new Error(`Esperados 15 fornos de bancada na curadoria Shopee; encontrados ${sourceProducts.length}.`);
}
const missingLinks = sourceProducts.filter(item => !/^https:\/\/s\.shopee\.com\.br\//.test(String(item.affiliateLink || "")));
if (missingLinks.length) {
  throw new Error(`${missingLinks.length} produtos sem shortlink oficial da Shopee.`);
}

const images = [];
for (const item of sourceProducts) {
  images.push(await downloadOrCopyImage(item));
}

const incomingProducts = sourceProducts.map((item, index) => makeProduct(item, images[index], index));
const incomingIds = new Set(incomingProducts.map(product => product.id));
const incomingLinks = new Set(incomingProducts.map(product => firstLink(product)));
const currentProducts = readJson(files.products, []);
const withoutPreviousImport = currentProducts.filter(product => (
  product.origemImportacao !== importTag
  && !incomingIds.has(String(product.id))
  && !incomingLinks.has(firstLink(product))
));
const withIncomingFirst = [...incomingProducts, ...withoutPreviousImport];
const { products: nextProducts, changes: reclassifiedExistingProducts } = reclassifyExistingOvens(withIncomingFirst, incomingIds);
const stores = ensureStoreSubcategories(readJson(files.stores, []));

writeJson(files.products, nextProducts);
writeJson(files.packageProducts, nextProducts);
writeJson(files.stores, stores);
writeJson(files.packageStores, stores);
writeJson(files.importedProducts, incomingProducts);
writeJson(files.packageImportedProducts, incomingProducts);
syncHtml(nextProducts, stores);

const countsByBrand = incomingProducts.reduce((acc, product) => {
  acc[product.brand] = (acc[product.brand] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: now,
  selectedFrom: "Shopee Brasil e painel Criadores e Afiliados Shopee em sessao Chrome logada",
  sourceFile: path.relative(root, files.source).replace(/\\/g, "/"),
  productsPublished: incomingProducts.length,
  officialShopeeShortlinks: incomingProducts.length,
  store: ovenMeta.storeId,
  category: ovenMeta.category,
  subcategoria: ovenMeta.subcategoria,
  departamento: ovenMeta.departamento,
  countsByBrand,
  backupBeforeImport,
  reclassifiedExistingProducts,
  policyNotes: [
    "Itens de embutir, acessorios, pecas avulsas, usados e resultados esgotados sem alternativa ativa foram descartados.",
    "Todas as fotos foram usadas apenas quando havia correspondencia de modelo, marca e capacidade.",
    "Clientes devem conferir preco, estoque, frete, prazo, garantia e voltagem na Shopee antes da compra.",
  ],
  products: incomingProducts.map(product => ({
    id: product.id,
    storeId: product.storeId,
    title: product.title,
    brand: product.brand,
    price: product.price,
    category: product.category,
    subcategoria: product.subcategoria,
    departamento: product.departamento,
    affiliateLink: product.affiliateLink,
    productUrl: product.shopee.productUrl,
    image: product.image,
  })),
};

writeJson(files.report, report);
writeJson(files.packageReport, report);

console.log(`Importados ${incomingProducts.length} fornos Shopee com shortlink oficial.`);
console.log(`Marcas: ${JSON.stringify(countsByBrand)}`);
console.log(`Reclassificados existentes: ${reclassifiedExistingProducts.length}`);
