import { useState } from 'react'
import { ArrowLeft, Save, Trash2, Package, Loader2 } from 'lucide-react'
import type { Sale } from '../types'
import { upsertSale, deleteSale } from '../utils/storage'
import { formatCurrency, formatDateTime } from '../utils/helpers'

interface Props {
  sale: Sale
  onBack: () => void
  onUpdated: () => void
}

export default function SaleDetail({ sale: initialSale, onBack, onUpdated }: Props) {
  const [sale, setSale] = useState<Sale>(initialSale)
  const [changed, setChanged] = useState(false)
  const [saving, setSaving] = useState(false)

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return
    const items = sale.items.map((item, i) => {
      if (i !== idx) return item
      const newTotal = item.unitPrice * qty * (1 - item.discountPercent / 100)
      return { ...item, quantity: qty, totalPrice: newTotal }
    })
    const subtotal = items.reduce((a, i) => a + i.unitPrice * i.quantity, 0)
    const total = items.reduce((a, i) => a + i.totalPrice, 0)
    setSale({ ...sale, items, subtotal, totalDiscount: subtotal - total, total, profit: total * 0.3 })
    setChanged(true)
  }

  const removeItem = (idx: number) => {
    const items = sale.items.filter((_, i) => i !== idx)
    if (items.length === 0) return
    const subtotal = items.reduce((a, i) => a + i.unitPrice * i.quantity, 0)
    const total = items.reduce((a, i) => a + i.totalPrice, 0)
    setSale({ ...sale, items, subtotal, totalDiscount: subtotal - total, total, profit: total * 0.3 })
    setChanged(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertSale(sale)
      setChanged(false)
      onUpdated()
    } catch (err) {
      if (import.meta.env.DEV) console.error(err)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta venta?')) return
    try {
      await deleteSale(sale.id)
      onUpdated()
      onBack()
    } catch (err) {
      if (import.meta.env.DEV) console.error(err)
      alert('Error al eliminar la venta')
    }
  }

  const methodLabel: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-sm">Detalle de Venta</h2>
          <p className="text-xs text-gray-500">{formatDateTime(sale.createdAt)}</p>
        </div>
        <button onClick={handleDelete} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-white border-b grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Cajero</p>
            <p className="font-semibold text-gray-800">{sale.cashier}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Método de pago</p>
            <p className="font-semibold text-gray-800">{methodLabel[sale.paymentMethod]}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Monto recibido</p>
            <p className="font-semibold text-gray-800">{formatCurrency(sale.amountReceived)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Cambio</p>
            <p className="font-semibold text-gray-800">{formatCurrency(sale.change)}</p>
          </div>
        </div>

        <div className="px-4 py-3 bg-white mt-2">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package size={16} /> Productos vendidos
          </p>
          <div className="space-y-3">
            {sale.items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.barcode}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Precio: {formatCurrency(item.unitPrice)}
                      {item.discountPercent > 0 && <span className="ml-1 text-orange-600">(-{item.discountPercent}%)</span>}
                    </p>
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(idx, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border rounded-lg text-sm hover:bg-gray-50"
                    >–</button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                      className="w-12 text-center border rounded-lg py-1 text-sm font-bold focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => updateQty(idx, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border rounded-lg text-sm hover:bg-gray-50"
                    >+</button>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 bg-white mt-2 space-y-2 mb-20">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Descuento</span>
              <span>-{formatCurrency(sale.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span>
            <span className="text-blue-700">{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-700 font-medium">
            <span>Ganancia estimada</span>
            <span>{formatCurrency(sale.profit)}</span>
          </div>
        </div>
      </div>

      {changed && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}
