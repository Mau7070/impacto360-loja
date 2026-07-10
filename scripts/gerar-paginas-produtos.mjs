import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteUrl = "https://impacto360afiliado.com.br";
const outputRoots = [root, path.join(root, "pacote-github-pages-pronto")];

const linkFields = [
  "linkCompra",
  "linkAfiliado",
  "affiliateLink",
  "linkComissionado",
  "linkPlataforma",
  "link_original_afiliado",
  "linkOriginal",
  "urlProduto",
  "url",
];

const imageFields = ["fotoPrincipal", "imagemPrincipal", "image", "imagem", "thumbnail"];
const ratingFields = ["avaliacao", "rating", "reviewRating", "nota"];
const availabilityFields = ["disponibilidade", "estoque", "statusDisponibilidade"];
const lastCheckFields = ["ultimaVerificacao", "ultimaRevisao", "lastChecked", "dataUltimaVerificacao"];
let productSlugById = new Map();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function firstFilled(item, fields) {
  for (const field of fields) {
    const value = item?.[field];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function getProductLink(product) {
  return firstFilled(product, linkFields);
}

function isUsableLink(link) {
  const value = String(link || "").trim();
  if (!value || value === "COLOCAR_LINK_AQUI" || value.startsWith("COLOCAR_")) return false;
  if (/placeholder|sem[-_ ]?(foto|imagem)|URL_|LINK_/i.test(value)) return false;
  if (/mercadolivre\.com\.br\/loja\//i.test(value) || /lista\.mercadolivre\.com\.br/i.test(value)) return false;
  return /^https?:\/\//i.test(value);
}

function getProductImage(product) {
  const gallery = Array.isArray(product?.galeria) ? product.galeria : [];
  const extras = Array.isArray(product?.fotosExtras) ? product.fotosExtras : [];
  const candidates = [
    ...imageFields.map(field => product?.[field]),
    gallery[0],
    extras[0],
  ].map(value => String(value || "").trim());
  return candidates.find(value => value && !/placeholder|sem[-_ ]?(foto|imagem)|no[-_ ]?image/i.test(value)) || "";
}

function productIsPublishable(product) {
  return String(product.status || "").toLowerCase() === "ativo"
    && product.aprovadoParaPublicacao !== false
    && isUsableLink(getProductLink(product))
    && Boolean(getProductImage(product));
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

function webPath(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^https?:\/\//i.test(source)) return source;
  return siteUrl + "/" + source.replace(/^\/+/, "");
}

function numericPrice(value) {
  const raw = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? number.toFixed(2) : "";
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
    .slice(0, 96);
}

function buildProductSlugs(products) {
  const used = new Map();
  productSlugById = new Map();
  for (const product of products) {
    const title = firstFilled(product, ["name", "nome"]) || product.id;
    const base = slugify(title) || String(product.id || "produto");
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    productSlugById.set(product.id, count ? `${base}-${product.id}` : base);
  }
}

function productSlug(product) {
  return productSlugById.get(product.id) || slugify(firstFilled(product, ["name", "nome"])) || product.id;
}

function productUrl(product) {
  return `${siteUrl}/produto/${encodeURIComponent(productSlug(product))}/`;
}

function productPageSlugs(product) {
  return [...new Set([productSlug(product), product.id].filter(Boolean).map(value => String(value)))];
}

function ratingSchemaValue(value) {
  const match = String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  const number = Number(match[0]);
  return Number.isFinite(number) && number > 0 && number <= 5 ? String(number) : "";
}

function positiveInteger(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  const number = Number(digits);
  return Number.isInteger(number) && number > 0 ? String(number) : "";
}

function reviewCountValue(product) {
  return positiveInteger(firstFilled(product, [
    "reviewCount",
    "review_count",
    "quantidadeAvaliacoes",
    "totalAvaliacoes",
    "avaliacoesTotal",
    "numeroAvaliacoes",
    "opinioes",
    "opinions",
  ]));
}

function schemaAvailability(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (/indisponivel|esgotado|fora de estoque|sem estoque/.test(normalized)) return "https://schema.org/OutOfStock";
  if (/pre venda|pre-venda|sob encomenda/.test(normalized)) return "https://schema.org/PreOrder";
  if (/ultima unidade|ultimas unidades|limitad/.test(normalized)) return "https://schema.org/LimitedAvailability";
  if (/disponivel|em estoque|estoque|pronta entrega|unidade/.test(normalized)) return "https://schema.org/InStock";
  return "";
}

function dateLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function relatedProducts(product, products) {
  const category = normalizeText(firstFilled(product, ["category", "categoria", "subcategoria"]));
  const storeId = product.storeId;
  return products
    .filter(item => item.id !== product.id)
    .filter(item => item.storeId === storeId || normalizeText(firstFilled(item, ["category", "categoria", "subcategoria"])) === category)
    .slice(0, 4);
}

function renderRelatedProducts(product, products) {
  const related = relatedProducts(product, products);
  if (!related.length) return "";
  return `<section class="related">
      <h2>Produtos relacionados</h2>
      <div class="related-grid">
        ${related.map(item => `<a class="related-card" href="/produto/${htmlEscape(productSlug(item))}/">
          <img src="${htmlEscape(webPath(getProductImage(item)))}" alt="${htmlEscape(firstFilled(item, ["name", "nome"]) || "Produto relacionado")}">
          <strong>${htmlEscape(firstFilled(item, ["name", "nome"]) || "Produto relacionado")}</strong>
          <span>${htmlEscape(firstFilled(item, ["price", "preco", "precoAtual"]) || "Consultar")}</span>
        </a>`).join("")}
      </div>
    </section>`;
}

function productPage(product, store, products) {
  const title = firstFilled(product, ["name", "nome"]) || "Produto Impacto360";
  const description = firstFilled(product, ["descricaoCurta", "description", "descricaoDetalhada"]) || "Oferta selecionada pela Impacto360 Afiliado.";
  const priceLabel = firstFilled(product, ["price", "preco", "precoAtual"]) || "Consultar";
  const price = numericPrice(priceLabel);
  const image = webPath(getProductImage(product));
  const link = getProductLink(product);
  const rating = firstFilled(product, ratingFields);
  const ratingValue = ratingSchemaValue(rating);
  const reviewCount = reviewCountValue(product);
  const availability = firstFilled(product, availabilityFields);
  const schemaAvailabilityUrl = schemaAvailability(availability);
  const category = firstFilled(product, ["category", "categoria", "subcategoria"]);
  const status = firstFilled(product, ["status", "statusPublicacao", "auditoriaPublicacao"]) || "ativo";
  const lastCheck = dateLabel(firstFilled(product, lastCheckFields));
  const storeName = store?.commercialName || store?.name || firstFilled(product, ["source", "badge"]) || "Loja parceira";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description,
    image,
    brand: firstFilled(product, ["brand", "marca"]) || storeName,
    category,
    url: productUrl(product),
    offers: {
      "@type": "Offer",
      url: link,
      priceCurrency: "BRL",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
  };
  if (price) schema.offers.price = price;
  if (schemaAvailabilityUrl) schema.offers.availability = schemaAvailabilityUrl;
  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
    };
  }
  const relatedMarkup = renderRelatedProducts(product, products);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlEscape(title)} | Impacto360 Afiliado</title>
  <meta name="description" content="${htmlEscape(description.slice(0, 155))}">
  <link rel="canonical" href="${htmlEscape(productUrl(product))}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${htmlEscape(title)}">
  <meta property="og:description" content="${htmlEscape(description.slice(0, 200))}">
  <meta property="og:image" content="${htmlEscape(image)}">
  <meta property="og:url" content="${htmlEscape(productUrl(product))}">
  <script type="application/ld+json">${jsonLd(schema)}</script>
  <style>
    :root { color-scheme: light; --ink:#08192f; --muted:#607083; --line:rgba(56,91,130,.18); --blue:#1d5cff; --gold:#f3ce7b; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f4f8fb; color:var(--ink); }
    a { color: inherit; text-decoration: none; }
    .wrap { width:min(1120px, calc(100% - 32px)); margin:0 auto; padding:28px 0 44px; }
    .top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }
    .brand { font-weight:900; letter-spacing:.04em; }
    .product { display:grid; grid-template-columns:minmax(260px, 480px) 1fr; gap:28px; align-items:start; }
    .media, .panel { background:#fff; border:1px solid var(--line); border-radius:8px; box-shadow:0 18px 54px rgba(8,25,47,.10); overflow:hidden; }
    .media img { width:100%; aspect-ratio:1/1; object-fit:contain; background:#fff; }
    .panel { padding:24px; }
    .eyebrow { color:var(--blue); font-size:.78rem; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
    h1 { margin:10px 0 12px; font-size:clamp(1.7rem, 4vw, 3rem); line-height:1.05; }
    p { color:var(--muted); line-height:1.65; }
    .price { display:block; margin:18px 0 8px; font-size:1.8rem; font-weight:950; }
    .meta { display:flex; flex-wrap:wrap; gap:8px; margin:16px 0; }
    .chip { border:1px solid var(--line); border-radius:999px; padding:8px 10px; background:#fff; color:var(--muted); font-weight:800; font-size:.84rem; }
    .btn { display:inline-flex; align-items:center; justify-content:center; min-height:48px; padding:0 18px; border-radius:8px; background:linear-gradient(135deg, var(--blue), #0d3fb9); color:#fff; font-weight:950; }
    .notice { margin-top:16px; padding:12px; border-radius:8px; background:#fff8e7; color:#66501c; border:1px solid rgba(243,206,123,.55); }
    .related { margin-top:34px; }
    .related h2 { margin:0 0 14px; font-size:1.5rem; }
    .related-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:14px; }
    .related-card { background:#fff; border:1px solid var(--line); border-radius:8px; padding:12px; display:grid; gap:8px; }
    .related-card img { width:100%; aspect-ratio:1/1; object-fit:contain; background:#fff; }
    .related-card strong { font-size:.95rem; line-height:1.3; }
    .related-card span { color:var(--muted); font-weight:900; }
    @media (max-width:760px) { .product { grid-template-columns:1fr; } .top { align-items:flex-start; flex-direction:column; } }
  </style>
</head>
<body>
  <main class="wrap">
    <div class="top">
      <a class="brand" href="/">IMPACTO360 AFILIADO</a>
      <a href="/#openingShowcase">Voltar para a vitrine</a>
    </div>
    <section class="product">
      <figure class="media"><img src="${htmlEscape(image)}" alt="${htmlEscape(title)}"></figure>
      <article class="panel">
        <span class="eyebrow">${htmlEscape(storeName)}</span>
        <h1>${htmlEscape(title)}</h1>
        <p>${htmlEscape(description)}</p>
        <strong class="price">${htmlEscape(priceLabel)}</strong>
        <div class="meta">
          <span class="chip">${htmlEscape(firstFilled(product, ["source", "badge"]) || "Loja parceira")}</span>
          <span class="chip">${htmlEscape(rating ? `Avaliação ${rating}` : "Avaliação pendente de revisão")}</span>
          <span class="chip">${htmlEscape(availability || "Disponibilidade pendente de revisão")}</span>
          <span class="chip">${htmlEscape(category || "Categoria pendente de revisão")}</span>
          <span class="chip">${htmlEscape("Status: " + status)}</span>
          <span class="chip">${htmlEscape(lastCheck ? "Revisto em " + lastCheck : "Última verificação pendente de revisão")}</span>
        </div>
        <a class="btn" href="${htmlEscape(link)}" target="_blank" rel="noopener noreferrer sponsored">Comprar no site parceiro</a>
        <div class="notice">A Impacto360 Afiliado pode receber comissão por compras feitas por este link, sem custo adicional para você. Preço, entrega, garantia e disponibilidade devem ser confirmados no site parceiro.</div>
      </article>
    </section>
    ${relatedMarkup}
  </main>
</body>
</html>
`;
}

function cleanGeneratedPages(base) {
  const dir = path.join(base, "produto");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writeProductPages(base, products, storesById) {
  cleanGeneratedPages(base);
  for (const product of products) {
    for (const slug of productPageSlugs(product)) {
      const dir = path.join(base, "produto", slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), productPage(product, storesById.get(product.storeId), products), "utf8");
    }
  }
}

function writeSitemap(base, products) {
  const urls = [
    { loc: `${siteUrl}/`, priority: "1.0" },
    ...products.map(product => ({ loc: productUrl(product), priority: "0.7" })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(item => `  <url>
    <loc>${item.loc}</loc>
    <priority>${item.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(base, "sitemap.xml"), xml, "utf8");
}

const stores = readJson("dados/stores.json");
const storesById = new Map(stores.map(store => [store.id, store]));
const products = readJson("dados/products.json").filter(productIsPublishable);
buildProductSlugs(products);

for (const base of outputRoots) {
  writeProductPages(base, products, storesById);
  writeSitemap(base, products);
}

const aliasCount = products.reduce((total, product) => total + productPageSlugs(product).length, 0);
console.log(`Paginas canonicas de produto geradas: ${products.length}`);
console.log(`Arquivos de produto publicados, incluindo aliases por id: ${aliasCount}`);
for (const base of outputRoots) {
  console.log(`- ${path.relative(root, base) || "."}/produto`);
}
