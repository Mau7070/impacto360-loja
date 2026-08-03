import crypto from "node:crypto";

const defaultSiteUrl = "https://impacto360afiliado.com.br";

function productId(productOrId) {
  const value = typeof productOrId === "object" && productOrId !== null
    ? productOrId.id
    : productOrId;
  const id = String(value ?? "").trim();
  if (!id) throw new Error("Produto sem ID: nao e possivel gerar link curto estavel.");
  return id;
}

export function productShortCode(productOrId) {
  return crypto.createHash("sha256").update(productId(productOrId)).digest("hex").slice(0, 10);
}

export function productShortPath(productOrId) {
  return `/p/${productShortCode(productOrId)}/`;
}

export function productShortUrl(productOrId, siteUrl = defaultSiteUrl) {
  return `${String(siteUrl).replace(/\/$/, "")}${productShortPath(productOrId)}`;
}

export function productLinkLabel(product) {
  const name = String(product?.name ?? product?.nome ?? product?.title ?? "Produto").trim();
  return `Impacto360 — ${name || "Produto"}`;
}

export function assertUniqueProductShortCodes(products) {
  const seen = new Map();
  for (const product of products) {
    const code = productShortCode(product);
    const prior = seen.get(code);
    if (prior && prior !== String(product.id)) {
      throw new Error(`Colisao de link curto ${code} entre os produtos ${prior} e ${product.id}.`);
    }
    seen.set(code, String(product.id));
  }
  return seen;
}
