// components/MobileHeader.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface MobileHeaderProps {
  user: any
  permissionType: string
  isUpdating?: boolean
  onOpenFilter?: () => void
}

export default function MobileHeader({ user, permissionType, isUpdating = false, onOpenFilter }: MobileHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  // Garantir que só renderiza no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcular posição do dropdown
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [showDropdown])

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
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo - Lado esquerdo */}
        <div className="flex items-center">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png" 
              alt="Logo Kovi" 
              className="h-8 w-auto object-contain" 
              style={{ aspectRatio: '406/130' }}
            />
          </div>
        </div>

        {/* Lado direito - Botões de ação */}
        <div className="flex items-center gap-2">
          {/* Botão de filtro */}
          {onOpenFilter && (
            <button
              onClick={onOpenFilter}
              className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 active:scale-95"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}

          {/* Menu do usuário */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2 active:scale-95"
            >
              {/* Avatar do usuário */}
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full border border-gray-200"
                />
              ) : (
                <div className="w-7 h-7 bg-gradient-to-br from-[#FF355A] to-[#E62E4F] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Nome do usuário (versão compacta) */}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {userName}
              </span>

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


          </div>
        </div>
      </div>

      
      {/* Dropdown menu renderizado via Portal */}
      {mounted && showDropdown && createPortal(
        <>
          {/* Overlay para fechar dropdown */}
          <div 
            className="fixed inset-0 z-[999998]" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div 
            className="fixed w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[999999]"
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right
            }}
          >
            <div className="py-1">
              {/* Informações do usuário */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">{permissionType}</p>
              </div>

              {/* Opções do menu */}
              <div className="py-1">
                {permissionType?.toLowerCase() === 'admin' && (
                  <button
                    onClick={handleSettings}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configurações
                  </button>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  )
} 