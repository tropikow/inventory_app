import { useState } from 'react'
import { X, Banknote, CreditCard, Smartphone, ArrowLeftRight, Loader2 } from 'lucide-react'
import type { PaymentMethod } from '../types'
import { formatCurrency } from '../utils/helpers'

interface Props {
  total: number
  onConfirm: (method: PaymentMethod, received: number) => void
  onClose: () => void
  saving?: boolean
}

const methods: { value: PaymentMethod; label: string; Icon: React.ElementType }[] = [
  { value: 'cash', label: 'Efectivo', Icon: Banknote },
  { value: 'transfer', label: 'Transferencia', Icon: Smartphone },
  { value: 'card', label: 'Tarjeta', Icon: CreditCard },
]

export default function PaymentModal({ total, onConfirm, onClose, saving = false }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [received, setReceived] = useState('')

  const numReceived = parseFloat(received) || 0
  const change = numReceived - total
  const isValid = numReceived >= total

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Confirmar Pago</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Total */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Total a cobrar</p>
            <p className="text-4xl font-bold text-blue-700">{formatCurrency(total)}</p>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {methods.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    method === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount received */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Monto recibido ({method === 'cash' ? 'Efectivo' : method === 'transfer' ? 'Transferencia' : 'Tarjeta'})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder={total.toFixed(2)}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-xl font-bold focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Change */}
          {numReceived > 0 && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              isValid ? (change > 0 ? 'bg-green-50' : 'bg-gray-50') : 'bg-red-50'
            }`}>
              <ArrowLeftRight size={20} className={isValid ? (change > 0 ? 'text-green-600' : 'text-gray-500') : 'text-red-500'} />
              <div>
                <p className={`text-sm font-medium ${isValid ? (change > 0 ? 'text-green-700' : 'text-gray-600') : 'text-red-600'}`}>
                  {isValid ? (change > 0 ? 'Cambio / Vuelto' : 'Pago exacto') : 'Monto insuficiente'}
                </p>
                {change > 0 && isValid && (
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(change)}</p>
                )}
                {!isValid && numReceived > 0 && (
                  <p className="text-lg font-bold text-red-600">Faltan {formatCurrency(total - numReceived)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => isValid && !saving && onConfirm(method, numReceived)}
            disabled={!isValid || saving}
            className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Guardando...' : 'Confirmar Venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
