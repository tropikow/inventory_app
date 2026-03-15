import { useState, useMemo } from 'react'
import { Plus, Search, AlertTriangle, Package, ChevronRight, ArrowUpDown } from 'lucide-react'
import type { Product } from '../types'
import { formatCurrency, formatDate, isDiscountActive } from '../utils/helpers'
import ProductForm from './ProductForm'

type SortKey = 'name' | 'price' | 'stock' | 'createdAt'

interface Props {
  products: Product[]
  onRefresh: () => void
}

export default function StockList({ products, onRefresh }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)

  const lowStockItems = products.filter((p) => p.stock <= p.lowStockThreshold)

  const sorted = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.barcode.includes(query)
    )
    list = list.sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return a.name.localeCompare(b.name) * mult
      if (sortKey === 'price') return (a.price - b.price) * mult
      if (sortKey === 'stock') return (a.stock - b.stock) * mult
      return a.createdAt.localeCompare(b.createdAt) * mult
    })
    return list
  }, [products, query, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const openProduct = (product?: Product) => {
    setEditing(product)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <ProductForm
        product={editing}
        onBack={() => { setShowForm(false); setEditing(undefined) }}
        onSaved={onRefresh}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 lg:px-6 py-3 bg-white border-b space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => openProduct(undefined)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo producto</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>

        {/* Sort pills */}
        <div className="flex gap-1.5 flex-wrap">
          {(['name', 'price', 'stock', 'createdAt'] as SortKey[]).map((key) => {
            const labels: Record<SortKey, string> = { name: 'Nombre', price: 'Precio', stock: 'Stock', createdAt: 'Fecha ingreso' }
            const active = sortKey === key
            return (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[key]}
                {active && (
                  <ArrowUpDown size={10} />
                )}
              </button>
            )
          })}
          <span className="ml-auto text-xs text-gray-400 self-center hidden lg:inline">
            {sorted.length} {sorted.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="mx-4 lg:mx-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-semibold">
              {lowStockItems.length} producto{lowStockItems.length > 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-xs text-amber-600 mt-0.5 hidden lg:block">
              {lowStockItems.map((p) => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto mt-3">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Package size={48} strokeWidth={1} />
            <p className="text-sm">No hay productos</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left py-3 font-semibold pr-4 w-12"></th>
                    <th className="text-left py-3 font-semibold">Producto</th>
                    <th className="text-left py-3 font-semibold">Código</th>
                    <th className="text-right py-3 font-semibold">Precio</th>
                    <th className="text-center py-3 font-semibold">Descuento</th>
                    <th className="text-center py-3 font-semibold">Stock</th>
                    <th className="text-right py-3 font-semibold">Ingresado</th>
                    <th className="py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((product) => {
                    const isLow = product.stock <= product.lowStockThreshold
                    const discountActive = isDiscountActive(product)
                    return (
                      <tr
                        key={product.id}
                        onClick={() => openProduct(product)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                        </td>
                        <td className="py-3 text-gray-500 tabular-nums">{product.barcode}</td>
                        <td className="py-3 text-right font-medium text-gray-800">{formatCurrency(product.price)}</td>
                        <td className="py-3 text-center">
                          {discountActive ? (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                              -{product.discountPercent}%
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {isLow && <AlertTriangle size={10} />}
                            {product.stock} uds
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-500 text-xs">{formatDate(product.createdAt)}</td>
                        <td className="py-3">
                          <ChevronRight size={16} className="text-gray-400" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-gray-100">
              {sorted.map((product) => {
                const isLow = product.stock <= product.lowStockThreshold
                const discountActive = isDiscountActive(product)
                return (
                  <button
                    key={product.id}
                    onClick={() => openProduct(product)}
                    className="w-full px-4 py-3.5 bg-white flex items-center gap-3 hover:bg-gray-50 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.barcode}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-600">{formatCurrency(product.price)}</span>
                        {discountActive && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                            -{product.discountPercent}%
                          </span>
                        )}
                        <span className="text-xs text-gray-400">· {formatDate(product.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                        isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isLow && <AlertTriangle size={10} />}
                        {product.stock} uds
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
