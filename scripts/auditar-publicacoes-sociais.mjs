import fs from "node:fs";
import path from "node:path";
import {
  applySafeCancellation,
  buildCatalogIndex,
  classifyPublication,
  findProductByEvidence,
  revalidateBeforePublication,
  validateProductForPublication,
} from "../lib/publication-safety.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const live = args.includes("--live");
const applySafe = args.includes("--apply-safe");
const generatedAt = new Date().toISOString();
const outputDir = path.resolve(valueAfter("--output-dir") || path.join(root, "dados", "auditoria-publicacoes"));
const catalog = readJson(path.join(root, "dados", "products.json"));
const catalogIndex = buildCatalogIndex(catalog);
const sources = discoverScheduleFiles();
const logs = readDeliveryLogs(path.join(root, "dados", "social-publish-log.jsonl"));
const inventory = [];
let safeCancellations = 0;

for (const source of sources) {
  const document = readJson(source);
  const actions = new Map();
  if (applySafe && Array.isArray(document.schedule)) {
    document.schedule = document.schedule.map(item => {
      const result = applySafeCancellation(item, generatedAt);
      if (result.changed) {
        safeCancellations += 1;
        actions.set(String(item.sequence), result.action);
      }
      return result.item;
    });
    if (actions.size) {
      document.summary = {
        ...document.summary,
        pendingReviewAndAffiliateLink: Math.max(0, Number(document.summary?.pendingReviewAndAffiliateLink || 0) - actions.size),
        cancelledByAudit: Number(document.summary?.cancelledByAudit || 0) + actions.size,
      };
      document.audit = {
        action: "CANCELAR_AGENDAMENTO",
        reason: "produto_nao_cadastrado_ou_link_afiliado_nao_confirmado",
        previousStatus: "aguardando_revisao_visual_e_link_afiliado",
        currentStatus: "cancelado_por_auditoria",
        cancelledAt: generatedAt,
        count: actions.size,
      };
      fs.writeFileSync(source, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    }
  }
  for (const item of Array.isArray(document.schedule) ? document.schedule : []) {
    const recordedAction = actions.get(String(item.sequence)) || actionRecordedOn(item, document.audit);
    const campaign = {
      id: `${path.basename(path.dirname(source))}:${item.sequence}`,
      productId: item.catalogProductId,
      title: item.title,
      image: item.image || "",
      videoSha256: item.videoSha256,
      link: item.storeLink,
      caption: item.caption,
      channel: "facebook",
    };
    const match = campaign.productId
      ? findProductByEvidence(campaign, catalogIndex)
      : { product: null, score: 0, method: "sem_id" };
    const validation = live
      ? await revalidateBeforePublication(match.product, campaign, {
          catalogRegistered: match.method === "id",
          duplicateProductId: catalogIndex.duplicateIds.has(campaign.productId),
          fetchImpl: fetch,
        })
      : validateProductForPublication(match.product, campaign, {
          catalogRegistered: match.method === "id",
          duplicateProductId: catalogIndex.duplicateIds.has(campaign.productId),
        });
    let classification = classifyPublication(item, validation);
    const delivery = logs.get(campaign.id) || null;
    const reasons = [...validation.failures];
    if (validation.readyToPublish && item.date < generatedAt.slice(0, 10) && !delivery) {
      classification = "REVISÃO_MANUAL";
      reasons.push("data_planejada_passou_sem_comprovante_de_publicacao");
    }
    inventory.push({
      rede: "fila_social_local_nao_distribuida",
      canais_planejados: ["WhatsApp", "Instagram", "Facebook", "TikTok", "YouTube Shorts"],
      publication_id: delivery?.campaign?.publicationId || "",
      schedule_id: campaign.id,
      data: item.date || "",
      horario: item.time || slotTime(item.slot),
      titulo: item.title || "",
      descricao: item.caption || "",
      imagem: item.image || "",
      video: item.videoEntry || "",
      video_sha256: item.videoSha256 || "",
      url: item.storeLink || "",
      produto_anunciado: item.title || "",
      sku: item.sku || "",
      marketplace_origem: item.affiliateMarketplace || item.sourceMarketplace || "",
      status_origem: item.publicationStatus || "",
      impacto360_product_id: item.catalogProductId || "",
      affiliate_url: item.affiliateLink || "",
      source_url: item.sourceUrl || "",
      source_file: path.relative(root, source).replaceAll("\\", "/"),
      classificacao: classification,
      motivos: reasons,
      validacao: validation,
      entrega_registrada: delivery,
      alteracao: recordedAction,
    });
  }
}

const counts = countBy(inventory, "classificacao");
const integrations = integrationStatus();
const report = {
  generatedAt,
  mode: applySafe ? (live ? "apply-safe-live" : "apply-safe-local") : (live ? "dry-run-live" : "dry-run-local"),
  destructiveActionsExecuted: applySafe && (safeCancellations > 0 || (counts.CANCELAR_AGENDAMENTO || 0) > 0),
  safeActionsExecutedThisRun: safeCancellations,
  backupRequiredBeforeApply: true,
  sources: sources.map(file => path.relative(root, file).replaceAll("\\", "/")),
  summary: {
    publicacoesAnalisadas: inventory.length,
    publicacoesCorretas: counts.OK || 0,
    publicacoesCorrigidas: 0,
    linksCorrigidos: 0,
    produtosLocalizados: inventory.filter(item => item.impacto360_product_id && item.validacao.productExists).length,
    produtosCadastrados: 0,
    produtosAtualizados: 0,
    agendamentosCorrigidos: 0,
    agendamentosCancelados: safeCancellations || (counts.CANCELAR_AGENDAMENTO || 0),
    publicacoesExcluidas: 0,
    publicacoesRecriadas: 0,
    casosRevisaoManual: (counts["REVISÃO_MANUAL"] || 0) + (counts.LOCALIZAR_PRODUTO || 0),
    errosApi: 0,
    classifications: counts,
  },
  catalog: { products: catalog.length, duplicateIds: [...catalogIndex.duplicateIds] },
  integrations,
  inventory,
};

fs.mkdirSync(outputDir, { recursive: true });
const jsonFile = path.join(outputDir, "relatorio-auditoria-publicacoes.json");
const mdFile = path.join(outputDir, "RELATORIO-AUDITORIA-PUBLICACOES.md");
fs.writeFileSync(jsonFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(mdFile, markdown(report), "utf8");
console.log(JSON.stringify({ jsonFile, mdFile, summary: report.summary, integrations }, null, 2));

function discoverScheduleFiles() {
  const dataRoot = path.join(root, "dados");
  const files = [];
  for (const entry of fs.readdirSync(dataRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("social-videos-")) continue;
    const dir = path.join(dataRoot, entry.name);
    for (const file of fs.readdirSync(dir)) {
      if (/^calendario.*\.json$/i.test(file)) files.push(path.join(dir, file));
    }
  }
  return files.sort();
}

function readDeliveryLogs(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)) {
    try {
      const record = JSON.parse(line);
      if (record?.campaign?.id) map.set(record.campaign.id, record);
    } catch {}
  }
  return map;
}

function integrationStatus() {
  const webhook = Boolean(process.env.SOCIAL_PUBLISH_WEBHOOK_URL);
  const reason = webhook
    ? "Webhook generico configurado; a rede final depende do provedor externo e deve ser confirmada pelo log de resposta."
    : "INTEGRAÇÃO NÃO DISPONÍVEL: sem webhook/credenciais no ambiente e sem SDK direto no repositorio.";
  return {
    webhook: webhook ? "CONFIGURADO" : "INTEGRAÇÃO NÃO DISPONÍVEL",
    networks: Object.fromEntries(["Facebook", "Instagram", "TikTok", "YouTube Shorts", "WhatsApp"].map(name => [name, reason])),
    marketplaces: {
      MercadoLivre: "Catalogo local e links suportados; API autenticada nao configurada neste checkout.",
      Shopee: "Catalogo local e links suportados; API autenticada nao configurada neste checkout.",
      Amazon: "Catalogo local e links suportados; API autenticada nao configurada neste checkout.",
    },
  };
}

function markdown(report) {
  const s = report.summary;
  const classes = Object.entries(s.classifications).sort((a, b) => b[1] - a[1]).map(([name, count]) => `- ${name}: ${count}`).join("\n");
  const execution = report.mode.startsWith("apply-safe")
    ? `${s.agendamentosCancelados} agendamentos inequivocamente inseguros foram cancelados somente na fila local. Nenhuma publicação ou exclusão externa foi executada.`
    : "Nenhuma exclusão, cancelamento ou publicação foi executada.";
  return `# Auditoria de publicações Impacto360\n\nGerado em ${report.generatedAt}. Modo: **${report.mode}**. ${execution}\n\n## Resumo\n\n- Publicações/itens de agenda analisados: ${s.publicacoesAnalisadas}\n- Corretos: ${s.publicacoesCorretas}\n- Produtos localizados no catálogo: ${s.produtosLocalizados}\n- Agendamentos cancelados na fila local: ${s.agendamentosCancelados}\n- Casos protegidos para revisão/localização: ${s.casosRevisaoManual}\n\n## Classificação\n\n${classes || "- Nenhum item."}\n\n## Integrações\n\n- Webhook social: ${report.integrations.webhook}\n- Redes sociais: sem confirmação de API direta neste checkout; nenhum sucesso externo foi simulado.\n- Marketplaces: catálogo/links locais auditáveis; disponibilidade atual exige API autenticada ou validação live.\n\n## Regra de execução\n\nA execução automática atua apenas em itens inequívocos e depois da revalidação live. Itens ambíguos permanecem em REVISÃO_MANUAL ou LOCALIZAR_PRODUTO.\n`;
}

function countBy(items, key) {
  return items.reduce((acc, item) => { acc[item[key]] = (acc[item[key]] || 0) + 1; return acc; }, {});
}

function actionRecordedOn(item, audit) {
  if (item.publicationStatus !== "cancelado_por_auditoria" || !audit?.cancelledAt) return null;
  return {
    acao: audit.action || "CANCELAR_AGENDAMENTO",
    motivo: audit.reason || "produto_nao_cadastrado_ou_link_afiliado_nao_confirmado",
    status_anterior: audit.previousStatus || "aguardando_revisao_visual_e_link_afiliado",
    status_novo: item.publicationStatus || "",
    data: audit.cancelledAt,
    resultado: "cancelado_na_fila_local",
  };
}

function slotTime(slot) {
  return ({ 1: "07:00", 2: "13:00", 3: "19:00" })[Number(slot)] || "";
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : "";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}
