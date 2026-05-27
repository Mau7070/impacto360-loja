import { Share2 } from 'lucide-react'
import { shareStore } from '../utils/shareStore'

export function FloatingShareButton() {
  return (
    <button
      onClick={shareStore}
      className="focus-ring fixed bottom-24 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-impact transition hover:bg-orange-600"
      aria-label="Compartilhar loja"
    >
      <Share2 size={22} />
    </button>
  )
}
