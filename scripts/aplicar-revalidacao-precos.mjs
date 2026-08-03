import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  availabilityFields,
  cleanLegacyBadge,
  cleanLegacyCommercialText,
  ratingFields,
  reviewCountFields,
} from "./commercial-data.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const apply = args.includes("--apply");
const inputPath = path.resolve(option("--input", path.join(root, "dados", "revalidacao-precos-20260803.json")));
const date = option("--date", new Date().toISOString().slice(0, 10));
const validDays = Math.max(1, Number(option("--valid-days", "7")));
const reportPath = path.resolve(option("--report", path.join(root, "backups", `revalidacao-precos-${date.replaceAll("-", "")}`, "relatorio.json")));
const productsPath = path.join(root, "dados", "products.json");
const packageProductsPath = path.join(root, "pacote-github-pages-pronto", "dados", "products.json");

const priceFields = ["price", "preco", "precoPromocional", "precoAtual"];
const previousPriceFields = ["precoAnterior", "previousPrice", "oldPrice", "priceBefore", "precoOriginal"];
const discountFields = ["discountPercent", "percentualDesconto", "descontoPercentual"];
const explicitPriceDateFields = [
  "precoAtualizadoEm", "priceUpdatedAt", "ultimaVerificacaoPreco",
  "dataUltimaVerificacao", "ultimaVerificacao", "lastChecked",
];
const affiliateFields = [
  "affiliateLink", "linkAfiliado", "linkComissionado", "linkCompra",
  "linkPlataforma", "urlProduto", "linkOriginal", "link_original_afiliado",
];
const visibleTextFields = [
  "description", "descricaoCurta", "fullDescription", "descricaoDetalhada",
  "descricaoCompleta", "textoCatalogo", "textoWhatsApp", "legendaWhatsApp",
  "legendaInstagram", "legendaFacebook",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalize(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleMatches(expected, observed) {
  const left = normalize(expected);
  const right = normalize(observed);
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return true;
  const stop = new Set(["a", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "o", "os", "para", "por"]);
  const leftTokens = new Set(left.split(" ").filter(token => token.length > 1 && !stop.has(token)));
  const rightTokens = new Set(right.split(" ").filter(token => token.length > 1 && !stop.has(token)));
  const overlap = [...leftTokens].filter(token => rightTokens.has(token)).length;
  return overlap >= 3
    && overlap / Math.min(leftTokens.size, rightTokens.size) >= 0.6
    && overlap / Math.max(leftTokens.size, rightTokens.size) >= 0.38;
}

function priceNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const raw = text(value);
  if (!raw) return null;
  const number = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatBrl(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    .format(value)
    .replace(/\u00a0/g, " ");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceOldPrice(value, oldPrice, replacement) {
  if (typeof value !== "string" || !oldPrice) return value;
  const pattern = escapeRegExp(oldPrice).replace(/\\ /g, "\\s*");
  return value.replace(new RegExp(pattern, "gi"), replacement).replace(/\s{2,}/g, " ").trim();
}

function cleanAvailability(value, platform) {
  const raw = text(value).split("{")[0].trim();
  if (/outofstock|indispon|esgotad/i.test(raw)) return "Indisponível no momento";
  if (/instock|em estoque|somente \d+ em estoque/i.test(raw)) {
    if (/^somente \d+ em estoque\.?$/i.test(raw)) return raw;
    return "Disponível no parceiro";
  }
  return raw && raw.length <= 90 ? raw : `Confira disponibilidade na ${platform || "loja parceira"}`;
}

function affiliateFingerprint(products) {
  const rows = products.map(product => ({
    id: text(product.id),
    links: affiliateFields.map(field => [field, text(product[field])]),
    marketplaceAffiliateUrl: text(product?.marketplace?.affiliateUrl),
  }));
  return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function chooseResults(input) {
  const byId = new Map();
  for (const result of input.results || []) {
    const id = text(result.id);
    if (!id) continue;
    const current = byId.get(id);
    const rank = result.status === "confirmed" ? 3 : result.status === "no_price" ? 2 : 1;
    const currentRank = current?.status === "confirmed" ? 3 : current?.status === "no_price" ? 2 : current ? 1 : 0;
    if (!current || rank >= currentRank) byId.set(id, result);
  }
  return byId;
}

const products = readJson(productsPath);
const input = readJson(inputPath);
const resultsById = chooseResults(input);
const affiliateBefore = affiliateFingerprint(products);
const now = new Date(`${date}T12:00:00.000-03:00`);
const checkedAtFallback = now.toISOString();
const changes = [];

const updated = products.map(product => {
  const result = resultsById.get(text(product.id));
  const oldPrice = text(priceFields.map(field => product[field]).find(value => text(value)));
  const oldPriceRemoved = Boolean(oldPrice || product?.auditoriaPreco?.precoAnteriorRemovido);
  const parsedPrice = result?.schemaPrice ? priceNumber(result.schemaPrice) : priceNumber(result?.domPrice);
  const titleOk = Boolean(result && titleMatches(product.name || product.nome || product.title, result.title || result.pageTitle));
  const verified = Boolean(result?.status === "confirmed" && !result.captcha && parsedPrice && titleOk);
  const resultCheckedAt = verified ? text(result.checkedAt) || checkedAtFallback : "";
  const checkedAtDate = resultCheckedAt ? new Date(resultCheckedAt) : null;
  const resultValidUntil = checkedAtDate && !Number.isNaN(checkedAtDate.getTime())
    ? new Date(checkedAtDate.getTime() + validDays * 86_400_000).toISOString()
    : "";
  const status = verified ? "confirmado" : result ? `nao_confirmado_${result.status}` : "nao_consultado";
  const replacement = verified ? formatBrl(parsedPrice) : "Consulte o preço atual no parceiro";
  const next = { ...product };

  for (const field of priceFields) next[field] = verified ? replacement : "";
  for (const field of previousPriceFields) next[field] = null;
  for (const field of discountFields) next[field] = null;
  for (const field of explicitPriceDateFields) next[field] = resultCheckedAt;
  next.priceValidUntil = resultValidUntil;
  next.precoValidoAte = resultValidUntil;
  next.priceStatus = verified ? "current" : "unverified";
  next.statusPreco = status;
  next.disponibilidade = verified
    ? cleanAvailability(result.availability, result.platform)
    : "";

  for (const field of ratingFields) {
    if (field in next) next[field] = null;
  }
  for (const field of reviewCountFields) {
    if (field in next) next[field] = null;
  }
  for (const field of availabilityFields) {
    if (!verified && field in next) next[field] = "";
    if (verified && field !== "disponibilidade" && field in next) next[field] = null;
  }

  for (const field of visibleTextFields) {
    next[field] = cleanLegacyCommercialText(replaceOldPrice(next[field], oldPrice, replacement));
  }
  if (Array.isArray(next.beneficios)) {
    next.beneficios = next.beneficios.map(item => replaceOldPrice(item, oldPrice, replacement));
  }
  for (const field of ["badge", "selo", "etiqueta"]) {
    if (field in next) next[field] = cleanLegacyBadge(next[field]);
  }

  if (next.marketplace && typeof next.marketplace === "object") {
    next.marketplace = {
      ...next.marketplace,
      priceSeen: verified ? replacement : "",
      priceUpdatedAt: verified ? text(result.checkedAt) || checkedAtFallback : "",
    };
  }
  if (next.specs && !Array.isArray(next.specs) && typeof next.specs === "object") {
    next.specs = { ...next.specs, precoVisto: verified ? replacement : "" };
  }
  next.auditoriaPreco = {
    status,
    verificadoEm: resultCheckedAt,
    validoAte: resultValidUntil,
    fonte: verified ? text(result.finalUrl || result.url) : "",
    tituloConferido: titleOk,
    precoAnteriorRemovido: oldPriceRemoved,
    motivo: verified ? "Preço atual confirmado na página do parceiro." : "Preço antigo removido por falta de confirmação atual confiável.",
  };

  changes.push({
    id: text(product.id),
    platform: text(result?.platform),
    status,
    titleMatched: titleOk,
    oldPrice,
    oldPriceRemoved,
    newPrice: verified ? replacement : "",
    attempted: Boolean(result),
    resultStatus: text(result?.status),
    error: text(result?.error),
  });
  return next;
});

const affiliateAfter = affiliateFingerprint(updated);
if (affiliateBefore !== affiliateAfter) throw new Error("A aplicação alteraria links afiliados; operação bloqueada.");

const totals = {
  products: updated.length,
  currentPrices: changes.filter(item => item.status === "confirmado").length,
  stalePricesRemoved: changes.filter(item => item.status !== "confirmado" && item.oldPriceRemoved).length,
  alreadyWithoutPrice: changes.filter(item => item.status !== "confirmado" && !item.oldPriceRemoved).length,
  attempted: changes.filter(item => item.attempted).length,
  notConsulted: changes.filter(item => !item.attempted).length,
  titleMismatch: changes.filter(item => item.attempted && !item.titleMatched).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  applied: apply,
  source: path.relative(root, inputPath),
  policy: {
    priceValidityDays: validDays,
    stalePriceRule: "remove numeric price and discount unless current price is confirmed",
    affiliateLinksPreserved: affiliateBefore === affiliateAfter,
    permanentProductDeletion: false,
  },
  totals,
  affiliateFingerprint: affiliateBefore,
  changes,
};

if (apply) {
  writeJson(productsPath, updated);
  writeJson(packageProductsPath, updated);
}
writeJson(reportPath, report);

const markdown = [
  "# Revalidação de preços da Impacto360",
  "",
  `Data: ${date}`,
  `Aplicado: ${apply ? "sim" : "não (simulação)"}`,
  "",
  `- Produtos processados: ${totals.products}.`,
  `- Preços atuais confirmados: ${totals.currentPrices}.`,
  `- Preços antigos removidos: ${totals.stalePricesRemoved}.`,
  `- Produtos que já estavam sem preço numérico: ${totals.alreadyWithoutPrice}.`,
  `- Consultas tentadas: ${totals.attempted}.`,
  `- Itens sem consulta individual: ${totals.notConsulted}.`,
  `- Links afiliados preservados: ${affiliateBefore === affiliateAfter ? "sim" : "não"}.`,
  "",
  "Produtos sem confirmação confiável continuam ativos, mas exibem orientação para consultar preço e disponibilidade no parceiro.",
  "Nenhum produto foi apagado e nenhum link afiliado foi alterado.",
  "",
].join("\n");
fs.writeFileSync(reportPath.replace(/\.json$/i, ".md"), markdown, "utf8");

console.log(JSON.stringify({ reportPath, totals, affiliateLinksPreserved: affiliateBefore === affiliateAfter }, null, 2));
