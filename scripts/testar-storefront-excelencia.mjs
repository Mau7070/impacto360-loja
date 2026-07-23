import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageRoot = path.join(root, "pacote-github-pages-pronto");
const checks = [];

function check(name, pass, detail = "") {
  checks.push({ name, pass: Boolean(pass), detail });
}

function read(relative, base = root) {
  return fs.readFileSync(path.join(base, relative), "utf8");
}

function exists(relative, base = root) {
  return fs.existsSync(path.join(base, relative));
}

function hash(relative, base = root) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(base, relative))).digest("hex");
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sourceLinks(product) {
  return [
    product.linkCompra,
    product.linkAfiliado,
    product.affiliateLink,
    product.linkComissionado,
    product.linkPlataforma,
    product.link_original_afiliado,
    product.urlProduto,
    product.url,
  ].filter(Boolean);
}

const required = [
  "index.html",
  "impacto360.html",
  "404.html",
  "assets/storefront-excellence.css",
  "assets/storefront-excellence.js",
  "dados/catalogo-publico.json",
  "dados/products.json",
  "dados/stores.json",
];

for (const file of required) check(`arquivo ${file}`, exists(file));

const html = read("index.html");
const app = read("assets/storefront-excellence.js");
const css = read("assets/storefront-excellence.css");
const fallback404 = read("404.html");
const catalog = JSON.parse(read("dados/catalogo-publico.json"));
const sourceProducts = JSON.parse(read("dados/products.json"));
const stores = JSON.parse(read("dados/stores.json"));
const sourceById = new Map(sourceProducts.map(product => [String(product.id), product]));

check("HTML inicial enxuto", Buffer.byteLength(html) < 25_000, `${Buffer.byteLength(html)} bytes`);
check("catalogo nao duplicado no HTML", !html.includes("let products = [") && !html.includes("let stores = ["));
check("assets modulares carregados", html.includes("/assets/storefront-excellence.css") && html.includes("/assets/storefront-excellence.js"));
check("carrossel automatico antigo removido", !html.includes("impacto360-banners-anuncios.js") && !app.includes("setInterval("));
check("sem linguagem tecnica antiga", !html.includes("VITRINE EM ROTACAO") && !app.includes("produtos prontos") && !app.includes("Mais Vendidos"));
check("integracoes administrativas isoladas da loja publica", html.includes("loadAdminOnlyInAdminArea") && html.includes('startsWith("/admin/")'));
check("medicao de anuncios nao bloqueia o conteudo inicial", html.includes("loadMeasurementWithoutBlockingContent") && !html.includes('<script async src="https://www.googletagmanager.com'));
check("hero comercial correto", app.includes("Ofertas selecionadas nas melhores lojas") && app.includes("Ver ofertas de hoje"));
check("hero principal disponivel antes do JavaScript", html.includes('class="hero initial-home-hero"') && html.includes("<h1>Ofertas selecionadas nas melhores lojas</h1>"));
check("rodape protegido contra salto de layout inicial", css.includes("html:not(.storefront-ready) .site-footer") && app.includes('classList.add("storefront-ready")'));
check("oito categorias iniciais", app.includes("categoryDefinitions") && app.match(/slug: "/g)?.length >= 8);
check("oito lojas na home", app.includes("homeStoreIds") && app.includes("impacto-brinquedos"));
check("26 lojas preservadas", stores.length === 26, `${stores.length} lojas`);
check("catalogo publico reduzido", catalog.length > 0 && catalog.length < sourceProducts.length, `${catalog.length}/${sourceProducts.length}`);
check("catalogo publico menor que 1,5 MB", Buffer.byteLength(read("dados/catalogo-publico.json")) < 1_500_000, `${Buffer.byteLength(read("dados/catalogo-publico.json"))} bytes`);
check("catalogo sem IDs duplicados", new Set(catalog.map(product => product.id)).size === catalog.length);
check("catalogo sem links duplicados", new Set(catalog.map(product => product.link.toLowerCase().replace(/#.*$/, ""))).size === catalog.length);
check("catalogo sem objetos convertidos em texto", !catalog.some(product => JSON.stringify(product).includes("[object Object]")));
check("todos os produtos projetados existem na origem", catalog.every(product => sourceById.has(product.id)));
check("links de afiliado preservados", catalog.every(product => sourceLinks(sourceById.get(product.id)).includes(product.link)));
check("nenhum campo mestre sensivel alterado", catalog.every(product => !("observacoesInternas" in product) && !("legendaWhatsApp" in product)));
check("busca ignora acentos", app.includes('.normalize("NFD")') && app.includes("/[\\u0300-\\u036f]/g"));
check("busca tolera pequenos erros", app.includes("levenshtein") && app.includes("fuzzyTokenMatch"));
check("sugestoes com debounce", app.includes("280") && app.includes('role="option"'));
check("navegacao de sugestoes por teclado", app.includes('"ArrowDown"') && app.includes('"ArrowUp"') && app.includes('"Escape"'));
check("filtros principais", ["categoria", "loja", "parceiro", "marca", "preco", "avaliacao", "oferta"].every(filter => app.includes(`data-filter="${filter}"`)));
check("categorias e lojas paginadas", app.includes("data-collection-load-more") && app.includes("visibleProducts = products.slice(0, state.visibleLimit)"));
check("ordenacao sem ranking inventado", app.includes("Mais relevantes") && app.includes("Menor preço") && app.includes("Melhor avaliados") && !app.includes("Mais procurados"));
check("favoritos locais preservados", app.includes("impacto360Favorites") && app.includes("localStorage"));
check("historico local com limpeza", app.includes("impacto360SearchHistory") && app.includes("clearSearchHistory"));
check("pesquisa marcada noindex", app.includes('robots: "noindex,follow"'));
check("rotas preservadas pelo 404", fallback404.includes('params.set("route", path)'));
check("skip link e rotulos acessiveis", html.includes("Pular para o conteúdo principal") && html.includes('aria-autocomplete="list"') && html.includes('role="combobox"') && html.includes('role="search"'));
check("foco visivel", css.includes(":focus-visible") && css.includes("--color-focus: #2563EB"));
check("movimento reduzido respeitado", css.includes("prefers-reduced-motion"));
check("CTA de produto consistente", app.includes('class="btn ${actionClass}"') && css.includes(".btn-offer"));
check("CTA laranja com contraste reforcado", css.includes("--color-accent-active: #C2410C") && css.includes("--color-accent-contrast: #9A3412"));
check("imagens de produto quadradas", css.includes(".product-media") && css.includes("aspect-ratio: 1"));
check("imagens de produto carregadas sob demanda", app.includes('data-src="${escapeAttr(image)}"') && app.includes("IntersectionObserver") && app.includes('rootMargin: "400px 0px"'));
check("selecao diversa sem ordenacao quadratica", app.includes("bucketsByKey") && !app.includes("source.sort("));
check("indice fuzzy calculado somente quando necessario", app.includes("(product._words = searchTokens("));

for (const relative of [
  "index.html",
  "404.html",
  "assets/storefront-excellence.css",
  "assets/storefront-excellence.js",
  "dados/catalogo-publico.json",
]) {
  check(`pacote sincronizado ${relative}`, exists(relative, packageRoot) && hash(relative) === hash(relative, packageRoot));
}

const routes = [
  "lojas/index.html",
  "buscar/index.html",
  ...stores.map(store => `loja/${store.id}/index.html`),
  ..."celulares-e-tecnologia casa-e-cozinha eletrodomesticos games-e-setup moda-e-calcados ferramentas brinquedos-e-escolar montaria-e-cavalgada"
    .split(" ")
    .map(slug => `categoria/${slug}/index.html`),
];
check("todas as rotas estaticas geradas", routes.every(route => exists(route)), `${routes.filter(route => exists(route)).length}/${routes.length}`);
check("rota de busca tem noindex", read("buscar/index.html").includes('content="noindex,follow"'));
check("rotas de loja indexaveis", read(`loja/${stores[0].id}/index.html`).includes('content="index,follow,max-image-preview:large"'));
check("sitemap inclui lojas e categorias", read("sitemap.xml").includes("<loc>https://impacto360afiliado.com.br/lojas/</loc>") && read("sitemap.xml").includes("/categoria/celulares-e-tecnologia/"));

for (const script of ["src/storefront/storefront.js", "scripts/gerar-storefront-excelencia.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", script], { cwd: root, encoding: "utf8" });
  check(`sintaxe ${script}`, result.status === 0, result.stderr.trim());
}

const invalidCatalog = catalog.filter(product => (
  !product.id
  || !product.name
  || !product.image
  || !/^https?:\/\//i.test(product.link)
  || !sourceById.has(product.id)
));
check("catalogo publico completo", invalidCatalog.length === 0, `${invalidCatalog.length} inválidos`);

const localMissingImages = catalog.filter(product => {
  if (/^(https?:|data:)/i.test(product.image)) return false;
  return !exists(product.image.replace(/^\/+/, ""));
});
check("imagens locais do catalogo existem", localMissingImages.length === 0, `${localMissingImages.length} ausentes`);

const missingProductPages = catalog.filter(product => !exists(path.join("produto", product.slug, "index.html")));
check("paginas internas existem para todo o catalogo", missingProductPages.length === 0, `${missingProductPages.length} ausentes`);

const failed = checks.filter(item => !item.pass);
for (const item of checks) {
  console.log(`${item.pass ? "OK" : "FALHA"} - ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nStorefront bloqueada: ${failed.length} verificação(ões) falharam.`);
  process.exit(1);
}

console.log(`\nStorefront aprovada: ${checks.length} verificações passaram.`);
