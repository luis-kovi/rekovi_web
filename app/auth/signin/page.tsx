'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/kanban')
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignInWithGoogle = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/kanban`,
          queryParams: {
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch (err) {
      setError('Erro ao fazer login com Google. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Elementos animados de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculos animados */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#FF355A] rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-[#FF355A] rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-[#FF355A] rounded-full opacity-20 animate-ping"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-[#FF355A] rounded-full opacity-10 animate-pulse"></div>
        
        {/* Linhas onduladas */}
        <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF355A] to-transparent opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-0 w-full h-1 bg-gradient-to-l from-transparent via-[#FF355A] to-transparent opacity-15 animate-pulse"></div>
        
        {/* Partículas flutuantes */}
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-[#FF355A] rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#FF355A] rounded-full opacity-40 animate-ping"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-[#FF355A] rounded-full opacity-25 animate-bounce"></div>
      </div>

      {/* Container principal - Reduzido */}
      <div className="relative z-10 max-w-sm w-full mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/20">
          {/* Logo e título - Logo dobrado de tamanho */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
              <img 
                src="https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png" 
                alt="Logo Kovi" 
                className="h-40 w-auto object-contain" 
                style={{ aspectRatio: '406/130' }}
              />
            </div>
            <h1 className="text-sm font-medium text-gray-600 mb-1">
              Gestão de recolha
            </h1>
            <h2 className="text-xl font-bold text-gray-900">
              Entrar na sua conta
            </h2>
          </div>

          {/* Botão Google - Melhorado */}
          <div className="mb-4">
            <button
              onClick={handleSignInWithGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              {googleLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  <span className="text-sm">Conectando...</span>
                </div>
              ) : (
                <>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="h-4 w-4" 
                  />
                  <span className="text-sm">Entrar com Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divisor - Melhorado */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">ou</span>
            </div>
          </div>

          {/* Formulário - Campos reduzidos */}
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                <p className="text-red-600 text-xs text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF355A] to-[#E62E4F] text-white py-2.5 px-4 rounded-xl font-medium hover:from-[#E62E4F] hover:to-[#D6253F] focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">Entrando...</span>
                </div>
              ) : (
                <span className="text-sm">Entrar</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 