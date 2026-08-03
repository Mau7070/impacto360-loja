import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const fileArg = valueAfter("--file");
const catalogArg = valueAfter("--catalog") || path.join(root, "dados", "catalogo-publico.json");
const apply = args.includes("--apply");

if (!fileArg) {
  throw new Error("Informe o arquivo com --file <agenda.json>.");
}

const targetFile = path.resolve(fileArg);
const catalogFile = path.resolve(catalogArg);
const document = readJson(targetFile);
const catalog = readJson(catalogFile);
const canonicalToShort = new Map(
  catalog.map(product => [
    `https://impacto360afiliado.com.br/produto/${encodeURIComponent(product.slug)}/`,
    product.shortUrl,
  ]),
);
const beforeAffiliate = affiliateFingerprint(document);
let replacements = 0;
let labels = 0;

function update(value) {
  if (Array.isArray(value)) return value.map(update);
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, inner] of Object.entries(value)) result[key] = update(inner);
    const publicLink = typeof result.storeUrl === "string" ? result.storeUrl : result.storeLink;
    if (typeof result.title === "string" && typeof publicLink === "string" && /\/p\/[a-f0-9]{10}\/$/.test(publicLink)) {
      const label = `Impacto360 — ${result.title.trim()}`;
      if (result.linkLabel !== label) {
        result.linkLabel = label;
        labels += 1;
      }
    }
    return result;
  }
  if (typeof value !== "string") return value;
  let result = value;
  for (const [canonical, short] of canonicalToShort) {
    if (!result.includes(canonical)) continue;
    result = result.split(canonical).join(short);
  }
  if (result !== value) replacements += 1;
  return result;
}

const updated = update(document);
const afterAffiliate = affiliateFingerprint(updated);
if (beforeAffiliate !== afterAffiliate) {
  throw new Error("Operacao bloqueada: um ou mais links afiliados seriam alterados.");
}

if (apply && (replacements || labels)) {
  fs.writeFileSync(targetFile, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({
  file: targetFile,
  mode: apply ? "apply" : "dry-run",
  replacements,
  labels,
  affiliateLinksPreserved: true,
}, null, 2));

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : "";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function affiliateFingerprint(value) {
  const links = [];
  collect(value, links);
  return crypto.createHash("sha256").update(JSON.stringify(links)).digest("hex");
}

function collect(value, links) {
  if (Array.isArray(value)) {
    for (const item of value) collect(item, links);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, inner] of Object.entries(value)) {
    if (/affiliate(?:Url|Link)$/i.test(key)) links.push([key, inner]);
    else collect(inner, links);
  }
}
