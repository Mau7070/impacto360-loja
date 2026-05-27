import { AdminProductPanel } from '../components/AdminProductPanel'

export function AdminProdutos({ categories, products, setProducts }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <AdminProductPanel categories={categories} products={products} setProducts={setProducts} />
    </main>
  )
}
