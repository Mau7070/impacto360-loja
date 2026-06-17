import { Archive, FileText, Image, Plus, RotateCcw, Save, Sparkles, Tags, Trash2, Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalizeProduct, suggestCategory, validateProduct } from '../utils/catalogAutomation'
import { addToSyncQueue, appendLog } from '../utils/localStore'
import { prepareMercadoLivreListing } from '../utils/mercadoLivreService'

const emptyProduct = {
  nome: '',
  categoria: '',
  preco: '',
  precoAnterior: '',
  descricaoCurta: '',
  descricaoCompleta: '',
  imagem: '',
  linkCompra: '',
  linkAfiliado: '',
  linkPrincipalFonte: '',
  origem: 'Manual',
  codigoInterno: '',
  tags: '',
  status: 'ativo',
}

export function AdminProductPanel({ categories, products, setProducts }) {
  const [form, setForm] = useState(emptyProduct)
  const [message, setMessage] = useState('')

  const suggestedCategory = useMemo(() => suggestCategory(form, categories), [form, categories])

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const applySuggestion = () => {
    update('categoria', suggestedCategory)
  }

  const registerAdminSuggestion = (label) => {
    appendLog({ type: 'chatgpt_ceo_sugestao', message: `${label}: aguardando aprovacao do administrador.` })
    setMessage(`${label}: sugestao preparada. Revise os campos e clique em Salvar alteracoes para aplicar.`)
  }

  const submit = (event) => {
    event.preventDefault()
    const product = normalizeProduct(form, categories)
    const validation = validateProduct(product)

    if (!validation.valid) {
      setMessage(validation.errors.join(' '))
      appendLog({ type: 'produto_validacao', message: validation.errors.join(' ') })
      return
    }

    const prepared = prepareMercadoLivreListing(product)
    const nextProducts = [product, ...products]
    setProducts(nextProducts)
    addToSyncQueue(prepared)
    appendLog({ type: 'produto_adicionado', message: `${product.nome} adicionado e preparado para Mercado Livre.` })
    setForm(emptyProduct)
    setMessage('Produto adicionado, categorizado e colocado na fila segura de sincronização.')
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-orange-600">Administração local</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Cadastrar produto</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Os dados ficam no navegador via localStorage nesta primeira versão.</p>
        </div>
        <Plus className="text-orange-600" />
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome do produto" value={form.nome} onChange={(value) => update('nome', value)} required />
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Categoria
            <select value={form.categoria} onChange={(event) => update('categoria', event.target.value)} className="focus-ring rounded-xl border border-slate-200 px-4 py-3">
              <option value="">Usar sugestão automática</option>
              {categories.map((category) => (
                <option key={category.id} value={category.nome}>{category.nome}</option>
              ))}
            </select>
          </label>
          <Field label="Preço" type="number" value={form.preco} onChange={(value) => update('preco', value)} required />
          <Field label="Preço anterior" type="number" value={form.precoAnterior} onChange={(value) => update('precoAnterior', value)} />
          <Field label="Imagem" value={form.imagem} onChange={(value) => update('imagem', value)} required />
          <Field label="Link de compra" value={form.linkCompra} onChange={(value) => update('linkCompra', value)} />
          <Field label="Link afiliado" value={form.linkAfiliado} onChange={(value) => update('linkAfiliado', value)} />
          <Field label="Link fonte" value={form.linkPrincipalFonte} onChange={(value) => update('linkPrincipalFonte', value)} />
          <Field label="Origem" value={form.origem} onChange={(value) => update('origem', value)} />
          <Field label="Código interno" value={form.codigoInterno} onChange={(value) => update('codigoInterno', value)} />
        </div>

        <Field label="Descrição curta" value={form.descricaoCurta} onChange={(value) => update('descricaoCurta', value)} required />
        <TextArea label="Descrição completa" value={form.descricaoCompleta} onChange={(value) => update('descricaoCompleta', value)} />
        <Field label="Tags separadas por vírgula" value={form.tags} onChange={(value) => update('tags', value)} />

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <Wand2 size={18} className="text-orange-600" />
          Categoria sugerida: <strong>{suggestedCategory}</strong>
          <button type="button" onClick={applySuggestion} className="focus-ring rounded-lg bg-white px-3 py-2 font-black text-orange-700 shadow-sm">
            Aplicar sugestão
          </button>
        </div>

        {message && <p className="rounded-xl bg-orange-50 p-4 text-sm font-bold text-orange-900">{message}</p>}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ActionButton icon={Plus} label="Novo produto" onClick={() => setForm(emptyProduct)} />
          <ActionButton icon={Archive} label="Arquivar" onClick={() => registerAdminSuggestion('Arquivar produto')} />
          <ActionButton icon={Trash2} label="Mover para lixeira" onClick={() => registerAdminSuggestion('Mover para lixeira')} />
          <ActionButton icon={RotateCcw} label="Restaurar" onClick={() => registerAdminSuggestion('Restaurar produto')} />
          <ActionButton icon={Sparkles} label="Melhorar descricao" onClick={() => registerAdminSuggestion('Melhorar descricao com ChatGPT CEO')} />
          <ActionButton icon={Tags} label="Sugerir categoria" onClick={applySuggestion} />
          <ActionButton icon={Image} label="Revisar imagem" onClick={() => registerAdminSuggestion('Revisar imagem com ChatGPT CEO')} />
          <ActionButton icon={FileText} label="Gerar postagem" onClick={() => registerAdminSuggestion('Gerar postagem com ChatGPT CEO')} />
        </div>

        <button type="submit" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-4 font-black text-white shadow-impact transition hover:bg-orange-700">
          <Save size={18} />
          Salvar alteracoes
        </button>
      </form>
    </section>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-800 transition hover:border-orange-200 hover:text-orange-700">
      <Icon size={16} />
      {label}
    </button>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring rounded-xl border border-slate-200 px-4 py-3"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="4" className="focus-ring rounded-xl border border-slate-200 px-4 py-3" />
    </label>
  )
}
