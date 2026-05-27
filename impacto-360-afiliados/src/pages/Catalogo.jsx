import { FilterBar } from '../components/FilterBar'
import { ProductGrid } from '../components/ProductGrid'
import { SearchBar } from '../components/SearchBar'
import { SortSelect } from '../components/SortSelect'

export function Catalogo({ products, categories, search, setSearch, selectedCategory, setSelectedCategory, sortBy, setSortBy }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-7">
        <p className="text-xs font-black uppercase text-orange-600">Catálogo premium</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Produtos organizados por intenção de compra</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">Pesquise, filtre por departamento, ordene por preço ou desconto e abra a oferta quando encontrar uma opção interessante.</p>
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_240px]">
        <SearchBar value={search} onChange={setSearch} />
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>
      <div className="mb-5">
        <FilterBar categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
      </div>
      <ProductGrid products={products} />
    </main>
  )
}
