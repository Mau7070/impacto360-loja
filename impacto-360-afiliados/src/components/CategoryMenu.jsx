import { BookOpen, Footprints, Gamepad2, Home, Laptop, Package, Shirt, Wrench } from 'lucide-react'

const iconMap = {
  BookOpen,
  Laptop,
  Home,
  Wrench,
  Gamepad2,
  Footprints,
  Shirt,
  Package,
}

export function CategoryMenu({ categories, selectedCategory, setSelectedCategory, setPage }) {
  const openCategory = (category) => {
    setSelectedCategory(category.nome)
    setPage('categoria')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="border-y border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
        {categories.map((category) => {
          const Icon = iconMap[category.icone] || Package
          const active = selectedCategory === category.nome

          return (
            <button
              key={category.id}
              onClick={() => openCategory(category)}
              className={`focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition ${
                active ? 'bg-slate-950 text-white shadow-impact' : 'bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <Icon size={17} />
              {category.nome}
            </button>
          )
        })}
      </div>
    </div>
  )
}
