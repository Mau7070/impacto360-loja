import { MessageCircle, Mail } from 'lucide-react'
import { StoreShareButtons } from '../components/StoreShareButtons'

export function Contato() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-xs font-black uppercase text-orange-600">Contato</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Fale com a Impacto 360</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        Para dúvidas sobre recomendações, parcerias ou ajustes na vitrine, use os canais abaixo.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href="mailto:contato@seudominio.com" className="focus-ring rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-orange-200">
          <Mail className="text-orange-600" />
          <span className="mt-4 block text-xl font-black text-slate-950">E-mail</span>
          <span className="mt-2 block text-slate-600">contato@seudominio.com</span>
        </a>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" className="focus-ring rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-orange-200">
          <MessageCircle className="text-orange-600" />
          <span className="mt-4 block text-xl font-black text-slate-950">WhatsApp</span>
          <span className="mt-2 block text-slate-600">Abrir conversa</span>
        </a>
      </div>
      <div className="mt-10">
        <StoreShareButtons />
      </div>
    </main>
  )
}
