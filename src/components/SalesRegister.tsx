import { useState, useRef, useCallback } from 'react'
import { Scan, Plus, Minus, Trash2, ShoppingCart, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { SaleItem, PaymentMethod } from '../types'
import { getProductByBarcode, upsertSale, decrementStock } from '../utils/storage'
import { formatCurrency, calcSaleItemTotal, calcSaleTotals, getEffectivePrice } from '../utils/helpers'
import PaymentModal from './PaymentModal'

interface CartItem extends SaleItem {
  stock: number
}

interface Props {
  cashier: string
  onSaleComplete?: () => void
}

export default function SalesRegister({ cashier, onSaleComplete }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanError, setScanError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [lastSale, setLastSale] = useState<{ total: number; change: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { subtotal, totalDiscount, total } = calcSaleTotals(cart)
  const itemCount = cart.reduce((a, i) => a + i.quantity, 0)

  const handleScan = useCallback(async (barcode: string) => {
    setScanError('')
    setScanning(true)
    try {
      const product = await getProductByBarcode(barcode.trim())
      if (!product) {
        setScanError(`Producto no encontrado: "${barcode}"`)
        setBarcodeInput('')
        return
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id)
        if (existing) {
          if (existing.quantity >= product.stock) {
            setScanError(`Stock insuficiente (disponible: ${product.stock})`)
            return prev
          }
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1, totalPrice: calcSaleItemTotal(i.unitPrice, i.quantity + 1, i.discountPercent) }
              : i
          )
        }
        const { price: effectivePrice, discount } = getEffectivePrice(product)
        const unitPrice = discount > 0 ? effectivePrice / (1 - discount / 100) : product.price
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            unitPrice,
            quantity: 1,
            discountPercent: discount,
            totalPrice: calcSaleItemTotal(unitPrice, 1, discount),
            stock: product.stock,
          } as CartItem,
        ]
      })
      setBarcodeInput('')
      inputRef.current?.focus()
    } catch (err) {
      setScanError('Error al buscar el producto')
      if (import.meta.env.DEV) console.error(err)
    } finally {
      setScanning(false)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) handleScan(barcodeInput)
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i
          const newQty = i.quantity + delta
          if (newQty <= 0) return null
          if (newQty > i.stock) { setScanError(`Stock máximo: ${i.stock}`); return i }
          return { ...i, quantity: newQty, totalPrice: calcSaleItemTotal(i.unitPrice, newQty, i.discountPercent) }
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const setQty = (productId: string, value: number) => {
    if (isNaN(value) || value < 1) return
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i
        const qty = Math.min(value, i.stock)
        return { ...i, quantity: qty, totalPrice: calcSaleItemTotal(i.unitPrice, qty, i.discountPercent) }
      })
    )
  }

  const removeItem = (productId: string) => setCart((prev) => prev.filter((i) => i.productId !== productId))

  const handleConfirmPayment = async (method: PaymentMethod, received: number) => {
    setSaving(true)
    try {
      const change = received - total
      const saleItems = cart.map(({ stock: _s, ...rest }) => rest)
      await upsertSale({
        id: uuid(),
        items: saleItems,
        subtotal, totalDiscount, total,
        profit: total * 0.3,
        paymentMethod: method,
        amountReceived: received,
        change, cashier,
        createdAt: new Date().toISOString(),
      })
      await decrementStock(
        cart.map((i) => ({ id: i.productId, qty: i.quantity }))
      )
      setLastSale({ total, change })
      setCart([])
      setShowPayment(false)
      onSaleComplete?.()
      inputRef.current?.focus()
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error al guardar la venta:', err)
      alert('Error al registrar la venta. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (lastSale) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-16 px-4">
        <div className="bg-green-100 rounded-full p-6">
          <CheckCircle size={56} className="text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Venta registrada!</h2>
          <p className="text-gray-500">Total cobrado: <span className="font-bold text-gray-800">{formatCurrency(lastSale.total)}</span></p>
          {lastSale.change > 0 && (
            <p className="text-lg font-bold text-green-600 mt-1">Cambio: {formatCurrency(lastSale.change)}</p>
          )}
        </div>
        <button onClick={() => setLastSale(null)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700">
          Nueva Venta
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ── Left: scanner + product table ─────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
        {/* Scanner input */}
        <div className="px-4 lg:px-6 py-3 bg-white border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Scan size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => { setBarcodeInput(e.target.value); setScanError('') }}
                onKeyDown={handleKeyDown}
                placeholder="Escanear código de barras o ingresar manualmente..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={() => barcodeInput.trim() && handleScan(barcodeInput)}
              disabled={scanning}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              {scanning ? <Loader2 size={15} className="animate-spin" /> : null}
              Agregar
            </button>
          </div>
          {scanError && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle size={14} /> {scanError}
            </div>
          )}
        </div>

        {/* Empty state */}
        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-3">
            <ShoppingCart size={52} strokeWidth={1} />
            <p className="text-sm">Escanea un producto para comenzar</p>
          </div>
        )}

        {/* Desktop table */}
        {cart.length > 0 && (
          <div className="hidden lg:flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3 font-semibold">Producto</th>
                    <th className="text-center px-4 py-3 font-semibold">Cantidad</th>
                    <th className="text-right px-4 py-3 font-semibold">P. Unitario</th>
                    <th className="text-right px-6 py-3 font-semibold">Total</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {cart.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.barcode}</p>
                        {item.discountPercent > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">
                            -{item.discountPercent}% dto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors">
                            <Minus size={13} />
                          </button>
                          <input
                            type="number" min={1} max={item.stock} value={item.quantity}
                            onChange={(e) => setQty(item.productId, parseInt(e.target.value))}
                            className="w-14 text-center py-1 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-blue-500"
                          />
                          <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors">
                            <Plus size={13} />
                          </button>
                          <span className="text-xs text-gray-400 w-10 text-left">/{item.stock}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-gray-700">{formatCurrency(item.unitPrice)}</p>
                        {item.discountPercent > 0 && (
                          <p className="text-xs text-orange-600 font-medium">-{item.discountPercent}%</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                        {item.discountPercent > 0 && (
                          <p className="text-xs text-gray-400 line-through">{formatCurrency(item.unitPrice * item.quantity)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <button onClick={() => removeItem(item.productId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile card list */}
        {cart.length > 0 && (
          <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.productId} className="px-4 py-3 bg-white">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.barcode}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">Precio unit.: {formatCurrency(item.unitPrice)}</span>
                      {item.discountPercent > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">-{item.discountPercent}%</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-8 h-8 flex items-center justify-center border-2 border-gray-200 rounded-lg">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number" min={1} max={item.stock} value={item.quantity}
                      onChange={(e) => setQty(item.productId, parseInt(e.target.value))}
                      className="w-14 text-center py-1 border-2 border-gray-200 rounded-lg font-bold focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={() => updateQty(item.productId, 1)} className="w-8 h-8 flex items-center justify-center border-2 border-gray-200 rounded-lg">
                      <Plus size={14} />
                    </button>
                    <span className="text-xs text-gray-400">/ {item.stock}</span>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile summary */}
        {cart.length > 0 && (
          <div className="lg:hidden bg-white border-t px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({itemCount} items)</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Descuento</span><span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900">
              <span>Total</span><span className="text-blue-700">{formatCurrency(total)}</span>
            </div>
            <button onClick={() => setShowPayment(true)} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700">
              Cobrar {formatCurrency(total)}
            </button>
          </div>
        )}
      </div>

      {/* ── Right: order summary panel (desktop only) ──────── */}
      <aside className="hidden lg:flex flex-col w-80 xl:w-96 bg-white shrink-0">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600" />
            Resumen del pedido
            {itemCount > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
              <ShoppingCart size={40} strokeWidth={1} />
              <p className="text-sm">Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-gray-400 text-xs">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="font-semibold text-gray-900 shrink-0">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-5 space-y-2 bg-gray-50">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-orange-600 font-medium">
              <span>Descuento total</span><span>-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl border-t pt-3 text-gray-900">
            <span>Total</span>
            <span className="text-blue-700">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={() => cart.length > 0 && setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full mt-2 py-4 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {cart.length === 0 ? 'Carrito vacío' : `Cobrar ${formatCurrency(total)}`}
          </button>
        </div>
      </aside>

      {showPayment && (
        <PaymentModal total={total} onConfirm={handleConfirmPayment} onClose={() => setShowPayment(false)} saving={saving} />
      )}
    </div>
  )
}
