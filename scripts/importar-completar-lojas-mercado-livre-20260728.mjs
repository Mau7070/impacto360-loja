import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const generatedAt = new Date().toISOString();
const reviewDate = "2026-07-28";
const sourceDir = path.join(root, "importacoes", "originais", "2026-07-28-marketplaces-completar-lojas");
const files = {
  products: path.join(root, "dados", "products.json"),
  publicCatalog: path.join(root, "dados", "catalogo-publico.json"),
  stores: path.join(root, "dados", "stores.json"),
  primary: path.join(sourceDir, "mercado-livre-curadoria-links-oficiais.json"),
  niches: path.join(sourceDir, "mercado-livre-reforco-nichos-links-oficiais.json"),
  finalReinforcement: path.join(sourceDir, "mercado-livre-reforco-final-links-oficiais.json"),
  musicFinal: path.join(sourceDir, "mercado-livre-music-studio-final-links-oficiais.json"),
  imported: path.join(root, "dados", "produtos-importados-completar-lojas-20260728.json"),
  reportJson: path.join(root, "dados", "relatorio-importacao-completar-lojas-20260728.json"),
  reportMd: path.join(root, "dados", "relatorio-importacao-completar-lojas-20260728.md"),
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hash(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 10);
}

function marketplaceKey(product) {
  const text = `${product.marketplaceId || ""} ${product.productUrl || ""}`;
  const matched = text.match(/\b(MLBU?)-?(\d+)\b/i);
  return matched ? `${matched[1].toUpperCase()}${matched[2]}` : normalize(product.productUrl).split(/[?#]/)[0];
}

const storeRules = {
  "impacto-mobile": {
    category: "Tecnologia",
    subcategory: "Celulares e acessórios",
    terms: ["celular", "smartphone", "iphone", "carregador", "cabo usb", "capinha", "fone bluetooth", "power bank"],
  },
  "impacto-tech-computadores": {
    category: "Tecnologia",
    subcategory: "Computadores e informática",
    terms: ["notebook", "computador", "monitor", "teclado", "mouse", "ssd", "hd externo", "memoria ram", "impressora", "roteador"],
  },
  "impacto-casa": {
    category: "Casa e Família",
    subcategory: "Casa e cozinha",
    terms: ["air fryer", "fritadeira", "panela", "cozinha", "cafeteira", "liquidificador", "fogao", "cooktop", "colchao", "sofa", "cama"],
  },
  "impacto-moda": {
    category: "Moda e Calçados",
    subcategory: "Moda",
    queries: ["roupas moda"],
    terms: ["camisa", "camiseta", "vestido", "calca ", "jaqueta", "blusa", "bolsa", "mala de viagem"],
  },
  "grife-prime": {
    category: "Moda e Calçados",
    subcategory: "Moda premium e country",
    queries: ["bota country chapeu rodeio", "country rodeio montaria", "roupas moda"],
    terms: ["bota country", "chapeu country", "cinto country", "camisa country", "rodeio", "camisa", "camiseta", "jaqueta", "vestido", "bolsa"],
  },
  "impacto-calcados": {
    category: "Moda e Calçados",
    subcategory: "Calçados",
    queries: ["tenis calcados"],
    terms: ["tenis", "sapato", "sandalia", "chinelo", "sapatilha", "bota "],
  },
  "impacto-ofertas": {
    category: "Ofertas",
    subcategory: "Ofertas populares",
    terms: ["oferta", "desconto", "kit ", "mais vendido"],
  },
  "lojas-parceiras": {
    category: "Ofertas",
    subcategory: "Mercado Livre",
    terms: ["mercado livre"],
  },
  "impacto-eletronicos": {
    category: "Tecnologia",
    subcategory: "Eletrônicos",
    queries: ["eletronicos casa inteligente"],
    terms: ["smart tv", "camera", "eletronico", "caixa de som", "controle remoto", "lampada inteligente", "assistente virtual"],
  },
  "impacto-games": {
    category: "Tecnologia",
    subcategory: "Games",
    queries: ["games gamer"],
    terms: ["gamer", "videogame", "console", "playstation", "xbox", "nintendo", "jogo "],
  },
  "impacto-educa": {
    category: "Educação",
    subcategory: "Material escolar",
    queries: ["material escolar", "kit material escolar"],
    terms: ["material escolar", "caderno", "mochila escolar", "estojo", "lapis", "caneta", "papelaria", "calculadora", "tablet", "livro didatico"],
  },
  "impacto-livraria": {
    category: "Educação",
    subcategory: "Livros",
    queries: ["livros mais vendidos"],
    terms: ["livro", "box ", "colecao literaria", "romance", "literatura"],
  },
  "impacto-beauty-care": {
    category: "Casa e Família",
    subcategory: "Beleza e cuidados pessoais",
    queries: ["beleza cuidados pessoais", "beleza skincare maquiagem"],
    terms: ["skincare", "maquiagem", "perfume", "shampoo", "condicionador", "hidratante", "protetor solar", "secador", "chapinha"],
  },
  "impacto-kids": {
    category: "Casa e Família",
    subcategory: "Bebês e infantil",
    queries: ["roupas infantis bebe"],
    terms: ["bebe", "infantil", "fralda", "mamadeira", "carrinho de bebe", "roupa infantil"],
  },
  "impacto-pet": {
    category: "Casa e Família",
    subcategory: "Pet",
    queries: ["pet cachorro gato", "cama pet", "coleira pet", "brinquedos para cachorro"],
    terms: ["cachorro", "gato", "pet ", "racao", "coleira", "arranhador", "areia sanitaria"],
  },
  "impacto-decor": {
    category: "Casa e Família",
    subcategory: "Decoração",
    queries: ["decoracao para casa", "quadros decoracao"],
    terms: ["decoracao", "quadro", "tapete", "cortina", "almofada", "vaso decorativo", "luminaria"],
  },
  "impacto-fe": {
    category: "Casa e Família",
    subcategory: "Fé e espiritualidade",
    queries: ["biblia evangelica", "camiseta gospel"],
    terms: ["biblia", "gospel", "cristao", "crista", "jesus", "evangelico", "religioso", "devocional"],
  },
  "impacto-music-studio": {
    category: "Serviços Digitais",
    subcategory: "Música e estúdio",
    queries: ["instrumentos musicais"],
    terms: ["violao", "guitarra", "teclado musical", "microfone", "mesa de som", "interface de audio", "pedal", "fone", "caixa de som", "speaker", "amplificador", "cabo", "conector"],
  },
  "impacto-academico": {
    category: "Serviços Digitais",
    subcategory: "Apoio acadêmico",
    queries: ["material escolar", "livros mais vendidos"],
    terms: ["academico", "universitario", "fichario", "marca texto", "calculadora", "tablet", "livro", "notebook", "mochila", "impressora"],
  },
  "impacto-personalizados": {
    category: "Serviços Digitais",
    subcategory: "Personalização",
    queries: ["sublimacao personalizados"],
    terms: ["sublimacao", "prensa termica", "plotter", "impressora", "caneca", "vinil adesivo", "silhouette", "camiseta", "adesivo", "etiqueta", "papel fotografico"],
  },
  "impacto-criadores": {
    category: "Serviços Digitais",
    subcategory: "Equipamentos para criadores",
    queries: ["criador de conteudo"],
    terms: ["ring light", "microfone", "tripé", "tripe", "webcam", "iluminador", "suporte celular", "camera"],
  },
  "impacto-auto": {
    category: "Auto, Ferramentas e Esporte",
    subcategory: "Automotivo",
    queries: ["automotivo", "som automotivo", "tapete automotivo"],
    terms: ["automotivo", "carro", "veiculo", "pneu", "tapete", "som automotivo", "limpeza automotiva"],
  },
  "impacto-ferramentas": {
    category: "Casa e Família",
    subcategory: "Ferramentas",
    terms: ["furadeira", "parafusadeira", "serra", "esmerilhadeira", "ferramenta", "chave ", "alicate", "lavadora", "compressor"],
  },
  "impacto-sport": {
    category: "Auto, Ferramentas e Esporte",
    subcategory: "Esporte e fitness",
    queries: ["academia fitness"],
    terms: ["academia", "fitness", "bicicleta", "halter", "whey", "creatina", "esporte", "futebol", "corrida"],
  },
  "impacto-montaria": {
    category: "Auto, Ferramentas e Esporte",
    subcategory: "Montaria e equitação",
    queries: ["country rodeio montaria", "bota country chapeu rodeio"],
    terms: ["montaria", "rodeio", "cavalo", "equino", "sela", "cabresto", "bota country", "chapeu country"],
  },
  "impacto-brinquedos": {
    category: "Brinquedos",
    subcategory: "Brinquedos",
    queries: ["brinquedos educativos infantil"],
    terms: ["brinquedo", "boneca", "carrinho", "lego", "quebra cabeca", "educativo infantil"],
  },
};

const allProducts = readJson(files.products);
const products = allProducts.filter(product => !String(product.id || "").startsWith("ml-completar-20260728-"));
const publicCatalog = readJson(files.publicCatalog)
  .filter(product => !String(product.id || "").startsWith("ml-completar-20260728-"));
const stores = readJson(files.stores);
const sources = [
  ...readJson(files.primary).products,
  ...readJson(files.niches).products,
  ...readJson(files.finalReinforcement).products,
  ...readJson(files.musicFinal).products,
];
const originalIds = new Set(products.map(product => String(product.id)));
const existingKeys = new Set(products.map(marketplaceKey).filter(Boolean));
const publicCount = new Map(stores.map(store => [store.id, publicCatalog.filter(product => product.storeId === store.id).length]));
const need = new Map(stores.map(store => [store.id, Math.max(0, 100 - (publicCount.get(store.id) || 0))]));

function score(product, storeId) {
  const rule = storeRules[storeId];
  if (!rule) return 0;
  const query = normalize(product.query);
  const text = normalize(`${product.title} ${product.seller} ${product.query}`);
  const exclusiveQueryGroups = [
    [["biblia evangelica", "camiseta gospel"], ["impacto-fe"]],
    [["bota country", "country rodeio"], ["impacto-montaria", "grife-prime"]],
    [["instrumentos musicais"], ["impacto-music-studio"]],
    [["sublimacao personalizados"], ["impacto-personalizados"]],
    [["criador de conteudo"], ["impacto-criadores"]],
    [["material escolar"], ["impacto-educa", "impacto-academico"]],
    [["livros mais vendidos"], ["impacto-livraria", "impacto-academico"]],
    [["roupas moda"], ["impacto-moda", "grife-prime"]],
    [["vestidos femininos moda"], ["impacto-moda", "grife-prime"]],
    [["bolsas femininas premium"], ["grife-prime", "impacto-moda"]],
    [["equipamentos audio estudio musical"], ["impacto-music-studio"]],
    [["cabos conectores audio estudio musical"], ["impacto-music-studio"]],
    [["insumos sublimacao personalizados"], ["impacto-personalizados"]],
    [["games gamer"], ["impacto-games"]],
    [["decoracao para casa", "quadros decoracao"], ["impacto-decor"]],
    [["pet cachorro gato", "cama pet", "coleira pet"], ["impacto-pet"]],
    [["automotivo"], ["impacto-auto"]],
    [["beleza"], ["impacto-beauty-care"]],
    [["roupas infantis"], ["impacto-kids"]],
    [["tenis calcados"], ["impacto-calcados"]],
  ];
  const exclusive = exclusiveQueryGroups.find(([phrases]) => phrases.some(phrase => query.includes(phrase)));
  if (exclusive && !exclusive[1].includes(storeId)) return 0;
  let total = 0;
  for (const phrase of rule.queries || []) {
    if (query.includes(normalize(phrase))) total += 120;
  }
  for (const term of rule.terms || []) {
    if (text.includes(normalize(term))) total += 22;
  }
  if (storeId === "lojas-parceiras") total = 1;
  if (storeId === "impacto-ofertas") total = Math.max(total, 2);
  return total;
}

const candidates = sources
  .filter(product => /^https:\/\/meli\.la\/[A-Za-z0-9_-]+$/.test(product.affiliateLink || ""))
  .filter(product => product.title && product.imageUrl && product.priceLabel)
  .filter(product => !existingKeys.has(marketplaceKey(product)))
  .map(product => ({
    product,
    scores: Object.keys(storeRules)
      .map(storeId => [storeId, score(product, storeId)])
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]),
  }));

const assigned = [];
const usedKeys = new Set();
const assignmentCount = new Map();

// Lojas especializadas recebem primeiro os produtos com correspondência mais forte.
const allocationOrder = [
  "impacto-fe",
  "impacto-music-studio",
  "impacto-montaria",
  "impacto-personalizados",
  "impacto-criadores",
  "impacto-games",
  "impacto-auto",
  "impacto-pet",
  "impacto-decor",
  "impacto-beauty-care",
  "impacto-brinquedos",
  "impacto-livraria",
  "impacto-educa",
  "impacto-moda",
  "grife-prime",
  "impacto-academico",
  "impacto-kids",
  "impacto-calcados",
  "impacto-mobile",
  "impacto-tech-computadores",
  "impacto-eletronicos",
  "impacto-sport",
  "impacto-ferramentas",
  "impacto-casa",
];
for (const storeId of allocationOrder) {
  const required = need.get(storeId) || 0;
  const ranked = candidates
    .filter(entry => !usedKeys.has(marketplaceKey(entry.product)))
    .map(entry => ({ ...entry, ownScore: entry.scores.find(([id]) => id === storeId)?.[1] || 0 }))
    .filter(entry => entry.ownScore >= 22)
    .sort((a, b) => b.ownScore - a.ownScore || Number(b.product.ratingSales?.match(/\d+[.,]?\d*/)?.[0]?.replace(",", ".")) - Number(a.product.ratingSales?.match(/\d+[.,]?\d*/)?.[0]?.replace(",", ".")));
  for (const entry of ranked.slice(0, required)) {
    const key = marketplaceKey(entry.product);
    usedKeys.add(key);
    assigned.push({ ...entry.product, storeId, matchScore: entry.ownScore });
    assignmentCount.set(storeId, (assignmentCount.get(storeId) || 0) + 1);
  }
}

// A vitrine parceira agrega uma seleção transversal, sem duplicar produtos nas lojas internas.
for (const storeId of ["lojas-parceiras", "impacto-ofertas"]) {
  const required = need.get(storeId) || 0;
  const available = candidates.filter(entry => !usedKeys.has(marketplaceKey(entry.product)));
  for (const entry of available.slice(0, required)) {
    const key = marketplaceKey(entry.product);
    usedKeys.add(key);
    assigned.push({ ...entry.product, storeId, matchScore: score(entry.product, storeId) });
    assignmentCount.set(storeId, (assignmentCount.get(storeId) || 0) + 1);
  }
}

function buildProduct(item, index) {
  const rule = storeRules[item.storeId];
  const key = marketplaceKey(item);
  const id = `ml-completar-20260728-${slugify(key || item.title)}-${hash(item.affiliateLink)}`;
  const current = Number(String(item.priceLabel).replace(/\D/g, "")) || 0;
  const previous = Number(String(item.previousPriceLabel || "").replace(/\D/g, "")) || 0;
  const discount = previous > current && current > 0 ? Math.round((1 - current / previous) * 100) : 0;
  const price = current ? `R$ ${current.toLocaleString("pt-BR")}` : "Ver preço no Mercado Livre";
  const description = `Produto físico selecionado em ${reviewDate} no Mercado Livre para a vitrine ${item.storeId}. Link de afiliado gerado oficialmente. Preço, estoque, frete, avaliação e comissão podem mudar; confirme as condições na página do parceiro antes da compra.`;
  const linkFields = {
    affiliateLink: item.affiliateLink,
    linkAfiliado: item.affiliateLink,
    linkCompra: item.affiliateLink,
    linkComissionado: item.affiliateLink,
    linkPlataforma: item.affiliateLink,
    linkOriginal: item.affiliateLink,
    linkPrincipalFonte: item.productUrl,
    linkResolvidoApenasLeitura: item.productUrl,
    linkProdutoApenasLeitura: item.productUrl,
    urlProduto: item.affiliateLink,
  };
  return {
    id,
    storeId: item.storeId,
    name: item.title,
    nome: item.title,
    title: item.title,
    slug: slugify(`${item.title}-${key}`),
    brand: item.seller || "Consultar no Mercado Livre",
    marca: item.seller || "Consultar no Mercado Livre",
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    descricaoCompleta: description,
    textoCatalogo: description,
    price,
    preco: price,
    precoAnterior: previous ? `R$ ${previous.toLocaleString("pt-BR")}` : "",
    desconto: discount ? `${discount}% OFF` : "",
    image: item.imageUrl,
    imagemPrincipal: item.imageUrl,
    fotoPrincipal: item.imageUrl,
    imagem: item.imageUrl,
    galeria: [item.imageUrl],
    fotosExtras: [item.imageUrl],
    badge: discount ? `${discount}% OFF` : "Oferta Mercado Livre",
    category: rule.category,
    categoria: rule.category,
    subcategoria: rule.subcategory,
    source: "Mercado Livre Afiliados",
    origem: "Mercado Livre - curadoria autenticada",
    partner: "Mercado Livre",
    plataforma: "Mercado Livre",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: "imagem real do anúncio",
    statusLink: "link_comissionado_gerado_oficialmente",
    linkStatus: "link de afiliado confirmado",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    editable: true,
    editavelManual: true,
    editavelPorChatGPT: true,
    actionType: "buy",
    fonteMidia: "Mercado Livre",
    ultimaRevisao: reviewDate,
    atualizadoEm: generatedAt,
    publicadoEm: generatedAt,
    disponibilidade: "Confirmar no Mercado Livre",
    avaliacao: item.ratingSales || "Consultar no Mercado Livre",
    vendidos: item.ratingSales || "Oferta ou resultado popular na data da curadoria",
    comissao: "Elegível ao Programa de Afiliados; percentual confirmado no clique/painel",
    specs: [
      `Loja: ${item.storeId}`,
      `Preço exibido na coleta: ${price}`,
      item.ratingSales || "Indicadores atualizados no parceiro",
      "Link oficial de afiliado",
    ],
    beneficios: [
      "Produto físico selecionado em oferta ou busca segmentada.",
      "Destino e imagem correspondem ao anúncio coletado.",
      "Link curto oficial gerado no painel autenticado.",
    ],
    mercadoLivre: {
      itemId: key,
      generatedAffiliateLink: item.affiliateLink,
      directProductUrl: item.productUrl,
      imageSource: item.imageUrl,
      selectedFrom: item.query ? `Busca: ${item.query}` : "Página oficial de Ofertas",
      priceAtSelection: price,
      previousPriceAtSelection: previous || null,
      matchScore: item.matchScore,
      selectionIndex: index + 1,
      generatedAt,
    },
    observacoesInternas: "Importação auditável 2026-07-28. Não substituir o link curto sem nova geração no painel oficial.",
    ...linkFields,
  };
}

const imported = assigned.map(buildProduct).filter(product => !originalIds.has(product.id));
const merged = [...products, ...imported];
const finalCounts = Object.fromEntries(stores.map(store => [
  store.id,
  (publicCount.get(store.id) || 0) + imported.filter(product => product.storeId === store.id).length,
]));
const belowMinimum = Object.entries(finalCounts)
  .filter(([, count]) => count < 100)
  .map(([storeId, count]) => ({ storeId, count, missing: 100 - count }));

const report = {
  generatedAt,
  backupRequired: true,
  sourceProducts: sources.length,
  eligibleCandidates: candidates.length,
  imported: imported.length,
  preservedExisting: products.length,
  mergedTotal: merged.length,
  duplicatesRejected: sources.length - candidates.length,
  unassignedEligible: candidates.length - imported.length,
  assignmentCount: Object.fromEntries([...assignmentCount.entries()].sort()),
  finalCounts,
  belowMinimum,
  publication: "nao_publicado",
};

writeJson(files.imported, imported);
writeJson(files.products, merged);
writeJson(files.reportJson, report);
fs.writeFileSync(files.reportMd, [
  "# Relatório de importação para completar as lojas",
  "",
  `- Gerado em: ${generatedAt}`,
  `- Produtos existentes preservados: ${products.length}`,
  `- Produtos novos importados: ${imported.length}`,
  `- Total no catálogo mestre: ${merged.length}`,
  `- Candidatos elegíveis não usados: ${report.unassignedEligible}`,
  `- Publicação: ${report.publication}`,
  "",
  "## Contagem projetada por loja",
  "",
  "| Loja | Antes | Adicionados | Depois | Situação |",
  "|---|---:|---:|---:|---|",
  ...stores.map(store => {
    const before = publicCount.get(store.id) || 0;
    const added = assignmentCount.get(store.id) || 0;
    const after = finalCounts[store.id];
    return `| ${store.id} | ${before} | ${added} | ${after} | ${after >= 100 ? "OK" : `Faltam ${100 - after}`} |`;
  }),
  "",
  "Itens sem correspondência segura permaneceram fora da importação. Nenhum produto anterior foi removido.",
  "",
].join("\n"), "utf8");

console.log(JSON.stringify(report, null, 2));
