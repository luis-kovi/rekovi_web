// src/utils/lazyImports.ts
import { lazy } from 'react';

// Lazy loading para componentes pesados
export const LazyKanbanBoard = lazy(() => 
  import('../../components/KanbanBoard').then(module => ({ default: module.default }))
);

export const LazyMobileTaskManager = lazy(() => 
  import('../../components/MobileTaskManager').then(module => ({ default: module.default }))
);

export const LazyCardModal = lazy(() => 
  import('../../components/CardModal').then(module => ({ default: module.default }))
);

export const LazyMobileTaskModal = lazy(() => 
  import('../../components/MobileTaskModal').then(module => ({ default: module.default }))
);

// ModernUIShowcase removido temporariamente devido a problemas de export

// Lazy loading para páginas
export const LazySettingsPage = lazy(() => 
  import('../../app/settings/page').then(module => ({ default: module.default }))
);

// Lazy loading condicional baseado em feature flags
export const loadComponentConditionally = async (
  componentName: string,
  condition: boolean = true
) => {
  if (!condition) return null;

  const componentMap = {
    'kanban': () => import('../../components/KanbanBoard'),
    'mobile': () => import('../../components/MobileTaskManager'),
    'modal': () => import('../../components/CardModal'),
  };

  const loader = componentMap[componentName as keyof typeof componentMap];
  if (!loader) {
    console.warn(`Component ${componentName} not found in lazy loading map`);
    return null;
  }

  try {
    const loadedModule = await loader();
    return loadedModule.default;
  } catch (error) {
    console.error(`Failed to load component ${componentName}:`, error);
    return null;
  }
};
