import { getShareText, getStoreUrl, SITE_NAME } from '../config/siteConfig'
import { formatCurrency } from './catalogAutomation'

const affiliateNotice = 'Este conteúdo pode conter link de afiliado. Posso receber comissão pela indicação, sem custo adicional para você.'

export function generateProductCampaign(product) {
  const price = formatCurrency(product.preco)
  const hashtags = generateHashtags(product)

  return {
    titulo: `${product.nome}: opção para quem busca ${product.categoria.toLowerCase()}`,
    textoCurto: `${product.nome} pode ser uma boa opção para quem procura ${product.descricaoCurta.toLowerCase()} Confira os detalhes antes de comprar.`,
    textoPersuasivo: `Selecionamos ${product.nome} porque ele combina utilidade, preço aproximado de ${price} e proposta clara para ${product.categoria}. Veja a oferta, compare as condições e decida com calma. ${affiliateNotice}`,
    story: `${product.nome}\n${price}\nConfira antes de comprar.`,
    reelsShorts: `Gancho: procurando uma opção em ${product.categoria}? Veja ${product.nome}. Mostre benefício, preço aproximado e CTA para conferir detalhes.`,
    whatsapp: `🚀 Oferta selecionada\n\n${product.nome}\n${product.descricaoCurta}\nPreço aproximado: ${price}\n\nAcesse a loja: ${getStoreUrl()}\n\n${affiliateNotice}`,
    facebookInstagram: `${product.nome}\n\n${product.descricaoCurta}\n\nPreço aproximado: ${price}\n\nConfira os detalhes antes de comprar: ${getStoreUrl()}\n\n${affiliateNotice}\n\n${hashtags.join(' ')}`,
    hashtags,
    cta: 'Conferir detalhes na loja',
  }
}

export function generateStoreCampaign() {
  const url = getStoreUrl()

  return {
    titulo: `Conheça a ${SITE_NAME}`,
    textoCurto: getShareText(url),
    textoPersuasivo: `A ${SITE_NAME} reúne ofertas, recomendações e produtos selecionados para quem quer comparar antes de comprar. Acesse a loja, veja os departamentos e confira os detalhes com transparência. ${affiliateNotice}`,
    whatsapp: `🚀 Conheça a ${SITE_NAME}\n\nUma loja com ofertas, recomendações e produtos selecionados.\n\nAcesse: ${url}`,
    hashtags: ['#Impacto360', '#Afiliados', '#Ofertas', '#ComprasOnline', '#Achados'],
  }
}

export function generateCategoryCampaign(category, products = []) {
  const count = products.length

  return {
    titulo: `Seleção ${category.nome}`,
    textoCurto: `Confira a seleção de ${category.nome} da ${SITE_NAME}. Produtos organizados para facilitar sua comparação.`,
    textoPersuasivo: `Preparamos uma vitrine de ${category.nome} com ${count} produto(s) selecionado(s). Compare descrições, preços aproximados e ofertas antes de decidir. ${affiliateNotice}`,
    whatsapp: `📌 Seleção ${category.nome}\n\n${category.descricao}\n\nAcesse: ${getStoreUrl()}`,
    hashtags: ['#Impacto360', `#${category.nome.replace(/\s+/g, '')}`, '#Ofertas', '#Afiliados'],
  }
}

export function generateHashtags(product) {
  const base = ['#Impacto360', '#Afiliados', '#ComprasOnline']
  const tags = (product.tags || []).map((tag) => `#${String(tag).replace(/[^a-zA-Z0-9À-ÿ]/g, '')}`).filter((tag) => tag.length > 1)
  return [...new Set([...base, ...tags])].slice(0, 10)
}
