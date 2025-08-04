'use client'

import { useState } from 'react'
import Header from './Header'
import KanbanBoard from './KanbanBoard'
import type { Card } from '@/types'

interface KanbanWrapperProps {
  initialCards: Card[]
  permissionType: string
  user: any
}

export default function KanbanWrapper({ initialCards, permissionType, user }: KanbanWrapperProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  return (
    <div className="app-kanban flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Header user={user} permissionType={permissionType} isUpdating={isUpdating} />
      <KanbanBoard 
        initialCards={initialCards} 
        permissionType={permissionType} 
        onUpdateStatus={setIsUpdating}
      />
    </div>
  )
} 