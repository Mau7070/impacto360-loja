import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {
  buildCatalogIndex,
  findProductByEvidence,
  revalidateBeforePublication,
  sanitizeCampaign,
} from "../lib/publication-safety.mjs";

const root = process.cwd();
loadEnv(path.join(root, ".env"));

const port = Number(process.env.SOCIAL_ROBOT_PORT || 3000);
const host = process.env.SOCIAL_ROBOT_HOST || "127.0.0.1";
const allowedOrigin = process.env.SOCIAL_ALLOWED_ORIGIN || "*";
const webhookUrl = process.env.SOCIAL_PUBLISH_WEBHOOK_URL || "";
const webhookSecret = process.env.SOCIAL_PUBLISH_SECRET || "";
const apiToken = process.env.SOCIAL_API_TOKEN || "";
const logFile = path.resolve(process.env.SOCIAL_PUBLISH_LOG_FILE || path.join(root, "dados", "social-publish-log.jsonl"));
const catalogFile = path.join(root, "dados", "products.json");

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true, service: "impacto360-robo-social", webhook: Boolean(webhookUrl) });
  }
  if (req.method === "POST" && req.url === "/api/social/publish") {
    return handlePublish(req, res);
  }
  return sendJson(res, 404, { ok: false, error: "Rota nao encontrada" });
});

server.listen(port, host, () => {
  console.log(`Robo Social 360 ativo em http://${host}:${port}`);
  console.log(`Endpoint: http://${host}:${port}/api/social/publish`);
  console.log(webhookUrl ? "Webhook social configurado." : "Modo fila segura: configure SOCIAL_PUBLISH_WEBHOOK_URL para publicar fora do navegador.");
});

async function handlePublish(req, res) {
  try {
    const body = await readJson(req);
    if (apiToken && !authorized(req, apiToken)) {
      return sendJson(res, 401, { ok: false, error: "Nao autorizado" });
    }
    const campaign = sanitizeCampaign(body.campaign || {});
    if (!campaign.productId || !campaign.title || !campaign.link || !campaign.channel || !campaign.image) {
      return sendJson(res, 400, { ok: false, error: "Campanha incompleta" });
    }

    const catalogIndex = buildCatalogIndex(readCatalog());
    const match = findProductByEvidence(campaign, catalogIndex);
    const validation = await revalidateBeforePublication(match.product, campaign, {
      catalogRegistered: match.method === "id",
      duplicateProductId: catalogIndex.duplicateIds.has(campaign.productId),
      fetchImpl: fetch,
    });
    if (!validation.readyToPublish) {
      appendLog({
        receivedAt: new Date().toISOString(),
        source: clean(body.source, 80) || "impacto360",
        campaign,
        delivery: { mode: "bloqueado", validation: publicValidation(validation) },
      });
      return sendJson(res, 422, {
        ok: false,
        error: "BLOQUEAR PUBLICACAO: produto ou destino nao passou na validacao obrigatoria",
        validation: publicValidation(validation),
      });
    }

    const record = {
      receivedAt: new Date().toISOString(),
      source: clean(body.source, 80) || "impacto360",
      campaign,
      delivery: { mode: webhookUrl ? "webhook" : "fila-segura", validation: publicValidation(validation) }
    };

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: buildWebhookHeaders(),
        body: JSON.stringify(record)
      });
      const text = await response.text();
      record.delivery.status = response.status;
      record.delivery.response = text.slice(0, 500);
      if (!response.ok) {
        appendLog(record);
        return sendJson(res, 502, { ok: false, error: "Webhook social recusou a campanha", status: response.status });
      }
    }

    appendLog(record);
    return sendJson(res, 200, {
      ok: true,
      mode: record.delivery.mode,
      id: `${Date.now()}-${campaign.channel}`,
      message: webhookUrl ? "Campanha enviada ao webhook social." : "Campanha salva no log local em modo fila segura.",
      validation: publicValidation(validation),
    });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: "Erro interno no robo social", detail: error.message });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error("Payload muito grande"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(new Error("JSON invalido"));
      }
    });
    req.on("error", reject);
  });
}

function appendLog(record) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, JSON.stringify(record) + "\n", "utf8");
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(status === 204 ? "" : JSON.stringify(data));
}

function buildWebhookHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (webhookSecret) headers.Authorization = `Bearer ${webhookSecret}`;
  return headers;
}

function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogFile, "utf8").replace(/^\uFEFF/, ""));
}

function authorized(req, token) {
  const header = String(req.headers.authorization || "");
  return header.startsWith("Bearer ") && header.slice(7) === token;
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

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}
