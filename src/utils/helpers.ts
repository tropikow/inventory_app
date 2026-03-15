import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, isWithinInterval, parseISO, getWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Sale, SaleItem } from '../types'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy", { locale: es })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es })
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "HH:mm", { locale: es })
}

export function getDaySales(sales: Sale[], date: Date): Sale[] {
  return sales.filter((s) => isSameDay(parseISO(s.createdAt), date))
}

export function getWeekSales(sales: Sale[], date: Date): Sale[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return sales.filter((s) => isWithinInterval(parseISO(s.createdAt), { start, end }))
}

export function getMonthSales(sales: Sale[], date: Date): Sale[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return sales.filter((s) => isWithinInterval(parseISO(s.createdAt), { start, end }))
}

export function getYearSales(sales: Sale[], date: Date): Sale[] {
  const start = startOfYear(date)
  const end = endOfYear(date)
  return sales.filter((s) => isWithinInterval(parseISO(s.createdAt), { start, end }))
}

export function getWeekRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return `${format(start, 'dd MMM', { locale: es })} – ${format(end, 'dd MMM yyyy', { locale: es })}`
}

export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 })
}

export function sumSales(sales: Sale[]): number {
  return sales.reduce((acc, s) => acc + s.total, 0)
}

export function sumProfit(sales: Sale[]): number {
  return sales.reduce((acc, s) => acc + s.profit, 0)
}

export function calcSaleItemTotal(unitPrice: number, qty: number, discountPercent: number): number {
  const base = unitPrice * qty
  return base - (base * discountPercent) / 100
}

export function calcSaleTotals(items: SaleItem[]): { subtotal: number; totalDiscount: number; total: number } {
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
  const total = items.reduce((acc, i) => acc + i.totalPrice, 0)
  const totalDiscount = subtotal - total
  return { subtotal, totalDiscount, total }
}

export function isDiscountActive(product: { hasDiscount: boolean; discountExpiry?: string }): boolean {
  if (!product.hasDiscount) return false
  if (!product.discountExpiry) return true
  return new Date(product.discountExpiry) >= new Date()
}

export function getEffectivePrice(product: { price: number; hasDiscount: boolean; discountPercent?: number; discountExpiry?: string }): { price: number; discount: number } {
  if (isDiscountActive(product) && product.discountPercent) {
    const discounted = product.price * (1 - product.discountPercent / 100)
    return { price: discounted, discount: product.discountPercent }
  }
  return { price: product.price, discount: 0 }
}

export function groupSalesByDay(sales: Sale[]): Record<string, Sale[]> {
  return sales.reduce((acc, sale) => {
    const day = format(parseISO(sale.createdAt), 'yyyy-MM-dd')
    if (!acc[day]) acc[day] = []
    acc[day].push(sale)
    return acc
  }, {} as Record<string, Sale[]>)
}

export function groupSalesByWeek(sales: Sale[]): Record<string, Sale[]> {
  return sales.reduce((acc, sale) => {
    const date = parseISO(sale.createdAt)
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const key = format(start, 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(sale)
    return acc
  }, {} as Record<string, Sale[]>)
}
