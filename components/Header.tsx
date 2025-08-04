// components/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: any
  permissionType: string
  isUpdating?: boolean
}

export default function Header({ user, permissionType, isUpdating = false }: HeaderProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

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

  // Obter informações do usuário Google
  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0]
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-2 shadow-sm relative">
      <div className="flex items-center justify-between">
        {/* Logo - Lado esquerdo */}
        <div className="flex items-center">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://i.ibb.co/1fTXGSN6/rekovi-identity-updated-1-removebg-preview.png" 
              alt="Logo Kovi" 
              className="h-16 w-auto" 
            />
          </div>
        </div>

        {/* Lado direito - Status e usuário */}
        <div className="flex items-center gap-6">
          {/* Status de conectividade moderno */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-xs font-medium text-gray-600">
                {isUpdating ? 'Sincronizando...' : (isConnected ? 'Conectado' : 'Desconectado')}
              </span>
            </div>
            
            {lastUpdate && !isUpdating && (
              <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                Última atualização: {formatLastUpdate(lastUpdate)}
              </div>
            )}
            
            {isUpdating && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                <span className="text-xs font-medium text-blue-600">
                  Sincronizando dados...
                </span>
              </div>
            )}
          </div>

          {/* Informações do usuário com dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2"
            >
              {/* Avatar do usuário */}
              <div className="flex items-center gap-3">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FF355A] to-[#E62E4F] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Informações do usuário */}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-32">
                    {userEmail}
                  </p>
                  <p className="text-xs text-[#FF355A] font-medium">
                    {permissionType?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Ícone de dropdown */}
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu - Z-index máximo e position fixed */}
            {showDropdown && (
              <div 
                className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[99999]"
                style={{
                  top: '80px',
                  right: '24px',
                  width: '192px'
                }}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                  <p className="text-xs text-[#FF355A] font-medium mt-1">{permissionType?.toUpperCase()}</p>
                </div>
                
                <div className="py-1">
                  {permissionType?.toLowerCase() === 'admin' && (
                    <button
                      onClick={handleSettings}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
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
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para fechar dropdown - Z-index ajustado */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-[99998]" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  )
}