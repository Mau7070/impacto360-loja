import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Run after deployment. Normalize Git line endings in text; compare image bytes unchanged.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const usage = 'node scripts/validar-publicacao-modernizacao.mjs --output <arquivo-fora-do-repo.json> [--base https://impacto360afiliado.com.br/]';
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--output', '--base'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) {
    throw new Error(`Argumentos inválidos. ${usage}`);
  }
  options[args[i].slice(2)] = args[i + 1];
}
if (!options.output) throw new Error(`Informe --output fora do repositório. ${usage}`);
const output = path.resolve(options.output);
const relativeOutput = path.relative(root, output);
if (!relativeOutput || (!relativeOutput.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeOutput))) {
  throw new Error('O relatório --output deve ficar fora do repositório.');
}
const base = new URL(options.base || 'https://impacto360afiliado.com.br/');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/') {
  throw new Error('--base deve ser a origem HTTP(S) da loja, sem credenciais nem subdiretório.');
}
base.search = '';
base.hash = '';

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'dados/catalogo-publico.json'), 'utf8'));
if (!Array.isArray(catalog)) throw new Error('Catálogo público deve ser uma lista.');
function localImageFile(item) {
  const relative = String(item.image || '').replace(/^\/+/, '');
  if (!relative || /^(?:[a-z]+:|\/)/i.test(relative) || relative.split(/[\\/]/).includes('..')) return '';
  const absolute = path.resolve(root, relative);
  return absolute.startsWith(root + path.sep) && fs.existsSync(absolute) && fs.statSync(absolute).isFile()
    ? relative.replace(/\\/g, '/') : '';
}
// Both fields are emitted by gerar-storefront-excelencia.mjs with the product-page route rules.
const product = catalog.find(item => /^[a-z0-9-]+$/.test(item.slug || '')
  && /^\/p\/[a-f0-9]+\/$/.test(item.shortPath || '')
  && fs.existsSync(path.join(root, 'produto', item.slug, 'index.html'))
  && fs.existsSync(path.join(root, item.shortPath.slice(1), 'index.html')) && localImageFile(item));
if (!product) throw new Error('Não há produto real com as duas rotas geradas e imagem local no catálogo.');
const imageFile = localImageFile(product);
const targets = [
  ['/', 'index.html', 'text/html'],
  ['/assets/storefront-excellence.js', 'assets/storefront-excellence.js', 'javascript'],
  ['/assets/storefront-excellence.css', 'assets/storefront-excellence.css', 'text/css'],
  ['/dados/marketplaces.json', 'dados/marketplaces.json', 'json'],
  ['/dados/catalogo-publico.json', 'dados/catalogo-publico.json', 'json'],
  ['/dados/resumo-revisao-precos.json', 'dados/resumo-revisao-precos.json', 'json'],
  ['/dados/products.json', 'dados/products.json', 'json'],
  ['/dados/banners-anuncios.json', 'dados/banners-anuncios.json', 'json'],
  ['/sitemap.xml', 'sitemap.xml', 'xml'],
  [`/produto/${product.slug}/`, `produto/${product.slug}/index.html`, 'text/html'],
  [product.shortPath, `${product.shortPath.slice(1)}index.html`, 'text/html'],
  [`/${imageFile}`, imageFile, 'image/', 'none'],
].map(([route, file, contentType, hashNormalization = 'utf8-crlf-to-lf']) => ({ route, file, contentType, hashNormalization }));
const hash = (bytes, normalization) => crypto.createHash('sha256')
  .update(normalization === 'utf8-crlf-to-lf' ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes)
  .digest('hex');
// Capture all local hashes before any HTTP request so an incomplete build fails locally.
for (const target of targets) {
  const bytes = fs.readFileSync(path.join(root, target.file));
  target.localBytes = bytes.length;
  target.localSha256 = hash(bytes, target.hashNormalization);
}
const startedAt = new Date().toISOString();
const cacheKey = String(Date.now());
const results = await Promise.all(targets.map(async target => {
  const url = new URL(target.route, base);
  url.searchParams.set('verificacao_publicacao', cacheKey);
  const result = { ...target, url: url.href, status: null, ok: false };
  try {
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      signal: AbortSignal.timeout(30_000),
      redirect: 'follow',
    });
    result.status = response.status;
    result.finalUrl = response.url;
    result.responseContentType = response.headers.get('content-type') || '';
    const bytes = Buffer.from(await response.arrayBuffer());
    result.publicBytes = bytes.length;
    result.publicSha256 = hash(bytes, target.hashNormalization);
    result.hashMatches = result.publicSha256 === result.localSha256;
    result.contentTypeMatches = result.responseContentType.toLowerCase().includes(target.contentType);
    result.sameOrigin = new URL(response.url).origin === base.origin;
    result.ok = result.status === 200 && result.hashMatches && result.contentTypeMatches && result.sameOrigin;
  } catch (error) {
    result.error = error.message;
  }
  return result;
}));
const report = {
  startedAt,
  completedAt: new Date().toISOString(),
  baseUrl: base.href,
  localRoot: root,
  hashNormalization: { text: 'utf8-crlf-to-lf', image: 'none' },
  sampledProduct: { id: product.id, slug: product.slug, shortPath: product.shortPath, image: imageFile },
  ok: results.every(result => result.ok),
  passed: results.filter(result => result.ok).length,
  total: results.length,
  results,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, passed: report.passed, total: report.total, output,
  failed: results.filter(result => !result.ok).map(result => ({ route: result.route, status: result.status,
    hashMatches: result.hashMatches, error: result.error })) }, null, 2));
if (!report.ok) process.exitCode = 1;
