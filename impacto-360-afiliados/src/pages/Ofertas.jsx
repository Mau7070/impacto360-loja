import { OfferSection } from '../components/OfferSection'
import { StoreShareButtons } from '../components/StoreShareButtons'

export function Ofertas({ products }) {
  const offers = products.filter((product) => product.precoAnterior > product.preco || product.destaque)

  return (
    <main>
      <OfferSection products={offers} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <StoreShareButtons />
      </div>
    </main>
  )
}
