import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const products = JSON.parse(fs.readFileSync(path.join(root, "dados", "products.json"), "utf8"));
const output = path.join(root, "dados", "revalidacao-precos-20260824.json");
const candidates = products.filter(product => /^R\$\s*[\d.]+,\d{2}$/.test(String(product.price || "")));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const clean = value => String(value || "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const urlOf = product => product.linkPrincipalFonte || product.sourceProductLink || product.linkProdutoApenasLeitura || product.affiliateLink;
const brlNumber = value => Number(String(value || "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));

function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item["@graph"])) queue.push(...item["@graph"]);
        const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        if (offers?.price || offers?.lowPrice) {
          return {
            title: clean(item.name),
            price: String(offers.price || offers.lowPrice),
            availability: clean(offers.availability),
          };
        }
      }
    } catch {}
  }
  return null;
}

function fallback(html) {
  const title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const price = html.match(/(?:priceAmount|price|preco)["']?\s*[:=]\s*["'](?:R\$\s*)?([\d.]+[,.]\d{2})/i)?.[1]
    || html.match(/R\$\s*([\d.]+,\d{2})/i)?.[1];
  return { title, price: price || "", availability: "" };
}

const results = [];
for (let index = 0; index < candidates.length; index += 1) {
  const product = candidates[index];
  const url = urlOf(product);
  const base = { id: product.id, platform: product.plataformaOrigem || product.source || "", url, checkedAt: new Date().toISOString() };
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "accept-language": "pt-BR,pt;q=0.9",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      },
      signal: AbortSignal.timeout(30_000),
    });
    const html = await response.text();
    const captcha = /captcha|digite os caracteres|robot check|verifique que voc[eê] [eé] humano/i.test(html);
    const parsed = parseJsonLd(html) || fallback(html);
    const oldPrice = brlNumber(product.price);
    const observedPrice = brlNumber(parsed.price);
    const plausible = Number.isFinite(observedPrice) && observedPrice > 0
      && (!Number.isFinite(oldPrice) || oldPrice <= 0 || (observedPrice / oldPrice >= 0.35 && observedPrice / oldPrice <= 3));
    results.push({
      ...base,
      httpStatus: response.status,
      finalUrl: response.url,
      status: response.ok && parsed.price && !captcha && plausible ? "confirmed" : parsed.price ? "review_price" : "no_price",
      captcha,
      title: parsed.title,
      schemaPrice: parsed.price,
      previousCatalogPrice: product.price,
      pricePlausible: plausible,
      availability: parsed.availability,
    });
  } catch (error) {
    results.push({ ...base, status: "error", captcha: false, error: error.message });
  }
  process.stdout.write(`[${index + 1}/${candidates.length}] ${product.id}\n`);
  await sleep(350);
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: "marketplace-product-pages",
  candidateCount: candidates.length,
  results,
};
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Relatorio salvo em ${output}`);
