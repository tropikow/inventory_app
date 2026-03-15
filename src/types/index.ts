export type PaymentMethod = 'cash' | 'transfer' | 'card'

export interface Product {
  id: string
  barcode: string
  name: string
  price: number
  stock: number
  imageUrl?: string
  hasDiscount: boolean
  discountPercent?: number
  discountExpiry?: string // ISO date string
  createdAt: string // ISO date string
  lowStockThreshold: number
}

export interface SaleItem {
  productId: string
  productName: string
  barcode: string
  unitPrice: number
  quantity: number
  discountPercent: number
  totalPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  totalDiscount: number
  total: number
  profit: number
  paymentMethod: PaymentMethod
  amountReceived: number
  change: number
  cashier: string
  createdAt: string // ISO date string
}

export interface AppUser {
  name: string
}
