// components/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface HeaderProps {
  user: any
  permissionType: string
  isUpdating?: boolean
}

export default function Header({ user, permissionType, isUpdating = false }: HeaderProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  // Monitorar conectividade com Supabase
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('connection-status')
      .on('system', { event: 'disconnect' }, () => {
        setIsConnected(false)
        console.log('Conexão perdida com Supabase')
      })
      .on('system', { event: 'reconnect' }, () => {
        setIsConnected(true)
        setLastUpdate(new Date())
        console.log('Reconectado ao Supabase')
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF355A] to-[#E02E4D] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestão de Recolhas</h1>
              <p className="text-sm text-gray-500">Kovi - {permissionType?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status de conectividade */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isUpdating ? 'Atualizando...' : (isConnected ? 'Conectado' : 'Desconectado')}
            </span>
            {lastUpdate && !isUpdating && (
              <span className="text-xs text-gray-400">
                Última atualização: {formatLastUpdate(lastUpdate)}
              </span>
            )}
            {isUpdating && (
              <span className="text-xs text-blue-500 animate-pulse">
                Sincronizando dados...
              </span>
            )}
          </div>

          {/* Informações do usuário */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">{permissionType}</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF355A] to-[#E02E4D] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}