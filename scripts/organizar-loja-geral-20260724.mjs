import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const productsPath = path.join(root, "dados", "products.json");
const storesPath = path.join(root, "dados", "stores.json");
const publicCatalogPath = path.join(root, "dados", "catalogo-publico.json");
const reportJsonPath = path.join(root, "dados", "relatorio-organizacao-geral-loja-20260724.json");
const reportMarkdownPath = path.join(root, "dados", "relatorio-organizacao-geral-loja-20260724.md");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const stores = JSON.parse(fs.readFileSync(storesPath, "utf8"));
const publicCatalog = JSON.parse(fs.readFileSync(publicCatalogPath, "utf8"));

const serviceRules = [
  {
    prefix: "servico-impacto-music-studio-",
    storeId: "impacto-music-studio",
    category: "Serviços Digitais",
    subcategory: "Produção musical",
  },
  {
    prefix: "servico-impacto-academico-",
    storeId: "impacto-academico",
    category: "Serviços Digitais",
    subcategory: "Apoio acadêmico",
  },
  {
    prefix: "servico-impacto-personalizados-",
    storeId: "impacto-personalizados",
    category: "Serviços Digitais",
    subcategory: "Design personalizado",
  },
  {
    prefix: "servico-impacto-criadores-",
    storeId: "impacto-criadores",
    category: "Serviços Digitais",
    subcategory: "Conteúdo para criadores",
  },
];

const categoryByStore = {
  "impacto-mobile": "Celulares e Tecnologia",
  "impacto-tech-computadores": "Celulares e Tecnologia",
  "impacto-eletronicos": "Celulares e Tecnologia",
  "impacto-games": "Games e Setup",
  "impacto-casa": "Casa e Cozinha ou Eletrodomésticos",
  "impacto-decor": "Casa e Cozinha",
  "impacto-sport": "Esporte e Fitness",
  "impacto-moda": "Moda e Calçados",
  "grife-prime": "Moda e Calçados",
  "impacto-calcados": "Moda e Calçados",
  "impacto-ferramentas": "Ferramentas",
  "impacto-brinquedos": "Brinquedos e Escolar",
  "impacto-kids": "Brinquedos e Escolar",
  "impacto-livraria": "Livros, Papelaria e Fé",
  "impacto-fe": "Livros, Papelaria e Fé",
  "impacto-montaria": "Montaria e Cavalgada",
  "impacto-auto": "Auto e Moto",
  "impacto-beauty-care": "Beleza e Cuidados",
  "impacto-pet": "Pets",
  "impacto-educa": "Cursos e Educação",
  "impacto-music-studio": "Serviços Digitais",
  "impacto-academico": "Serviços Digitais",
  "impacto-personalizados": "Serviços Digitais",
  "impacto-criadores": "Serviços Digitais",
  "impacto-ofertas": "Ofertas e Parceiros",
  "lojas-parceiras": "Ofertas e Parceiros",
};

const canonicalCategoryByStore = {
  "impacto-mobile": "Celulares e Tecnologia",
  "impacto-tech-computadores": "Celulares e Tecnologia",
  "impacto-eletronicos": "Celulares e Tecnologia",
  "impacto-games": "Games e Setup",
  "impacto-casa": "Casa e Cozinha",
  "impacto-decor": "Casa e Cozinha",
  "impacto-sport": "Esporte e Fitness",
  "impacto-moda": "Moda e Calçados",
  "grife-prime": "Moda e Calçados",
  "impacto-calcados": "Moda e Calçados",
  "impacto-ferramentas": "Ferramentas",
  "impacto-brinquedos": "Brinquedos e Escolar",
  "impacto-kids": "Brinquedos e Escolar",
  "impacto-livraria": "Livros, Papelaria e Fé",
  "impacto-fe": "Livros, Papelaria e Fé",
  "impacto-montaria": "Montaria e Cavalgada",
  "impacto-auto": "Auto e Moto",
  "impacto-beauty-care": "Beleza e Cuidados",
  "impacto-pet": "Pets",
  "impacto-educa": "Cursos e Educação",
  "impacto-music-studio": "Serviços Digitais",
  "impacto-academico": "Serviços Digitais",
  "impacto-personalizados": "Serviços Digitais",
  "impacto-criadores": "Serviços Digitais",
  "impacto-ofertas": "Ofertas e Parceiros",
  "lojas-parceiras": "Ofertas e Parceiros",
};

const storeIds = new Set(stores.map(store => String(store.id)));
const publicCounts = new Map();
for (const product of publicCatalog) {
  const storeId = String(product?.storeId || "");
  publicCounts.set(storeId, (publicCounts.get(storeId) || 0) + 1);
}

const productChanges = [];
const storeChanges = [];

for (const product of products) {
  const id = String(product.id || "");
  const rule = serviceRules.find(candidate => id.startsWith(candidate.prefix));

  const before = {
    storeId: product.storeId,
    category: product.category,
    categoria: product.categoria,
    subcategoria: product.subcategoria,
  };

  if (rule) {
    product.storeId = rule.storeId;
    product.category = rule.category;
    product.categoria = rule.category;
    product.subcategoria = rule.subcategory;
  } else {
    const canonicalCategory = canonicalCategoryByStore[product.storeId];
    if (canonicalCategory) {
      product.category = canonicalCategory;
      product.categoria = canonicalCategory;
    }
  }

  if (rule && id === "servico-impacto-music-studio-06") {
    const description = "Serviço de música infantil personalizada desenvolvido sob briefing. Escopo, prazo, formato de entrega, direitos de uso e valor são confirmados antes da contratação.";
    product.description = description;
    product.descricaoCurta = description;
    product.descricaoDetalhada = description;
    product.descricaoCompleta = description;
  }
  if (rule && id === "servico-impacto-music-studio-08") {
    const description = "Serviço de narração musical para vídeo desenvolvido sob briefing. Escopo, prazo, formato de entrega, direitos de uso e valor são confirmados antes da contratação.";
    product.description = description;
    product.descricaoCurta = description;
    product.descricaoDetalhada = description;
    product.descricaoCompleta = description;
  }

  const changed = (
    before.storeId !== product.storeId
    || before.category !== product.category
    || before.categoria !== product.categoria
    || before.subcategoria !== product.subcategoria
  );
  if (changed) {
    productChanges.push({
      id,
      name: product.name,
      before,
      after: {
        storeId: product.storeId,
        category: product.category,
        categoria: product.categoria,
        subcategoria: product.subcategoria,
      },
    });
  }
}

for (const store of stores) {
  const publicProducts = publicCounts.get(String(store.id)) || 0;
  const shouldBeActive = publicProducts > 0;
  if (Boolean(store.active) !== shouldBeActive) {
    storeChanges.push({
      id: store.id,
      name: store.name,
      before: Boolean(store.active),
      after: shouldBeActive,
      publicProducts,
    });
    store.active = shouldBeActive;
  }
}

const invalidStoreReferences = products
  .filter(product => !storeIds.has(String(product.storeId || "")))
  .map(product => ({
    id: product.id,
    name: product.name,
    storeId: product.storeId,
  }));

const toolBatch = products.filter(product => String(product.id || "").startsWith("ferramentas-20260724-"));
const toolBatchWrongStore = toolBatch
  .filter(product => (
    product.storeId !== "impacto-ferramentas"
    || product.category !== "Ferramentas"
    || product.categoria !== "Ferramentas"
  ))
  .map(product => ({
    id: product.id,
    name: product.name,
    storeId: product.storeId,
    category: product.category,
    categoria: product.categoria,
  }));

const sportBatch = products.filter(product => String(product.id || "").startsWith("academia-20260724-"));
const sportBatchWrongStore = sportBatch
  .filter(product => (
    product.storeId !== "impacto-sport"
    || product.category !== "Esporte e Fitness"
    || product.categoria !== "Esporte e Fitness"
  ))
  .map(product => ({
    id: product.id,
    name: product.name,
    storeId: product.storeId,
    category: product.category,
    categoria: product.categoria,
  }));

const canonicalCategoryMismatches = products
  .filter(product => {
    const canonicalCategory = canonicalCategoryByStore[product.storeId];
    return canonicalCategory && (
      product.category !== canonicalCategory
      || product.categoria !== canonicalCategory
    );
  })
  .map(product => ({
    id: product.id,
    name: product.name,
    storeId: product.storeId,
    category: product.category,
    categoria: product.categoria,
    expected: canonicalCategoryByStore[product.storeId],
  }));

const productsByStore = {};
for (const store of stores) {
  productsByStore[store.id] = {
    name: store.name,
    total: 0,
    public: publicCounts.get(String(store.id)) || 0,
    active: Boolean(store.active),
    categoryEnvironment: categoryByStore[store.id] || "Revisar",
  };
}
for (const product of products) {
  if (productsByStore[product.storeId]) productsByStore[product.storeId].total += 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  applied: apply,
  totals: {
    products: products.length,
    stores: stores.length,
    publicProducts: publicCatalog.length,
    invalidStoreReferences: invalidStoreReferences.length,
    productRecordsOrganized: productChanges.length,
    storesWithActiveFlagCorrected: storeChanges.length,
    canonicalCategoryMismatches: canonicalCategoryMismatches.length,
  },
  toolBatch: {
    total: toolBatch.length,
    correctStore: toolBatch.length - toolBatchWrongStore.length,
    wrongStore: toolBatchWrongStore,
  },
  sportBatch: {
    total: sportBatch.length,
    correctStore: sportBatch.length - sportBatchWrongStore.length,
    wrongStore: sportBatchWrongStore,
  },
  productChanges,
  storeChanges,
  invalidStoreReferences,
  canonicalCategoryMismatches,
  productsByStore,
};

if (apply) {
  fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  fs.writeFileSync(storesPath, `${JSON.stringify(stores, null, 2)}\n`, "utf8");
  fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const storeLines = Object.entries(productsByStore)
    .sort((a, b) => b[1].public - a[1].public || b[1].total - a[1].total)
    .map(([id, item]) => `| ${id} | ${item.total} | ${item.public} | ${item.active ? "sim" : "não"} | ${item.categoryEnvironment} |`);
  const markdown = [
    "# Relatório de organização geral da loja",
    "",
    "Data: 24/07/2026",
    "",
    "## Resultado",
    "",
    `- Produtos verificados: ${products.length}.`,
    `- Lojas verificadas: ${stores.length}.`,
    `- Produtos públicos: ${publicCatalog.length}.`,
    `- Referências para lojas inexistentes: ${invalidStoreReferences.length}.`,
    `- Registros com ambiente/categoria organizados: ${productChanges.length}.`,
    `- Indicadores de loja ativa corrigidos: ${storeChanges.length}.`,
    `- Produtos fora da categoria canônica após a organização: ${canonicalCategoryMismatches.length}.`,
    `- Lote recente de ferramentas na loja correta: ${toolBatch.length - toolBatchWrongStore.length}/${toolBatch.length}.`,
    `- Lote recente de academia na loja correta: ${sportBatch.length - sportBatchWrongStore.length}/${sportBatch.length}.`,
    "",
    "## Organização por loja",
    "",
    "| Loja | Produtos mestres | Produtos públicos | Ativa | Ambiente de categoria |",
    "|---|---:|---:|:---:|---|",
    ...storeLines,
    "",
    "## Regra aplicada",
    "",
    "A categoria pública respeita primeiro a loja interna do produto. Os campos mestres `category` e `categoria` também foram alinhados ao ambiente canônico da loja; a subcategoria original foi preservada.",
    "",
    "Nenhum produto foi apagado. Casos sem correspondência segura permanecem fora de alterações automáticas.",
    "",
  ].join("\n");
  fs.writeFileSync(reportMarkdownPath, markdown, "utf8");
}

if (process.argv.includes("--summary")) {
  console.log(JSON.stringify({
    applied: report.applied,
    totals: report.totals,
    toolBatch: {
      total: report.toolBatch.total,
      correctStore: report.toolBatch.correctStore,
      wrongStore: report.toolBatch.wrongStore.length,
    },
    sportBatch: {
      total: report.sportBatch.total,
      correctStore: report.sportBatch.correctStore,
      wrongStore: report.sportBatch.wrongStore.length,
    },
  }, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}
