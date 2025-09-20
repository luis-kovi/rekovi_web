'use client';

import MobileHeader from './MobileHeader';
import MobileTaskManager from './MobileTaskManager';
import { useKanbanData } from './kanban/hooks/useKanbanData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface MobileWrapperProps {
  permissionType: string;
  user: any;
}

export default function MobileWrapper({ permissionType, user }: MobileWrapperProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-mobile flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        <MobileHeader user={user} permissionType={permissionType} isUpdating={false} />
        <MobileTaskManager permissionType={permissionType} />
      </div>
    </QueryClientProvider>
  );
}