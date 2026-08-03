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
const apply = process.argv.includes("--apply");
const option = (name, fallback = "") => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const reportPath = path.resolve(option("--report", path.join(root, "backups", "relatorio-limpeza-comercial.json")));
const productsPath = path.join(root, "dados", "products.json");
const packageProductsPath = path.join(root, "pacote-github-pages-pronto", "dados", "products.json");
const affiliateFields = [
  "affiliateLink", "linkAfiliado", "linkComissionado", "linkCompra",
  "linkPlataforma", "urlProduto", "linkOriginal", "link_original_afiliado",
];
const descriptionFields = [
  "description", "descricaoCurta", "fullDescription", "descricaoDetalhada",
  "descricaoCompleta", "textoCatalogo", "textoWhatsApp", "legendaWhatsApp",
  "legendaInstagram", "legendaFacebook", "observacoes", "detalhes", "resumo",
];

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const fingerprint = products => crypto.createHash("sha256").update(JSON.stringify(products.map(product => ({
  id: String(product.id ?? ""),
  links: affiliateFields.map(field => [field, String(product[field] ?? "")]),
  marketplaceAffiliateUrl: String(product?.marketplace?.affiliateUrl ?? ""),
})))).digest("hex");

const products = readJson(productsPath);
const affiliateBefore = fingerprint(products);
const counters = {
  products: products.length,
  ratingsRemoved: 0,
  reviewCountsRemoved: 0,
  staleAvailabilityRemoved: 0,
  badgesCleaned: 0,
  descriptionsCleaned: 0,
};

const updated = products.map(product => {
  const next = { ...product };
  const current = next.priceStatus === "current";

  for (const field of ratingFields) {
    if (next[field] !== undefined && next[field] !== null && String(next[field]).trim()) counters.ratingsRemoved += 1;
    if (field in next) next[field] = null;
  }
  for (const field of reviewCountFields) {
    if (next[field] !== undefined && next[field] !== null && String(next[field]).trim()) counters.reviewCountsRemoved += 1;
    if (field in next) next[field] = null;
  }
  for (const field of availabilityFields) {
    if (!current && next[field] !== undefined && next[field] !== null && String(next[field]).trim()) counters.staleAvailabilityRemoved += 1;
    if (!current && field in next) next[field] = "";
    if (current && field !== "disponibilidade" && field in next) next[field] = null;
  }
  for (const field of ["badge", "selo", "etiqueta"]) {
    const cleaned = cleanLegacyBadge(next[field]);
    if (String(next[field] ?? "").trim() !== cleaned) counters.badgesCleaned += 1;
    if (field in next) next[field] = cleaned;
  }
  for (const field of descriptionFields) {
    if (typeof next[field] !== "string") continue;
    const cleaned = cleanLegacyCommercialText(next[field]);
    if (next[field] !== cleaned) counters.descriptionsCleaned += 1;
    next[field] = cleaned;
  }
  return next;
});

const affiliateAfter = fingerprint(updated);
if (affiliateBefore !== affiliateAfter) throw new Error("A limpeza alteraria links afiliados; operação bloqueada.");

const report = {
  generatedAt: new Date().toISOString(),
  applied: apply,
  affiliateLinksPreserved: true,
  ...counters,
};
writeJson(reportPath, report);
if (apply) {
  writeJson(productsPath, updated);
  writeJson(packageProductsPath, updated);
}
console.log(JSON.stringify(report, null, 2));
