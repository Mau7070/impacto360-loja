import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const mlApiDir = path.join(root, "ml-api");

const files = {
  links: path.join(root, "dados", "mercado-livre-links.json"),
  productsRoot: path.join(root, "dados", "products.json"),
  productsPackage: path.join(packageDir, "dados", "products.json"),
  importedRoot: path.join(root, "dados", "importedMercadoLivreProducts.json"),
  importedPackage: path.join(packageDir, "dados", "importedMercadoLivreProducts.json"),
  enrichedRoot: path.join(root, "dados", "enrichedMercadoLivreProducts.json"),
  enrichedPackage: path.join(packageDir, "dados", "enrichedMercadoLivreProducts.json"),
};

function readJson(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function moedaBrasil(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Consultar";
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function component(card, type) {
  const raw = card.components?.find((item) => item.type === type);
  return raw?.[type];
}

function pictureUrl(card) {
  const id = card.pictures?.pictures?.[0]?.id;
  if (!id) return "public/placeholder-produto-mercado-livre.svg";
  return `https://http2.mlstatic.com/D_Q_NP_${id}-AB.webp`;
}

function loadSavedCards() {
  if (!fs.existsSync(mlApiDir)) return [];
  const pageFiles = fs.readdirSync(mlApiDir)
    .filter((name) => /^page-\d+\.json$/i.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));

  const cards = [];
  for (const pageFile of pageFiles) {
    const data = readJson(path.join(mlApiDir, pageFile), {});
    const pageCards = data.item?.polycards || data.polycards || [];
    cards.push(...pageCards);
  }
  return cards;
}

function inferSubcategory(title) {
  const text = title.toLowerCase();
  if (/notebook|laptop|vaio|ideapad|dell|lenovo|acer|asus/.test(text)) return "Notebooks";
  if (/impressora|ecotank|multifuncional/.test(text)) return "Impressoras";
  if (/monitor|tela/.test(text)) return "Monitores";
  if (/mouse/.test(text)) return "Mouses";
  if (/teclado/.test(text)) return "Teclados";
  if (/headset|fone/.test(text)) return "Headsets";
  if (/ssd|hd|armazenamento/.test(text)) return "SSD e HD";
  if (/tv|smart tv|eletronico|eletrônico/.test(text)) return "Eletronicos";
  return "Produtos diversos";
}

function cardToEnriched(card, affiliateLink, index) {
  const title = component(card, "title")?.text || `Produto Mercado Livre ${String(index + 1).padStart(3, "0")}`;
  const brand = component(card, "brand")?.text || "Informacao nao especificada pelo fornecedor";
  const priceData = component(card, "price") || {};
  const currentPrice = priceData.current_price?.value;
  const previousPrice = priceData.previous_price?.value;
  const shipping = component(card, "shipping")?.text || "";
  const reviews = component(card, "reviews") || {};
  const highlight = component(card, "highlight")?.text?.replace(/\{[^}]+\}/g, "").trim();
  const itemId = card.metadata?.id || "";
  const publicUrl = card.metadata?.url ? `https://${card.metadata.url}` : "";
  const subcategory = inferSubcategory(title);
  const image = pictureUrl(card);

  const descriptionParts = [
    `${title}.`,
    brand !== "Informacao nao especificada pelo fornecedor" ? `Marca: ${brand}.` : "",
    currentPrice ? `Preco registrado na lista salva: ${moedaBrasil(currentPrice)}.` : "",
    shipping ? `${shipping}.` : "",
    reviews.rating_average ? `Avaliacao media ${reviews.rating_average} de 5 com ${reviews.total || 0} avaliacoes.` : "",
  ].filter(Boolean);

  return {
    id: `mercado-livre-produto-${String(index + 1).padStart(3, "0")}`,
    name: title,
    title,
    slug: slugify(title),
    brand,
    marca: brand,
    category: "Computadores e Informatica",
    categoria: "Computadores e Informatica",
    subcategoria: subcategory,
    storeId: "impacto-tech-computadores",
    description: descriptionParts.join(" "),
    descricaoCurta: descriptionParts.join(" ").slice(0, 260),
    descricaoDetalhada: `${descriptionParts.join(" ")} Descricao completa oficial ainda depende de nova consulta a API publica do Mercado Livre.`,
    price: moedaBrasil(currentPrice),
    preco: moedaBrasil(currentPrice),
    precoAnterior: previousPrice ? moedaBrasil(previousPrice) : null,
    precoPromocional: previousPrice ? moedaBrasil(currentPrice) : null,
    image,
    imagemPrincipal: image,
    galeria: [image],
    imagens: [image],
    videos: [],
    videoId: "",
    videoUrl: "",
    itemId,
    mercadoLivreId: itemId,
    linkFinal: publicUrl,
    linkOriginal: affiliateLink,
    affiliateLink,
    link_afiliado: affiliateLink,
    permalinkPublico: publicUrl,
    source: "Mercado Livre",
    origem: "Mercado Livre",
    status: "ativo",
    condition: "Informacao nao especificada pelo fornecedor",
    condicao: "Informacao nao especificada pelo fornecedor",
    estoque: "Consultar disponibilidade",
    garantia: "Informacao nao especificada pelo fornecedor",
    warranty: "Informacao nao especificada pelo fornecedor",
    especificacoes: {
      marca: brand,
      subcategoria: subcategory,
      frete: shipping || "Informacao nao especificada pelo fornecedor",
      avaliacao: reviews.rating_average ? `${reviews.rating_average} de 5` : "Informacao nao especificada pelo fornecedor",
      totalAvaliacoes: reviews.total || "Informacao nao especificada pelo fornecedor",
      garantia: "Informacao nao especificada pelo fornecedor",
    },
    specs: [
      brand !== "Informacao nao especificada pelo fornecedor" ? `Marca: ${brand}` : "Marca nao informada",
      shipping || "Consultar frete",
      reviews.rating_average ? `Avaliacao: ${reviews.rating_average}/5` : "Avaliacao nao informada",
    ],
    seo: {
      titulo: `${title} | IMPACTO TECH COMPUTADORES`,
      descricao: descriptionParts.join(" ").slice(0, 155),
      palavrasChave: ["mercado livre", "informatica", subcategory, brand, title].filter(Boolean),
    },
    destaques: [
      "Dados recuperados da lista Mercado Livre salva",
      "Link de comissao original preservado",
      "Comprar no Mercado Livre",
    ],
    badge: highlight || (previousPrice ? "Oferta Mercado Livre" : "Mercado Livre"),
    observation: "Dados aplicados a partir de arquivo local salvo da lista Mercado Livre. Descricao completa e videos dependem de acesso a API ao vivo.",
    updatedAt: new Date().toISOString(),
  };
}

function mergeByLink(products, enriched) {
  const byLink = new Map(enriched.map((item) => [item.affiliateLink, item]));
  return products.map((product) => {
    const next = byLink.get(product.affiliateLink);
    if (!next) return product;
    return { ...product, ...next, affiliateLink: product.affiliateLink, linkOriginal: product.affiliateLink };
  });
}

function main() {
  const cards = loadSavedCards();
  const links = readJson(files.links, [])
    .map((item) => item.affiliateLink)
    .filter((link) => link && link.includes("meli.la"));

  if (!cards.length) throw new Error("Nenhum card salvo encontrado em ml-api/page-*.json");
  if (!links.length) throw new Error("Nenhum link meli.la encontrado em dados/mercado-livre-links.json");

  const count = Math.min(cards.length, links.length);
  const enriched = [];
  for (let index = 0; index < count; index += 1) {
    enriched.push(cardToEnriched(cards[index], links[index], index));
  }

  const rootProducts = readJson(files.productsRoot, []);
  const packageProducts = readJson(files.productsPackage, rootProducts);
  const rootImported = readJson(files.importedRoot, []);
  const packageImported = readJson(files.importedPackage, rootImported);

  writeJson(files.enrichedRoot, enriched);
  writeJson(files.enrichedPackage, enriched);
  writeJson(files.productsRoot, mergeByLink(rootProducts, enriched));
  writeJson(files.productsPackage, mergeByLink(packageProducts, enriched));
  writeJson(files.importedRoot, mergeByLink(rootImported, enriched));
  writeJson(files.importedPackage, mergeByLink(packageImported, enriched));

  console.log(`Dados locais aplicados: ${enriched.length} produtos atualizados com nome, preco e imagem da lista salva.`);
  if (links.length > cards.length) {
    console.log(`Aviso: ${links.length - cards.length} links ficaram sem card local salvo.`);
  }
}

main();
