import { useMemo, useState } from 'react'
import { AffiliateDisclosure } from './components/AffiliateDisclosure'
import { CategoryMenu } from './components/CategoryMenu'
import { FloatingShareButton } from './components/FloatingShareButton'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { SeoManager } from './components/SeoManager'
import { WhatsAppButton } from './components/WhatsAppButton'
import categoriasData from './data/categorias.json'
import produtosData from './data/produtos.json'
import { AdminProdutos } from './pages/AdminProdutos'
import { AvisoAfiliado } from './pages/AvisoAfiliado'
import { Catalogo } from './pages/Catalogo'
import { Categorias } from './pages/Categorias'
import { CentralDivulgacao } from './pages/CentralDivulgacao'
import { ComoComprar } from './pages/ComoComprar'
import { Contato } from './pages/Contato'
import { Departamento } from './pages/Departamento'
import { Home } from './pages/Home'
import { Ofertas } from './pages/Ofertas'
import { Privacidade } from './pages/Privacidade'
import { Sobre } from './pages/Sobre'
import { Termos } from './pages/Termos'
import { isActiveProduct, sortProducts } from './utils/catalogAutomation'
import { loadProducts, saveProducts } from './utils/localStore'

function normalize(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function App() {
  const [page, setPage] = useState('home')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortBy, setSortBy] = useState('destaques')
  const [products, setProductsState] = useState(() => loadProducts(produtosData))

  const categories = useMemo(() => categoriasData.filter((category) => category.ativa).sort((a, b) => a.ordem - b.ordem), [])

  const setProducts = (nextProducts) => {
    setProductsState(nextProducts)
    saveProducts(nextProducts)
  }

  const activeProducts = useMemo(() => products.filter(isActiveProduct), [products])

  const filteredProducts = useMemo(() => {
    const term = normalize(search.trim())

    const result = activeProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'Todas' || product.categoria === selectedCategory
      const searchable = normalize([
        product.nome,
        product.categoria,
        product.descricaoCurta,
        product.descricaoCompleta,
        (product.tags || []).join(' '),
      ].join(' '))

      return matchesCategory && (!term || searchable.includes(term))
    })

    return sortProducts(result, sortBy)
  }, [activeProducts, search, selectedCategory, sortBy])

  const selectedCategoryData = categories.find((category) => category.nome === selectedCategory) || categories[0]
  const categoryProducts = activeProducts.filter((product) => product.categoria === selectedCategoryData?.nome)

  const sharedPageProps = {
    products: filteredProducts,
    categories,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    setPage,
  }

  const pageTitle = pageTitleMap[page] || 'Catálogo premium'

  return (
    <div className="min-h-screen bg-transparent text-slate-950">
      <SeoManager title={pageTitle} />
      <Header page={page} setPage={setPage} />
      <CategoryMenu categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} setPage={setPage} />

      {page === 'home' && (
        <Home
          products={activeProducts}
          categories={categories}
          setPage={setPage}
          setSelectedCategory={setSelectedCategory}
        />
      )}
      {page === 'catalogo' && <Catalogo {...sharedPageProps} />}
      {page === 'categorias' && (
        <Categorias categories={categories} setPage={setPage} setSelectedCategory={setSelectedCategory} />
      )}
      {page === 'categoria' && <Departamento category={selectedCategoryData} products={categoryProducts} />}
      {page === 'ofertas' && <Ofertas products={activeProducts} />}
      {page === 'divulgacao' && <CentralDivulgacao categories={categories} products={activeProducts} />}
      {page === 'admin' && <AdminProdutos categories={categories} products={products} setProducts={setProducts} />}
      {page === 'sobre' && <Sobre />}
      {page === 'privacidade' && <Privacidade />}
      {page === 'termos' && <Termos />}
      {page === 'como-comprar' && <ComoComprar />}
      {page === 'aviso' && <AvisoAfiliado />}
      {page === 'contato' && <Contato />}

      {page !== 'aviso' && <AffiliateDisclosure />}
      <Footer setPage={setPage} />
      <FloatingShareButton />
      <WhatsAppButton />
    </div>
  )
}

const pageTitleMap = {
  home: 'Home',
  catalogo: 'Catálogo',
  categorias: 'Departamentos',
  categoria: 'Departamento',
  ofertas: 'Ofertas',
  divulgacao: 'Central de Divulgação',
  admin: 'Administração de produtos',
  sobre: 'Sobre',
  privacidade: 'Política de Privacidade',
  termos: 'Termos de Uso',
  'como-comprar': 'Como comprar',
  aviso: 'Aviso de Afiliado',
  contato: 'Contato',
}
