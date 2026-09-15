import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Apply only evidence collected for the public catalog; retain every product and affiliate URL.
const args = process.argv.slice(2);
const inputPath = args[args.indexOf('--input') + 1];
if (!args.includes('--input') || !inputPath) throw new Error('Informe --input caminho-do-relatorio.json');
const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sourcePath = path.join(root, 'dados/products.json');
const source = read(sourcePath);
const report = read(inputPath);
const publicProducts = read(path.join(root, 'dados/catalogo-publico.json'));
const evidence = new Map(report.results.map(row => [String(row.id), row]));
if (evidence.size !== publicProducts.length || !publicProducts.every(p => evidence.has(String(p.id)))) {
  throw new Error('O relatório deve cobrir todos os IDs públicos, inclusive pendências explícitas.');
}
const priceFields = ['price', 'preco', 'precoPromocional', 'precoAtual'];
const previousFields = ['precoAnterior', 'previousPrice', 'oldPrice', 'priceBefore', 'precoOriginal'];
const dateFields = ['precoAtualizadoEm', 'priceUpdatedAt', 'ultimaVerificacaoPreco'];
const linkHash = products => crypto.createHash('sha256').update(JSON.stringify(products.map(p =>
  Object.fromEntries(Object.entries(p).filter(([key]) => /link|url|marketplace|source/i.test(key)))
))).digest('hex');
const before = linkHash(source);
const date = new Date().toISOString();
let confirmed = 0, oldPricesArchived = 0;
const updated = source.map(product => {
  const row = evidence.get(String(product.id));
  if (!row) return product;
  const next = { ...product };
  const oldPrice = priceFields.find(key => String(product[key] || '').trim());
  if (oldPrice) {
    oldPricesArchived++;
    next.historicoPrecos = [...(Array.isArray(product.historicoPrecos) ? product.historicoPrecos : []), {
      arquivadoEm: date, valor: product[oldPrice], verificadoEm: product.priceUpdatedAt || product.precoAtualizadoEm || '',
      motivo: 'Preço anterior preservado como histórico durante a revisão do catálogo.'
    }];
  }
  const price = Number(row.schemaPrice);
  const checked = Date.parse(row.checkedAt || '');
  const verified = row.status === 'confirmed' && row.identity?.matched && row.titleCheck?.matched
    && row.currency === 'BRL' && Number.isFinite(price) && price > 0
    && checked <= Date.now() && checked > Date.now() - 86400000 && !row.captcha;
  if (verified) confirmed++;
  const formatted = verified ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price) : '';
  for (const key of priceFields) next[key] = formatted;
  for (const key of previousFields) if (key in next) next[key] = null;
  for (const key of ['discountPercent', 'percentualDesconto', 'descontoPercentual']) if (key in next) next[key] = null;
  for (const key of dateFields) next[key] = verified ? row.checkedAt : '';
  next.priceValidUntil = verified ? new Date(checked + 7 * 86400000).toISOString() : '';
  next.precoValidoAte = next.priceValidUntil;
  next.priceStatus = verified ? 'current' : 'unverified';
  next.statusPreco = verified ? 'confirmado' : row.status;
  for (const key of ['disponibilidade', 'availability', 'estoque']) if (key in next) next[key] = '';
  next.auditoriaPrecoAtual = {
    status: next.statusPreco, consultaIndividual: row.attempted === true,
    consultadoEm: row.attempted ? row.checkedAt : '', revisaoRegistradaEm: date,
    fonte: row.url, motivo: row.reason || '',
  };
  return next;
});
if (source.length !== updated.length || before !== linkHash(updated)) throw new Error('Alteração inesperada em produtos ou links.');
const summary = {
  reviewedAt: date, totalRecords: source.length, publicProducts: publicProducts.length,
  pricesConfirmed: confirmed, oldPricesArchived, affiliateLinksPreserved: before === linkHash(updated),
  collection: report.totals, note: 'Revisão concluída com preços pendentes. Ausência de confirmação não significa produto indisponível.'
};
if (args.includes('--apply')) {
  const backup = path.join(root, 'backups', `precos-${date.replace(/[:.]/g, '-')}.json`);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(sourcePath, backup);
  for (const base of [root, path.join(root, 'pacote-github-pages-pronto')]) {
    fs.writeFileSync(path.join(base, 'dados/products.json'), JSON.stringify(updated, null, 2) + '\n');
    fs.writeFileSync(path.join(base, 'dados/resumo-revisao-precos.json'), JSON.stringify(summary, null, 2) + '\n');
  }
}
console.log(JSON.stringify({ applied: args.includes('--apply'), ...summary }, null, 2));
