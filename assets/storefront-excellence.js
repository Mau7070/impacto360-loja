const SITE_NAME = "Impacto360 Afiliado";
const SITE_URL = "https://impacto360afiliado.com.br";
const CATALOG_URL = "/dados/catalogo-publico.json?v=20260723-2";
const STORES_URL = "/dados/stores.json?v=20260723-2";
const FAVORITES_KEY = "impacto360Favorites";
const SEARCH_HISTORY_KEY = "impacto360SearchHistory";
const PAGE_SIZE = 24;
const LAZY_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'/%3E";

const state = {
  products: [],
  stores: [],
  storeById: new Map(),
  visibleLimit: PAGE_SIZE,
  suggestionIndex: -1,
  suggestionItems: [],
  searchTimer: null,
  routeRenderId: 0,
  imageObserver: null,
};

const categoryDefinitions = [
  {
    slug: "celulares-e-tecnologia",
    label: "Celulares e Tecnologia",
    description: "Smartphones, notebooks, informática e eletrônicos.",
    icon: "phone",
    terms: ["celular", "smartphone", "iphone", "telefonia", "notebook", "computador", "informatica", "tablet", "smartwatch", "eletronico", "tv"],
  },
  {
    slug: "casa-e-cozinha",
    label: "Casa e Cozinha",
    description: "Utilidades, organização, cama, banho e cozinha.",
    icon: "home",
    terms: ["casa", "cozinha", "panela", "utensilio", "cama", "banho", "decoracao", "organizador", "faqueiro", "tramontina"],
  },
  {
    slug: "eletrodomesticos",
    label: "Eletrodomésticos",
    description: "Equipamentos para facilitar a rotina da casa.",
    icon: "appliance",
    terms: ["eletrodomestico", "micro ondas", "microondas", "forno", "air fryer", "fritadeira", "geladeira", "lavadora", "cafeteira", "liquidificador"],
  },
  {
    slug: "games-e-setup",
    label: "Games e Setup",
    description: "Consoles, jogos, notebooks e acessórios gamer.",
    icon: "game",
    terms: ["game", "gamer", "setup", "console", "playstation", "xbox", "controle", "headset", "rtx", "geforce"],
  },
  {
    slug: "moda-e-calcados",
    label: "Moda e Calçados",
    description: "Roupas, tênis, bolsas e acessórios para o dia a dia.",
    icon: "shirt",
    terms: ["moda", "roupa", "vestido", "blusa", "camisa", "masculino", "feminino", "tenis", "calcado", "sapato", "sandalia", "bolsa"],
  },
  {
    slug: "ferramentas",
    label: "Ferramentas",
    description: "Oficina, manutenção, reparos e equipamentos.",
    icon: "tool",
    terms: ["ferramenta", "furadeira", "parafusadeira", "oficina", "broca", "serra", "martelo", "chave"],
  },
  {
    slug: "brinquedos-e-escolar",
    label: "Brinquedos e Escolar",
    description: "Brinquedos, jogos, mochilas e materiais para estudo.",
    icon: "toy",
    terms: ["brinquedo", "boneca", "carrinho", "infantil", "educativo", "escolar", "mochila", "caderno", "estojo", "lapis"],
  },
  {
    slug: "montaria-e-cavalgada",
    label: "Montaria e Cavalgada",
    description: "Itens e acessórios para o universo equestre.",
    icon: "horse",
    terms: ["montaria", "cavalgada", "cavalo", "equestre", "sela", "country", "chapeu cowboy"],
  },
];

const aisleDefinitions = [
  {
    slug: "tecnologia-e-games",
    label: "Tecnologia e Games",
    description: "Celulares, computadores, eletrônicos, games, educação e livros.",
    icon: "monitor",
    stores: ["impacto-mobile", "impacto-tech-computadores", "impacto-eletronicos", "impacto-games", "impacto-educa", "impacto-livraria"],
  },
  {
    slug: "casa-e-decoracao",
    label: "Casa e Decoração",
    description: "Utilidades, móveis, decoração e soluções para a rotina.",
    icon: "home",
    stores: ["impacto-casa", "impacto-decor"],
  },
  {
    slug: "moda-e-beleza",
    label: "Moda e Beleza",
    description: "Moda cotidiana, grife, calçados e cuidados pessoais.",
    icon: "shirt",
    stores: ["impacto-moda", "grife-prime", "impacto-calcados", "impacto-beauty-care"],
  },
  {
    slug: "familia-e-lazer",
    label: "Família e Lazer",
    description: "Bebês, brinquedos, pets, esporte, fé e bem-estar.",
    icon: "heart",
    stores: ["impacto-kids", "impacto-brinquedos", "impacto-pet", "impacto-sport", "impacto-fe"],
  },
  {
    slug: "servicos-digitais",
    label: "Serviços Digitais",
    description: "Música, trabalhos acadêmicos, personalizados e criação.",
    icon: "spark",
    stores: ["impacto-music-studio", "impacto-academico", "impacto-personalizados", "impacto-criadores"],
  },
  {
    slug: "auto-ferramentas-e-montaria",
    label: "Auto, Ferramentas e Montaria",
    description: "Produtos para veículo, oficina, ferramentas e cavalgada.",
    icon: "tool",
    stores: ["impacto-auto", "impacto-ferramentas", "impacto-montaria"],
  },
  {
    slug: "ofertas-e-parceiros",
    label: "Ofertas e Parceiros",
    description: "Oportunidades selecionadas e vitrines de lojas parceiras.",
    icon: "tag",
    stores: ["impacto-ofertas", "lojas-parceiras"],
  },
];

const homeStoreIds = [
  "impacto-mobile",
  "impacto-tech-computadores",
  "impacto-casa",
  "impacto-moda",
  "impacto-eletronicos",
  "impacto-games",
  "impacto-ferramentas",
  "impacto-brinquedos",
];

const serviceStoreIds = [
  "impacto-music-studio",
  "impacto-academico",
  "impacto-personalizados",
  "impacto-criadores",
];

const departmentShelves = [
  ["celulares-e-tecnologia", "Tecnologia", "Celulares, computadores e eletrônicos"],
  ["casa-e-cozinha", "Casa e Cozinha", "Soluções úteis para sua rotina"],
  ["moda-e-calcados", "Moda e Calçados", "Roupas, tênis e acessórios"],
  ["ferramentas", "Ferramentas", "Oficina, manutenção e pequenos reparos"],
  ["brinquedos-e-escolar", "Infantil e Escolar", "Brinquedos, mochilas e materiais"],
  ["games-e-setup", "Games", "Setup, consoles e acessórios"],
  ["eletrodomesticos", "Eletrodomésticos", "Equipamentos para a casa"],
  ["montaria-e-cavalgada", "Montaria e Cavalgada", "Seleção para o universo equestre"],
];

const iconPaths = {
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
  appliance: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 9h14M8 6h.01M12 6h.01M15.5 6h.01M8 13h8M8 16h5"/>',
  game: '<path d="M8 8h8a5 5 0 0 1 4.8 6.4l-1 3.3a2.4 2.4 0 0 1-4.1 1l-1.2-1.4h-5l-1.2 1.4a2.4 2.4 0 0 1-4.1-1l-1-3.3A5 5 0 0 1 8 8Z"/><path d="M7 12v4M5 14h4M16 13h.01M18 15h.01"/>',
  shirt: '<path d="m8 4 4 2 4-2 5 4-3 4v9H6v-9L3 8l5-4Z"/><path d="M9 5a3 3 0 0 0 6 0"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5-5l2.2 2.2-2.4 2.4-2.2-2.2a4 4 0 0 0 5 5L20 16.4a2.1 2.1 0 0 1-3 3l-7.7-7.7"/><path d="m4 14-2 6 6-2 7-7-4-4-7 7Z"/>',
  toy: '<path d="M7 8h10l3 5-3 7H7l-3-7 3-5Z"/><path d="M9 8V5a3 3 0 0 1 6 0v3M8 13h.01M16 13h.01M9 16c1.7 1.3 4.3 1.3 6 0"/>',
  horse: '<path d="M6 20v-7l2-5 4-4 5 2 2 5-3 3h-4l-2 6"/><path d="m12 4 1-2 3 3M9 11l-4-1-2 3 3 2M16 9h.01"/>',
  monitor: '<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 21h8M12 16.5V21"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  spark: '<path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2ZM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
  tag: '<path d="M20 13 13 20l-9-9V4h7l9 9Z"/><path d="M8.5 8.5h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
};

function icon(name, className = "") {
  return `<svg class="${escapeAttr(className)}" aria-hidden="true" viewBox="0 0 24 24">${iconPaths[name] || iconPaths.grid}</svg>`;
}

function text(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(value) {
  return normalize(value)
    .split(" ")
    .filter(Boolean)
    .map(token => token.length > 4 && token.endsWith("es") ? token.slice(0, -2) : token)
    .map(token => token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

function fuzzyTokenMatch(queryToken, word) {
  if (!queryToken || !word) return false;
  if (queryToken === word) return true;
  if (queryToken.length >= 3 && word.startsWith(queryToken)) return true;
  if (word.length >= 4 && queryToken.startsWith(word) && queryToken.length - word.length <= 2) return true;
  if (queryToken.length < 4 || word.length < 4 || Math.abs(queryToken.length - word.length) > 1) return false;
  return levenshtein(queryToken, word) <= 1;
}

function assetUrl(value) {
  const source = text(value).replace(/\\/g, "/");
  if (!source) return "";
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  return `/${source.replace(/^\/+/, "")}`;
}

function placeholderImage() {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#f5f6f8"/><rect x="140" y="150" width="520" height="420" rx="28" fill="#fff" stroke="#e2e8f0" stroke-width="8"/><circle cx="310" cy="300" r="48" fill="#eaf1f7"/><path d="m190 510 140-140 95 95 72-72 115 117" fill="none" stroke="#cbd5e1" stroke-width="28"/><text x="400" y="660" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#475569">Imagem indisponível</text></svg>'
  );
}

function storeFor(product) {
  return state.storeById.get(product.storeId);
}

function partnerName(product) {
  const raw = normalize([product.partner, product.link].join(" "));
  if (raw.includes("amazon")) return "Amazon";
  if (raw.includes("mercado livre") || raw.includes("mercadolivre") || raw.includes("meli la")) return "Mercado Livre";
  if (raw.includes("shopee")) return "Shopee";
  if (raw.includes("hotmart")) return "Hotmart";
  return text(product.partner) || text(storeFor(product)?.name) || "Loja parceira";
}

function money(value, fallback = "") {
  if (Number.isFinite(value) && value > 0) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }
  return text(fallback) || "Ver preço no parceiro";
}

function priceRange(value) {
  if (!Number.isFinite(value)) return "sem-preco";
  if (value < 100) return "ate-100";
  if (value < 500) return "100-500";
  if (value < 1000) return "500-1000";
  return "acima-1000";
}

function validDiscount(product) {
  return Number.isFinite(product.previousPriceValue)
    && Number.isFinite(product.priceValue)
    && product.previousPriceValue > product.priceValue;
}

function discountPercent(product) {
  if (!validDiscount(product)) return 0;
  return Math.round((1 - product.priceValue / product.previousPriceValue) * 100);
}

function favoriteSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function searchHistory() {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]").filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
}

function saveSearch(term) {
  const clean = text(term).replace(/\s+/g, " ");
  if (clean.length < 2) return;
  const next = [clean, ...searchHistory().filter(item => normalize(item) !== normalize(clean))].slice(0, 8);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  closeSuggestions();
  showToast("Histórico de pesquisa removido.");
}

function categoryMatches(product, category) {
  const haystack = product._search || normalize([
    product.name, product.description, product.category, product.subcategory,
    product.brand, product.model, ...(product.tags || []), product.storeId,
  ].join(" "));
  return category.terms.some(term => haystack.includes(normalize(term)));
}

function categoryForProduct(product) {
  if (product._categorySlug !== undefined) {
    return categoryDefinitions.find(category => category.slug === product._categorySlug) || null;
  }
  const category = categoryDefinitions.find(item => categoryMatches(product, item)) || null;
  if (product._search) product._categorySlug = category?.slug || "";
  return category;
}

function categoryProducts(category) {
  return state.products.filter(product => (
    product._categorySlug !== undefined
      ? product._categorySlug === category.slug
      : categoryMatches(product, category)
  ));
}

function searchScore(product, query) {
  const q = normalize(query);
  if (!q) return 1;
  const queryWords = searchTokens(q);
  if (!queryWords.length) return 0;
  const name = normalize(product.name);
  const brandModel = normalize([product.brand, product.model].join(" "));
  const category = normalize([product.category, product.subcategory].join(" "));
  const tags = normalize((product.tags || []).join(" "));
  const description = normalize(product.description);
  const allWords = product._words || (product._words = searchTokens(product._search || ""));

  let score = 0;
  if (name === q) score += 220;
  else if (name.startsWith(q)) score += 160;
  else if (name.includes(q)) score += 115;
  if (brandModel === q) score += 100;
  else if (brandModel.includes(q)) score += 70;
  if (category.includes(q)) score += 50;
  if (tags.includes(q)) score += 40;
  if (description.includes(q)) score += 20;

  let matched = 0;
  for (const token of queryWords) {
    if (name.includes(token)) {
      score += 36;
      matched += 1;
      continue;
    }
    if (brandModel.includes(token)) {
      score += 25;
      matched += 1;
      continue;
    }
    if (category.includes(token) || tags.includes(token)) {
      score += 16;
      matched += 1;
      continue;
    }
    if (description.includes(token)) {
      score += 7;
      matched += 1;
      continue;
    }
    if (allWords.some(word => fuzzyTokenMatch(token, word))) {
      score += 5;
      matched += 1;
    }
  }
  if (matched !== queryWords.length) return 0;
  if (product.featured) score += 3;
  if (product.image) score += 1;
  return score;
}

function searchProducts(query) {
  const q = text(query);
  if (!q) return state.products.map(product => ({ product, score: 1 }));
  return state.products
    .map(product => ({ product, score: searchScore(product, q) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "pt-BR"));
}

function diverseProducts(products, limit = 8) {
  const seen = new Set();
  const bucketsByKey = new Map();
  for (const product of products) {
    if (!product?.id || seen.has(product.id)) continue;
    seen.add(product.id);
    const key = categoryForProduct(product)?.slug || product.storeId || "outros";
    if (!bucketsByKey.has(key)) bucketsByKey.set(key, []);
    bucketsByKey.get(key).push(product);
  }
  const buckets = [...bucketsByKey.values()];
  const selected = [];
  let row = 0;
  while (selected.length < limit && buckets.some(bucket => row < bucket.length)) {
    for (const bucket of buckets) {
      if (row < bucket.length) selected.push(bucket[row]);
      if (selected.length >= limit) break;
    }
    row += 1;
  }
  return selected;
}

function productPath(product) {
  return `/produto/${encodeURIComponent(product.slug || product.id)}/`;
}

function productCard(product, index = 0, eagerCount = 0) {
  const favorites = favoriteSet();
  const discount = discountPercent(product);
  const badge = discount ? `${discount}% OFF` : text(product.badge) || (product.offer ? "Oferta selecionada" : "Produto selecionado");
  const internalPath = productPath(product);
  const quote = product.actionType === "quote";
  const actionLabel = quote ? "Solicitar orçamento" : "Ver oferta";
  const actionClass = quote ? "btn-service" : "btn-offer";
  const currentPrice = money(product.priceValue, product.price);
  const previousPrice = validDiscount(product) ? money(product.previousPriceValue, product.previousPrice) : "";
  const rating = product.rating
    ? `<span aria-label="Avaliação ${product.rating.toFixed(1)} de 5">★ ${product.rating.toFixed(1).replace(".", ",")}</span>`
    : '<span class="rating-empty" aria-hidden="true">Sem avaliação</span>';
  const image = assetUrl(product.image);
  const eager = index < eagerCount;
  return `
    <article class="product-card" data-product-id="${escapeAttr(product.id)}">
      <div class="product-media">
        <a href="${escapeAttr(internalPath)}" aria-label="Ver detalhes de ${escapeAttr(product.name)}">
          <img
            src="${escapeAttr(eager ? image : LAZY_IMAGE_PLACEHOLDER)}"
            ${eager ? "" : `data-src="${escapeAttr(image)}"`}
            alt="${escapeAttr(product.name)}"
            loading="${eager ? "eager" : "lazy"}"
            decoding="async"
            ${eagerCount && index === 0 ? 'fetchpriority="high"' : ""}
          >
        </a>
        <span class="product-badge ${discount ? "product-discount" : ""}">${escapeHtml(badge)}</span>
        <button
          class="favorite-btn"
          type="button"
          data-favorite="${escapeAttr(product.id)}"
          aria-label="${favorites.has(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${escapeAttr(product.name)}"
          aria-pressed="${favorites.has(product.id)}"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
        </button>
      </div>
      <div class="product-body">
        <span class="product-partner">${escapeHtml(partnerName(product))}</span>
        <h3><a href="${escapeAttr(internalPath)}">${escapeHtml(product.name)}</a></h3>
        <div class="rating">${rating}</div>
        <div class="price-block">
          <span class="old-price">${previousPrice ? escapeHtml(previousPrice) : "&nbsp;"}</span>
          <strong class="current-price">${escapeHtml(currentPrice)}</strong>
        </div>
        <a
          class="btn ${actionClass}"
          href="${escapeAttr(product.link)}"
          target="_blank"
          rel="noopener noreferrer sponsored"
          data-affiliate-link
          data-link-plataforma="${escapeAttr(product.link)}"
          data-product-name="${escapeAttr(product.name)}"
        >${actionLabel}</a>
      </div>
    </article>`;
}

function productGrid(products, className = "product-grid", eagerCount = 0) {
  return `<div class="${className}">${products.map((product, index) => productCard(product, index, eagerCount)).join("")}</div>`;
}

function storePath(store) {
  return `/loja/${encodeURIComponent(store.id)}/`;
}

function storeCard(store) {
  const specialties = (store.subcategories || []).slice(0, 3);
  return `
    <article class="store-card">
      <a class="store-cover" href="${storePath(store)}" data-route="${storePath(store)}" aria-label="Entrar na ${escapeAttr(store.name)}">
        <img src="${escapeAttr(assetUrl(store.coverImage))}" alt="" loading="lazy" decoding="async">
      </a>
      <div class="store-body">
        <h3>${escapeHtml(store.name)}</h3>
        <p>${escapeHtml(store.description || store.commercialName || "")}</p>
        <div class="specialties">${specialties.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        <a class="btn btn-primary" href="${storePath(store)}" data-route="${storePath(store)}">Entrar na loja</a>
      </div>
    </article>`;
}

function categoryCard(category) {
  const count = categoryProducts(category).length;
  return `
    <a class="category-card" href="/categoria/${category.slug}/" data-route="/categoria/${category.slug}/">
      <span class="category-icon">${icon(category.icon)}</span>
      <h3>${escapeHtml(category.label)}</h3>
      <p>${escapeHtml(category.description)}</p>
      <small>${count} ${count === 1 ? "item" : "itens"}</small>
    </a>`;
}

function aisleCard(aisle) {
  const existingStores = aisle.stores.map(id => state.storeById.get(id)).filter(Boolean);
  return `
    <a class="aisle-card" href="/lojas/?ala=${encodeURIComponent(aisle.slug)}" data-route="/lojas/?ala=${encodeURIComponent(aisle.slug)}">
      <span class="aisle-icon">${icon(aisle.icon)}</span>
      <span>
        <h3>${escapeHtml(aisle.label)}</h3>
        <p>${escapeHtml(aisle.description)}</p>
        <small>${existingStores.length} ${existingStores.length === 1 ? "loja especializada" : "lojas especializadas"}</small>
      </span>
    </a>`;
}

function serviceCard(store) {
  const subject = encodeURIComponent(`Solicitação de orçamento — ${store.name}`);
  return `
    <article class="service-card">
      <span class="section-kicker">Serviço Impacto360</span>
      <h3>${escapeHtml(store.name)}</h3>
      <p>${escapeHtml(store.description || store.commercialName || "")}</p>
      <a class="btn btn-service" href="mailto:contato@impacto360afiliado.com?subject=${subject}">Solicitar orçamento</a>
    </article>`;
}

function sectionHeader(kicker, title, description, link = "", linkLabel = "") {
  return `
    <div class="section-header">
      <div>
        ${kicker ? `<span class="section-kicker">${escapeHtml(kicker)}</span>` : ""}
        <h2>${escapeHtml(title)}</h2>
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      </div>
      ${link ? `<a class="text-link" href="${escapeAttr(link)}" data-route="${escapeAttr(link)}">${escapeHtml(linkLabel)}</a>` : ""}
    </div>`;
}

function renderHome() {
  setMeta({
    title: "Impacto360 Afiliado | Ofertas selecionadas em um shopping virtual",
    description: "Encontre produtos de diferentes categorias e compre diretamente no site parceiro com a curadoria da Impacto360 Afiliado.",
    canonical: "/",
    robots: "index,follow,max-image-preview:large",
  });
  const featured = diverseProducts([
    ...state.products.filter(product => product.featured),
    ...state.products.filter(product => product.offer),
    ...state.products,
  ], 4);
  const discovery = diverseProducts(state.products.filter(product => !featured.some(item => item.id === product.id)), 4);
  const heroProducts = featured.slice(0, 4);
  const homeStores = homeStoreIds.map(id => state.storeById.get(id)).filter(Boolean);
  const services = serviceStoreIds.map(id => state.storeById.get(id)).filter(Boolean);
  const heroProductMarkup = heroProducts.map(product => `
    <span class="hero-product">
      <img src="${LAZY_IMAGE_PLACEHOLDER}" data-hero-src="${escapeAttr(assetUrl(product.image))}" alt="" loading="lazy" decoding="async">
    </span>`).join("");
  const heroMarkup = `
    <section class="hero" data-initial-home-hero>
      <div class="shell hero-grid">
        <div>
          <h1>Ofertas selecionadas nas melhores lojas</h1>
          <p>Encontre produtos de diferentes categorias e compre diretamente no site parceiro.</p>
          <a class="btn btn-offer" href="/buscar/?oferta=1" data-route="/buscar/?oferta=1">Ver ofertas de hoje</a>
          <div class="hero-trust" aria-label="Informações de confiança">
            <span>Links oficiais de parceiros</span>
            <span>Sem custo adicional</span>
            <span>Compra concluída no parceiro</span>
          </div>
        </div>
        <div class="hero-products" aria-hidden="true">
          ${heroProductMarkup}
        </div>
      </div>
    </section>`;
  const homeContent = `
    <div class="shell promo-shortcuts" aria-label="Atalhos promocionais">
      ${[
        ["tag", "Ofertas do Dia", "Oportunidades selecionadas", "/buscar/?oferta=1"],
        ["search", "Para descobrir", "Produtos de várias categorias", "/buscar/"],
        ["spark", "Novidades", "Itens adicionados recentemente", "/buscar/?ordem=recentes"],
        ["grid", "Maior variedade", "Explore o catálogo completo", "/lojas/"],
      ].map(([iconName, title, copy, href]) => `
        <a class="promo-shortcut" href="${href}" data-route="${href}">
          <span class="shortcut-icon">${icon(iconName)}</span>
          <span><strong>${title}</strong><small>${copy}</small></span>
          <span class="promo-arrow" aria-hidden="true">›</span>
        </a>`).join("")}
    </div>

    <section class="section section-white">
      <div class="shell">
        ${sectionHeader("Navegação rápida", "Compre por categoria", "Escolha o que procura e encontre produtos de diferentes lojas em um só lugar.", "/lojas/", "Ver todas as lojas")}
        <div class="category-grid">${categoryDefinitions.map(categoryCard).join("")}</div>
      </div>
    </section>

    <section class="section section-soft">
      <div class="shell">
        ${sectionHeader("Curadoria Impacto360", "Ofertas em destaque", "Produtos selecionados e atualizados com frequência.", "/buscar/?oferta=1", "Ver todas as ofertas")}
        ${productGrid(featured)}
      </div>
    </section>

    <section class="section section-white">
      <div class="shell">
        ${sectionHeader("Descoberta", "Seleções para você", "Uma vitrine diversa sem simular ranking de vendas ou popularidade.", "/buscar/", "Explorar catálogo")}
        ${productGrid(discovery, "product-rail")}
      </div>
    </section>

    <section class="section">
      <div class="shell">
        ${sectionHeader("Departamentos", "Produtos por departamento", "Prateleiras organizadas para comparar opções sem misturar categorias.")}
        ${departmentShelves.slice(0, 4).map(([slug, title, description]) => {
          const category = categoryDefinitions.find(item => item.slug === slug);
          const products = diverseProducts(categoryProducts(category), 4);
          if (!products.length) return "";
          return `
            <section class="shelf" aria-labelledby="shelf-${slug}">
              <div class="shelf-header">
                <div><h3 id="shelf-${slug}">${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>
                <a class="text-link" href="/categoria/${slug}/" data-route="/categoria/${slug}/">Ver todos</a>
              </div>
              ${productGrid(products, "product-rail")}
            </section>`;
        }).join("")}
      </div>
    </section>

    <section class="section section-white">
      <div class="shell">
        ${sectionHeader("Shopping virtual", "Lojas do Shopping", "Entre nas lojas principais ou conheça todos os departamentos da Impacto360.", "/lojas/", `Ver todas as ${state.stores.length} lojas`)}
        <div class="store-grid">${homeStores.map(storeCard).join("")}</div>
      </div>
    </section>

    <section class="section section-soft">
      <div class="shell">
        ${sectionHeader("Navegue com clareza", "Explore as alas do shopping", "Entre em um departamento e conheça as lojas especializadas.")}
        <div class="aisle-grid">${aisleDefinitions.slice(0, 6).map(aisleCard).join("")}</div>
      </div>
    </section>

    <section class="section section-white">
      <div class="shell">
        ${sectionHeader("Soluções sob medida", "Serviços da Impacto360", "Serviços criativos e digitais com atendimento direto.")}
        <div class="service-grid">${services.map(serviceCard).join("")}</div>
      </div>
    </section>

    <section class="section" id="como-comprar">
      <div class="shell">
        ${sectionHeader("Compra transparente", "Como comprar pela Impacto360", "O processo é simples e a transação acontece no ambiente oficial da loja parceira.")}
        <div class="how-grid">
          ${[
            ["1", "Encontre", "Pesquise produtos, categorias ou lojas."],
            ["2", "Compare", "Consulte as opções selecionadas na vitrine."],
            ["3", "Compre no parceiro", "Finalize pagamento, entrega e garantia no site oficial."],
          ].map(([number, title, copy]) => `<article class="how-card"><span class="how-number">${number}</span><h3>${title}</h3><p>${copy}</p></article>`).join("")}
        </div>
        <p class="affiliate-note">A Impacto360 pode receber comissão quando você utiliza os links indicados, sem custo adicional para você.</p>
      </div>
    </section>`;
  const root = appRoot();
  const initialHero = root.querySelector("[data-initial-home-hero]");
  if (initialHero) {
    initialHero.querySelector(".hero-products").innerHTML = heroProductMarkup;
    root.replaceChildren(initialHero);
    root.insertAdjacentHTML("beforeend", homeContent);
  } else {
    root.innerHTML = heroMarkup + homeContent;
  }
  document.documentElement.classList.add("initial-home-route");
  scrollToHash();
}

function renderAllStores(routeUrl) {
  const aisleSlug = routeUrl.searchParams.get("ala") || "";
  const selectedAisles = aisleSlug
    ? aisleDefinitions.filter(aisle => aisle.slug === aisleSlug)
    : aisleDefinitions;
  setMeta({
    title: "Lojas do Shopping | Impacto360 Afiliado",
    description: `Conheça as ${state.stores.length} lojas e serviços organizados por alas no shopping virtual Impacto360.`,
    canonical: "/lojas/",
    robots: "index,follow,max-image-preview:large",
  });
  appRoot().innerHTML = `
    ${pageHero("Lojas do Shopping", `Todas as ${state.stores.length} lojas e serviços preservados, organizados por especialidade.`, [["Início", "/"], ["Lojas", ""]])}
    <section class="section">
      <div class="shell">
        ${aisleSlug ? `<p><a class="text-link" href="/lojas/" data-route="/lojas/">← Ver todas as alas</a></p>` : ""}
        ${selectedAisles.map(aisle => {
          const stores = aisle.stores.map(id => state.storeById.get(id)).filter(Boolean);
          if (!stores.length) return "";
          return `
            <section class="shelf" aria-labelledby="aisle-${aisle.slug}">
              <div class="section-header">
                <div><span class="section-kicker">Ala do shopping</span><h2 id="aisle-${aisle.slug}">${escapeHtml(aisle.label)}</h2><p>${escapeHtml(aisle.description)}</p></div>
                <span>${stores.length} ${stores.length === 1 ? "loja" : "lojas"}</span>
              </div>
              <div class="store-grid">${stores.map(storeCard).join("")}</div>
            </section>`;
        }).join("")}
      </div>
    </section>`;
}

function renderCategory(category) {
  const products = categoryProducts(category);
  const visibleProducts = products.slice(0, state.visibleLimit);
  setMeta({
    title: `${category.label} | Impacto360 Afiliado`,
    description: `Encontre produtos de ${category.label.toLowerCase()} selecionados em lojas parceiras da Impacto360.`,
    canonical: `/categoria/${category.slug}/`,
    robots: "index,follow,max-image-preview:large",
  });
  appRoot().innerHTML = `
    ${pageHero(category.label, category.description, [["Início", "/"], ["Categorias", "/#categorias"], [category.label, ""]])}
    <section class="section">
      <div class="shell">
        <div class="results-toolbar"><p><strong>${products.length}</strong> ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}</p></div>
        ${products.length ? productGrid(diverseProducts(visibleProducts, visibleProducts.length)) : emptyState(category.label)}
        ${products.length > visibleProducts.length ? `<div class="load-more"><button class="btn btn-secondary" type="button" data-collection-load-more>Carregar mais produtos</button></div>` : ""}
      </div>
    </section>`;
}

function renderStore(store) {
  const products = state.products.filter(product => product.storeId === store.id);
  const visibleProducts = products.slice(0, state.visibleLimit);
  setMeta({
    title: `${store.name} | Impacto360 Afiliado`,
    description: text(store.description).slice(0, 155) || `Conheça a loja ${store.name} na Impacto360 Afiliado.`,
    canonical: storePath(store),
    robots: "index,follow,max-image-preview:large",
  });
  const specialties = (store.subcategories || []).slice(0, 5).join(" · ");
  appRoot().innerHTML = `
    <section class="page-hero">
      <div class="shell">
        <nav class="breadcrumbs" aria-label="Navegação estrutural"><a href="/" data-route="/">Início</a><span>›</span><a href="/lojas/" data-route="/lojas/">Lojas</a><span>›</span><span>${escapeHtml(store.name)}</span></nav>
        <div class="section-header">
          <div>
            <span class="section-kicker">${escapeHtml(store.commercialName || "Loja do Shopping")}</span>
            <h1>${escapeHtml(store.name)}</h1>
            <p>${escapeHtml(store.description || "")}</p>
            ${specialties ? `<p><strong>${escapeHtml(specialties)}</strong></p>` : ""}
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="shell">
        ${sectionHeader("Vitrine da loja", "Produtos disponíveis", `${products.length} ${products.length === 1 ? "opção selecionada" : "opções selecionadas"} com compra no parceiro.`)}
        ${products.length ? productGrid(visibleProducts) : emptyState(store.name)}
        ${products.length > visibleProducts.length ? `<div class="load-more"><button class="btn btn-secondary" type="button" data-collection-load-more>Carregar mais produtos</button></div>` : ""}
      </div>
    </section>`;
}

function emptyState(term) {
  const related = categoryDefinitions
    .map(category => ({ category, distance: levenshtein(normalize(term), normalize(category.label)) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  return `
    <div class="empty-state">
      <h2>Não encontramos produtos para “${escapeHtml(term || "esta busca")}”.</h2>
      <p>Confira a escrita ou experimente uma categoria relacionada.</p>
      <div class="recent-searches">
        ${related.map(item => `<a class="btn btn-secondary" href="/categoria/${item.category.slug}/" data-route="/categoria/${item.category.slug}/">${escapeHtml(item.category.label)}</a>`).join("")}
        <a class="btn btn-offer" href="/buscar/" data-route="/buscar/">Limpar pesquisa</a>
      </div>
    </div>`;
}

function renderSearch(routeUrl) {
  const query = text(routeUrl.searchParams.get("q"));
  const favoritesOnly = routeUrl.searchParams.get("favoritos") === "1";
  const offerOnly = routeUrl.searchParams.get("oferta") === "1";
  const selectedCategory = routeUrl.searchParams.get("categoria") || "";
  const selectedStore = routeUrl.searchParams.get("loja") || "";
  const selectedPartner = routeUrl.searchParams.get("parceiro") || "";
  const selectedBrand = routeUrl.searchParams.get("marca") || "";
  const selectedPrice = routeUrl.searchParams.get("preco") || "";
  const selectedRating = Number(routeUrl.searchParams.get("avaliacao") || 0);
  const sort = routeUrl.searchParams.get("ordem") || "relevancia";
  const favorites = favoriteSet();

  if (query) saveSearch(query);
  let ranked = searchProducts(query);
  if (favoritesOnly) ranked = ranked.filter(item => favorites.has(item.product.id));
  if (offerOnly) ranked = ranked.filter(item => item.product.offer);
  if (selectedCategory) ranked = ranked.filter(item => categoryForProduct(item.product)?.slug === selectedCategory);
  if (selectedStore) ranked = ranked.filter(item => item.product.storeId === selectedStore);
  if (selectedPartner) ranked = ranked.filter(item => normalize(partnerName(item.product)) === normalize(selectedPartner));
  if (selectedBrand) ranked = ranked.filter(item => normalize(item.product.brand) === normalize(selectedBrand));
  if (selectedPrice) ranked = ranked.filter(item => priceRange(item.product.priceValue) === selectedPrice);
  if (selectedRating) ranked = ranked.filter(item => Number(item.product.rating || 0) >= selectedRating);

  if (sort === "menor-preco") ranked.sort((a, b) => (a.product.priceValue ?? Infinity) - (b.product.priceValue ?? Infinity));
  if (sort === "maior-preco") ranked.sort((a, b) => (b.product.priceValue ?? -1) - (a.product.priceValue ?? -1));
  if (sort === "recentes") ranked.sort((a, b) => text(b.product.publishedAt || b.product.updatedAt).localeCompare(text(a.product.publishedAt || a.product.updatedAt)));
  if (sort === "melhor-avaliados") ranked.sort((a, b) => (b.product.rating || 0) - (a.product.rating || 0));

  const title = favoritesOnly ? "Seus favoritos" : query ? `Resultados para “${query}”` : offerOnly ? "Ofertas selecionadas" : "Buscar produtos";
  const description = favoritesOnly
    ? "Produtos que você salvou neste navegador."
    : query
      ? `${ranked.length} ${ranked.length === 1 ? "resultado encontrado" : "resultados encontrados"}.`
      : "Pesquise por produto, marca, categoria, modelo ou loja.";
  setMeta({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: "/buscar/",
    robots: "noindex,follow",
  });
  const products = ranked.slice(0, state.visibleLimit).map(item => item.product);
  const categories = uniqueValues(state.products.map(product => categoryForProduct(product)?.slug).filter(Boolean));
  const stores = state.stores.filter(store => state.products.some(product => product.storeId === store.id));
  const partners = uniqueValues(state.products.map(partnerName)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const brands = uniqueValues(state.products.map(product => text(product.brand)).filter(Boolean)).sort((a, b) => a.localeCompare(b, "pt-BR")).slice(0, 120);

  appRoot().innerHTML = `
    ${pageHero(title, description, [["Início", "/"], ["Busca", ""]])}
    <section class="section">
      <div class="shell results-layout">
        ${searchFilters({ selectedCategory, selectedStore, selectedPartner, selectedBrand, selectedPrice, selectedRating, offerOnly, categories, stores, partners, brands })}
        <div>
          <div class="results-toolbar">
            <p><strong>${ranked.length}</strong> ${ranked.length === 1 ? "produto" : "produtos"}</p>
            <button class="btn btn-secondary mobile-filter-toggle" type="button" data-filter-toggle>Filtros</button>
            <label>
              <span class="sr-only">Ordenar resultados</span>
              <select class="sort-select" data-sort>
                ${[
                  ["relevancia", "Mais relevantes"],
                  ["menor-preco", "Menor preço"],
                  ["maior-preco", "Maior preço"],
                  ["recentes", "Mais recentes"],
                  ["melhor-avaliados", "Melhor avaliados"],
                ].map(([value, label]) => `<option value="${value}" ${sort === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
          </div>
          ${ranked.length ? productGrid(products) : emptyState(query || title)}
          ${ranked.length > products.length ? `<div class="load-more"><button class="btn btn-secondary" type="button" data-load-more>Carregar mais produtos</button></div>` : ""}
          ${!query && !favoritesOnly ? recentSearchesBlock() : ""}
        </div>
      </div>
    </section>`;
}

function searchFilters(options) {
  const {
    selectedCategory, selectedStore, selectedPartner, selectedBrand,
    selectedPrice, selectedRating, offerOnly, categories, stores, partners, brands,
  } = options;
  return `
    <aside class="filters" data-filters aria-label="Filtros de busca">
      <div class="results-toolbar"><h2>Filtrar resultados</h2><button class="btn btn-secondary mobile-filter-toggle" type="button" data-filter-close>Fechar</button></div>
      <div class="filter-field">
        <label for="filterCategory">Categoria</label>
        <select id="filterCategory" data-filter="categoria">
          <option value="">Todas</option>
          ${categories.map(slug => {
            const category = categoryDefinitions.find(item => item.slug === slug);
            return category ? `<option value="${slug}" ${selectedCategory === slug ? "selected" : ""}>${escapeHtml(category.label)}</option>` : "";
          }).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="filterStore">Loja interna</label>
        <select id="filterStore" data-filter="loja">
          <option value="">Todas</option>
          ${stores.map(store => `<option value="${escapeAttr(store.id)}" ${selectedStore === store.id ? "selected" : ""}>${escapeHtml(store.name)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="filterPartner">Loja parceira</label>
        <select id="filterPartner" data-filter="parceiro">
          <option value="">Todas</option>
          ${partners.map(partner => `<option value="${escapeAttr(partner)}" ${selectedPartner === partner ? "selected" : ""}>${escapeHtml(partner)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="filterBrand">Marca</label>
        <select id="filterBrand" data-filter="marca">
          <option value="">Todas</option>
          ${brands.map(brand => `<option value="${escapeAttr(brand)}" ${selectedBrand === brand ? "selected" : ""}>${escapeHtml(brand)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="filterPrice">Faixa de preço</label>
        <select id="filterPrice" data-filter="preco">
          ${[
            ["", "Todas"],
            ["ate-100", "Até R$ 100"],
            ["100-500", "R$ 100 a R$ 500"],
            ["500-1000", "R$ 500 a R$ 1.000"],
            ["acima-1000", "Acima de R$ 1.000"],
          ].map(([value, label]) => `<option value="${value}" ${selectedPrice === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="filterRating">Avaliação</label>
        <select id="filterRating" data-filter="avaliacao">
          <option value="">Todas</option>
          <option value="4" ${selectedRating === 4 ? "selected" : ""}>4 estrelas ou mais</option>
          <option value="3" ${selectedRating === 3 ? "selected" : ""}>3 estrelas ou mais</option>
        </select>
      </div>
      <label class="filter-check"><input type="checkbox" data-filter="oferta" value="1" ${offerOnly ? "checked" : ""}> Somente ofertas</label>
      <a class="btn btn-secondary" href="/buscar/" data-route="/buscar/">Limpar filtros</a>
    </aside>`;
}

function recentSearchesBlock() {
  const recent = searchHistory();
  if (!recent.length) return "";
  return `
    <section class="section-soft" style="margin-top:28px;padding:18px;border-radius:12px">
      <div class="results-toolbar"><div><strong>Pesquisas recentes</strong><p>Salvas apenas neste navegador.</p></div><button class="btn btn-secondary" type="button" data-clear-history>Limpar</button></div>
      <div class="recent-searches">${recent.map(term => `<button type="button" data-search-term="${escapeAttr(term)}">${escapeHtml(term)}</button>`).join("")}</div>
    </section>`;
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function pageHero(title, description, crumbs) {
  return `
    <section class="page-hero">
      <div class="shell">
        <nav class="breadcrumbs" aria-label="Navegação estrutural">
          ${crumbs.map(([label, href], index) => `${index ? "<span>›</span>" : ""}${href ? `<a href="${escapeAttr(href)}" data-route="${escapeAttr(href)}">${escapeHtml(label)}</a>` : `<span>${escapeHtml(label)}</span>`}`).join("")}
        </nav>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
    </section>`;
}

function routeUrl() {
  const current = new URL(location.href);
  const routedPath = current.searchParams.get("route");
  if (!routedPath) return current;
  current.searchParams.delete("route");
  const routed = new URL(routedPath, location.origin);
  for (const [key, value] of current.searchParams) routed.searchParams.set(key, value);
  routed.hash = location.hash;
  return routed;
}

function currentRoutePath() {
  return routeUrl().pathname.replace(/\/+/g, "/");
}

function setMeta({ title, description, canonical, robots }) {
  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const robotsMeta = document.querySelector('meta[name="robots"]');
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (descriptionMeta) descriptionMeta.content = description;
  if (robotsMeta) robotsMeta.content = robots;
  if (canonicalLink) canonicalLink.href = new URL(canonical, SITE_URL).href;
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", new URL(canonical, SITE_URL).href);
}

function appRoot() {
  return document.getElementById("appRoot");
}

function setupDeferredImages() {
  state.imageObserver?.disconnect();
  state.imageObserver = null;

  if (window.matchMedia("(min-width: 900px)").matches) {
    document.querySelectorAll("img[data-hero-src]").forEach(image => {
      image.src = image.dataset.heroSrc;
      image.removeAttribute("data-hero-src");
    });
  }

  const images = [...document.querySelectorAll("img[data-src]")];
  const reveal = image => {
    if (!image?.dataset.src) return;
    image.src = image.dataset.src;
    image.removeAttribute("data-src");
  };
  if (!("IntersectionObserver" in window)) {
    images.forEach(reveal);
    return;
  }
  state.imageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      state.imageObserver?.unobserve(entry.target);
    });
  }, { rootMargin: "400px 0px" });
  images.forEach(image => state.imageObserver.observe(image));
}

function renderRoute({ focus = false } = {}) {
  const url = routeUrl();
  const path = url.pathname.replace(/\/+/g, "/");
  const homeRoute = path === "/" || path === "/index.html" || path === "/impacto360.html";
  document.documentElement.classList.toggle("initial-home-route", homeRoute);
  state.visibleLimit = PAGE_SIZE;
  state.routeRenderId += 1;
  closeSuggestions();
  closeMenu();
  updateNavigation(path);

  if (homeRoute) renderHome();
  else if (path === "/lojas" || path === "/lojas/") renderAllStores(url);
  else if (path === "/buscar" || path === "/buscar/") renderSearch(url);
  else if (path.startsWith("/categoria/")) {
    const slug = decodeURIComponent(path.split("/").filter(Boolean)[1] || "");
    const category = categoryDefinitions.find(item => item.slug === slug);
    category ? renderCategory(category) : renderNotFound();
  } else if (path.startsWith("/loja/")) {
    const id = decodeURIComponent(path.split("/").filter(Boolean)[1] || "");
    const store = state.storeById.get(id);
    store ? renderStore(store) : renderNotFound();
  } else {
    renderNotFound();
  }

  appRoot().setAttribute("aria-busy", "false");
  document.documentElement.classList.add("storefront-ready");
  syncHeaderSearch(url.searchParams.get("q") || "");
  bindDynamicControls();
  setupDeferredImages();
  if (focus) {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.getElementById("conteudo")?.focus({ preventScroll: true });
  }
}

function renderNotFound() {
  setMeta({
    title: `Página não encontrada | ${SITE_NAME}`,
    description: "A página solicitada não foi encontrada.",
    canonical: "/",
    robots: "noindex,follow",
  });
  appRoot().innerHTML = `
    ${pageHero("Página não encontrada", "O endereço pode ter mudado ou não estar mais disponível.", [["Início", "/"], ["Página não encontrada", ""]])}
    <section class="section"><div class="shell">${emptyState("esta página")}</div></section>`;
}

function navigate(href, { replace = false } = {}) {
  const next = new URL(href, location.origin);
  const method = replace ? "replaceState" : "pushState";
  history[method]({}, "", `${next.pathname}${next.search}${next.hash}`);
  renderRoute({ focus: true });
}

function updateNavigation(path) {
  document.querySelectorAll("[data-main-nav] a").forEach(link => {
    const target = new URL(link.href, location.origin).pathname;
    const active = target === "/" ? path === "/" : path.startsWith(target);
    active ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
  });
}

function syncHeaderSearch(value) {
  const input = document.querySelector("[data-search-input]");
  if (input && input.value !== value) input.value = value;
}

function scrollToHash() {
  if (!location.hash) return;
  requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ block: "start" }));
}

function bindDynamicControls() {
  document.querySelector("[data-sort]")?.addEventListener("change", event => updateSearchParam("ordem", event.target.value));
  document.querySelector("[data-load-more]")?.addEventListener("click", () => {
    state.visibleLimit += PAGE_SIZE;
    renderSearch(routeUrl());
    requestAnimationFrame(() => document.querySelector("[data-load-more]")?.focus());
  });
  document.querySelector("[data-collection-load-more]")?.addEventListener("click", () => {
    state.visibleLimit += PAGE_SIZE;
    const path = currentRoutePath();
    if (path.startsWith("/categoria/")) {
      const slug = decodeURIComponent(path.split("/").filter(Boolean)[1] || "");
      const category = categoryDefinitions.find(item => item.slug === slug);
      if (category) renderCategory(category);
    } else if (path.startsWith("/loja/")) {
      const id = decodeURIComponent(path.split("/").filter(Boolean)[1] || "");
      const store = state.storeById.get(id);
      if (store) renderStore(store);
    }
    bindDynamicControls();
    setupDeferredImages();
    requestAnimationFrame(() => document.querySelector("[data-collection-load-more]")?.focus());
  });
  document.querySelectorAll("[data-filter]").forEach(control => control.addEventListener("change", event => {
    const value = event.target.type === "checkbox" ? (event.target.checked ? "1" : "") : event.target.value;
    updateSearchParam(event.target.dataset.filter, value);
  }));
  document.querySelector("[data-filter-toggle]")?.addEventListener("click", () => document.querySelector("[data-filters]")?.classList.add("open"));
  document.querySelector("[data-filter-close]")?.addEventListener("click", () => document.querySelector("[data-filters]")?.classList.remove("open"));
  document.querySelector("[data-clear-history]")?.addEventListener("click", clearSearchHistory);
}

function updateSearchParam(name, value) {
  const url = routeUrl();
  value ? url.searchParams.set(name, value) : url.searchParams.delete(name);
  navigate(`${url.pathname}?${url.searchParams.toString()}`, { replace: true });
}

function toggleFavorite(productId) {
  const favorites = favoriteSet();
  const added = !favorites.has(productId);
  added ? favorites.add(productId) : favorites.delete(productId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  document.querySelectorAll(`[data-favorite="${CSS.escape(productId)}"]`).forEach(button => {
    button.setAttribute("aria-pressed", String(added));
    const product = state.products.find(item => item.id === productId);
    button.setAttribute("aria-label", `${added ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${product?.name || "produto"}`);
  });
  showToast(added ? "Produto adicionado aos favoritos." : "Produto removido dos favoritos.");
  if (routeUrl().searchParams.get("favoritos") === "1") renderSearch(routeUrl());
}

function showToast(message) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 3000);
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  const button = document.querySelector("[data-menu-toggle]");
  button?.setAttribute("aria-expanded", "false");
  button?.setAttribute("aria-label", "Abrir menu de navegação");
}

function toggleMenu() {
  const open = !document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  const button = document.querySelector("[data-menu-toggle]");
  button?.setAttribute("aria-expanded", String(open));
  button?.setAttribute("aria-label", open ? "Fechar menu de navegação" : "Abrir menu de navegação");
}

function highlightMatch(label, query) {
  const source = text(label);
  const rawQuery = text(query);
  if (!rawQuery) return escapeHtml(source);
  const index = source.toLocaleLowerCase("pt-BR").indexOf(rawQuery.toLocaleLowerCase("pt-BR"));
  if (index < 0) return escapeHtml(source);
  return `${escapeHtml(source.slice(0, index))}<mark>${escapeHtml(source.slice(index, index + rawQuery.length))}</mark>${escapeHtml(source.slice(index + rawQuery.length))}`;
}

function suggestionData(query) {
  const products = searchProducts(query).slice(0, 6).map(item => ({
    type: "product",
    label: item.product.name,
    meta: `${partnerName(item.product)} · ${money(item.product.priceValue, item.product.price)}`,
    image: item.product.image,
    href: productPath(item.product),
  }));
  const normalized = normalize(query);
  const categories = categoryDefinitions
    .filter(category => normalize([category.label, category.description, ...category.terms].join(" ")).includes(normalized))
    .slice(0, 2)
    .map(category => ({ type: "scope", label: category.label, meta: "Categoria", href: `/categoria/${category.slug}/` }));
  const stores = state.stores
    .filter(store => normalize([store.name, store.description, ...(store.subcategories || [])].join(" ")).includes(normalized))
    .slice(0, 2)
    .map(store => ({ type: "scope", label: store.name, meta: "Loja do shopping", href: storePath(store) }));
  return [...products, ...categories, ...stores, {
    type: "all",
    label: `Ver todos os resultados para “${query}”`,
    meta: "",
    href: `/buscar/?q=${encodeURIComponent(query)}`,
  }];
}

function renderSuggestions(query) {
  const holder = document.querySelector("[data-search-suggestions]");
  const input = document.querySelector("[data-search-input]");
  if (!holder || !input) return;
  const clean = text(query);
  if (clean.length < 2) {
    const recent = searchHistory();
    if (!recent.length) {
      closeSuggestions();
      return;
    }
    state.suggestionItems = recent.map(term => ({
      type: "recent",
      label: term,
      meta: "Pesquisa recente",
      href: `/buscar/?q=${encodeURIComponent(term)}`,
    }));
  } else {
    state.suggestionItems = suggestionData(clean);
  }
  state.suggestionIndex = -1;
  holder.innerHTML = `
    <div class="suggestion-group-label">${clean.length >= 2 ? "Sugestões" : "Pesquisas recentes"}</div>
    ${state.suggestionItems.map((item, index) => `
      <button
        type="button"
        class="suggestion-item ${item.type === "all" ? "suggestion-all" : ""}"
        role="option"
        aria-selected="false"
        data-suggestion-index="${index}"
      >
        ${item.image ? `<img src="${escapeAttr(assetUrl(item.image))}" alt="" loading="lazy" decoding="async">` : `<span class="shortcut-icon">${icon(item.type === "recent" ? "search" : "grid")}</span>`}
        <span><strong>${highlightMatch(item.label, clean)}</strong>${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}</span>
        <span aria-hidden="true">›</span>
      </button>`).join("")}`;
  holder.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function closeSuggestions() {
  const holder = document.querySelector("[data-search-suggestions]");
  const input = document.querySelector("[data-search-input]");
  if (holder) holder.hidden = true;
  if (input) {
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  state.suggestionIndex = -1;
}

function activateSuggestion(index) {
  const holder = document.querySelector("[data-search-suggestions]");
  const input = document.querySelector("[data-search-input]");
  if (!holder || holder.hidden || !state.suggestionItems.length) return;
  state.suggestionIndex = (index + state.suggestionItems.length) % state.suggestionItems.length;
  holder.querySelectorAll("[data-suggestion-index]").forEach((button, buttonIndex) => {
    const active = buttonIndex === state.suggestionIndex;
    button.setAttribute("aria-selected", String(active));
    button.id = `searchSuggestion${buttonIndex}`;
    if (active) button.scrollIntoView({ block: "nearest" });
  });
  input?.setAttribute("aria-activedescendant", `searchSuggestion${state.suggestionIndex}`);
}

function chooseSuggestion(index) {
  const item = state.suggestionItems[index];
  if (!item) return;
  closeSuggestions();
  if (item.href.startsWith("/produto/")) {
    location.href = item.href;
    return;
  }
  navigate(item.href);
}

function setupGlobalEvents() {
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const query = text(input?.value);
    if (!query) {
      navigate("/buscar/");
      return;
    }
    saveSearch(query);
    navigate(`/buscar/?q=${encodeURIComponent(query)}`);
  });
  input?.addEventListener("input", event => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => renderSuggestions(event.target.value), 280);
  });
  input?.addEventListener("focus", event => renderSuggestions(event.target.value));
  input?.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activateSuggestion(state.suggestionIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activateSuggestion(state.suggestionIndex - 1);
    } else if (event.key === "Enter" && state.suggestionIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(state.suggestionIndex);
    } else if (event.key === "Escape") {
      closeSuggestions();
    }
  });

  document.addEventListener("click", event => {
    const routeLink = event.target.closest("[data-route]");
    if (routeLink && !event.ctrlKey && !event.metaKey && !event.shiftKey && routeLink.origin === location.origin) {
      event.preventDefault();
      navigate(routeLink.getAttribute("data-route") || routeLink.getAttribute("href"));
      return;
    }
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      event.preventDefault();
      toggleFavorite(favorite.dataset.favorite);
      return;
    }
    const suggestion = event.target.closest("[data-suggestion-index]");
    if (suggestion) {
      chooseSuggestion(Number(suggestion.dataset.suggestionIndex));
      return;
    }
    const recent = event.target.closest("[data-search-term]");
    if (recent) {
      navigate(`/buscar/?q=${encodeURIComponent(recent.dataset.searchTerm)}`);
      return;
    }
    if (!event.target.closest("[data-search-form]")) closeSuggestions();
  });

  document.addEventListener("error", event => {
    if (event.target instanceof HTMLImageElement && !event.target.dataset.fallbackApplied) {
      event.target.dataset.fallbackApplied = "true";
      event.target.src = placeholderImage();
    }
  }, true);

  document.querySelector("[data-menu-toggle]")?.addEventListener("click", toggleMenu);
  window.addEventListener("popstate", () => renderRoute({ focus: true }));
}

async function loadData() {
  const [productsResponse, storesResponse] = await Promise.all([
    fetch(CATALOG_URL, { cache: "no-store" }),
    fetch(STORES_URL, { cache: "no-store" }),
  ]);
  if (!productsResponse.ok || !storesResponse.ok) throw new Error("Não foi possível carregar o catálogo público.");
  const [products, stores] = await Promise.all([productsResponse.json(), storesResponse.json()]);
  state.products = Array.isArray(products) ? products : [];
  state.stores = Array.isArray(stores) ? stores : [];
  state.storeById = new Map(state.stores.map(store => [store.id, store]));
  state.products.forEach(product => {
    product._search = normalize([
      product.name, product.description, product.category, product.subcategory,
      product.brand, product.model, ...(product.tags || []), product.storeId,
      state.storeById.get(product.storeId)?.name, partnerName(product),
    ].join(" "));
    product._categorySlug = categoryDefinitions.find(category => categoryMatches(product, category))?.slug || "";
  });
  window.__impacto360GetProducts = () => state.products;
  window.__impacto360GetStores = () => state.stores;
}

async function boot() {
  const routedPath = new URLSearchParams(location.search).get("route") || location.pathname;
  if (routedPath.startsWith("/admin/")) return;
  setupGlobalEvents();
  try {
    await loadData();
    renderRoute();
  } catch (error) {
    console.error(error);
    appRoot().setAttribute("aria-busy", "false");
    document.documentElement.classList.add("storefront-ready");
    appRoot().innerHTML = `
      <section class="section"><div class="shell"><div class="empty-state">
        <h2>Não foi possível carregar as ofertas agora.</h2>
        <p>Tente atualizar a página em alguns instantes.</p>
        <button class="btn btn-primary" type="button" onclick="location.reload()">Atualizar página</button>
      </div></div></section>`;
  }
}

boot();
