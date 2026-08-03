import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";
import { findIncompatibleSharedImages } from "./catalog-integrity.mjs";

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
  "dados/fila-revalidacao-precos.json",
  "dados/relatorio-integridade-publicacao.json",
  "dados/products.json",
  "dados/stores.json",
  "manifest.webmanifest",
  "sw.js",
];

for (const file of required) check(`arquivo ${file}`, exists(file));

const html = read("index.html");
const app = read("assets/storefront-excellence.js");
const css = read("assets/storefront-excellence.css");
const fallback404 = read("404.html");
const catalog = JSON.parse(read("dados/catalogo-publico.json"));
const priceRevalidationQueue = JSON.parse(read("dados/fila-revalidacao-precos.json"));
const sourceProducts = JSON.parse(read("dados/products.json"));
const stores = JSON.parse(read("dados/stores.json"));
const sourceById = new Map(sourceProducts.map(product => [String(product.id), product]));

check("HTML inicial enxuto", Buffer.byteLength(html) < 25_000, `${Buffer.byteLength(html)} bytes`);
check("catalogo nao duplicado no HTML", !html.includes("let products = [") && !html.includes("let stores = ["));
check("assets modulares carregados", html.includes("/assets/storefront-excellence.css") && html.includes("/assets/storefront-excellence.js"));
check("carrossel automatico antigo removido", !html.includes("impacto360-banners-anuncios.js") && !app.includes("VITRINE EM ROTACAO"));
check("sem linguagem tecnica antiga", !html.includes("VITRINE EM ROTACAO") && !app.includes("produtos prontos") && !app.includes("Mais Vendidos"));
check("integracoes administrativas removidas da loja publica", !html.includes("impacto360-admin-robos.js") && !html.includes("loadAdminOnlyInAdminArea"));
check("stubs administrativos sem credencial embarcada", !read("integracoes/impacto360-admin-robos.js").includes("type=\"password\"") && !read("integracoes/impacto360-banners-admin.js").includes("type=\"password\""));
check(
  "medicao e anuncios dependem de consentimento",
  !html.includes('<script async src="https://www.googletagmanager.com')
  && !html.includes('<script defer src="/integracoes/impacto360-google-ads.js')
  && app.includes("impacto360Consent")
  && app.includes("applyConsent")
  && app.includes("consent.marketing"),
);
check("hero comercial correto", app.includes("Ofertas selecionadas nas melhores lojas") && app.includes("Ver ofertas de hoje"));
check("hero principal disponivel antes do JavaScript", html.includes('class="hero initial-home-hero"') && html.includes("<h1>Ofertas selecionadas nas melhores lojas</h1>"));
check("rodape protegido contra salto de layout inicial", css.includes("html:not(.storefront-ready) .site-footer") && app.includes('classList.add("storefront-ready")'));
check("oito categorias iniciais", app.includes("categoryDefinitions") && app.match(/slug: "/g)?.length >= 8);
check("categorias priorizam a loja correta", app.includes("storeCategoryById") && app.includes('["impacto-ferramentas", "ferramentas"]') && app.includes("categorySlugForProduct(product)"));
check("ferramentas acessiveis no menu principal", html.includes('href="/categoria/ferramentas/"') && html.includes(">Ferramentas</a>"));
check("oito lojas na home", app.includes("homeStoreIds") && app.includes("impacto-brinquedos"));
check("26 lojas preservadas", stores.length === 26, `${stores.length} lojas`);
check("catalogo publico reduzido", catalog.length > 0 && catalog.length < sourceProducts.length, `${catalog.length}/${sourceProducts.length}`);
const catalogBuffer = fs.readFileSync(path.join(root, "dados", "catalogo-publico.json"));
const catalogGzipBytes = zlib.gzipSync(catalogBuffer, { level: 9 }).length;
check(
  "catalogo publico dentro do limite de transferencia",
  catalogBuffer.length < 5_000_000 && catalogGzipBytes < 500_000,
  `${catalogBuffer.length} bytes brutos / ${catalogGzipBytes} bytes gzip`,
);
check("catalogo sem IDs duplicados", new Set(catalog.map(product => product.id)).size === catalog.length);
check("catalogo sem links duplicados", new Set(catalog.map(product => product.link.toLowerCase().replace(/#.*$/, ""))).size === catalog.length);
const incompatibleSharedImages = findIncompatibleSharedImages(catalog);
check(
  "catalogo sem imagens compartilhadas por variacoes incompatíveis",
  incompatibleSharedImages.length === 0,
  `${incompatibleSharedImages.length} conflito(s)`,
);
check("catalogo sem objetos convertidos em texto", !catalog.some(product => JSON.stringify(product).includes("[object Object]")));
check("todos os produtos projetados existem na origem", catalog.every(product => sourceById.has(product.id)));
check("links de afiliado preservados", catalog.every(product => sourceLinks(sourceById.get(product.id)).includes(product.link)));
check("catalogo nao publica paginas genericas de marketplace", !catalog.some(product => (
  /mercadolivre\.com\.br\/(?:loja|ofertas)\//i.test(product.link)
  || /lista\.mercadolivre\.com\.br/i.test(product.link)
  || /google\.[^/]+\/search/i.test(product.link)
)));
check("nenhum campo mestre sensivel alterado", catalog.every(product => !("observacoesInternas" in product) && !("legendaWhatsApp" in product)));
check("busca ignora acentos", app.includes('.normalize("NFD")') && app.includes("/[\\u0300-\\u036f]/g"));
check("busca tolera pequenos erros", app.includes("levenshtein") && app.includes("fuzzyTokenMatch"));
check("busca trata sinonimos e palavras de ligacao", app.includes("SEARCH_ALIASES") && app.includes("SEARCH_STOPWORDS"));
check("sugestoes com debounce", app.includes("280") && app.includes('role="option"'));
check("navegacao de sugestoes por teclado", app.includes('"ArrowDown"') && app.includes('"ArrowUp"') && app.includes('"Escape"'));
check("filtros principais", ["categoria", "loja", "parceiro", "preco", "avaliacao", "oferta"].every(filter => app.includes(`data-filter="${filter}"`)) && app.includes("data-brand-search"));
check("marca pesquisavel sugere depois de duas letras e limita dez opcoes", app.includes("query.length < 2") && app.includes(".slice(0, 10)") && app.includes("data-brand-suggestions"));
check("filtro de disponibilidade", app.includes('data-filter="disponibilidade"') && app.includes("availabilityFilter"));
check("filtros exibem contagens auditaveis", app.includes("countValues") && app.includes("priceCounts") && app.includes("ratingCounts"));
check("filtro inclui produtos sem preco cadastrado", app.includes('["sem-preco", "Preço no parceiro"]'));
check("limpar filtros preserva o termo pesquisado", app.includes("clearSearchFiltersHref") && app.includes('clean.searchParams.delete(key)'));
check("marcas genericas e marketplaces ocultados", app.includes("validBrand") && app.includes("informacao nao especificada"));
check("categorias e lojas paginadas", app.includes("data-collection-load-more") && app.includes("visibleProducts = products.slice(0, state.visibleLimit)"));
check("ordenacao sem ranking inventado", app.includes("Mais relevantes") && app.includes("Menor preço") && app.includes("Melhor avaliados") && !app.includes("Mais procurados"));
check("ordenacao alfabetica disponivel", app.includes('["nome", "Nome"]'));
check("favoritos locais preservados", app.includes("impacto360Favorites") && app.includes("localStorage"));
check("historico local com limpeza", app.includes("impacto360SearchHistory") && app.includes("clearSearchHistory"));
check("pesquisa marcada noindex", app.includes('robots: "noindex,follow"'));
check("rotas preservadas pelo 404", fallback404.includes('params.set("route", path)'));
check("skip link e rotulos acessiveis", html.includes("Pular para o conteúdo principal") && html.includes('aria-autocomplete="list"') && html.includes('role="combobox"') && html.includes('role="search"'));
check("foco visivel", css.includes(":focus-visible") && css.includes("--color-focus: #2563EB"));
check("movimento reduzido respeitado", css.includes("prefers-reduced-motion"));
check("central de acessibilidade e modo escuro", html.includes("data-accessibility-dialog") && app.includes("applyAccessibility") && css.includes(':root[data-theme="dark"]'));
check("elementos hidden permanecem visualmente ocultos", css.includes("[hidden]") && css.includes("display: none !important"));
check("busca por voz possui alternativa textual", html.includes("data-voice-search") && app.includes("Busca por voz indisponível") && app.includes("data-search-input"));
check("busca por imagem nao envia arquivo nesta versao", html.includes("data-image-search-dialog") && app.includes("Ela não foi enviada"));
check("navegacao inferior mobile", html.includes('class="bottom-nav"') && css.includes(".bottom-nav"));
check("tema e acessibilidade disponiveis no menu movel e perfil", html.includes("mobile-menu-tools") && app.includes("Alternar tema") && app.includes("Abrir acessibilidade"));
check("home compacta com limites definidos", app.includes("HOME_ROTATION_SIZE = 8") && app.includes(".slice(0, 4)") && app.includes(".slice(0, 8)") && !app.includes('"Seleções para você"') && !app.includes('"Produtos por departamento"'));
check("cards moveis simplificados em duas colunas permanentes", css.includes("@media (max-width: 480px)") && css.includes(".product-facts") && css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") && !css.includes("grid-template-columns: 126px minmax(0, 1fr)"));
check("home mobile prioriza produtos e oferece acesso compacto", app.includes('class="section section-soft home-products" id="produtos"') && app.includes('class="mobile-home-access"') && css.includes(".initial-home-route .promo-shortcuts"));
check("categorias lojas e compra transparente usam paineis compactos", app.includes('class="home-disclosure" id="categorias"') && app.includes('class="home-disclosure" id="lojas"') && app.includes('class="how-grid home-how-grid"') && css.includes(".home-disclosure summary"));
check("paineis compactos usam duas colunas responsivas", css.includes(".home-category-grid,") && css.includes(".home-store-grid,") && css.includes(".home-how-grid") && css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"));
check("rodizio permanente percorre catalogo completo", app.includes("HOME_ROTATION_INTERVAL = 8000") && app.includes("HOME_ROTATION_SIZE = 8") && app.includes("state.products.length") && app.includes("setInterval(() => rotateHomeProducts()"));
check("rodizio pausa para interacao e movimento reduzido", app.includes("homeRotationInteractionPaused") && app.includes("homeRotationReduced()") && app.includes('data-home-rotation-toggle'));
check(
  "informacoes comerciais antigas removidas da vitrine",
  app.includes("priceFreshness(product).current")
  && !app.includes("Informação antiga")
  && catalog.every(product => product.rating == null)
  && catalog.every(product => product.priceStatus === "current" || !product.availability)
  && catalog.every(product => !/(?:\b(?:nota|avalia[cç][aã]o)\s*:?s*\d|\b\d(?:[.,]\d)?\s*estrelas?\b|\b[\d.,]+\s*(?:mil)?\+?\s*vendidos?\b)/i.test(product.description || "")),
);
check(
  "revalidacao automatica prioriza precos vencidos e nao verificados",
  priceRevalidationQueue.pending === priceRevalidationQueue.items.length
    && priceRevalidationQueue.items.every(item => item.priority === "high" && item.status !== "current"),
);
check("cookies compactos com ajuste secundario", html.includes("cookie-settings-link") && css.includes("grid-template-columns: 1fr 1fr"));
check("CTA de produto consistente", app.includes('class="btn ${actionClass}"') && css.includes(".btn-offer"));
check("CTA identifica link afiliado", app.includes('data-affiliate-link="${escapeAttr(product.link)}"'));
check("links afiliados validados por allowlist", app.includes("ALLOWED_AFFILIATE_DOMAINS") && app.includes("isAllowedAffiliateUrl"));
check("preco antigo nao cria linha vazia", !app.includes('previousPrice ? escapeHtml(previousPrice) : "&nbsp;"'));
check("preco nao verificado usa consulta no parceiro", app.includes("Consulte o preço no parceiro"));
check("CTA laranja com contraste reforcado", css.includes("--color-accent-active: #C2410C") && css.includes("--color-accent-contrast: #9A3412"));
check("imagens de produto quadradas", css.includes(".product-media") && css.includes("aspect-ratio: 1"));
check("imagens de produto carregadas sob demanda", app.includes('data-src="${escapeAttr(image)}"') && app.includes("IntersectionObserver") && app.includes('rootMargin: "400px 0px"'));
check("vitrines mobile sem carrossel horizontal", !css.includes("grid-auto-columns: 76vw") && app.includes("activeCategories"));
check("filtros mobile com sobreposicao e foco", css.includes(".filter-backdrop") && app.includes("focusableElements") && app.includes('event.key === "Escape"'));
check("selecao diversa sem ordenacao quadratica", app.includes("bucketsByKey") && !app.includes("source.sort("));
check("indice fuzzy calculado somente quando necessario", app.includes("(product._words = searchTokens("));

for (const relative of [
  "index.html",
  "404.html",
  "assets/storefront-excellence.css",
  "assets/storefront-excellence.js",
  "dados/catalogo-publico.json",
  "dados/fila-revalidacao-precos.json",
  "dados/relatorio-integridade-publicacao.json",
  "manifest.webmanifest",
  "sw.js",
  "integracoes/impacto360-admin-robos.js",
  "integracoes/impacto360-banners-admin.js",
]) {
  check(`pacote sincronizado ${relative}`, exists(relative, packageRoot) && hash(relative) === hash(relative, packageRoot));
}

const routes = [
  "lojas/index.html",
  "buscar/index.html",
  ..."ofertas buscar/imagem favoritos alertas historico perfil acessibilidade como-comprar transparencia-de-afiliados privacidade cookies termos instalar politica-de-privacidade termos-de-uso"
    .split(" ")
    .map(route => `${route}/index.html`),
  ...stores.map(store => `loja/${store.id}/index.html`),
  ..."celulares-e-tecnologia casa-e-cozinha eletrodomesticos games-e-setup esporte-e-fitness moda-e-calcados ferramentas brinquedos-e-escolar livros-papelaria-e-fe montaria-e-cavalgada auto-e-moto beleza-e-cuidados pets cursos-e-educacao servicos-digitais ofertas-e-parceiros"
    .split(" ")
    .map(slug => `categoria/${slug}/index.html`),
];
check("todas as rotas estaticas geradas", routes.every(route => exists(route)), `${routes.filter(route => exists(route)).length}/${routes.length}`);
check("rota de busca tem noindex", read("buscar/index.html").includes('content="noindex,follow"'));
check("rotas legais respondem com HTML estatico", ["privacidade", "cookies", "termos"].every(route => exists(`${route}/index.html`)));
check("rotas legais possuem H1 antes do JavaScript", ["privacidade", "cookies", "termos"].every(route => read(`${route}/index.html`).includes('class="page-hero route-fallback"')));
check(
  "rotas legais antigas preservam compatibilidade",
  read("politica-de-privacidade/index.html").includes('href="https://impacto360afiliado.com.br/privacidade/"')
  && read("termos-de-uso/index.html").includes('href="https://impacto360afiliado.com.br/termos/"'),
);
check("rotas de loja indexaveis", read(`loja/${stores[0].id}/index.html`).includes('content="index,follow,max-image-preview:large"'));
check("sitemap inclui lojas e categorias", read("sitemap.xml").includes("<loc>https://impacto360afiliado.com.br/lojas/</loc>") && read("sitemap.xml").includes("/categoria/celulares-e-tecnologia/"));

for (const script of ["src/storefront/storefront.js", "scripts/gerar-storefront-excelencia.mjs", "scripts/catalog-integrity.mjs", "sw.js"]) {
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
