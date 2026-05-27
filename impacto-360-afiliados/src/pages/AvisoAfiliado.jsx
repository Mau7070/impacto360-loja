import { AffiliateDisclosure } from '../components/AffiliateDisclosure'

export function AvisoAfiliado() {
  return (
    <main className="py-12">
      <div className="mx-auto max-w-4xl px-4">
        <p className="text-xs font-black uppercase text-orange-600">Aviso de Afiliado</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Transparência nas indicações</h1>
        <div className="mt-6 grid gap-5 leading-8 text-slate-600">
          <p>Alguns botões “Ver oferta” direcionam para links de afiliado. Quando uma compra é feita por esses links, posso receber comissão pela indicação.</p>
          <p>Essa comissão não adiciona custo extra para você. As recomendações são apresentadas com linguagem honesta e sem promessa de resultado garantido.</p>
        </div>
      </div>
      <AffiliateDisclosure />
    </main>
  )
}
