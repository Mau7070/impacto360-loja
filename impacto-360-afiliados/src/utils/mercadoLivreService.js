import { slugify, validateProduct } from './catalogAutomation'

const categoryMap = {
  Livraria: 'MLB1196',
  Informática: 'MLB1648',
  'Eletrônicos e Casa': 'MLB1000',
  Ferramentas: 'MLB1227',
  Brinquedos: 'MLB1132',
  Calçados: 'MLB1430',
  Moda: 'MLB1430',
  Geral: 'MLB5726',
}

export function getMercadoLivreConfig() {
  return {
    clientId: import.meta.env.VITE_MERCADO_LIVRE_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_MERCADO_LIVRE_REDIRECT_URI || '',
    accessToken: import.meta.env.VITE_MERCADO_LIVRE_ACCESS_TOKEN || '',
    refreshToken: import.meta.env.VITE_MERCADO_LIVRE_REFRESH_TOKEN || '',
    sandbox: import.meta.env.VITE_MERCADO_LIVRE_SANDBOX === 'true',
    autoPublish: import.meta.env.VITE_AUTO_PUBLISH_MERCADO_LIVRE === 'true',
  }
}

export function buildMercadoLivreAuthUrl(state = 'impacto360') {
  const config = getMercadoLivreConfig()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  })

  return `https://auth.mercadolivre.com.br/authorization?${params.toString()}`
}

export function mapCategoryToMercadoLivre(categoryName) {
  return categoryMap[categoryName] || categoryMap.Geral
}

export function prepareMercadoLivreListing(product) {
  const validation = validateProduct(product)
  const mlCategory = mapCategoryToMercadoLivre(product.categoria)
  const payload = {
    title: product.nome.slice(0, 60),
    category_id: mlCategory,
    price: Number(product.preco),
    currency_id: 'BRL',
    available_quantity: 1,
    buying_mode: 'buy_it_now',
    condition: 'new',
    listing_type_id: 'gold_special',
    pictures: product.imagem ? [{ source: product.imagem }] : [],
    description: {
      plain_text: product.descricaoCompleta || product.descricaoCurta,
    },
    seller_custom_field: product.codigoInterno || slugify(product.nome),
  }

  return {
    productId: product.id,
    ready: validation.valid,
    autoPublishEnabled: getMercadoLivreConfig().autoPublish,
    errors: validation.errors,
    internalCategory: product.categoria,
    mercadoLivreCategoryId: mlCategory,
    payload,
  }
}

export async function consultarProdutoMercadoLivre(id) {
  return safePlaceholder('consultar_produto', { id })
}

export async function cadastrarProdutoMercadoLivre(product) {
  return safePlaceholder('cadastrar_produto', prepareMercadoLivreListing(product))
}

export async function atualizarProdutoMercadoLivre(product) {
  return safePlaceholder('atualizar_produto', prepareMercadoLivreListing(product))
}

export async function pausarProdutoMercadoLivre(product) {
  return safePlaceholder('pausar_produto', { productId: product.id, mercadoLivreId: product.mercadoLivreId })
}

export async function sincronizarProdutoMercadoLivre(product) {
  const prepared = prepareMercadoLivreListing(product)

  if (!prepared.ready) {
    return safePlaceholder('sincronizacao_bloqueada_validacao', prepared)
  }

  if (!prepared.autoPublishEnabled) {
    return safePlaceholder('pronto_para_publicar_um_clique', prepared)
  }

  return safePlaceholder('publicacao_automatica_preparada', prepared)
}

function safePlaceholder(action, payload) {
  return {
    ok: true,
    mode: 'safe_frontend_placeholder',
    action,
    message: 'Estrutura preparada. A chamada real deve ocorrer em backend seguro com OAuth e tokens protegidos.',
    payload,
    createdAt: new Date().toISOString(),
  }
}
