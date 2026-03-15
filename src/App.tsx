import { useState, useCallback, useEffect } from 'react'
import { ShoppingCart, BarChart2, Package, Settings, Loader2 } from 'lucide-react'
import './index.css'
import SalesRegister from './components/SalesRegister'
import SalesList from './components/SalesList'
import StockList from './components/StockList'
import AuthScreen from './components/AuthScreen'
import { getProducts, getSales, getUser, saveUser } from './utils/storage'
import { seedDemoData } from './utils/seed'
import { supabase } from './lib/supabase'
import type { Product, Sale } from './types'

type Tab = 'sales' | 'history' | 'stock' | 'settings'

const tabs = [
  { id: 'sales' as Tab, label: 'Venta', Icon: ShoppingCart },
  { id: 'history' as Tab, label: 'Ventas', Icon: BarChart2 },
  { id: 'stock' as Tab, label: 'Stock', Icon: Package },
  { id: 'settings' as Tab, label: 'Ajustes', Icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('sales')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cashier, setCashier] = useState('')
  const [editingName, setEditingName] = useState('')
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Check existing Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session)
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [prods, salesData, user] = await Promise.all([
        getProducts(),
        getSales(),
        getUser(),
      ])
      setProducts(prods)
      setSales(salesData)
      setCashier(user.name)
      setEditingName(user.name)
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error cargando datos:', err)
      setDbError('No se pudo conectar con Supabase. Verifica tus credenciales en el archivo .env')
    }
  }, [])

  // Load data only when the user is authenticated
  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [loadData, authenticated])

  const saveName = async () => {
    const name = editingName.trim() || 'Cajero'
    try {
      await saveUser({ name })
      setCashier(name)
      setShowNameEdit(false)
    } catch (err) {
      if (import.meta.env.DEV) console.error(err)
      alert('Error al guardar el nombre')
    }
  }

  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold).length

  // ── Auth / Loading screens ─────────────────────────────
  if (!authChecked || (loading && authenticated)) {
    return (
      <div className="flex items-center justify-center h-svh bg-blue-700 gap-3 text-white">
        <Loader2 size={28} className="animate-spin" />
        <span className="text-lg font-medium">Cargando...</span>
      </div>
    )
  }

  if (!authenticated) {
    return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />
  }

  if (dbError) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-gray-50 gap-4 px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Package size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Error de conexión</h2>
        <p className="text-gray-600 max-w-sm text-sm">{dbError}</p>
        <code className="bg-gray-100 text-xs text-gray-700 px-3 py-2 rounded-lg text-left block max-w-sm w-full">
          VITE_SUPABASE_URL=https://xxx.supabase.co{'\n'}
          VITE_SUPABASE_ANON_KEY=eyJ...
        </code>
        <button
          onClick={() => { setDbError(null); setLoading(true); loadData().finally(() => setLoading(false)) }}
          className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-svh bg-gray-100">
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 bg-blue-700 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-blue-600">
          <ShoppingCart size={22} className="text-white" />
          <span className="font-bold text-white text-lg tracking-tight">VentaApp</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {tabs.map(({ id, label, Icon }) => {
            const badge = id === 'stock' && lowStock > 0 ? lowStock : null
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-blue-600'
                }`}
              >
                <div className="relative">
                  <Icon size={19} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                {label}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
              {cashier.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{cashier}</p>
              <p className="text-blue-300 text-xs">Cajero</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-blue-700 text-white shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <span className="font-bold text-base tracking-tight">VentaApp</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold uppercase">
              {cashier.charAt(0)}
            </div>
            <span className="text-sm font-medium">{cashier}</span>
          </div>
        </header>

        {/* Desktop page header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b shrink-0">
          <h1 className="text-xl font-bold text-gray-900">
            {tabs.find((t) => t.id === tab)?.label}
          </h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {tab === 'sales' && (
            <SalesRegister cashier={cashier} onSaleComplete={loadData} />
          )}
          {tab === 'history' && (
            <SalesList sales={sales} onRefresh={loadData} />
          )}
          {tab === 'stock' && (
            <StockList products={products} onRefresh={loadData} />
          )}
          {tab === 'settings' && (
            <div className="h-full overflow-y-auto px-4 lg:px-8 py-6">
              <div className="max-w-lg space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">Nombre del cajero</p>
                      <p className="text-sm text-gray-500 mt-0.5">{cashier}</p>
                    </div>
                    <button
                      onClick={() => setShowNameEdit(true)}
                      className="px-3 py-1.5 text-sm text-blue-600 font-medium border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                  <p className="font-semibold text-gray-800 mb-1">Resumen de datos</p>
                  <p className="text-sm text-gray-500">{products.length} productos · {sales.length} ventas</p>
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm('¿Cargar datos de demostración? Esto insertará productos y ventas de ejemplo en Supabase.')) return
                    try {
                      await seedDemoData()
                      await loadData()
                    } catch (err) {
                      if (import.meta.env.DEV) console.error(err)
                      alert('Error al cargar los datos de demo')
                    }
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
                >
                  Cargar datos de demo en Supabase
                </button>
              </div>

              {showNameEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
                    <h3 className="font-bold text-gray-900">Editar nombre</h3>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveName()}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button onClick={() => setShowNameEdit(false)} className="flex-1 py-2.5 border rounded-xl font-medium text-gray-600">
                        Cancelar
                      </button>
                      <button onClick={saveName} className="flex-1 py-2.5 bg-blue-600 rounded-xl font-medium text-white">
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex border-t border-gray-200 bg-white shrink-0">
          {tabs.map(({ id, label, Icon }) => {
            const badge = id === 'stock' && lowStock > 0 ? lowStock : null
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
                  tab === id ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={tab === id ? 2 : 1.5} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                {label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
