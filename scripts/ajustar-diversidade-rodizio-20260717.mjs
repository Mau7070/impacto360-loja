import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const today = "2026-07-17";
const prefix = "amazon-gamer-20260717-";
const bannerPrefix = "banner-amazon-gamer-20260717-";
const adPrefix = "ad-amazon-gamer-20260717-";
const affiliateTag = "910556142-20";

const files = {
  products: path.join(root, "dados", "products.json"),
  packageProducts: path.join(root, "pacote-github-pages-pronto", "dados", "products.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  packageBanners: path.join(root, "pacote-github-pages-pronto", "dados", "banners-anuncios.json"),
  report: path.join(root, "dados", "relatorio-diversidade-rodizio-20260717.json"),
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function firstFilled(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function cleanTitle(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 82 ? `${text.slice(0, 79).trim()}...` : text;
}

function cleanDescription(item) {
  const sub = firstFilled(item, ["subcategoria", "subcategory", "category", "categoria"]) || "Gamer";
  return `Selecionado para o rodizio de ofertas ${sub}. Confira preco, estoque, frete e vendedor diretamente na Amazon antes da compra.`;
}

function affiliateLink(item) {
  const link = firstFilled(item, ["affiliateLink", "linkAfiliado", "linkComissionado", "linkCompra", "linkPlataforma", "urlProduto"]);
  return link.includes(`tag=${affiliateTag}`) ? link : "";
}

function imageLink(item) {
  return firstFilled(item, ["image", "imagemPrincipal", "fotoPrincipal", "imagem", "imageUrl"]);
}

function diversePick(items, limit) {
  const buckets = new Map();
  items.forEach((item, index) => {
    const key = firstFilled(item, ["subcategoria", "subcategory", "storeId", "category", "categoria"]) || "gamer";
    if (!buckets.has(key)) buckets.set(key, { key, index, cursor: 0, items: [] });
    buckets.get(key).items.push(item);
  });
  const ordered = [...buckets.values()].sort((a, b) => a.index - b.index);
  const result = [];
  let added = true;
  while (added && result.length < limit) {
    added = false;
    for (const bucket of ordered) {
      if (result.length >= limit) break;
      if (bucket.cursor >= bucket.items.length) continue;
      result.push(bucket.items[bucket.cursor]);
      bucket.cursor += 1;
      added = true;
    }
  }
  return result;
}

function buildBanner(item, order) {
  const link = affiliateLink(item);
  return {
    id: `${bannerPrefix}${String(item.id).slice(prefix.length)}`,
    productId: item.id,
    storeId: item.storeId,
    image: imageLink(item),
    title: cleanTitle(firstFilled(item, ["name", "nome", "title"])),
    description: cleanDescription(item),
    link,
    active: true,
    order,
    source: "Amazon Associados",
    category: firstFilled(item, ["subcategoria", "subcategory", "category", "categoria"]) || "Gamer",
    rotationGroup: "amazon-gamer-20260717",
    curatedAt: today,
  };
}

function buildAd(item, priority) {
  const link = affiliateLink(item);
  return {
    id: `${adPrefix}${String(item.id).slice(prefix.length)}`,
    priority,
    productId: item.id,
    storeId: item.storeId,
    image: imageLink(item),
    title: cleanTitle(firstFilled(item, ["name", "nome", "title"])),
    description: cleanDescription(item),
    buttonLabel: "Ver oferta na Amazon",
    link,
    startDate: today,
    endDate: "",
    active: true,
    source: "Amazon Associados",
    category: firstFilled(item, ["subcategoria", "subcategory", "category", "categoria"]) || "Gamer",
    rotationGroup: "amazon-gamer-20260717",
  };
}

function updateProducts(file) {
  const products = readJson(file);
  const updated = products.map((item, index) => {
    if (!String(item?.id || "").startsWith(prefix)) return item;
    return {
      ...item,
      homeRotation: true,
      rotationGroup: "amazon-gamer-20260717",
      destaqueHome: true,
      publicarNaHome: true,
      prioridadeHome: index + 1,
      statusLink: "link de afiliado Amazon confirmado com StoreID 910556142-20",
      linkStatus: "link de afiliado Amazon confirmado com StoreID 910556142-20",
      ultimaRevisao: today,
    };
  });
  writeJson(file, updated);
  return updated;
}

const products = updateProducts(files.products);
updateProducts(files.packageProducts);

const amazon = products.filter(item => String(item?.id || "").startsWith(prefix));
const invalid = amazon.filter(item => !affiliateLink(item));
if (invalid.length) {
  throw new Error(`Produtos Amazon gamer sem tag ${affiliateTag}: ${invalid.map(item => item.id).join(", ")}`);
}

const data = readJson(files.banners);
data.settings = { ...(data.settings || {}), bannerRotationMs: 4200, adRotationMs: 3600 };
data.banners = Array.isArray(data.banners) ? data.banners.filter(item => !String(item?.id || "").startsWith(bannerPrefix)) : [];
data.ads = Array.isArray(data.ads) ? data.ads.filter(item => !String(item?.id || "").startsWith(adPrefix)) : [];

const bannerItems = diversePick(amazon, 10).map((item, index) => buildBanner(item, index + 1));
const adItems = diversePick(amazon, amazon.length).map((item, index) => buildAd(item, index + 1));

data.banners = [...bannerItems, ...data.banners].map((item, index) => ({
  ...item,
  order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
}));
data.ads = [...adItems, ...data.ads].map((item, index) => ({
  ...item,
  priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : index + 1,
}));

writeJson(files.banners, data);
writeJson(files.packageBanners, data);

const report = {
  generatedAt: new Date().toISOString(),
  amazonGamerProducts: amazon.length,
  invalidAffiliateLinks: invalid.length,
  bannersAdded: bannerItems.length,
  adsAdded: adItems.length,
  affiliateTag,
  rotationGroup: "amazon-gamer-20260717",
};
writeJson(files.report, report);

console.log(`Amazon gamer com link afiliado confirmado: ${amazon.length}`);
console.log(`Banners adicionados: ${bannerItems.length}`);
console.log(`Ads de rodizio adicionados: ${adItems.length}`);
