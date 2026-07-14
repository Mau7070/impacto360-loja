import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const now = "2026-07-14T13:58:00-03:00";
const today = "2026-07-14";

const files = {
  products: path.join(root, "dados", "products.json"),
  stores: path.join(root, "dados", "stores.json"),
  packageProducts: path.join(root, "pacote-github-pages-pronto", "dados", "products.json"),
  packageStores: path.join(root, "pacote-github-pages-pronto", "dados", "stores.json"),
  report: path.join(root, "dados", "hotmart-curadoria-20260714.json"),
};

const selectedProducts = [
  {
    id: "hotmart-20260714-novo-decreto-pregao-eletronico-509216",
    hotmartId: "509216",
    storeId: "impacto-educa",
    name: "Curso sobre o novo Decreto do Pregao Eletronico",
    fullName: "Curso sobre o novo Decreto do Pregao Eletronico - Decreto 10.024/2019",
    creator: "Carmen Boaventura",
    category: "Educacao",
    subcategory: "Cursos online",
    badge: "Hotmart ativo",
    price: "R$ 297,00 em 12x de R$ 30,72",
    salesLink: "https://go.hotmart.com/N104413758S",
    productLink: "https://go.hotmart.com/N104413758S?dp=1",
    publicUrl: "https://hotmart.com/pt-br/marketplace/produtos/curso-sobre-o-novo-decreto-do-pregao-eletronico-decreto-10-024-2019/F17831501D?ref=N104413758S",
    imageUrl: "https://hotmart.s3.amazonaws.com/product_pictures/e6b3c99d-8efc-4a49-b6cd-5d6fde77792a/CAPADOCURSO.gif",
    imageFile: "hotmart-curso-novo-decreto-pregao-eletronico-509216.gif",
    description: "Curso online sobre o Decreto 10.024/2019, incluindo a Instrucao Normativa 206/2019, indicado para empresas licitantes, servidores publicos, pregoeiros, advogados e estudantes de Direito.",
    specs: [
      "12 videoaulas com acesso por 6 meses",
      "Tema tecnico: pregao eletronico e compras publicas",
      "Hotlink oficial rastreavel da Hotmart"
    ],
    googleAds: "Curso tecnico de direito administrativo, sem promessa de renda e com destino informativo antes da compra.",
    sourceType: "afiliacao_confirmada",
  },
  {
    id: "hotmart-20260714-pregao-srp-atualizacao-457150",
    hotmartId: "457150",
    storeId: "impacto-educa",
    name: "Pregao Eletronico e Sistema de Registro de Precos",
    fullName: "Curso sobre Pregao Eletronico e Sistema de Registro de Precos",
    creator: "Carmen Boaventura",
    category: "Educacao",
    subcategory: "Cursos online",
    badge: "Combo Hotmart",
    price: "R$ 497,00 em 12x de R$ 51,40",
    salesLink: "https://go.hotmart.com/J104413767N",
    productLink: "https://go.hotmart.com/J104413767N?dp=1",
    publicUrl: "https://hotmart.com/pt-br/marketplace/produtos/curso-sobre-pregao-eletronico-e-presencial-e-sistema-de-registro-de-precos-com-as-alteracoes-trazidas-pelo-decreto-9488-2018/X15966484F?ref=J104413767N",
    imageUrl: "https://hotmart.s3.amazonaws.com/product_pictures/e20bd5e3-2463-466a-bca1-05ca23590a55/combo.jpg",
    imageFile: "hotmart-pregao-eletronico-srp-atualizacao-457150.jpg",
    description: "Curso online com dois modulos: Pregao Eletronico e Sistema de Registro de Precos, com atualizacoes do Decreto 9.488/2018 e modulo sobre o Decreto 10.024/2019.",
    specs: [
      "Combo com dois modulos",
      "Acompanha e-book sobre SRP",
      "Hotlink oficial rastreavel da Hotmart"
    ],
    googleAds: "Oferta educacional tecnica com pagina de produto transparente e sem alegacoes sensiveis.",
    sourceType: "afiliacao_confirmada",
  },
  {
    id: "hotmart-20260714-sistema-registro-precos-456474",
    hotmartId: "456474",
    storeId: "impacto-educa",
    name: "Curso sobre Sistema de Registro de Precos",
    fullName: "Curso sobre Sistema de Registro de Precos",
    creator: "Carmen Boaventura",
    category: "Educacao",
    subcategory: "Cursos online",
    badge: "Hotmart curso",
    price: "R$ 197,00 em 12x de R$ 20,37",
    salesLink: "https://go.hotmart.com/L104413771X",
    productLink: "https://go.hotmart.com/L104413771X?dp=1",
    publicUrl: "https://hotmart.com/pt-br/marketplace/produtos/curso-sobre-sistema-de-registro-de-precos/E15936277I?ref=L104413771X",
    imageUrl: "https://hotmart.s3.amazonaws.com/product_contents/1722c273-f6de-45a7-bfbb-7195b197e37f/CURSOSRP.jpg",
    imageFile: "hotmart-curso-sistema-registro-precos-456474.jpg",
    description: "Curso online sobre Sistema de Registro de Precos, com foco teorico e pratico para empresas, estudantes, servidores publicos e equipes de licitacao.",
    specs: [
      "10 videoaulas",
      "Conteudo sobre Decreto 9.488/2018",
      "Hotlink oficial rastreavel da Hotmart"
    ],
    googleAds: "Produto educacional profissional com texto neutro e pagina de produto publica.",
    sourceType: "afiliacao_confirmada",
  },
  {
    id: "hotmart-20260714-dominando-as-licitacoes-3980357",
    hotmartId: "3980357",
    storeId: "impacto-educa",
    name: "Dominando as Licitacoes",
    fullName: "Dominando as Licitacoes",
    creator: "Alessandro Garcia Linares",
    category: "Educacao",
    subcategory: "Treinamentos profissionais",
    badge: "Guia pratico",
    price: "R$ 385,00",
    salesLink: "https://go.hotmart.com/Y104428837Q",
    productLink: "https://go.hotmart.com/Y104428837Q?dp=1",
    publicUrl: "https://hotmart.com/pt-br/marketplace/produtos/dominando-as-licitacoes/M92035008J?ref=Y104428837Q",
    imageUrl: "https://hotmart.s3.amazonaws.com/product_pictures/57ca8a5a-2a18-474a-a94a-94d5127307d9/DominandoasLicitacoes2.jpg",
    imageFile: "hotmart-dominando-as-licitacoes-3980357.jpg",
    description: "Guia pratico para empresarios, empreendedores e fornecedores entenderem licitacoes municipais, editais, propostas, requisitos legais e estrategias de participacao.",
    specs: [
      "Foco em fornecedores e empresarios",
      "Conteudo sobre licitacoes municipais",
      "Hotlink oficial rastreavel da Hotmart"
    ],
    googleAds: "Conteudo profissional sobre licitacoes; usar chamadas informativas, sem prometer contratos ou resultados.",
    sourceType: "afiliacao_confirmada",
  },
  {
    id: "hotmart-20260714-a-palavra-e-o-ser-7448602",
    hotmartId: "7448602",
    storeId: "impacto-fe",
    name: "A Palavra e o Ser",
    fullName: "A Palavra e o Ser",
    creator: "Mauricio",
    category: "Fe e espiritualidade",
    subcategory: "E-books digitais",
    badge: "Produto Mauricio",
    price: "R$ 25,00 em 3x de R$ 8,92",
    salesLink: "https://go.hotmart.com/S105072773O",
    productLink: "https://go.hotmart.com/S105072773O?dp=1",
    publicUrl: "https://hotmart.com/pt-br/marketplace/produtos/a-palavra-e-o-ser/S105072773O",
    imageUrl: "https://hotmart.s3.amazonaws.com/product_pictures/9b927692-a388-4073-a11b-0c5fccee2812/mauricio.png",
    imageFile: "hotmart-a-palavra-e-o-ser-7448602.png",
    description: "E-book sobre sinceridade, fe e transformacao interior, com reflexoes sobre a palavra que nasce do coracao e fortalece relacoes.",
    specs: [
      "E-book digital",
      "Produto proprio na Hotmart",
      "Hotlink oficial rastreavel da Hotmart"
    ],
    googleAds: "Conteudo espiritual; evitar segmentacao personalizada sensivel e usar descricao neutra da obra.",
    sourceType: "produto_proprio",
  },
  {
    id: "hotmart-20260714-o-grande-arco-das-profecias-7454181",
    hotmartId: "7454181",
    storeId: "impacto-fe",
    name: "O Grande Arco das Profecias",
    fullName: "O Grande Arco das Profecias",
    creator: "Mauricio",
    category: "Fe e espiritualidade",
    subcategory: "E-books digitais",
    badge: "Produto Mauricio",
    price: "R$ 10,00",
    salesLink: "https://go.hotmart.com/S105087720G",
    productLink: "https://go.hotmart.com/S105087720G?dp=1",
    publicUrl: "https://hotmart.com/pt-br/marketplace/produtos/o-grande-arco-das-profecias/S105087720G",
    imageUrl: "https://hotmart.s3.amazonaws.com/product_pictures/b4e81988-383f-4ec9-8c44-2953130623e9/DRAGAO.png",
    imageFile: "hotmart-o-grande-arco-das-profecias-7454181.png",
    description: "E-book de estudo e reflexao sobre profecias biblicas, conectando Genesis, profetas do Antigo Testamento, Daniel, Ezequiel, Isaias e Apocalipse.",
    specs: [
      "E-book digital",
      "Produto proprio na Hotmart",
      "Hotlink oficial rastreavel da Hotmart"
    ],
    googleAds: "Conteudo espiritual e literario; manter divulgacao descritiva e sem alegacoes absolutas.",
    sourceType: "produto_proprio",
  },
];

const marketCandidates = [
  {
    name: "Leadlovers | Mais Vendas, Menos Esforco",
    reason: "Produto quente, 150 graus, 4.3/5 com 1493 avaliacoes; comissao exibida como 'ver detalhes'.",
    status: "nao_publicado",
    actionNeeded: "Solicitar/confirmar afiliacao e obter Hotlink antes de anunciar."
  },
  {
    name: "Viva Sempre com Dinheiro",
    reason: "Produto quente, 150 graus, 4.9/5 com 118 avaliacoes e comissao alta exibida.",
    status: "nao_publicado",
    actionNeeded: "Area financeira exige revisao cuidadosa para Google Ads e afiliacao confirmada antes de publicar."
  },
  {
    name: "Acesso Vitalicio - Asimov Academy",
    reason: "Comissao alta exibida e tema educacional/tecnologia, mas avaliacao 3.6/5 com poucas avaliacoes.",
    status: "nao_publicado",
    actionNeeded: "Confirmar afiliacao, reputacao e Hotlink antes de entrar na loja."
  }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function ensureSubcategories(stores) {
  const additions = {
    "impacto-educa": ["Hotmart", "Licitacoes", "Compras publicas"],
    "impacto-fe": ["E-books digitais", "Hotmart", "Profecias biblicas"],
  };
  return stores.map(store => {
    const extra = additions[store.id];
    if (!extra) return store;
    const subcategories = Array.isArray(store.subcategories) ? store.subcategories : [];
    return {
      ...store,
      subcategories: [...new Set([...subcategories, ...extra])],
    };
  });
}

function makeProduct(item) {
  const image = `public/images/anuncios/${item.imageFile}`;
  const description = `${item.description} Confira preco, disponibilidade, garantia e condicoes diretamente na Hotmart antes de comprar. Este conteudo pode conter link de afiliado.`;
  const link = item.productLink;
  const text = `Oferta Hotmart selecionada no IMPACTO 360 AFILIADO\n\n${item.fullName}\n${item.price}\n\n${item.description}\n\nVer na Hotmart:\n${link}\n\nEste conteudo pode conter link de afiliado.`;
  return {
    id: item.id,
    storeId: item.storeId,
    name: item.name,
    nome: item.name,
    title: item.name,
    slug: item.id.replace(/^hotmart-20260714-/, ""),
    brand: "Hotmart",
    marca: "Hotmart",
    creator: item.creator,
    produtor: item.creator,
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    descricaoCompleta: description,
    textoCatalogo: `${item.fullName} - ${description}`,
    price: item.price,
    preco: item.price,
    precoPromocional: item.price,
    precoAnterior: "",
    parcelas: item.price.includes(" em ") ? item.price.replace(/^.*?\s+em\s+/, "") : "",
    frete: "Produto digital Hotmart",
    image,
    imagemPrincipal: image,
    fotoPrincipal: image,
    imagem: image,
    galeria: [image],
    fotosExtras: [image],
    badge: item.badge,
    category: item.category,
    categoria: item.category,
    subcategoria: item.subcategory,
    source: "Hotmart",
    origem: `Hotmart - ${item.sourceType === "produto_proprio" ? "produto proprio" : "afiliacao confirmada"}`,
    plataformaOrigem: "Hotmart",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: "imagem oficial da pagina Hotmart",
    statusLink: "link_hotmart_rastreavel_confirmado",
    linkStatus: "Hotlink oficial confirmado na conta Hotmart",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    destaqueHome: true,
    publicarNaHome: true,
    publicar: true,
    editable: true,
    editavelManual: true,
    editavelPorChatGPT: true,
    actionType: "buy",
    buttonLabel: "Ver na Hotmart",
    chamadaCompra: "Ver na Hotmart",
    fonteMidia: "Pagina publica Hotmart e conta Hotmart logada",
    ultimaRevisao: today,
    atualizadoEm: now,
    publicadoEm: now,
    disponibilidade: "Ativo na Hotmart na data da curadoria; confirmar condicoes antes da compra.",
    specs: item.specs,
    beneficios: [
      "Produto digital com pagina publica da Hotmart.",
      "Hotlink rastreavel confirmado na conta logada.",
      "Card organizado na loja adequada para facilitar a compra no celular e no computador."
    ],
    hotmart: {
      productId: item.hotmartId,
      creator: item.creator,
      salesLink: item.salesLink,
      productPageLink: item.productLink,
      publicUrl: item.publicUrl,
      imageSource: item.imageUrl,
      sourceType: item.sourceType,
      selectedAt: now
    },
    googleAdsRevisao: {
      adequadoPrimeiraDivulgacao: true,
      motivo: item.googleAds,
      cuidados: [
        "Usar a pagina do produto Hotmart como destino, nao promessa exagerada.",
        "Nao anunciar preco fixo sem confirmar se continua igual na Hotmart.",
        "Manter transparencia de link de afiliado quando necessario."
      ]
    },
    textoWhatsApp: text,
    legendaWhatsApp: text,
    legendaInstagram: `${item.fullName}\n\n${item.description}\n\n${item.price}\n\nConfira na Hotmart pelo link oficial da loja.\n\n#Impacto360 #Hotmart #ProdutosDigitais`,
    legendaFacebook: `${item.fullName}\n\n${item.description}\n\nPreco: ${item.price}\n\nAcesse pela Impacto 360 Afiliado: ${link}`,
    hashtags: ["#Impacto360", "#Hotmart", "#ProdutosDigitais"],
    observacoesInternas: "Produto importado em 2026-07-14 apos confirmacao de Hotlink na conta Hotmart.",
    affiliateLink: link,
    linkAfiliado: link,
    linkCompra: link,
    linkComissionado: link,
    linkPlataforma: link,
    linkOriginal: item.salesLink,
    linkPrincipalFonte: item.publicUrl,
    linkResolvidoApenasLeitura: item.publicUrl,
    linkProdutoApenasLeitura: item.publicUrl,
    urlProduto: link,
    ofertas: [
      {
        loja: "Hotmart",
        preco: item.price,
        linkCompra: link,
        linkAfiliado: link,
        linkOriginal: item.salesLink
      }
    ],
  };
}

async function downloadImage(item, baseDir) {
  const destination = path.join(baseDir, "public", "images", "anuncios", item.imageFile);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const response = await fetch(item.imageUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem ${item.imageUrl}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, buffer);
  return destination;
}

function mergeProducts(existing) {
  const ids = new Set(selectedProducts.map(item => item.id));
  const hotmartLinks = new Set(selectedProducts.flatMap(item => [item.salesLink, item.productLink]).map(link => link.toLowerCase()));
  const filtered = existing.filter(product => {
    if (ids.has(product.id)) return false;
    const link = String(product.linkCompra || product.linkAfiliado || product.affiliateLink || product.linkComissionado || "").toLowerCase();
    return !hotmartLinks.has(link);
  });
  return [...selectedProducts.map(makeProduct), ...filtered];
}

for (const item of selectedProducts) {
  await downloadImage(item, root);
  await downloadImage(item, path.join(root, "pacote-github-pages-pronto"));
}

const products = mergeProducts(readJson(files.products));
writeJson(files.products, products);
writeJson(files.packageProducts, products);

const stores = ensureSubcategories(readJson(files.stores));
writeJson(files.stores, stores);
writeJson(files.packageStores, stores);

writeJson(files.report, {
  generatedAt: now,
  addedProducts: selectedProducts.map(item => ({
    id: item.id,
    hotmartId: item.hotmartId,
    name: item.fullName,
    storeId: item.storeId,
    link: item.productLink,
    sourceType: item.sourceType,
  })),
  marketCandidatesNotPublished: marketCandidates,
  decision: "Apenas produtos com Hotlink rastreavel confirmado foram publicados como ativos. Produtos do mercado sem afiliacao confirmada ficaram fora da loja ativa.",
});

console.log(`Produtos Hotmart adicionados/atualizados: ${selectedProducts.length}`);
console.log(`Total de produtos no catalogo: ${products.length}`);
