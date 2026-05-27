export function ComoComprar() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs font-black uppercase text-orange-600">Como comprar</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Escolha, confira e compre com segurança</h1>
      <div className="mt-8 grid gap-4">
        {[
          'Pesquise ou abra um departamento.',
          'Confira descrição, preço aproximado e desconto.',
          'Clique em Comprar para abrir a oferta oficial.',
          'Revise preço, prazo, avaliações e política de troca no site parceiro.',
        ].map((step, index) => (
          <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600 font-black text-white">{index + 1}</span>
            <p className="leading-7 text-slate-700">{step}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
