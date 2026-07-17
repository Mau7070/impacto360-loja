import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const today = "2026-07-17";
const importPrefix = "amazon-gamer-20260717-";
const affiliateTag = "910556142-20";

const files = {
  selection: path.join(root, "dados", "amazon-gamer-selecao-20260717.json"),
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  packageProducts: path.join(root, "pacote-github-pages-pronto", "dados", "products.json"),
  packageStores: path.join(root, "pacote-github-pages-pronto", "dados", "stores.json"),
  report: path.join(root, "dados", "relatorio-amazon-gamer-20260717.json"),
  reportMarkdown: path.join(root, "dados", "relatorio-amazon-gamer-20260717.md"),
  packageSelection: path.join(root, "pacote-github-pages-pronto", "dados", "amazon-gamer-selecao-20260717.json"),
  packageReport: path.join(root, "pacote-github-pages-pronto", "dados", "relatorio-amazon-gamer-20260717.json"),
};

function readJson(file) {
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
    .slice(0, 72);
}

function compactTitle(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 130 ? `${text.slice(0, 127).trim()}...` : text;
}

function detectBrand(title) {
  const brands = [
    "Alienware",
    "Dell",
    "ASUS",
    "Acer",
    "Lenovo",
    "Predator",
    "Logitech",
    "Redragon",
    "HyperX",
    "Havit",
    "JBL",
    "Xbox",
    "PlayStation",
    "8BitDo",
    "GameSir",
    "LG",
    "AOC",
    "Samsung",
    "ThunderX3",
    "Kingston",
    "Western Digital",
    "WD",
    "Husky",
    "Dazz",
    "Rise Mode",
  ];
  const normalizedTitle = normalize(title);
  return brands.find((brand) => normalizedTitle.includes(normalize(brand))) || "Amazon";
}

function subcategoryFor(item, type) {
  const title = normalize(item.title);
  const query = normalize(item.query);
  if (type === "computer") {
    return /pc gamer|computador gamer|desktop/.test(title) ? "PCs gamer" : "Notebooks gamer";
  }
  if (/headset|fone/.test(query) || /headset|fone/.test(title)) return "Headsets gamer";
  if (/mousepad/.test(query) || /mouse pad|mousepad/.test(title)) return "Mousepad";
  if (/mouse/.test(query) || /mouse/.test(title)) return "Mouses gamer";
  if (/teclado/.test(query) || /teclado/.test(title)) return "Teclados gamer";
  if (/controle/.test(query) || /controle|controller|gamepad|dualsense|dualshock/.test(title)) return "Controles";
  if (/monitor/.test(query) || /monitor/.test(title)) return "Monitores gamer";
  if (/cadeira/.test(query) || /cadeira/.test(title)) return "Cadeiras gamer";
  if (/ssd|nvme/.test(query) || /ssd|nvme/.test(title)) return "SSDs gamer";
  return "Acessórios";
}

function benefitList(item, subcategory, type) {
  const benefits = [
    "Link oficial com tag Amazon Associados da loja.",
    "Produto real localizado na Amazon Brasil.",
    "Preço, estoque, frete e vendedor devem ser conferidos diretamente na Amazon antes da compra.",
  ];
  if (item.rating) benefits.unshift(`Avaliação exibida na busca: ${item.rating}.`);
  if (type === "computer") benefits.unshift("Selecionado para compradores que procuram desempenho em jogos e setup gamer.");
  if (/Headsets|Mouses|Teclados|Controles|Monitores|Cadeiras|SSDs|Mousepad/.test(subcategory)) {
    benefits.unshift(`Categoria de alto interesse para setup gamer: ${subcategory}.`);
  }
  return benefits;
}

function storeFor(type, subcategory) {
  if (type === "computer") return "impacto-tech-computadores";
  if (subcategory === "Headsets gamer") return "impacto-eletronicos";
  if (["Mouses gamer", "Teclados gamer", "Monitores gamer", "SSDs gamer", "Mousepad"].includes(subcategory)) {
    return "impacto-tech-computadores";
  }
  return "impacto-games";
}

function categoryFor(storeId, type) {
  if (type === "computer" || storeId === "impacto-tech-computadores") return "Informática";
  if (storeId === "impacto-eletronicos") return "Eletrônicos";
  return "Games";
}

function makeProduct(item, index, type) {
  const asin = String(item.asin || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) throw new Error(`ASIN invalido: ${asin}`);
  const title = compactTitle(item.title);
  const slugBase = slugify(title) || asin.toLowerCase();
  const id = `${importPrefix}${slugBase}-${asin.toLowerCase()}`;
  const url = `https://www.amazon.com.br/dp/${asin}/?tag=${affiliateTag}`;
  const sourceUrl = `https://www.amazon.com.br/dp/${asin}/`;
  const subcategory = subcategoryFor(item, type);
  const storeId = storeFor(type, subcategory);
  const category = categoryFor(storeId, type);
  const brand = detectBrand(title);
  const rating = String(item.rating || "").trim();
  const priceSeen = String(item.priceText || "").trim();
  const sourceQuery = String(item.query || "").trim();
  const description =
    `${title} foi selecionado na Amazon Brasil em ${today} para a vitrine gamer do Impacto 360 Afiliado. ` +
    `Confira preço atualizado, variações, frete, prazo, vendedor, garantia e disponibilidade diretamente na Amazon antes da compra. ` +
    `Este conteúdo pode conter link de afiliado.`;
  const bullets = benefitList(item, subcategory, type);
  const ordinal = String(index + 1).padStart(2, "0");
  const badge = type === "computer" ? "Amazon gamer" : subcategory.replace(/s gamer$/i, " gamer");
  const hashtags = [
    "#Impacto360",
    "#Amazon",
    "#Gamer",
    type === "computer" ? "#NotebookGamer" : "#SetupGamer",
    `#${brand.replace(/\s+/g, "")}`,
  ];

  return {
    id,
    storeId,
    name: title,
    nome: title,
    title,
    slug: `amazon-gamer-${asin.toLowerCase()}-${slugBase}`.slice(0, 110),
    brand,
    marca: brand,
    creator: "Amazon Brasil",
    produtor: "Amazon Brasil",
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    descricaoCompleta: description,
    textoCatalogo: `${title} - ${description}`,
    price: "Conferir preço na Amazon",
    preco: "Conferir preço na Amazon",
    precoPromocional: null,
    precoAnterior: null,
    parcelas: "",
    frete: "Conferir frete e prazo na Amazon",
    disponibilidade: "Conferir disponibilidade na Amazon",
    image: item.img,
    imagemPrincipal: item.img,
    fotoPrincipal: item.img,
    imagem: item.img,
    galeria: [item.img].filter(Boolean),
    fotosExtras: [item.img].filter(Boolean),
    fonteMidia: "Amazon Brasil - imagem exibida em resultado publico de busca",
    category,
    categoria: category,
    subcategoria: subcategory,
    badge,
    buttonLabel: "Ver na Amazon",
    actionType: "buy",
    affiliateLink: url,
    linkAfiliado: url,
    linkComissionado: url,
    linkCompra: url,
    linkPlataforma: url,
    urlProduto: url,
    linkOriginal: sourceUrl,
    linkPrincipalFonte: sourceUrl,
    linkProdutoApenasLeitura: sourceUrl,
    linkResolvidoApenasLeitura: url,
    tipoLink: "amazon_associados",
    linkStatus: `link de afiliado Amazon confirmado com StoreID ${affiliateTag}`,
    statusLink: "confirmado",
    statusImagem: "imagem externa Amazon informada",
    source: "Amazon",
    origem: "Amazon Associados",
    plataformaOrigem: "Amazon",
    status: "ativo",
    statusAnuncio: "ativo",
    aprovadoParaPublicacao: true,
    publicar: true,
    publicarNaHome: type === "computer" ? index < 4 : index < 8,
    destaqueHome: type === "computer" ? index < 2 : index < 4,
    geraComissao: true,
    editavelManual: true,
    editable: true,
    editavelPorChatGPT: true,
    atualizadoEm: today,
    publicadoEm: today,
    ultimaRevisao: today,
    chamadasGoogleAds: [
      "Use textos sem promessa de desconto fixo.",
      "Direcione para a Amazon com preço e disponibilidade atualizados.",
      "Evite afirmar estoque, entrega ou garantia sem conferência no parceiro.",
    ],
    googleAdsRevisao: {
      status: "adequado_com_cuidados",
      orientacao:
        "Produto físico de parceiro. Anúncios devem evitar preço fixo, superlativos absolutos e promessas de resultado. Conferir políticas da Amazon e do Google Ads antes de impulsionar.",
    },
    beneficios: bullets,
    specs: {
      asin,
      consultaAmazon: sourceQuery,
      avaliacaoExibidaNaBusca: rating || "Nao exibida",
      precoExibidoNaBusca: priceSeen || "Nao exibido",
      afiliadoAmazon: affiliateTag,
      posicaoCuradoria: ordinal,
    },
    ofertas: {
      fonte: "Amazon Brasil",
      asin,
      precoVistoAmazon: priceSeen || null,
      avaliacaoVistaAmazon: rating || null,
      consulta: sourceQuery,
      coletadoEm: today,
    },
    observacoesInternas: [
      "Importacao Amazon gamer 2026-07-17.",
      "Link de compra usa tag oficial Amazon Associados visivel no painel.",
      "Preco nao fixado no card para evitar informacao desatualizada.",
    ],
    textoWhatsApp:
      `Oferta Amazon selecionada no IMPACTO 360 AFILIADO\n\n${title}\n\n` +
      `${description}\n\nVer na Amazon:\n${url}`,
    legendaWhatsApp:
      `Oferta Amazon selecionada no IMPACTO 360 AFILIADO\n\n${title}\n\n` +
      `${description}\n\nVer na Amazon:\n${url}`,
    legendaInstagram:
      `${title}\n\n${description}\n\nConfira os detalhes no link da loja. ${hashtags.join(" ")}`,
    legendaFacebook:
      `${title}\n\n${description}\n\nAcesse pelo link de afiliado da Impacto 360 Afiliado: ${url}`,
    hashtags,
    amazon: {
      asin,
      affiliateTag,
      affiliateUrl: url,
      sourceUrl,
      query: sourceQuery,
      rating,
      priceSeen,
      sponsoredResult: Boolean(item.sponsored),
      primeBadgeVisible: Boolean(item.prime),
    },
  };
}

function ensureStoreMetadata(stores) {
  const games = stores.find((store) => store.id === "impacto-games");
  if (games) {
    const additions = ["SSDs gamer", "Setup gamer Amazon", "Ofertas Amazon Games"];
    games.subcategories = Array.from(new Set([...(games.subcategories || []), ...additions]));
    games.description = "Games, consoles, acessórios, componentes e setup gamer completo com curadoria Amazon e parceiros.";
    games.section = "Setup gamer completo";
  }

  const computers = stores.find((store) => store.id === "impacto-tech-computadores");
  if (computers) {
    const additions = ["Notebooks gamer Amazon", "PCs gamer Amazon", "Mouses gamer", "Teclados gamer", "Monitores gamer", "SSDs gamer", "Mousepad"];
    computers.subcategories = Array.from(new Set([...(computers.subcategories || []), ...additions]));
    computers.section = "Computadores gamer e setup de alto desempenho";
  }

  const electronics = stores.find((store) => store.id === "impacto-eletronicos");
  if (electronics) {
    const additions = ["Headsets gamer", "Audio gamer Amazon"];
    electronics.subcategories = Array.from(new Set([...(electronics.subcategories || []), ...additions]));
  }
}

const selection = readJson(files.selection);
if (selection.affiliateTag !== affiliateTag) {
  throw new Error(`Tag Amazon divergente: selecao=${selection.affiliateTag} script=${affiliateTag}`);
}

const originalProducts = readJson(files.products);
const stores = readJson(files.stores);
ensureStoreMetadata(stores);

const computers = selection.computers.map((item, index) => makeProduct(item, index, "computer"));
const gaming = selection.gaming.map((item, index) => makeProduct(item, index, "gaming"));
const imported = [...computers, ...gaming];
const ids = new Set(imported.map((product) => product.id));
if (ids.size !== imported.length) throw new Error("Importacao gerou IDs duplicados.");

const products = originalProducts.filter((product) => !String(product.id || "").startsWith(importPrefix));
products.push(...imported);

writeJson(files.products, products);
writeJson(files.stores, stores);
writeJson(files.packageProducts, products);
writeJson(files.packageStores, stores);
writeJson(files.packageSelection, selection);

const report = {
  generatedAt: new Date().toISOString(),
  date: today,
  affiliateTag,
  source: "Amazon Brasil / Amazon Associados",
  importedCount: imported.length,
  computersCount: computers.length,
  gamingCount: gaming.length,
  stores: {
    "impacto-tech-computadores": computers.length,
    "impacto-games": gaming.length,
  },
  cleanup: {
    removedPreviousImportCount: originalProducts.length - products.length + imported.length,
    importPrefix,
  },
  products: imported.map((product) => ({
    id: product.id,
    asin: product.amazon.asin,
    title: product.title,
    storeId: product.storeId,
    subcategory: product.subcategoria,
    url: product.linkCompra,
    priceSeen: product.amazon.priceSeen || null,
    rating: product.amazon.rating || null,
  })),
  validationNotes: [
    "Todos os links usam amazon.com.br/dp/ASIN com tag 910556142-20.",
    "Preco fixo nao foi publicado no card; usuario confere preco atualizado na Amazon.",
    "Produtos sem imagem ou ASIN valido interrompem a importacao.",
  ],
};

writeJson(files.report, report);
writeJson(files.packageReport, report);
fs.writeFileSync(
  files.reportMarkdown,
  [
    "# Relatorio Amazon Gamer 2026-07-17",
    "",
    `- Produtos importados: ${report.importedCount}`,
    `- Computadores gamer: ${report.computersCount}`,
    `- Outros produtos gamer: ${report.gamingCount}`,
    `- Tag Amazon Associados usada: ${affiliateTag}`,
    "",
    "## Cuidados aplicados",
    "",
    "- O card nao fixa preco nem estoque; o cliente confere diretamente na Amazon.",
    "- Links foram montados no formato Amazon Brasil com tag de afiliado.",
    "- A copia de publicacao em `pacote-github-pages-pronto` foi sincronizada.",
  ].join("\n") + "\n",
  "utf8",
);

console.log(`Amazon gamer importado: ${imported.length} produtos.`);
console.log(`Relatorio: ${path.relative(root, files.report)}`);
