'use client';

import Header from './Header';
import KanbanBoard from './KanbanBoard';
import { useKanbanData } from './kanban/hooks/useKanbanData';

interface KanbanWrapperProps {
  permissionType: string;
  user: any;
}

export default function KanbanWrapper({ permissionType, user }: KanbanWrapperProps) {
  const { cards, isLoading, isError } = useKanbanData(permissionType);

  return (
    <div className="app-kanban flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Header user={user} permissionType={permissionType} isUpdating={isLoading} />
      <KanbanBoard cards={cards || []} isLoading={isLoading} isError={isError} permissionType={permissionType} />
    </div>
  );
}