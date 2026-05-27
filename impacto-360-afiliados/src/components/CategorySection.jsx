import { BookOpen, Footprints, Gamepad2, Home, Laptop, Package, Shirt, Wrench } from 'lucide-react'

const icons = {
  BookOpen,
  Laptop,
  Home,
  Wrench,
  Gamepad2,
  Footprints,
  Shirt,
  Package,
}

export function CategorySection({ categories, setPage, setSelectedCategory }) {
  const openCategory = (category) => {
    setSelectedCategory(category.nome)
    setPage('categoria')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-orange-600">Departamentos</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Catálogo organizado por categoria</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = icons[category.icone] || Package
          return (
            <button
              key={category.id}
              onClick={() => openCategory(category)}
              className="focus-ring rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-impact"
            >
              <Icon className="text-orange-600" size={28} />
              <span className="mt-4 block text-lg font-black text-slate-950">{category.nome}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{category.descricao}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
