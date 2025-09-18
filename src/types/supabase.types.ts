import { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Task = Tables<'tasks'>
export type User = Tables<'users'>
export type KanbanPhase = Tables<'kanban_phases'>
export type KanbanBoard = Tables<'kanban_boards'>

// Enum types
export type TaskStatus = Enums<'task_status'>
export type TaskPriority = Enums<'task_priority'>
export type PermissionType = Enums<'permission_type'>

// Insert types
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type KanbanPhaseInsert = Database['public']['Tables']['kanban_phases']['Insert']
export type KanbanBoardInsert = Database['public']['Tables']['kanban_boards']['Insert']

// Update types
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type KanbanPhaseUpdate = Database['public']['Tables']['kanban_phases']['Update']
export type KanbanBoardUpdate = Database['public']['Tables']['kanban_boards']['Update']

// Supabase client types
export type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>
export type SupabaseResponse<T> = import('@supabase/supabase-js').PostgrestResponse<T>
export type SupabaseError = import('@supabase/supabase-js').PostgrestError

// Auth types
export type AuthUser = import('@supabase/supabase-js').User
export type AuthSession = import('@supabase/supabase-js').Session
export type AuthError = import('@supabase/supabase-js').AuthError

// Realtime types
export type RealtimeChannel = import('@supabase/supabase-js').RealtimeChannel
export type RealtimePostgresChangesPayload<T> = import('@supabase/supabase-js').RealtimePostgresChangesPayload<T>
export type RealtimePostgresChangesFilter<T> = import('@supabase/supabase-js').RealtimePostgresChangesFilter<T>

// Storage types
export type StorageBucket = import('@supabase/supabase-js').StorageBucket
export type StorageObject = import('@supabase/supabase-js').StorageObject
export type StorageError = import('@supabase/supabase-js').StorageError

// Function types
export type DatabaseFunction<T = any> = Database['public']['Functions'][T]