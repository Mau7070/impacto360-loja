const SITE_NAME = "Impacto360 Afiliado";
const SITE_URL = "https://impacto360afiliado.com.br";
const CATALOG_URL = "/dados/catalogo-publico.json?v=20260729-preview";
const STORES_URL = "/dados/stores.json?v=20260729-preview";
const FAVORITES_KEY = "impacto360Favorites";
const SEARCH_HISTORY_KEY = "impacto360SearchHistory";
const VIEW_HISTORY_KEY = "impacto360ViewHistory";
const ALERTS_KEY = "impacto360PriceAlerts";
const CONSENT_KEY = "impacto360Consent";
const ACCESSIBILITY_KEY = "impacto360Accessibility";
const THEME_KEY = "impacto360Theme";
const CONSENT_VERSION = 1;
const PRICE_VALIDITY_DAYS = 7;
const ALLOWED_AFFILIATE_DOMAINS = new Set([
  "amazon.com.br",
  "link.amazon",
  "amzn.to",
  "meli.la",
  "s.shopee.com.br",
  "go.hotmart.com",
]);
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
  filterReturnFocus: null,
  filterBrands: [],
  menuReturnFocus: null,
  installPrompt: null,
  speechRecognition: null,
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
    slug: "esporte-e-fitness",
    label: "Esporte e Fitness",
    description: "Academia, musculação, corrida, yoga e treino funcional.",
    icon: "heart",
    terms: ["academia", "fitness", "musculacao", "halter", "anilha", "treino", "corrida", "yoga", "pilates", "bicicleta ergometrica"],
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
    slug: "livros-papelaria-e-fe",
    label: "Livros, Papelaria e Fé",
    description: "Livros, material escolar, leitura digital e produtos religiosos.",
    icon: "grid",
    terms: ["livro", "livraria", "papelaria", "material escolar", "caderno", "kindle", "biblia", "devocional", "harpa"],
  },
  {
    slug: "montaria-e-cavalgada",
    label: "Montaria e Cavalgada",
    description: "Itens e acessórios para o universo equestre.",
    icon: "horse",
    terms: ["montaria", "cavalgada", "cavalo", "equestre", "sela", "country", "chapeu cowboy"],
  },
  {
    slug: "auto-e-moto",
    label: "Auto e Moto",
    description: "Acessórios, cuidados e soluções para veículos.",
    icon: "tool",
    terms: ["automotivo", "carro", "moto", "motociclista", "veiculo", "pneu"],
  },
  {
    slug: "beleza-e-cuidados",
    label: "Beleza e Cuidados",
    description: "Autocuidado, cosméticos, perfumaria e higiene pessoal.",
    icon: "spark",
    terms: ["beleza", "perfume", "cosmetico", "shampoo", "barbeador", "aparador", "escova secadora"],
  },
  {
    slug: "pets",
    label: "Pets",
    description: "Produtos para cuidado, conforto e diversão dos animais.",
    icon: "heart",
    terms: ["pet", "cachorro", "gato", "racao", "coleira", "caminha pet"],
  },
  {
    slug: "cursos-e-educacao",
    label: "Cursos e Educação",
    description: "Cursos, treinamentos e conteúdos para aprendizado.",
    icon: "grid",
    terms: ["curso", "treinamento", "aula", "licitacao", "pregao", "educacao"],
  },
  {
    slug: "servicos-digitais",
    label: "Serviços Digitais",
    description: "Música, criação, personalizados e apoio acadêmico.",
    icon: "spark",
    terms: ["servico", "personalizado", "jingle", "musica", "design", "academico", "criacao"],
  },
  {
    slug: "ofertas-e-parceiros",
    label: "Ofertas e Parceiros",
    description: "Seleções variadas, oportunidades e vitrines parceiras.",
    icon: "tag",
    terms: ["oferta", "promocao", "parceiro"],
  },
];

const storeCategoryById = new Map([
  ["impacto-mobile", "celulares-e-tecnologia"],
  ["impacto-tech-computadores", "celulares-e-tecnologia"],
  ["impacto-eletronicos", "celulares-e-tecnologia"],
  ["impacto-games", "games-e-setup"],
  ["impacto-casa", "casa-e-cozinha"],
  ["impacto-decor", "casa-e-cozinha"],
  ["impacto-sport", "esporte-e-fitness"],
  ["impacto-moda", "moda-e-calcados"],
  ["grife-prime", "moda-e-calcados"],
  ["impacto-calcados", "moda-e-calcados"],
  ["impacto-ferramentas", "ferramentas"],
  ["impacto-brinquedos", "brinquedos-e-escolar"],
  ["impacto-kids", "brinquedos-e-escolar"],
  ["impacto-livraria", "livros-papelaria-e-fe"],
  ["impacto-fe", "livros-papelaria-e-fe"],
  ["impacto-montaria", "montaria-e-cavalgada"],
  ["impacto-auto", "auto-e-moto"],
  ["impacto-beauty-care", "beleza-e-cuidados"],
  ["impacto-pet", "pets"],
  ["impacto-educa", "cursos-e-educacao"],
  ["impacto-music-studio", "servicos-digitais"],
  ["impacto-academico", "servicos-digitais"],
  ["impacto-personalizados", "servicos-digitais"],
  ["impacto-criadores", "servicos-digitais"],
  ["impacto-ofertas", "ofertas-e-parceiros"],
  ["lojas-parceiras", "ofertas-e-parceiros"],
]);

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
  ["esporte-e-fitness", "Esporte e Fitness", "Academia, corrida e treino funcional"],
  ["livros-papelaria-e-fe", "Livros, Papelaria e Fé", "Leitura, estudo e inspiração"],
  ["cursos-e-educacao", "Cursos e Educação", "Aprendizado e desenvolvimento"],
  ["ofertas-e-parceiros", "Ofertas e Parceiros", "Oportunidades de diferentes lojas"],
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

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function storedIdSet(key) {
  const values = readStorage(key, []);
  return new Set(Array.isArray(values) ? values.map(String) : []);
}

function isAllowedAffiliateUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return [...ALLOWED_AFFILIATE_DOMAINS].some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

function recordViewedProduct(productId) {
  const history = readStorage(VIEW_HISTORY_KEY, []);
  const next = [String(productId), ...(Array.isArray(history) ? history.map(String) : []).filter(id => id !== String(productId))].slice(0, 40);
  writeStorage(VIEW_HISTORY_KEY, next);
}

function selectedProducts(key) {
  const ids = storedIdSet(key);
  return state.products.filter(product => ids.has(String(product.id)));
}

const SEARCH_STOPWORDS = new Set([
  "a", "as", "com", "da", "das", "de", "do", "dos", "e", "em",
  "na", "nas", "no", "nos", "o", "os", "para", "por", "um", "uma",
]);

const SEARCH_ALIASES = new Map([
  ["celular", ["smartphone", "telefone"]],
  ["smartphone", ["celular", "telefone"]],
  ["telefone", ["celular", "smartphone"]],
  ["televisao", ["tv"]],
  ["tv", ["televisao"]],
  ["laptop", ["notebook"]],
  ["notebook", ["laptop"]],
]);

function searchTokens(value) {
  return normalize(value)
    .split(" ")
    .filter(Boolean)
    .map(token => token.length > 4 && token.endsWith("es") ? token.slice(0, -2) : token)
    .map(token => token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token)
    .filter(token => !SEARCH_STOPWORDS.has(token));
}

function searchAlternatives(token) {
  return [token, ...(SEARCH_ALIASES.get(token) || [])];
}

function textMatchesSearchToken(haystack, token) {
  return searchAlternatives(token).some(candidate => haystack.includes(candidate));
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

function validBrand(value) {
  const brand = text(value);
  const normalized = normalize(brand);
  if (!normalized || brand.length > 80) return "";
  if (/^(amazon|mercado livre|shopee|hotmart|loja parceira)$/.test(normalized)) return "";
  if (/informacao nao especificada|nao informad[ao]|sem marca|marca generica|generico/.test(normalized)) return "";
  return brand;
}

function money(value, fallback = "") {
  if (Number.isFinite(value) && value > 0) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }
  return text(fallback) || "Consulte o preço no parceiro";
}

function dateLabel(value) {
  const raw = text(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function availabilityLabel(product) {
  const value = text(product.availability);
  if (!value || /conferir|consultar|parceiro/i.test(value)) return "Consulte a disponibilidade";
  return value;
}

function availabilityFilter(product) {
  const value = normalize(product.availability);
  if (/indisponivel|esgotado|fora de estoque|sem estoque/.test(value)) return "indisponivel";
  if (/disponivel|em estoque|pronta entrega|ultima unidade|ultimas unidades/.test(value)) return "disponivel";
  return "consultar";
}

function priceRange(value) {
  if (!Number.isFinite(value)) return "sem-preco";
  if (value <= 100) return "ate-100";
  if (value <= 500) return "100-500";
  if (value <= 1000) return "500-1000";
  return "acima-1000";
}

function validDiscount(product) {
  return priceFreshness(product).current
    && Number.isFinite(product.previousPriceValue)
    && Number.isFinite(product.priceValue)
    && product.previousPriceValue > product.priceValue;
}

function discountPercent(product) {
  if (!validDiscount(product)) return 0;
  return Math.round((1 - product.priceValue / product.previousPriceValue) * 100);
}

function priceFreshness(product) {
  const raw = text(product.priceUpdatedAt || product.updatedAt);
  const checkedAt = raw ? new Date(raw) : null;
  if (!checkedAt || Number.isNaN(checkedAt.getTime())) {
    return { current: false, stale: false, checkedAt: "" };
  }
  const ageMs = Date.now() - checkedAt.getTime();
  const current = ageMs >= 0 && ageMs <= PRICE_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
  return { current, stale: !current, checkedAt: dateLabel(raw) };
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

function categorySlugForProduct(product) {
  if (product.storeId === "impacto-casa") {
    const subcategory = normalize(product.subcategory || product.subcategoria || "");
    if (/(eletrodomestico|eletroportatil|pequenos eletros)/.test(subcategory)) {
      return "eletrodomesticos";
    }
  }
  return storeCategoryById.get(product.storeId)
    || categoryDefinitions.find(category => categoryMatches(product, category))?.slug
    || "";
}

function categoryForProduct(product) {
  if (product._categorySlug !== undefined) {
    return categoryDefinitions.find(category => category.slug === product._categorySlug) || null;
  }
  const slug = categorySlugForProduct(product);
  const category = categoryDefinitions.find(item => item.slug === slug) || null;
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
    if (textMatchesSearchToken(name, token)) {
      score += 36;
      matched += 1;
      continue;
    }
    if (textMatchesSearchToken(brandModel, token)) {
      score += 25;
      matched += 1;
      continue;
    }
    if (textMatchesSearchToken(category, token) || textMatchesSearchToken(tags, token)) {
      score += 16;
      matched += 1;
      continue;
    }
    if (textMatchesSearchToken(description, token)) {
      score += 7;
      matched += 1;
      continue;
    }
    if (allWords.some(word => searchAlternatives(token).some(candidate => fuzzyTokenMatch(candidate, word)))) {
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
  const alerts = storedIdSet(ALERTS_KEY);
  const freshness = priceFreshness(product);
  const discount = discountPercent(product);
  const verifiedBadge = /oferta verificada/i.test(text(product.badge));
  const badge = discount
    ? `${discount}% OFF`
    : freshness.stale
      ? "Informação antiga"
      : verifiedBadge && freshness.current
        ? "Oferta verificada"
        : text(product.badge).replace(/oferta verificada/ig, "").trim() || "Produto selecionado";
  const internalPath = productPath(product);
  const quote = product.actionType === "quote";
  const actionLabel = quote ? "Solicitar orçamento" : "Ver oferta";
  const actionClass = quote ? "btn-service" : "btn-offer";
  const currentPrice = money(product.priceValue, product.price);
  const previousPrice = validDiscount(product) ? money(product.previousPriceValue, product.previousPrice) : "";
  const updatedAt = freshness.checkedAt;
  const rating = product.rating
    ? `<span aria-label="Avaliação ${product.rating.toFixed(1)} de 5">★ ${product.rating.toFixed(1).replace(".", ",")}</span>`
    : "";
  const image = assetUrl(product.image);
  const eager = index < eagerCount;
  return `
    <article class="product-card" data-product-id="${escapeAttr(product.id)}">
      <div class="product-media">
        <a href="${escapeAttr(internalPath)}" data-product-internal="${escapeAttr(product.id)}" aria-label="Ver detalhes de ${escapeAttr(product.name)}">
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
        <h3><a href="${escapeAttr(internalPath)}" data-product-internal="${escapeAttr(product.id)}">${escapeHtml(product.name)}</a></h3>
        ${rating ? `<span class="rating product-rating">${rating}</span>` : ""}
        <div class="product-facts">
          <span>${escapeHtml(availabilityLabel(product))}</span>
          ${updatedAt ? `<span class="${freshness.stale ? "product-stale" : ""}">${freshness.stale ? "Informação antiga" : "Preço verificado"} em ${escapeHtml(updatedAt)}</span>` : ""}
        </div>
        <div class="price-block">
          ${previousPrice ? `<span class="old-price">${escapeHtml(previousPrice)}</span>` : ""}
          <strong class="current-price">${escapeHtml(currentPrice)}</strong>
        </div>
        <a
          class="btn ${actionClass}"
          href="${escapeAttr(isAllowedAffiliateUrl(product.link) ? product.link : "#")}"
          target="_blank"
          rel="noopener noreferrer sponsored"
          data-affiliate-link="${escapeAttr(product.link)}"
          data-link-plataforma="${escapeAttr(product.link)}"
          data-product-name="${escapeAttr(product.name)}"
        >${actionLabel}</a>
        <button
          class="btn btn-secondary"
          type="button"
          data-alert="${escapeAttr(product.id)}"
          aria-pressed="${alerts.has(String(product.id))}"
        >${alerts.has(String(product.id)) ? "Acompanhando" : "Acompanhar preço"}</button>
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
  ], 8);
  const heroProducts = featured.slice(0, 4);
  const homeStores = homeStoreIds.map(id => state.storeById.get(id)).filter(Boolean).slice(0, 4);
  const activeCategories = categoryDefinitions.filter(category => categoryProducts(category).length > 0).slice(0, 8);
  const heroProductMarkup = heroProducts.map((product, index) => `
    <span class="hero-product">
      <img src="${escapeAttr(assetUrl(product.image))}" alt="" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ""}>
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

    <section class="section section-soft">
      <div class="shell">
        ${sectionHeader("Curadoria Impacto360", "Ofertas em destaque", "Produtos selecionados e atualizados com frequência.", "/buscar/?oferta=1", "Ver todas as ofertas")}
        ${productGrid(featured, "product-grid", 2)}
      </div>
    </section>

    <section class="section section-white">
      <div class="shell">
        ${sectionHeader("Navegação rápida", "Compre por categoria", "Oito caminhos diretos para encontrar o que você procura.", "/buscar/", "Ver todas as categorias")}
        <div class="category-grid">${activeCategories.map(categoryCard).join("")}</div>
      </div>
    </section>

    <section class="section section-white">
      <div class="shell">
        ${sectionHeader("Shopping virtual", "Lojas do Shopping", "Entre nas lojas principais ou conheça todos os departamentos da Impacto360.", "/lojas/", `Ver todas as ${state.stores.length} lojas`)}
        <div class="store-grid">${homeStores.map(storeCard).join("")}</div>
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

function collectionOptions(products) {
  const categoryCounts = countValues(products.map(product => categoryForProduct(product)?.slug).filter(Boolean));
  const storeCounts = countValues(products.map(product => product.storeId).filter(Boolean));
  const partnerCounts = countValues(products.map(partnerName));
  const brandCounts = countValues(products.map(product => validBrand(product.brand)).filter(Boolean));
  const priceCounts = countValues(products.map(product => priceRange(product.priceValue)));
  const availabilityCounts = countValues(products.map(availabilityFilter));
  return {
    categories: [...categoryCounts.keys()],
    stores: state.stores.filter(store => storeCounts.has(store.id)),
    partners: [...partnerCounts.keys()].sort((a, b) => a.localeCompare(b, "pt-BR")),
    brands: [...brandCounts.keys()].sort((a, b) => a.localeCompare(b, "pt-BR")),
    categoryCounts,
    storeCounts,
    partnerCounts,
    brandCounts,
    priceCounts,
    availabilityCounts,
    offerCount: products.filter(product => product.offer).length,
    ratingCounts: new Map([
      [4, products.filter(product => Number(product.rating || 0) >= 4).length],
      [3, products.filter(product => Number(product.rating || 0) >= 3).length],
    ]),
  };
}

function sortProducts(products, sort) {
  if (sort === "nome") products.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (sort === "menor-preco") products.sort((a, b) => (a.priceValue ?? Infinity) - (b.priceValue ?? Infinity));
  if (sort === "maior-preco") products.sort((a, b) => (b.priceValue ?? -1) - (a.priceValue ?? -1));
  if (sort === "recentes") products.sort((a, b) => text(b.publishedAt || b.updatedAt).localeCompare(text(a.publishedAt || a.updatedAt)));
  if (sort === "melhor-avaliados") products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return products;
}

function filteredCollection(sourceProducts, currentUrl) {
  const selectedCategory = currentUrl.searchParams.get("categoria") || "";
  const selectedStore = currentUrl.searchParams.get("loja") || "";
  const selectedPartner = currentUrl.searchParams.get("parceiro") || "";
  const selectedBrand = currentUrl.searchParams.get("marca") || "";
  const selectedPrice = currentUrl.searchParams.get("preco") || "";
  const selectedRating = Number(currentUrl.searchParams.get("avaliacao") || 0);
  const selectedAvailability = currentUrl.searchParams.get("disponibilidade") || "";
  const offerOnly = currentUrl.searchParams.get("oferta") === "1";
  const sort = currentUrl.searchParams.get("ordem") || "relevancia";
  let products = [...sourceProducts];
  if (selectedCategory) products = products.filter(product => categoryForProduct(product)?.slug === selectedCategory);
  if (selectedStore) products = products.filter(product => product.storeId === selectedStore);
  if (selectedPartner) products = products.filter(product => normalize(partnerName(product)) === normalize(selectedPartner));
  if (selectedBrand) products = products.filter(product => normalize(validBrand(product.brand)) === normalize(selectedBrand));
  if (selectedPrice) products = products.filter(product => priceRange(product.priceValue) === selectedPrice);
  if (selectedRating) products = products.filter(product => Number(product.rating || 0) >= selectedRating);
  if (selectedAvailability) products = products.filter(product => availabilityFilter(product) === selectedAvailability);
  if (offerOnly) products = products.filter(product => product.offer);
  sortProducts(products, sort);
  return {
    products,
    sort,
    selectedCategory,
    selectedStore,
    selectedPartner,
    selectedBrand,
    selectedPrice,
    selectedRating,
    selectedAvailability,
    offerOnly,
  };
}

function collectionSortSelect(sort) {
  return `<label>
    <span class="sr-only">Ordenar resultados</span>
    <select class="sort-select" data-sort>
      ${[
        ["relevancia", "Mais relevantes"],
        ["nome", "Nome"],
        ["menor-preco", "Menor preço"],
        ["maior-preco", "Maior preço"],
        ["recentes", "Mais recentes"],
        ["melhor-avaliados", "Melhor avaliados"],
      ].map(([value, label]) => `<option value="${value}" ${sort === value ? "selected" : ""}>${label}</option>`).join("")}
    </select>
  </label>`;
}

function renderCategory(category, currentUrl = routeUrl()) {
  const sourceProducts = categoryProducts(category);
  const collection = filteredCollection(sourceProducts, currentUrl);
  const products = collection.products;
  const visibleProducts = products.slice(0, state.visibleLimit);
  const options = collectionOptions(sourceProducts);
  setMeta({
    title: `${category.label} | Impacto360 Afiliado`,
    description: `Encontre produtos de ${category.label.toLowerCase()} selecionados em lojas parceiras da Impacto360.`,
    canonical: `/categoria/${category.slug}/`,
    robots: "index,follow,max-image-preview:large",
  });
  appRoot().innerHTML = `
    ${pageHero(category.label, category.description, [["Início", "/"], ["Categorias", "/#categorias"], [category.label, ""]])}
    <section class="section">
      <div class="shell results-layout">
        ${searchFilters({
          ...collection, ...options, clearHref: clearSearchFiltersHref(currentUrl),
          showCategory: false, showStore: true,
        })}
        <div>
        <h2 class="sr-only">Produtos de ${escapeHtml(category.label)}</h2>
        <div class="results-toolbar">
          <p><strong>${products.length}</strong> ${products.length === 1 ? "produto encontrado" : "produtos encontrados"}</p>
          <button class="btn btn-secondary mobile-filter-toggle" type="button" data-filter-toggle>Filtros</button>
          ${collectionSortSelect(collection.sort)}
        </div>
        ${products.length ? productGrid(diverseProducts(visibleProducts, visibleProducts.length), "product-grid", 2) : emptyState(category.label)}
        ${products.length > visibleProducts.length ? `<div class="load-more"><button class="btn btn-secondary" type="button" data-collection-load-more>Carregar mais produtos</button></div>` : ""}
        </div>
      </div>
    </section>`;
}

function renderStore(store, currentUrl = routeUrl()) {
  const sourceProducts = state.products.filter(product => product.storeId === store.id);
  const collection = filteredCollection(sourceProducts, currentUrl);
  const products = collection.products;
  const visibleProducts = products.slice(0, state.visibleLimit);
  const options = collectionOptions(sourceProducts);
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
      <div class="shell results-layout">
        ${searchFilters({
          ...collection, ...options, clearHref: clearSearchFiltersHref(currentUrl),
          showCategory: true, showStore: false,
        })}
        <div>
        ${sectionHeader("Vitrine da loja", "Produtos disponíveis", `${products.length} ${products.length === 1 ? "opção selecionada" : "opções selecionadas"} com compra no parceiro.`)}
        <div class="results-toolbar">
          <p><strong>${products.length}</strong> ${products.length === 1 ? "produto" : "produtos"}</p>
          <button class="btn btn-secondary mobile-filter-toggle" type="button" data-filter-toggle>Filtros</button>
          ${collectionSortSelect(collection.sort)}
        </div>
        ${products.length ? productGrid(visibleProducts, "product-grid", 2) : emptyState(store.name)}
        ${products.length > visibleProducts.length ? `<div class="load-more"><button class="btn btn-secondary" type="button" data-collection-load-more>Carregar mais produtos</button></div>` : ""}
        </div>
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
  const selectedAvailability = routeUrl.searchParams.get("disponibilidade") || "";
  const sort = routeUrl.searchParams.get("ordem") || "relevancia";
  const favorites = favoriteSet();

  if (query) saveSearch(query);
  let ranked = searchProducts(query);
  if (favoritesOnly) ranked = ranked.filter(item => favorites.has(item.product.id));
  if (offerOnly) ranked = ranked.filter(item => item.product.offer);
  if (selectedCategory) ranked = ranked.filter(item => categoryForProduct(item.product)?.slug === selectedCategory);
  if (selectedStore) ranked = ranked.filter(item => item.product.storeId === selectedStore);
  if (selectedPartner) ranked = ranked.filter(item => normalize(partnerName(item.product)) === normalize(selectedPartner));
  if (selectedBrand) ranked = ranked.filter(item => normalize(validBrand(item.product.brand)) === normalize(selectedBrand));
  if (selectedPrice) ranked = ranked.filter(item => priceRange(item.product.priceValue) === selectedPrice);
  if (selectedRating) ranked = ranked.filter(item => Number(item.product.rating || 0) >= selectedRating);
  if (selectedAvailability) ranked = ranked.filter(item => availabilityFilter(item.product) === selectedAvailability);

  if (sort === "nome") ranked.sort((a, b) => a.product.name.localeCompare(b.product.name, "pt-BR"));
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
  const categoryCounts = countValues(state.products.map(product => categoryForProduct(product)?.slug).filter(Boolean));
  const storeCounts = countValues(state.products.map(product => product.storeId).filter(Boolean));
  const partnerCounts = countValues(state.products.map(partnerName));
  const brandCounts = countValues(state.products.map(product => validBrand(product.brand)).filter(Boolean));
  const priceCounts = countValues(state.products.map(product => priceRange(product.priceValue)));
  const availabilityCounts = countValues(state.products.map(availabilityFilter));
  const categories = [...categoryCounts.keys()];
  const stores = state.stores.filter(store => storeCounts.has(store.id));
  const partners = [...partnerCounts.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const brands = [...brandCounts.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const clearHref = clearSearchFiltersHref(routeUrl);
  const activeFilterCount = [
    selectedCategory, selectedStore, selectedPartner, selectedBrand, selectedPrice,
    selectedRating, selectedAvailability, offerOnly,
  ].filter(Boolean).length;
  state.filterBrands = brands.map(brand => ({ brand, count: brandCounts.get(brand) || 0 }));

  appRoot().innerHTML = `
    ${pageHero(title, description, [["Início", "/"], ["Busca", ""]])}
    <section class="section">
      <div class="shell results-layout">
        ${searchFilters({
          selectedCategory, selectedStore, selectedPartner, selectedBrand, selectedPrice, selectedRating, selectedAvailability,
          offerOnly, categories, stores, partners, brands, categoryCounts, storeCounts, partnerCounts,
          brandCounts, priceCounts, availabilityCounts, clearHref, showCategory: true, showStore: true,
          activeFilterCount,
          offerCount: state.products.filter(product => product.offer).length,
          ratingCounts: new Map([
            [4, state.products.filter(product => Number(product.rating || 0) >= 4).length],
            [3, state.products.filter(product => Number(product.rating || 0) >= 3).length],
          ]),
        })}
        <div>
          <h2 class="sr-only">Produtos encontrados</h2>
          <div class="results-toolbar">
            <p><strong>${ranked.length}</strong> ${ranked.length === 1 ? "produto" : "produtos"}</p>
            <button class="btn btn-secondary mobile-filter-toggle" type="button" data-filter-toggle>
              Filtros ${activeFilterCount ? `<span class="filter-count">${activeFilterCount}</span>` : ""}
            </button>
            <label>
              <span class="sr-only">Ordenar resultados</span>
              <select class="sort-select" data-sort>
                ${[
                  ["relevancia", "Mais relevantes"],
                  ["nome", "Nome"],
                  ["menor-preco", "Menor preço"],
                  ["maior-preco", "Maior preço"],
                  ["recentes", "Mais recentes"],
                  ["melhor-avaliados", "Melhor avaliados"],
                ].map(([value, label]) => `<option value="${value}" ${sort === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
          </div>
          ${ranked.length ? productGrid(products, "product-grid", 2) : emptyState(query || title)}
          ${ranked.length > products.length ? `<div class="load-more"><button class="btn btn-secondary" type="button" data-load-more>Carregar mais produtos</button></div>` : ""}
          ${!query && !favoritesOnly ? recentSearchesBlock() : ""}
        </div>
      </div>
    </section>`;
}

function searchFilters(options) {
  const {
    selectedCategory, selectedStore, selectedPartner, selectedBrand,
    selectedPrice, selectedRating, selectedAvailability, offerOnly, categories, stores, partners, brands,
    categoryCounts, storeCounts, partnerCounts, brandCounts, priceCounts,
    availabilityCounts, ratingCounts, offerCount, clearHref, activeFilterCount = 0,
    showCategory = true, showStore = true,
  } = options;
  const effectiveFilterCount = activeFilterCount || [
    selectedCategory, selectedStore, selectedPartner, selectedBrand, selectedPrice,
    selectedRating, selectedAvailability, offerOnly,
  ].filter(Boolean).length;
  state.filterBrands = brands.map(brand => ({ brand, count: brandCounts.get(brand) || 0 }));
  return `
    <button class="filter-backdrop" type="button" data-filter-close aria-label="Fechar filtros" tabindex="-1"></button>
    <aside class="filters" data-filters aria-label="Filtros de busca" aria-hidden="false">
      <div class="filters-summary">
        <h2>Filtrar resultados</h2>
        ${effectiveFilterCount ? `<span class="filter-count" aria-label="${effectiveFilterCount} filtros ativos">${effectiveFilterCount}</span>` : ""}
        <button class="btn btn-secondary mobile-filter-toggle" type="button" data-filter-close>Fechar</button>
      </div>
      ${showCategory ? `
      <div class="filter-field">
        <label for="filterCategory">Categoria</label>
        <select id="filterCategory" data-filter="categoria">
          <option value="">Todas</option>
          ${categories.map(slug => {
            const category = categoryDefinitions.find(item => item.slug === slug);
            return category ? `<option value="${slug}" ${selectedCategory === slug ? "selected" : ""}>${escapeHtml(category.label)} (${categoryCounts.get(slug) || 0})</option>` : "";
          }).join("")}
        </select>
      </div>` : ""}
      ${showStore ? `
      <div class="filter-field">
        <label for="filterStore">Loja interna</label>
        <select id="filterStore" data-filter="loja">
          <option value="">Todas</option>
          ${stores.map(store => `<option value="${escapeAttr(store.id)}" ${selectedStore === store.id ? "selected" : ""}>${escapeHtml(store.name)} (${storeCounts.get(store.id) || 0})</option>`).join("")}
        </select>
      </div>` : ""}
      <div class="filter-field">
        <label for="filterPartner">Loja parceira</label>
        <select id="filterPartner" data-filter="parceiro">
          <option value="">Todas</option>
          ${partners.map(partner => `<option value="${escapeAttr(partner)}" ${selectedPartner === partner ? "selected" : ""}>${escapeHtml(partner)} (${partnerCounts.get(partner) || 0})</option>`).join("")}
        </select>
      </div>
      <div class="filter-field brand-suggest">
        <label for="filterBrand">Marca</label>
        <input id="filterBrand" type="search" value="${escapeAttr(selectedBrand)}" placeholder="Digite ao menos 2 letras" autocomplete="off" aria-controls="brandSuggestions" aria-expanded="false" data-brand-search>
        <div class="brand-suggestions" id="brandSuggestions" role="listbox" data-brand-suggestions hidden></div>
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
            ["sem-preco", "Preço no parceiro"],
          ].map(([value, label]) => `<option value="${value}" ${selectedPrice === value ? "selected" : ""}>${label}${value ? ` (${priceCounts.get(value) || 0})` : ""}</option>`).join("")}
        </select>
      </div>
      <div class="filter-field">
        <label for="filterRating">Avaliação</label>
        <select id="filterRating" data-filter="avaliacao">
          <option value="">Todas</option>
          <option value="4" ${selectedRating === 4 ? "selected" : ""}>4 estrelas ou mais (${ratingCounts.get(4) || 0})</option>
          <option value="3" ${selectedRating === 3 ? "selected" : ""}>3 estrelas ou mais (${ratingCounts.get(3) || 0})</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="filterAvailability">Disponibilidade</label>
        <select id="filterAvailability" data-filter="disponibilidade">
          ${[
            ["", "Todas"],
            ["disponivel", "Disponível"],
            ["consultar", "Consultar no parceiro"],
            ["indisponivel", "Indisponível"],
          ].map(([value, label]) => `<option value="${value}" ${selectedAvailability === value ? "selected" : ""}>${label}${value ? ` (${availabilityCounts.get(value) || 0})` : ""}</option>`).join("")}
        </select>
      </div>
      <label class="filter-check"><input type="checkbox" data-filter="oferta" value="1" ${offerOnly ? "checked" : ""}> Somente ofertas (${offerCount})</label>
      <a class="btn btn-secondary" href="${escapeAttr(clearHref)}" data-route="${escapeAttr(clearHref)}">Limpar${effectiveFilterCount ? ` ${effectiveFilterCount} filtros` : " filtros"}</a>
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

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return counts;
}

function clearSearchFiltersHref(sourceUrl) {
  const clean = new URL(sourceUrl.href);
  for (const key of ["categoria", "loja", "parceiro", "marca", "preco", "avaliacao", "disponibilidade", "oferta"]) {
    clean.searchParams.delete(key);
  }
  const query = clean.searchParams.toString();
  return `${clean.pathname}${query ? `?${query}` : ""}`;
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

const contentPages = {
  "/como-comprar/": {
    title: "Como comprar",
    description: "Encontre, confira e conclua sua compra com segurança no site oficial da loja parceira.",
    robots: "index,follow,max-image-preview:large",
    content: `
      <article class="content-card">
        <h2>A Impacto360 ajuda você a descobrir</h2>
        <ol class="feature-list">
          <li>Pesquise por produto, categoria, marca ou loja.</li>
          <li>Confira a origem da oferta e quando a informação foi verificada.</li>
          <li>Use “Ver oferta” para abrir o ambiente oficial do parceiro.</li>
          <li>Confirme preço, estoque, frete, pagamento, garantia e entrega antes de comprar.</li>
        </ol>
      </article>
      <article class="content-card">
        <h2>A compra não acontece na Impacto360</h2>
        <p>Não recebemos pagamentos, não armazenamos dados de cartão e não intermediamos entrega ou garantia. Essas etapas pertencem exclusivamente à loja parceira.</p>
      </article>`,
  },
  "/transparencia-de-afiliados/": {
    title: "Transparência de afiliados",
    description: "Entenda como os links de afiliado sustentam a curadoria da Impacto360.",
    robots: "index,follow,max-image-preview:large",
    content: `
      <article class="content-card">
        <h2>Como a Impacto360 é remunerada</h2>
        <p>Alguns links são links de afiliado. Quando uma compra elegível é concluída no parceiro, a Impacto360 pode receber uma comissão, sem custo adicional para você.</p>
        <p>A comissão não altera o preço exibido pelo parceiro e não autoriza a Impacto360 a processar pagamentos.</p>
      </article>
      <article class="content-card">
        <h2>Compromissos de curadoria</h2>
        <ul class="feature-list">
          <li>Não inventar preço, estoque, avaliação ou especificação.</li>
          <li>Sinalizar quando o preço precisa ser confirmado no parceiro.</li>
          <li>Bloquear links ou imagens quando houver divergência sensível.</li>
          <li>Usar apenas integrações e fontes permitidas pelos parceiros.</li>
        </ul>
      </article>`,
  },
  "/privacidade/": {
    title: "Política de privacidade",
    description: "Saiba quais dados são usados e controle suas preferências na Impacto360.",
    robots: "index,follow",
    content: `
      <article class="content-card">
        <h2>Dados mínimos e controle local</h2>
        <p>Favoritos, histórico de pesquisa, itens visualizados, tema e acessibilidade são armazenados no seu navegador. Nesta versão, esses dados não criam uma conta e não são sincronizados com um servidor.</p>
        <p>Você pode exportar ou apagar essas preferências na página <a href="/perfil/" data-route="/perfil/">Perfil e dados</a>.</p>
      </article>
      <article class="content-card">
        <h2>Medição e publicidade</h2>
        <p>Integrações opcionais só são carregadas depois da sua autorização. Você pode mudar a decisão a qualquer momento nas preferências de cookies.</p>
        <p>Dúvidas podem ser enviadas para <a href="mailto:contato@impacto360afiliado.com">contato@impacto360afiliado.com</a>.</p>
      </article>`,
  },
  "/cookies/": {
    title: "Preferências de cookies",
    description: "Escolha quais finalidades opcionais podem ser usadas neste navegador.",
    robots: "index,follow",
    content: `
      <article class="content-card">
        <h2>Você decide</h2>
        <p>O armazenamento necessário mantém favoritos, histórico, tema, acessibilidade e sua própria decisão de consentimento. Medição e publicidade permanecem desligadas até sua autorização.</p>
        <button class="btn btn-primary" type="button" data-cookie-settings>Revisar preferências</button>
      </article>`,
  },
  "/termos/": {
    title: "Termos de uso",
    description: "Condições para utilizar a curadoria e os links da Impacto360 Afiliado.",
    robots: "index,follow",
    content: `
      <article class="content-card">
        <h2>Uso da vitrine</h2>
        <p>A Impacto360 organiza informações para facilitar a descoberta. Preços e disponibilidade podem mudar; a informação definitiva é sempre a apresentada pelo parceiro no momento da compra.</p>
        <p>O uso automatizado abusivo, a tentativa de contornar controles e a reutilização não autorizada do catálogo podem ser restringidos.</p>
      </article>
      <article class="content-card">
        <h2>Responsabilidade do parceiro</h2>
        <p>Pagamento, entrega, troca, garantia, atendimento e tratamento de dados durante a compra são realizados pelo parceiro escolhido.</p>
      </article>`,
  },
  "/acessibilidade/": {
    title: "Acessibilidade",
    description: "Ajuste leitura, contraste e movimentos de acordo com sua preferência.",
    robots: "index,follow",
    content: `
      <article class="content-card">
        <h2>Recursos disponíveis</h2>
        <ul class="feature-list">
          <li>Navegação por teclado e foco visível.</li>
          <li>Texto ampliado, alto contraste e redução de movimentos.</li>
          <li>Busca textual como alternativa permanente a voz e imagem.</li>
          <li>Leitura em voz alta quando o navegador oferece síntese de fala.</li>
        </ul>
        <button class="btn btn-primary" type="button" data-accessibility-open>Abrir central de acessibilidade</button>
      </article>`,
  },
};

function renderContentPage(path) {
  const page = contentPages[path];
  if (!page) return renderNotFound();
  setMeta({
    title: `${page.title} | ${SITE_NAME}`,
    description: page.description,
    canonical: path,
    robots: page.robots,
  });
  appRoot().innerHTML = `
    ${pageHero(page.title, page.description, [["Início", "/"], [page.title, ""]])}
    <section class="section"><div class="shell content-page">${page.content}</div></section>`;
}

function favoritesEmptyState() {
  return `
    <div class="empty-state">
      <h2>Você ainda não salvou nenhum favorito.</h2>
      <p>Use o coração nos cards para reunir aqui os produtos que deseja comparar depois.</p>
      <a class="btn btn-offer" href="/buscar/" data-route="/buscar/">Explorar produtos</a>
    </div>`;
}

function renderSavedCollection({ title, description, products, emptyLabel, canonical, emptyMarkup = "" }) {
  setMeta({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical,
    robots: "noindex,follow",
  });
  appRoot().innerHTML = `
    ${pageHero(title, description, [["Início", "/"], [title, ""]])}
    <section class="section"><div class="shell">
      ${products.length ? productGrid(products) : emptyMarkup || emptyState(emptyLabel)}
    </div></section>`;
}

function renderFavorites() {
  renderSavedCollection({
    title: "Favoritos",
    description: "Produtos salvos somente neste navegador.",
    products: selectedProducts(FAVORITES_KEY),
    emptyLabel: "seus favoritos",
    canonical: "/favoritos/",
    emptyMarkup: favoritesEmptyState(),
  });
}

function renderHistory() {
  const ids = readStorage(VIEW_HISTORY_KEY, []);
  const byId = new Map(state.products.map(product => [String(product.id), product]));
  const products = (Array.isArray(ids) ? ids : []).map(id => byId.get(String(id))).filter(Boolean);
  renderSavedCollection({
    title: "Histórico de visualização",
    description: "Itens abertos recentemente neste navegador.",
    products,
    emptyLabel: "seu histórico",
    canonical: "/historico/",
  });
}

function renderAlerts() {
  renderSavedCollection({
    title: "Acompanhamento de preço",
    description: "Lista local de produtos que você deseja acompanhar. Notificações automáticas ainda não estão ativas.",
    products: selectedProducts(ALERTS_KEY),
    emptyLabel: "seu acompanhamento de preço",
    canonical: "/alertas/",
  });
}

function renderProfile() {
  setMeta({
    title: `Perfil e dados | ${SITE_NAME}`,
    description: "Controle preferências e dados mantidos neste navegador.",
    canonical: "/perfil/",
    robots: "noindex,follow",
  });
  appRoot().innerHTML = `
    ${pageHero("Perfil e dados", "Use a Impacto360 como visitante e mantenha o controle das informações locais.", [["Início", "/"], ["Perfil e dados", ""]])}
    <section class="section"><div class="shell content-page">
      <article class="content-card">
        <h2>Modo visitante</h2>
        <p>Não há conta conectada. Favoritos, histórico e preferências permanecem neste dispositivo.</p>
        <div class="account-actions">
          <button class="btn btn-secondary" type="button" data-export-profile>Exportar meus dados</button>
          <button class="btn btn-secondary" type="button" data-clear-profile>Apagar dados locais</button>
          <a class="btn btn-primary" href="/favoritos/" data-route="/favoritos/">Ver favoritos</a>
        </div>
      </article>
      <article class="content-card">
        <h2>Visual e acessibilidade</h2>
        <p>Escolha como deseja navegar neste dispositivo. As preferências podem ser alteradas a qualquer momento.</p>
        <div class="account-actions">
          <button class="btn btn-secondary" type="button" data-theme-toggle>Alternar tema</button>
          <button class="btn btn-secondary" type="button" data-accessibility-open>Abrir acessibilidade</button>
          <a class="btn btn-secondary" href="/cookies/" data-route="/cookies/">Preferências de cookies</a>
        </div>
      </article>
    </div></section>`;
}

function renderInstall() {
  setMeta({
    title: `Instalar aplicativo | ${SITE_NAME}`,
    description: "Instale a Impacto360 como aplicativo quando o navegador oferecer suporte.",
    canonical: "/instalar/",
    robots: "index,follow",
  });
  appRoot().innerHTML = `
    ${pageHero("Instale a Impacto360", "Acesse mais rápido pela tela inicial e mantenha preferências locais.", [["Início", "/"], ["Instalar", ""]])}
    <section class="section"><div class="shell content-page">
      <article class="content-card">
        <h2>Aplicativo web instalável</h2>
        <p>Em navegadores compatíveis, use o botão abaixo. No iPhone ou iPad, abra o menu Compartilhar e escolha “Adicionar à Tela de Início”.</p>
        <button class="btn btn-primary" type="button" data-install-app>Instalar quando disponível</button>
        <p class="form-status" role="status" data-install-status></p>
      </article>
    </div></section>`;
}

function renderImageSearchPage() {
  setMeta({
    title: `Busca por imagem | ${SITE_NAME}`,
    description: "Use uma imagem e uma descrição textual para iniciar uma pesquisa acessível.",
    canonical: "/buscar/imagem/",
    robots: "noindex,follow",
  });
  appRoot().innerHTML = `
    ${pageHero("Busca por imagem", "Uma experiência assistida, com alternativa textual obrigatória para evitar correspondências incorretas.", [["Início", "/"], ["Busca por imagem", ""]])}
    <section class="section"><div class="shell content-page">
      <article class="content-card">
        <h2>Pesquisar com fotografia</h2>
        <p>A análise visual automática ainda depende de um serviço seguro e revisado. A imagem não é enviada nesta versão; você pode usar a descrição para pesquisar o catálogo agora.</p>
        <button class="btn btn-primary" type="button" data-image-search-open>Selecionar imagem</button>
      </article>
    </div></section>`;
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

  const normalizedPath = path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`;
  if (homeRoute) renderHome();
  else if (path === "/lojas" || path === "/lojas/") renderAllStores(url);
  else if (path === "/buscar" || path === "/buscar/") renderSearch(url);
  else if (normalizedPath === "/ofertas/") {
    const offersUrl = new URL("/buscar/", location.origin);
    offersUrl.searchParams.set("oferta", "1");
    renderSearch(offersUrl);
    setMeta({
      title: `Ofertas selecionadas | ${SITE_NAME}`,
      description: "Ofertas com preço verificado dentro da validade definida; confirme as condições no parceiro.",
      canonical: "/ofertas/",
      robots: "index,follow,max-image-preview:large",
    });
  }
  else if (normalizedPath === "/favoritos/") renderFavorites();
  else if (normalizedPath === "/historico/") renderHistory();
  else if (normalizedPath === "/alertas/") renderAlerts();
  else if (normalizedPath === "/perfil/") renderProfile();
  else if (normalizedPath === "/instalar/") renderInstall();
  else if (normalizedPath === "/buscar/imagem/") renderImageSearchPage();
  else if (normalizedPath === "/politica-de-privacidade/") renderContentPage("/privacidade/");
  else if (normalizedPath === "/termos-de-uso/") renderContentPage("/termos/");
  else if (contentPages[normalizedPath]) renderContentPage(normalizedPath);
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
  document.querySelectorAll("[data-main-nav] a, .bottom-nav a").forEach(link => {
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

function focusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll('a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

function setInteractiveVisibility(element, hidden) {
  if (!element) return;
  element.setAttribute("aria-hidden", hidden ? "true" : "false");
  element.toggleAttribute("inert", hidden);
}

function openFilters() {
  const panel = document.querySelector("[data-filters]");
  if (!panel) return;
  state.filterReturnFocus = document.activeElement;
  panel.classList.add("open");
  setInteractiveVisibility(panel, false);
  document.body.classList.add("filters-open");
  requestAnimationFrame(() => panel.querySelector("[data-filter-close]")?.focus());
}

function closeFilters({ restoreFocus = true } = {}) {
  const panel = document.querySelector("[data-filters]");
  panel?.classList.remove("open");
  if (panel) setInteractiveVisibility(panel, window.matchMedia("(max-width: 760px)").matches);
  document.body.classList.remove("filters-open");
  if (restoreFocus && state.filterReturnFocus instanceof HTMLElement) state.filterReturnFocus.focus();
  state.filterReturnFocus = null;
}

function renderBrandFilterSuggestions(input) {
  const holder = document.querySelector("[data-brand-suggestions]");
  if (!input || !holder) return;
  const query = normalize(input.value);
  if (query.length < 2) {
    holder.hidden = true;
    holder.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    return;
  }
  const matches = state.filterBrands
    .filter(item => normalize(item.brand).includes(query))
    .slice(0, 10);
  holder.innerHTML = matches.length
    ? matches.map(item => `<button type="button" role="option" data-brand-option="${escapeAttr(item.brand)}">${escapeHtml(item.brand)} (${item.count})</button>`).join("")
    : `<span class="form-status">Nenhuma marca encontrada.</span>`;
  holder.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function bindDynamicControls() {
  const filterPanel = document.querySelector("[data-filters]");
  if (filterPanel) setInteractiveVisibility(filterPanel, window.matchMedia("(max-width: 760px)").matches);
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
  const brandInput = document.querySelector("[data-brand-search]");
  brandInput?.addEventListener("input", event => renderBrandFilterSuggestions(event.currentTarget));
  brandInput?.addEventListener("search", event => {
    if (!text(event.currentTarget.value)) updateSearchParam("marca", "");
  });
  brandInput?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const holder = document.querySelector("[data-brand-suggestions]");
      if (holder) holder.hidden = true;
      event.currentTarget.setAttribute("aria-expanded", "false");
    }
    if (event.key === "Enter") {
      const option = document.querySelector("[data-brand-suggestions] [data-brand-option]");
      if (option) {
        event.preventDefault();
        updateSearchParam("marca", option.dataset.brandOption || "");
      }
    }
  });
  document.querySelector("[data-filter-toggle]")?.addEventListener("click", openFilters);
  document.querySelectorAll("[data-filter-close]").forEach(button => button.addEventListener("click", () => closeFilters()));
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

function toggleAlert(productId) {
  const alerts = storedIdSet(ALERTS_KEY);
  const id = String(productId);
  const added = !alerts.has(id);
  added ? alerts.add(id) : alerts.delete(id);
  writeStorage(ALERTS_KEY, [...alerts]);
  document.querySelectorAll(`[data-alert="${CSS.escape(id)}"]`).forEach(button => {
    button.setAttribute("aria-pressed", String(added));
    button.textContent = added ? "Acompanhando" : "Acompanhar preço";
  });
  showToast(added
    ? "Produto salvo para acompanhamento local. Notificações ainda não estão ativas."
    : "Produto removido do acompanhamento.");
  if (currentRoutePath().replace(/\/+$/, "") === "/alertas") renderRoute();
}

function currentConsent() {
  const consent = readStorage(CONSENT_KEY, null);
  return consent?.version === CONSENT_VERSION ? consent : null;
}

function loadScriptOnce(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function applyConsent(consent) {
  if (!consent) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
  if (consent.analytics || consent.marketing) {
    window.gtag("js", new Date());
    window.gtag("config", "AW-17933727169");
    loadScriptOnce("https://www.googletagmanager.com/gtag/js?id=AW-17933727169", "impacto360Measurement");
  }
  if (consent.marketing) {
    loadScriptOnce("/integracoes/impacto360-google-ads.js?v=20260728-4", "impacto360AdsIntegration");
  }
}

function saveConsent({ analytics = false, marketing = false }) {
  const consent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    updatedAt: new Date().toISOString(),
  };
  writeStorage(CONSENT_KEY, consent);
  const banner = document.querySelector("[data-cookie-banner]");
  if (banner) banner.hidden = true;
  document.body.classList.remove("consent-visible");
  applyConsent(consent);
  showToast("Preferências de privacidade salvas.");
}

function openCookieSettings() {
  const dialog = document.querySelector("[data-cookie-dialog]");
  const consent = currentConsent();
  const form = dialog?.querySelector("[data-cookie-form]");
  if (!dialog || !form) return;
  form.elements.analytics.checked = Boolean(consent?.analytics);
  form.elements.marketing.checked = Boolean(consent?.marketing);
  dialog.showModal();
}

function initializeConsent() {
  const consent = currentConsent();
  const banner = document.querySelector("[data-cookie-banner]");
  if (consent) {
    applyConsent(consent);
    if (banner) banner.hidden = true;
    document.body.classList.remove("consent-visible");
  } else if (banner) {
    banner.hidden = false;
    document.body.classList.add("consent-visible");
  }
}

function accessibilitySettings() {
  const settings = readStorage(ACCESSIBILITY_KEY, {});
  return settings && typeof settings === "object" ? settings : {};
}

function applyAccessibility(settings) {
  document.documentElement.dataset.textSize = settings.largeText ? "large" : "normal";
  document.documentElement.dataset.contrast = settings.contrast ? "high" : "normal";
  document.documentElement.dataset.reduceMotion = settings.reducedMotion ? "true" : "false";
}

function openAccessibilitySettings() {
  const dialog = document.querySelector("[data-accessibility-dialog]");
  const form = dialog?.querySelector("[data-accessibility-form]");
  if (!dialog || !form) return;
  const settings = accessibilitySettings();
  form.elements.largeText.checked = Boolean(settings.largeText);
  form.elements.contrast.checked = Boolean(settings.contrast);
  form.elements.reducedMotion.checked = Boolean(settings.reducedMotion);
  dialog.showModal();
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#071B2F" : "#12355B");
  showToast(`Modo ${next === "dark" ? "escuro" : "claro"} ativado.`);
}

function readMainContent() {
  if (!("speechSynthesis" in window)) {
    showToast("A leitura em voz alta não é suportada neste navegador.");
    return;
  }
  window.speechSynthesis.cancel();
  const content = text(document.getElementById("conteudo")?.innerText).slice(0, 8000);
  if (!content) return;
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = "pt-BR";
  window.speechSynthesis.speak(utterance);
  showToast("Leitura iniciada. Use a central de acessibilidade para interromper.");
}

function startVoiceSearch() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showToast("Busca por voz indisponível. Digite sua pesquisa no campo de busca.");
    document.querySelector("[data-search-input]")?.focus();
    return;
  }
  state.speechRecognition?.abort();
  const recognition = new Recognition();
  state.speechRecognition = recognition;
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => showToast("Ouvindo. Diga o produto que procura.");
  recognition.onerror = () => showToast("Não foi possível reconhecer a voz. Use a busca por texto.");
  recognition.onresult = event => {
    const query = text(event.results?.[0]?.[0]?.transcript);
    if (!query) return;
    const input = document.querySelector("[data-search-input]");
    if (input) input.value = query;
    saveSearch(query);
    navigate(`/buscar/?q=${encodeURIComponent(query)}`);
  };
  recognition.start();
}

function openImageSearch() {
  document.querySelector("[data-image-search-dialog]")?.showModal();
}

function previewSelectedImage(input) {
  const file = input.files?.[0];
  const preview = document.querySelector("[data-image-preview]");
  const status = document.querySelector("[data-image-status]");
  if (!file || !preview || !status) return;
  if (file.size > 8 * 1024 * 1024) {
    input.value = "";
    preview.hidden = true;
    status.textContent = "A imagem deve ter no máximo 8 MB.";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = String(reader.result);
    preview.hidden = false;
    status.textContent = "Imagem pronta. Ela não foi enviada; descreva o produto para pesquisar.";
  };
  reader.readAsDataURL(file);
}

function exportLocalProfile() {
  const payload = {
    exportedAt: new Date().toISOString(),
    favorites: readStorage(FAVORITES_KEY, []),
    searches: readStorage(SEARCH_HISTORY_KEY, []),
    viewedProducts: readStorage(VIEW_HISTORY_KEY, []),
    watchedPrices: readStorage(ALERTS_KEY, []),
    accessibility: accessibilitySettings(),
    theme: localStorage.getItem(THEME_KEY) || "system",
    consent: currentConsent(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `impacto360-dados-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Arquivo com dados locais preparado.");
}

function clearLocalProfile() {
  const approved = window.confirm("Apagar favoritos, históricos, acompanhamento de preço e preferências deste navegador?");
  if (!approved) return;
  for (const key of [FAVORITES_KEY, SEARCH_HISTORY_KEY, VIEW_HISTORY_KEY, ALERTS_KEY, ACCESSIBILITY_KEY, THEME_KEY, CONSENT_KEY]) {
    localStorage.removeItem(key);
  }
  document.documentElement.dataset.theme = "light";
  applyAccessibility({});
  initializeConsent();
  showToast("Dados locais apagados.");
  renderRoute();
}

async function installApp() {
  const status = document.querySelector("[data-install-status]");
  if (!state.installPrompt) {
    if (status) status.textContent = "Use a opção de instalação ou “Adicionar à Tela de Início” no menu do navegador.";
    return;
  }
  state.installPrompt.prompt();
  const choice = await state.installPrompt.userChoice;
  if (status) status.textContent = choice.outcome === "accepted" ? "Instalação aceita." : "Instalação cancelada.";
  state.installPrompt = null;
}

function updateOnlineStatus() {
  const offline = !navigator.onLine;
  const banner = document.querySelector("[data-offline-banner]");
  if (banner) banner.hidden = !offline;
  document.documentElement.classList.toggle("is-offline", offline);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  navigator.serviceWorker.register("/sw.js").catch(error => console.warn("Service worker não registrado.", error));
}

function closeMenu({ restoreFocus = false } = {}) {
  document.body.classList.remove("menu-open");
  const button = document.querySelector("[data-menu-toggle]");
  button?.setAttribute("aria-expanded", "false");
  button?.setAttribute("aria-label", "Abrir menu de navegação");
  setInteractiveVisibility(document.querySelector("[data-main-nav]"), window.matchMedia("(max-width: 760px)").matches);
  if (restoreFocus && state.menuReturnFocus instanceof HTMLElement) state.menuReturnFocus.focus();
  state.menuReturnFocus = null;
}

function toggleMenu() {
  const open = !document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  const button = document.querySelector("[data-menu-toggle]");
  button?.setAttribute("aria-expanded", String(open));
  button?.setAttribute("aria-label", open ? "Fechar menu de navegação" : "Abrir menu de navegação");
  const nav = document.querySelector("[data-main-nav]");
  setInteractiveVisibility(nav, !open && window.matchMedia("(max-width: 760px)").matches);
  if (open) {
    state.menuReturnFocus = button;
    requestAnimationFrame(() => focusableElements(nav)[0]?.focus());
  }
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
    const productInternal = event.target.closest("[data-product-internal]");
    if (productInternal) recordViewedProduct(productInternal.dataset.productInternal);

    const affiliateLink = event.target.closest("[data-affiliate-link]");
    if (affiliateLink && !isAllowedAffiliateUrl(affiliateLink.dataset.affiliateLink || affiliateLink.href)) {
      event.preventDefault();
      showToast("Link bloqueado porque o destino não pertence à lista de parceiros permitidos.");
      return;
    }

    if (event.target.closest("[data-theme-toggle]")) {
      toggleTheme();
      return;
    }
    if (event.target.closest("[data-accessibility-open]")) {
      openAccessibilitySettings();
      return;
    }
    if (event.target.closest("[data-voice-search]")) {
      startVoiceSearch();
      return;
    }
    if (event.target.closest("[data-image-search-open]")) {
      openImageSearch();
      return;
    }
    if (event.target.closest("[data-cookie-settings]")) {
      openCookieSettings();
      return;
    }
    if (event.target.closest("[data-cookie-reject]")) {
      saveConsent({ analytics: false, marketing: false });
      return;
    }
    if (event.target.closest("[data-cookie-accept]")) {
      saveConsent({ analytics: true, marketing: true });
      return;
    }
    if (event.target.closest("[data-read-page]")) {
      readMainContent();
      return;
    }
    if (event.target.closest("[data-export-profile]")) {
      exportLocalProfile();
      return;
    }
    if (event.target.closest("[data-clear-profile]")) {
      clearLocalProfile();
      return;
    }
    if (event.target.closest("[data-install-app]")) {
      installApp();
      return;
    }
    const brandOption = event.target.closest("[data-brand-option]");
    if (brandOption) {
      updateSearchParam("marca", brandOption.dataset.brandOption || "");
      return;
    }

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
    const alert = event.target.closest("[data-alert]");
    if (alert) {
      event.preventDefault();
      toggleAlert(alert.dataset.alert);
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
  document.querySelector("[data-menu-overlay]")?.addEventListener("click", () => closeMenu({ restoreFocus: true }));
  document.querySelector("[data-image-file]")?.addEventListener("change", event => previewSelectedImage(event.target));

  document.querySelector("[data-cookie-form]")?.addEventListener("submit", event => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const form = event.currentTarget;
    saveConsent({
      analytics: form.elements.analytics.checked,
      marketing: form.elements.marketing.checked,
    });
    form.closest("dialog")?.close();
  });

  document.querySelector("[data-accessibility-form]")?.addEventListener("submit", event => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const form = event.currentTarget;
    const settings = {
      largeText: form.elements.largeText.checked,
      contrast: form.elements.contrast.checked,
      reducedMotion: form.elements.reducedMotion.checked,
    };
    writeStorage(ACCESSIBILITY_KEY, settings);
    applyAccessibility(settings);
    form.closest("dialog")?.close();
    showToast("Preferências de acessibilidade aplicadas.");
  });

  document.querySelector("[data-image-search-form]")?.addEventListener("submit", event => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const query = text(event.currentTarget.elements.description.value);
    if (!query) return;
    event.currentTarget.closest("dialog")?.close();
    saveSearch(query);
    navigate(`/buscar/?q=${encodeURIComponent(query)}`);
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.installPrompt = event;
  });
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  setInteractiveVisibility(document.querySelector("[data-main-nav]"), window.matchMedia("(max-width: 760px)").matches);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (document.querySelector("[data-filters].open")) {
        event.preventDefault();
        closeFilters();
        return;
      }
      if (document.body.classList.contains("menu-open")) {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      }
      return;
    }
    if (event.key !== "Tab") return;
    const activePanel = document.querySelector("[data-filters].open")
      || (document.body.classList.contains("menu-open") ? document.querySelector("[data-main-nav]") : null);
    const focusable = focusableElements(activePanel);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
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
    product._categorySlug = categorySlugForProduct(product);
  });
  window.__impacto360GetProducts = () => state.products;
  window.__impacto360GetStores = () => state.stores;
}

async function boot() {
  const routedPath = new URLSearchParams(location.search).get("route") || location.pathname;
  if (routedPath.startsWith("/admin/")) {
    setMeta({
      title: `Área administrativa indisponível | ${SITE_NAME}`,
      description: "A administração do catálogo não é exposta no site público.",
      canonical: "/",
      robots: "noindex,nofollow",
    });
    appRoot().setAttribute("aria-busy", "false");
    document.documentElement.classList.add("storefront-ready");
    appRoot().innerHTML = `
      <section class="section"><div class="shell"><div class="empty-state">
        <h1>Área administrativa não disponível no site público</h1>
        <p>Os relatórios de saúde e auditoria ficam em ambiente privado.</p>
        <a class="btn btn-primary" href="/">Voltar à loja</a>
      </div></div></section>`;
    return;
  }
  setupGlobalEvents();
  initializeConsent();
  applyAccessibility(accessibilitySettings());
  updateOnlineStatus();
  registerServiceWorker();
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
