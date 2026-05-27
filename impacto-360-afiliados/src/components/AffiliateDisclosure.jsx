import { BadgeInfo } from 'lucide-react'

export function AffiliateDisclosure() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-950">
        <BadgeInfo className="mt-1 shrink-0" size={22} />
        <p className="leading-7">
          Este site pode conter links de afiliado. Posso receber comissão por indicações realizadas através dos links, sem custo adicional para você.
        </p>
      </div>
    </div>
  )
}
