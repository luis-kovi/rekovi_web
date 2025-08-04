'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Forçar renderização dinâmica para evitar pré-renderizado
export const dynamic = 'force-dynamic'

interface User {
  id: string
  email: string
  empresa?: string
  permission_type: string
  status: 'active' | 'inactive'
  ultimo_login?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalUsers: number
  usersPerPage: number
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 0, // Inicializar com 0 para evitar carregamento prematuro
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 10
  })
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    empresa: '',
    permission_type: 'Kovi',
    status: 'active' as 'active' | 'inactive'
  })
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    console.log('Settings: Component mounted, checking auth')
    checkAuthAndLoadUsers()
  }, [])

  // Debug: Log quando o componente renderiza
  console.log('Settings: Component rendering, loading state:', loading)

  useEffect(() => {
    console.log('Settings: loadUsers effect triggered - currentPage:', pagination.currentPage, 'searchTerm:', searchTerm, 'loading:', loading)
    if (pagination.currentPage > 0 && !loading) { // Só carregar se já tiver sido inicializado e não estiver carregando
      loadUsers()
    }
  }, [pagination.currentPage, searchTerm]) // Remover loading das dependências para evitar loop

  const checkAuthAndLoadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('Settings: No session, redirecting to /')
        router.push('/')
        return
      }

      console.log('Settings: User session found:', session.user.email)

      // Verificar se é admin usando a mesma lógica da página Kanban
      const permissionType = session.user.app_metadata?.permissionType?.toLowerCase() || 'default'
      console.log('Settings: Permission type from app_metadata:', permissionType)

      const isAdmin = permissionType === 'admin'
      console.log('Settings: Is admin:', isAdmin)

      if (!isAdmin) {
        console.log('Settings: Not admin, redirecting to /kanban')
        router.push('/kanban')
        return
      }

      console.log('Settings: Admin verified, setting initial page and loading users')
      setPagination(prev => ({ ...prev, currentPage: 1 }))
      await loadUsers()
    } catch (error) {
      console.error('Erro na autenticação:', error)
      router.push('/')
    }
  }

  const loadUsers = async () => {
    try {
      // Verificar se a página atual é válida
      if (pagination.currentPage <= 0) {
        console.log('Settings: Skipping loadUsers - invalid page:', pagination.currentPage)
        return
      }

      console.log('Settings: Loading users for page:', pagination.currentPage)
      setLoading(true)
      
      const { data, error } = await supabase.functions.invoke('get-users', {
        body: { 
          search: searchTerm, 
          page: pagination.currentPage, 
          limit: pagination.usersPerPage 
        }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)

      setUsers(data.users || [])
      setPagination(prev => ({
        ...prev,
        totalUsers: data.count || 0,
        totalPages: Math.ceil((data.count || 0) / pagination.usersPerPage)
      }))
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      alert('Erro ao carregar usuários: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const openAddUserModal = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      empresa: '',
      permission_type: 'Kovi',
      status: 'active'
    })
    setShowModal(true)
  }

  const openEditUserModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      empresa: user.empresa || '',
      permission_type: user.permission_type,
      status: user.status
    })
    setShowModal(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      let result
      if (editingUser) {
        result = await supabase.functions.invoke('update-user-permission', {
          body: { id: editingUser.id, updates: formData }
        })
      } else {
        result = await supabase.functions.invoke('create-user-permission', {
          body: formData
        })
      }

      if (result.error) throw result.error
      if (result.data.error) throw new Error(result.data.error)
      
      setShowModal(false)
      await loadUsers()
    } catch (error) {
      alert('Erro: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo' 
    })
  }

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active'
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#FF355A] text-white flex-shrink-0 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <img 
              src="https://i.ibb.co/2pSmCRw/kovi-logo-fundo-rosa-removebg-preview.png" 
              alt="Logo Kovi" 
              className="h-10 w-auto" 
            />
            <span className="text-white opacity-50">/</span>
            <h1 className="text-xl font-bold">Configurações</h1>
          </div>
          <Link 
            href="/kanban" 
            className="text-white hover:text-gray-200 flex items-center gap-2 text-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Voltar ao Kanban
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <a href="#" className="border-[#FF355A] text-[#FF355A] whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Usuários
              </a>
            </nav>
          </div>

          {/* Users Tab Content */}
          <div className="p-6">
            {/* Search and Add Button */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <input 
                  type="search" 
                  placeholder="Buscar por e-mail ou empresa..." 
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M9.5 16q-2.725 0-4.612-1.888T3 9.5q0-2.725 1.888-4.612T9.5 3q2.725 0 4.612 1.888T16 9.5q0 1.1-.35 2.075t-.925 1.775l5.075 5.075q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275L13.15 14.2q-.8.575-1.775.925T9.5 16zm0-2q1.875 0 3.188-1.313T14 9.5q0-1.875-1.313-3.188T9.5 5Q7.625 5 6.312 6.313T5 9.5q0 1.875 1.313 3.188T9.5 14z"/>
                </svg>
              </div>
              <button 
                onClick={openAddUserModal}
                className="bg-[#FF355A] hover:bg-[#E02E4D] text-white px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30"
              >
                Cadastrar Usuário
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissão</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
                    <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email.split('@')[0]}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {user.empresa || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {user.permission_type}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {formatDate(user.ultimo_login)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => openEditUserModal(user)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                              <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="pagination-btn"
                  >
                    «
                  </button>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="pagination-btn"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-btn"
                  >
                    ›
                  </button>
                  <button 
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-btn"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform scale-95 modal-panel">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold">
                {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-2xl hover:text-gray-700 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="user-email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input 
                    type="email" 
                    id="user-email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="user-empresa" className="block text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <input 
                    type="text" 
                    id="user-empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="user-permission" className="block text-sm font-medium text-gray-700">
                    Permissão
                  </label>
                  <select 
                    id="user-permission"
                    required
                    value={formData.permission_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, permission_type: e.target.value }))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200 appearance-none"
                  >
                    <option value="Kovi">Kovi</option>
                    <option value="OnSystem">OnSystem</option>
                    <option value="Ativa">Ativa</option>
                    <option value="Chofer">Chofer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="user-status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select 
                    id="user-status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 focus:border-[#FF355A] focus:outline-none transition-all duration-200 appearance-none"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div className="text-right pt-4">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-[#FF355A] hover:bg-[#E02E4D] text-white px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
