import { useState, useRef } from 'react'
import { ArrowLeft, Camera, X, Barcode, Percent, Calendar, Package, DollarSign, AlertTriangle, Loader2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { Product } from '../types'
import { upsertProduct } from '../utils/storage'
import { formatDate } from '../utils/helpers'

interface Props {
  product?: Product
  onBack: () => void
  onSaved: () => void
}

const empty: Omit<Product, 'id' | 'createdAt'> = {
  barcode: '',
  name: '',
  price: 0,
  stock: 0,
  hasDiscount: false,
  discountPercent: undefined,
  discountExpiry: undefined,
  imageUrl: undefined,
  lowStockThreshold: 5,
}

export default function ProductForm({ product, onBack, onSaved }: Props) {
  const isEdit = !!product
  const [form, setForm] = useState<Omit<Product, 'id' | 'createdAt'>>(
    product ? { barcode: product.barcode, name: product.name, price: product.price, stock: product.stock, hasDiscount: product.hasDiscount, discountPercent: product.discountPercent, discountExpiry: product.discountExpiry, imageUrl: product.imageUrl, lowStockThreshold: product.lowStockThreshold } : empty
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const sanitizeText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s\-\.]/g, '')

  const set = (key: keyof typeof form, value: unknown) => {
    const sanitized = (key === 'name') && typeof value === 'string'
      ? sanitizeText(value)
      : value
    setForm((prev) => ({ ...prev, [key]: sanitized }))
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE_MB = 2
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG, WEBP o GIF')
      e.target.value = ''
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`La imagen no puede superar ${MAX_SIZE_MB} MB`)
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => set('imageUrl', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.barcode.trim()) errs.barcode = 'Requerido'
    if (!form.name.trim()) errs.name = 'Requerido'
    if (form.price <= 0) errs.price = 'Debe ser mayor a 0'
    if (form.stock < 0) errs.stock = 'No puede ser negativo'
    if (form.hasDiscount && (!form.discountPercent || form.discountPercent <= 0)) {
      errs.discountPercent = 'Requerido con descuento activo'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const prod: Product = {
        id: product?.id ?? uuid(),
        createdAt: product?.createdAt ?? new Date().toISOString(),
        ...form,
      }
      await upsertProduct(prod)
      onSaved()
      onBack()
    } catch (err) {
      if (import.meta.env.DEV) console.error(err)
      alert('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-gray-900 flex-1">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          {/* Image */}
          <div className="flex flex-col items-center gap-2">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-400 overflow-hidden relative"
            >
              {form.imageUrl ? (
                <>
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); set('imageUrl', undefined) }}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <Camera size={28} className="text-gray-400" />
              )}
            </div>
            <p className="text-xs text-gray-500">Toca para agregar imagen</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          {/* Barcode */}
          <Field label="Código de Barras" Icon={Barcode} error={errors.barcode} required>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => set('barcode', e.target.value)}
              placeholder="Ej: 7501031311309"
              className={inputCls(!!errors.barcode)}
            />
          </Field>

          {/* Name */}
          <Field label="Nombre del producto" Icon={Package} error={errors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Coca-Cola 600ml"
              className={inputCls(!!errors.name)}
            />
          </Field>

          {/* Price */}
          <Field label="Precio unitario" Icon={DollarSign} error={errors.price} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price || ''}
                onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={`${inputCls(!!errors.price)} pl-8`}
              />
            </div>
          </Field>

          {/* Stock */}
          <Field label="Cantidad en stock" Icon={Package} error={errors.stock} required>
            <input
              type="number"
              min={0}
              value={form.stock || ''}
              onChange={(e) => set('stock', parseInt(e.target.value) || 0)}
              placeholder="0"
              className={inputCls(!!errors.stock)}
            />
          </Field>

          {/* Low stock threshold */}
          <Field label="Alerta stock bajo (unidades)" Icon={AlertTriangle} error={errors.lowStockThreshold}>
            <input
              type="number"
              min={1}
              value={form.lowStockThreshold || ''}
              onChange={(e) => set('lowStockThreshold', parseInt(e.target.value) || 5)}
              placeholder="5"
              className={inputCls(false)}
            />
          </Field>

          {/* Discount toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent size={18} className="text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">Descuento</span>
              </div>
              <button
                onClick={() => set('hasDiscount', !form.hasDiscount)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.hasDiscount ? 'bg-orange-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.hasDiscount ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {form.hasDiscount && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Porcentaje de descuento *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.discountPercent || ''}
                      onChange={(e) => set('discountPercent', parseFloat(e.target.value) || undefined)}
                      placeholder="Ej: 10"
                      className={`${inputCls(!!errors.discountPercent)} pr-8`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  {errors.discountPercent && <p className="text-red-500 text-xs mt-1">{errors.discountPercent}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Fecha de vencimiento del descuento (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.discountExpiry ? form.discountExpiry.split('T')[0] : ''}
                    onChange={(e) => set('discountExpiry', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className={inputCls(false)}
                  />
                </div>
              </div>
            )}
          </div>

          {isEdit && product && (
            <div className="text-xs text-gray-400 text-center pb-4">
              Agregado el {formatDate(product.createdAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, Icon, error, required, children }: {
  label: string
  Icon: React.ElementType
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        <Icon size={15} className="text-gray-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2.5 border-2 ${hasError ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-blue-500 text-sm`
}
