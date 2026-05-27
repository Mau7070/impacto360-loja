import { StoreShareButtons } from '../components/StoreShareButtons'

export function Sobre() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs font-black uppercase text-orange-600">Sobre</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Impacto 360 Afiliados</h1>
      <div className="mt-6 grid gap-5 leading-8 text-slate-600">
        <p>
          Esta loja-vitrine foi criada para reunir recomendações de produtos em um só lugar, com navegação simples, visual limpo e foco em decisão de compra consciente.
        </p>
        <p>
          A curadoria usa descrições claras, benefícios práticos e links de afiliado. O visitante sempre deve conferir preço, prazo, avaliações e condições finais no site do vendedor antes de comprar.
        </p>
      </div>
      <div className="mt-10">
        <StoreShareButtons />
      </div>
    </main>
  )
}
