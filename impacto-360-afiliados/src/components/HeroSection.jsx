import { ArrowRight, ShieldCheck } from 'lucide-react'
import { StoreShareButtons } from './StoreShareButtons'

export function HeroSection({ setPage }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
      <div className="fade-up flex flex-col justify-center">
        <span className="w-fit rounded-lg bg-orange-50 px-4 py-2 text-xs font-black uppercase text-orange-700">
          Loja-vitrine de afiliados
        </span>
        <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Produtos selecionados para comprar com mais confiança.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          A Impacto 360 Afiliados reúne ofertas, recomendações e achados úteis em uma vitrine simples, rápida e focada em boas decisões de compra.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setPage('ofertas')}
            className="focus-ring inline-flex min-w-[240px] items-center justify-center gap-2 rounded-[10px] bg-orange-600 px-7 py-5 text-xl font-black text-white shadow-impact transition hover:bg-orange-700"
          >
            Ver melhores ofertas
            <ArrowRight size={22} />
          </button>
          <button
            onClick={() => setPage('catalogo')}
            className="focus-ring inline-flex items-center justify-center rounded-[10px] border border-slate-200 bg-white px-7 py-5 text-base font-black text-slate-900 transition hover:border-orange-200 hover:text-orange-700"
          >
            Explorar catálogo
          </button>
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm font-bold text-slate-600">
          <ShieldCheck size={20} className="text-orange-600" />
          Recomendações com aviso de afiliado, sem promessas falsas.
        </div>
      </div>

      <div className="fade-up grid content-center gap-4">
        <a
          href="#catalogo"
          onClick={(event) => {
            event.preventDefault()
            setPage('catalogo')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="focus-ring rounded-2xl border border-slate-200 bg-white p-5 shadow-impact transition hover:-translate-y-1 hover:border-blue-200"
          aria-label="Abrir catálogo da loja"
        >
          <img
            className="aspect-[4/3] w-full rounded-xl object-contain"
            src="/images/logo-afiliado-impacto360.png"
            alt="Logo Afiliado Impacto 360"
          />
        </a>
        <StoreShareButtons />
      </div>
    </section>
  )
}
