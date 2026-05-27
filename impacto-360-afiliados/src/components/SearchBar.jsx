import { Search } from 'lucide-react'

export function SearchBar({ value, onChange }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar produto, categoria ou benefício"
        className="focus-ring w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base font-semibold text-slate-900 shadow-sm"
      />
    </label>
  )
}
