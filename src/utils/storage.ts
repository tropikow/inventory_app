import { supabase } from '../lib/supabase'
import { toProduct, toSale, toAppUser, fromProduct, fromSale, fromSaleItems } from '../lib/mappers'
import type { Product, Sale, AppUser } from '../types'

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  if (error) throw error
  return data.map(toProduct)
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) throw error
  return data ? toProduct(data) : undefined
}

export async function upsertProduct(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .upsert(fromProduct(product), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Decrementa el stock de varios productos de forma eficiente
export async function decrementStock(updates: { id: string; qty: number }[]): Promise<void> {
  await Promise.all(
    updates.map(({ id, qty }) =>
      supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) return
          return supabase
            .from('products')
            .update({ stock: Math.max(0, data.stock - qty) })
            .eq('id', id)
        })
    )
  )
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toSale)
}

export async function upsertSale(sale: Sale): Promise<void> {
  // 1. Upsert cabecera de la venta
  const { error: saleError } = await supabase
    .from('sales')
    .upsert(fromSale(sale), { onConflict: 'id' })
  if (saleError) throw saleError

  // 2. Reemplazar items: borrar existentes e insertar los nuevos
  const { error: deleteError } = await supabase
    .from('sale_items')
    .delete()
    .eq('sale_id', sale.id)
  if (deleteError) throw deleteError

  if (sale.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(fromSaleItems(sale.id, sale.items))
    if (itemsError) throw itemsError
  }
}

export async function deleteSale(id: string): Promise<void> {
  // sale_items se eliminan en cascada (ON DELETE CASCADE definido en el schema)
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── App User ──────────────────────────────────────────────────────────────────

export async function getUser(): Promise<AppUser> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toAppUser(data) : { name: 'Cajero' }
}

export async function saveUser(user: AppUser): Promise<void> {
  const { data: existing } = await supabase
    .from('app_users')
    .select('id')
    .order('created_at')
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('app_users')
      .update({ name: user.name })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('app_users')
      .insert({ name: user.name })
    if (error) throw error
  }
}
