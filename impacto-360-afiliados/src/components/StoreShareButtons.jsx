import { AtSign, Briefcase, Camera, Check, Copy, MessageCircle, Send, Share2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getShareText, getStoreUrl } from '../config/siteConfig'
import { copyStoreLink, getStoreShareLinks, shareStore } from '../utils/shareStore'

export function StoreShareButtons({ compact = false }) {
  const [copied, setCopied] = useState(false)
  const storeUrl = getStoreUrl()
  const links = useMemo(() => getStoreShareLinks(storeUrl), [storeUrl])

  const copy = async () => {
    await copyStoreLink(storeUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const buttonClass = compact
    ? 'focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-800 transition hover:border-orange-200 hover:text-orange-700'
    : 'focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-700'

  return (
    <section className={compact ? '' : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'}>
      {!compact && (
        <div className="mb-4">
          <p className="text-xs font-black uppercase text-orange-600">Compartilhe esta loja</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Envie a Impacto 360 para alguém</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{getShareText(storeUrl)}</p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={copy} className={buttonClass}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Link copiado' : 'Copiar link'}
        </button>
        <a href={links.whatsapp} target="_blank" rel="noreferrer" className={buttonClass}>
          <MessageCircle size={18} />
          WhatsApp
        </a>
        <a href={links.facebook} target="_blank" rel="noreferrer" className={buttonClass}>
          <Users size={18} />
          Facebook
        </a>
        <a href={links.telegram} target="_blank" rel="noreferrer" className={buttonClass}>
          <Send size={18} />
          Telegram
        </a>
        <button onClick={async () => {
          await copy()
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
        }} className={buttonClass}>
          <Camera size={18} />
          Instagram
        </button>
        <a href={links.linkedin} target="_blank" rel="noreferrer" className={buttonClass}>
          <Briefcase size={18} />
          LinkedIn
        </a>
        <a href={links.twitter} target="_blank" rel="noreferrer" className={buttonClass}>
          <AtSign size={18} />
          X/Twitter
        </a>
        <button onClick={shareStore} className={`${buttonClass} sm:col-span-2 lg:col-span-3`}>
          <Share2 size={18} />
          Compartilhar pelo celular
        </button>
      </div>
    </section>
  )
}
