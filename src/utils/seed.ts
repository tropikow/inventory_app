import { v4 as uuid } from 'uuid'
import { upsertProduct, upsertSale } from './storage'
import type { Product, Sale } from '../types'
import { subDays, subHours, formatISO } from 'date-fns'

export async function seedDemoData(): Promise<void> {
  const products: Product[] = [
    {
      id: uuid(), barcode: '7501031311309', name: 'Coca-Cola 600ml',
      price: 1.5, stock: 48, hasDiscount: false,
      createdAt: formatISO(subDays(new Date(), 30)), lowStockThreshold: 10,
    },
    {
      id: uuid(), barcode: '7501035902009', name: 'Pepsi 600ml',
      price: 1.4, stock: 6, hasDiscount: true, discountPercent: 10,
      createdAt: formatISO(subDays(new Date(), 20)), lowStockThreshold: 10,
    },
    {
      id: uuid(), barcode: '7590001234567', name: 'Agua Mineral 1L',
      price: 0.75, stock: 24, hasDiscount: false,
      createdAt: formatISO(subDays(new Date(), 15)), lowStockThreshold: 8,
    },
    {
      id: uuid(), barcode: '7500478000069', name: 'Galletas Oreo 117g',
      price: 2.2, stock: 3, hasDiscount: false,
      createdAt: formatISO(subDays(new Date(), 10)), lowStockThreshold: 5,
    },
    {
      id: uuid(), barcode: '8710398511355', name: 'Jabón Dove 90g',
      price: 1.8, stock: 15, hasDiscount: true, discountPercent: 15,
      discountExpiry: formatISO(subDays(new Date(), -10)),
      createdAt: formatISO(subDays(new Date(), 5)), lowStockThreshold: 5,
    },
    {
      id: uuid(), barcode: '7591156000064', name: 'Jugo Hit Mango 250ml',
      price: 0.9, stock: 30, hasDiscount: false,
      createdAt: formatISO(subDays(new Date(), 7)), lowStockThreshold: 8,
    },
    {
      id: uuid(), barcode: '4005808260805', name: 'Shampoo Pantene 200ml',
      price: 4.5, stock: 8, hasDiscount: false,
      createdAt: formatISO(subDays(new Date(), 3)), lowStockThreshold: 5,
    },
  ]

  // Insertar productos
  await Promise.all(products.map(upsertProduct))

  const makeSale = (daysAgo: number, hoursAgo: number, cashier: string): Sale => {
    const p1 = products[Math.floor(Math.random() * products.length)]
    const p2 = products[Math.floor(Math.random() * products.length)]
    const items = [
      { productId: p1.id, productName: p1.name, barcode: p1.barcode, unitPrice: p1.price, quantity: 2, discountPercent: 0, totalPrice: p1.price * 2 },
      { productId: p2.id, productName: p2.name, barcode: p2.barcode, unitPrice: p2.price, quantity: 1, discountPercent: 0, totalPrice: p2.price },
    ]
    const total = items.reduce((a, i) => a + i.totalPrice, 0)
    return {
      id: uuid(), items,
      subtotal: total, totalDiscount: 0, total,
      profit: total * 0.3,
      paymentMethod: 'cash',
      amountReceived: Math.ceil(total),
      change: Math.ceil(total) - total,
      cashier,
      createdAt: formatISO(subHours(subDays(new Date(), daysAgo), hoursAgo)),
    }
  }

  const sales: Sale[] = [
    makeSale(0, 1, 'María'),  makeSale(0, 2, 'Carlos'), makeSale(0, 3, 'María'),
    makeSale(1, 1, 'Carlos'), makeSale(1, 4, 'María'),  makeSale(2, 2, 'Carlos'),
    makeSale(3, 1, 'María'),  makeSale(5, 3, 'Carlos'), makeSale(7, 2, 'María'),
    makeSale(10, 1, 'Carlos'),makeSale(14, 2, 'María'), makeSale(20, 3, 'Carlos'),
  ]

  await Promise.all(sales.map(upsertSale))
}
