export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Impacto 360 Afiliados'
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://seudominio.com'
export const SITE_DESCRIPTION = 'Loja de afiliados com produtos selecionados, ofertas e recomendações.'
export const SHARE_MESSAGE_PREFIX = `Conheça a ${SITE_NAME}: uma loja com ofertas, recomendações e produtos selecionados. Acesse:`
export const STORE_SHARE_IMAGE = '/images/logo-afiliado-impacto360.png'

export function getStoreUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname

    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return window.location.origin
    }

    if (SITE_URL !== 'https://seudominio.com') {
      return SITE_URL
    }

    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5173'
    }
  }

  return SITE_URL
}

export function getShareText(url = getStoreUrl()) {
  return `${SHARE_MESSAGE_PREFIX} ${url}`
}
