#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const inputPath = arg('input', 'catalogo_manifesto_original_preservado.json');
const outDir = arg('out', 'saida');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

function cleanText(v) {
  return (v || '').replace(/\s+/g, ' ').trim();
}

function isGenericLink(url) {
  return /\/loja\//i.test(url || '') || /lista\.mercadolivre/i.test(url || '');
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 Impacto360CatalogBot/1.0' } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    return true;
  } catch { return false; }
}

async function extractFromPage(page) {
  return await page.evaluate(() => {
    const text = (sel) => document.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const attr = (sel, name) => document.querySelector(sel)?.getAttribute(name) || '';
    const meta = (name) => document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute('content') || '';
    const imgs = Array.from(document.querySelectorAll('img'))
      .map(img => img.currentSrc || img.src || img.getAttribute('data-src') || '')
      .filter(Boolean)
      .filter(src => /http/i.test(src))
      .filter((v, i, arr) => arr.indexOf(v) === i);
    const videos = [
      ...Array.from(document.querySelectorAll('video source, video')).map(v => v.src || v.getAttribute('src') || ''),
      ...Array.from(document.querySelectorAll('iframe')).map(v => v.src || v.getAttribute('src') || ''),
      ...Array.from(document.querySelectorAll('a')).map(a => a.href || '').filter(h => /youtube|youtu\.be|video/i.test(h))
    ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);

    const bullets = Array.from(document.querySelectorAll('li')).map(li => li.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 80);
    const body = document.body?.innerText || '';
    const descriptionGuess = body.split(/Descrição/i).slice(1).join('Descrição').slice(0, 2500).replace(/\s+/g, ' ').trim();

    return {
      title: text('h1') || meta('og:title') || document.title,
      price: text('[class*="price-tag"]') || text('[class*="andes-money-amount"]') || '',
      rating: text('[class*="reviews"]') || '',
      ogImage: meta('og:image'),
      canonical: attr('link[rel="canonical"]', 'href'),
      images: imgs,
      videos,
      bullets,
      description: descriptionGuess,
      rawTitle: document.title
    };
  });
}

async function run() {
  await ensureDir(outDir);
  const manifest = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  });
  const results = [];
  for (const item of manifest.itens) {
    const page = await context.newPage();
    const original = item.link_original_preservado;
    const base = {
      codigo: item.codigo,
      produto_arquivo: item.produto_arquivo,
      link_original_preservado: original,
      alertas_arquivo: item.alertas || [],
      coletado_em: new Date().toISOString()
    };
    try {
      if (!original) throw new Error('Sem link original preservado');
      console.log(`[${item.codigo}] abrindo: ${item.produto_arquivo}`);
      await page.goto(original, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3500);
      const data = await extractFromPage(page);
      const finalUrl = page.url();
      const productDir = path.join(outDir, 'fotos', item.codigo);
      await ensureDir(productDir);
      const imageUrls = [data.ogImage, ...(data.images || [])].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 12);
      const savedImages = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const ext = imageUrls[i].includes('.webp') ? 'webp' : imageUrls[i].includes('.png') ? 'png' : 'jpg';
        const dest = path.join(productDir, `imagem_${String(i + 1).padStart(2, '0')}.${ext}`);
        if (await downloadImage(imageUrls[i], dest)) savedImages.push(dest);
      }
      const titleReal = cleanText(data.title);
      const status = [];
      if (isGenericLink(original) || isGenericLink(finalUrl)) status.push('link_generico');
      if (!savedImages.length) status.push('sem_foto');
      if (!data.videos?.length) status.push('sem_video_no_anuncio');
      const arquivoWords = item.produto_arquivo.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 4);
      const compatible = arquivoWords.some(w => titleReal.toLowerCase().includes(w));
      if (!compatible) status.push('revisar_titulo');
      if (!status.length) status.push('ok_publicacao');
      results.push({ ...base, url_final_resolvida: finalUrl, dados_online: data, imagens_salvas: savedImages, status });
    } catch (err) {
      results.push({ ...base, status: ['erro_coleta'], erro: String(err?.message || err) });
    } finally {
      await page.close();
      await sleep(rand(2000, 5000));
    }
  }
  await browser.close();
  await fs.writeFile(path.join(outDir, 'catalogo_enriquecido.json'), JSON.stringify(results, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'relatorio_inconsistencias.json'), JSON.stringify(results.filter(r => !r.status?.includes('ok_publicacao')), null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'vitrine_afiliado_impacto360.html'), buildHtml(results), 'utf8');
  console.log(`Concluído. Saída em: ${outDir}`);
}

function buildHtml(rows) {
  const cards = rows.map(r => {
    const img = r.imagens_salvas?.[0] || '';
    const status = (r.status || []).join(', ');
    const title = r.dados_online?.title || r.produto_arquivo;
    const price = r.dados_online?.price || '';
    const bullets = (r.dados_online?.bullets || []).slice(0, 6).map(b => `<li>${escapeHtml(b)}</li>`).join('');
    return `<article class="card" data-status="${escapeHtml(status)}">
      ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(title)}">` : '<div class="noimg">Sem foto</div>'}
      <h2>${escapeHtml(title)}</h2>
      <p class="price">${escapeHtml(price)}</p>
      <p class="status">${escapeHtml(status)}</p>
      <ul>${bullets}</ul>
      <a class="btn" href="${escapeHtml(r.link_original_preservado)}" target="_blank" rel="nofollow sponsored noopener">Ver oferta</a>
    </article>`;
  }).join('\n');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vitrine Afiliado Impacto 360</title><style>
  body{font-family:Arial,sans-serif;margin:0;background:#f6f7fb;color:#1f2937}.hero{padding:32px;background:#111827;color:white}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;padding:24px}.card{background:white;border-radius:18px;padding:16px;box-shadow:0 8px 28px #0001}.card img{width:100%;height:220px;object-fit:contain}.noimg{height:220px;display:grid;place-items:center;background:#eee;border-radius:12px}.price{font-weight:700;font-size:1.2rem}.status{font-size:.85rem;color:#6b7280}.btn{display:block;text-align:center;background:#111827;color:white;text-decoration:none;padding:12px;border-radius:12px;margin-top:12px}
  </style></head><body><section class="hero"><h1>Vitrine Afiliado Impacto 360</h1><p>Links de afiliado preservados. Dados online complementares.</p></section><main class="grid">${cards}</main></body></html>`;
}
function escapeHtml(s='') { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

run().catch(err => { console.error(err); process.exit(1); });
