// app/page.tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'

// Forçar renderização dinâmica para evitar pré-renderizado
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [errorMessage, setErrorMessage] = useState('')
  
  // Verificar se há erro na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    if (error === 'unauthorized') {
      setErrorMessage('Usuário não cadastrado. Entre em contato com o administrador do sistema.')
    }
  }, [])

  // Rastrear posição do mouse para efeito parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSignInWithGoogle = async () => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    setIsLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/kanban`,
          queryParams: {
            prompt: 'consent',
          },
        },
      })
    } catch (error) {
      console.error('Erro no login:', error)
      setIsLoading(false)
    }
  }

  return (
    <div 
      style={{ fontFamily: "'Poppins', sans-serif" }} 
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-red-900 to-slate-900"
    >
      {/* Animações de fundo */}
      <div className="absolute inset-0">
        {/* Gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF355A]/20 via-red-600/20 to-[#FF355A]/20 animate-pulse"></div>
        
        {/* Efeito Aurora */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-[#FF355A]/40 via-red-600/40 to-[#FF355A]/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-red-600/40 via-[#FF355A]/40 to-red-600/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-[#FF355A]/40 via-red-600/40 to-[#FF355A]/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Círculos flutuantes */}
        <div 
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-[#FF355A]/30 to-red-600/30 rounded-full blur-3xl animate-float"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-red-600/30 to-[#FF355A]/30 rounded-full blur-3xl animate-float-delayed"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
          }}
        ></div>
        
        {/* Partículas animadas */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Elementos geométricos flutuantes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={`geo-${i}`}
                             className={`absolute opacity-20 animate-float-gentle ${
                 i % 2 === 0 ? 'bg-[#FF355A]/30' : 'bg-red-600/30'
               }`}
              style={{
                width: `${20 + Math.random() * 40}px`,
                height: `${20 + Math.random() * 40}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '25%',
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Container principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Card de login com glassmorphism */}
          <div className="relative group">
                         {/* Efeito de brilho no hover */}
             <div className="absolute -inset-1 bg-gradient-to-r from-[#FF355A] via-red-600 to-[#FF355A] rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            
            {/* Card principal */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 md:p-12">
              {/* Logo com animação */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                                     <div className="absolute inset-0 bg-gradient-to-r from-[#FF355A] to-red-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
                                     <img 
                     src="https://i.ibb.co/2pSmCRw/kovi-logo-fundo-rosa-removebg-preview.png" 
                     alt="Logo Kovi" 
                     className="relative h-16 w-auto animate-float-gentle" 
                   />
                </div>
              </div>

              {/* Título com gradiente */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent mb-2">
                  Gestão de Recolhas
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  Acesse sua conta para continuar
                </p>
              </div>

              {/* Mensagem de Erro */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-200 text-sm font-medium">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Botão de login */}
              <button 
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                                 className="relative w-full group/btn overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF355A] to-red-600 p-0.5 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Efeito de brilho no botão */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                
                                 <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF355A] to-red-600 px-6 py-4 rounded-2xl">
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-white font-semibold">Conectando...</span>
                    </div>
                  ) : (
                    <>
                      <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="Google" 
                        className="h-5 w-5 drop-shadow-sm" 
                      />
                      <span className="text-white font-semibold text-base md:text-lg">
                        Entrar com Google
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Informações adicionais */}
              <div className="mt-8 text-center">
                <p className="text-gray-400 text-xs">
                  Seguro e confiável • Acesso instantâneo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com informações */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-gray-400 text-xs">
          © 2024 Kovi • Todos os direitos reservados
        </p>
      </div>

              {/* Efeitos de partículas interativas */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Ondas de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={`wave-${i}`}
              className="absolute w-full h-full opacity-10"
              style={{
                                 background: `radial-gradient(circle at ${20 + i * 30}% ${30 + i * 20}%, ${i % 2 === 0 ? '#FF355A' : '#DC2626'} 0%, transparent 70%)`,
                animation: `pulse ${4 + i}s ease-in-out infinite`,
                animationDelay: `${i}s`,
              }}
            ></div>
          ))}
        </div>
    </div>
  )
}
