export function FilterBar({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {[{ nome: 'Todas' }, ...categories].map((category) => (
        <button
          key={category.nome}
          onClick={() => setSelectedCategory(category.nome)}
          className={`focus-ring whitespace-nowrap rounded-lg px-4 py-3 text-sm font-black transition ${
            selectedCategory === category.nome
              ? 'bg-orange-600 text-white shadow-impact'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:text-orange-700'
          }`}
        >
          {category.nome}
        </button>
      ))}
    </div>
  )
}
