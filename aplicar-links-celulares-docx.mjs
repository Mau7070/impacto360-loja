import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const WORKSPACE = process.cwd();
const PYTHON = "C:\\Users\\PMNB\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const DOCX = "C:\\Users\\PMNB\\Desktop\\catalogo_100_celulares_links_individuais_fotos_ml.docx";
const BASE_JSON = path.join(WORKSPACE, "catalogo-impacto360-curado-final.json");
const OUTPUT_JSON = path.join(WORKSPACE, "catalogo-impacto360-com-links-celulares.json");
const OUTPUT_MATCHES = path.join(WORKSPACE, "RELATORIO-LINKS-CELULARES-DOCX.md");
const OUTPUT_CSV = path.join(WORKSPACE, "catalogo-impacto360-links-celulares-aplicados.csv");
const EXTRACTED_DOCX_JSON = path.join(WORKSPACE, "catalogo-celulares-docx-extraido.json");

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(dual|sim|gb|ram|smartphone|celular|distribuidor|autorizado|novo|android|ios)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function keyTokens(value = "") {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((token) => token.length >= 2 && !["com", "para", "cor", "preto", "branco", "azul", "verde", "cinza", "escuro"].includes(token))
  );
}

function jaccard(a, b) {
  const aa = keyTokens(a);
  const bb = keyTokens(b);
  if (!aa.size || !bb.size) return 0;
  let intersection = 0;
  for (const token of aa) if (bb.has(token)) intersection += 1;
  return intersection / (aa.size + bb.size - intersection);
}

function slugify(value = "") {
  return normalize(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function csvEscape(value = "") {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(csvEscape).join(",");
}

function chooseAffiliateUrl(urls = []) {
  const clean = urls
    .map((url) => url.replace(/&amp;/g, "&"))
    .filter((url) => !/google\.com|\/noindex\/catalog\/reviews|\/noindex\/services/i.test(url));
  return (
    clean.find((url) => /^https:\/\/meli\.la\//i.test(url)) ||
    clean.find((url) => /mercadolivre\.com\.br\/.+\/p\/MLB/i.test(url)) ||
    clean.find((url) => /mercadolivre\.com\.br\/loja\//i.test(url)) ||
    clean.find((url) => /^https:\/\//i.test(url)) ||
    ""
  );
}

function isRealAffiliate(link = "") {
  return /^https?:\/\//i.test(link) && !/COLOCAR_LINK|LINK_AFILIADO|PREENCHER/i.test(link);
}

function brandOf(value = "") {
  const text = normalize(value);
  if (/\bsamsung\b|\bgalaxy\b/.test(text)) return "samsung";
  if (/\bmotorola\b|\bmoto\b|\bedge\b/.test(text)) return "motorola";
  if (/\bapple\b|\biphone\b/.test(text)) return "apple";
  if (/\bxiaomi\b|\bredmi\b/.test(text)) return "xiaomi";
  return "";
}

function phoneModel(value = "") {
  const text = normalize(value);
  const samsung = text.match(/\bgalaxy\s+([aszm]\d{1,3})(?:\s*(fe|ultra|plus|pro|max))?\b/);
  if (samsung) return `samsung-${samsung[1]}-${samsung[2] || ""}`;
  const motoG = text.match(/\bmoto\s+g\s?(\d{1,3}[a-z]*)\b/);
  if (motoG) return `motorola-g${motoG[1]}`;
  const edge = text.match(/\bedge\s+(\d{1,3})(?:\s*(neo|ultra|pro|fusion))?\b/);
  if (edge) return `motorola-edge${edge[1]}-${edge[2] || ""}`;
  const iphone = text.match(/\biphone\s+(xr|xs|\d{1,2})(?:\s*(e|plus|pro max|pro|max))?\b/);
  if (iphone) return `apple-iphone-${iphone[1]}-${iphone[2] || ""}`;
  const redmi = text.match(/\bredmi\s+(\d{1,3}[a-z]*)\b/);
  if (redmi) return `xiaomi-redmi-${redmi[1]}`;
  return "";
}

function isSafePhoneMatch(recordTitle, productName) {
  const recordBrand = brandOf(recordTitle);
  const productBrand = brandOf(productName);
  if (recordBrand && productBrand && recordBrand !== productBrand) return false;

  const recordModel = phoneModel(recordTitle);
  const productModel = phoneModel(productName);
  if (recordModel && productModel) return recordModel === productModel;

  return jaccard(recordTitle, productName) >= 0.76;
}

function buildPostTexts(product) {
  const title = product.name || "Celular Mercado Livre";
  const price = product.price || "Sob consulta";
  const link = product.affiliateLink || "";
  const short = product.descricaoCurta || product.description || "Celular selecionado para o catálogo Impacto 360.";
  return {
    legendaWhatsApp: `Oferta selecionada no IMPACTO 360 AFILIADO\n\n${title}\n${price}\n\n${short}\n\nComprar no Mercado Livre:\n${link}\n\nEste conteúdo pode conter link de afiliado.`,
    legendaInstagram: `${title}\n\n${short}\n\n${price}\n\nConfira os detalhes antes de comprar.\n\n#Impacto360 #Celulares #MercadoLivre #OfertasSelecionadas`,
    legendaFacebook: `${title}\n\n${short}\n\nPreço: ${price}\n\nAcesse pelo link da Impacto 360 Afiliado: ${link}`,
    chamadaCompra: "Comprar no Mercado Livre",
  };
}

async function extractDocxCatalog() {
  const code = String.raw`
import json, re, zipfile
from pathlib import Path
from docx import Document

docx_path = Path(r"${DOCX}")
out_path = Path(r"${EXTRACTED_DOCX_JSON}")

with zipfile.ZipFile(docx_path) as z:
    rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8", errors="ignore")
    rels = dict(re.findall(r'<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"', rels_xml))
    media_names = [n for n in z.namelist() if n.startswith("word/media/")]

doc = Document(docx_path)
records = []

for table_index, table in enumerate(doc.tables):
    cell_text = "\n".join(cell.text for row in table.rows for cell in row.cells).strip()
    match = re.search(r'\b(\d{3})\.\s*([^\n]+)', cell_text)
    if not match:
        continue
    number = match.group(1)
    title = match.group(2).strip()
    description = ""
    desc_match = re.search(r'Descri[cç][aã]o:\s*(.*?)(?:\n(?:Link|Bot[aã]o|Pre[cç]o|R\$)|$)', cell_text, re.S | re.I)
    if desc_match:
        description = re.sub(r'\s+', ' ', desc_match.group(1)).strip()
    price = ""
    price_match = re.search(r'R\$\s*[\d\.\,]+', cell_text)
    if price_match:
        price = price_match.group(0)
    urls = []
    xml = table._tbl.xml
    for rid in re.findall(r'r:id="([^"]+)"', xml):
        target = rels.get(rid)
        if target and target.startswith("http"):
            urls.append(target.replace("&amp;", "&"))
    seen = set()
    unique_urls = []
    for url in urls:
        if url not in seen:
            unique_urls.append(url)
            seen.add(url)
    records.append({
        "number": number,
        "title": title,
        "description": description,
        "price": price,
        "urls": unique_urls,
        "tableIndex": table_index
    })

out_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"records": len(records), "media": len(media_names), "out": str(out_path)}, ensure_ascii=False))
`;
  execFileSync(PYTHON, ["-c", code], { cwd: WORKSPACE, stdio: "inherit" });
  return JSON.parse(await fs.readFile(EXTRACTED_DOCX_JSON, "utf8"));
}

function findBestMatch(record, products, usedProductIndexes, baseProductCount, affiliateUrl) {
  if (affiliateUrl) {
    const exactLinkIndex = products.findIndex((product, index) => index < baseProductCount && product.affiliateLink === affiliateUrl);
    if (exactLinkIndex >= 0 && !usedProductIndexes.has(exactLinkIndex)) {
      return { product: products[exactLinkIndex], index: exactLinkIndex, score: 1 };
    }
  }

  const phoneProducts = products
    .map((product, index) => ({ product, index }))
    .filter(
      ({ product, index }) =>
        index < baseProductCount &&
        (product.storeId === "impacto-mobile" || /celular|smartphone|iphone|galaxy|moto|xiaomi|redmi/i.test(`${product.name} ${product.category}`))
    );

  let best = null;
  for (const candidate of phoneProducts) {
    if (usedProductIndexes.has(candidate.index)) continue;
    const score = Math.max(
      jaccard(record.title, candidate.product.name || ""),
      jaccard(record.title, `${candidate.product.name || ""} ${candidate.product.description || ""}`)
    );
    const normalizedRecord = normalize(record.title);
    const normalizedCandidate = normalize(candidate.product.name || "");
    const containsBoost =
      normalizedRecord && normalizedCandidate && (normalizedRecord.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedRecord)) ? 0.25 : 0;
    const finalScore = Math.min(1, score + containsBoost);
    if (!isSafePhoneMatch(record.title, candidate.product.name || "")) continue;
    if (!best || finalScore > best.score) best = { ...candidate, score: finalScore };
  }
  return best && best.score >= 0.35 ? best : null;
}

async function main() {
  const records = await extractDocxCatalog();
  const products = JSON.parse(await fs.readFile(BASE_JSON, "utf8"));
  const baseProductCount = products.length;
  const usedProductIndexes = new Set();
  const usedDocNumbers = new Set();
  const matches = [];
  const added = [];

  for (const record of records) {
    const affiliateUrl = chooseAffiliateUrl(record.urls);
    if (!affiliateUrl) {
      matches.push({ number: record.number, title: record.title, action: "sem-link", detail: "Nenhum link aproveitavel no bloco do Word" });
      continue;
    }

    const match = findBestMatch(record, products, usedProductIndexes, baseProductCount, affiliateUrl);
    if (match) {
      const product = products[match.index];
      const before = product.affiliateLink || "";
      if (!isRealAffiliate(before)) {
        product.affiliateLink = affiliateUrl;
        product.linkOriginal = product.linkOriginal || affiliateUrl;
        product.status = product.status === "pendente" ? "ativo" : product.status;
        product.pendencias = (product.pendencias || []).filter((item) => !/link de afiliado ausente|placeholder/i.test(item));
        Object.assign(product, buildPostTexts(product));
        matches.push({ number: record.number, title: record.title, action: "atualizado", productId: product.id, score: match.score.toFixed(2), before, after: affiliateUrl });
      } else if (before === affiliateUrl) {
        matches.push({ number: record.number, title: record.title, action: "ja-estava-igual", productId: product.id, score: match.score.toFixed(2), after: affiliateUrl });
      } else {
        product.linkAlternativoDocx = affiliateUrl;
        matches.push({ number: record.number, title: record.title, action: "mantido-existente", productId: product.id, score: match.score.toFixed(2), before, docxLink: affiliateUrl });
      }
      usedProductIndexes.add(match.index);
      usedDocNumbers.add(record.number);
      continue;
    }

    const id = `celular-ml-docx-${record.number}`;
    const product = {
      id,
      storeId: "impacto-mobile",
      name: record.title,
      description: record.description || `${record.title} selecionado para a loja de celulares Impacto 360 Afiliado.`,
      descricaoCurta: record.description || `${record.title} selecionado para a loja de celulares Impacto 360 Afiliado.`,
      descricaoDetalhada: `${record.title}. Confira preço, variações, prazo e condições diretamente no Mercado Livre antes da compra.`,
      price: record.price || "Sob consulta",
      image: "/assets/placeholder-produto.svg",
      imagemPrincipal: "/assets/placeholder-produto.svg",
      galeria: [],
      badge: "Mercado Livre",
      affiliateLink: affiliateUrl,
      linkOriginal: affiliateUrl,
      category: "Celulares",
      subcategoria: "Smartphones",
      source: "Mercado Livre",
      status: "pendente",
      editable: true,
      actionType: "buy",
      videos: [],
      specs: [],
      statusMidia: "imagem pendente",
      pendencias: ["produto novo importado do Word; revisar imagem e preco antes de publicar"],
      fonteMidia: "catalogo Word enviado pelo usuario",
      ultimaRevisao: new Date().toISOString(),
      docxCatalogNumber: record.number,
      docxUrls: record.urls,
      ...buildPostTexts({ name: record.title, price: record.price || "Sob consulta", affiliateLink: affiliateUrl, description: record.description }),
    };
    products.push(product);
    added.push(product);
    matches.push({ number: record.number, title: record.title, action: "adicionado-novo", productId: id, after: affiliateUrl });
    usedDocNumbers.add(record.number);
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(products, null, 2), "utf8");

  const csv = [
    csvRow(["numero_docx", "produto_docx", "acao", "id_produto", "score", "link_aplicado", "observacao"]),
    ...matches.map((m) => csvRow([m.number, m.title, m.action, m.productId || "", m.score || "", m.after || m.docxLink || "", m.detail || ""])),
  ].join("\n");
  await fs.writeFile(OUTPUT_CSV, csv, "utf8");

  const report = `# RELATORIO - LINKS DE CELULARES APLICADOS

Arquivo Word analisado: \`${DOCX}\`

## Resumo
- Registros de celulares encontrados no Word: ${records.length}
- Produtos no JSON final: ${products.length}
- Produtos existentes atualizados com link do Word: ${matches.filter((m) => m.action === "atualizado").length}
- Produtos que ja tinham o mesmo link: ${matches.filter((m) => m.action === "ja-estava-igual").length}
- Produtos com link existente preservado e link do Word salvo como alternativo: ${matches.filter((m) => m.action === "mantido-existente").length}
- Produtos novos adicionados a loja de celulares: ${added.length}
- Registros sem link aproveitavel: ${matches.filter((m) => m.action === "sem-link").length}

## Regras aplicadas
- Nenhum produto antigo foi apagado.
- Links reais existentes nao foram substituidos sem necessidade.
- Produtos com \`COLOCAR_LINK_AFILIADO_AQUI\` receberam link quando houve correspondencia.
- Produtos do Word sem correspondente claro foram adicionados como novos itens pendentes para revisao de imagem/preco.
- O link escolhido priorizou \`meli.la\`, depois URL individual do Mercado Livre e depois loja oficial quando era o unico link disponivel.

## Acoes por item
${matches.map((m) => `- ${m.number} - ${m.title}: ${m.action}${m.productId ? ` (${m.productId})` : ""}`).join("\n")}
`;
  await fs.writeFile(OUTPUT_MATCHES, report, "utf8");

  const desktopDir = "C:\\Users\\PMNB\\Desktop\\atualiz";
  try {
    await fs.copyFile(OUTPUT_JSON, path.join(desktopDir, "catalogo-impacto360-com-links-celulares.json"));
    await fs.copyFile(OUTPUT_CSV, path.join(desktopDir, "catalogo-impacto360-links-celulares-aplicados.csv"));
    await fs.copyFile(OUTPUT_MATCHES, path.join(desktopDir, "RELATORIO-LINKS-CELULARES-DOCX.md"));
    await fs.copyFile(EXTRACTED_DOCX_JSON, path.join(desktopDir, "catalogo-celulares-docx-extraido.json"));
  } catch {}

  console.log(JSON.stringify({
    records: records.length,
    totalProducts: products.length,
    updated: matches.filter((m) => m.action === "atualizado").length,
    same: matches.filter((m) => m.action === "ja-estava-igual").length,
    preserved: matches.filter((m) => m.action === "mantido-existente").length,
    added: added.length,
    output: OUTPUT_JSON,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
