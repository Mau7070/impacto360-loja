import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const catalog = JSON.parse(read("dados/catalogo-publico.json"));
const stores = JSON.parse(read("dados/stores.json"));
const source = read("assets/storefront-excellence.js").replace(/\nboot\(\);\s*$/, "\n");
const checks = [];

function check(name, pass, detail = "") {
  checks.push({ name, pass: Boolean(pass), detail });
}

const context = vm.createContext({
  console,
  URL,
  URLSearchParams,
  Intl,
  Map,
  Set,
  Math,
  Number,
  String,
  Array,
  Object,
  RegExp,
  JSON,
  Date,
  encodeURIComponent,
  decodeURIComponent,
  setTimeout,
  clearTimeout,
  window: {},
  location: new URL("https://impacto360afiliado.com.br/buscar/"),
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  __catalog: catalog,
  __stores: stores,
});

vm.runInContext(source, context, { filename: "assets/storefront-excellence.js" });
vm.runInContext(`
  state.products = __catalog;
  state.stores = __stores;
  state.storeById = new Map(state.stores.map(store => [store.id, store]));
  state.products.forEach(product => {
    product._search = normalize([
      product.name, product.description, product.category, product.subcategory,
      product.brand, product.model, ...(product.tags || []), product.storeId,
      state.storeById.get(product.storeId)?.name, partnerName(product),
    ].join(" "));
    product._categorySlug = categorySlugForProduct(product);
  });
`, context);

const evaluate = expression => vm.runInContext(expression, context);
const count = query => evaluate(`searchProducts(${JSON.stringify(query)}).length`);
const resultIds = query => evaluate(`searchProducts(${JSON.stringify(query)}).map(item => item.product.id)`);

check("catalogo carregado no motor de busca", catalog.length > 0, `${catalog.length} produtos`);
check("normalizacao remove acentos", evaluate(`normalize("Avaliação e Eletrônicos") === "avaliacao e eletronicos"`));
check("busca encontra furadeiras", count("furadeira") > 0, `${count("furadeira")} resultados`);
check("busca tolera erro de digitacao", count("furadeia") > 0, `${count("furadeia")} resultados`);
check("busca entende sinonimo celular/smartphone", count("smartphone") > 0 && count("celular") > 0);
check(
  "palavras de ligacao nao eliminam resultados",
  JSON.stringify(resultIds("kit de ferramentas").sort()) === JSON.stringify(resultIds("kit ferramentas").sort()),
);

check("limite de preco R$ 100 inclusivo", evaluate(`priceRange(100) === "ate-100"`));
check("faixa acima de R$ 100 correta", evaluate(`priceRange(100.01) === "100-500"`));
check("limite de preco R$ 500 inclusivo", evaluate(`priceRange(500) === "100-500"`));
check("faixa acima de R$ 500 correta", evaluate(`priceRange(500.01) === "500-1000"`));
check("limite de preco R$ 1.000 inclusivo", evaluate(`priceRange(1000) === "500-1000"`));
check("faixa acima de R$ 1.000 correta", evaluate(`priceRange(1000.01) === "acima-1000"`));
check("produtos sem preco possuem filtro", evaluate(`priceRange(null) === "sem-preco"`));

const priceCounts = evaluate(`
  [...countValues(state.products.map(product => priceRange(product.priceValue))).entries()]
`);
const pricedTotal = priceCounts.reduce((sum, [, value]) => sum + value, 0);
check("faixas de preco cobrem todo o catalogo", pricedTotal === catalog.length, `${pricedTotal}/${catalog.length}`);
check("filtro preco no parceiro tem produtos", (priceCounts.find(([key]) => key === "sem-preco")?.[1] || 0) > 0);

check("marca valida preservada", evaluate(`validBrand("Bosch") === "Bosch"`));
check("marketplaces nao aparecem como marca", evaluate(`
  ["Amazon", "Mercado Livre", "Shopee", "Hotmart"].every(value => validBrand(value) === "")
`));
check("marca nao informada nao aparece no filtro", evaluate(`
  validBrand("Informação não especificada pelo fornecedor") === ""
`));

const partnerNames = evaluate(`state.products.map(partnerName)`);
check("parceiros sem objetos convertidos em texto", !partnerNames.some(value => value.includes("[object Object]")));
check("filtro de parceiro Shopee funciona", evaluate(`
  searchProducts("furadeira").filter(item => normalize(partnerName(item.product)) === "shopee").length > 0
`));
check("filtro de marca Bosch funciona", evaluate(`
  searchProducts("furadeira").filter(item => normalize(validBrand(item.product.brand)) === "bosch").length > 0
`));
check("produtos de ferramentas estao categorizados", evaluate(`
  state.products.filter(product => categoryForProduct(product)?.slug === "ferramentas").length > 0
`));
check("Casa e Cozinha preserva o minimo auditado", evaluate(`
  state.products.filter(product => categoryForProduct(product)?.slug === "casa-e-cozinha").length >= 188
`));
check("200 ferramentas recentes no ambiente correto", evaluate(`
  state.products.filter(product => /^ferramentas-20260724-/.test(product.id)).length === 200
  && state.products.filter(product => /^ferramentas-20260724-/.test(product.id))
    .every(product => categoryForProduct(product)?.slug === "ferramentas")
`));

const availabilityCounts = evaluate(`
  [...countValues(state.products.map(availabilityFilter)).entries()]
`);
check(
  "filtro de disponibilidade cobre todo o catalogo",
  availabilityCounts.reduce((sum, [, value]) => sum + value, 0) === catalog.length,
);

const clearHref = evaluate(`
  clearSearchFiltersHref(new URL(
    "https://impacto360afiliado.com.br/buscar/?q=furadeira&categoria=ferramentas&loja=impacto-ferramentas&parceiro=Amazon&marca=Bosch&preco=100-500&avaliacao=4&disponibilidade=consultar&oferta=1&ordem=menor-preco&favoritos=1"
  ))
`);
check(
  "limpar filtros preserva pesquisa ordenacao e favoritos",
  clearHref === "/buscar/?q=furadeira&ordem=menor-preco&favoritos=1",
  clearHref,
);

const failed = checks.filter(item => !item.pass);
for (const item of checks) {
  console.log(`${item.pass ? "OK" : "FALHA"} - ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nBusca bloqueada: ${failed.length} verificacao(oes) falharam.`);
  process.exit(1);
}

console.log(`\nBusca e filtros aprovados: ${checks.length} verificacoes passaram.`);
