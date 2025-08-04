// app/settings/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    return redirect('/')
  }

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) {
    return redirect('/')
  }

  const permissionType = user.app_metadata?.permissionType?.toLowerCase() || 'default';
  
  // Verificar se o usuário está cadastrado
  if (!permissionType || permissionType === 'default') {
    return redirect('/?error=unauthorized')
  }

  // Verificar se o usuário é admin
  if (permissionType !== 'admin') {
    return redirect('/kanban')
  }

  return (
    <div className="app-settings flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Header user={user} permissionType={permissionType} isUpdating={false} />
      
      {/* Botão Voltar */}
      <div className="px-6 py-4">
        <a 
          href="/kanban"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Kanban
        </a>
      </div>

      {/* Conteúdo da página de configurações */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <img 
                  src="https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png" 
                  alt="Logo Kovi" 
                  className="h-16 w-auto" 
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-600">Gerencie as configurações do sistema</p>
              </div>
            </div>

            {/* Seções de configuração */}
            <div className="space-y-8">
              {/* Seção de Usuários */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestão de Usuários</h2>
                <p className="text-gray-600 mb-4">
                  Gerencie usuários e permissões do sistema.
                </p>
                <button className="bg-[#FF355A] text-white px-6 py-2 rounded-lg hover:bg-[#E62E4F] transition-colors duration-200">
                  Gerenciar Usuários
                </button>
              </div>

              {/* Seção de Sistema */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações do Sistema</h2>
                <p className="text-gray-600 mb-4">
                  Configure parâmetros gerais do sistema.
                </p>
                <button className="bg-[#FF355A] text-white px-6 py-2 rounded-lg hover:bg-[#E62E4F] transition-colors duration-200">
                  Configurar Sistema
                </button>
              </div>

              {/* Seção de Backup */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup e Restauração</h2>
                <p className="text-gray-600 mb-4">
                  Gerencie backups e restaurações do sistema.
                </p>
                <button className="bg-[#FF355A] text-white px-6 py-2 rounded-lg hover:bg-[#E62E4F] transition-colors duration-200">
                  Gerenciar Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 