import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import apiHandler from "../api/social-publisher.js";
import {
  applySafeCancellation,
  buildCatalogIndex,
  classifyPublication,
  findProductByEvidence,
  inferMarketplace,
  isGenericMarketplaceUrl,
  isSpecificAffiliateUrl,
  productShortUrl,
  revalidateBeforePublication,
  titleSimilarity,
  validateProductForPublication,
} from "../lib/publication-safety.mjs";

test("aplicação segura cancela somente pendência inequivocamente incompleta", () => {
  const original = {
    sequence: 4,
    publicationStatus: "aguardando_revisao_visual_e_link_afiliado",
    catalogProductId: "",
    affiliateLink: "",
    storeLink: "",
    caption: "",
  };
  const result = applySafeCancellation(original, "2026-08-14T12:00:00.000Z");
  assert.equal(result.changed, true);
  assert.equal(result.item.publicationStatus, "cancelado_por_auditoria");
  assert.equal(result.action.status_anterior, original.publicationStatus);
  assert.equal(result.action.resultado, "cancelado_na_fila_local");
  assert.equal(original.publicationStatus, "aguardando_revisao_visual_e_link_afiliado");
});

test("aplicação segura preserva publicação pronta ou com qualquer evidência", () => {
  for (const item of [
    { publicationStatus: "pronto_para_preparar" },
    { publicationStatus: "aguardando_revisao_visual_e_link_afiliado", catalogProductId: "produto-1" },
    { publicationStatus: "aguardando_revisao_visual_e_link_afiliado", affiliateLink: "https://s.shopee.com.br/abc" },
    { publicationStatus: "aguardando_revisao_visual_e_link_afiliado", caption: "revisar manualmente" },
    { publicationStatus: "cancelado_por_auditoria" },
  ]) {
    assert.equal(applySafeCancellation(item).changed, false);
  }
});

function fixture(overrides = {}) {
  const product = {
    id: "produto-123",
    name: "Furadeira Bosch GSB 550 127V",
    status: "ativo",
    aprovadoParaPublicacao: true,
    geraComissao: true,
    image: "public/images/furadeira.jpg",
    affiliateLink: "https://www.amazon.com.br/dp/B07JQ9G1BD?tag=910556142-20",
    source: "Amazon Afiliados",
    ofertas: [{ status: "ativo", plataforma: "Amazon", linkCompra: "https://www.amazon.com.br/dp/B07JQ9G1BD?tag=910556142-20" }],
    ...overrides,
  };
  const campaign = {
    id: "campanha-1",
    productId: product.id,
    channel: "facebook",
    title: product.name,
    image: product.image,
    link: productShortUrl(product),
    caption: `${product.name} ${productShortUrl(product)}`,
  };
  return { product, campaign };
}

test("produto correto fica pronto", () => {
  const { product, campaign } = fixture();
  assert.equal(validateProductForPublication(product, campaign).readyToPublish, true);
});

test("produto inexistente e bloqueado", () => {
  const { campaign } = fixture();
  assert.equal(validateProductForPublication(null, campaign).productExists, false);
});

test("produto removido cancela agendamento", () => {
  const { product, campaign } = fixture({ status: "removido", geraComissao: false, ofertas: [] });
  const validation = validateProductForPublication(product, campaign);
  assert.equal(validation.marketplaceActive, false);
  assert.equal(classifyPublication({ status: "agendado", scheduledAt: "2026-08-20" }, validation), "CANCELAR_AGENDAMENTO");
});

test("link quebrado e bloqueado", () => {
  const { product, campaign } = fixture({ affiliateLink: "https://s.shopee.com.br/" });
  assert.equal(validateProductForPublication(product, campaign).affiliateLinkValid, false);
});

test("link generico e proibido", () => {
  assert.equal(isGenericMarketplaceUrl("https://www.amazon.com.br/"), true);
  assert.equal(isSpecificAffiliateUrl("https://www.amazon.com.br/"), false);
});

test("link de produto diferente falha pela identidade da campanha", () => {
  const { product, campaign } = fixture();
  campaign.productId = "outro-produto";
  assert.equal(validateProductForPublication(product, campaign).productIdMatches, false);
});

test("produto duplicado e bloqueado", () => {
  const { product, campaign } = fixture();
  const index = buildCatalogIndex([product, { ...product }]);
  assert.equal(index.duplicateIds.has(product.id), true);
  assert.equal(validateProductForPublication(product, campaign, { duplicateProductId: true }).readyToPublish, false);
});

test("produto Mercado Livre e reconhecido", () => {
  assert.equal(inferMarketplace("https://meli.la/AbC123"), "mercado-livre");
  assert.equal(isSpecificAffiliateUrl("https://meli.la/AbC123", "mercado-livre"), true);
});

test("produto Shopee e reconhecido", () => {
  assert.equal(inferMarketplace("https://s.shopee.com.br/8KoKG1kjvv"), "shopee");
  assert.equal(isSpecificAffiliateUrl("https://s.shopee.com.br/8KoKG1kjvv", "shopee"), true);
});

test("produto Amazon exige tag de afiliado", () => {
  assert.equal(isSpecificAffiliateUrl("https://www.amazon.com.br/dp/B07JQ9G1BD?tag=910556142-20", "amazon"), true);
  assert.equal(isSpecificAffiliateUrl("https://www.amazon.com.br/dp/B07JQ9G1BD", "amazon"), false);
});

test("link curto deve corresponder ao ID", () => {
  const { product, campaign } = fixture();
  campaign.link = "https://impacto360afiliado.com.br/p/0000000000/";
  assert.equal(validateProductForPublication(product, campaign).shortLinkValid, false);
});

test("redirecionamento e destino live aprovados", async () => {
  const { product, campaign } = fixture();
  const fetchImpl = async url => ({
    status: 200,
    url,
    text: async () => url.includes("impacto360afiliado") ? `${product.name} ${product.affiliateLink}` : product.name,
  });
  const validation = await revalidateBeforePublication(product, campaign, { fetchImpl });
  assert.equal(validation.shortLinkLive, true);
  assert.equal(validation.marketplaceLive, true);
  assert.equal(validation.readyToPublish, true);
});

test("publicacao realizada com produto removido recomenda exclusao", () => {
  const { product, campaign } = fixture({ status: "indisponivel", geraComissao: false, ofertas: [] });
  const validation = validateProductForPublication(product, campaign);
  assert.equal(classifyPublication({ status: "publicado" }, validation), "EXCLUIR_PUBLICACAO");
});

test("link incorreto recomenda correcao", () => {
  const { product, campaign } = fixture();
  campaign.link = "https://impacto360afiliado.com.br/p/aaaaaaaaaa/";
  const validation = validateProductForPublication(product, campaign);
  assert.equal(classifyPublication({ status: "agendado" }, validation), "CORRIGIR_LINK");
});

test("falha de API live bloqueia a publicacao", async () => {
  const { product, campaign } = fixture();
  const fetchImpl = async url => ({ status: 503, url, text: async () => "indisponivel" });
  const validation = await revalidateBeforePublication(product, campaign, { fetchImpl });
  assert.equal(validation.readyToPublish, false);
  assert.ok(validation.failures.includes("shortLinkLive"));
});

test("titulo apenas semelhante nao vira correspondencia exata", () => {
  assert.ok(titleSimilarity("Mini processador Mondial 250 ml", "Liquidificador Mondial 500 W") < 0.75);
});

test("busca por evidencia usa ID antes de similaridade", () => {
  const { product, campaign } = fixture();
  const result = findProductByEvidence(campaign, [product]);
  assert.equal(result.method, "id");
  assert.equal(result.product.id, product.id);
});

test("imagem divergente bloqueia edicao silenciosa", () => {
  const { product, campaign } = fixture();
  campaign.image = "public/images/outro-produto.jpg";
  assert.equal(validateProductForPublication(product, campaign).imageMatch, false);
});

test("canal nao integrado e bloqueado", () => {
  const { product, campaign } = fixture();
  campaign.channel = "rede-inventada";
  assert.equal(validateProductForPublication(product, campaign).channelSupported, false);
});

test("preco divergente e bloqueado quando a publicacao informa preco", () => {
  const { product, campaign } = fixture({ price: "R$ 309,88" });
  campaign.price = "R$ 199,90";
  assert.equal(validateProductForPublication(product, campaign).priceMatch, false);
});

test("legenda nao pode expor link afiliado bruto", () => {
  const { product, campaign } = fixture();
  campaign.caption = `${product.name} ${product.affiliateLink}`;
  assert.equal(validateProductForPublication(product, campaign).descriptionMatch, false);
});

test("API aceita somente campanha completa e validada", async () => {
  const catalog = JSON.parse(fs.readFileSync(new URL("../dados/products.json", import.meta.url), "utf8"));
  const product = catalog.find(item => item.id === "shopee-video-0002-aparador-unhas-eletrico-56264093125");
  const campaign = {
    id: "api-test",
    productId: product.id,
    channel: "facebook",
    title: product.name,
    image: product.image,
    link: productShortUrl(product),
    caption: `${product.name} ${productShortUrl(product)}`,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => ({
    status: 200,
    url,
    headers: new Map(),
    text: async () => url.includes("impacto360afiliado") ? `${product.name} ${product.affiliateLink}` : product.name,
  });
  try {
    const accepted = responseMock();
    await apiHandler({ method: "POST", body: { campaign }, headers: {} }, accepted);
    assert.equal(accepted.statusCode, 200);
    assert.equal(accepted.body.mode, "fila-segura");
    assert.equal(accepted.body.validation.readyToPublish, true);

    const blocked = responseMock();
    await apiHandler({ method: "POST", body: { campaign: { ...campaign, link: "https://www.amazon.com.br/" } }, headers: {} }, blocked);
    assert.equal(blocked.statusCode, 422);
    assert.equal(blocked.body.ok, false);

    const incomplete = responseMock();
    await apiHandler({ method: "POST", body: { campaign: {} }, headers: {} }, incomplete);
    assert.equal(incomplete.statusCode, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("painel interno contem auditoria e trava da fila legada", () => {
  const source = fs.readFileSync(new URL("../integracoes/impacto360-social-recompensas.js", import.meta.url), "utf8");
  assert.match(source, /AUDITORIA DE PUBLICACOES/);
  assert.match(source, /migrateUnsafeQueue/);
  assert.match(source, /data-ai360-audit-action/);
  assert.match(source, /productId:/);
  assert.match(source, /productPublicLink/);
});

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}
