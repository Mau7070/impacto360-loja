import { ProductGrid } from './ProductGrid'

export function OfferSection({ products }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase text-orange-600">Ofertas</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Achados com boa intenção de compra</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">Confira os detalhes antes de comprar e compare o custo-benefício de cada opção.</p>
        </div>
      </div>
      <ProductGrid products={products} />
    </section>
  )
}
