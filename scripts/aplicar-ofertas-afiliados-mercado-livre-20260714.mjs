import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const packageDir = path.join(root, "pacote-github-pages-pronto");
const generatedAt = new Date().toISOString();
const reviewDate = "2026-07-14";

const files = {
  products: path.join(root, "dados", "products.json"),
  banners: path.join(root, "dados", "banners-anuncios.json"),
  packageProducts: path.join(packageDir, "dados", "products.json"),
  packageBanners: path.join(packageDir, "dados", "banners-anuncios.json"),
  report: path.join(root, "dados", "relatorio-ofertas-mercado-livre-2026-07-14.json"),
};

const offers = [
  {
    slug: "fone-usb-c-premium-microfone",
    headline: "Fone USB-C premium com microfone",
    name: "Fones De Ouvido USB-C Tipo C Com Microfone Integrado Som Estereo Alta Qualidade",
    storeId: "impacto-mobile",
    category: "Tecnologia",
    subcategoria: "Fones e acessorios",
    originalUrl: "https://www.mercadolivre.com.br/fones-de-ouvido-usb-c-tipo-c-com-microfone-integrado-som-estereo-alta-qualidade-controle-de-chamadas-compativel-com-iphone-15-16-17-android-samsung-xiaomi-motorola-conexo-direta-premium-eletric-teck/p/MLB65764004?pdp_filters=item_id%3AMLB6290239732&extra_comm=true#polycard_client=affiliates&wid=MLB6290239732&sid=affiliates",
    affiliateLink: "https://meli.la/17grvSz",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_693659-MLA113618776783_062026-AB.webp",
    rating: "4.8",
    sold: "+10 mil vendidos",
    discount: "65% OFF",
    earnings: "Ganhos extras 15%",
    badge: "Oferta imperdivel",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "faqueiro-tramontina-buzios-24-pecas",
    headline: "Faqueiro Tramontina inox 24 pecas",
    name: "Faqueiro Tramontina Buzios Cem Aco Inox Com Detalhe 24 Pecas",
    storeId: "impacto-casa",
    category: "Casa e Cozinha",
    subcategoria: "Utensilios de cozinha",
    originalUrl: "https://www.mercadolivre.com.br/faqueiro-tramontina-buzios-cem-aco-inox-com-detalhe-24-pecas/p/MLB29913761?pdp_filters=deal%3AMLB1578289-1&extra_comm=false#polycard_client=affiliates&wid=MLB3908372167&sid=affiliates",
    affiliateLink: "https://meli.la/2eY2XjT",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_852034-MLA99850814177_112025-AB.webp",
    rating: "4.7",
    sold: "+100 mil vendidos",
    discount: "23% OFF",
    earnings: "Ganhos 12%",
    badge: "Oferta imperdivel",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "parafusadeira-furadeira-2-baterias-kit",
    headline: "Parafusadeira completa com 2 baterias",
    name: "Parafusadeira Furadeira Com 2 Baterias Maleta Kit Completo Led Eixo Flexivel",
    storeId: "impacto-ferramentas",
    category: "Ferramentas",
    subcategoria: "Ferramentas eletricas",
    originalUrl: "https://www.mercadolivre.com.br/parafusadeira-furadeira-c-2-baterias-maleta-kit-completo-led-eixo-flexivel-varios-niveis-torque-simake/p/MLB50181290?pdp_filters=item_id%3AMLB4345564271&extra_comm=true#polycard_client=affiliates&wid=MLB4345564271&sid=affiliates",
    affiliateLink: "https://meli.la/239Rngc",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_641541-MLA111608975062_062026-AB.webp",
    rating: "4.7",
    sold: "+50 mil vendidos",
    discount: "59% OFF",
    earnings: "Ganhos extras 16%",
    badge: "Mais vendido",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "carregador-iphone-turbo-usb-c",
    headline: "Carregador turbo USB-C para iPhone",
    name: "Carregador Compativel Com iPhone 8 X XR 11 12 13 14 Pro Max Turbo Fonte Tipo C",
    storeId: "impacto-mobile",
    category: "Tecnologia",
    subcategoria: "Carregadores",
    originalUrl: "https://www.mercadolivre.com.br/carregador-compativel-com-iphone-8-x-xr-11-12-13-14-pro-max-turbo-fonte-tipo-c-boyu-cell/p/MLB43351618?pdp_filters=item_id%3AMLB4136027339&extra_comm=true#polycard_client=affiliates&wid=MLB4136027339&sid=affiliates",
    affiliateLink: "https://meli.la/1cKeBBQ",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_945381-MLA108251647129_032026-AB.webp",
    rating: "4.8",
    sold: "+100 mil vendidos",
    discount: "29% OFF",
    earnings: "Ganhos extras 30%",
    badge: "Mais vendido",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "mala-bordo-expansivel-rodas-360",
    headline: "Mala de bordo expansivel rodas 360",
    name: "Mala De Viagem Bordo Sweet Studio ABS Com Ziper Expansivel Resistente Rodas 360",
    storeId: "impacto-moda",
    category: "Moda e Acessorios",
    subcategoria: "Malas e viagem",
    originalUrl: "https://www.mercadolivre.com.br/mala-de-viagem-bordo-sweet-studio-abs-com-ziper-expansivel-resistente-rodas-360/p/MLB58585960?pdp_filters=deal%3AMLB1578289-1&extra_comm=false#polycard_client=affiliates&wid=MLB7127191504&sid=affiliates",
    affiliateLink: "https://meli.la/2P5pLLT",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_962371-MLA113820593871_062026-AB.webp",
    rating: "4.8",
    sold: "+500 vendidos",
    discount: "42% OFF",
    earnings: "Ganhos 16%",
    badge: "Mais vendido",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "air-fryer-elgin-quad-fry-42l",
    headline: "Air Fryer Elgin Quad Fry 4,2L",
    name: "Fritadeira Eletrica Air Fryer Quad Fry 4,2 L 1400w Preto Elgin",
    storeId: "impacto-casa",
    category: "Casa e Cozinha",
    subcategoria: "Pequenos eletros",
    originalUrl: "https://www.mercadolivre.com.br/fritadeira-eletrica-air-fryer-quad-fry-42-l1400w-preto-elgin/p/MLB52868715?pdp_filters=deal%3AMLB1578289-1&extra_comm=false#polycard_client=affiliates&wid=MLB4150270587&sid=affiliates",
    affiliateLink: "https://meli.la/2bjTrVf",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_813389-MLA99520090726_112025-AB.webp",
    rating: "4.9",
    sold: "+50 mil vendidos",
    discount: "43% OFF",
    earnings: "Ganhos 5%",
    badge: "Mais vendido",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "camera-ip-a8-externa-wifi-hd",
    headline: "Camera IP externa Wi-Fi HD",
    name: "Camera IP A8 App Icsee Infravermelho Prova D'agua Externa Wifi HD",
    storeId: "impacto-eletronicos",
    category: "Tecnologia",
    subcategoria: "Seguranca e cameras",
    originalUrl: "https://www.mercadolivre.com.br/cmera-ip-a8-app-icsee-infravermelho-prova-dagua-externa-wifi-hd-cor-branco/p/MLB25474028?pdp_filters=deal%3AMLB1578289-1&extra_comm=false#polycard_client=affiliates&wid=MLB6444025356&sid=affiliates",
    affiliateLink: "https://meli.la/2Fmnep5",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_921837-MLA99700943906_122025-AB.webp",
    rating: "4.7",
    sold: "+100 mil vendidos",
    discount: "52% OFF",
    earnings: "Ganhos 12%",
    badge: "Oferta imperdivel",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "lavadora-jato-portatil-2-baterias",
    headline: "Lavadora portatil com 2 baterias",
    name: "Lavadora Lava Jato Portatil Pressao 2 Baterias Com Maleta",
    storeId: "impacto-ferramentas",
    category: "Ferramentas",
    subcategoria: "Limpeza e manutencao",
    originalUrl: "https://www.mercadolivre.com.br/lavadora-lava-jato-portatil-pressao-2-baterias--maleta/up/MLBU605239077?pdp_filters=item_id%3AMLB3621404839&extra_comm=true#polycard_client=affiliates&wid=MLB3621404839&sid=affiliates",
    affiliateLink: "https://meli.la/2PAAQXh",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_710675-MLB89102120983_082025-AB.webp",
    rating: "4.5",
    sold: "+100 mil vendidos",
    discount: "52% OFF",
    earnings: "Ganhos extras 16%",
    badge: "Mais vendido",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "lixeira-inteligente-sensor-16l",
    headline: "Lixeira inteligente com sensor 16L",
    name: "Lixeira Inteligente Com Sensor 16L Branca Moderna Para Uso Residencial E Comercial",
    storeId: "impacto-casa",
    category: "Casa e Cozinha",
    subcategoria: "Organizacao",
    originalUrl: "https://www.mercadolivre.com.br/lixeira-inteligente-com-sensor-16l-cor-branco-duravel-e-moderna-para-residencial-e-comercial/p/MLB61992224?pdp_filters=item_id%3AMLB4686099901&extra_comm=true#polycard_client=affiliates&wid=MLB4686099901&sid=affiliates",
    affiliateLink: "https://meli.la/1pj1XgT",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_773029-MLA111797765655_052026-AB.webp",
    rating: "4.8",
    sold: "+1 mil vendidos",
    discount: "46% OFF",
    earnings: "Ganhos extras 20%",
    badge: "Oferta imperdivel",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "bicicleta-spinning-premium-liftness",
    headline: "Bike spinning premium com visor",
    name: "Bicicleta Spinning Premium Liftness Com Visor E Medidor De Pulso",
    storeId: "impacto-sport",
    category: "Esporte e Fitness",
    subcategoria: "Fitness em casa",
    originalUrl: "https://www.mercadolivre.com.br/bicicleta-spinning-premium-liftness-com-visor-e-medidor-de-pulso-ergometrica-semi-profissional-bike-sport-preto/p/MLB75224285?pdp_filters=deal%3AMLB1578289-1&extra_comm=false#polycard_client=affiliates&wid=MLB4642623937&sid=affiliates",
    affiliateLink: "https://meli.la/1TAVap6",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_820156-MLA114297427777_072026-AB.webp",
    rating: "4.8",
    sold: "+1 mil vendidos",
    discount: "36% OFF",
    earnings: "Ganhos 16%",
    badge: "Mais vendido",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "escada-aluminio-dobravel-3-degraus",
    headline: "Escada dobravel de aluminio 3 degraus",
    name: "Escada De Aluminio Dobravel Compacta Com 3 Degraus Leve E Resistente",
    storeId: "impacto-ferramentas",
    category: "Ferramentas",
    subcategoria: "Casa e manutencao",
    originalUrl: "https://www.mercadolivre.com.br/escada-de-aluminio-dobravel-compacta-com-3-degraus-botafogo-leve-e-resistente/p/MLB36357228?pdp_filters=deal%3AMLB1578289-1&extra_comm=false#polycard_client=affiliates&wid=MLB4721188228&sid=affiliates",
    affiliateLink: "https://meli.la/2Vf9WoL",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_615215-MLA96103942891_102025-AB.webp",
    rating: "4.9",
    sold: "+50 mil vendidos",
    discount: "5% OFF",
    earnings: "Ganhos 12%",
    badge: "Oferta imperdivel",
    proof: "Central de Afiliados do Mercado Livre",
  },
  {
    slug: "kit-2-jaquetas-corta-vento",
    headline: "Kit 2 jaquetas corta vento",
    name: "Kit 2 Jaquetas Corta Vento Impermeavel Liso Unissex",
    storeId: "impacto-moda",
    category: "Moda e Acessorios",
    subcategoria: "Moda unissex",
    originalUrl: "https://produto.mercadolivre.com.br/MLB-3982398179-kit-2-jaquetas-corta-vento-impermeavel-liso-unissex-_JM?searchVariation=182962591364&pdp_filters=item_id%3AMLB3982398179&extra_comm=true#polycard_client=affiliates",
    affiliateLink: "https://meli.la/2QyCRCZ",
    imageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_838755-MLB91813193542_092025-AB-kit-2-jaquetas-corta-vento-impermeavel-liso-unissex.webp",
    rating: "4.6",
    sold: "+1 mil vendidos",
    discount: "42% OFF",
    earnings: "Ganhos extras 36%",
    badge: "Oferta de moda",
    proof: "Central de Afiliados do Mercado Livre",
  },
];

function readJson(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function shortHash(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 8);
}

function extractWid(url) {
  return String(url || "").match(/[?&#]wid=(MLB\d+)/)?.[1] || String(url || "").match(/item_id%3A(MLB\d+)/)?.[1] || "";
}

function extractCatalogId(url) {
  return String(url || "").match(/\/p\/(MLB\d+)/)?.[1] || String(url || "").match(/\/up\/(MLBU\d+)/)?.[1] || "";
}

function imagePathFor(offer) {
  return `public/images/anuncios/ml-afiliados-20260714-${offer.slug}-${shortHash(offer.imageUrl)}.webp`;
}

async function downloadImage(offer) {
  const relative = imagePathFor(offer);
  const targets = [path.join(root, relative), path.join(packageDir, relative)];
  const existing = targets.find(file => fs.existsSync(file));
  let bytes;
  if (existing) {
    bytes = fs.readFileSync(existing);
  } else {
    const response = await fetch(offer.imageUrl, {
      headers: {
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`Falha ao baixar imagem ${offer.slug}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (bytes.length < 500) throw new Error(`Imagem muito pequena para ${offer.slug}`);
  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return relative;
}

function buildDescription(offer) {
  return [
    `Oferta selecionada em ${reviewDate} na Central de Afiliados do Mercado Livre.`,
    `Indicadores exibidos na curadoria: avaliacao ${offer.rating}/5, ${offer.sold}, ${offer.discount} e ${offer.earnings.toLowerCase()}.`,
    "Confira preco, prazo de entrega, disponibilidade e condicoes diretamente no Mercado Livre antes de finalizar a compra.",
    "Este conteudo pode conter link de afiliado.",
  ].join(" ");
}

function buildProduct(offer, image, index) {
  const productId = `ml-afiliados-20260714-${offer.slug}`;
  const description = buildDescription(offer);
  const price = "Ver preco no Mercado Livre";
  const tags = ["#Impacto360", "#MercadoLivre", "#OfertasSelecionadas", `#${slugify(offer.category).replace(/-/g, "")}`];
  const commonLinks = {
    affiliateLink: offer.affiliateLink,
    linkAfiliado: offer.affiliateLink,
    linkCompra: offer.affiliateLink,
    linkComissionado: offer.affiliateLink,
    linkPlataforma: offer.affiliateLink,
    linkOriginal: offer.affiliateLink,
    linkPrincipalFonte: offer.originalUrl,
    linkResolvidoApenasLeitura: offer.originalUrl,
    linkProdutoApenasLeitura: offer.originalUrl,
    urlProduto: offer.affiliateLink,
  };

  return {
    id: productId,
    storeId: offer.storeId,
    name: offer.name,
    nome: offer.name,
    description,
    descricaoCurta: description,
    fullDescription: description,
    descricaoDetalhada: description,
    descricaoCompleta: description,
    price,
    preco: price,
    precoAnterior: "",
    desconto: offer.discount,
    parcelas: "",
    frete: "Confirmar no Mercado Livre",
    image,
    imagemPrincipal: image,
    fotoPrincipal: image,
    imagem: image,
    galeria: [image],
    fotosExtras: [image],
    badge: `${offer.discount} Mercado Livre`,
    category: offer.category,
    categoria: offer.category,
    subcategoria: offer.subcategoria,
    source: "Mercado Livre",
    origem: "Mercado Livre - Central de Afiliados",
    status: "ativo",
    statusAnuncio: "ativo",
    statusImagem: "imagem_ok",
    statusMidia: "imagem real do anuncio Mercado Livre",
    statusLink: "link_comissionado_gerado_oficialmente",
    linkStatus: "link de afiliado confirmado",
    tipoLink: "comissionado",
    geraComissao: true,
    aprovadoParaPublicacao: true,
    destaqueHome: true,
    editable: true,
    editavelManual: true,
    editavelPorChatGPT: true,
    actionType: "buy",
    fonteMidia: "Central de Afiliados do Mercado Livre em sessao logada",
    ultimaRevisao: reviewDate,
    atualizadoEm: generatedAt,
    publicadoEm: generatedAt,
    disponibilidade: "Disponivel na data da curadoria; confirmar no Mercado Livre antes da compra.",
    avaliacao: offer.rating,
    vendidos: offer.sold,
    comissao: offer.earnings,
    specs: [
      `Avaliacao ${offer.rating}/5`,
      offer.sold,
      offer.discount,
      offer.earnings,
      "Link oficial gerado na Central de Afiliados",
    ],
    beneficios: [
      "Produto escolhido por avaliacao, volume de vendas e potencial comercial.",
      "Link curto oficial de afiliado preservado.",
      "Imagem real baixada do anuncio para melhorar a vitrine mobile.",
    ],
    mercadoLivre: {
      itemId: extractWid(offer.originalUrl),
      productId: extractCatalogId(offer.originalUrl),
      generatedAffiliateLink: offer.affiliateLink,
      directProductUrl: offer.originalUrl,
      imageSource: offer.imageUrl,
      selectedFrom: offer.proof,
      rating: offer.rating,
      sold: offer.sold,
      discount: offer.discount,
      earnings: offer.earnings,
      selectionIndex: index + 1,
      generatedAt,
    },
    googleAdsRevisao: {
      adequadoPrimeiraDivulgacao: true,
      motivo: "Produto fisico comum, sem alegacoes sensiveis, com avaliacao e volume de vendas exibidos pelo Mercado Livre.",
      cuidados: [
        "Nao anunciar preco fixo sem confirmar no Mercado Livre.",
        "Conferir disponibilidade, prazo e condicoes na pagina de destino.",
        "Usar texto transparente sobre link de afiliado quando necessario.",
      ],
    },
    textoCatalogo: `${offer.headline}. ${description}`,
    chamadaCompra: "Ver oferta no Mercado Livre",
    hashtags: tags,
    textoWhatsApp: `Oferta IMPACTO 360\n\n${offer.name}\n${offer.rating}/5 | ${offer.sold} | ${offer.discount}\n\nComprar no Mercado Livre:\n${offer.affiliateLink}\n\nConfira preco, entrega e disponibilidade antes de finalizar.`,
    legendaWhatsApp: `Oferta IMPACTO 360\n\n${offer.name}\n${offer.rating}/5 | ${offer.sold} | ${offer.discount}\n\nComprar no Mercado Livre:\n${offer.affiliateLink}\n\nConfira preco, entrega e disponibilidade antes de finalizar.`,
    legendaInstagram: `${offer.headline}\n\nSelecionado na Central de Afiliados do Mercado Livre: avaliacao ${offer.rating}/5, ${offer.sold}, ${offer.discount}.\n\nConfira pelo link oficial da loja.\n\n${tags.join(" ")}`,
    legendaFacebook: `${offer.headline}\n\nOferta selecionada no Impacto 360 Afiliado com link oficial Mercado Livre.\nAvaliacao ${offer.rating}/5, ${offer.sold}, ${offer.discount}.\n\nAcesse: ${offer.affiliateLink}`,
    observacoesInternas: "Oferta selecionada manualmente para primeira divulgacao com foco em pertinencia, reputacao e disponibilidade na Central de Afiliados.",
    ...commonLinks,
  };
}

function buildBanner(offer, image, index) {
  return {
    id: `banner-ml-afiliados-20260714-${String(index + 1).padStart(2, "0")}-${offer.slug}`,
    image,
    title: offer.headline,
    description: `${offer.rating}/5, ${offer.sold}, ${offer.discount}. Oferta selecionada na Central de Afiliados. Confira preco e entrega no Mercado Livre.`,
    link: offer.affiliateLink,
    active: true,
    order: index + 1,
    source: "Mercado Livre",
    curatedAt: generatedAt,
  };
}

function buildAd(offer, image, index) {
  return {
    id: `ad-ml-afiliados-20260714-${String(index + 1).padStart(2, "0")}-${offer.slug}`,
    image,
    title: offer.headline,
    description: `${offer.badge}: ${offer.rating}/5, ${offer.sold}, ${offer.discount}. Link oficial gerado no Mercado Livre.`,
    link: offer.affiliateLink,
    active: true,
    buttonLabel: "Ver oferta",
    startDate: reviewDate,
    endDate: "",
    priority: index + 1,
    source: "Mercado Livre",
    curatedAt: generatedAt,
  };
}

function firstLink(product) {
  return String(product?.affiliateLink || product?.linkCompra || product?.linkAfiliado || product?.linkComissionado || "").trim().toLowerCase();
}

function replaceInlineArray(html, variableName, value) {
  const marker = `let ${variableName} =`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return html;
  const arrayStart = html.indexOf("[", markerIndex);
  if (arrayStart < 0) throw new Error(`Array ${variableName} nao encontrado no HTML.`);

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  for (let i = arrayStart; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return `${html.slice(0, arrayStart)}${JSON.stringify(value, null, 2)}${html.slice(i + 1)}`;
      }
    }
  }
  throw new Error(`Fim do array ${variableName} nao encontrado.`);
}

function syncHtmlProducts(products) {
  const htmlFiles = [
    path.join(root, "index.html"),
    path.join(root, "impacto360.html"),
    path.join(packageDir, "index.html"),
  ];
  for (const file of htmlFiles) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const next = replaceInlineArray(html, "products", products);
    fs.writeFileSync(file, next, "utf8");
  }
}

function bumpExistingOrder(items, field, incomingIds, incomingLinks, offset) {
  return items
    .filter(item => !incomingIds.has(String(item.id)) && !incomingLinks.has(String(item.link || "").trim().toLowerCase()))
    .map((item, index) => ({
      ...item,
      [field]: Number(item[field] || index + 1) + offset,
    }));
}

const images = await Promise.all(offers.map(downloadImage));
const products = readJson(files.products, []);
const incomingProducts = offers.map((offer, index) => buildProduct(offer, images[index], index));
const incomingIds = new Set(incomingProducts.map(product => product.id));
const incomingLinks = new Set(offers.map(offer => offer.affiliateLink.toLowerCase()));
const nextProducts = [
  ...incomingProducts,
  ...products.filter(product => !incomingIds.has(String(product.id)) && !incomingLinks.has(firstLink(product))),
];

const bannersData = readJson(files.banners, { settings: {}, banners: [], ads: [] });
const incomingBanners = offers.map((offer, index) => buildBanner(offer, images[index], index));
const incomingAds = offers.map((offer, index) => buildAd(offer, images[index], index));
const bannerIds = new Set(incomingBanners.map(item => item.id));
const adIds = new Set(incomingAds.map(item => item.id));
const nextBanners = {
  ...bannersData,
  settings: {
    ...(bannersData.settings || {}),
    bannerRotationMs: 4200,
    adRotationMs: 3800,
  },
  banners: [
    ...incomingBanners,
    ...bumpExistingOrder(Array.isArray(bannersData.banners) ? bannersData.banners : [], "order", bannerIds, incomingLinks, incomingBanners.length),
  ],
  ads: [
    ...incomingAds,
    ...bumpExistingOrder(Array.isArray(bannersData.ads) ? bannersData.ads : [], "priority", adIds, incomingLinks, incomingAds.length),
  ],
};

writeJson(files.products, nextProducts);
writeJson(files.packageProducts, nextProducts);
writeJson(files.banners, nextBanners);
writeJson(files.packageBanners, nextBanners);
syncHtmlProducts(nextProducts);

writeJson(files.report, {
  generatedAt,
  selectedFrom: "Mercado Livre - Central de Afiliados e Criadores em sessao logada",
  affiliateLinksGenerated: offers.length,
  productsPublished: incomingProducts.length,
  bannersPublished: incomingBanners.length,
  adsPublished: incomingAds.length,
  policyNotes: [
    "Produtos sensiveis ou de maior risco para anuncios foram evitados nesta primeira selecao.",
    "Preco fixo nao foi anunciado porque o Mercado Livre pode alterar preco e estoque.",
    "Links oficiais meli.la gerados no computador logado foram preservados como destino de compra.",
  ],
  offers: incomingProducts.map(product => ({
    id: product.id,
    title: product.name,
    affiliateLink: product.affiliateLink,
    rating: product.mercadoLivre.rating,
    sold: product.mercadoLivre.sold,
    discount: product.mercadoLivre.discount,
    image: product.image,
  })),
});

console.log(`Ofertas aplicadas: ${incomingProducts.length}`);
console.log(`Banners no topo: ${incomingBanners.length}`);
console.log(`Anuncios no topo: ${incomingAds.length}`);
console.log(`Produtos totais: ${nextProducts.length}`);
