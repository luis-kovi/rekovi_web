// components/Header.tsx
'use client' // Este componente é interativo (logout), por isso é um Componente de Cliente

import Link from 'next/link'
import { User } from '@supabase/supabase-js'

// Definimos que o Header espera receber um objeto 'user'
interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-[#FF355A] text-white flex-shrink-0 shadow-md">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-4">
          <img src="https://i.ibb.co/zh6PNsYs/kovi-logo-fundo-rosa.png" alt="Logo Kovi" className="h-10" />
          <span className="text-white opacity-50">/</span>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>
            Gestão de Recolhas
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Link para a página de configurações (que criaremos mais tarde) */}
          <Link href="/settings" className="text-white hover:text-gray-200" title="Configurações">
            {/* Ícone de engrenagem (SVG) */}
          </Link>

          <img src={user.user_metadata.avatar_url || ''} alt="Avatar" className="h-10 w-10 rounded-full" />
          <div>
            <p className="font-bold text-sm">{user.user_metadata.full_name || user.email}</p>
            <p className="text-xs">{user.email}</p>
          </div>

          {/* O formulário de logout agora está dentro do Header */}
          <form action="/auth/signout" method="post">
            <button className="text-white hover:text-gray-200 ml-2 flex items-center gap-1 text-sm" title="Sair">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
              </svg>
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}