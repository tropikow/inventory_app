# VentaApp — Sistema de Gestión de Ventas e Inventario

Aplicación web enfocada en ventas para pequeños y medianos comercios. Permite registrar ventas por código de barras, gestionar el inventario, consultar el historial de ventas y administrar usuarios. Construida con React + TypeScript + Supabase como backend en la nube.

---

## Características principales

### Autenticación
- Inicio de sesión con correo y contraseña (Supabase Auth)
- Recuperación de contraseña: el usuario ingresa su correo y el equipo lo contacta manualmente
- Registro de cuenta: incluye correo (con confirmación), contraseña (con confirmación), código de área y teléfono — el equipo asigna la empresa en breve
- La sesión persiste entre recargas del navegador

### Venta (Registro de ventas)
- Búsqueda de productos por código de barras (escaneo o escritura manual)
- Edición de cantidad por ítem directamente en el carrito
- Cálculo automático de subtotal, descuentos y total
- Modal de pago con tres métodos: **Efectivo**, **Transferencia** y **Tarjeta**
- Cálculo automático de cambio para pagos en efectivo
- Al confirmar la venta se descuenta el stock de cada producto en Supabase
- Diseño de dos columnas en escritorio (lista de productos + resumen del pedido)

### Historial de ventas
- Listado completo de ventas ordenadas por fecha (más reciente primero)
- Filtros por período: **Hoy**, **Esta semana**, **Este mes**, **Este año**
- Drill-down: ver el detalle completo de cada venta (productos, cantidades, precios, método de pago)
- Edición y eliminación de ventas existentes
- Vista de tabla en escritorio, tarjetas en móvil

### Stock (Gestión de inventario)
- Listado de productos con búsqueda por nombre o código de barras
- Ordenamiento por: Nombre, Precio, Stock, Fecha de ingreso
- Alertas de stock bajo (badge rojo en la navegación cuando hay productos por debajo del umbral)
- Alta, edición y eliminación de productos
- Campos por producto: código de barras, nombre, precio, stock, umbral de alerta, imagen, descuento (porcentaje y fecha de expiración)
- Los nombres de productos se normalizan automáticamente a minúsculas sin caracteres especiales

### Ajustes
- Edición del nombre del cajero activo
- Resumen de datos: total de productos y ventas
- Carga de datos de demostración (seed) en Supabase

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 8 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Iconos | lucide-react |
| Fechas | date-fns |
| IDs | uuid |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── AuthScreen.tsx      # Login, recuperar contraseña, registro
│   ├── SalesRegister.tsx   # Registro de ventas con escáner
│   ├── SalesList.tsx       # Historial de ventas con filtros
│   ├── SaleDetail.tsx      # Detalle/edición de una venta
│   ├── StockList.tsx       # Listado y búsqueda de productos
│   ├── ProductForm.tsx     # Alta y edición de productos
│   └── PaymentModal.tsx    # Modal de cobro
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   ├── database.types.ts   # Tipos de la base de datos
│   └── mappers.ts          # Conversores snake_case ↔ camelCase
├── utils/
│   ├── storage.ts          # Funciones async de acceso a Supabase
│   └── seed.ts             # Datos de demostración
├── types/
│   └── index.ts            # Tipos TypeScript (Product, Sale, SaleItem…)
└── App.tsx                 # Shell principal con navegación y auth guard
```

---

## Configuración e instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventory_app
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales de Supabase:

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

> Las credenciales se encuentran en **Supabase Dashboard → Project Settings → API**.

### 3. Crear las tablas en Supabase

Ejecuta el siguiente SQL en el **SQL Editor** de tu proyecto Supabase:

```sql
-- Productos
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode       TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock         INTEGER NOT NULL DEFAULT 0,
  image_url     TEXT,
  has_discount  BOOLEAN NOT NULL DEFAULT FALSE,
  discount_percent NUMERIC(5,2),
  discount_expiry  TIMESTAMPTZ,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ventas
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal        NUMERIC(10,2) NOT NULL,
  total_discount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  profit          NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','card')),
  amount_received NUMERIC(10,2) NOT NULL DEFAULT 0,
  change          NUMERIC(10,2) NOT NULL DEFAULT 0,
  cashier         TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ítems de venta
CREATE TABLE sale_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id        UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL,
  product_name   TEXT NOT NULL,
  barcode        TEXT NOT NULL,
  unit_price     NUMERIC(10,2) NOT NULL,
  quantity       INTEGER NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_price    NUMERIC(10,2) NOT NULL
);

-- Usuario de la app (cajero)
CREATE TABLE app_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Cajero',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> Se recomienda habilitar **Row Level Security (RLS)** en producción y definir políticas según los roles de usuario.

### 4. Iniciar en desarrollo

```bash
npm run dev
```

### 5. Build de producción

```bash
npm run build
```

---

## Diseño responsivo

| Breakpoint | Comportamiento |
|-----------|---------------|
| Móvil (`< lg`) | Navegación en barra inferior, vistas en tarjetas apiladas |
| Escritorio (`lg+`) | Sidebar lateral, tablas de datos, vista de ventas en dos columnas |

---

## Seguridad

- El archivo `.env` está excluido del repositorio vía `.gitignore`
- Nunca se almacenan credenciales en el código fuente
- Los errores internos de Supabase solo se muestran en la consola en modo desarrollo (`import.meta.env.DEV`)
- Las imágenes de productos se validan por tipo (JPG/PNG/WEBP/GIF) y tamaño máximo (2 MB) antes de guardarse
- Los correos se normalizan con `.trim().toLowerCase()` antes de enviarse a Supabase Auth
- La `VITE_SUPABASE_ANON_KEY` es una clave pública por diseño de Supabase — es seguro incluirla en el cliente

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR
npm run build    # Build de producción (TypeScript + Vite)
npm run lint     # Linter ESLint
npm run preview  # Previsualización del build de producción
```
