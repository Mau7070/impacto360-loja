import { MessageCircle } from 'lucide-react'

export function WhatsAppButton() {
  const text = encodeURIComponent('Olá! Quero saber mais sobre as recomendações da Impacto 360 Afiliados.')

  return (
    <a
      href={`https://wa.me/?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className="focus-ring fixed bottom-4 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-impact transition hover:bg-green-600"
      aria-label="Abrir WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  )
}
