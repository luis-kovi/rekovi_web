// Base types
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// User types
export interface User extends BaseEntity {
  email: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
    picture?: string
  }
  permission_type: PermissionType
}

export type PermissionType = 'admin' | 'user' | 'viewer'

// Auth types
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  permissionType: PermissionType | null
}

// Task types
export interface Task extends BaseEntity {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id?: string
  due_date?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// Kanban types
export interface KanbanPhase {
  id: string
  name: string
  status: TaskStatus
  order: number
  color?: string
  tasks: Task[]
}

export interface KanbanBoard {
  id: string
  name: string
  phases: KanbanPhase[]
  created_at: string
  updated_at: string
}

// Mobile types
export interface MobileTask extends Task {
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  photos?: string[]
  notes?: string
}

// API Response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  error?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}

// UI Component types
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends ComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  error?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
}

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Theme types
export interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    muted: string
    accent: string
    destructive: string
    border: string
    input: string
    ring: string
  }
  fonts: {
    sans: string[]
    mono: string[]
  }
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
}

// Animation types
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
  iterationCount?: number | 'infinite'
}

// Hook types
export interface UseLocalStorageReturn<T> {
  value: T
  setValue: (value: T) => void
  removeValue: () => void
}

export interface UseDebounceReturn<T> {
  debouncedValue: T
  isDebouncing: boolean
}

export interface UseAsyncReturn<T, E = Error> {
  data: T | null
  error: E | null
  isLoading: boolean
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Settings types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US'
  notifications: {
    email: boolean
    push: boolean
    sound: boolean
  }
  privacy: {
    analytics: boolean
    crashReports: boolean
  }
}

// Navigation types
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavigationItem[]
  permission?: PermissionType[]
}

// Search types
export interface SearchResult<T = any> {
  item: T
  score: number
  highlights: string[]
}

export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

// File types
export interface FileUpload {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

// Chart types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface ChartOptions {
  responsive: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    title?: {
      display: boolean
      text: string
    }
  }
  scales?: {
    x?: {
      display: boolean
      title?: {
        display: boolean
        text: string
      }
    }
    y?: {
      display: boolean
      title?: {
        display: boolean
        text: string
      }
    }
  }
}

// Export all types
export * from './database.types'
export * from './supabase.types'