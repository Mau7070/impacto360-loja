import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const clean = value => String(value ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const normalized = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const sourceOf = product => product.linkPrincipalFonte || product.sourceProductLink || product.linkProdutoApenasLeitura || product.affiliateLink || '';
const titleOf = product => product.name || product.nome || product.title || '';

export function titleEvidence(expected, observed) {
  const left = normalized(expected), right = normalized(observed);
  if (!left || !right) return { matched: false, reason: 'missing_title' };
  const stop = new Set(['a', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'o', 'os', 'para', 'por']);
  const tokens = value => [...new Set(value.split(' ').filter(x => x.length > 1 && !stop.has(x)))];
  const a = tokens(left), b = tokens(right);
  const shared = a.filter(x => b.includes(x));
  const expectedNumbers = a.filter(x => /\d/.test(x));
  const missingNumbers = expectedNumbers.filter(x => !b.includes(x));
  const coverage = a.length ? shared.length / a.length : 0;
  // A matching URL alone is insufficient: require title and all named model/variant numbers.
  const matched = !missingNumbers.length && (left === right || right.includes(left) || (shared.length >= 4 && coverage >= .85));
  return { matched, coverage, missingNumbers, reason: matched ? 'title_and_variant_tokens_match' : 'title_or_variant_requires_review' };
}

export function productIds(raw) {
  let url;
  try { url = new URL(raw); } catch { return []; }
  const result = [];
  if (/(^|\.)amazon\.com\.br$/.test(url.hostname)) {
    const id = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i)?.[1];
    if (id) result.push(`amazon:${id.toUpperCase()}`);
  }
  if (/(^|\.)shopee\.com\.br$/.test(url.hostname)) {
    const ids = url.pathname.match(/\/product\/(\+)$/); // Deliberately do not infer from free text.
    const match = url.pathname.match(/\/product\/(\d+)\/(\d+)/) || url.pathname.match(/-i\.(\d+)\.(\d+)/);
    if (match) result.push(`shopee:${match[1]}:${match[2]}`);
  }
  if (/(^|\.)mercadolivre\.com\.br$/.test(url.hostname)) {
    const rawIds = `${decodeURIComponent(url.pathname)} ${decodeURIComponent(url.search)} ${decodeURIComponent(url.hash)}`.match(/MLB-?\d+|MLBU\d+/gi) || [];
    result.push(...rawIds.map(id => `meli:${id.replace('-', '').toUpperCase()}`));
  }
  if (/(^|\.)hotmart\.com$/.test(url.hostname)) {
    const id = url.pathname.match(/\/([A-Z]\d+[A-Z])(?:\/|$)/i)?.[1];
    if (id) result.push(`hotmart:${id.toUpperCase()}`);
  }
  return [...new Set(result)];
}

function readLd(html) {
  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = [];
  for (const [index, match] of blocks.entries()) {
    try {
      const visit = node => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(visit);
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (types.includes('Product')) nodes.push({ block: index, value: node });
        if (node['@graph']) visit(node['@graph']);
        if (node.mainEntity) visit(node.mainEntity);
      };
      visit(JSON.parse(match[1]));
    } catch { /* Invalid metadata is evidence of neither identity nor price. */ }
  }
  return { productNodes: nodes, blockCount: blocks.length };
}

export function parsePage(product, html, finalUrl, status) {
  const pageTitle = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const captcha = /robot check|captcha|just a moment|access denied/i.test(pageTitle)
    || /<form[^>]+action=["'][^"']*(?:validateCaptcha|captcha)/i.test(html)
    || /digite os caracteres que voc[eê] v[eê]|enter the characters you see below|sorry, we just need to make sure you're not a robot/i.test(html);
  const blocker = status === 403 ? 'http_403' : status === 429 ? 'http_429' : captcha ? 'captcha' : '';
  if (blocker) return { status: 'blocked', blocker, captcha, pageTitle, reason: 'Acesso público bloqueado; nenhuma tentativa de contornar o bloqueio.' };
  if (status < 200 || status >= 300) return { status: 'http_error', captcha, pageTitle, reason: `Resposta HTTP ${status}.` };
  const originalIds = productIds(sourceOf(product));
  const finalIds = productIds(finalUrl);
  const commonIds = originalIds.filter(id => finalIds.includes(id));
  const identityMatched = commonIds.length > 0;
  const ld = readLd(html);
  const candidates = ld.productNodes.map(node => ({ ...node, titleCheck: titleEvidence(titleOf(product), node.value.name) }));
  const matched = candidates.filter(node => node.titleCheck.matched);
  const base = { captcha, pageTitle, expectedTitle: titleOf(product), identity: { originalIds, finalIds, commonIds, matched: identityMatched }, jsonLdBlockCount: ld.blockCount, productNodeCount: ld.productNodes.length };
  if (!matched.length) return { ...base, status: ld.productNodes.length ? 'review_identity' : 'no_price', reason: ld.productNodes.length ? 'Título ou variante não corresponde com segurança.' : 'Sem metadados de produto e oferta verificáveis.', observedProducts: candidates.map(x => ({ name: clean(x.value.name), titleCheck: x.titleCheck, offers: x.value.offers })) };
  if (matched.length !== 1) return { ...base, status: 'review_identity', reason: 'Múltiplos produtos correspondentes na página.' };
  const selected = matched[0];
  const title = clean(selected.value.name);
  const offers = Array.isArray(selected.value.offers) ? selected.value.offers : selected.value.offers ? [selected.value.offers] : [];
  const evidence = { ...base, title, titleCheck: selected.titleCheck, evidence: { extraction: 'Product JSON-LD', block: selected.block, name: selected.value.name, sku: selected.value.sku, productID: selected.value.productID, url: selected.value.url, offers: selected.value.offers } };
  if (!identityMatched) return { ...evidence, status: 'review_identity', reason: 'URL de origem sem identificador inequívoco ou redirecionamento para outro produto.' };
  if (offers.length !== 1) return { ...evidence, status: 'review_price', reason: 'Oferta ausente ou múltiplas ofertas; preço único não confirmado.' };
  const offer = offers[0];
  const types = Array.isArray(offer['@type']) ? offer['@type'] : [offer['@type']];
  if (types.includes('AggregateOffer') || offer.lowPrice != null || offer.highPrice != null) return { ...evidence, status: 'review_price', reason: 'Faixa de preços ou oferta agregada; não equivale ao preço de uma variante exata.' };
  const price = typeof offer.price === 'number' ? offer.price : /^\d+(?:\.\d{1,2})?$/.test(String(offer.price)) ? Number(offer.price) : NaN;
  if (offer.priceCurrency !== 'BRL' || !Number.isFinite(price) || price <= 0) return { ...evidence, status: 'review_price', reason: 'Preço numérico positivo em BRL ausente ou ambíguo.' };
  const offerUrlIds = offer.url ? productIds(offer.url) : [];
  if (offerUrlIds.length && !offerUrlIds.some(id => commonIds.includes(id))) return { ...evidence, status: 'review_identity', reason: 'Oferta vinculada a outro identificador de produto.' };
  return { ...evidence, status: 'confirmed', schemaPrice: String(price), currency: 'BRL', availability: clean(offer.availability), reason: 'Identificador na URL, título, variante e oferta única em BRL conferidos na página pública.' };
}

async function main() {
  const args = process.argv.slice(2);
  const option = (key, fallback) => { const n = args.indexOf(key); return n < 0 ? fallback : args[n + 1]; };
  const root = process.cwd();
  const runDate = option('--date', new Date().toISOString().slice(0, 10)).replaceAll('-', '');
  const perHostLimit = Number(option('--limit-per-host', '0'));
  const output = path.resolve(option('--output', path.join(root, 'dados', `revalidacao-precos-${runDate}.json`)));
  const evidenceRoot = path.resolve(option('--evidence-dir', path.join(root, 'dados', `auditoria-precos-${runDate}`, 'evidencias')));
  const productsText = fs.readFileSync(path.join(root, 'dados', 'products.json'), 'utf8');
  const publicText = fs.readFileSync(path.join(root, 'dados', 'catalogo-publico.json'), 'utf8');
  const allProducts = JSON.parse(productsText);
  const publicProducts = JSON.parse(publicText);
  const publicIds = new Set(publicProducts.map(product => String(product.id)));
  const products = allProducts.filter(product => publicIds.has(String(product.id)));
  if (products.length !== publicProducts.length || publicIds.size !== publicProducts.length) throw new Error('Mapeamento de IDs do catálogo público incompleto ou duplicado.');
  fs.mkdirSync(evidenceRoot, { recursive: true });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const groups = new Map();
  for (const product of products) {
    let host = 'invalid';
    try { const url = new URL(sourceOf(product)); if (url.protocol !== 'https:') throw new Error('https required'); host = url.hostname; } catch {}
    if (!groups.has(host)) groups.set(host, []);
    groups.get(host).push(product);
  }
  const startedAt = new Date().toISOString();
  const results = [], domainPolicies = [];
  const writeReport = () => {
    const totals = { publicProducts: products.length, results: results.length, attempted: results.filter(x => x.attempted).length, confirmed: results.filter(x => x.status === 'confirmed').length, pendingNotConsulted: results.filter(x => !x.attempted).length, byStatus: {} };
    for (const row of results) totals.byStatus[row.status] = (totals.byStatus[row.status] || 0) + 1;
    const payload = { generatedAt: new Date().toISOString(), startedAt, source: 'marketplace-product-pages', candidateCount: products.length, sourceFiles: { productsSha256: sha256(productsText), publicCatalogSha256: sha256(publicText) }, policy: { scope: 'Every public catalog product, including products without an old price', confirmation: 'Exact URL identity, title and variant, singleton Product JSON-LD offer in BRL; never aggregate lowPrice or arbitrary regex prices', domainStop: 'After 3 consecutive denied/captcha responses on distinct URLs of the same host', captchaBypass: false, catalogModified: false }, totals, domainPolicies, results };
    fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
    return payload;
  };
  const queue = [...groups.entries()];
  async function worker() {
    while (queue.length) {
      const [host, rows] = queue.shift();
      let blockStreak = [], stop = null, attempts = 0;
      const seen = new Map();
      for (const product of rows) {
        const url = sourceOf(product);
        const base = { id: String(product.id), platform: product.plataformaOrigem || product.source || '', host, url, previousCatalogPrice: product.price || '' };
        if (host === 'invalid') {
          results.push({ ...base, attempted: false, checkedAt: '', status: 'pending_invalid_source', reason: 'URL de fonte HTTPS ausente ou inválida.' });
          continue;
        }
        if (stop) {
          results.push({ ...base, attempted: false, checkedAt: '', status: 'pending_domain_blocked', pendingRecordedAt: new Date().toISOString(), domainBlockEvidenceIds: stop.evidenceIds, reason: 'Produto não consultado individualmente: coleta do domínio encerrada após três bloqueios consecutivos em URLs distintas.' });
          continue;
        }
        if (perHostLimit && attempts >= perHostLimit) {
          results.push({ ...base, attempted: false, checkedAt: '', status: 'pending_probe_limit', reason: 'Não consultado: execução de teste limitada por domínio.' });
          continue;
        }
        if (seen.has(url)) {
          const earlier = seen.get(url);
          const html = zlib.gunzipSync(fs.readFileSync(path.join(root, earlier.evidenceFile))).toString('utf8');
          results.push({ ...base, attempted: false, checkedAt: earlier.checkedAt, reusedSourceEvidenceFromId: earlier.id, httpStatus: earlier.httpStatus, finalUrl: earlier.finalUrl, evidenceFile: earlier.evidenceFile, responseSha256: earlier.responseSha256, ...parsePage(product, html, earlier.finalUrl, earlier.httpStatus) });
          continue;
        }
        const checkedAt = new Date().toISOString();
        attempts++;
        try {
          const response = await fetch(url, { redirect: 'follow', headers: { 'accept-language': 'pt-BR,pt;q=0.9', accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(20000) });
          const html = await response.text();
          const filename = `${sha256(url).slice(0, 20)}.html.gz`;
          const evidencePath = path.join(evidenceRoot, filename);
          fs.writeFileSync(evidencePath, zlib.gzipSync(html));
          const row = { ...base, attempted: true, checkedAt, httpStatus: response.status, finalUrl: response.url, responseBytes: Buffer.byteLength(html), responseSha256: sha256(html), evidenceFile: path.relative(root, evidencePath).replaceAll('\\', '/'), ...parsePage(product, html, response.url, response.status) };
          results.push(row); seen.set(url, row);
          blockStreak = row.status === 'blocked' ? [...blockStreak, { id: row.id, url, blocker: row.blocker, httpStatus: row.httpStatus, checkedAt }].slice(-3) : [];
          if (blockStreak.length === 3) {
            stop = { host, stoppedAt: new Date().toISOString(), reason: 'Three consecutive blocks on distinct URLs', evidenceIds: blockStreak.map(x => x.id), evidence: blockStreak, remainingNotConsulted: rows.length - attempts };
            domainPolicies.push(stop);
          }
          if (attempts % 20 === 0 || row.status === 'blocked') console.log(JSON.stringify({ host, attempted: attempts, totalInHost: rows.length, latestStatus: row.status }));
        } catch (error) {
          results.push({ ...base, attempted: true, checkedAt, status: 'error', error: error.message, errorCode: error.cause?.code || '', reason: 'Falha de rede; não confirma preço nem indisponibilidade do produto.' });
          blockStreak = [];
        }
        writeReport();
        await pause(450);
      }
      console.log(JSON.stringify({ host, complete: true, attempted: attempts, totalInHost: rows.length, stoppedForBlock: Boolean(stop) }));
      writeReport();
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  const payload = writeReport();
  const md = ['# Auditoria atual de preços', '', `Início: ${startedAt}`, `Fim: ${payload.generatedAt}`, '', `- Produtos públicos cobertos pelo relatório: ${products.length}.`, `- Consultas HTTP individuais: ${payload.totals.attempted}.`, `- Preços confirmados: ${payload.totals.confirmed}.`, `- Sem consulta individual: ${payload.totals.pendingNotConsulted}.`, '', 'Status:', ...Object.entries(payload.totals.byStatus).map(([key, value]) => `- ${key}: ${value}.`), '', 'Cada resultado registra a URL de origem e, quando consultada, data/hora, resposta HTTP, URL final, hash e cópia compactada da resposta pública. Itens pendentes não recebem uma falsa data de verificação. Nenhum preço é confirmado a partir de faixa, sugestão de outro produto ou mero texto monetário.', '', 'O catálogo e os links afiliados não foram alterados por este script.', ''].join('\n');
  fs.writeFileSync(output.replace(/\.json$/, '.md'), md);
  console.log(JSON.stringify({ output, totals: payload.totals, domainsStopped: domainPolicies.map(x => x.host) }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
