export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          assignee_id: string | null
          due_date: string | null
          tags: string[] | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          assignee_id?: string | null
          due_date?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          assignee_id?: string | null
          due_date?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          permission_type: string
          user_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          permission_type?: string
          user_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          permission_type?: string
          user_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      kanban_phases: {
        Row: {
          id: string
          name: string
          status: string
          order: number
          color: string | null
          board_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status: string
          order: number
          color?: string | null
          board_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: string
          order?: number
          color?: string | null
          board_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_phases_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          }
        ]
      }
      kanban_boards: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      permission_type: "admin" | "user" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}