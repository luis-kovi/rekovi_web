'use client'

import { useState } from 'react'
import Header from './Header'
import MobileTaskManager from './MobileTaskManager'
import type { Card } from '@/types'

interface MobileWrapperProps {
  initialCards: Card[]
  permissionType: string
  user: any
}

export default function MobileWrapper({ initialCards, permissionType, user }: MobileWrapperProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  return (
    <div className="app-mobile flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Header user={user} permissionType={permissionType} isUpdating={isUpdating} />
      <MobileTaskManager 
        initialCards={initialCards} 
        permissionType={permissionType} 
        onUpdateStatus={setIsUpdating}
      />
    </div>
  )
} 