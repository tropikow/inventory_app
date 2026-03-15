import type { Product, Sale, SaleItem, AppUser } from '../types'
import type { ProductRow, SaleWithItems, SaleItemRow, AppUserRow } from './database.types'

// ── DB → App ─────────────────────────────────────────────────────────────────

export function toProduct(row: ProductRow): Product {
  return {
    id:                 row.id,
    barcode:            row.barcode,
    name:               row.name,
    price:              Number(row.price),
    stock:              row.stock,
    imageUrl:           row.image_url ?? undefined,
    hasDiscount:        row.has_discount,
    discountPercent:    row.discount_percent != null ? Number(row.discount_percent) : undefined,
    discountExpiry:     row.discount_expiry ?? undefined,
    lowStockThreshold:  row.low_stock_threshold,
    createdAt:          row.created_at,
  }
}

export function toSaleItem(row: SaleItemRow): SaleItem {
  return {
    productId:       row.product_id ?? '',
    productName:     row.product_name,
    barcode:         row.barcode,
    unitPrice:       Number(row.unit_price),
    quantity:        row.quantity,
    discountPercent: Number(row.discount_percent),
    totalPrice:      Number(row.total_price),
  }
}

export function toSale(row: SaleWithItems): Sale {
  return {
    id:             row.id,
    items:          (row.sale_items ?? []).map(toSaleItem),
    subtotal:       Number(row.subtotal),
    totalDiscount:  Number(row.total_discount),
    total:          Number(row.total),
    profit:         Number(row.profit),
    paymentMethod:  row.payment_method,
    amountReceived: Number(row.amount_received),
    change:         Number(row.change),
    cashier:        row.cashier,
    createdAt:      row.created_at,
  }
}

export function toAppUser(row: AppUserRow): AppUser {
  return { name: row.name }
}

// ── App → DB Insert ──────────────────────────────────────────────────────────

export function fromProduct(p: Product): Omit<ProductRow, 'created_at'> {
  return {
    id:                 p.id,
    barcode:            p.barcode,
    name:               p.name,
    price:              p.price,
    stock:              p.stock,
    image_url:          p.imageUrl ?? null,
    has_discount:       p.hasDiscount,
    discount_percent:   p.discountPercent ?? null,
    discount_expiry:    p.discountExpiry ?? null,
    low_stock_threshold: p.lowStockThreshold,
  }
}

export function fromSale(s: Sale): Omit<SaleWithItems, 'sale_items'> {
  return {
    id:              s.id,
    subtotal:        s.subtotal,
    total_discount:  s.totalDiscount,
    total:           s.total,
    profit:          s.profit,
    payment_method:  s.paymentMethod,
    amount_received: s.amountReceived,
    change:          s.change,
    cashier:         s.cashier,
    created_at:      s.createdAt,
  }
}

export function fromSaleItems(saleId: string, items: SaleItem[]): Omit<SaleItemRow, 'id'>[] {
  return items.map((i) => ({
    sale_id:          saleId,
    product_id:       i.productId || null,
    product_name:     i.productName,
    barcode:          i.barcode,
    unit_price:       i.unitPrice,
    quantity:         i.quantity,
    discount_percent: i.discountPercent,
    total_price:      i.totalPrice,
  }))
}
