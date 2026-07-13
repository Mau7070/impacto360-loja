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
ok("cards ocultam pendencias tecnicas", html.includes("Conferir preço atualizado") && !html.includes('"Avaliação pendente de revisão"') && !html.includes("Compartilhar produto"));
ok("cards exigem foto publica", html.includes("resolveProductImage(item).hasPhoto") && html.includes("card.remove()"));
ok("cards com loja e afiliado", html.includes("Link de afiliado") && html.includes("Loja:"));

const products = JSON.parse(read("dados/products.json"));
const activeProducts = products.filter(product => String(product.status || "").toLowerCase() === "ativo");
const usableLink = value => {
  const link = String(value || "").trim();
  if (!/^https?:\/\//i.test(link)) return false;
  if (/COLOCAR_|placeholder|sem[-_ ]?(foto|imagem)|URL_|LINK_/i.test(link)) return false;
  if (/mercadolivre\.com\.br\/loja\//i.test(link) || /lista\.mercadolivre\.com\.br/i.test(link)) return false;
  return true;
};
const linkFields = ["linkCompra", "linkAfiliado", "affiliateLink", "linkComissionado", "linkPlataforma", "link_original_afiliado", "linkOriginal", "urlProduto", "url"];
const imageFields = ["fotoPrincipal", "imagemPrincipal", "imagem", "image", "imageUrl", "thumbnail", "foto", "productImage", "src"];
const imageIsUsable = product => {
  const listFields = ["galeria", "fotosExtras", "images"];
  const candidates = [
    ...imageFields.map(field => product[field]),
    ...listFields.flatMap(field => Array.isArray(product[field]) ? product[field] : []),
  ].map(value => String(value || "").trim());
  return candidates.some(value => {
    if (!value || /COLOCAR_|foto preservada|imagem pendente|placeholder quebrado|placeholder|sem[-_ ]?(foto|imagem)|no[-_ ]?image/i.test(value)) return false;
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return true;
    return fs.existsSync(path.join(root, value.replace(/^\/+/, "")));
  });
};
const publicProducts = products.filter(product => {
  const status = String(product.status || product.statusPublicacao || product.auditoriaPublicacao || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return !/rascunho|revisao|pendente|duplicado|inativo|excluido|removido|oculto|bloqueado/.test(status)
    && product.aprovadoParaPublicacao !== false
    && linkFields.some(field => usableLink(product[field]))
    && imageIsUsable(product);
});
ok("catalogo com produtos ativos", activeProducts.length > 0, `${activeProducts.length} ativo(s)`);
ok("catalogo com produtos publicos por link e foto", publicProducts.length >= 8, `${publicProducts.length} publico(s)`);

const sitemap = read("sitemap.xml");
ok("sitemap tem paginas de produto", sitemap.includes("<loc>https://impacto360afiliado.com.br/produto/"));
ok("sitemap pacote tem paginas de produto", read("pacote-github-pages-pronto/sitemap.xml").includes("<loc>https://impacto360afiliado.com.br/produto/"));

const firstProductDir = path.join(root, "produto");
const productDirs = exists("produto") ? fs.readdirSync(firstProductDir, { withFileTypes: true }).filter(item => item.isDirectory()) : [];
ok("paginas individuais geradas", productDirs.length > 0, `${productDirs.length} pagina(s)`);
ok("paginas individuais sem aliases extras", productDirs.length === publicProducts.length, `${productDirs.length} pagina(s), ${publicProducts.length} produto(s) publico(s)`);
if (productDirs.length) {
  const sample = read(path.join("produto", productDirs[0].name, "index.html"));
  ok("pagina produto com json-ld", sample.includes('type="application/ld+json"') && sample.includes('"@type": "Product"'));
  ok("pagina produto com botao de oferta", />(?:Comprar no site parceiro|Ver oferta no Mercado Livre|Ver oferta na Amazon|Conferir preço atualizado)</.test(sample));
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
