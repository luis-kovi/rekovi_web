// src/components/index.ts
/**
 * Componentes - Atomic Design System
 * Exportação centralizada de todos os componentes seguindo a arquitetura Atomic Design
 */

// Atoms - Componentes básicos
export * from './ui';

// Molecules - Componentes compostos
export * from './molecules';

// Organisms - Componentes complexos
export * from './organisms';

// Legacy exports para compatibilidade (temporário)
export { default as CardComponent } from './Card';
export { default as Header } from './Header';
export { default as ControlPanel } from './ControlPanel';
export { default as LoadingIndicator } from './LoadingIndicator';
export { default as CardModal } from './CardModal';
export { default as KanbanWrapper } from './KanbanWrapper';
export { default as MobileTaskManager } from './MobileTaskManager';
export { default as MobileHeader } from './MobileHeader';
export { default as MobileWrapper } from './MobileWrapper';
