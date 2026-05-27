import { SITE_DESCRIPTION, SITE_NAME } from '../config/siteConfig'
import { StoreShareButtons } from './StoreShareButtons'

export function Footer({ setPage }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 className="text-2xl font-black text-slate-950">{SITE_NAME}</h2>
          <p className="mt-3 max-w-xl leading-7 text-slate-600">{SITE_DESCRIPTION}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
            <button onClick={() => setPage('privacidade')} className="hover:text-orange-700">Política de Privacidade</button>
            <button onClick={() => setPage('termos')} className="hover:text-orange-700">Termos de Uso</button>
            <button onClick={() => setPage('como-comprar')} className="hover:text-orange-700">Como comprar</button>
            <button onClick={() => setPage('aviso')} className="hover:text-orange-700">Aviso de Afiliado</button>
            <button onClick={() => setPage('contato')} className="hover:text-orange-700">Contato</button>
          </div>
        </div>
        <StoreShareButtons compact />
      </div>
    </footer>
  )
}
