import { useEffect } from 'react'
import { SITE_DESCRIPTION, SITE_NAME, getStoreUrl } from '../config/siteConfig'

export function SeoManager({ title, description = SITE_DESCRIPTION }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle
    setMeta('description', description)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', getStoreUrl(), 'property')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
  }, [title, description])

  return null
}

function setMeta(name, content, attr = 'name') {
  let element = document.querySelector(`meta[${attr}="${name}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, name)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}
