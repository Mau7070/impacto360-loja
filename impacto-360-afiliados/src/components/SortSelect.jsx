export function SortSelect({ value, onChange }) {
  return (
    <label className="block">
      <span className="sr-only">Ordenar produtos</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-800 shadow-sm"
      >
        <option value="destaques">Destaques primeiro</option>
        <option value="recentes">Mais recentes</option>
        <option value="menor-preco">Menor preço</option>
        <option value="maior-preco">Maior preço</option>
        <option value="desconto">Maior desconto</option>
      </select>
    </label>
  )
}
