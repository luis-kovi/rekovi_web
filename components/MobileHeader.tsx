// components/MobileHeader.tsx
'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { useState } from 'react'

interface MobileHeaderProps {
  user?: User
  permissionType?: string
}

export default function MobileHeader({ user, permissionType }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isAdmin = permissionType === 'admin'

  if (!user) {
    return (
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#FF355A] via-[#E02E4D] to-[#D6254A] text-white shadow-lg border-b border-white/10 backdrop-blur-sm">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co/2pSmCRw/kovi-logo-fundo-rosa-removebg-preview.png" 
              alt="Logo Kovi" 
              className="h-8 w-auto" 
            />
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Recolhas
              </h1>
              <p className="text-xs opacity-80">Carregando...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">?</span>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#FF355A] via-[#E02E4D] to-[#D6254A] text-white shadow-lg border-b border-white/10 backdrop-blur-sm">
      <div className="flex justify-between items-center px-4 py-3">
        {/* Logo e Título */}
        <div className="flex items-center gap-3">
          <img 
            src="https://i.ibb.co/2pSmCRw/kovi-logo-fundo-rosa-removebg-preview.png" 
            alt="Logo Kovi" 
            className="h-8 w-auto" 
          />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Recolhas
            </h1>
            <p className="text-xs opacity-80">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador'}
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          {/* Botão de Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Avatar do Usuário */}
          <img 
            src={user?.user_metadata?.avatar_url || "https://placehold.co/32x32/FFFFFF/FF355A?text=K"} 
            alt="Foto do Perfil" 
            className="h-8 w-8 rounded-full border-2 border-white/30 shadow-sm" 
          />
        </div>
      </div>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img 
                src={user?.user_metadata?.avatar_url || "https://placehold.co/40x40/FFFFFF/FF355A?text=K"} 
                alt="Foto do Perfil" 
                className="h-10 w-10 rounded-full border-2 border-gray-200" 
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {user?.user_metadata?.full_name || user?.email || 'Utilizador Kovi'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || 'A carregar...'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="py-2">
            {/* Link para Desktop */}
            <Link 
              href="/kanban"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Versão Desktop</span>
            </Link>

            {/* Configurações - só visível para admins */}
            {isAdmin && (
              <Link 
                href="/settings" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">Configurações</span>
              </Link>
            )}
            
            {/* Botão de Logout */}
            <form action="/auth/signout" method="post">
              <button 
                type="submit"
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm">Sair</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
} 