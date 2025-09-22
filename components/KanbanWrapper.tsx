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
    <div className="app-kanban flex flex-col h-screen bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 overflow-hidden relative">
      {/* Background decorativo premium */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,53,90,0.04)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(59,130,246,0.04)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent"></div>
      
      <Header user={user} permissionType={permissionType} isUpdating={isUpdating} />
      <KanbanBoard 
        initialCards={initialCards} 
        permissionType={permissionType} 
        onUpdateStatus={setIsUpdating}
      />
    </div>
  )
} 