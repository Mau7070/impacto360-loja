import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const now = "2026-07-15T11:15:00-03:00";
const today = "2026-07-15";
const importTag = "shopee-infantil-2026-07-15";

const files = {
  source: path.join(root, "importacoes", "originais", "2026-07-15-shopee-infantil", "shopee-produtos-infantis-curados.json"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  packageProducts: path.join(packageDir, "dados", "products.json"),
  packageStores: path.join(packageDir, "dados", "stores.json"),
  importedProducts: path.join(root, "dados", "produtos-importados-shopee-2026-07-15.json"),
  packageImportedProducts: path.join(packageDir, "dados", "produtos-importados-shopee-2026-07-15.json"),
  report: path.join(root, "dados", "relatorio-shopee-infantil-2026-07-15.json"),
  packageReport: path.join(packageDir, "dados", "relatorio-shopee-infantil-2026-07-15.json"),
};

const bucketMeta = {
  "festa-infantil": {
    storeId: "impacto-kids",
    category: "Bebe e Infantil",
    subcategoria: "Festa infantil",
    badge: "Shopee festa infantil",
    description: "Kit e decoracao selecionados para aniversario infantil.",
    specs: ["Festa infantil", "Decoracao e lembrancinhas", "Uso por adulto responsavel"],
  },
  "moda-bebe": {
    storeId: "impacto-kids",
    category: "Bebe e Infantil",
    subcategoria: "Roupas de bebe",
    badge: "Shopee moda bebe",
    description: "Roupa de bebe e infantil com foco em tamanhos de recem-nascido ate 3 anos.",
    specs: ["Moda bebe", "Tamanhos ate 3 anos quando indicado", "Conferir tabela de medidas na Shopee"],
  },
  "utensilios-bebe": {
    storeId: "impacto-kids",
    category: "Bebe e Infantil",
    subcategoria: "Alimentacao infantil",
    badge: "Shopee alimentacao bebe",
    description: "Itens de alimentacao, refeicao e rotina para bebe.",
    specs: ["Alimentacao infantil", "Pratos, talheres, copos ou babadores", "Conferir material, idade indicada e limpeza"],
  },
  "brinquedos-bebe": {
    storeId: "impacto-brinquedos",
    category: "Brinquedos",
    subcategoria: "Brinquedos para bebe",
    badge: "Shopee brinquedo bebe",
    description: "Brinquedos sensoriais, musicais ou de atividade para bebe e crianca pequena.",
    specs: ["Brinquedo para bebe", "Uso com supervisao", "Confirmar faixa etaria e selo de seguranca antes da compra"],
  },
  "seguranca-bebe": {
    storeId: "impacto-kids",
    category: "Bebe e Infantil",
    subcategoria: "Seguranca bebe",
    badge: "Shopee seguranca bebe",
    description: "Itens para seguranca domestica e banho do bebe.",
    specs: ["Seguranca domestica", "Protetores, travas ou apoio de banho", "Instalacao por adulto responsavel"],
  },
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

function firstLink(product) {
  return String(product?.affiliateLink || product?.linkCompra || product?.linkAfiliado || product?.linkComissionado || "").trim().toLowerCase();
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/Não OficialSó/gi, "Nao oficial - So")
    .trim();
}

function imageFileFor(item) {
  return `public/images/anuncios/shopee-${item.bucket}-${slugify(item.title)}-${shortHash(item.itemId || item.href, 8)}.webp`;
}

async function downloadImage(item) {
  const relative = imageFileFor(item);
  const destination = path.join(root, relative);
  const packageDestination = path.join(packageDir, relative);
  if (!fs.existsSync(destination)) {
    const response = await fetch(item.img, {
      headers: {
        "accept": "image/avif,image/webp,image/*,*/*",
        "user-agent": "Mozilla/5.0 Impacto360 catalog importer",
      },
    });
    if (!response.ok) throw new Error(`Falha ao baixar imagem ${response.status} ${item.img}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
  }
  fs.mkdirSync(path.dirname(packageDestination), { recursive: true });
  fs.copyFileSync(destination, packageDestination);
  return relative;
}

function buildDescription(item, meta) {
  const title = cleanTitle(item.title);
  return `${title} foi selecionado na Shopee para a vitrine infantil da Impacto360. ${meta.description} Preco, estoque, frete, variacoes, prazo, reputacao do vendedor, material e faixa etaria devem ser conferidos diretamente na Shopee antes da compra. Este card pode conter link de afiliado.`;
}

function makeProduct(item, image, index) {
  const meta = bucketMeta[item.bucket] || bucketMeta["festa-infantil"];
  const title = cleanTitle(item.title);
  const link = item.affiliateLink;
  const slug = slugify(title);
  const id = `shopee-20260715-${item.bucket}-${slug}-${shortHash(link)}`;
  const description = buildDescription({ ...item, title }, meta);
  const socialText = `Oferta Shopee selecionada no IMPACTO 360 AFILIADO\n\n${title}\n${item.price}\n\n${meta.description}\n\nVer na Shopee:\n${link}\n\nConfira preco, estoque, frete, variacoes e faixa etaria diretamente na Shopee. Este conteudo pode conter link de afiliado.`;
  return {
    id,
    storeId: meta.storeId,
    name: title,
    nome: title,
    title,
    slug,
    brand: "Shopee",
    marca: "Shopee",
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
    badge: meta.badge,
    category: meta.category,
    categoria: meta.category,
    subcategoria: meta.subcategoria,
    source: "Shopee",
    origem: "Shopee - link oficial gerado no painel de afiliados",
    plataformaOrigem: "Shopee",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: "imagem capturada da pagina publica da Shopee",
    statusLink: "shortlink_shopee_oficial_confirmado",
    linkStatus: "Shortlink oficial s.shopee.com.br gerado no Link personalizado da conta Shopee",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    destaqueHome: index < 12,
    publicarNaHome: index < 12,
    publicar: true,
    editable: true,
    editavelManual: true,
    editavelPorChatGPT: true,
    actionType: "buy",
    buttonLabel: "Ver na Shopee",
    chamadaCompra: "Ver na Shopee",
    fonteMidia: "Shopee Brasil em sessao logada",
    ultimaRevisao: today,
    atualizadoEm: now,
    publicadoEm: now,
    origemImportacao: importTag,
    disponibilidade: "Oferta ativa na Shopee no momento da curadoria; confirmar condicoes antes da compra.",
    specs: [
      ...meta.specs,
      "Shortlink oficial Shopee gerado na conta logada",
    ],
    beneficios: [
      "Card organizado na loja infantil da Impacto360.",
      "Destino de compra preservado por shortlink oficial da Shopee.",
      "Texto orienta o cliente a conferir preco, estoque, frete e faixa etaria no vendedor.",
    ],
    shopee: {
      shopId: item.shopId || "",
      itemId: item.itemId || "",
      productUrl: item.href,
      affiliateLink: link,
      sourceQuery: item.query,
      bucket: item.bucket,
      selectedAt: now,
    },
    googleAdsRevisao: {
      adequadoPrimeiraDivulgacao: item.bucket !== "brinquedos-bebe",
      motivo: item.bucket === "brinquedos-bebe"
        ? "Produto infantil exige cuidado extra com idade indicada, pecas pequenas e supervisao."
        : "Produto de varejo fisico com destino transparente para marketplace.",
      cuidados: [
        "Nao anunciar preco fixo sem confirmar se continua igual na Shopee.",
        "Nao prometer seguranca ou adequacao etaria sem conferir a pagina do vendedor.",
        "Manter transparencia de link de afiliado quando necessario.",
      ],
    },
    textoWhatsApp: socialText,
    legendaWhatsApp: socialText,
    legendaInstagram: `${title}\n\n${meta.description}\n\n${item.price || "Preco na Shopee"}\n\nConfira na Shopee pelo link oficial da loja.\n\n#Impacto360 #Shopee #Infantil`,
    legendaFacebook: `${title}\n\n${meta.description}\n\nPreco: ${item.price || "Preco na Shopee"}\n\nAcesse pela Impacto 360 Afiliado: ${link}`,
    hashtags: ["#Impacto360", "#Shopee", "#Infantil"],
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
  const additions = {
    "impacto-kids": ["Festa infantil", "Roupas de bebe", "Alimentacao infantil", "Seguranca bebe", "Shopee infantil"],
    "impacto-brinquedos": ["Brinquedos para bebe", "Brinquedos sensoriais", "Shopee brinquedos"],
  };
  return stores.map(store => {
    const extra = additions[store.id];
    if (!extra) return store;
    const subcategories = Array.isArray(store.subcategories) ? store.subcategories : [];
    return {
      ...store,
      subcategories: [...new Set([...subcategories, ...extra])],
    };
  });
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
if (sourceProducts.length !== 100) {
  throw new Error(`Esperados 100 produtos na curadoria Shopee; encontrados ${sourceProducts.length}.`);
}
const missingLinks = sourceProducts.filter(item => !/^https:\/\/s\.shopee\.com\.br\//.test(String(item.affiliateLink || "")));
if (missingLinks.length) {
  throw new Error(`${missingLinks.length} produtos sem shortlink oficial da Shopee.`);
}

const images = [];
for (const item of sourceProducts) {
  images.push(await downloadImage(item));
}

const incomingProducts = sourceProducts.map((item, index) => makeProduct(item, images[index], index));
const incomingIds = new Set(incomingProducts.map(product => product.id));
const incomingLinks = new Set(incomingProducts.map(product => firstLink(product)));
const products = readJson(files.products, []);
const nextProducts = [
  ...incomingProducts,
  ...products.filter(product => (
    product.origemImportacao !== importTag
    && !incomingIds.has(String(product.id))
    && !incomingLinks.has(firstLink(product))
  )),
];

const stores = ensureStoreSubcategories(readJson(files.stores, []));

writeJson(files.products, nextProducts);
writeJson(files.packageProducts, nextProducts);
writeJson(files.stores, stores);
writeJson(files.packageStores, stores);
writeJson(files.importedProducts, incomingProducts);
writeJson(files.packageImportedProducts, incomingProducts);
syncHtml(nextProducts, stores);

const countsByBucket = incomingProducts.reduce((acc, product) => {
  const bucket = product.shopee?.bucket || "outros";
  acc[bucket] = (acc[bucket] || 0) + 1;
  return acc;
}, {});
const countsByStore = incomingProducts.reduce((acc, product) => {
  acc[product.storeId] = (acc[product.storeId] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: now,
  selectedFrom: "Shopee Brasil e painel Criadores e Afiliados Shopee em sessao Chrome logada",
  sourceFile: path.relative(root, files.source).replace(/\\/g, "/"),
  productsPublished: incomingProducts.length,
  officialShopeeShortlinks: incomingProducts.length,
  countsByBucket,
  countsByStore,
  backupBeforeImport: "backups/2026-07-15-1115-pre-shopee-infantil",
  policyNotes: [
    "Balões, maquiagem, slime, armas, itens adultos e produtos pet foram removidos da curadoria.",
    "Brinquedos de bebe foram filtrados para evitar itens magneticos, MDF e pecas pequenas obvias.",
    "Clientes devem conferir preco, estoque, frete, variacoes, reputacao do vendedor, material e faixa etaria na Shopee antes da compra.",
  ],
  products: incomingProducts.map(product => ({
    id: product.id,
    storeId: product.storeId,
    title: product.title,
    price: product.price,
    subcategoria: product.subcategoria,
    affiliateLink: product.affiliateLink,
    productUrl: product.shopee.productUrl,
    image: product.image,
  })),
};

writeJson(files.report, report);
writeJson(files.packageReport, report);

console.log(`Importados ${incomingProducts.length} produtos Shopee infantis com shortlink oficial.`);
console.log(`Buckets: ${JSON.stringify(countsByBucket)}`);
