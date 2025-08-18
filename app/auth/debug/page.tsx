'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthDebug() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        
        // Verificar sessão
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        
        // Verificar usuário
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Mostrar cookies
        setCookies(document.cookie)
        
        // Escutar mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth event:', event)
          console.log('Auth session:', session)
          setSession(session)
          setUser(session?.user || null)
        })
        
        setLoading(false)
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Debug error:', error)
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleForceRedirect = () => {
    router.push('/kanban')
  }

  const handleClearCookies = () => {
    // Limpar todos os cookies do Supabase
    document.cookie.split(";").forEach((c) => {
      if (c.includes('sb-')) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      }
    });
    window.location.reload()
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug de Autenticação</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Status da Sessão:</h2>
          <pre className="text-sm overflow-auto">
            {session ? 'Sessão ativa' : 'Sem sessão'}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Usuário:</h2>
          <pre className="text-sm overflow-auto">
            {user ? JSON.stringify(user, null, 2) : 'Nenhum usuário logado'}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Cookies:</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap break-all">
            {cookies || 'Nenhum cookie encontrado'}
          </pre>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleForceRedirect}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Forçar Redirecionamento para Kanban
          </button>
          
          <button
            onClick={handleClearCookies}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Limpar Cookies
          </button>
          
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  )
}