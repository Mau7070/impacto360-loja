export const ratingFields = ["rating", "nota", "reviewRating", "avaliacao"];

export const reviewCountFields = [
  "reviewCount", "review_count", "quantidadeAvaliacoes", "totalAvaliacoes",
  "avaliacoesTotal", "numeroAvaliacoes", "opinioes", "opinions", "vendidos",
];

export const availabilityFields = ["disponibilidade", "availability", "estoque", "statusDisponibilidade"];

const legacyClaimPattern = /\b(?:nota|avalia(?:ção|cao)|estrelas?|vendidos?|vendas)\b/i;
const legacyContextPattern = /\b(?:selecionad[oa]|produto|amazon|shopee|mercado livre|parceir[oa]|indicadores?|curadoria|sinal de venda)\b/i;

export function hasLegacyCommercialClaim(value) {
  const text = String(value ?? "").trim();
  return Boolean(text) && (
    (legacyClaimPattern.test(text) && legacyContextPattern.test(text))
    || /\b\d(?:[.,]\d)?\s*estrelas?\b/i.test(text)
    || /\b(?:oferta verificada|mais vendidos?)\b/i.test(text)
    || /\b(?:oferta|produto)(?:\s+físico)?\s+selecionad[oa]\s+em\s+\d{4}-\d{2}-\d{2}\b/i.test(text)
  );
}

export function cleanLegacyCommercialText(value) {
  const source = String(value ?? "")
    .replace(/\s*(?:\||\r?\n)\s*Preço no print:[^|\r\n]*/gi, "")
    .replace(/\s*(?:\||\r?\n)\s*Avaliação visível:[^|\r\n]*/gi, "")
    .replace(/\bAvaliação\s*\/\s*observação\s*:[^.]*\.?/gi, "")
    .replace(/\bPreço\s*:[^.]*\bR\$\s*[\d.,]+[^.]*\.?/gi, "")
    .replace(/\bvisto\s+aprox\.?\s*(?:R\$\s*[\d.,]+(?:\s+a\s+R\$\s*[\d.,]+)?|Consulte o preço atual no parceiro(?:\s+a\s+R\$\s*[\d.,]+)?)\.?/gi, "")
    .replace(/\bR\$\s*[\d.,]+(?:\s+a\s+R\$\s*[\d.,]+)?(?:\s+aprox\.)?/gi, "")
    .replace(/\+?[\d.,]+\s*(?:mil)?\+?\s*vendidos?\b\s*,?/gi, "")
    .replace(/\b\d(?:[.,]\d)?\s*\/\s*5(?:\s+em\s+cerca\s+de\s+[\d.,]+\s+opiniões?)?\s*,?/gi, "")
    .replace(/\s+e\s+muito\s+vendid[oa]\b/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s*\|\s*/g, ". ")
    .replace(/\r?\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  if (!source) return "";

  return source
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => !hasLegacyCommercialClaim(sentence))
    .map(sentence => sentence
      .replace(/\s*(?:com\s+)?(?:nota|avalia(?:ção|cao))\s+\d(?:[.,]\d)?(?:\s+de\s+5)?/gi, "")
      .replace(/\s*(?:e|com)\s+[\d.,]+\s*(?:mil)?\+?\s*(?:avaliações|avaliacoes|vendidos|vendas)\b/gi, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,;:])/g, "$1")
      .trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function cleanLegacyBadge(value) {
  const badge = String(value ?? "").trim();
  if (!badge || hasLegacyCommercialClaim(badge) || /\b\d{1,3}\s*%\s*(?:off)?\b/i.test(badge)) return "";
  return badge;
}
