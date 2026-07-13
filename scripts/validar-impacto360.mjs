import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "404.html",
  "integracoes/impacto360-admin-robos.js",
  "public/fachada-shopping-premium-referencia.png",
  "dados/products.json",
  "dados/stores.json"
];

const checks = [];

function ok(name, pass, detail = "") {
  checks.push({ name, pass, detail });
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

for (const file of requiredFiles) {
  ok(`arquivo ${file}`, fs.existsSync(path.join(root, file)));
}

const html = read("index.html");
const integration = read("integracoes/impacto360-admin-robos.js");
const fallback404 = read("404.html");

for (const [index, match] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()) {
  try {
    new Function(match[1]);
    ok(`script inline ${index}`, true);
  } catch (error) {
    ok(`script inline ${index}`, false, error.message);
  }
}

try {
  new Function(integration);
  ok("script integracao admin", true);
} catch (error) {
  ok("script integracao admin", false, error.message);
}

const requiredRoutes = [
  "/admin/catalogo-inteligente",
  "/admin/postagens",
  "/admin/midias",
  "/admin/tendencias",
  "/admin/plataformas",
  "/admin/atendimento",
  "/admin/revisao"
];

for (const route of requiredRoutes) {
  ok(`rota ${route}`, integration.includes(route));
}

ok("home preservada", html.includes("entrance-view") && html.includes("shopping-view") && html.includes("ENTRAR NO SHOPPING"));
ok("botao entrada visivel", html.includes("linear-gradient(135deg, #f3ce7b, #fff1bd)") && !/\.enter-hotspot[\s\S]{0,260}color:\s*transparent/.test(html));
ok("mobile 360-414 preparado", html.includes("@media (max-width: 760px)") && html.includes("grid-template-columns: 1fr"));
ok("imagens contain", html.includes("object-fit: contain"));
ok("lazy loading", html.includes('loading="lazy"') && html.includes('decoding="async"'));
ok("linkPlataforma nos botoes", html.includes("data-link-plataforma") && html.includes("getProductLink"));
ok("video fields", html.includes("videoPrincipal") && html.includes("videosExtras") && html.includes("statusVideo"));
ok("campos manuais produto", integration.includes("fotoPrincipal") && integration.includes("fotosExtras") && integration.includes("linkPlataforma"));
ok("campos manuais postagens", integration.includes("data-post-form") && integration.includes("thumbnail") && integration.includes("redeSocial"));
ok("404 preserva admin", fallback404.includes("route=") && fallback404.includes("/admin/"));

for (const dataFile of ["dados/products.json", "dados/stores.json", "dados/importedMercadoLivreProducts.json"]) {
  const full = path.join(root, dataFile);
  if (!fs.existsSync(full)) continue;
  try {
    JSON.parse(fs.readFileSync(full, "utf8"));
    ok(`json ${dataFile}`, true);
  } catch (error) {
    ok(`json ${dataFile}`, false, error.message);
  }
}

const products = JSON.parse(read("dados/products.json"));
const stores = JSON.parse(read("dados/stores.json"));
const storeIds = new Set(stores.map(store => store.id));
const activeProducts = products.filter(product => String(product.status || "").toLowerCase() === "ativo");
const productLink = product => String(
  product.affiliateLink
  || product.linkCompra
  || product.linkAfiliado
  || product.linkComissionado
  || product.linkOriginal
  || ""
).trim();
const productImage = product => String(
  product.image || product.imagemPrincipal || product.imagem || ""
).trim();
const invalidLink = link => (
  !/^https?:\/\//i.test(link)
  || /COLOCAR_|placeholder|sem[-_ ]?(foto|imagem)|URL_|LINK_/i.test(link)
  || /mercadolivre\.com\.br\/loja\//i.test(link)
  || /lista\.mercadolivre\.com\.br/i.test(link)
);
const invalidImage = image => (
  !image || /placeholder|sem[-_ ]?(foto|imagem)|no[-_ ]?image/i.test(image)
);
const activeWithoutLink = activeProducts.filter(product => invalidLink(productLink(product)));
const activeWithoutImage = activeProducts.filter(product => invalidImage(productImage(product)));
const activeInMissingStore = activeProducts.filter(product => !storeIds.has(product.storeId));
const activeKeys = new Map();
const activeDuplicates = [];
for (const product of activeProducts) {
  const key = productLink(product).toLowerCase().replace(/#.*$/, "");
  if (!key) continue;
  if (activeKeys.has(key)) activeDuplicates.push([activeKeys.get(key), product.id]);
  else activeKeys.set(key, product.id);
}
const toyStore = stores.find(store => store.id === "impacto-brinquedos");
const activeToys = activeProducts.filter(product => product.storeId === "impacto-brinquedos");
ok("nenhum ativo sem link direto", activeWithoutLink.length === 0, `${activeWithoutLink.length} encontrado(s)`);
ok("nenhum ativo sem foto valida", activeWithoutImage.length === 0, `${activeWithoutImage.length} encontrado(s)`);
ok("nenhum ativo em loja inexistente", activeInMissingStore.length === 0, `${activeInMissingStore.length} encontrado(s)`);
ok("nenhum link ativo duplicado", activeDuplicates.length === 0, `${activeDuplicates.length} encontrado(s)`);
ok("loja de brinquedos criada", Boolean(toyStore));
ok("loja de brinquedos com anuncios ativos", activeToys.length > 0, `${activeToys.length} ativo(s)`);
ok("vitrine filtra links publicos validos", html.includes("getProductLink(item)") && html.includes("rascunho|revisao|pendente|duplicado|inativo") && html.includes("aprovadoParaPublicacao === false"));

const failed = checks.filter(check => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "OK" : "FALHA"} - ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nPublicacao bloqueada: ${failed.length} teste(s) falharam.`);
  process.exit(1);
}

console.log("\nTodos os testes obrigatorios passaram. Pacote liberado para revisao/publicacao.");
