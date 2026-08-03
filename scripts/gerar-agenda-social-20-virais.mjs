import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const campaignRoot = path.resolve(repoRoot, "..", "..", "outputs", "agenda-social-2026-08-04-a-13");
const candidates = readJson(path.join(repoRoot, "dados", "social-videos-20260730", "candidatos-virais.json")).candidates;
const catalog = readJson(path.join(repoRoot, "dados", "catalogo-publico.json"));

const selectedVideoNumbers = [1914, 2693, 645, 152, 1788, 1375, 1413, 1631, 124, 1212, 41, 64, 290, 1787, 1828, 107, 665, 1442, 1797, 1318];
const selectedLinkedinIds = [
  "hotmart-20260714-dominando-as-licitacoes-3980357",
  "hotmart-20260714-a-palavra-e-o-ser-7448602",
  "ml-completar-20260728-mlbu3868554458-1785e68c2b",
  "ml-completar-20260728-mlbu3836717813-9759647508",
  "ml-completar-20260728-mlbu3515894139-2dc6386c05",
  "ml-completar-20260728-mlb58285234-0aa657738b",
  "ml-completar-20260728-mlbu3870833896-125e08d186",
  "ml-completar-20260728-mlbu3858006107-1d073a6777",
  "ml-completar-20260728-mlbu3986367804-17c1acaa12",
  "ml-completar-20260728-mlbu4038337994-c4fa693d95",
  "ml-completar-20260728-mlbu3858113885-47afbd4c0e",
  "ml-completar-20260728-mlb19341851-c4b1fde542",
  "ml-completar-20260728-mlb19400653-5ea2e16f5b",
  "ml-completar-20260728-mlb65407750-2fd1dcedef",
  "ml-completar-20260728-mlbu3858054367-1ba8c1f50d",
  "ml-completar-20260728-mlbu3870819558-69034f8bc2",
  "ml-completar-20260728-mlb69537604-f19536c6a2",
  "ml-completar-20260728-mlbu3731460806-ca25c9886f",
  "ml-completar-20260728-mlb54720296-df7424b45b",
  "ml-completar-20260728-mlbu3870911632-d1460c3bef",
];

const slots = [];
const selectedCandidates = selectedVideoNumbers.map(number => requireItem(candidates, item => item.videoNumber === number, `vídeo ${number}`));
const selectedLinkedin = selectedLinkedinIds.map(id => requireItem(catalog, item => item.id === id, `produto LinkedIn ${id}`));

const eligibleFacebookGroups = [
  { name: "Ofertas E Achadinhos Online", url: "https://www.facebook.com/groups/881709290254970", rule: "Ofertas e links reais são permitidos; publicação precisa ter conteúdo, não apenas link." },
  { name: "Ofertas todo Dia", url: "https://www.facebook.com/groups/1185027518533643", rule: "Grupo dedicado a ofertas, cupons e descontos; sem restrição visível a links relevantes." },
  { name: "Grupo Marketing Publicidade e Propaganda - Virtual", url: "https://www.facebook.com/groups/trabalheemcasacrss", rule: "Descrição convida membros a comprar, vender e anunciar." },
  { name: "Achadinhos Promo Ofertas", url: "https://www.facebook.com/groups/1206025820099046", rule: "Grupo classificado como vendas e marketing, dedicado a promoções e ofertas online." },
  { name: "Shopee afiliados, compra e venda", url: "https://www.facebook.com/groups/956283518829993", rule: "Grupo explicitamente dedicado a afiliados, compra e venda." },
  { name: "Achadinhos Lagoa Santa/belo horizonte MG", url: "https://www.facebook.com/groups/150501905685243", rule: "Grupo criado para compra e venda; publicação deve permanecer no tema." },
  { name: "Grupo de Vendas Online", url: "https://www.facebook.com/groups/3205106456191391", rule: "Grupo dedicado a vendas online; sem proibição visível a ofertas relevantes." },
];

const excludedFacebookGroups = [
  { name: "Preço baixo (Mercado Carioca)", reason: "Escopo restrito a alimentos e itens de mercado; os 20 produtos não pertencem ao tema." },
  { name: "Achadinhos & Ofertas", reason: "Regras informam que somente administradores publicam e proíbem links/produtos de membros." },
  { name: "Ofertas Online & Promoções", reason: "Regras proíbem autopromoção e spam; campanha afiliada não foi incluída." },
];

for (let index = 0; index < selectedCandidates.length; index += 1) {
  const candidate = selectedCandidates[index];
  const linkedin = selectedLinkedin[index];
  const dayOffset = Math.floor(index / 2);
  const date = isoDate(2026, 8, 4 + dayOffset);
  const time = index % 2 === 0 ? "07:00" : "18:00";
  const fileNumber = String(index + 1).padStart(2, "0");
  const videoFile = path.join(campaignRoot, "videos", `${fileNumber}-${date}-${time.replace(":", "")}.mp4`);
  const product = {
    id: candidate.product.id,
    title: candidate.product.name,
    storeUrl: candidate.product.shortUrl,
    affiliateUrl: candidate.product.affiliateLink,
    image: candidate.product.image,
    linkLabel: `Impacto360 — ${candidate.product.name}`,
  };
  const linkedinProduct = {
    id: linkedin.id,
    title: linkedin.name,
    storeUrl: linkedin.shortUrl,
    affiliateUrl: linkedin.link,
    image: linkedin.image,
    linkLabel: `Impacto360 — ${linkedin.name}`,
  };
  slots.push({
    slotId: `${date}-${time.replace(":", "")}`,
    date,
    time,
    videoNumber: candidate.videoNumber,
    videoSha256: candidate.videoSha256,
    videoFile,
    sourceZipPath: candidate.sourceZipPath,
    sourceVideoEntry: candidate.videoEntry,
    sourceMarketplace: candidate.sourceMarketplace,
    sourceProductUrl: candidate.sourceUrl,
    durationSeconds: candidate.durationSeconds,
    resolution: candidate.resolution,
    viralScore: candidate.viralScore,
    reviewStatus: "aprovado_por_revisao_visual",
    generalProduct: product,
    linkedinProduct,
    captions: captionsFor(candidate, product, linkedinProduct),
  });
}

const groupRuns = [];
for (let day = 0; day < 10; day += 1) {
  const date = isoDate(2026, 8, 4 + day);
  const morning = slots[day * 2];
  const evening = slots[day * 2 + 1];
  const runTimes = ["07:05", "11:00", "15:00", "18:05"];
  const videos = [morning, morning, evening, evening];
  for (let part = 0; part < 4; part += 1) {
    const group = eligibleFacebookGroups[(day * 4 + part) % eligibleFacebookGroups.length];
    const slot = videos[part];
    groupRuns.push({
      date,
      time: runTimes[part],
      group: group.name,
      groupUrl: group.url,
      sourceSlotId: slot.slotId,
      videoFile: slot.videoFile,
      productTitle: slot.generalProduct.title,
      storeUrl: slot.generalProduct.storeUrl,
      caption: slot.captions.facebookGroup,
    });
  }
}

const agenda = {
  generatedAt: new Date().toISOString(),
  timezone: "America/Sao_Paulo",
  period: { start: "2026-08-04", end: "2026-08-13" },
  times: ["07:00", "18:00"],
  postingPolicy: {
    generalNetworks: ["Instagram", "Facebook", "TikTok", "X", "YouTube Shorts", "Pinterest", "Threads", "WhatsApp"],
    facebookPage: "Impacto360",
    facebookGroupCadence: "4 publicações por dia, uma por execução e com rodízio de destinos; nunca repetir o mesmo vídeo no mesmo grupo.",
    eligibleFacebookGroups,
    excludedFacebookGroups,
    linkedinDestinations: ["Perfil principal", "Página Impacto360, id 138473921"],
    linkedinOnlyBooksAndCourses: true,
    instagramStoryLinkSticker: true,
    postStorePageUrl: true,
    neverExposeRawAffiliateUrlInCaption: true,
    affiliateDisclosure: "A Impacto360 pode receber comissão pela indicação, sem custo adicional.",
    pricePolicy: "Não fixar preço, desconto, avaliação ou estoque no texto sem revalidação no momento da publicação.",
    duplicatePolicy: "Consultar histórico por slot, vídeo, produto, rede e destino. Se já houver confirmação, não repetir.",
    safetyPolicy: "Não contornar CAPTCHA, bloqueio, moderação, falta de permissão ou regra de grupo.",
  },
  slots,
  facebookGroupRuns: groupRuns,
};

fs.mkdirSync(campaignRoot, { recursive: true });
fs.writeFileSync(path.join(campaignRoot, "agenda.json"), `${JSON.stringify(agenda, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(campaignRoot, "produtos-da-campanha.json"), `${JSON.stringify({
  generatedAt: agenda.generatedAt,
  generalProducts: slots.map(slot => slot.generalProduct),
  linkedinProducts: slots.map(slot => slot.linkedinProduct),
}, null, 2)}\n`, "utf8");
const tableRows = slots.map(slot => `| ${slot.date} | ${slot.time} | ${slot.videoNumber} | ${slot.generalProduct.title.replaceAll("|", "-")} | ${slot.generalProduct.storeUrl} | ${slot.linkedinProduct.title.replaceAll("|", "-")} |`);
const reportLines = [
  "# Campanha Impacto360 — 20 vídeos virais",
  "",
  "Período: 04/08/2026 a 13/08/2026 — fuso America/Sao_Paulo.",
  "",
  "## Calendário",
  "",
  "| Data | Hora | Vídeo | Produto geral | Link curto | LinkedIn (livro/curso) |",
  "|---|---:|---:|---|---|---|",
  ...tableRows,
  "",
  "## Facebook",
  "",
  `- Página Impacto360: ${slots.length} publicações, duas por dia.`,
  `- Grupos elegíveis: ${eligibleFacebookGroups.length}.`,
  `- Rodízio: ${groupRuns.length} publicações, quatro por dia, sem repetir vídeo no mesmo grupo.`,
  "- Grupos excluídos: Preço baixo (escopo alimentar), Achadinhos & Ofertas (somente administradores e sem links) e Ofertas Online & Promoções (autopromoção proibida).",
  "",
  "## Regras de conteúdo",
  "",
  "- Sem preço, desconto, avaliação ou estoque não revalidado.",
  "- A legenda usa somente a URL curta da Impacto360; o link afiliado fica dentro da página do produto.",
  "- Instagram: Reel e Story com figurinha de link.",
  "- LinkedIn: somente livros e cursos.",
  "- Divulgação de comissão incluída em todas as legendas.",
  "",
];
fs.writeFileSync(path.join(campaignRoot, "RELATORIO-CAMPANHA.md"), `${reportLines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({ campaignRoot, slots: slots.length, facebookGroupRuns: groupRuns.length, eligibleFacebookGroups: eligibleFacebookGroups.length }, null, 2));

function captionsFor(candidate, product, linkedinProduct) {
  const disclosure = "A Impacto360 pode receber comissão pela indicação, sem custo adicional.";
  const hashtags = hashtagsFor(candidate.title, product.title);
  const base = `Veja ${product.title} em demonstração e confira os detalhes atuais na Impacto360.`;
  return {
    instagram: `✨ ${base}\n\nToque na figurinha de link: ${product.storeUrl}\n\n${disclosure}\n\n${hashtags}`,
    instagramStoryStickerLabel: `Impacto360 • ${compactTitle(product.title, 32)}`,
    instagramStoryStickerUrl: product.storeUrl,
    facebookPage: `${base}\n\nConfira: ${product.storeUrl}\n\n${disclosure}\n\n${hashtags}`,
    facebookGroup: `${base}\n\nLink da loja: ${product.storeUrl}\n\n${disclosure}\n\n${hashtags}`,
    tiktok: `${base}\n\nLink Impacto360: ${product.storeUrl}\n${disclosure}\n${hashtags}`,
    x: `${compactTitle(product.title, 110)} em demonstração. Detalhes atuais: ${product.storeUrl}\n\n${disclosure}`,
    youtubeShortsTitle: `${compactTitle(product.title, 76)} | Impacto360 #Shorts`,
    youtubeShortsDescription: `${base}\n\nConfira: ${product.storeUrl}\n\n${disclosure}\n\n${hashtags}`,
    pinterestTitle: compactTitle(product.title, 90),
    pinterestDescription: `${base} ${disclosure}`,
    pinterestDestinationUrl: product.storeUrl,
    threads: `${base}\n\n${product.storeUrl}\n\n${disclosure}\n\n${hashtags}`,
    whatsapp: `✨ ${product.title}\n\n${base}\n${product.storeUrl}\n\n${disclosure}`,
    linkedin: `Leitura e aprendizado em destaque: ${linkedinProduct.title}.\n\nVeja a página na Impacto360: ${linkedinProduct.storeUrl}\n\n${disclosure}\n\n#Livros #Cursos #DesenvolvimentoProfissional`,
  };
}

function hashtagsFor(...values) {
  const text = normalize(values.join(" "));
  const tags = ["#Impacto360", "#Achadinhos", "#ComprasOnline"];
  if (/cozinha|fritadeira|panela|alho|pote/.test(text)) tags.push("#CasaECozinha");
  else if (/pet|cachorro|gato/.test(text)) tags.push("#MundoPet");
  else if (/camera|projetor|celular|gravacao|wifi/.test(text)) tags.push("#Tecnologia");
  else if (/bebe|infantil|crianca/.test(text)) tags.push("#Familia");
  else if (/limpeza|lixeira|ducha|banheiro/.test(text)) tags.push("#CasaOrganizada");
  else tags.push("#DicaDeCompra");
  return tags.join(" ");
}

function compactTitle(value, max) {
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function normalize(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isoDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function requireItem(items, predicate, label) {
  const item = items.find(predicate);
  if (!item) throw new Error(`Não encontrado: ${label}`);
  return item;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}
