import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageRoot = path.join(root, "pacote-github-pages-pronto");
const sourceRoot = path.join(root, "src", "storefront");
const siteUrl = "https://impacto360afiliado.com.br";

const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = relative => JSON.parse(read(relative));
const ensureDir = dir => fs.mkdirSync(dir, { recursive: true });
const write = (file, contents) => {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, contents, "utf8");
};

function text(value) {
  return String(value ?? "").trim();
}

function first(item, fields) {
  for (const field of fields) {
    const value = item?.[field];
    if (value !== undefined && value !== null && text(value)) return value;
  }
  return "";
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

const linkFields = [
  "linkCompra", "linkAfiliado", "affiliateLink", "linkComissionado",
  "linkPlataforma", "link_original_afiliado", "urlProduto", "url",
];

const imageFields = [
  "fotoPrincipal", "imagemPrincipal", "imagem", "image", "imageUrl",
  "thumbnail", "foto", "productImage", "src",
];

function usableLink(value) {
  const link = text(value);
  if (!/^https?:\/\//i.test(link)) return false;
  if (/COLOCAR_|placeholder|sem[-_ ]?(foto|imagem)|URL_|LINK_/i.test(link)) return false;
  if (/mercadolivre\.com\.br\/loja\//i.test(link) || /lista\.mercadolivre\.com\.br/i.test(link)) return false;
  return true;
}

function linkOf(product) {
  return linkFields.map(field => product?.[field]).find(usableLink) || "";
}

function imageCandidates(product) {
  return [
    ...imageFields.map(field => product?.[field]),
    ...(Array.isArray(product?.galeria) ? product.galeria : []),
    ...(Array.isArray(product?.fotosExtras) ? product.fotosExtras : []),
    ...(Array.isArray(product?.images) ? product.images : []),
  ].map(text).filter(Boolean);
}

function usableImage(value) {
  const image = text(value);
  if (!image || /COLOCAR_|foto preservada|imagem pendente|placeholder quebrado|placeholder|sem[-_ ]?(foto|imagem)|no[-_ ]?image/i.test(image)) return false;
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return true;
  return fs.existsSync(path.join(root, image.replace(/^\/+/, "")));
}

function imageOf(product) {
  return imageCandidates(product).find(usableImage) || "";
}

function publishable(product) {
  const status = normalize(first(product, ["status", "statusPublicacao", "auditoriaPublicacao", "statusAnuncio"]));
  if (/rascunho|revisao|pendente|duplicado|inativo|excluido|removido|oculto|bloqueado/.test(status)) return false;
  if (product?.aprovadoParaPublicacao === false || product?.publicar === false) return false;
  return Boolean(linkOf(product) && imageOf(product));
}

function priceValue(value) {
  const raw = text(value);
  if (!raw || /conferir|consultar|site parceiro|indispon/i.test(raw)) return null;
  const number = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function list(value) {
  if (Array.isArray(value)) {
    return value.flatMap(item => (
      item && typeof item === "object"
        ? Object.values(item).filter(inner => ["string", "number"].includes(typeof inner)).map(text)
        : [text(item)]
    )).filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.values(value)
      .filter(inner => ["string", "number"].includes(typeof inner))
      .map(text)
      .filter(Boolean);
  }
  return text(value).split(/[,;|]/).map(text).filter(Boolean);
}

function buildProductSlugs(products) {
  const used = new Map();
  const slugs = new Map();
  for (const product of products) {
    const name = text(first(product, ["name", "nome", "title"]));
    const base = slugify(name || product.id) || text(product.id) || "produto";
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    slugs.set(product.id, count ? `${base}-${product.id}` : base);
  }
  return slugs;
}

function compactProduct(product, generatedSlug) {
  const name = text(first(product, ["name", "nome", "title"]));
  const description = text(first(product, ["descricaoCurta", "description", "descricao", "textoCatalogo"])).replace(/\s+/g, " ").slice(0, 360);
  const category = text(first(product, ["category", "categoria", "departamento"]));
  const subcategory = text(first(product, ["subcategoria", "subcategory", "tipoProduto"]));
  const brand = text(first(product, ["brand", "marca", "fabricante"]));
  const model = text(first(product, ["model", "modelo"]));
  const specs = [
    ...list(product?.tags),
    ...list(product?.keywords),
    ...list(product?.palavrasChave),
    ...list(product?.specs),
    ...list(product?.beneficios),
  ].slice(0, 16);
  // The same deterministic route rule used by gerar-paginas-produtos.mjs.
  // Legacy `product.slug` values are not trusted because older imports could
  // contain truncated or misencoded slugs even when the generated page is valid.
  const slug = generatedSlug || slugify(name || product.id);
  const priceRaw = first(product, ["price", "preco", "precoPromocional", "precoAtual"]);
  const previousRaw = first(product, ["precoAnterior", "oldPrice", "priceBefore", "precoOriginal"]);
  const partner = text(first(product, ["source", "origem", "plataformaOrigem", "lojaParceira"]))
    || text(product?.marketplace?.platform);
  const rating = Number.parseFloat(String(first(product, ["rating", "nota", "reviewRating", "avaliacao"])).replace(",", "."));
  return {
    id: text(product.id),
    storeId: text(product.storeId),
    name,
    description,
    category,
    subcategory,
    brand,
    model,
    tags: specs,
    image: imageOf(product),
    link: linkOf(product),
    price: text(priceRaw),
    priceValue: priceValue(priceRaw),
    previousPrice: text(previousRaw),
    previousPriceValue: priceValue(previousRaw),
    partner,
    rating: Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null,
    availability: text(first(product, ["disponibilidade", "availability", "estoque"])),
    badge: text(first(product, ["badge", "selo", "etiqueta"])),
    actionType: text(product.actionType),
    offer: Boolean(
      priceValue(previousRaw) && priceValue(priceRaw) && priceValue(previousRaw) > priceValue(priceRaw)
      || /oferta|promo|desconto/i.test([product.badge, product.storeId, category].join(" "))
    ),
    featured: product?.destaqueHome === true || product?.publicarNaHome === true,
    publishedAt: text(first(product, ["publicadoEm", "createdAt", "dataPublicacao"])),
    updatedAt: text(first(product, ["atualizadoEm", "ultimaRevisao", "updatedAt"])),
    slug,
  };
}

function deduplicate(products) {
  const links = new Set();
  const ids = new Set();
  return products.filter(product => {
    const linkKey = normalize(product.link.replace(/#.*$/, ""));
    if (!product.id || ids.has(product.id) || !linkKey || links.has(linkKey)) return false;
    ids.add(product.id);
    links.add(linkKey);
    return true;
  });
}

function routeDocument(template, route, title, description, robots = "index,follow,max-image-preview:large") {
  const canonical = siteUrl + route;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${robots}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`);
}

function copyStatic(relative) {
  const source = path.join(root, relative);
  const destination = path.join(packageRoot, relative);
  if (!fs.existsSync(source)) return;
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function updateSitemap(routes) {
  for (const base of [root, packageRoot]) {
    const file = path.join(base, "sitemap.xml");
    if (!fs.existsSync(file)) continue;
    let xml = fs.readFileSync(file, "utf8");
    for (const route of routes) {
      const loc = `${siteUrl}${route}`;
      if (xml.includes(`<loc>${loc}</loc>`)) continue;
      xml = xml.replace("</urlset>", `  <url><loc>${loc}</loc></url>\n</urlset>`);
    }
    write(file, xml);
  }
}

const stores = readJson("dados/stores.json");
const publishableProducts = readJson("dados/products.json").filter(publishable);
const productSlugs = buildProductSlugs(publishableProducts);
const compactProducts = deduplicate(
  publishableProducts.map(product => compactProduct(product, productSlugs.get(product.id))),
);
const template = fs.readFileSync(path.join(sourceRoot, "index.template.html"), "utf8");
const fallback404 = fs.readFileSync(path.join(sourceRoot, "404.template.html"), "utf8");
const css = fs.readFileSync(path.join(sourceRoot, "storefront.css"), "utf8");
const js = fs.readFileSync(path.join(sourceRoot, "storefront.js"), "utf8");

write(path.join(root, "dados", "catalogo-publico.json"), `${JSON.stringify(compactProducts)}\n`);
write(path.join(root, "assets", "storefront-excellence.css"), css);
write(path.join(root, "assets", "storefront-excellence.js"), js);
write(path.join(root, "index.html"), template);
write(path.join(root, "impacto360.html"), template);
write(path.join(root, "404.html"), fallback404);

ensureDir(packageRoot);
write(path.join(packageRoot, "dados", "catalogo-publico.json"), `${JSON.stringify(compactProducts)}\n`);
write(path.join(packageRoot, "assets", "storefront-excellence.css"), css);
write(path.join(packageRoot, "assets", "storefront-excellence.js"), js);
write(path.join(packageRoot, "index.html"), template);
write(path.join(packageRoot, "404.html"), fallback404);

const commercialRoutes = [
  {
    route: "/lojas/",
    title: "Lojas do Shopping | Impacto360 Afiliado",
    description: "Conheça as 26 lojas e serviços organizados por alas no shopping virtual Impacto360.",
  },
  {
    route: "/buscar/",
    title: "Buscar produtos | Impacto360 Afiliado",
    description: "Pesquise produtos, marcas, categorias e lojas no catálogo da Impacto360.",
    robots: "noindex,follow",
  },
  ...stores.map(store => ({
    route: `/loja/${store.id}/`,
    title: `${text(store.name)} | Impacto360 Afiliado`,
    description: text(store.description).slice(0, 155) || `Conheça a loja ${text(store.name)} na Impacto360 Afiliado.`,
  })),
];

const categoryRoutes = [
  ["celulares-e-tecnologia", "Celulares e Tecnologia"],
  ["casa-e-cozinha", "Casa e Cozinha"],
  ["eletrodomesticos", "Eletrodomésticos"],
  ["games-e-setup", "Games e Setup"],
  ["moda-e-calcados", "Moda e Calçados"],
  ["ferramentas", "Ferramentas"],
  ["brinquedos-e-escolar", "Brinquedos e Escolar"],
  ["montaria-e-cavalgada", "Montaria e Cavalgada"],
].map(([slug, label]) => ({
  route: `/categoria/${slug}/`,
  title: `${label} | Impacto360 Afiliado`,
  description: `Encontre produtos de ${label.toLowerCase()} selecionados em lojas parceiras da Impacto360.`,
}));

for (const route of [...commercialRoutes, ...categoryRoutes]) {
  const page = routeDocument(template, route.route, route.title, route.description, route.robots);
  write(path.join(root, route.route.replace(/^\/|\/$/g, ""), "index.html"), page);
  write(path.join(packageRoot, route.route.replace(/^\/|\/$/g, ""), "index.html"), page);
}

for (const relative of [
  "dados/stores.json",
  "favicon.svg",
  "CNAME",
  ".nojekyll",
  "integracoes/impacto360-google-ads.js",
  "integracoes/impacto360-admin-robos.js",
]) copyStatic(relative);

updateSitemap([...commercialRoutes, ...categoryRoutes].map(item => item.route));

console.log(JSON.stringify({
  productsSource: readJson("dados/products.json").length,
  productsPublic: compactProducts.length,
  stores: stores.length,
  catalogBytes: fs.statSync(path.join(root, "dados", "catalogo-publico.json")).size,
  htmlBytes: fs.statSync(path.join(root, "index.html")).size,
  routes: commercialRoutes.length + categoryRoutes.length,
}, null, 2));
