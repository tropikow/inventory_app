import { describe, it, expect } from 'vitest'
import {
  toProduct, toSaleItem, toSale, toAppUser,
  fromProduct, fromSale, fromSaleItems,
} from '../../lib/mappers'
import type { ProductRow, SaleItemRow, SaleWithItems, AppUserRow } from '../../lib/database.types'
import type { Product, Sale, SaleItem } from '../../types'

// ─── Fixtures ────────────────────────────────────────────────

const productRow: ProductRow = {
  id: 'prod-1',
  barcode: '7501031311309',
  name: 'coca-cola 600ml',
  price: 1.5,
  stock: 48,
  image_url: null,
  has_discount: false,
  discount_percent: null,
  discount_expiry: null,
  low_stock_threshold: 10,
  created_at: '2026-01-01T00:00:00.000Z',
}

const productRowWithDiscount: ProductRow = {
  ...productRow,
  id: 'prod-2',
  image_url: 'https://example.com/img.png',
  has_discount: true,
  discount_percent: 15,
  discount_expiry: '2026-06-01T00:00:00.000Z',
}

const saleItemRow: SaleItemRow = {
  id: 'item-1',
  sale_id: 'sale-1',
  product_id: 'prod-1',
  product_name: 'coca-cola 600ml',
  barcode: '7501031311309',
  unit_price: 1.5,
  quantity: 2,
  discount_percent: 0,
  total_price: 3.0,
}

const saleRow: SaleWithItems = {
  id: 'sale-1',
  subtotal: 3.0,
  total_discount: 0,
  total: 3.0,
  profit: 0.9,
  payment_method: 'cash',
  amount_received: 5.0,
  change: 2.0,
  cashier: 'María',
  created_at: '2026-03-15T10:00:00.000Z',
  sale_items: [saleItemRow],
}

const appUserRow: AppUserRow = {
  id: 'user-1',
  name: 'María',
  created_at: '2026-01-01T00:00:00.000Z',
}

const product: Product = {
  id: 'prod-1',
  barcode: '7501031311309',
  name: 'coca-cola 600ml',
  price: 1.5,
  stock: 48,
  hasDiscount: false,
  lowStockThreshold: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const sale: Sale = {
  id: 'sale-1',
  items: [
    {
      productId: 'prod-1',
      productName: 'coca-cola 600ml',
      barcode: '7501031311309',
      unitPrice: 1.5,
      quantity: 2,
      discountPercent: 0,
      totalPrice: 3.0,
    },
  ],
  subtotal: 3.0,
  totalDiscount: 0,
  total: 3.0,
  profit: 0.9,
  paymentMethod: 'cash',
  amountReceived: 5.0,
  change: 2.0,
  cashier: 'María',
  createdAt: '2026-03-15T10:00:00.000Z',
}

// ─── toProduct ────────────────────────────────────────────────

describe('toProduct', () => {
  it('maps a basic product row to Product', () => {
    const result = toProduct(productRow)
    expect(result.id).toBe('prod-1')
    expect(result.barcode).toBe('7501031311309')
    expect(result.name).toBe('coca-cola 600ml')
    expect(result.price).toBe(1.5)
    expect(result.stock).toBe(48)
    expect(result.hasDiscount).toBe(false)
    expect(result.lowStockThreshold).toBe(10)
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('converts null image_url to undefined', () => {
    expect(toProduct(productRow).imageUrl).toBeUndefined()
  })

  it('converts null discount fields to undefined', () => {
    const result = toProduct(productRow)
    expect(result.discountPercent).toBeUndefined()
    expect(result.discountExpiry).toBeUndefined()
  })

  it('maps optional fields when present', () => {
    const result = toProduct(productRowWithDiscount)
    expect(result.imageUrl).toBe('https://example.com/img.png')
    expect(result.hasDiscount).toBe(true)
    expect(result.discountPercent).toBe(15)
    expect(result.discountExpiry).toBe('2026-06-01T00:00:00.000Z')
  })

  it('coerces numeric string price to number', () => {
    const row = { ...productRow, price: '2.50' as unknown as number }
    expect(typeof toProduct(row).price).toBe('number')
    expect(toProduct(row).price).toBe(2.5)
  })
})

// ─── toSaleItem ───────────────────────────────────────────────

describe('toSaleItem', () => {
  it('maps a sale item row correctly', () => {
    const result = toSaleItem(saleItemRow)
    expect(result.productId).toBe('prod-1')
    expect(result.productName).toBe('coca-cola 600ml')
    expect(result.barcode).toBe('7501031311309')
    expect(result.unitPrice).toBe(1.5)
    expect(result.quantity).toBe(2)
    expect(result.discountPercent).toBe(0)
    expect(result.totalPrice).toBe(3.0)
  })

  it('falls back to empty string when product_id is null', () => {
    const row = { ...saleItemRow, product_id: null }
    expect(toSaleItem(row).productId).toBe('')
  })

  it('coerces numeric string prices to number', () => {
    const row = { ...saleItemRow, unit_price: '1.50' as unknown as number, total_price: '3.00' as unknown as number }
    const result = toSaleItem(row)
    expect(typeof result.unitPrice).toBe('number')
    expect(typeof result.totalPrice).toBe('number')
  })
})

// ─── toSale ───────────────────────────────────────────────────

describe('toSale', () => {
  it('maps a sale row with nested items', () => {
    const result = toSale(saleRow)
    expect(result.id).toBe('sale-1')
    expect(result.subtotal).toBe(3.0)
    expect(result.totalDiscount).toBe(0)
    expect(result.total).toBe(3.0)
    expect(result.profit).toBe(0.9)
    expect(result.paymentMethod).toBe('cash')
    expect(result.amountReceived).toBe(5.0)
    expect(result.change).toBe(2.0)
    expect(result.cashier).toBe('María')
    expect(result.createdAt).toBe('2026-03-15T10:00:00.000Z')
  })

  it('maps nested sale_items array', () => {
    const result = toSale(saleRow)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].productName).toBe('coca-cola 600ml')
  })

  it('returns empty items array when sale_items is undefined', () => {
    const row = { ...saleRow, sale_items: undefined as unknown as SaleItemRow[] }
    expect(toSale(row).items).toHaveLength(0)
  })

  it('handles all payment methods', () => {
    expect(toSale({ ...saleRow, payment_method: 'transfer' }).paymentMethod).toBe('transfer')
    expect(toSale({ ...saleRow, payment_method: 'card' }).paymentMethod).toBe('card')
  })
})

// ─── toAppUser ────────────────────────────────────────────────

describe('toAppUser', () => {
  it('extracts name from row', () => {
    expect(toAppUser(appUserRow)).toEqual({ name: 'María' })
  })
})

// ─── fromProduct ──────────────────────────────────────────────

describe('fromProduct', () => {
  it('converts a Product to a DB row (without created_at)', () => {
    const result = fromProduct(product)
    expect(result.id).toBe('prod-1')
    expect(result.barcode).toBe('7501031311309')
    expect(result.name).toBe('coca-cola 600ml')
    expect(result.price).toBe(1.5)
    expect(result.stock).toBe(48)
    expect(result.has_discount).toBe(false)
    expect(result.image_url).toBeNull()
    expect(result.discount_percent).toBeNull()
    expect(result.discount_expiry).toBeNull()
    expect(result.low_stock_threshold).toBe(10)
    expect(result).not.toHaveProperty('created_at')
  })

  it('maps optional fields to null when absent', () => {
    const result = fromProduct({ ...product, imageUrl: undefined, discountPercent: undefined, discountExpiry: undefined })
    expect(result.image_url).toBeNull()
    expect(result.discount_percent).toBeNull()
    expect(result.discount_expiry).toBeNull()
  })

  it('maps optional fields when present', () => {
    const result = fromProduct({
      ...product,
      imageUrl: 'https://example.com/img.png',
      hasDiscount: true,
      discountPercent: 20,
      discountExpiry: '2026-12-31T00:00:00.000Z',
    })
    expect(result.image_url).toBe('https://example.com/img.png')
    expect(result.has_discount).toBe(true)
    expect(result.discount_percent).toBe(20)
    expect(result.discount_expiry).toBe('2026-12-31T00:00:00.000Z')
  })
})

// ─── fromSale ─────────────────────────────────────────────────

describe('fromSale', () => {
  it('converts a Sale to a DB row without sale_items', () => {
    const result = fromSale(sale)
    expect(result.id).toBe('sale-1')
    expect(result.subtotal).toBe(3.0)
    expect(result.total_discount).toBe(0)
    expect(result.total).toBe(3.0)
    expect(result.profit).toBe(0.9)
    expect(result.payment_method).toBe('cash')
    expect(result.amount_received).toBe(5.0)
    expect(result.change).toBe(2.0)
    expect(result.cashier).toBe('María')
    expect(result.created_at).toBe('2026-03-15T10:00:00.000Z')
    expect(result).not.toHaveProperty('sale_items')
  })
})

// ─── fromSaleItems ────────────────────────────────────────────

describe('fromSaleItems', () => {
  const items: SaleItem[] = [
    { productId: 'prod-1', productName: 'coca-cola 600ml', barcode: '7501031311309', unitPrice: 1.5, quantity: 2, discountPercent: 0, totalPrice: 3.0 },
    { productId: 'prod-2', productName: 'pepsi 600ml', barcode: '7501035902009', unitPrice: 1.4, quantity: 1, discountPercent: 10, totalPrice: 1.26 },
  ]

  it('maps each item with the given saleId', () => {
    const result = fromSaleItems('sale-1', items)
    expect(result).toHaveLength(2)
    expect(result[0].sale_id).toBe('sale-1')
    expect(result[1].sale_id).toBe('sale-1')
  })

  it('maps all fields correctly', () => {
    const result = fromSaleItems('sale-1', items)
    const first = result[0]
    expect(first.product_id).toBe('prod-1')
    expect(first.product_name).toBe('coca-cola 600ml')
    expect(first.barcode).toBe('7501031311309')
    expect(first.unit_price).toBe(1.5)
    expect(first.quantity).toBe(2)
    expect(first.discount_percent).toBe(0)
    expect(first.total_price).toBe(3.0)
    expect(first).not.toHaveProperty('id')
  })

  it('converts empty productId to null', () => {
    const result = fromSaleItems('sale-1', [{ ...items[0], productId: '' }])
    expect(result[0].product_id).toBeNull()
  })

  it('returns empty array for no items', () => {
    expect(fromSaleItems('sale-1', [])).toHaveLength(0)
  })

  it('is the inverse of toSaleItem (round-trip)', () => {
    const mapped = fromSaleItems('sale-1', items)
    const restored = mapped.map((r) => toSaleItem({ ...r, id: 'x', sale_id: 'sale-1' }))
    expect(restored[0].unitPrice).toBe(items[0].unitPrice)
    expect(restored[0].totalPrice).toBe(items[0].totalPrice)
    expect(restored[1].discountPercent).toBe(items[1].discountPercent)
  })
})
