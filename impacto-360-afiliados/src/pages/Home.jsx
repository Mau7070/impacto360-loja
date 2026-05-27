import { AffiliateDisclosure } from '../components/AffiliateDisclosure'
import { CategorySection } from '../components/CategorySection'
import { HeroSection } from '../components/HeroSection'
import { OfferSection } from '../components/OfferSection'
import { ProductGrid } from '../components/ProductGrid'
import { StoreShareButtons } from '../components/StoreShareButtons'

export function Home({ products, categories, setPage, setSelectedCategory }) {
  const featured = products.filter((product) => product.destaque || product.status === 'destaque').slice(0, 4)
  const offers = products.filter((product) => product.precoAnterior > product.preco).slice(0, 4)
  const wanted = [...products].sort((a, b) => b.nota - a.nota).slice(0, 4)

  return (
    <>
      <HeroSection setPage={setPage} />
      <CategorySection categories={categories} setPage={setPage} setSelectedCategory={setSelectedCategory} />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6">
          <p className="text-xs font-black uppercase text-orange-600">Produtos em destaque</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Recomendações para começar bem</h2>
        </div>
        <ProductGrid products={featured} />
      </section>
      <OfferSection products={offers} />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6">
          <p className="text-xs font-black uppercase text-orange-600">Mais procurados</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Itens que chamam atenção pela utilidade</h2>
        </div>
        <ProductGrid products={wanted} />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {['Selecionamos produtos úteis', 'Organizamos por intenção', 'Você confere e decide'].map((title, index) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-lg font-black text-white">{index + 1}</span>
              <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">
                A curadoria prioriza clareza, categoria, preço aproximado, benefícios e links diretos para a oferta do afiliado.
              </p>
            </div>
          ))}
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <StoreShareButtons />
      </div>
      <AffiliateDisclosure />
    </>
  )
}
