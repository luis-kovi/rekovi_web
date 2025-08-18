// types/supabase.ts
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

// Define the payload type for real-time changes
export type CardsRealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

// Database types - generate with: supabase gen types typescript
export interface Database {
  public: {
    Tables: {
      pre_approved_users: {
        Row: {
          id: number
          email: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
