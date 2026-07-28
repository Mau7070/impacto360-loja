import fs from "node:fs";
import path from "node:path";
import { quarantineIncompatibleSharedImages } from "./catalog-integrity.mjs";

const root = process.cwd();
const packageRoot = path.join(root, "pacote-github-pages-pronto");
const sourceRoot = path.join(root, "src", "storefront");
const siteUrl = "https://impacto360afiliado.com.br";
const priceValidityDays = Math.max(1, Number(process.env.IMPACTO360_PRICE_VALIDITY_DAYS || 7));
const priceDateFields = [
  "precoAtualizadoEm", "priceUpdatedAt", "ultimaVerificacaoPreco",
  "dataUltimaVerificacao", "ultimaVerificacao", "atualizadoEm",
  "ultimaRevisao", "updatedAt",
];
const allowedAffiliateDomains = new Set([
  "amazon.com.br", "link.amazon", "amzn.to", "meli.la", "s.shopee.com.br", "go.hotmart.com",
]);

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

function html(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function first(item, fields) {
  for (const field of fields) {
    const value = item?.[field];
    if (["string", "number", "boolean"].includes(typeof value) && text(value)) return value;
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
  if (!/^https:\/\//i.test(link)) return false;
  if (/COLOCAR_|placeholder|sem[-_ ]?(foto|imagem)|URL_|LINK_/i.test(link)) return false;
  if (
    /mercadolivre\.com\.br\/(?:loja|ofertas)\//i.test(link)
    || /lista\.mercadolivre\.com\.br/i.test(link)
    || /google\.[^/]+\/search/i.test(link)
  ) return false;
  try {
    const hostname = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
    return [...allowedAffiliateDomains].some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
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
  if (/rascunho|revisao|pendente|duplicado|inativo|quarentena|excluido|removido|oculto|bloqueado/.test(status)) return false;
  if (product?.aprovadoParaPublicacao === false || product?.publicar === false) return false;
  return Boolean(linkOf(product) && imageOf(product));
}

function priceValue(value) {
  const raw = text(value);
  if (!raw || /conferir|consultar|site parceiro|indispon/i.test(raw)) return null;
  const number = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function priceFreshness(product) {
  const rawDate = first(product, priceDateFields);
  const date = rawDate ? new Date(rawDate) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { current: false, status: "unverified", updatedAt: "", validUntil: "" };
  }
  const validUntil = new Date(date.getTime() + priceValidityDays * 86_400_000);
  const current = validUntil.getTime() >= Date.now();
  return {
    current,
    status: current ? "current" : "expired",
    updatedAt: date.toISOString(),
    validUntil: validUntil.toISOString(),
  };
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
  const priceAudit = priceFreshness(product);
  const publicPriceRaw = priceAudit.current ? priceRaw : "";
  const publicPreviousRaw = priceAudit.current ? previousRaw : "";
  const partner = text(first(product, ["origem", "plataformaOrigem", "lojaParceira"]))
    || text(product?.source?.platform)
    || text(product?.source?.name)
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
    price: text(publicPriceRaw),
    priceValue: priceValue(publicPriceRaw),
    previousPrice: text(publicPreviousRaw),
    previousPriceValue: priceValue(publicPreviousRaw),
    priceStatus: priceAudit.status,
    priceUpdatedAt: priceAudit.updatedAt,
    priceValidUntil: priceAudit.validUntil,
    priceValidityDays,
    partner,
    rating: Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null,
    availability: text(first(product, ["disponibilidade", "availability", "estoque"])),
    badge: text(first(product, ["badge", "selo", "etiqueta"])),
    actionType: text(product.actionType),
    offer: Boolean(
      priceValue(publicPreviousRaw) && priceValue(publicPriceRaw) && priceValue(publicPreviousRaw) > priceValue(publicPriceRaw)
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

function routeDocument(template, route, title, description, robots = "index,follow,max-image-preview:large", canonicalRoute = route) {
  const canonical = siteUrl + canonicalRoute;
  const heading = html(title.split(" | ")[0]);
  const safeTitle = html(title);
  const safeDescription = html(description);
  const fallback = `
      <section class="page-hero route-fallback">
        <div class="shell">
          <nav class="breadcrumbs" aria-label="Navegação estrutural"><a href="/">Início</a><span>›</span><span>${heading}</span></nav>
          <h1>${heading}</h1>
          <p>${safeDescription}</p>
        </div>
      </section>`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${safeDescription}">`)
    .replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${robots}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${safeTitle}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${safeDescription}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`)
    .replace("      <!-- ROUTE_FALLBACK -->", fallback.trim());
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
const deduplicatedProducts = deduplicate(
  publishableProducts.map(product => compactProduct(product, productSlugs.get(product.id))),
);
const integrityResult = quarantineIncompatibleSharedImages(deduplicatedProducts);
const compactProducts = integrityResult.accepted;
const template = fs.readFileSync(path.join(sourceRoot, "index.template.html"), "utf8");
const fallback404 = fs.readFileSync(path.join(sourceRoot, "404.template.html"), "utf8");
const css = fs.readFileSync(path.join(sourceRoot, "storefront.css"), "utf8");
const js = fs.readFileSync(path.join(sourceRoot, "storefront.js"), "utf8");

write(path.join(root, "dados", "catalogo-publico.json"), `${JSON.stringify(compactProducts)}\n`);
write(
  path.join(root, "dados", "relatorio-integridade-publicacao.json"),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceProducts: publishableProducts.length,
    deduplicatedProducts: deduplicatedProducts.length,
    publishedProducts: compactProducts.length,
    blockedProducts: integrityResult.blockedIds,
    imageConflicts: integrityResult.conflicts,
  }, null, 2)}\n`,
);
write(path.join(root, "assets", "storefront-excellence.css"), css);
write(path.join(root, "assets", "storefront-excellence.js"), js);
write(path.join(root, "index.html"), template);
write(path.join(root, "impacto360.html"), template);
write(path.join(root, "404.html"), fallback404);

ensureDir(packageRoot);
write(path.join(packageRoot, "dados", "catalogo-publico.json"), `${JSON.stringify(compactProducts)}\n`);
write(
  path.join(packageRoot, "dados", "relatorio-integridade-publicacao.json"),
  read("dados/relatorio-integridade-publicacao.json"),
);
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
  {
    route: "/ofertas/",
    title: "Ofertas selecionadas | Impacto360 Afiliado",
    description: "Ofertas com preço verificado dentro da validade definida; confirme preço, estoque e frete no parceiro.",
  },
  {
    route: "/buscar/imagem/",
    title: "Busca por imagem | Impacto360 Afiliado",
    description: "Use uma imagem e uma descrição textual para iniciar uma pesquisa acessível.",
    robots: "noindex,follow",
  },
  {
    route: "/favoritos/",
    title: "Favoritos | Impacto360 Afiliado",
    description: "Produtos salvos somente neste navegador.",
    robots: "noindex,follow",
  },
  {
    route: "/alertas/",
    title: "Acompanhamento de preço | Impacto360 Afiliado",
    description: "Produtos que você escolheu acompanhar localmente.",
    robots: "noindex,follow",
  },
  {
    route: "/historico/",
    title: "Histórico de visualização | Impacto360 Afiliado",
    description: "Itens visualizados recentemente neste navegador.",
    robots: "noindex,follow",
  },
  {
    route: "/perfil/",
    title: "Perfil e dados | Impacto360 Afiliado",
    description: "Controle preferências e dados mantidos neste navegador.",
    robots: "noindex,follow",
  },
  {
    route: "/acessibilidade/",
    title: "Acessibilidade | Impacto360 Afiliado",
    description: "Ajuste leitura, contraste e movimentos de acordo com sua preferência.",
  },
  {
    route: "/como-comprar/",
    title: "Como comprar | Impacto360 Afiliado",
    description: "Encontre, confira e conclua sua compra no site oficial da loja parceira.",
  },
  {
    route: "/transparencia-de-afiliados/",
    title: "Transparência de afiliados | Impacto360 Afiliado",
    description: "Entenda como os links de afiliado sustentam a curadoria da Impacto360.",
  },
  {
    route: "/privacidade/",
    title: "Política de privacidade | Impacto360 Afiliado",
    description: "Saiba quais dados são usados e controle suas preferências na Impacto360.",
  },
  {
    route: "/cookies/",
    title: "Preferências de cookies | Impacto360 Afiliado",
    description: "Escolha quais finalidades opcionais podem ser usadas neste navegador.",
  },
  {
    route: "/termos/",
    title: "Termos de uso | Impacto360 Afiliado",
    description: "Condições para utilizar a curadoria e os links da Impacto360 Afiliado.",
  },
  {
    route: "/instalar/",
    title: "Instalar aplicativo | Impacto360 Afiliado",
    description: "Instale a Impacto360 como aplicativo quando o navegador oferecer suporte.",
  },
  {
    route: "/politica-de-privacidade/",
    canonical: "/privacidade/",
    title: "Política de privacidade | Impacto360 Afiliado",
    description: "Saiba quais dados são usados e controle suas preferências na Impacto360.",
    robots: "noindex,follow",
  },
  {
    route: "/termos-de-uso/",
    canonical: "/termos/",
    title: "Termos de uso | Impacto360 Afiliado",
    description: "Condições para utilizar a curadoria e os links da Impacto360 Afiliado.",
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
  ["esporte-e-fitness", "Esporte e Fitness"],
  ["moda-e-calcados", "Moda e Calçados"],
  ["ferramentas", "Ferramentas"],
  ["brinquedos-e-escolar", "Brinquedos e Escolar"],
  ["livros-papelaria-e-fe", "Livros, Papelaria e Fé"],
  ["montaria-e-cavalgada", "Montaria e Cavalgada"],
  ["auto-e-moto", "Auto e Moto"],
  ["beleza-e-cuidados", "Beleza e Cuidados"],
  ["pets", "Pets"],
  ["cursos-e-educacao", "Cursos e Educação"],
  ["servicos-digitais", "Serviços Digitais"],
  ["ofertas-e-parceiros", "Ofertas e Parceiros"],
].map(([slug, label]) => ({
  route: `/categoria/${slug}/`,
  title: `${label} | Impacto360 Afiliado`,
  description: `Encontre produtos de ${label.toLowerCase()} selecionados em lojas parceiras da Impacto360.`,
}));

for (const route of [...commercialRoutes, ...categoryRoutes]) {
  const page = routeDocument(template, route.route, route.title, route.description, route.robots, route.canonical);
  write(path.join(root, route.route.replace(/^\/|\/$/g, ""), "index.html"), page);
  write(path.join(packageRoot, route.route.replace(/^\/|\/$/g, ""), "index.html"), page);
}

for (const relative of [
  "dados/stores.json",
  "dados/relatorio-integridade-publicacao.json",
  "favicon.svg",
  "manifest.webmanifest",
  "sw.js",
  "CNAME",
  ".nojekyll",
  "integracoes/impacto360-google-ads.js",
  "integracoes/impacto360-admin-robos.js",
  "integracoes/impacto360-banners-admin.js",
]) copyStatic(relative);

updateSitemap(
  [...commercialRoutes, ...categoryRoutes]
    .filter(item => !String(item.robots || "").startsWith("noindex"))
    .map(item => item.route),
);

console.log(JSON.stringify({
  productsSource: readJson("dados/products.json").length,
  productsPublic: compactProducts.length,
  stores: stores.length,
  catalogBytes: fs.statSync(path.join(root, "dados", "catalogo-publico.json")).size,
  htmlBytes: fs.statSync(path.join(root, "index.html")).size,
  routes: commercialRoutes.length + categoryRoutes.length,
  priceValidityDays,
  productsBlockedByImageIntegrity: integrityResult.blockedIds.length,
}, null, 2));
