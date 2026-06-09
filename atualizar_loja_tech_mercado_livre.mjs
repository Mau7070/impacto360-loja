import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const rootProductsFile = path.join(root, "dados", "products.json");
const packageProductsFile = path.join(packageDir, "dados", "products.json");
const rootImportedFile = path.join(root, "dados", "importedMercadoLivreProducts.json");
const packageImportedFile = path.join(packageDir, "dados", "importedMercadoLivreProducts.json");
const rootEnrichedFile = path.join(root, "dados", "enrichedMercadoLivreProducts.json");
const packageEnrichedFile = path.join(packageDir, "dados", "enrichedMercadoLivreProducts.json");
const publicImageDirs = [
  path.join(root, "public", "produtos", "mercado-livre"),
  path.join(packageDir, "public", "produtos", "mercado-livre"),
];

const USER_AGENT = "Impacto360Afiliado/1.0 (+https://impacto360afiliado.com.br)";

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
  if (value === null || value === undefined || value === "") return "Consultar";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resumir(text, limit = 420) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Informacao nao especificada pelo fornecedor.";
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).replace(/\s+\S*$/, "")}...`;
}

function normalizeAttributeName(value) {
  return slugify(value).replace(/-/g, "_");
}

function attributesToObject(attributes = []) {
  const result = {};
  for (const attribute of attributes) {
    const key = normalizeAttributeName(attribute.name || attribute.id || "");
    if (!key) continue;
    result[key] = attribute.value_name || attribute.value_struct?.number || "Informacao nao especificada pelo fornecedor";
  }
  return result;
}

function specsFromAttributes(attributes = []) {
  const specs = [];
  for (const attribute of attributes) {
    if (!attribute.name || !attribute.value_name) continue;
    specs.push(`${attribute.name}: ${attribute.value_name}`);
    if (specs.length >= 4) break;
  }
  return specs.length ? specs : ["Dados oficiais Mercado Livre", "Link de comissao preservado", "Loja de computadores"];
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "pt-BR,pt;q=0.9",
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveAffiliateLink(url) {
  const response = await fetchWithTimeout(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Falha ao resolver link: HTTP ${response.status}`);
  return response.url;
}

function extractItemId(url) {
  const patterns = [
    /(MLB-?\d+)/i,
    /\/p\/(MLB\d+)/i,
    /itemId=(MLB\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = String(url).match(pattern);
    if (match) return match[1].replace("-", "").toUpperCase();
  }
  throw new Error("Nao encontrei o codigo MLB no link final.");
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API Mercado Livre retornou HTTP ${response.status}`);
  return response.json();
}

function extensionFromContentType(contentType = "") {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}

async function downloadPicture(url, baseName, index) {
  if (!url) return "";
  const response = await fetchWithTimeout(url, {}, 30000);
  if (!response.ok) throw new Error(`Falha ao baixar imagem: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const ext = extensionFromContentType(response.headers.get("content-type") || "");
  const fileName = `${baseName}-${String(index + 1).padStart(2, "0")}${ext}`;

  for (const dir of publicImageDirs) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, fileName), bytes);
  }

  return `public/produtos/mercado-livre/${fileName}`;
}

async function downloadPictures(item, baseName) {
  const pictures = Array.isArray(item.pictures) ? item.pictures.slice(0, 8) : [];
  const urls = pictures.map((picture) => picture.secure_url || picture.url).filter(Boolean);
  if (!urls.length && item.secure_thumbnail) urls.push(item.secure_thumbnail);
  if (!urls.length && item.thumbnail) urls.push(item.thumbnail);

  const saved = [];
  for (let index = 0; index < urls.length; index += 1) {
    try {
      saved.push(await downloadPicture(urls[index], baseName, index));
    } catch (error) {
      console.warn(`Imagem nao baixada (${urls[index]}): ${error.message}`);
    }
  }
  return saved.filter(Boolean);
}

function videoData(item) {
  if (!item.video_id) return [];
  return [{
    type: "mercado_livre",
    id: item.video_id,
    url: `https://www.youtube.com/watch?v=${item.video_id}`,
  }];
}

async function getOfficialProductData(product) {
  const affiliateLink = product.affiliateLink;
  const finalUrl = await resolveAffiliateLink(affiliateLink);
  const itemId = extractItemId(finalUrl);
  const item = await fetchJson(`https://api.mercadolibre.com/items/${itemId}`);
  let descriptionText = "";
  try {
    const description = await fetchJson(`https://api.mercadolibre.com/items/${itemId}/description`);
    descriptionText = description.plain_text || "";
  } catch (error) {
    descriptionText = "";
  }

  const baseName = slugify(`${itemId}-${item.title || product.id}`).slice(0, 100);
  const images = await downloadPictures(item, baseName);
  const title = item.title || product.name || "Produto Mercado Livre";
  const attributes = Array.isArray(item.attributes) ? item.attributes : [];
  const specsObject = attributesToObject(attributes);
  const specs = specsFromAttributes(attributes);
  const warranty = item.warranty || specsObject.garantia || "Informacao nao especificada pelo fornecedor";
  const categoryId = item.category_id || "";

  return {
    ...product,
    name: title,
    title,
    slug: slugify(title),
    brand: specsObject.marca || specsObject.brand || "Informacao nao especificada pelo fornecedor",
    marca: specsObject.marca || specsObject.brand || "Informacao nao especificada pelo fornecedor",
    category: "Computadores e Informatica",
    categoria: "Computadores e Informatica",
    subcategoria: categoryId || product.subcategoria || "Informatica",
    description: resumir(descriptionText || item.subtitle || title),
    descricaoCurta: resumir(descriptionText || item.subtitle || title, 220),
    descricaoDetalhada: descriptionText || "Informacao nao especificada pelo fornecedor.",
    price: moedaBrasil(item.price),
    preco: moedaBrasil(item.price),
    precoPromocional: item.original_price ? moedaBrasil(item.price) : null,
    precoAnterior: item.original_price ? moedaBrasil(item.original_price) : null,
    image: images[0] || product.image,
    imagemPrincipal: images[0] || product.imagemPrincipal || product.image,
    galeria: images,
    imagens: images,
    videos: videoData(item),
    videoId: item.video_id || "",
    videoUrl: item.video_id ? `https://www.youtube.com/watch?v=${item.video_id}` : "",
    itemId,
    mercadoLivreId: itemId,
    linkFinal: finalUrl,
    linkOriginal: affiliateLink,
    affiliateLink,
    link_afiliado: affiliateLink,
    permalinkPublico: item.permalink || "",
    source: "Mercado Livre",
    origem: "Mercado Livre",
    status: "ativo",
    condition: item.condition || "Informacao nao especificada pelo fornecedor",
    condicao: item.condition || "Informacao nao especificada pelo fornecedor",
    estoque: typeof item.available_quantity === "number" ? `${item.available_quantity} unidade(s) informada(s)` : "Consultar disponibilidade",
    garantia: warranty,
    warranty,
    especificacoes: {
      processador: specsObject.processador || specsObject.cpu || "Informacao nao especificada pelo fornecedor",
      memoriaRam: specsObject.memoria_ram || specsObject.ram || "Informacao nao especificada pelo fornecedor",
      armazenamento: specsObject.armazenamento || specsObject.disco_rigido || specsObject.ssd || "Informacao nao especificada pelo fornecedor",
      placaVideo: specsObject.placa_de_video || specsObject.gpu || "Informacao nao especificada pelo fornecedor",
      tela: specsObject.tamanho_da_tela || specsObject.tela || "Informacao nao especificada pelo fornecedor",
      sistemaOperacional: specsObject.sistema_operacional || "Informacao nao especificada pelo fornecedor",
      garantia: warranty,
      ...specsObject,
    },
    specs,
    seo: {
      titulo: `${title} | IMPACTO TECH COMPUTADORES`,
      descricao: resumir(descriptionText || title, 155),
      palavrasChave: ["informatica", "computadores", "mercado livre", title].filter(Boolean),
    },
    destaques: ["Dados oficiais via API publica do Mercado Livre", "Link de comissao preservado", "Comprar no Mercado Livre"],
    badge: item.original_price ? "Oferta Mercado Livre" : "Mercado Livre",
    observation: "",
    updatedAt: new Date().toISOString(),
  };
}

function mergeByAffiliateLink(products, enrichedProducts) {
  const byLink = new Map(enrichedProducts.map((item) => [item.affiliateLink, item]));
  return products.map((product) => {
    const enriched = byLink.get(product.affiliateLink);
    return enriched ? { ...product, ...enriched, affiliateLink: product.affiliateLink, linkOriginal: product.affiliateLink } : product;
  });
}

async function main() {
  const allProducts = readJson(packageProductsFile, readJson(rootProductsFile, []));
  const targets = allProducts.filter((product) =>
    product.storeId === "impacto-tech-computadores" &&
    product.source === "Mercado Livre" &&
    product.affiliateLink
  );

  if (!targets.length) {
    console.log("Nenhum produto Mercado Livre encontrado na IMPACTO TECH COMPUTADORES.");
    return;
  }

  const previousEnriched = readJson(rootEnrichedFile, []);
  const enrichedByLink = new Map(previousEnriched.map((item) => [item.affiliateLink, item]));
  const errors = [];

  for (let index = 0; index < targets.length; index += 1) {
    const product = targets[index];
    process.stdout.write(`[${index + 1}/${targets.length}] ${product.affiliateLink} ... `);
    try {
      const enriched = await getOfficialProductData(product);
      enrichedByLink.set(product.affiliateLink, enriched);
      console.log("ok");
    } catch (error) {
      errors.push({ affiliateLink: product.affiliateLink, error: error.message });
      console.log(`falhou: ${error.message}`);
    }
  }

  const enrichedProducts = [...enrichedByLink.values()];
  const nextProducts = mergeByAffiliateLink(allProducts, enrichedProducts);
  const importedRoot = readJson(rootImportedFile, []);
  const importedPackage = readJson(packageImportedFile, importedRoot);
  const nextImported = mergeByAffiliateLink(importedPackage, enrichedProducts);

  writeJson(rootEnrichedFile, enrichedProducts);
  writeJson(packageEnrichedFile, enrichedProducts);
  writeJson(rootProductsFile, nextProducts);
  writeJson(packageProductsFile, nextProducts);
  writeJson(rootImportedFile, nextImported);
  writeJson(packageImportedFile, nextImported);
  writeJson(path.join(root, "dados", "mercado-livre-update-errors.json"), errors);
  writeJson(path.join(packageDir, "dados", "mercado-livre-update-errors.json"), errors);

  console.log(`Atualizacao concluida. Enriquecidos: ${enrichedProducts.length}. Falhas nesta execucao: ${errors.length}.`);
  if (errors.length) {
    console.log("Veja dados/mercado-livre-update-errors.json para revisar links bloqueados ou invalidos.");
  }
}

main().catch((error) => {
  console.error(`Erro geral: ${error.message}`);
  process.exitCode = 1;
});

