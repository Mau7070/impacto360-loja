export function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatCurrency(value) {
  const number = Number(value || 0)
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function getDiscountPercent(product) {
  if (!product.precoAnterior || !product.preco || product.precoAnterior <= product.preco) return 0
  return Math.round(((product.precoAnterior - product.preco) / product.precoAnterior) * 100)
}

export function getProductLink(product) {
  return [
    product.linkCompra,
    product.linkAfiliado,
    product.affiliateLink,
    product.linkComissionado,
    product.linkPlataforma,
    product.link_original_afiliado,
  ].find((link) => link && !String(link).startsWith('COLOCAR_')) || ''
}

export function resolveProductImage(product) {
  const candidates = [
    product.fotoPrincipal,
    product.imagemPrincipal,
    product.imagem,
    product.image,
    ...(Array.isArray(product.galeria) ? product.galeria : []),
    ...(Array.isArray(product.fotosExtras) ? product.fotosExtras : []),
    ...(Array.isArray(product.imagens) ? product.imagens : []),
  ].filter(Boolean)

  const src = candidates.find((image) => !String(image).includes('/assets/placeholder-produto.svg'))

  return {
    src: src || '/placeholder-produto-mercado-livre.svg',
    status: src ? product.statusImagem || 'imagem_ok' : 'imagem_manual_necessaria',
  }
}

export function isActiveProduct(product) {
  return product.status === 'ativo' || product.status === 'destaque' || product.status === 'pronto'
}

export function suggestCategory(product, categories) {
  const text = [
    product.nome,
    product.descricaoCurta,
    product.descricaoCompleta,
    Array.isArray(product.tags) ? product.tags.join(' ') : product.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const rules = [
    ['Celulares', ['smartphone', 'celular', 'iphone', 'galaxy', 'motorola', 'xiaomi', 'redmi']],
    ['Livraria', ['livro', 'leitura', 'planner', 'ebook', 'guia']],
    ['Informática', ['notebook', 'mouse', 'teclado', 'webcam', 'computador', 'ssd', 'monitor']],
    ['Games e setup gamer', ['gamer', 'console', 'rgb', 'mousepad', 'headset gamer', 'controle']],
    ['TV e áudio', ['smart tv', 'tv ', 'caixa de som', 'fone', 'audio', 'áudio']],
    ['Casa e utilidades', ['cozinha', 'utensilio', 'utensilio', 'panela', 'faca', 'organizador', 'casa']],
    ['Eletrônicos e Casa', ['eletrônico', 'smart', 'casa', 'bluetooth', 'carregador', 'caixa', 'led']],
    ['Ferramentas', ['ferramenta', 'parafusadeira', 'furadeira', 'chave', 'broca']],
    ['Brinquedos', ['brinquedo', 'criança', 'bloco', 'boneca', 'jogo']],
    ['Calçados', ['tênis', 'sapato', 'sandália', 'calçado', 'bota']],
    ['Moda', ['camiseta', 'moda', 'roupa', 'bolsa', 'calça', 'vestido']],
    ['Serviços Impacto360', ['arte digital', 'catalogo', 'catálogo', 'post', 'banner', 'curriculo', 'currículo', 'apresentacao', 'apresentação']],
  ]

  const found = rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
  const categoryNames = categories.map((category) => category.nome)

  if (found && categoryNames.includes(found[0])) return found[0]
  return categoryNames.includes('Geral') ? 'Geral' : categoryNames[0]
}

export function normalizeProduct(input, categories) {
  const now = new Date().toISOString().slice(0, 10)
  const category = input.categoria || suggestCategory(input, categories)
  const name = input.nome?.trim() || 'Produto sem nome'
  const slug = input.slug || slugify(name)

  return {
    id: input.id || `produto-${Date.now()}`,
    nome: name,
    slug,
    categoria: category,
    preco: Number(input.preco || 0),
    precoAnterior: Number(input.precoAnterior || 0),
    descricaoCurta: input.descricaoCurta || '',
    descricaoCompleta: input.descricaoCompleta || input.descricaoCurta || '',
    imagem: input.imagem || '',
    imagens: Array.isArray(input.imagens) ? input.imagens : [],
    linkCompra: input.linkCompra || input.linkAfiliado || input.affiliateLink || input.linkComissionado || input.linkPlataforma || '',
    linkAfiliado: input.linkAfiliado || input.affiliateLink || input.linkComissionado || '',
    linkComissionado: input.linkComissionado || input.linkAfiliado || input.affiliateLink || '',
    linkPrincipalFonte: input.linkPrincipalFonte || '',
    tipoLink: input.linkAfiliado || input.affiliateLink || input.linkComissionado ? 'comissionado' : 'revisar',
    statusLink: input.linkAfiliado || input.affiliateLink || input.linkComissionado ? 'link_comissionado_adicionado' : 'verificar_link',
    geraComissao: Boolean(input.linkAfiliado || input.affiliateLink || input.linkComissionado),
    origem: input.origem || 'Manual',
    codigoInterno: input.codigoInterno || slug.toUpperCase().slice(0, 16),
    tags: Array.isArray(input.tags)
      ? input.tags
      : String(input.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
    status: input.status || 'ativo',
    destaque: Boolean(input.destaque || input.status === 'destaque'),
    nota: Number(input.nota || 4.5),
    mercadoLivreStatus: input.mercadoLivreStatus || 'rascunho',
    mercadoLivreId: input.mercadoLivreId || '',
    criadoEm: input.criadoEm || now,
    atualizadoEm: now,
  }
}

export function validateProduct(product) {
  const errors = []

  if (!product.nome) errors.push('Informe o nome do produto.')
  if (!product.categoria) errors.push('Informe ou aceite a categoria sugerida.')
  if (!product.preco || product.preco <= 0) errors.push('Informe um preço válido.')
  if (!product.imagem) errors.push('Informe uma imagem.')
  if (!product.linkCompra) errors.push('Informe o link de compra.')
  if (!product.descricaoCurta) errors.push('Informe uma descrição curta.')

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function sortProducts(products, sortBy) {
  const items = [...products]

  if (sortBy === 'menor-preco') return items.sort((a, b) => a.preco - b.preco)
  if (sortBy === 'maior-preco') return items.sort((a, b) => b.preco - a.preco)
  if (sortBy === 'desconto') return items.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
  if (sortBy === 'recentes') return items.sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)))
  return items.sort((a, b) => Number(b.destaque) - Number(a.destaque))
}

export function groupProductsByCategory(products, categories) {
  return categories.map((category) => ({
    ...category,
    products: products.filter((product) => product.categoria === category.nome),
  }))
}

