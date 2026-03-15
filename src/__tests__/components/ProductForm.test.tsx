import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductForm from '../../components/ProductForm'

vi.mock('../../utils/storage', () => ({
  upsertProduct: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../utils/helpers', () => ({
  formatDate: vi.fn((s: string) => s),
}))

const defaultProps = {
  onBack: vi.fn(),
  onSaved: vi.fn(),
}

describe('ProductForm — name sanitization', () => {
  it('converts uppercase to lowercase as the user types', async () => {
    render(<ProductForm {...defaultProps} />)
    const nameInput = screen.getByPlaceholderText('Ej: Coca-Cola 600ml')
    await userEvent.type(nameInput, 'COCA COLA')
    expect(nameInput).toHaveValue('coca cola')
  })

  it('strips special characters from the name field', async () => {
    render(<ProductForm {...defaultProps} />)
    const nameInput = screen.getByPlaceholderText('Ej: Coca-Cola 600ml')
    await userEvent.type(nameInput, 'prod@uct$!')
    expect(nameInput).toHaveValue('product')
  })

  it('preserves Spanish accented characters', async () => {
    render(<ProductForm {...defaultProps} />)
    const nameInput = screen.getByPlaceholderText('Ej: Coca-Cola 600ml')
    await userEvent.type(nameInput, 'Jamón Ibérico Año')
    expect(nameInput).toHaveValue('jamón ibérico año')
  })

  it('preserves hyphens and dots in name', async () => {
    render(<ProductForm {...defaultProps} />)
    const nameInput = screen.getByPlaceholderText('Ej: Coca-Cola 600ml')
    await userEvent.type(nameInput, 'coca-cola 600ml v2.0')
    expect(nameInput).toHaveValue('coca-cola 600ml v2.0')
  })

  it('does not sanitize the barcode field', async () => {
    render(<ProductForm {...defaultProps} />)
    const barcodeInput = screen.getByPlaceholderText('Ej: 7501031311309')
    await userEvent.type(barcodeInput, 'ABC-123')
    expect(barcodeInput).toHaveValue('ABC-123')
  })
})

describe('ProductForm — validation', () => {
  it('shows validation errors when barcode is empty on submit', async () => {
    render(<ProductForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(screen.getAllByText('Requerido').length).toBeGreaterThanOrEqual(1)
  })

  it('shows error when name is empty on submit', async () => {
    render(<ProductForm {...defaultProps} />)
    await userEvent.type(screen.getByPlaceholderText('Ej: 7501031311309'), '1234567890')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(screen.getByText('Requerido')).toBeInTheDocument()
  })

  it('shows error when price is zero on submit', async () => {
    render(<ProductForm {...defaultProps} />)
    await userEvent.type(screen.getByPlaceholderText('Ej: 7501031311309'), '1234567890')
    await userEvent.type(screen.getByPlaceholderText('Ej: Coca-Cola 600ml'), 'producto')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(screen.getByText('Debe ser mayor a 0')).toBeInTheDocument()
  })
})

describe('ProductForm — editing existing product', () => {
  const existingProduct = {
    id: 'prod-1',
    barcode: '7501031311309',
    name: 'coca-cola 600ml',
    price: 1.5,
    stock: 10,
    hasDiscount: false,
    lowStockThreshold: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
  }

  it('pre-fills form fields with existing product data', () => {
    render(<ProductForm {...defaultProps} product={existingProduct} />)
    expect(screen.getByDisplayValue('7501031311309')).toBeInTheDocument()
    expect(screen.getByDisplayValue('coca-cola 600ml')).toBeInTheDocument()
  })

  it('shows "Guardar" button in edit mode', () => {
    render(<ProductForm {...defaultProps} product={existingProduct} />)
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })
})
