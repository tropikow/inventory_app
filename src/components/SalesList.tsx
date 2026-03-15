import { useState, useMemo } from 'react'
import { ChevronRight, TrendingUp, Calendar, Clock, DollarSign, ArrowUpRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Sale } from '../types'
import {
  formatCurrency, formatDate, formatTime,
  getDaySales, getWeekSales, getMonthSales, getYearSales,
  groupSalesByDay, groupSalesByWeek, getWeekRange, sumSales, sumProfit
} from '../utils/helpers'
import SaleDetail from './SaleDetail'

type Filter = 'day' | 'week' | 'month' | 'year'

interface Props {
  sales: Sale[]
  onRefresh: () => void
}

const methodLabel: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }
const methodColor: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  transfer: 'bg-blue-100 text-blue-700',
  card: 'bg-purple-100 text-purple-700',
}

export default function SalesList({ sales, onRefresh }: Props) {
  const [filter, setFilter] = useState<Filter>('day')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null)
  const today = new Date()

  const filtered = useMemo(() => {
    if (filter === 'day') return getDaySales(sales, today)
    if (filter === 'week') return getWeekSales(sales, today)
    if (filter === 'month') return getMonthSales(sales, today)
    return getYearSales(sales, today)
  }, [sales, filter])

  if (selectedSale) {
    return (
      <SaleDetail
        sale={selectedSale}
        onBack={() => { setSelectedSale(null); onRefresh() }}
        onUpdated={onRefresh}
      />
    )
  }

  const filters: { value: Filter; label: string }[] = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ]

  if (filter === 'week' && selectedWeekKey) {
    const weekSales = groupSalesByWeek(filtered)[selectedWeekKey] || []
    const dayGroups = groupSalesByDay(weekSales)
    const days = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a))
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 lg:px-6 py-3 bg-white border-b flex items-center gap-3">
          <button onClick={() => setSelectedWeekKey(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
            ← Semanas
          </button>
          <div>
            <h3 className="font-bold text-gray-900">Detalle de semana</h3>
            <p className="text-xs text-gray-500">{getWeekRange(parseISO(selectedWeekKey))}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-bold text-blue-700">{formatCurrency(sumSales(weekSales))}</p>
            <p className="text-xs text-green-600">{formatCurrency(sumProfit(weekSales))} ganancia</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {days.map((day) => {
            const daySales = dayGroups[day]
            return (
              <div key={day} className="border-b">
                <div className="px-4 lg:px-6 py-2.5 bg-gray-50 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700 capitalize">
                    {format(parseISO(day), 'EEEE dd/MM', { locale: es })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{daySales.length} ventas</span>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(sumSales(daySales))}</span>
                  </div>
                </div>
                {daySales.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="w-full px-4 lg:px-6 py-3 bg-white flex items-center gap-4 hover:bg-gray-50 border-t first:border-t-0 text-left"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Clock size={15} className="text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{sale.cashier}</p>
                      <p className="text-xs text-gray-400">{formatTime(sale.createdAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodColor[sale.paymentMethod]}`}>
                      {methodLabel[sale.paymentMethod]}
                    </span>
                    <span className="font-bold text-gray-900">{formatCurrency(sale.total)}</span>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 lg:px-6 py-3 bg-white border-b flex items-center gap-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setFilter(value); setSelectedWeekKey(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === value ? 'bg-white shadow text-blue-700' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
            <DollarSign size={15} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">{formatCurrency(sumSales(filtered))}</span>
            <span className="text-xs text-blue-500">total</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
            <ArrowUpRight size={15} className="text-green-600" />
            <span className="text-sm font-semibold text-green-800">{formatCurrency(sumProfit(filtered))}</span>
            <span className="text-xs text-green-500">ganancia</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
            <span className="text-sm font-semibold text-gray-700">{filtered.length}</span>
            <span className="text-xs text-gray-500">ventas</span>
          </div>
        </div>
      </div>

      <div className="lg:hidden px-4 py-3 bg-blue-600 text-white grid grid-cols-2 gap-3">
        <div className="bg-blue-700/50 rounded-xl p-3">
          <p className="text-xs text-blue-200 mb-0.5">Total ventas</p>
          <p className="text-xl font-bold">{formatCurrency(sumSales(filtered))}</p>
        </div>
        <div className="bg-blue-700/50 rounded-xl p-3">
          <p className="text-xs text-blue-200 mb-0.5">Ganancia est.</p>
          <p className="text-xl font-bold">{formatCurrency(sumProfit(filtered))}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <TrendingUp size={48} strokeWidth={1} />
            <p className="text-sm">No hay ventas en este período</p>
          </div>
        ) : filter === 'day' ? (
          <div>
            <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-2.5 bg-gray-50 border-b text-xs uppercase tracking-wide text-gray-500 font-semibold">
              <span>Cajero</span>
              <span>Hora</span>
              <span>Productos</span>
              <span>Método</span>
              <span>Ganancia</span>
              <span>Total</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered
                .slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="w-full text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 text-blue-700 font-bold text-sm uppercase">
                          {sale.cashier.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{sale.cashier}</span>
                      </div>
                      <span className="text-sm text-gray-500 tabular-nums">{formatTime(sale.createdAt)}</span>
                      <span className="text-sm text-gray-600">{sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${methodColor[sale.paymentMethod]}`}>
                        {methodLabel[sale.paymentMethod]}
                      </span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(sale.profit)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{formatCurrency(sale.total)}</span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="lg:hidden px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{sale.cashier}</p>
                        <p className="text-xs text-gray-400">{formatDate(sale.createdAt)} · {formatTime(sale.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sale.items.length} producto{sale.items.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(sale.total)}</p>
                        <p className="text-xs text-green-600">{formatCurrency(sale.profit)} gan.</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : filter === 'week' ? (
          <div>
            <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-2.5 bg-gray-50 border-b text-xs uppercase tracking-wide text-gray-500 font-semibold">
              <span>Semana</span>
              <span>Ventas</span>
              <span>Ganancia</span>
              <span>Total</span>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(groupSalesByWeek(filtered))
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([weekStart, weekSales]) => (
                  <button
                    key={weekStart}
                    onClick={() => setSelectedWeekKey(weekStart)}
                    className="w-full text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar size={17} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{getWeekRange(parseISO(weekStart))}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">{weekSales.length} ventas</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(sumProfit(weekSales))}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{formatCurrency(sumSales(weekSales))}</span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="lg:hidden px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar size={18} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{getWeekRange(parseISO(weekStart))}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{weekSales.length} venta{weekSales.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(sumSales(weekSales))}</p>
                        <p className="text-xs text-green-600">{formatCurrency(sumProfit(weekSales))} gan.</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : filter === 'month' ? (
          <div>
            {Object.entries(groupSalesByDay(filtered))
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([day, daySales]) => (
                <div key={day} className="border-b">
                  <div className="px-4 lg:px-6 py-2.5 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {format(parseISO(day), 'EEEE dd/MM', { locale: es })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="hidden lg:inline text-xs text-gray-500">{daySales.length} ventas</span>
                      <span className="hidden lg:inline text-xs text-green-600 font-medium">{formatCurrency(sumProfit(daySales))} gan.</span>
                      <span className="text-sm font-bold text-gray-800">{formatCurrency(sumSales(daySales))}</span>
                    </div>
                  </div>
                  {daySales.map((sale) => (
                    <button
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="w-full px-4 lg:px-6 py-3 bg-white flex items-center gap-4 hover:bg-gray-50 border-t first:border-t-0 text-left"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{sale.cashier}</p>
                        <p className="text-xs text-gray-400">{formatTime(sale.createdAt)}</p>
                      </div>
                      <span className={`hidden lg:inline text-xs px-2 py-0.5 rounded-full font-medium ${methodColor[sale.paymentMethod]}`}>
                        {methodLabel[sale.paymentMethod]}
                      </span>
                      <span className="hidden lg:inline text-xs text-green-600 font-medium">{formatCurrency(sale.profit)}</span>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(sale.total)}</span>
                      <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              ))}
          </div>
        ) : (
          <div>
            <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-2.5 bg-gray-50 border-b text-xs uppercase tracking-wide text-gray-500 font-semibold">
              <span>Mes</span>
              <span>Ventas</span>
              <span>Ganancia</span>
              <span>Total</span>
            </div>
            {Object.entries(
              filtered.reduce((acc, s) => {
                const m = format(parseISO(s.createdAt), 'yyyy-MM')
                if (!acc[m]) acc[m] = []
                acc[m].push(s)
                return acc
              }, {} as Record<string, Sale[]>)
            )
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthSales]) => (
                <div key={month} className="border-b">
                  <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-4">
                    <p className="font-semibold text-gray-900 capitalize">
                      {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: es })}
                    </p>
                    <span className="text-sm text-gray-600">{monthSales.length} ventas</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(sumProfit(monthSales))}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(sumSales(monthSales))}</span>
                  </div>
                  <div className="lg:hidden px-4 py-3.5 flex justify-between items-center">
                    <p className="font-semibold text-gray-900 capitalize">
                      {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: es })}
                    </p>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(sumSales(monthSales))}</p>
                      <p className="text-xs text-gray-500">{monthSales.length} ventas</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
