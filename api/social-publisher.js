import fs from "node:fs";
import {
  buildCatalogIndex,
  findProductByEvidence,
  revalidateBeforePublication,
  sanitizeCampaign,
} from "../lib/publication-safety.mjs";

const ALLOWED_ORIGIN = process.env.SOCIAL_ALLOWED_ORIGIN || process.env.FRONTEND_URL || "*";
const WEBHOOK_URL = process.env.SOCIAL_PUBLISH_WEBHOOK_URL || "";
const WEBHOOK_SECRET = process.env.SOCIAL_PUBLISH_SECRET || "";
const API_TOKEN = process.env.SOCIAL_API_TOKEN || "";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo nao permitido" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const campaign = sanitizeCampaign(body.campaign || {});
    if (!campaign.productId || !campaign.title || !campaign.link || !campaign.channel || !campaign.image) {
      return res.status(400).json({ ok: false, error: "Campanha incompleta" });
    }

    const catalogIndex = buildCatalogIndex(loadCatalog());
    const match = findProductByEvidence(campaign, catalogIndex);
    const validation = await revalidateBeforePublication(match.product, campaign, {
      catalogRegistered: match.method === "id",
      duplicateProductId: catalogIndex.duplicateIds.has(campaign.productId),
      fetchImpl: fetch,
    });
    if (!validation.readyToPublish) {
      return res.status(422).json({
        ok: false,
        error: "BLOQUEAR PUBLICACAO: produto ou destino nao passou na validacao obrigatoria",
        validation: publicValidation(validation),
      });
    }

    if (!WEBHOOK_URL) {
      return res.status(200).json({
        ok: true,
        mode: "fila-segura",
        message: "SOCIAL_PUBLISH_WEBHOOK_URL nao configurado. Campanha validada, mas nao publicada.",
        validation: publicValidation(validation),
      });
    }
    if (!API_TOKEN) {
      return res.status(503).json({ ok: false, error: "INTEGRACAO NAO DISPONIVEL: SOCIAL_API_TOKEN nao configurado" });
    }
    if (!authorized(req, API_TOKEN)) {
      return res.status(401).json({ ok: false, error: "Nao autorizado" });
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: buildWebhookHeaders(),
      body: JSON.stringify({ source: "impacto360", campaign })
    });
    const text = await response.text();
    if (!response.ok) {
      return res.status(502).json({ ok: false, error: "Falha no webhook social", status: response.status, detail: text.slice(0, 400) });
    }

    return res.status(200).json({ ok: true, mode: "webhook", id: response.headers.get("x-request-id") || "", detail: text.slice(0, 400), validation: publicValidation(validation) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Erro interno no robo social", detail: error.message });
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function buildWebhookHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (WEBHOOK_SECRET) headers.Authorization = `Bearer ${WEBHOOK_SECRET}`;
  return headers;
}

function loadCatalog() {
  return JSON.parse(fs.readFileSync(new URL("../dados/products.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""));
}

function authorized(req, token) {
  const header = String(req.headers?.authorization || "");
  return header.startsWith("Bearer ") && header.slice(7) === token;
}

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function publicValidation(validation) {
  return {
    productExists: validation.productExists,
    catalogRegistered: validation.catalogRegistered,
    marketplaceActive: validation.marketplaceActive,
    affiliateLinkValid: validation.affiliateLinkValid,
    shortLinkValid: validation.shortLinkValid,
    shortLinkLive: validation.shortLinkLive,
    marketplaceLive: validation.marketplaceLive,
    imageMatch: validation.imageMatch,
    titleMatch: validation.titleMatch,
    descriptionMatch: validation.descriptionMatch,
    priceMatch: validation.priceMatch,
    readyToPublish: validation.readyToPublish,
    failures: validation.failures,
  };
}
