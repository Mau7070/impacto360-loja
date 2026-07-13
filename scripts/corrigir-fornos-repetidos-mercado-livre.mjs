import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const now = new Date().toISOString();

const records = [
  {
    id: "mercado-livre-produto-019",
    title: "Notebook Acer Aspire Go 15 AG15-51P-34KT Intel Core i3 8GB 256GB SSD",
    description: "Notebook Acer Aspire Go 15 com Intel Core i3-1215U, 8 GB DDR5, SSD NVMe de 256 GB, tela 15,3 polegadas e Windows 11.",
    price: "Conferir preco no Mercado Livre",
    affiliateLink: "https://meli.la/1K6Jhmd",
    sourceUrl: "https://www.mercadolivre.com.br/notebook-acer-aspire-go-15-ag15-51p-34kt-intel-core-i3-1215u-12-geraco-8gb-ddr5-256gb-ssd-nvme-tela-153-windows-11/p/MLB66168422",
    imageUrl: "https://http2.mlstatic.com/D_NQ_NP_644949-MLA108097438209_032026-O.webp",
    imageFile: "notebook-acer-aspire-go-15-ag15-51p-34kt-ml.webp",
    storeId: "impacto-tech-computadores",
    category: "Computadores e Informatica",
    subcategory: "Notebooks",
    brand: "Acer",
    highlights: ["Intel Core i3", "8 GB DDR5", "SSD NVMe 256 GB", "Tela 15,3"],
    originNote: "Produto resolvido pelo link curto meli.la/1K6Jhmd em 2026-07-13. O preco nao apareceu de forma confiavel no HTML publico, por isso foi mantido como conferencia no Mercado Livre.",
  },
  {
    id: "mercado-livre-produto-020",
    title: "Notebook Asus TUF Gaming A15 Ryzen 7 RTX 3050 16GB 512GB Linux",
    description: "Notebook Asus TUF Gaming A15 com Ryzen 7, placa RTX 3050, 16 GB de RAM, SSD de 512 GB e Linux em acabamento Graphite Black.",
    price: "Conferir preco no Mercado Livre",
    affiliateLink: "https://meli.la/1Dinaeg",
    sourceUrl: "https://www.mercadolivre.com.br/notebook-asus-tuf-gaming-a15-3050-ryzen-7-16gb-512gb-linux/up/MLBU3787624031?pdp_filters=item_id%3AMLB6254159734",
    imageUrl: "https://http2.mlstatic.com/D_NQ_NP_765183-MLB106604647550_022026-O.webp",
    imageFile: "notebook-asus-tuf-gaming-a15-ryzen7-rtx3050-ml.webp",
    storeId: "impacto-tech-computadores",
    category: "Computadores e Informatica",
    subcategory: "Notebooks gamer",
    brand: "Asus",
    highlights: ["Ryzen 7", "RTX 3050", "16 GB RAM", "SSD 512 GB"],
    originNote: "Produto resolvido pelo link curto meli.la/1Dinaeg em 2026-07-13. O preco nao apareceu de forma confiavel no HTML publico, por isso foi mantido como conferencia no Mercado Livre.",
  },
  {
    id: "mercado-livre-produto-023",
    title: "iPhone 16e 128 GB Preto - Distribuidor Autorizado",
    description: "iPhone 16e com 128 GB na cor preta, anunciado por distribuidor autorizado em lista parceira do Mercado Livre.",
    price: "R$ 3.599,00",
    affiliateLink: "https://meli.la/34dtQGa",
    sourceUrl: "https://www.mercadolivre.com.br/iphone-16e-128-gb-preto-distribuidor-autorizado/p/MLB1046215784",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_961264-MLA95713213402_102025-AB.webp",
    imageFile: "iphone-16e-128gb-preto-mercado-livre.webp",
    storeId: "impacto-mobile",
    category: "Celulares e Smartphones",
    subcategory: "Smartphones",
    brand: "Apple",
    highlights: ["128 GB", "Cor preta", "Distribuidor autorizado", "Lista Mercado Livre"],
    originNote: "O link curto meli.la/34dtQGa abriu uma lista social do Mercado Livre; foi usado o primeiro item real listado publicamente em 2026-07-13, mantendo o link de afiliado original como link de compra.",
  },
  {
    id: "mercado-livre-produto-029",
    title: "Computador All in One 23,8 I7 16GB SSD 512GB Full HD Branco",
    description: "Computador All in One com tela Full HD de 23,8 polegadas, processador i7, 16 GB de RAM e SSD de 512 GB.",
    price: "R$ 2.994,00",
    affiliateLink: "https://meli.la/11MQYNu",
    sourceUrl: "https://www.mercadolivre.com.br/computador-pc-all-in-one-238-i7-16gb-ssd-512gb-full-hd-aio-branco/p/MLB62954535",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_872557-MLA100196104758_122025-AB.webp",
    imageFile: "computador-all-in-one-i7-16gb-512gb-mercado-livre.webp",
    storeId: "impacto-tech-computadores",
    category: "Computadores e Informatica",
    subcategory: "Computadores All in One",
    brand: "Mercado Livre",
    highlights: ["Tela 23,8 Full HD", "Processador i7", "16 GB RAM", "SSD 512 GB"],
    originNote: "O link curto meli.la/11MQYNu abriu uma lista social do Mercado Livre; foi usado o segundo item real listado publicamente em 2026-07-13, mantendo o link de afiliado original como link de compra.",
  },
];

const jsonFiles = [
  "dados/products.json",
  "pacote-github-pages-pronto/dados/products.json",
  "dados/importedMercadoLivreProducts.json",
  "pacote-github-pages-pronto/dados/importedMercadoLivreProducts.json",
];

const htmlFiles = [
  "index.html",
  "impacto360.html",
  "pacote-github-pages-pronto/index.html",
];

const legacyReviewIds = new Set(["loja-parceira-001"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function moneyForText(price) {
  return price.startsWith("R$") ? price : "Conferir preco atualizado";
}

function publicImagePath(record) {
  return `public/images/anuncios/${record.imageFile}`;
}

function productPayload(existing, record) {
  const image = publicImagePath(record);
  const correctedNote = `Corrigido em 2026-07-13: substituido card repetido de forno PFE65 por produto resolvido do link enviado. Link de afiliado preservado: ${record.affiliateLink}.`;

  return {
    ...existing,
    name: record.title,
    title: record.title,
    nome: record.title,
    slug: slugify(record.title),
    brand: record.brand,
    marca: record.brand,
    description: record.description,
    descricaoCurta: record.description,
    descricaoDetalhada: `${record.description} Confira preco, disponibilidade, variacoes e garantia diretamente no Mercado Livre antes de comprar.`,
    descricaoCompleta: `${record.description} Confira preco, disponibilidade, variacoes e garantia diretamente no Mercado Livre antes de comprar.`,
    price: record.price,
    preco: record.price,
    precoPromocional: null,
    precoAnterior: null,
    image,
    imagemPrincipal: image,
    fotoPrincipal: image,
    galeria: [image],
    imagens: [image],
    category: record.category,
    categoria: record.category,
    subcategoria: record.subcategory,
    storeId: record.storeId,
    badge: "Oferta Mercado Livre",
    affiliateLink: record.affiliateLink,
    linkOriginal: record.affiliateLink,
    linkAfiliado: record.affiliateLink,
    link_afiliado: record.affiliateLink,
    linkComissionado: record.affiliateLink,
    linkPlataforma: record.affiliateLink,
    linkCompra: record.affiliateLink,
    linkPrincipalFonte: record.sourceUrl,
    linkResolvidoApenasLeitura: record.sourceUrl,
    linkFinal: record.sourceUrl,
    permalinkPublico: record.sourceUrl,
    urlProduto: record.sourceUrl,
    source: "Mercado Livre",
    origem: "Mercado Livre",
    status: "ativo",
    statusPublicacao: "ativo",
    aprovadoParaPublicacao: true,
    revisaoManualRecomendada: false,
    linkStatus: "link de afiliado preservado e produto corrigido",
    estoque: "Confirmar no Mercado Livre",
    condicao: "Confirmar no Mercado Livre",
    garantia: "Confirmar no Mercado Livre",
    actionType: "buy",
    specs: record.highlights,
    destaques: record.highlights,
    especificacoes: {
      marca: record.brand,
      categoria: record.category,
      subcategoria: record.subcategory,
      fonte: "Mercado Livre",
      linkAfiliadoPreservado: record.affiliateLink,
    },
    mercadoLivre: {
      linkAfiliadoPreservado: record.affiliateLink,
      linkProdutoApenasLeitura: record.sourceUrl,
      fonteImagem: record.imageUrl,
      observacao: record.originNote,
    },
    duplicadoDe: null,
    linksPreservados: [],
    seo: {
      titulo: `${record.title} | IMPACTO 360 AFILIADO`,
      descricao: record.description.slice(0, 155),
      palavrasChave: ["Mercado Livre", record.brand, record.subcategory, "Impacto360"],
    },
    curadoriaMidia: {
      ...(existing.curadoriaMidia || {}),
      imagemPrincipalAtual: image,
      imagemProntaParaPostagem: true,
      imagemCatalogoHtml: image,
      precisaRevisao: false,
      pendencias: [],
      observacaoCuradoria: record.originNote,
    },
    postagem: {
      legendaWhatsApp: `Oferta selecionada no IMPACTO 360 AFILIADO\n\n${record.title}\n${moneyForText(record.price)}\n\n${record.description}\n\nVer oferta no Mercado Livre:\n${record.affiliateLink}\n\nEste conteudo pode conter link de afiliado.`,
      legendaInstagram: `${record.title}\n\n${record.description}\n\n${moneyForText(record.price)}\n\nConfira os detalhes no Mercado Livre pelo link de afiliado preservado.\n\n#Impacto360 #MercadoLivre #OfertasSelecionadas`,
      legendaFacebook: `${record.title}\n\n${record.description}\n\nPreco: ${moneyForText(record.price)}\n\nAcesse pelo link de afiliado da Impacto 360 Afiliado: ${record.affiliateLink}`,
      hashtags: "#Impacto360 #MercadoLivre #OfertasSelecionadas",
      cta: "Ver oferta",
    },
    legendaWhatsApp: `Oferta selecionada no IMPACTO 360 AFILIADO\n\n${record.title}\n${moneyForText(record.price)}\n\n${record.description}\n\nComprar no Mercado Livre:\n${record.affiliateLink}\n\nEste conteudo pode conter link de afiliado.`,
    legendaInstagram: `${record.title}\n\n${record.description}\n\n${moneyForText(record.price)}\n\nConfira os detalhes antes de comprar. Link de afiliado preservado no catalogo.\n\n#Impacto360 #MercadoLivre #OfertasSelecionadas`,
    legendaFacebook: `${record.title}\n\n${record.description}\n\nPreco: ${moneyForText(record.price)}\n\nAcesse pelo link de afiliado da Impacto 360 Afiliado: ${record.affiliateLink}`,
    textoCatalogo: `${record.title} - ${record.description}`,
    observacoes: correctedNote,
    observation: correctedNote,
    origemCorrecao: record.originNote,
    fonteMidia: "HTML publico do Mercado Livre consultado em 2026-07-13",
    statusMidia: "imagem real importada do Mercado Livre",
    pendencias: [],
    ofertas: [
      {
        loja: "Mercado Livre",
        preco: record.price,
        linkCompra: record.affiliateLink,
        linkAfiliado: record.affiliateLink,
        linkOriginal: record.affiliateLink,
      },
    ],
    validacaoOnline: {
      status: "corrigido",
      data: "2026-07-13",
      fonteProduto: record.sourceUrl,
      fonteImagem: record.imageUrl,
      linkAfiliadoPreservado: record.affiliateLink,
    },
    observacaoCorrecao: "Card repetido substituido por produto resolvido do link enviado; dados antigos preservados apenas no backup desta rodada.",
    updatedAt: now,
    historicoCorrecoes: [
      {
        data: "2026-07-13",
        motivo: "substituicao de card repetido de forno PFE65",
        nomeNovo: record.title,
        linkAfiliadoPreservado: record.affiliateLink,
        linkFonteProduto: record.sourceUrl,
      },
    ],
  };
}

async function downloadImage(record) {
  const response = await fetch(record.imageUrl, {
    headers: {
      "User-Agent": "Impacto360Afiliado/1.0 (+https://impacto360afiliado.com.br)",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`Falha ao baixar imagem de ${record.id}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const targets = [
    path.join(root, "public", "images", "anuncios", record.imageFile),
    path.join(packageDir, "public", "images", "anuncios", record.imageFile),
  ];
  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
}

function updateArray(products) {
  const byId = new Map(records.map((record) => [record.id, record]));
  return products.map((product) => {
    const record = byId.get(product.id);
    if (record) return productPayload(product, record);
    if (legacyReviewIds.has(product.id)) return legacyReviewPayload(product);
    return product;
  });
}

function legacyReviewPayload(existing) {
  const preservedLink =
    existing.affiliateLink ||
    existing.linkAfiliado ||
    existing.linkCompra ||
    existing.linkOriginal ||
    existing.url ||
    "";
  const title = "Lista parceira Mercado Livre em revisão";
  const description =
    "Registro mantido fora da vitrine para revisão manual porque o link não confirmou um produto único com segurança.";

  return {
    ...existing,
    name: title,
    title,
    nome: title,
    slug: "lista-parceira-mercado-livre-em-revisao",
    description,
    descricaoCurta: description,
    descricaoDetalhada: `${description} O link original foi preservado para nova conferência antes de qualquer publicação.`,
    descricaoCompleta: `${description} O link original foi preservado para nova conferência antes de qualquer publicação.`,
    price: "Conferir no Mercado Livre",
    preco: "Conferir no Mercado Livre",
    precoPromocional: null,
    precoAnterior: null,
    image: "public/placeholder-produto-mercado-livre.svg",
    imagemPrincipal: "public/placeholder-produto-mercado-livre.svg",
    fotoPrincipal: "public/placeholder-produto-mercado-livre.svg",
    galeria: [],
    imagens: [],
    category: "Ofertas gerais",
    categoria: "Ofertas gerais",
    subcategoria: "Mercado Livre",
    storeId: "lojas-parceiras",
    badge: "Revisão manual",
    affiliateLink: preservedLink,
    linkOriginal: preservedLink,
    linkAfiliado: preservedLink,
    link_afiliado: preservedLink,
    linkComissionado: preservedLink,
    linkPlataforma: preservedLink,
    linkCompra: preservedLink,
    status: "revisao_manual",
    statusPublicacao: "revisao_manual",
    aprovadoParaPublicacao: false,
    productIsVisible: false,
    revisaoManualRecomendada: true,
    linkStatus: "link preservado para revisão manual",
    linkResolvidoApenasLeitura: null,
    linkPrincipalFonte: null,
    linkFinal: null,
    permalinkPublico: null,
    urlProduto: null,
    pendencias: ["Confirmar produto correto antes de publicar"],
    curadoriaMidia: {
      numeroCatalogo: existing.curadoriaMidia?.numeroCatalogo || null,
      imagemPrincipalAtual: "public/placeholder-produto-mercado-livre.svg",
      imagemProntaParaPostagem: false,
      imagemCatalogoHtml: "public/placeholder-produto-mercado-livre.svg",
      videoAtual: "",
      videoProntoParaPostagem: false,
      precisaRevisao: true,
      pendencias: ["confirmar_produto_correto"],
      observacaoCuradoria: "Registro oculto; link preservado para revisao manual antes de nova publicacao.",
    },
    mercadoLivre: {
      linkAfiliadoPreservado: preservedLink,
      observacao: "Link mantido para revisao manual; produto unico nao confirmado com seguranca.",
    },
    fonteMidia: "Registro oculto para revisao manual em 2026-07-13.",
    statusMidia: "sem imagem publicada; item fora da vitrine",
    ultimaRevisao: "2026-07-13",
    duplicadoDe: null,
    linksPreservados: [],
    ofertas: [
      {
        loja: "Mercado Livre",
        preco: "Conferir no Mercado Livre",
        linkCompra: preservedLink,
        linkAfiliado: preservedLink,
        linkOriginal: preservedLink,
      },
    ],
    postagem: {
      legendaWhatsApp: "",
      legendaInstagram: "",
      legendaFacebook: "",
      hashtags: "",
      cta: "Revisar antes de publicar",
    },
    legendaWhatsApp: "",
    legendaInstagram: "",
    legendaFacebook: "",
    textoCatalogo: title,
    observacoes:
      "Registro oculto em 2026-07-13 para remover resquícios do card repetido de forno sem apagar o link original.",
    observation:
      "Registro oculto em 2026-07-13 para remover resquícios do card repetido de forno sem apagar o link original.",
    observacaoCorrecao:
      "Registro oculto em 2026-07-13 para remover residuos de card repetido sem apagar o link original.",
    validacaoOnline: {
      status: "revisao_manual",
      data: "2026-07-13",
      linkAfiliadoPreservado: preservedLink,
      motivo: "link não confirmou produto único com segurança",
    },
    updatedAt: now,
  };
}

function replaceInlineArray(html, variableName, value) {
  const marker = `let ${variableName} =`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Variavel ${variableName} nao encontrada no HTML.`);
  const arrayStart = html.indexOf("[", markerIndex);
  if (arrayStart === -1) throw new Error(`Array ${variableName} nao encontrado no HTML.`);

  let inString = false;
  let escapeNext = false;
  let depth = 0;
  for (let index = arrayStart; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === "\\") {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        const json = JSON.stringify(value, null, 2);
        return `${html.slice(0, arrayStart)}${json}${html.slice(index + 1)}`;
      }
    }
  }
  throw new Error(`Fim do array ${variableName} nao encontrado.`);
}

async function main() {
  for (const record of records) await downloadImage(record);

  const updatedData = {};
  for (const file of jsonFiles) {
    const fullPath = path.join(root, file);
    const data = readJson(fullPath);
    const updated = updateArray(data);
    writeJson(fullPath, updated);
    updatedData[file] = updated;
  }

  const products = readJson(path.join(root, "dados/products.json"));
  const imported = readJson(path.join(root, "dados/importedMercadoLivreProducts.json"));
  for (const file of htmlFiles) {
    const fullPath = path.join(root, file);
    let html = fs.readFileSync(fullPath, "utf8");
    html = replaceInlineArray(html, "importedMercadoLivreProducts", imported);
    html = replaceInlineArray(html, "products", products);
    fs.writeFileSync(fullPath, html, "utf8");
  }

  console.log(`Produtos corrigidos: ${records.map((record) => record.id).join(", ")}`);
  console.log("Imagens importadas:");
  for (const record of records) console.log(`- ${publicImagePath(record)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
