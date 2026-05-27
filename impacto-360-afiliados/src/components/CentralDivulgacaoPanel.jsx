import { Clipboard, Copy, Megaphone, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getStoreUrl } from '../config/siteConfig'
import { generateCategoryCampaign, generateProductCampaign, generateStoreCampaign } from '../utils/marketingAutomation'
import { StoreShareButtons } from './StoreShareButtons'

export function CentralDivulgacaoPanel({ products, categories }) {
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [copied, setCopied] = useState('')

  const selectedProduct = products.find((product) => product.id === productId) || products[0]
  const selectedCategory = categories.find((category) => category.id === categoryId) || categories[0]
  const categoryProducts = products.filter((product) => product.categoria === selectedCategory?.nome)

  const productCampaign = useMemo(() => selectedProduct ? generateProductCampaign(selectedProduct) : null, [selectedProduct])
  const storeCampaign = useMemo(() => generateStoreCampaign(), [])
  const categoryCampaign = useMemo(() => selectedCategory ? generateCategoryCampaign(selectedCategory, categoryProducts) : null, [selectedCategory, categoryProducts])

  const copy = async (label, text) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1800)
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <Megaphone className="text-orange-600" />
          <div>
            <p className="text-xs font-black uppercase text-orange-600">Central de Divulgação</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Campanhas prontas para copiar</h1>
            <p className="mt-2 leading-7 text-slate-600">Use textos manuais agora e deixe a estrutura preparada para APIs oficiais com OAuth no futuro.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Produto
            <select value={productId} onChange={(event) => setProductId(event.target.value)} className="focus-ring rounded-xl border border-slate-200 px-4 py-3">
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.nome}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Categoria
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="focus-ring rounded-xl border border-slate-200 px-4 py-3">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.nome}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {productCampaign && <CampaignCard title="Campanha do produto" campaign={productCampaign} onCopy={copy} copied={copied} />}
        {categoryCampaign && <CampaignCard title="Campanha da categoria" campaign={categoryCampaign} onCopy={copy} copied={copied} />}
        <CampaignCard title="Campanha da loja inteira" campaign={storeCampaign} onCopy={copy} copied={copied} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Send className="text-orange-600" />
          <h2 className="text-2xl font-black text-slate-950">Compartilhar loja</h2>
        </div>
        <StoreShareButtons />
        <button
          onClick={() => copy('link-loja', getStoreUrl())}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-4 font-black text-white shadow-impact"
        >
          <Clipboard size={18} />
          Copiar link da loja
        </button>
      </section>
    </div>
  )
}

function CampaignCard({ title, campaign, onCopy, copied }) {
  const text = [
    campaign.titulo,
    campaign.textoCurto,
    campaign.textoPersuasivo,
    campaign.whatsapp,
    (campaign.hashtags || []).join(' '),
  ]
    .filter(Boolean)
    .join('\n\n')

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-5 grid gap-2">
        <button onClick={() => onCopy(title, text)} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-black text-white shadow-impact">
          <Copy size={17} />
          {copied === title ? 'Copiado' : 'Copiar campanha'}
        </button>
        <button onClick={() => onCopy(`${title}-hashtags`, (campaign.hashtags || []).join(' '))} className="focus-ring rounded-xl border border-slate-200 px-4 py-3 font-black text-slate-800">
          Copiar hashtags
        </button>
      </div>
    </article>
  )
}
