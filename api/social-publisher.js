const ALLOWED_ORIGIN = process.env.SOCIAL_ALLOWED_ORIGIN || process.env.FRONTEND_URL || "*";
const WEBHOOK_URL = process.env.SOCIAL_PUBLISH_WEBHOOK_URL || "";
const WEBHOOK_SECRET = process.env.SOCIAL_PUBLISH_SECRET || "";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Metodo nao permitido" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const campaign = sanitizeCampaign(body.campaign || {});
    if (!campaign.title || !campaign.link || !campaign.channel) {
      return res.status(400).json({ ok: false, error: "Campanha incompleta" });
    }

    if (!WEBHOOK_URL) {
      return res.status(200).json({
        ok: true,
        mode: "fila-segura",
        message: "SOCIAL_PUBLISH_WEBHOOK_URL nao configurado. Campanha validada, mas nao publicada."
      });
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

    return res.status(200).json({ ok: true, mode: "webhook", id: response.headers.get("x-request-id") || "", detail: text.slice(0, 400) });
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

function sanitizeCampaign(campaign) {
  return {
    id: clean(campaign.id, 120),
    channel: clean(campaign.channel, 40),
    title: clean(campaign.title, 180),
    storeName: clean(campaign.storeName, 180),
    price: clean(campaign.price, 80),
    image: clean(campaign.image, 500),
    link: clean(campaign.link, 500),
    caption: clean(campaign.caption, 1600),
    hashtags: Array.isArray(campaign.hashtags) ? campaign.hashtags.slice(0, 12).map(item => clean(item, 40)).filter(Boolean) : []
  };
}

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
