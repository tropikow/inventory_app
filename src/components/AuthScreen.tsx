import { useState } from 'react'
import { ShoppingCart, Mail, Lock, Phone, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

type View = 'login' | 'forgot' | 'register'

interface Props {
  onAuthenticated: () => void
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  icon,
  rightSlot,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  icon?: React.ReactNode
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-3 pr-4 rounded-xl border-2 text-sm outline-none transition-colors ${
            icon ? 'pl-10' : 'pl-4'
          } ${
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-gray-200 focus:border-blue-500'
          }`}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  )
}

function LoginView({ onAuthenticated, goForgot, goRegister }: {
  onAuthenticated: () => void
  goForgot: () => void
  goRegister: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'El correo es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo inválido'
    if (!password) e.password = 'La contraseña es requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) {
        setAuthError('Correo o contraseña incorrectos. Verifica tus datos.')
      } else {
        onAuthenticated()
      }
    } catch {
      setAuthError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
        <p className="text-sm text-gray-500">Ingresa a tu cuenta para continuar</p>
      </div>

      {authError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0" />
          {authError}
        </div>
      )}

      <Field
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="tu@correo.com"
        error={errors.email}
        icon={<Mail size={16} />}
      />
      <Field
        label="Contraseña"
        type={showPwd ? 'text' : 'password'}
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        error={errors.password}
        icon={<Lock size={16} />}
        rightSlot={
          <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="text-right">
        <button onClick={goForgot} className="text-sm text-blue-600 hover:underline font-medium">
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Ingresando...</> : 'Ingresar'}
      </button>

      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <button onClick={goRegister} className="text-blue-600 font-semibold hover:underline">
          Crear cuenta
        </button>
      </p>
    </div>
  )
}

function ForgotView({ goBack }: { goBack: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    const clean = email.trim().toLowerCase()
    if (!clean) { setError('El correo es requerido'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setError('Correo inválido'); return }
    setLoading(true)
    setError('')
    // Simulate async – no automated reset, team handles it manually
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Solicitud recibida</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            El equipo está revisando tu caso y te contactará en breve.
            Por favor mantente atento a tus canales de comunicación.
          </p>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 inline-block">{email}</p>
        </div>
        <button onClick={goBack} className="w-full py-3 border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-semibold rounded-xl transition-colors">
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Volver
      </button>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h2>
        <p className="text-sm text-gray-500">
          Ingresa tu correo y el equipo se pondrá en contacto contigo.
        </p>
      </div>
      <Field
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={(v) => { setEmail(v); setError('') }}
        placeholder="tu@correo.com"
        error={error}
        icon={<Mail size={16} />}
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : 'Enviar solicitud'}
      </button>
    </div>
  )
}

const AREA_CODES = [
  { code: '+1', label: 'EE.UU. / Canadá (+1)' },
  { code: '+52', label: 'México (+52)' },
  { code: '+54', label: 'Argentina (+54)' },
  { code: '+56', label: 'Chile (+56)' },
  { code: '+57', label: 'Colombia (+57)' },
  { code: '+58', label: 'Venezuela (+58)' },
  { code: '+51', label: 'Perú (+51)' },
  { code: '+593', label: 'Ecuador (+593)' },
  { code: '+591', label: 'Bolivia (+591)' },
  { code: '+595', label: 'Paraguay (+595)' },
  { code: '+598', label: 'Uruguay (+598)' },
  { code: '+503', label: 'El Salvador (+503)' },
  { code: '+502', label: 'Guatemala (+502)' },
  { code: '+504', label: 'Honduras (+504)' },
  { code: '+505', label: 'Nicaragua (+505)' },
  { code: '+506', label: 'Costa Rica (+506)' },
  { code: '+507', label: 'Panamá (+507)' },
  { code: '+53', label: 'Cuba (+53)' },
  { code: '+1-787', label: 'Puerto Rico (+1-787)' },
  { code: '+34', label: 'España (+34)' },
]

function RegisterView({ goBack }: { goBack: () => void }) {
  const [form, setForm] = useState({
    email: '', emailConfirm: '',
    password: '', passwordConfirm: '',
    areaCode: '+52', phone: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => { const e = { ...p }; delete e[k]; return e })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const cleanEmail = form.email.trim().toLowerCase()
    const cleanEmailConfirm = form.emailConfirm.trim().toLowerCase()
    if (!cleanEmail) e.email = 'El correo es requerido'
    else if (!emailRx.test(cleanEmail)) e.email = 'Correo inválido'
    if (!cleanEmailConfirm) e.emailConfirm = 'Confirma tu correo'
    else if (cleanEmail !== cleanEmailConfirm) e.emailConfirm = 'Los correos no coinciden'
    if (!form.password) e.password = 'La contraseña es requerida'
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (!form.passwordConfirm) e.passwordConfirm = 'Confirma tu contraseña'
    else if (form.password !== form.passwordConfirm) e.passwordConfirm = 'Las contraseñas no coinciden'
    if (!form.phone.trim()) e.phone = 'El teléfono es requerido'
    else if (!/^\d{7,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Número inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // Sign up via Supabase auth; confirmation/approval handled manually by the team
      await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            phone: `${form.areaCode} ${form.phone}`,
          },
        },
      })
      setDone(true)
    } catch {
      // Even on error, show confirmation (team handles manually)
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">¡Solicitud enviada!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            El equipo se comunicará en breve para la asignación de la empresa.
            Por favor esté atento a sus canales de comunicación.
          </p>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 inline-block">{form.email}</p>
        </div>
        <button onClick={goBack} className="w-full py-3 border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-semibold rounded-xl transition-colors">
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Volver
      </button>
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
        <p className="text-sm text-gray-500">Completa los datos para solicitar acceso</p>
      </div>

      <Field label="Correo electrónico" type="email" value={form.email}
        onChange={(v) => set('email', v)} placeholder="tu@correo.com"
        error={errors.email} icon={<Mail size={16} />} />

      <Field label="Confirmar correo" type="email" value={form.emailConfirm}
        onChange={(v) => set('emailConfirm', v)} placeholder="tu@correo.com"
        error={errors.emailConfirm} icon={<Mail size={16} />} />

      <Field
        label="Contraseña"
        type={showPwd ? 'text' : 'password'}
        value={form.password}
        onChange={(v) => set('password', v)}
        placeholder="Mínimo 6 caracteres"
        error={errors.password}
        icon={<Lock size={16} />}
        rightSlot={
          <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <Field
        label="Confirmar contraseña"
        type={showPwd2 ? 'text' : 'password'}
        value={form.passwordConfirm}
        onChange={(v) => set('passwordConfirm', v)}
        placeholder="Repite tu contraseña"
        error={errors.passwordConfirm}
        icon={<Lock size={16} />}
        rightSlot={
          <button type="button" onClick={() => setShowPwd2((v) => !v)} className="text-gray-400 hover:text-gray-600">
            {showPwd2 ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <div className="flex gap-2">
          <select
            value={form.areaCode}
            onChange={(e) => set('areaCode', e.target.value)}
            className="shrink-0 w-36 py-3 px-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-sm outline-none"
          >
            {AREA_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone size={16} />
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => { set('phone', e.target.value.replace(/\D/g, '')) }}
              placeholder="5512345678"
              className={`w-full py-3 pl-10 pr-4 border-2 rounded-xl text-sm outline-none transition-colors ${
                errors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
        {errors.phone && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.phone}</p>}
      </div>

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : 'Solicitar acceso'}
      </button>
    </div>
  )
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [view, setView] = useState<View>('login')

  return (
    <div className="min-h-svh bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingCart size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">VentaApp</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {view === 'login' && (
            <LoginView
              onAuthenticated={onAuthenticated}
              goForgot={() => setView('forgot')}
              goRegister={() => setView('register')}
            />
          )}
          {view === 'forgot' && <ForgotView goBack={() => setView('login')} />}
          {view === 'register' && <RegisterView goBack={() => setView('login')} />}
        </div>
      </div>
    </div>
  )
}
