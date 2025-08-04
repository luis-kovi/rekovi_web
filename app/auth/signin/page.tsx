'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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

      {/* Container principal */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Logo e título */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <img 
                src="https://i.ibb.co/1fTXGSN6/rekovi-identity-updated-1-removebg-preview.png" 
                alt="Logo Kovi" 
                className="h-24 w-auto" 
              />
            </div>
            <h1 className="text-lg font-medium text-gray-600 mb-2">
              Gestão de recolha
            </h1>
            <h2 className="text-2xl font-bold text-gray-900">
              Entrar na sua conta
            </h2>
          </div>

          {/* Formulário */}
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF355A] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#E62E4F] focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>

            <div className="text-center pt-4">
              <Link 
                href="/auth/signup" 
                className="text-[#FF355A] hover:text-[#E62E4F] font-medium transition-colors duration-200"
              >
                Não tem uma conta? Registre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}