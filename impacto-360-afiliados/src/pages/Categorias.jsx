import { CategorySection } from '../components/CategorySection'

export function Categorias({ categories, setPage, setSelectedCategory }) {
  return (
    <main className="py-8">
      <CategorySection categories={categories} setPage={setPage} setSelectedCategory={setSelectedCategory} />
    </main>
  )
}
