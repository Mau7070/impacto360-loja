const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "*";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "OPENAI_API_KEY nao configurada no ambiente seguro.",
      localMode: true
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const pergunta = sanitizeText(body.pergunta, 1200);
    const cliente = sanitizeClient(body.cliente || {});
    const produtos = Array.isArray(body.produtos) ? body.produtos.slice(0, 20).map(sanitizeProduct) : [];

    if (!pergunta) return res.status(400).json({ error: "Informe a pergunta do atendimento." });

    const input = [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "Voce e o ChatGPT CEO do Shopping Impacto360. Recomende produtos com honestidade, respeite LGPD, nao use dados sensiveis, nao prometa resultados falsos e nunca exponha telefone, email ou WhatsApp do cliente."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({ pergunta, cliente, produtos })
          }
        ]
      }
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: DEFAULT_MODEL, input })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: "Falha na API do ChatGPT CEO", detail: maskError(data) });
    }

    return res.status(200).json({ resposta: extractText(data), model: DEFAULT_MODEL });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no ChatGPT CEO", detail: error.message });
  }
}

function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sanitizeClient(cliente) {
  return {
    clienteId: sanitizeText(cliente.clienteId, 80),
    cidade: sanitizeText(cliente.cidade, 80),
    estado: sanitizeText(cliente.estado, 40),
    origemContato: sanitizeText(cliente.origemContato, 120),
    produtosVisualizados: sanitizeArray(cliente.produtosVisualizados),
    produtosPesquisados: sanitizeArray(cliente.produtosPesquisados),
    categoriasInteresse: sanitizeArray(cliente.categoriasInteresse),
    perguntasFeitas: sanitizeArray(cliente.perguntasFeitas),
    intencaoCompra: sanitizeText(cliente.intencaoCompra, 500),
    nivelInteresse: sanitizeText(cliente.nivelInteresse, 40),
    statusCliente: sanitizeText(cliente.statusCliente, 80)
  };
}

function sanitizeProduct(produto) {
  return {
    id: sanitizeText(produto.id, 80),
    nome: sanitizeText(produto.nome || produto.name, 180),
    categoria: sanitizeText(produto.categoria || produto.category, 120),
    descricao: sanitizeText(produto.descricao || produto.description, 300),
    preco: sanitizeText(produto.preco || produto.price, 80)
  };
}

function sanitizeArray(value) {
  return Array.isArray(value) ? value.slice(-20).map(item => sanitizeText(item, 180)).filter(Boolean) : [];
}

function sanitizeText(value, max) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function extractText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim() || "Nao foi possivel gerar resposta agora.";
}

function maskError(data) {
  const text = JSON.stringify(data || {});
  return text.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 800);
}
