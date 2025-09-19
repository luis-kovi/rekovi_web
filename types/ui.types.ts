// types/ui.types.ts
/**
 * Tipos relacionados à interface do usuário
 */

export type ViewMode = 'kanban' | 'list';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputVariant = 'default' | 'error' | 'success';
export type InputSize = 'sm' | 'md' | 'lg';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

export type IconName = 
  | 'user'
  | 'car'
  | 'phone'
  | 'email'
  | 'location'
  | 'calendar'
  | 'clock'
  | 'check'
  | 'x'
  | 'warning'
  | 'info'
  | 'settings'
  | 'logout'
  | 'search'
  | 'filter'
  | 'refresh'
  | 'download'
  | 'upload'
  | 'edit'
  | 'delete'
  | 'plus'
  | 'minus'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down';

export interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
