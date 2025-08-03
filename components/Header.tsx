// components/Header.tsx
'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types'

interface HeaderProps {
  user?: User
  permissionType?: string
}

export default function Header({ user, permissionType }: HeaderProps) {
  const isAdmin = permissionType === 'admin';
  
  // Verificação de segurança para user undefined
  if (!user) {
    return (
      <header className="relative bg-gradient-to-r from-[#FF355A] via-[#E02E4D] to-[#D6254A] text-white flex-shrink-0 shadow-lg border-b border-white/10 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30"></div>
        <div className="relative flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-4">
            <img 
              src="https://i.ibb.co/zh6PNsYs/kovi-logo-fundo-rosa.png" 
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
    <header className="relative bg-gradient-to-r from-[#FF355A] via-[#E02E4D] to-[#D6254A] text-white flex-shrink-0 shadow-lg border-b border-white/10 backdrop-blur-sm">
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30"></div>
      
             <div className="relative flex justify-between items-center px-6 py-3">
        {/* Logo e Título */}
        <div className="flex items-center gap-4">
          <img 
            src="https://i.ibb.co/zh6PNsYs/kovi-logo-fundo-rosa.png" 
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
          {/* Informações do Usuário */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 shadow-sm">
                         <img 
               id="user-avatar"
               src={user?.user_metadata?.avatar_url || "https://placehold.co/40x40/FFFFFF/FF355A?text=K"} 
               alt="Foto do Perfil" 
               className="h-8 w-8 rounded-lg border-2 border-white/30 shadow-sm" 
             />
             <div className="flex flex-col">
               <p id="user-name" className="font-bold text-sm leading-tight">
                 {user?.user_metadata?.full_name || user?.email || 'Utilizador Kovi'}
               </p>
               <p id="user-email" className="text-xs opacity-80 leading-tight">
                 {user?.email || 'A carregar...'}
               </p>
             </div>
          </div>
          
                     {/* Botões de Ação */}
           <div className="flex gap-2">
             {/* Botão de configurações - só visível para admins */}
             {isAdmin && (
               <Link 
                 href="/settings" 
                 className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm text-xs font-medium" 
                 title="Configurações" 
               >
                                                                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                     <path d="M9.796 1.227c.527-1.207 2.38-1.207 2.927 0l.721 1.65c.33.756.985 1.41 1.741 1.741l1.65.721c1.207.527 1.207 2.38 0 2.927l-1.65.721a2.516 2.516 0 0 1-1.741 1.741l-1.65.721c-.527 1.207-2.38 1.207-2.927 0l-.721-1.65a2.516 2.516 0 0 1-1.741-1.741l-1.65-.721c-1.207-.527-1.207-2.38 0-2.927l1.65-.721a2.516 2.516 0 0 1 1.741-1.741l.721-1.65zm2.244 2.244a3.754 3.754 0 1 0-3.756 3.756 3.754 3.754 0 0 0 3.756-3.756z"/>
                   </svg>
                 Config.
               </Link>
             )}
             
             {/* Botão de Logout */}
             <form action="/auth/signout" method="post">
               <button 
                 id="logout-btn"
                 className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm text-xs font-medium"
                 title="Sair"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                   <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                   <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                 </svg>
                 Sair
               </button>
             </form>
           </div>
        </div>
      </div>
    </header>
  )
}