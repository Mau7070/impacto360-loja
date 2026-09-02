import fs from "node:fs";
import path from "node:path";
import { productShortUrl } from "./product-short-links.mjs";

const root = process.cwd();
const reviewedAt = "2026-09-02T09:00:00-03:00";
const productsPath = path.join(root, "dados", "products.json");
const packageProductsPath = path.join(root, "pacote-github-pages-pronto", "dados", "products.json");
const selectionPath = path.join(root, "dados", "campanha-setembro-2026-curadoria.json");
const mediaPath = path.join(root, "dados", "campanha-setembro-2026-midias.json");
const affiliateLinksPath = path.join(root, "dados", "campanha-setembro-2026-links-afiliados.json");
const campaignPath = path.join(root, "dados", "campanha-setembro-2026-produtos.json");

let products = readJson(productsPath);
const selection = readJson(selectionPath);
const images = readJson(mediaPath);
const affiliateLinks = readJson(affiliateLinksPath);

if (!Array.isArray(products) || !Array.isArray(selection) || !Array.isArray(images) || !Array.isArray(affiliateLinks)) {
  throw new Error("Catálogo, curadoria, mídia e links precisam ser listas JSON.");
}
if (selection.length !== 29 || images.length !== selection.length || affiliateLinks.length !== selection.length) {
  throw new Error(`Curadoria incompleta: ${selection.length} produtos, ${images.length} imagens e ${affiliateLinks.length} links.`);
}
for (const link of affiliateLinks) {
  if (!/^https:\/\/meli\.la\/[A-Za-z0-9_-]+$/.test(link)) throw new Error(`Link afiliado oficial inválido: ${link}`);
}

// Torna a importação repetível sem acumular os registros criados por este lote.
products = products.filter(product => !String(product.id || "").startsWith("ml-setembro-20260902-"));

const imported = [];
const reused = [];
const campaign = [];

for (let index = 0; index < selection.length; index += 1) {
  const item = { ...selection[index], affiliateLink: affiliateLinks[index] };
  const sourceCode = sourceProductCode(item.sourceUrl);
  const existing = products.find(product => productContainsSourceCode(product, sourceCode));
  if (existing) {
    reused.push({ sourceCode, id: existing.id, name: existing.name || existing.nome || existing.title });
    campaign.push(campaignRecord(existing, item, index + 1, "reutilizado"));
    continue;
  }

  const id = `ml-setembro-20260902-${sourceCode.toLowerCase()}`;
  if (products.some(product => String(product.id) === id)) {
    throw new Error(`ID já existente sem correspondência auditável: ${id}`);
  }

  const image = await downloadImage(images[index], id);
  const product = buildProduct({ ...item, sourceCode, image, id, position: index + 1 });
  products.push(product);
  imported.push({ sourceCode, id, name: product.name });
  campaign.push(campaignRecord(product, item, index + 1, "importado"));
}

writeJson(productsPath, products);
fs.mkdirSync(path.dirname(packageProductsPath), { recursive: true });
writeJson(packageProductsPath, products);
writeJson(campaignPath, {
  generatedAt: reviewedAt,
  timezone: "America/Sao_Paulo",
  source: "Mercado Livre - Central de Afiliados",
  policy: {
    exactProductMediaMatch: true,
    pricesPublished: false,
    priceNotice: "Preço, estoque e frete devem ser confirmados no parceiro.",
    socialLinks: "Cada publicação usa a página curta do produto na Impacto360.",
  },
  imported,
  reused,
  products: campaign,
});

console.log(JSON.stringify({
  selected: selection.length,
  imported: imported.length,
  reused: reused.length,
  catalogTotal: products.length,
  campaignPath,
}, null, 2));

function buildProduct(item) {
  const description = `${item.title} selecionado na Central de Afiliados do Mercado Livre. Confira preço, estoque, frete e condições atualizadas diretamente no parceiro.`;
  const storeId = storeFor(item);
  const brand = brandFor(item.title);
  return {
    id: item.id,
    storeId,
    name: item.title,
    nome: item.title,
    title: item.title,
    brand,
    marca: brand,
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    image: item.image,
    imagemPrincipal: item.image,
    fotoPrincipal: item.image,
    imagem: item.image,
    galeria: [item.image],
    category: item.category,
    categoria: item.category,
    subcategoria: item.category,
    source: "Mercado Livre Afiliados",
    origem: "Mercado Livre - curadoria autenticada",
    partner: "Mercado Livre",
    plataforma: "Mercado Livre",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: "imagem oficial do anúncio exato",
    statusLink: "link_afiliado_preservado_do_painel",
    linkStatus: "link de afiliado do anúncio exato",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    actionType: "buy",
    buttonLabel: "Ver oferta",
    badge: "Seleção Mercado Livre",
    availability: "Confirmar no Mercado Livre",
    disponibilidade: "Confirmar no Mercado Livre",
    price: "",
    preco: "",
    priceStatus: "unverified",
    statusPreco: "consultar_no_parceiro",
    affiliateLink: item.affiliateLink,
    linkAfiliado: item.affiliateLink,
    linkComissionado: item.affiliateLink,
    linkCompra: item.affiliateLink,
    linkPlataforma: item.affiliateLink,
    linkOriginal: item.affiliateLink,
    urlProduto: item.affiliateLink,
    sourceProductLink: item.sourceUrl,
    mercadoLivre: {
      sourceProductCode: item.sourceCode,
      sourceProductUrl: item.sourceUrl,
      generatedAffiliateLink: item.affiliateLink,
      imageSource: images[item.position - 1],
      selectedAt: reviewedAt,
      affiliatePanelVerified: true,
    },
    socialMedia: {
      campaign: "setembro-2026",
      position: item.position,
      videoPolicy: "vídeo vertical derivado exclusivamente da imagem oficial deste anúncio",
    },
    ultimaRevisao: reviewedAt,
    atualizadoEm: reviewedAt,
    publicadoEm: reviewedAt,
  };
}

function campaignRecord(product, item, position, catalogAction) {
  const name = product.name || product.nome || product.title || item.title;
  const image = product.image || product.imagemPrincipal || product.fotoPrincipal || product.imagem;
  const affiliateLink = firstLink(product);
  if (!affiliateLink) throw new Error(`Produto sem link afiliado: ${product.id}`);
  return {
    position,
    date: `2026-09-${String(position + 1).padStart(2, "0")}`,
    productId: product.id,
    title: name,
    category: item.category,
    catalogAction,
    image,
    sourceProductUrl: item.sourceUrl,
    affiliateLink,
    storeUrl: productShortUrl(product),
  };
}

async function downloadImage(url, id) {
  if (!/^https:\/\/http2\.mlstatic\.com\//i.test(url)) {
    throw new Error(`Imagem fora da origem validada: ${url}`);
  }
  const response = await fetch(url, { headers: { "user-agent": "Impacto360CatalogImport/1.0" } });
  if (!response.ok) throw new Error(`Falha ao baixar imagem (${response.status}): ${url}`);
  const contentType = response.headers.get("content-type") || "";
  const ext = contentType.includes("webp") ? ".webp" : contentType.includes("png") ? ".png" : ".jpg";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 8_000) throw new Error(`Imagem pequena ou inválida (${buffer.length} bytes): ${url}`);
  const relative = `public/images/anuncios/campanha-setembro-2026/${id}${ext}`;
  for (const base of [root, path.join(root, "pacote-github-pages-pronto")]) {
    const destination = path.join(base, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, buffer);
  }
  return relative;
}

function sourceProductCode(url) {
  const match = String(url).match(/\/(?:p|up)\/(MLB(?:U)?\d+)/i);
  if (!match) throw new Error(`Código do produto não encontrado: ${url}`);
  return match[1].toUpperCase();
}

function productContainsSourceCode(product, code) {
  return JSON.stringify(product).toUpperCase().includes(code);
}

function firstLink(product) {
  return [product.linkCompra, product.linkAfiliado, product.affiliateLink, product.linkComissionado, product.urlProduto]
    .map(value => String(value || "").trim())
    .find(value => /^https:\/\//i.test(value)) || "";
}

function storeFor(item) {
  if (item.category.startsWith("Bicicletas")) return "impacto-sport";
  if (item.category === "Celulares") return "impacto-mobile";
  if (item.category.startsWith("TVs")) return "impacto-eletronicos";
  if (/lavadora|compressor/i.test(item.title)) return "impacto-auto";
  if (/projetor|fone|watch/i.test(item.title)) return "impacto-eletronicos";
  return "impacto-casa";
}

function brandFor(title) {
  const known = ["Samsung", "Apple", "Xiaomi", "Motorola", "Philco", "LG", "TCL", "JBL", "Elgin", "Nescafé", "Davely", "LTX Fit", "Redfin", "Sevenfit"];
  return known.find(brand => title.toLowerCase().includes(brand.toLowerCase())) || "Consultar no Mercado Livre";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
