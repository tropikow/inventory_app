import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthScreen from '../../components/AuthScreen'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

import { supabase } from '../../lib/supabase'

const signIn = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>
const signUp = supabase.auth.signUp as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  signIn.mockResolvedValue({ error: null })
  signUp.mockResolvedValue({ error: null })
})

// ─── Login view ───────────────────────────────────────────────

describe('LoginView', () => {
  it('renders login form by default', () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    expect(screen.getByText('Bienvenido')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('shows error when submitting with empty email', async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.getByText('El correo es requerido')).toBeInTheDocument()
  })

  it('shows error for invalid email format', async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), 'noesunemail')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.getByText('Correo inválido')).toBeInTheDocument()
  })

  it('shows error when password is empty', async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), 'test@test.com')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
  })

  it('calls onAuthenticated on successful login', async () => {
    const onAuthenticated = vi.fn()
    render(<AuthScreen onAuthenticated={onAuthenticated} />)
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
  })

  it('sends trimmed lowercase email to Supabase', async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), '  User@TEST.com  ')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret123' })
    )
  })

  it('shows auth error message on failed login', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), 'user@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() =>
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeInTheDocument()
    )
  })

  it('navigates to forgot password view', async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.click(screen.getByText(/olvidaste tu contraseña/i))
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument()
  })

  it('navigates to register view', async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.click(screen.getByText('Crear cuenta'))
    expect(screen.getByText('Crear cuenta', { selector: 'h2' })).toBeInTheDocument()
  })
})

// ─── Forgot password view ─────────────────────────────────────

describe('ForgotView', () => {
  const openForgot = async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.click(screen.getByText(/olvidaste tu contraseña/i))
  }

  it('shows error when submitting empty email', async () => {
    await openForgot()
    await userEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }))
    expect(screen.getByText('El correo es requerido')).toBeInTheDocument()
  })

  it('shows error for invalid email', async () => {
    await openForgot()
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), 'notanemail')
    await userEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }))
    expect(screen.getByText('Correo inválido')).toBeInTheDocument()
  })

  it('shows success message after valid submission', async () => {
    await openForgot()
    await userEvent.type(screen.getByPlaceholderText('tu@correo.com'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }))
    await waitFor(() =>
      expect(screen.getByText('Solicitud recibida')).toBeInTheDocument()
    )
    expect(screen.getByText(/el equipo está revisando tu caso/i)).toBeInTheDocument()
  })

  it('back button returns to login', async () => {
    await openForgot()
    await userEvent.click(screen.getByText('Volver'))
    expect(screen.getByText('Bienvenido')).toBeInTheDocument()
  })
})

// ─── Register view ────────────────────────────────────────────

describe('RegisterView', () => {
  const openRegister = async () => {
    render(<AuthScreen onAuthenticated={vi.fn()} />)
    await userEvent.click(screen.getByText('Crear cuenta'))
  }

  const fillRegisterForm = async (overrides: Record<string, string> = {}) => {
    const data = {
      email: 'new@test.com',
      emailConfirm: 'new@test.com',
      password: 'secret123',
      passwordConfirm: 'secret123',
      phone: '5512345678',
      ...overrides,
    }
    const inputs = screen.getAllByPlaceholderText('tu@correo.com')
    await userEvent.type(inputs[0], data.email)
    await userEvent.type(inputs[1], data.emailConfirm)
    const pwdInputs = screen.getAllByPlaceholderText(/contraseña|caracteres/i)
    await userEvent.type(pwdInputs[0], data.password)
    await userEvent.type(pwdInputs[1], data.passwordConfirm)
    await userEvent.type(screen.getByPlaceholderText('5512345678'), data.phone)
  }

  it('shows error when emails do not match', async () => {
    await openRegister()
    await fillRegisterForm({ emailConfirm: 'other@test.com' })
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    expect(screen.getByText('Los correos no coinciden')).toBeInTheDocument()
  })

  it('shows error when password is too short', async () => {
    await openRegister()
    await fillRegisterForm({ password: '123', passwordConfirm: '123' })
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    expect(screen.getByText('Mínimo 6 caracteres')).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    await openRegister()
    await fillRegisterForm({ passwordConfirm: 'different' })
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })

  it('shows error for invalid phone', async () => {
    await openRegister()
    await fillRegisterForm({ phone: '123' })
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    expect(screen.getByText('Número inválido')).toBeInTheDocument()
  })

  it('shows success message after valid registration', async () => {
    await openRegister()
    await fillRegisterForm()
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    await waitFor(() =>
      expect(screen.getByText('¡Solicitud enviada!')).toBeInTheDocument()
    )
    expect(screen.getByText(/el equipo se comunicará en breve/i)).toBeInTheDocument()
  })

  it('sends trimmed lowercase email to Supabase on registration', async () => {
    await openRegister()
    await fillRegisterForm({ email: '  New@TEST.com  ', emailConfirm: '  New@TEST.com  ' })
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@test.com' })
      )
    )
  })

  it('shows success even when signUp returns an error (team handles manually)', async () => {
    signUp.mockResolvedValue({ error: { message: 'Email already registered' } })
    await openRegister()
    await fillRegisterForm()
    await userEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))
    await waitFor(() =>
      expect(screen.getByText('¡Solicitud enviada!')).toBeInTheDocument()
    )
  })
})
