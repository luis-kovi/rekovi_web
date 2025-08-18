// types/supabase.ts
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from './database.types'

// Type for the card view
export type CardView = Database['public']['Views']['v_pipefy_cards_detalhada']['Row']

// Type for pre-approved users
export type PreApprovedUser = Database['public']['Tables']['pre_approved_users']['Row']

// Realtime payload types
export type CardRealtimePayload = RealtimePostgresChangesPayload<CardView>

// Realtime events
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

// Helper type for Supabase client with database types
export type TypedSupabaseClient = ReturnType<typeof import('@/utils/supabase/client').createClient>

// Card status types based on your phases
export type CardPhase = 
  | '📬 Caixa de entrada (Financeiro)'
  | '📋 Preenchimento de formulário'
  | '👨 Responsável pela aprovação'
  | '🏦 Liberação Banco Safra'
  | '📄 NF Emitida'
  | '✅ Pronto para Pagamento (Liberado para Matriz)'
  | '⚠️ Exceção'
  | '💳 Pago'
  | '🚫 Negado'

// SLA Status types
export type SLAStatus = 'on_time' | 'warning' | 'late' | 'expired'

// Filter types
export type FilterOptions = {
  searchTerm: string
  slaFilter: 'all' | SLAStatus
  hideEmptyPhases: boolean
  selectedAssignees: string[]
  selectedLabels: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
}