import { ExternalLink, Eye, Star } from 'lucide-react'
import { formatCurrency, getDiscountPercent } from '../utils/catalogAutomation'

export function ProductCard({ product }) {
  const discount = getDiscountPercent(product)
  const isFeatured = product.destaque || product.status === 'destaque'

  return (
    <article className="fade-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-impact">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" src={product.imagem} alt={product.nome} />
        <span className="absolute left-3 top-3 rounded-lg bg-orange-600 px-3 py-1 text-xs font-black uppercase text-white shadow-lg">
          {isFeatured ? 'Destaque' : discount ? `${discount}% off` : 'Selecionado'}
        </span>
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-lg bg-slate-950 px-3 py-1 text-xs font-black uppercase text-white shadow-lg">
            Oferta
          </span>
        )}
      </div>
      <div className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-orange-600">{product.categoria}</p>
            <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">{product.nome}</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-sm font-black text-slate-800">
            <Star size={15} className="fill-orange-500 text-orange-500" />
            {product.nota}
          </span>
        </div>
        <p className="min-h-[48px] text-sm leading-6 text-slate-600">{product.descricaoCurta}</p>
        <ul className="grid gap-2 text-sm text-slate-600">
          {(product.tags || []).slice(0, 3).map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-600" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="text-xl font-black text-slate-950">{formatCurrency(product.preco)}</span>
            {product.precoAnterior > product.preco && (
              <span className="ml-2 text-sm font-bold text-slate-400 line-through">{formatCurrency(product.precoAnterior)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`#produto-${product.slug}`}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-800 transition hover:border-orange-200 hover:text-orange-700"
            >
              Ver produto
              <Eye size={16} />
            </a>
          <a
            href={product.linkCompra}
            target="_blank"
            rel="noreferrer sponsored"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-3 text-sm font-black text-white shadow-impact transition hover:bg-orange-700"
          >
            Comprar
            <ExternalLink size={16} />
          </a>
          </div>
        </div>
      </div>
    </article>
  )
}
