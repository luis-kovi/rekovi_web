// components/Header.tsx
'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types'
import { useState, useEffect } from 'react'

interface HeaderProps {
  user?: User
  permissionType?: string
}

export default function Header({ user, permissionType }: HeaderProps) {
  const isAdmin = permissionType === 'admin';
  console.log('Header - permissionType:', permissionType, 'isAdmin:', isAdmin);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fechar menu quando clicar fora
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.user-menu')) {
      setIsMenuOpen(false);
    }
  };

  // Adicionar listener para clicar fora
  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);
  
  // Verificação de segurança para user undefined
  if (!user) {
    return (
      <header className="relative bg-gradient-to-r from-[#FF355A] via-[#E02E4D] to-[#D6254A] text-white flex-shrink-0 shadow-lg border-b border-white/10 backdrop-blur-sm" style={{overflow: 'visible'}}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30"></div>
        <div className="relative flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-4">
            <img 
              src="https://i.ibb.co/2pSmCRw/kovi-logo-fundo-rosa-removebg-preview.png" 
              alt="Logo Kovi" 
              className="h-10 w-auto" 
            />
            <span className="text-white opacity-50">/</span>
            <h1 
              className="text-lg font-bold tracking-wide" 
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
            >
              Gestão de Recolhas
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shadow-sm">
              <div className="h-8 w-8 rounded-lg border-2 border-white/30 shadow-sm bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-bold">?</span>
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-sm leading-tight text-white">
                  Carregando...
                </p>
                <p className="text-xs opacity-80 leading-tight text-white">
                  Aguarde...
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

     return (
     <header className="relative bg-gradient-to-r from-[#FF355A] via-[#E02E4D] to-[#D6254A] text-white flex-shrink-0 shadow-lg border-b border-white/10 backdrop-blur-sm" style={{overflow: 'visible', zIndex: 1000}}>
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30"></div>
      
             <div className="relative flex justify-between items-center px-6 py-3">
        {/* Logo e Título */}
        <div className="flex items-center gap-4">
          <img 
            src="https://i.ibb.co/2pSmCRw/kovi-logo-fundo-rosa-removebg-preview.png" 
            alt="Logo Kovi" 
            className="h-10 w-auto" 
          />
          <span className="text-white opacity-50">/</span>
          <h1 
            className="text-lg font-bold tracking-wide" 
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Gestão de Recolhas
          </h1>
        </div>

        {/* Área do Usuário */}
        <div className="flex items-center gap-4">
          {/* Link para versão móvel */}
          <Link 
            href="/mobile" 
            className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm text-xs font-medium" 
            title="Versão Móvel" 
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-11zm1 0v11h6v-11h-6z"/>
              <path d="M6.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm2 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1z"/>
            </svg>
            Móvel
          </Link>

                     {/* Menu do Usuário */}
                       <div className="relative user-menu" style={{zIndex: 99999999}}>
                                                   <button
                onClick={() => {
                  console.log('Menu clicked, current state:', isMenuOpen)
                  setIsMenuOpen(!isMenuOpen)
                }}
               className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shadow-sm hover:bg-white/20 transition-all duration-200"
             >
              <img 
                id="user-avatar"
                src={user?.user_metadata?.avatar_url || "https://placehold.co/40x40/FFFFFF/FF355A?text=K"} 
                alt="Foto do Perfil" 
                className="h-8 w-8 rounded-lg border-2 border-white/30 shadow-sm" 
              />
              <div className="flex flex-col items-start">
                <p id="user-name" className="font-bold text-sm leading-tight">
                  {user?.user_metadata?.full_name || user?.email || 'Utilizador Kovi'}
                </p>
                <p id="user-email" className="text-xs opacity-80 leading-tight">
                  {user?.email || 'A carregar...'}
                </p>
              </div>
              <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

                                                                             {/* Menu Dropdown */}
              {isMenuOpen && (
                                 <div 
                   className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 dropdown-menu"
                   style={{ zIndex: 99999999 }}
                 >
                                    {/* Configurações - só visível para admins */}
                   {isAdmin && (
                     <Link 
                       href="/settings" 
                       className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors w-full"
                       onClick={() => {
                         setIsMenuOpen(false)
                         console.log('Configurações clicked, navigating to /settings')
                       }}
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                       Configurações
                     </Link>
                   )}
                   
                                       {/* Sair */}
                    <a 
                      href="/auth/signout" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors w-full"
                      onClick={() => {
                        setIsMenuOpen(false)
                        console.log('Sair clicked, signing out')
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </a>
                </div>
              )}
          </div>
        </div>
      </div>
    </header>
  )
}