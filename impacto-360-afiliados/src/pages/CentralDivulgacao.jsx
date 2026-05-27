import { CentralDivulgacaoPanel } from '../components/CentralDivulgacaoPanel'

export function CentralDivulgacao({ categories, products }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <CentralDivulgacaoPanel categories={categories} products={products} />
    </main>
  )
}
