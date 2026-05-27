import { getShareText, getStoreUrl, SITE_NAME, SITE_DESCRIPTION } from '../config/siteConfig'

export async function copyStoreLink(url = getStoreUrl()) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return url
  }

  const input = document.createElement('textarea')
  input.value = url
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  return url
}

export async function shareStore() {
  const url = getStoreUrl()

  if (navigator.share) {
    await navigator.share({
      title: SITE_NAME,
      text: SITE_DESCRIPTION,
      url,
    })
    return 'shared'
  }

  await copyStoreLink(url)
  return 'copied'
}

export function getStoreShareLinks(url = getStoreUrl()) {
  const text = getShareText(url)
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(url)

  return {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  }
}
