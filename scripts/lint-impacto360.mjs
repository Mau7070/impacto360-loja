import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function ok(name, pass, detail = "") {
  checks.push({ name, pass, detail });
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

const publicHtmlFiles = [
  "index.html",
  "impacto360.html",
  "404.html",
  "pacote-github-pages-pronto/index.html",
  "pacote-github-pages-pronto/404.html",
];

const brokenA = String.fromCharCode(0xc3);
const brokenDoubleA = brokenA + String.fromCharCode(0x0192);
const brokenDoubleB = brokenA + String.fromCharCode(0x201a);
const forbiddenText = [
  ["Shopping", "interno", "liberado"].join(" "),
  ["Alas", "e", "andares", "virtuais"].join(" "),
  "Navega" + brokenA,
  "Servi" + brokenA,
  "f" + brokenA,
  "voc" + brokenA,
  "inten" + brokenA,
  brokenDoubleA,
  brokenDoubleB,
];

for (const file of publicHtmlFiles) {
  ok(`arquivo publico ${file}`, exists(file));
  if (!exists(file)) continue;
  const content = read(file);
  ok(`charset utf-8 ${file}`, /<meta\s+charset=["']?UTF-8["']?/i.test(content));
  for (const marker of forbiddenText) {
    ok(`sem marcador quebrado ${marker} em ${file}`, !content.includes(marker));
  }
}

const html = read("index.html");
ok("texto hero corrigido", html.includes("Explore ofertas selecionadas"));
ok("categorias comerciais visiveis", html.includes("Categorias do shopping") && html.includes("Celulares e Tecnologia") && html.includes("Produtos para Cavalgada"));
ok("como funciona completo", html.includes("Como funciona") && html.includes("1. Seleção") && html.includes("4. Transparência"));
ok("blocos de parceiros", html.includes("Top Amazon") && html.includes("Top Mercado Livre") && html.includes("Outras lojas parceiras"));
ok("cards com ver oferta", html.includes("Ver oferta"));
ok("cards com avaliacao", html.includes("Avaliação na loja parceira") && html.includes("Avaliação "));
ok("cards com loja e afiliado", html.includes("Link de afiliado") && html.includes("store?.commercialName"));

const products = JSON.parse(read("dados/products.json"));
const activeProducts = products.filter(product => String(product.status || "").toLowerCase() === "ativo");
ok("catalogo com produtos ativos", activeProducts.length > 0, `${activeProducts.length} ativo(s)`);

const sitemap = read("sitemap.xml");
ok("sitemap tem paginas de produto", sitemap.includes("<loc>https://impacto360afiliado.com.br/produto/"));
ok("sitemap pacote tem paginas de produto", read("pacote-github-pages-pronto/sitemap.xml").includes("<loc>https://impacto360afiliado.com.br/produto/"));

const firstProductDir = path.join(root, "produto");
const productDirs = exists("produto") ? fs.readdirSync(firstProductDir, { withFileTypes: true }).filter(item => item.isDirectory()) : [];
ok("paginas individuais geradas", productDirs.length > 0, `${productDirs.length} pagina(s)`);
if (productDirs.length) {
  const sample = read(path.join("produto", productDirs[0].name, "index.html"));
  ok("pagina produto com json-ld", sample.includes('type="application/ld+json"') && sample.includes('"@type": "Product"'));
  ok("pagina produto com botao ver oferta", sample.includes(">Ver oferta<"));
}

const failed = checks.filter(check => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "OK" : "FALHA"} - ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nLint Impacto360 falhou: ${failed.length} problema(s).`);
  process.exit(1);
}

console.log("\nLint Impacto360 aprovado.");
