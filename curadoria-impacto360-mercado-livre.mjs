import fs from "node:fs/promises";
import path from "node:path";

const WORKSPACE = process.cwd();
const DESKTOP_ATUALIZ = "C:\\Users\\PMNB\\Desktop\\atualiz";
const INPUT_CANDIDATES = [
  path.join(DESKTOP_ATUALIZ, "products-editados-impacto360.json"),
  path.join(WORKSPACE, "products-editados-impacto360.json"),
  path.join(DESKTOP_ATUALIZ, "catalogo-impacto360-postagens-enriquecido.json"),
  path.join(WORKSPACE, "catalogo-impacto360-postagens-enriquecido.json"),
];

const OUTPUT_JSON = path.join(WORKSPACE, "catalogo-impacto360-curado-final.json");
const OUTPUT_POSTS_CSV = path.join(WORKSPACE, "catalogo-impacto360-postagens-prontas.csv");
const OUTPUT_PENDING_CSV = path.join(WORKSPACE, "catalogo-impacto360-pendencias.csv");
const OUTPUT_REPORT = path.join(WORKSPACE, "RELATORIO-CURADORIA-MIDIAS.md");
const PUBLIC_PRODUCTS_DIR = path.join(WORKSPACE, "public", "produtos-impacto360");

const REQUEST_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Impacto360Curadoria/1.0",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(csvEscape).join(",");
}

function isAffiliateCandidate(link = "") {
  return /^https?:\/\//i.test(link) && !/COLOCAR_LINK|LINK_AFILIADO_AQUI|PREENCHER/i.test(link);
}

function isPlaceholderImage(image = "") {
  return !image || /placeholder|produto-mercado-livre\.svg|loja-mercado-livre\.svg/i.test(image);
}

function firstMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : "";
}

function normalizePriceFromCard(card = "") {
  const aria = firstMatch(card, /aria-label="([^"]*?reais[^"]*)"/i);
  if (aria) {
    const cents = /com\s+(\d+)\s+centavos/i.exec(aria)?.[1];
    const fractionText = aria.match(/([\d.]+)\s+reais/i)?.[1]?.replace(/\./g, "");
    if (fractionText) {
      const fraction = Number(fractionText).toLocaleString("pt-BR");
      return cents ? `R$ ${fraction},${cents.padStart(2, "0")}` : `R$ ${fraction},00`;
    }
  }

  const fraction = firstMatch(card, /andes-money-amount__fraction[^>]*>([\d.]+)/i);
  const cents = firstMatch(card, /andes-money-amount__cents[^>]*>(\d+)/i);
  if (fraction) {
    return cents ? `R$ ${fraction},${cents}` : `R$ ${fraction},00`;
  }
  return "Sob consulta";
}

function extractCards(html = "") {
  const cards = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]+class="poly-component__title"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const href = decodeHtml(match[1]);
    const title = decodeHtml(match[2].replace(/<[^>]+>/g, ""));
    const before = html.slice(Math.max(0, match.index - 2600), match.index);
    const after = html.slice(match.index, Math.min(html.length, match.index + 5000));
    const neighborhood = `${before}${after}`;
    const imageMatches = [...before.matchAll(/<img[^>]+class="poly-component__picture"[^>]+src="([^"]+)"/gi)];
    const image = decodeHtml(imageMatches.at(-1)?.[1] || firstMatch(neighborhood, /alt="[^"]*"[^>]+src="([^"]+)"/i));
    const itemId = (firstMatch(href, /(?:wid=)(MLB[-]?\d{9,})/i) || firstMatch(neighborhood, /(?:wid=|item_id&quot;:&quot;|item_id":"|\/)(MLB[-]?\d{9,})/i)).replace("-", "");
    const productId = firstMatch(href, /\/p\/(MLB\d+)/i) || firstMatch(neighborhood, /"product_id":"(MLB\d+)/i);
    const price = normalizePriceFromCard(after);
    if (title || image || href) {
      cards.push({ title, image, href, itemId, productId, price });
    }
  }
  return cards;
}

function inferStore(title = "", fallbackStore = "") {
  const t = title.toLowerCase();
  const rules = [
    { storeId: "impacto-mobile", category: "Celulares", subcategoria: "Smartphones", rx: /(iphone|smartphone|celular|galaxy|moto g|redmi|xiaomi|phone|5g)/ },
    { storeId: "impacto-tech-computadores", category: "Informática", subcategoria: "Computadores e periféricos", rx: /(notebook|computador|pc gamer|monitor|teclado|mouse|headset|ssd|hd |memoria|memória|impressora|processador|placa de vídeo|placa de video|gabinete|roteador)/ },
    { storeId: "impacto-eletronicos", category: "Eletrônicos", subcategoria: "Tecnologia geral", rx: /(caixa de som|camera|câmera|drone|smart tv|fone|bluetooth|gadget|eletrônico|eletronico)/ },
    { storeId: "impacto-casa", category: "Casa e Cozinha", subcategoria: "Casa", rx: /(cozinha|panela|air fryer|liquidificador|cafeteira|utensilio|utensílio|organizador|eletrodoméstico|eletrodomestico)/ },
    { storeId: "impacto-moda", category: "Moda", subcategoria: "Moda", rx: /(camisa|calça|calca|vestido|bolsa|moda|relógio|relogio|óculos|oculos)/ },
    { storeId: "impacto-calcados", category: "Calçados", subcategoria: "Calçados", rx: /(tenis|tênis|sapato|sandália|sandalia|bota|chinelo|calcado|calçado)/ },
    { storeId: "impacto-beauty-care", category: "Beleza e Saúde", subcategoria: "Beleza", rx: /(perfume|cosmético|cosmetico|maquiagem|pele|cabelo|barba|beleza|saúde|saude)/ },
    { storeId: "impacto-auto", category: "Automotivo", subcategoria: "Automotivo", rx: /(carro|automotivo|farol|pneu|moto|veicular|som automotivo)/ },
    { storeId: "impacto-pet", category: "Pet", subcategoria: "Pet", rx: /(ração|racao|pet|cachorro|gato|coleira|areia|brinquedo pet)/ },
    { storeId: "impacto-kids", category: "Infantil", subcategoria: "Infantil", rx: /(infantil|bebê|bebe|brinquedo|carrinho|berço|berco|escolar)/ },
    { storeId: "impacto-games", category: "Games", subcategoria: "Games", rx: /(game|gamer|console|playstation|xbox|nintendo|controle)/ },
    { storeId: "impacto-ferramentas", category: "Ferramentas", subcategoria: "Ferramentas", rx: /(ferramenta|furadeira|parafusadeira|serra|kit ferramentas|jardinagem)/ },
    { storeId: "impacto-decor", category: "Móveis e Decoração", subcategoria: "Decoração", rx: /(sofá|sofa|mesa|cadeira|rack|cama|luminária|luminaria|tapete|decoração|decoracao)/ },
    { storeId: "impacto-livraria", category: "Livraria", subcategoria: "Livros", rx: /(livro|bíblia|biblia|apostila|literatura|didático|didatico|concurso)/ },
  ];
  const found = rules.find((rule) => rule.rx.test(t));
  if (found) return found;
  return { storeId: fallbackStore || "impacto-ofertas", category: "Ofertas gerais", subcategoria: "Mercado Livre" };
}

function extractSpecs(title = "") {
  const specs = new Set();
  const patterns = [
    /\b\d+\s?gb\b/gi,
    /\b\d+\s?tb\b/gi,
    /\b\d+\s?mp\b/gi,
    /\b\d+\.?\d*"\b/gi,
    /\b5g\b/gi,
    /\b4g\b/gi,
    /\bdual sim\b/gi,
    /\bssd\b/gi,
    /\bhd\b/gi,
    /\bram\b/gi,
    /\bfull hd\b/gi,
    /\bbluetooth\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of title.matchAll(pattern)) {
      specs.add(match[0].trim());
    }
  }
  return [...specs].slice(0, 10);
}

function buildDescriptions(title, price, category, specs = []) {
  const specText = specs.length ? ` Destaques identificados no título: ${specs.join(", ")}.` : "";
  const descricaoCurta = `${title} é uma opção para quem procura ${category.toLowerCase()} com compra direcionada pelo Mercado Livre.${specText}`.trim();
  const descricaoDetalhada = [
    `${title}.`,
    price && price !== "Sob consulta" ? `Preço visto na página pública: ${price}.` : "Preço não confirmado no momento da curadoria.",
    "Confira as condições, disponibilidade, variações e garantia diretamente no anúncio antes de comprar.",
    "O link de compra foi preservado como link original de afiliado da loja Impacto 360 Afiliado.",
  ].join(" ");
  return { descricaoCurta, descricaoDetalhada };
}

function buildPostTexts(product) {
  const title = product.name || "Produto Mercado Livre";
  const price = product.price || "Sob consulta";
  const link = product.affiliateLink || product.linkOriginal || "";
  const short = product.descricaoCurta || product.description || "Produto selecionado para o catálogo Impacto 360.";
  const tagBase = product.category ? slugify(product.category).replace(/-/g, "") : "ofertas";
  const hashtags = [`#Impacto360`, `#MercadoLivre`, `#${tagBase}`, `#OfertasSelecionadas`].join(" ");
  return {
    legendaWhatsApp: `Oferta selecionada no IMPACTO 360 AFILIADO\n\n${title}\n${price}\n\n${short}\n\nComprar no Mercado Livre:\n${link}\n\nEste conteúdo pode conter link de afiliado.`,
    legendaInstagram: `${title}\n\n${short}\n\n${price}\n\nConfira os detalhes antes de comprar. Link de afiliado preservado no catálogo.\n\n${hashtags}`,
    legendaFacebook: `${title}\n\n${short}\n\nPreço: ${price}\n\nAcesse pelo link de afiliado da Impacto 360 Afiliado: ${link}`,
    textoCatalogo: `${title} - ${short}`,
    chamadaCompra: product.actionType === "quote" ? "Solicitar orçamento" : "Comprar no Mercado Livre",
    hashtags,
  };
}

async function findInputFile() {
  for (const candidate of INPUT_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error("Nenhum arquivo de produtos foi encontrado.");
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: REQUEST_HEADERS,
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, finalUrl: response.url, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadImage(url, destDir, index) {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  const ext = new URL(url).pathname.match(/\.(webp|jpg|jpeg|png)(?:$|\?)/i)?.[1]?.toLowerCase() || "webp";
  const fileName = `imagem-${String(index).padStart(2, "0")}.${ext === "jpeg" ? "jpg" : ext}`;
  const dest = path.join(destDir, fileName);
  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (!response.ok) return "";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1000) return "";
  await fs.mkdir(destDir, { recursive: true });
  await fs.writeFile(dest, buffer);
  return path.relative(WORKSPACE, dest).replace(/\\/g, "/");
}

async function curateProduct(original, index, seenImages) {
  const product = structuredClone(original);
  const originalAffiliate = original.affiliateLink ?? "";
  const originalLinkOriginal = original.linkOriginal ?? "";
  const inputLink = originalAffiliate || originalLinkOriginal;
  const pendencias = new Set(Array.isArray(original.pendencias) ? original.pendencias : []);
  let statusMidia = "pendente";
  let fonteMidia = "";
  let resolvedUrl = "";
  let cards = [];
  let selectedCard = null;
  let linkStatus = "sem link afiliado";
  let linkError = "";

  if (!isAffiliateCandidate(inputLink)) {
    pendencias.add("link de afiliado ausente ou placeholder");
    linkStatus = "sem link afiliado";
  } else {
    try {
      await sleep(550);
      const result = await fetchText(inputLink);
      resolvedUrl = result.finalUrl;
      linkStatus = result.ok ? "link afiliado aberto para leitura" : `resposta ${result.status}`;
      if (!result.ok) {
        pendencias.add(`link respondeu ${result.status}`);
      }
      cards = extractCards(result.text);
      selectedCard = cards[0] || null;
      if (!selectedCard) {
        pendencias.add("produto nao identificado no HTML publico");
      }
    } catch (error) {
      linkError = error.message || String(error);
      pendencias.add(`erro ao abrir link: ${linkError}`);
      linkStatus = "link bloqueado ou indisponivel";
    }
  }

  if (selectedCard?.title) {
    product.name = selectedCard.title;
  }

  if (selectedCard?.price) {
    product.price = selectedCard.price;
  }

  const inferred = inferStore(product.name || original.name || "", original.storeId);
  product.storeId = inferred.storeId;
  product.category = inferred.category;
  product.subcategoria = inferred.subcategoria;

  const specs = extractSpecs(product.name || "");
  product.specs = specs.length ? specs : Array.isArray(original.specs) ? original.specs : [];

  const titleForDescription = product.name || original.name || "Produto Mercado Livre";
  const descriptions = buildDescriptions(titleForDescription, product.price || "Sob consulta", product.category || "Ofertas gerais", product.specs);
  product.description = descriptions.descricaoCurta;
  product.descricaoCurta = descriptions.descricaoCurta;
  product.descricaoDetalhada = descriptions.descricaoDetalhada;

  const productDir = path.join(PUBLIC_PRODUCTS_DIR, product.id || `produto-${index + 1}`);
  const gallery = [];
  const candidateImages = [
    selectedCard?.image,
    original.imagemPrincipal,
    original.image,
    ...(Array.isArray(original.galeria) ? original.galeria : []),
  ].filter(Boolean);

  for (const imageUrl of [...new Set(candidateImages)]) {
    if (gallery.length >= 5) break;
    if (isPlaceholderImage(imageUrl)) continue;
    if (/^https?:\/\//i.test(imageUrl)) {
      const localPath = await downloadImage(imageUrl, productDir, gallery.length + 1);
      if (localPath) gallery.push(localPath);
    } else {
      gallery.push(imageUrl);
    }
  }

  if (gallery.length) {
    product.imagemPrincipal = gallery[0];
    product.image = gallery[0];
    product.galeria = gallery;
    statusMidia = gallery.length >= 5 ? "imagem real com galeria" : "imagem real com galeria parcial";
    fonteMidia = "HTML publico do Mercado Livre ou imagem existente confirmada no cadastro";
  } else {
    product.imagemPrincipal = original.imagemPrincipal || original.image || "/assets/placeholder-produto.svg";
    product.image = product.imagemPrincipal;
    product.galeria = [];
    pendencias.add("imagem principal pendente");
    fonteMidia = "pendente";
  }

  if (product.galeria.length < 5) {
    pendencias.add("galeria com menos de 5 imagens confirmadas");
  }

  const imageKey = product.imagemPrincipal || product.image || "";
  if (imageKey && !isPlaceholderImage(imageKey)) {
    if (seenImages.has(imageKey)) {
      product.imagemDuplicada = true;
      pendencias.add(`imagem repetida com ${seenImages.get(imageKey)}`);
    } else {
      seenImages.set(imageKey, product.id || `produto-${index + 1}`);
      product.imagemDuplicada = false;
    }
  }

  const videos = Array.isArray(original.videos) ? original.videos.filter(Boolean) : [];
  if (original.videoUrl && !videos.includes(original.videoUrl)) videos.push(original.videoUrl);
  product.videos = videos;
  if (!videos.length) pendencias.add("video nao encontrado em fonte oficial");

  product.linkOriginal = originalLinkOriginal || originalAffiliate;
  product.affiliateLink = originalAffiliate;
  product.linkResolvidoApenasLeitura = resolvedUrl;
  product.linkStatus = linkStatus;
  if (linkError) product.linkErro = linkError;
  product.source = original.source || "Mercado Livre";
  product.badge = selectedCard ? "Mercado Livre" : original.badge || "Pendente";
  const blockingPendencies = [...pendencias].filter((item) =>
    /link de afiliado ausente|placeholder|erro ao abrir|link respondeu|produto nao identificado|imagem principal pendente/i.test(item)
  );
  product.status = blockingPendencies.length ? "pendente" : "ativo";
  product.revisaoManualRecomendada = pendencias.size > 0;
  product.statusMidia = statusMidia;
  product.pendencias = [...pendencias];
  product.fonteMidia = fonteMidia;
  product.ultimaRevisao = new Date().toISOString();
  product.editable = true;
  product.actionType = original.actionType || "buy";
  product.mercadoLivre = {
    itemId: selectedCard?.itemId || "",
    productId: selectedCard?.productId || "",
    linkProdutoApenasLeitura: selectedCard?.href || "",
    cardsEncontradosNoLink: cards.length,
  };

  Object.assign(product, buildPostTexts(product));

  return product;
}

function buildReport(products, inputFile) {
  const total = products.length;
  const imagemReal = products.filter((p) => p.imagemPrincipal && !isPlaceholderImage(p.imagemPrincipal)).length;
  const imagemPendente = products.filter((p) => p.pendencias?.some((x) => /imagem principal pendente/i.test(x))).length;
  const videoEncontrado = products.filter((p) => Array.isArray(p.videos) && p.videos.length).length;
  const semVideo = total - videoEncontrado;
  const linksBloqueados = products.filter((p) => /bloqueado|indisponivel/i.test(p.linkStatus || "")).length;
  const linksQuebrados = products.filter((p) => /resposta|erro ao abrir/i.test((p.pendencias || []).join(" "))).length;
  const atualizados = products.filter((p) => p.mercadoLivre?.cardsEncontradosNoLink > 0 || (p.galeria || []).length).length;
  const pendentes = products.filter((p) => p.status === "pendente").length;

  return `# RELATORIO DE CURADORIA DE MIDIAS - IMPACTO 360

Arquivo-base analisado: \`${inputFile}\`

## Resumo geral
- Quantidade total de produtos analisados: ${total}
- Produtos atualizados com sucesso ou midia aproveitada: ${atualizados}
- Produtos com imagem real: ${imagemReal}
- Produtos com imagem pendente: ${imagemPendente}
- Produtos com video encontrado: ${videoEncontrado}
- Produtos sem video: ${semVideo}
- Links bloqueados: ${linksBloqueados}
- Links quebrados ou com erro de abertura: ${linksQuebrados}
- Produtos que precisam de revisao manual: ${pendentes}

## Regras aplicadas
- Nenhum produto foi apagado.
- A ordem original dos produtos foi preservada.
- Os campos \`affiliateLink\` foram preservados exatamente como estavam no arquivo-base.
- O campo \`linkOriginal\` foi preservado quando existia; quando nao existia, recebeu o mesmo link de afiliado original para facilitar auditoria.
- Nao foi feito login no Mercado Livre.
- Nao foram usados cookies, senhas ou credenciais.
- Quando o Mercado Livre nao liberou dados suficientes, o produto foi marcado como pendente.
- Videos so foram mantidos quando ja existiam no cadastro ou estavam confirmados; nenhum video foi inventado.

## Pendencias principais
${products
  .filter((p) => p.status === "pendente")
  .map((p) => `- ${p.id}: ${(p.pendencias || []).join("; ")}`)
  .join("\n") || "- Nenhuma pendencia registrada."}

## Arquivos gerados
- \`catalogo-impacto360-curado-final.json\`
- \`catalogo-impacto360-postagens-prontas.csv\`
- \`catalogo-impacto360-pendencias.csv\`
- \`public/produtos-impacto360/\`

## Observacao importante
O link de afiliado continua sendo o ativo principal da loja. Qualquer link comum usado para leitura de produto foi salvo apenas como referencia em campos de auditoria, nunca no campo \`affiliateLink\`.
`;
}

async function main() {
  const inputFile = await findInputFile();
  const raw = await fs.readFile(inputFile, "utf8");
  const products = JSON.parse(raw.replace(/^\uFEFF/, ""));
  if (!Array.isArray(products)) {
    throw new Error("O arquivo de entrada precisa conter uma lista de produtos.");
  }

  await fs.mkdir(PUBLIC_PRODUCTS_DIR, { recursive: true });

  const seenImages = new Map();
  const curated = [];
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    console.log(`[${index + 1}/${products.length}] Curando ${product.id || product.name || "produto"}`);
    curated.push(await curateProduct(product, index, seenImages));
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(curated, null, 2), "utf8");

  const postHeaders = [
    "id",
    "nome",
    "categoria",
    "preco",
    "legendaWhatsApp",
    "legendaInstagram",
    "legendaFacebook",
    "textoCatalogo",
    "chamadaCompra",
    "affiliateLink",
    "imagemPrincipal",
    "status",
  ];
  const postRows = [
    csvRow(postHeaders),
    ...curated.map((p) =>
      csvRow([
        p.id,
        p.name,
        p.category,
        p.price,
        p.legendaWhatsApp,
        p.legendaInstagram,
        p.legendaFacebook,
        p.textoCatalogo,
        p.chamadaCompra,
        p.affiliateLink,
        p.imagemPrincipal,
        p.status,
      ])
    ),
  ];
  await fs.writeFile(OUTPUT_POSTS_CSV, postRows.join("\n"), "utf8");

  const pendingHeaders = ["id", "nome", "affiliateLink", "status", "pendencias", "linkStatus"];
  const pendingRows = [
    csvRow(pendingHeaders),
    ...curated
      .filter((p) => p.status === "pendente")
      .map((p) => csvRow([p.id, p.name, p.affiliateLink, p.status, (p.pendencias || []).join("; "), p.linkStatus])),
  ];
  await fs.writeFile(OUTPUT_PENDING_CSV, pendingRows.join("\n"), "utf8");

  await fs.writeFile(OUTPUT_REPORT, buildReport(curated, inputFile), "utf8");

  const desktopCopies = [
    [OUTPUT_JSON, path.join(DESKTOP_ATUALIZ, "catalogo-impacto360-curado-final.json")],
    [OUTPUT_POSTS_CSV, path.join(DESKTOP_ATUALIZ, "catalogo-impacto360-postagens-prontas.csv")],
    [OUTPUT_PENDING_CSV, path.join(DESKTOP_ATUALIZ, "catalogo-impacto360-pendencias.csv")],
    [OUTPUT_REPORT, path.join(DESKTOP_ATUALIZ, "RELATORIO-CURADORIA-MIDIAS.md")],
  ];
  for (const [src, dest] of desktopCopies) {
    try {
      await fs.copyFile(src, dest);
    } catch {}
  }

  console.log("Curadoria concluida.");
  console.log(`JSON: ${OUTPUT_JSON}`);
  console.log(`CSV postagens: ${OUTPUT_POSTS_CSV}`);
  console.log(`CSV pendencias: ${OUTPUT_PENDING_CSV}`);
  console.log(`Relatorio: ${OUTPUT_REPORT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
