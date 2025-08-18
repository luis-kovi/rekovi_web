'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ForceRefresh() {
  const [status, setStatus] = useState('Verificando sessão...')
  const router = useRouter()

  useEffect(() => {
    const checkAndRefresh = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          setStatus('Erro: Cliente Supabase não disponível')
          return
        }

        // Tentar obter a sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setStatus(`Erro ao obter sessão: ${sessionError.message}`)
          return
        }

        if (session) {
          setStatus('Sessão encontrada! Redirecionando...')
          
          // Forçar refresh da sessão
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession()
          
          if (refreshError) {
            setStatus(`Erro ao atualizar sessão: ${refreshError.message}`)
            return
          }

          if (refreshedSession) {
            setStatus('Sessão atualizada com sucesso!')
            
            // Aguardar um momento para garantir que os cookies foram salvos
            setTimeout(() => {
              const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent)
              router.push(isMobile ? '/mobile' : '/kanban')
            }, 1000)
          }
        } else {
          setStatus('Nenhuma sessão encontrada. Redirecionando para login...')
          setTimeout(() => {
            router.push('/auth/signin')
          }, 2000)
        }
      } catch (error) {
        setStatus(`Erro: ${error}`)
      }
    }

    checkAndRefresh()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Verificando Autenticação</h1>
        <p className="text-gray-600 mb-4">{status}</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  )
}