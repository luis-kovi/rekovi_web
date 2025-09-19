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
export { default as CardComponent } from '../../components/Card';
export { default as Header } from '../../components/Header';
export { default as ControlPanel } from '../../components/ControlPanel';
export { default as LoadingIndicator } from '../../components/LoadingIndicator';
export { default as CardModal } from '../../components/CardModal';
export { default as KanbanWrapper } from '../../components/KanbanWrapper';
export { default as MobileTaskManager } from '../../components/MobileTaskManager';
export { default as MobileHeader } from '../../components/MobileHeader';
export { default as MobileWrapper } from '../../components/MobileWrapper';
