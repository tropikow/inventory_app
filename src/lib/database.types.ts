// Tipos generados manualmente basados en el schema SQL de Supabase.
// Para regenerarlos automáticamente: npx supabase gen types typescript --project-id <id>

export type PaymentMethodDB = 'cash' | 'transfer' | 'card'

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          barcode: string
          name: string
          price: number
          stock: number
          image_url: string | null
          has_discount: boolean
          discount_percent: number | null
          discount_expiry: string | null
          low_stock_threshold: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      sales: {
        Row: {
          id: string
          subtotal: number
          total_discount: number
          total: number
          profit: number
          payment_method: PaymentMethodDB
          amount_received: number
          change: number
          cashier: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sales']['Insert']>
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          product_name: string
          barcode: string
          unit_price: number
          quantity: number
          discount_percent: number
          total_price: number
        }
        Insert: Omit<Database['public']['Tables']['sale_items']['Row'], 'id'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>
      }
      app_users: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_users']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['app_users']['Insert']>
      }
    }
  }
}

// Alias convenientes
export type ProductRow   = Database['public']['Tables']['products']['Row']
export type SaleRow      = Database['public']['Tables']['sales']['Row']
export type SaleItemRow  = Database['public']['Tables']['sale_items']['Row']
export type AppUserRow   = Database['public']['Tables']['app_users']['Row']

// Sale con items anidados (resultado de select con join)
export type SaleWithItems = SaleRow & { sale_items: SaleItemRow[] }
