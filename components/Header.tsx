// components/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { logger } from '@/utils/logger'

interface HeaderProps {
  user: any
  permissionType: string
  isUpdating?: boolean
}

export default function Header({ user, permissionType, isUpdating = false }: HeaderProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const router = useRouter()

  // Monitorar conectividade com Supabase
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('connection-status')
      .on('system', { event: 'disconnect' }, () => {
        setIsConnected(false)
        logger.log('Conexão perdida com Supabase')
      })
      .on('system', { event: 'reconnect' }, () => {
        setIsConnected(true)
        setLastUpdate(new Date())
        logger.log('Reconectado ao Supabase')
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

  const handleSignOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
      router.push('/auth/signin')
    }
  }

  const handleSettings = () => {
    router.push('/settings')
    setShowDropdown(false)
  }

  const handleDropdownToggle = (event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    
    setDropdownPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    })
    
    setShowDropdown(!showDropdown)
  }

  // Obter informações do usuário Google
  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0]
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  // Renderizar dropdown usando Portal
  const renderDropdown = () => {
    if (!showDropdown) return null

    const dropdownContent = (
      <div 
        className="fixed bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/60 py-2 z-[999999] animate-in slide-in-from-top-2 duration-200"
        style={{
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          width: '200px'
        }}
      >
        <div className="py-1">
          {permissionType?.toLowerCase() === 'admin' && (
            <button
              onClick={handleSettings}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 rounded-lg mx-2 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuração
            </button>
          )}
          
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all duration-200 flex items-center gap-3 rounded-lg mx-2 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>
    )

    // Usar Portal para renderizar no final do body
    return createPortal(dropdownContent, document.body)
  }

  return (
    <header className="bg-white/98 backdrop-blur-md border-b border-gray-200/60 px-6 py-2 shadow-sm relative z-50">
      <div className="flex items-center justify-between">
        {/* Logo - Lado esquerdo */}
        <div className="flex items-center">
          <div className="transform hover:scale-105 transition-all duration-300 hover:drop-shadow-lg">
            <img 
              src="/images/logos/kovi-logo.webp" 
              alt="Logo Kovi" 
              className="h-12 w-auto object-contain" 
              style={{ aspectRatio: '406/130' }}
            />
          </div>
        </div>

        {/* Lado direito - Status e usuário */}
        <div className="flex items-center gap-4">
          {/* Status de conectividade premium */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200/50 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
              <span className="text-xs font-semibold text-gray-700">
                {isUpdating ? 'Sincronizando...' : (isConnected ? 'Online' : 'Offline')}
              </span>
            </div>
            
            {lastUpdate && !isUpdating && (
              <div className="text-xs text-gray-500 bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/40">
                Atualizado: {formatLastUpdate(lastUpdate)}
              </div>
            )}
            
            {isUpdating && (
              <div className="flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-200/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                <span className="text-xs font-semibold text-blue-700">
                  Sincronizando...
                </span>
              </div>
            )}
          </div>

          {/* Informações do usuário com dropdown premium */}
          <div className="relative">
            <button
              onClick={handleDropdownToggle}
              className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl px-4 py-2.5 hover:bg-white hover:border-gray-300/80 hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF355A]/30 focus:ring-offset-2 group"
            >
              {/* Avatar do usuário */}
              <div className="flex items-center gap-3">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm ring-2 ring-gray-200/50 group-hover:ring-[#FF355A]/20 transition-all duration-300"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-[#FF355A] via-[#E62E4F] to-[#D12846] rounded-full flex items-center justify-center shadow-sm ring-2 ring-white group-hover:shadow-md transition-all duration-300">
                    <span className="text-white text-sm font-bold">
                      {userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Informações do usuário */}
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-32 font-medium">
                    {userEmail}
                  </p>
                  <p className="text-xs text-[#FF355A] font-bold tracking-wide">
                    {permissionType?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Ícone de dropdown */}
              <svg 
                className={`w-4 h-4 text-gray-400 transition-all duration-300 group-hover:text-gray-600 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para fechar dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-[999998]" 
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Renderizar dropdown usando Portal */}
      {renderDropdown()}
    </header>
  )
}