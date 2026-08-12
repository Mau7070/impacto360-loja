import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "dados");
const socialDir = path.join(dataDir, "social-videos-20260730");
const productsPath = path.join(dataDir, "products.json");
const confirmedPath = path.join(socialDir, "produtos-confirmados.json");
const crossmatchPath = path.join(socialDir, "cruzamento-catalogo.json");
const readyCsvPath = path.join(socialDir, "produtos-prontos-redes.csv");

const products = readJson(productsPath);
const confirmed = readJson(confirmedPath);
const crossmatch = readJson(crossmatchPath);

if (!Array.isArray(products)) {
  throw new Error("dados/products.json precisa conter uma lista.");
}

const existingIds = new Set(products.map(product => String(product.id || "")));
const imported = [];

for (const item of confirmed.items || []) {
  validateConfirmedItem(item);
  syncPackageImage(item.image);
  if (existingIds.has(item.catalogProductId)) continue;

  products.push(buildProduct(item));
  existingIds.add(item.catalogProductId);
  imported.push(item.catalogProductId);
}

const confirmedByHash = new Map(
  (confirmed.items || []).map(item => [item.videoSha256, item])
);

for (const item of crossmatch.research || []) {
  const match = confirmedByHash.get(item.videoSha256);
  if (!match) continue;
  item.matchStatus = "pronto";
  item.catalogProductId = match.catalogProductId;
  item.catalogProductSlug = match.slug;
  item.catalogTitle = match.title;
  item.marketplace = match.marketplace.toLowerCase();
  item.affiliateLink = match.affiliateLink;
  item.directProductUrl = match.directProductUrl;
  item.visualReview = match.visualMatch.status;
  item.reviewedAt = match.reviewedAt;
}

writeJson(productsPath, products);
writeJson(crossmatchPath, crossmatch);
fs.writeFileSync(
  readyCsvPath,
  toCsv((confirmed.items || []).map(item => ({
    videoNumber: item.videoNumber,
    title: item.sourceTitle,
    sourceZip: findCrossmatch(item.videoSha256)?.sourceZip || "",
    videoEntry: findCrossmatch(item.videoSha256)?.videoEntry || "",
    catalogProductId: item.catalogProductId,
    catalogTitle: item.title,
    marketplace: item.marketplace,
    affiliateLink: item.affiliateLink,
    matchStatus: "pronto"
  }))),
  "utf8"
);

console.log(JSON.stringify({
  imported: imported.length,
  importedIds: imported,
  confirmed: (confirmed.items || []).length,
  catalogTotal: products.length
}, null, 2));

function buildProduct(item) {
  const description = [
    item.catalogDescription || "Produto equivalente ao item demonstrado no vídeo, selecionado no catálogo oficial de afiliados da Shopee.",
    "Preço, estoque, frete, avaliação e comissão podem mudar; confirme as condições atuais na página do parceiro antes da compra."
  ].join(" ");
  const linkFields = {
    affiliateLink: item.affiliateLink,
    linkAfiliado: item.affiliateLink,
    linkCompra: item.affiliateLink,
    linkComissionado: item.affiliateLink,
    linkPlataforma: item.affiliateLink,
    linkOriginal: item.affiliateLink,
    linkPrincipalFonte: item.directProductUrl,
    linkResolvidoApenasLeitura: item.directProductUrl,
    linkProdutoApenasLeitura: item.directProductUrl,
    urlProduto: item.affiliateLink
  };

  return {
    id: item.catalogProductId,
    storeId: item.storeId,
    name: item.title,
    nome: item.title,
    title: item.title,
    slug: item.slug,
    brand: "Consultar na Shopee",
    marca: "Consultar na Shopee",
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    descricaoCompleta: description,
    textoCatalogo: description,
    price: item.priceAtReview,
    preco: item.priceAtReview,
    precoAnterior: "",
    desconto: "",
    image: item.image,
    imagemPrincipal: item.image,
    fotoPrincipal: item.image,
    imagem: item.image,
    galeria: [item.image],
    fotosExtras: [item.image],
    badge: "Link afiliado confirmado",
    category: item.category,
    categoria: item.category,
    subcategoria: item.subcategory,
    source: "Shopee Afiliados",
    origem: "Shopee - curadoria autenticada",
    partner: "Shopee",
    plataforma: "Shopee",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: "imagem real do anúncio equivalente",
    statusLink: "link_comissionado_gerado_oficialmente",
    linkStatus: "link de afiliado confirmado",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    editable: true,
    editavelManual: true,
    editavelPorChatGPT: true,
    actionType: "buy",
    buttonLabel: "Ver oferta",
    fonteMidia: "Shopee",
    ultimaRevisao: item.reviewedAt,
    atualizadoEm: item.reviewedAt,
    publicadoEm: item.reviewedAt,
    disponibilidade: "Confirmar na Shopee",
    avaliacao: "Consultar na Shopee",
    vendidos: item.salesAtReview,
    comissao: item.commissionAtReview,
    specs: item.specs || [
      "Produto revisado visualmente",
      "Link oficial de afiliado"
    ],
    beneficios: item.benefits || [
      "Produto equivalente ao demonstrado no vídeo.",
      "Link curto oficial gerado no painel autenticado."
    ],
    ofertas: [
      {
        plataforma: "Shopee",
        vendedor: "Consultar na Shopee",
        preco: item.priceAtReview,
        linkCompra: item.affiliateLink,
        linkAfiliado: item.affiliateLink,
        linkPrincipalFonte: item.directProductUrl,
        linkOriginal: item.affiliateLink,
        tipoLink: "comissionado",
        statusLink: "link_comissionado_gerado_oficialmente",
        geraComissao: true,
        frete: "Confirmar na Shopee",
        status: "ativo"
      }
    ],
    shopee: {
      itemId: item.affiliateItemId,
      generatedAffiliateLink: item.affiliateLink,
      directProductUrl: item.directProductUrl,
      sourceProductUrl: item.sourceProductUrl,
      sourceProductStatus: item.sourceProductStatus,
      imageSource: item.imageSource,
      priceAtSelection: item.priceAtReview,
      salesAtSelection: item.salesAtReview,
      commissionAtSelection: item.commissionAtReview,
      visualMatch: item.visualMatch,
      generatedAt: item.reviewedAt
    },
    socialVideo: {
      videoNumber: item.videoNumber,
      videoSha256: item.videoSha256,
      sourceTitle: item.sourceTitle,
      matchStatus: item.visualMatch.status
    },
    precoAtualizadoEm: item.reviewedAt,
    priceUpdatedAt: item.reviewedAt,
    ultimaVerificacaoPreco: item.reviewedAt,
    dataUltimaVerificacao: item.reviewedAt,
    priceStatus: "current",
    statusPreco: "confirmado_no_painel_afiliado",
    auditoriaPreco: {
      status: "confirmado_no_painel_afiliado",
      verificadoEm: item.reviewedAt,
      fonte: `${item.marketplace} Afiliados`,
      tituloConferido: true,
      precoAnteriorRemovido: true,
      motivo: "Preço atual conferido no painel oficial; nenhum preço anterior foi publicado."
    },
    observacoesInternas: `Importação auditável de vídeo em ${item.reviewedAt}. Não substituir o link curto sem nova geração no painel oficial.`,
    ...linkFields
  };
}

function validateConfirmedItem(item) {
  const required = [
    "videoNumber",
    "videoSha256",
    "catalogProductId",
    "title",
    "affiliateItemId",
    "directProductUrl",
    "affiliateLink",
    "image",
    "priceAtReview",
    "reviewedAt"
  ];
  const missing = required.filter(key => !item[key]);
  if (missing.length) {
    throw new Error(`Produto confirmado incompleto: ${missing.join(", ")}`);
  }
  if (!/^https:\/\/s\.shopee\.com\.br\/[A-Za-z0-9_-]+$/.test(item.affiliateLink)) {
    throw new Error(`Link afiliado Shopee inválido: ${item.affiliateLink}`);
  }
  if (item.visualMatch?.status !== "equivalente_confirmado") {
    throw new Error(`Revisão visual não confirmada: ${item.catalogProductId}`);
  }
  const imagePath = path.join(root, item.image);
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagem local ausente: ${item.image}`);
  }
}

function syncPackageImage(relativeImagePath) {
  const source = path.join(root, relativeImagePath);
  const destination = path.join(root, "pacote-github-pages-pronto", relativeImagePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function findCrossmatch(videoSha256) {
  return (crossmatch.research || []).find(item => item.videoSha256 === videoSha256);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toCsv(rows) {
  const columns = [
    "videoNumber",
    "title",
    "sourceZip",
    "videoEntry",
    "catalogProductId",
    "catalogTitle",
    "marketplace",
    "affiliateLink",
    "matchStatus"
  ];
  return [
    columns.join(","),
    ...rows.map(row => columns.map(column => csvCell(row[column])).join(","))
  ].join("\n") + "\n";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}
