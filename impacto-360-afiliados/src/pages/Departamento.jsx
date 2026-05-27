import { ProductGrid } from '../components/ProductGrid'
import { StoreShareButtons } from '../components/StoreShareButtons'

export function Departamento({ category, products }) {
  if (!category) return null

  return (
    <main>
      <section className="relative overflow-hidden">
        <img className="absolute inset-0 h-full w-full object-cover" src={category.banner} alt="" />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-white">
          <p className="text-xs font-black uppercase text-orange-300">Departamento</p>
          <h1 className="mt-2 text-4xl font-black">{category.nome}</h1>
          <p className="mt-4 max-w-2xl leading-8 text-slate-100">{category.descricao}</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <ProductGrid products={products} />
      </section>
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <StoreShareButtons />
      </div>
    </main>
  )
}
