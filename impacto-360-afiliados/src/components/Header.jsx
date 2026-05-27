import { Menu, Share2, X } from 'lucide-react'
import { useState } from 'react'
import { SITE_NAME } from '../config/siteConfig'
import { shareStore } from '../utils/shareStore'

const links = [
  ['home', 'Home'],
  ['catalogo', 'Catálogo'],
  ['categorias', 'Categorias'],
  ['ofertas', 'Ofertas'],
  ['divulgacao', 'Divulgação'],
  ['admin', 'Admin'],
  ['sobre', 'Sobre'],
  ['contato', 'Contato'],
]

export function Header({ page, setPage }) {
  const [open, setOpen] = useState(false)

  const goTo = (nextPage) => {
    setPage(nextPage)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button onClick={() => goTo('home')} className="focus-ring text-left" aria-label="Abrir página inicial">
          <span className="flex items-center gap-3">
            <img
              src="/images/logo-afiliado-impacto360.png"
              alt=""
              className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-cover shadow-sm"
            />
            <span>
              <span className="block text-xl font-black tracking-normal text-slate-950">{SITE_NAME}</span>
              <span className="text-xs font-semibold uppercase text-blue-700">Catálogo premium</span>
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map(([id, label]) => (
            <button
              key={id}
              onClick={() => goTo(id)}
              className={`focus-ring rounded-lg px-3 py-2 text-sm font-bold transition ${
                page === id ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={shareStore}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-impact transition hover:bg-orange-700"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Compartilhar loja</span>
          </button>
          <button
            onClick={() => setOpen((value) => !value)}
            className="focus-ring inline-flex rounded-lg border border-slate-200 p-3 xl:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {links.map(([id, label]) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                className={`focus-ring rounded-lg px-3 py-3 text-left text-sm font-bold ${
                  page === id ? 'bg-orange-50 text-orange-700' : 'text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
