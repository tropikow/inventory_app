import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted — use vi.hoisted so variables are available inside the factory
const { mockFrom, mockEq, mockInsert, mockUpsert, mockUpdate, mockDelete } = vi.hoisted(() => {
  const mockEq = vi.fn()
  const mockInsert = vi.fn()
  const mockUpsert = vi.fn()
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))
  const mockDelete = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn()
  return { mockFrom, mockEq, mockInsert, mockUpsert, mockUpdate, mockDelete }
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('../../lib/mappers', () => ({
  toProduct: vi.fn((row) => ({ ...row, mapped: true })),
  toSale: vi.fn((row) => ({ ...row, mapped: true })),
  toAppUser: vi.fn((row) => ({ name: row.name })),
  fromProduct: vi.fn((p) => ({ ...p })),
  fromSale: vi.fn((s) => ({ ...s })),
  fromSaleItems: vi.fn((_id, items) => items),
}))

import {
  getProducts, getProductByBarcode, upsertProduct, deleteProduct,
  getSales, deleteSale, getUser, saveUser,
} from '../../utils/storage'

beforeEach(() => {
  vi.clearAllMocks()
  mockEq.mockResolvedValue({ data: null, error: null })
  mockInsert.mockResolvedValue({ data: null, error: null })
  mockUpsert.mockResolvedValue({ data: null, error: null })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })
})

// ─── getProducts ──────────────────────────────────────────────

describe('getProducts', () => {
  it('returns mapped products from the products table', async () => {
    const rows = [{ id: '1', name: 'coca-cola' }]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    })
    const result = await getProducts()
    expect(mockFrom).toHaveBeenCalledWith('products')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: '1', mapped: true })
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    })
    await expect(getProducts()).rejects.toEqual({ message: 'DB error' })
  })
})

// ─── getProductByBarcode ──────────────────────────────────────

describe('getProductByBarcode', () => {
  it('returns a mapped product when found', async () => {
    const row = { id: '1', barcode: '7501031311309' }
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    })
    const result = await getProductByBarcode('7501031311309')
    expect(result).toMatchObject({ id: '1', mapped: true })
  })

  it('returns undefined when not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    const result = await getProductByBarcode('0000000000000')
    expect(result).toBeUndefined()
  })
})

// ─── upsertProduct ────────────────────────────────────────────

describe('upsertProduct', () => {
  it('calls upsert on the products table', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    const product = { id: 'p1', barcode: '123', name: 'test', price: 1, stock: 5, hasDiscount: false, lowStockThreshold: 3, createdAt: '' }
    await upsertProduct(product)
    expect(mockFrom).toHaveBeenCalledWith('products')
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('throws when upsert returns an error', async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'upsert error' } }),
    })
    const product = { id: 'p1', barcode: '123', name: 'test', price: 1, stock: 5, hasDiscount: false, lowStockThreshold: 3, createdAt: '' }
    await expect(upsertProduct(product)).rejects.toEqual({ message: 'upsert error' })
  })
})

// ─── deleteProduct ────────────────────────────────────────────

describe('deleteProduct', () => {
  it('calls delete with the given id', async () => {
    const mockEqResolved = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: mockEqResolved }),
    })
    await deleteProduct('prod-1')
    expect(mockFrom).toHaveBeenCalledWith('products')
    expect(mockEqResolved).toHaveBeenCalledWith('id', 'prod-1')
  })
})

// ─── getSales ─────────────────────────────────────────────────

describe('getSales', () => {
  it('selects from sales with nested sale_items', async () => {
    const rows = [{ id: 's1', sale_items: [] }]
    const mockSelectReturn = {
      order: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    const mockSelectFn = vi.fn().mockReturnValue(mockSelectReturn)
    mockFrom.mockReturnValue({ select: mockSelectFn })

    await getSales()
    expect(mockFrom).toHaveBeenCalledWith('sales')
    expect(mockSelectFn).toHaveBeenCalledWith('*, sale_items(*)')
  })

  it('returns mapped sales', async () => {
    const rows = [{ id: 's1', sale_items: [] }]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    })
    const result = await getSales()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 's1', mapped: true })
  })
})

// ─── deleteSale ───────────────────────────────────────────────

describe('deleteSale', () => {
  it('deletes from sales table by id', async () => {
    const mockEqResolved = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: mockEqResolved }),
    })
    await deleteSale('sale-1')
    expect(mockFrom).toHaveBeenCalledWith('sales')
    expect(mockEqResolved).toHaveBeenCalledWith('id', 'sale-1')
  })
})

// ─── getUser ──────────────────────────────────────────────────

describe('getUser', () => {
  it('returns the first app_user row mapped', async () => {
    const row = { id: 'u1', name: 'María', created_at: '' }
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
          }),
        }),
      }),
    })
    const result = await getUser()
    expect(result).toEqual({ name: 'María' })
  })

  it('returns default user when no row exists', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })
    const result = await getUser()
    expect(result).toEqual({ name: 'Cajero' })
  })
})

// ─── saveUser ─────────────────────────────────────────────────

describe('saveUser', () => {
  it('updates existing user when one exists', async () => {
    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEqUpdate })
    const existingRow = { id: 'u1' }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existingRow, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({ update: mockUpdateFn })

    await saveUser({ name: 'Carlos' })
    expect(mockUpdateFn).toHaveBeenCalledWith({ name: 'Carlos' })
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 'u1')
  })

  it('inserts new user when none exists', async () => {
    const mockInsertFn = vi.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({ insert: mockInsertFn })

    await saveUser({ name: 'Nuevo Cajero' })
    expect(mockInsertFn).toHaveBeenCalledWith({ name: 'Nuevo Cajero' })
  })
})
