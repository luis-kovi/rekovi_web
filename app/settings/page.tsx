'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

// Forçar renderização dinâmica para evitar pré-renderizado
export const dynamic = 'force-dynamic'

interface User {
  id: string
  nome: string
  email: string
  empresa: string
  permission_type: string
  status: 'active' | 'inactive'
  area_atuacao: string[] // Array de áreas de atuação
  ultimo_login?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalUsers: number
  usersPerPage: number
}

// Áreas de atuação disponíveis (em ordem alfabética)
const AREAS_ATUACAO = [
  'Belo Horizonte',
  'Brasília',
  'Campinas',
  'Curitiba',
  'Florianópolis',
  'Fortaleza',
  'Goiania',
  'Porto Alegre',
  'Recife',
  'Santos',
  'São Paulo'
]

// Opções de empresa (em ordem alfabética)
const EMPRESA_OPTIONS = [
  'Ativa Pronta Resposta',
  'Kovi Tecnologia S/A',
  'OnSystem Recuperações',
  'RVS Monitoramento'
]

// Opções de permissão
const PERMISSION_OPTIONS = [
  { value: 'Ativa', label: 'Ativa' },
  { value: 'OnSystem', label: 'OnSystem' },
  { value: 'RVS', label: 'RVS' },
  { value: 'Chofer', label: 'Chofer' },
  { value: 'Kovi', label: 'Kovi' }
]

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 0,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 10
  })
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    empresa: '',
    permission_type: 'Kovi',
    status: 'active' as 'active' | 'inactive',
    area_atuacao: [] as string[]
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [permissionType, setPermissionType] = useState<string>('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    console.log('Settings: Component mounted, checking auth')
    checkAuthAndLoadUsers()
  }, [])

  useEffect(() => {
    console.log('Settings: loadUsers effect triggered - currentPage:', pagination.currentPage, 'searchTerm:', searchTerm, 'loading:', loading)
    if (pagination.currentPage > 0 && !loading) {
      loadUsers()
    }
  }, [pagination.currentPage, searchTerm])

  // Auto-selecionar todas as áreas quando empresa e permissão são Kovi
  useEffect(() => {
    if (formData.empresa === 'Kovi Tecnologia S/A' && formData.permission_type === 'Kovi') {
      setFormData(prev => ({
        ...prev,
        area_atuacao: [...AREAS_ATUACAO]
      }))
    }
  }, [formData.empresa, formData.permission_type])

  const checkAuthAndLoadUsers = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        router.push('/')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('Settings: No session, redirecting to /')
        router.push('/')
        return
      }

      console.log('Settings: User session found:', session.user.email)

      const permissionType = session.user.app_metadata?.permissionType?.toLowerCase() || 'default'
      console.log('Settings: Permission type from app_metadata:', permissionType)

      const isAdmin = permissionType === 'admin'
      console.log('Settings: Is admin:', isAdmin)

      if (!isAdmin) {
        console.log('Settings: Not admin, redirecting to /kanban')
        router.push('/kanban')
        return
      }

      setUser(session.user)
      setPermissionType(permissionType)

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

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    // Validar nome (pelo menos duas palavras)
    if (!formData.nome.trim()) {
      errors.nome = 'Campo obrigatório, digite o nome completo do usuário'
    } else {
      const words = formData.nome.trim().split(' ').filter(word => word.length > 0)
      if (words.length < 2) {
        errors.nome = 'Digite o nome completo do usuário (pelo menos duas palavras)'
      }
    }

    // Validar email
    if (!formData.email.trim()) {
      errors.email = 'Campo obrigatório'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Digite um e-mail válido'
      }
    }

    // Validar empresa
    if (!formData.empresa.trim()) {
      errors.empresa = 'Campo obrigatório'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openAddUserModal = () => {
    setEditingUser(null)
    setFormData({
      nome: '',
      email: '',
      empresa: '',
      permission_type: 'Kovi',
      status: 'active',
      area_atuacao: []
    })
    setFormErrors({})
    setShowModal(true)
  }

  const openEditUserModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      empresa: user.empresa,
      permission_type: user.permission_type,
      status: user.status,
      area_atuacao: user.area_atuacao || []
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleInactivateUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja ${user.status === 'active' ? 'inativar' : 'ativar'} o usuário ${user.nome}?`)) {
      return
    }

    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase.functions.invoke('update-user-permission', {
        body: { 
          id: user.id, 
          updates: { status: newStatus }
        }
      })

      if (error) throw error
      await loadUsers()
    } catch (error) {
      alert('Erro ao alterar status do usuário: ' + (error as Error).message)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          isActive ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        {isActive ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <Header user={user} permissionType={permissionType} isUpdating={false} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF355A] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando configurações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <Header user={user} permissionType={permissionType} isUpdating={false} />

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Configurações
                </h1>
                <p className="text-gray-600">
                  Gerencie usuários e permissões do sistema
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {pagination.totalUsers} usuários
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            {/* Search and Actions Header */}
            <div className="bg-gradient-to-r from-white to-gray-50/50 px-6 py-6 border-b border-gray-200/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="search" 
                    placeholder="Buscar por nome, e-mail ou empresa..." 
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#FF355A] focus:border-[#FF355A] transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                {/* Add User Button */}
                <button 
                  onClick={openAddUserModal}
                  className="bg-gradient-to-r from-[#FF355A] to-[#E02E4D] hover:from-[#E02E4D] hover:to-[#D12846] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF355A] focus:ring-offset-2 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">Cadastrar Usuário</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Permissão
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FF355A] border-t-transparent mr-3"></div>
                            <span className="text-gray-500">Carregando usuários...</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                            <p className="text-sm">Tente ajustar os filtros de pesquisa</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF355A] to-[#E02E4D] flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.empresa}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.permission_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openEditUserModal(user)}
                                className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                title="Editar usuário"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleInactivateUser(user)}
                                className={`transition-colors p-2 rounded-lg ${
                                  user.status === 'active' 
                                    ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                }`}
                                title={user.status === 'active' ? 'Inativar usuário' : 'Ativar usuário'}
                              >
                                {user.status === 'active' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364L18.364 5.636" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {loading ? (
                  <div className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FF355A] border-t-transparent mr-3"></div>
                      <span className="text-gray-500">Carregando usuários...</span>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                      <p className="text-sm">Tente ajustar os filtros de pesquisa</p>
                    </div>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF355A] to-[#E02E4D] flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.nome}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(user.status)}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.permission_type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button 
                            onClick={() => openEditUserModal(user)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleInactivateUser(user)}
                            className={`transition-colors p-2 rounded-lg ${
                              user.status === 'active' 
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364L18.364 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(pagination.currentPage - 1) * pagination.usersPerPage + 1}</span> até{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)}
                      </span>{' '}
                      de <span className="font-medium">{pagination.totalUsers}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button 
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum = pagination.currentPage - 2 + i
                        if (pageNum < 1) pageNum = i + 1
                        if (pageNum > pagination.totalPages) pageNum = pagination.totalPages - (4 - i)
                        if (pageNum < 1 || pageNum > pagination.totalPages) return null
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagination.currentPage
                                ? 'z-10 bg-[#FF355A] border-[#FF355A] text-white'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button 
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Modal */}
      {showModal && (
        <>
          {/* Backdrop with blur effect */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 transition-all duration-300">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0" onClick={() => setShowModal(false)} />
              
              {/* Modal */}
              <div className="inline-block align-bottom bg-white rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#FF355A] to-[#E02E4D] px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                    </h3>
                    <button 
                      onClick={() => setShowModal(false)}
                      className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="px-6 py-6">
                  <div className="space-y-6">
                    {/* Nome */}
                    <div>
                      <label htmlFor="user-nome" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input 
                        type="text" 
                        id="user-nome"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-[#FF355A] focus:border-[#FF355A] transition-all duration-200 ${
                          formErrors.nome ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Digite o nome completo do usuário"
                      />
                      {formErrors.nome && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {formErrors.nome}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <input 
                        type="email" 
                        id="user-email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-[#FF355A] focus:border-[#FF355A] transition-all duration-200 ${
                          formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="usuario@exemplo.com"
                      />
                      {formErrors.email && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Grid para Empresa e Permissão */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Empresa */}
                      <div>
                        <label htmlFor="user-empresa" className="block text-sm font-medium text-gray-700 mb-2">
                          Empresa *
                        </label>
                        <select 
                          id="user-empresa"
                          required
                          value={formData.empresa}
                          onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                          className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-[#FF355A] focus:border-[#FF355A] transition-all duration-200 ${
                            formErrors.empresa ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Selecione uma empresa</option>
                          {EMPRESA_OPTIONS.map(empresa => (
                            <option key={empresa} value={empresa}>
                              {empresa}
                            </option>
                          ))}
                        </select>
                        {formErrors.empresa && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {formErrors.empresa}
                          </p>
                        )}
                      </div>

                      {/* Permissão */}
                      <div>
                        <label htmlFor="user-permission" className="block text-sm font-medium text-gray-700 mb-2">
                          Permissão *
                        </label>
                        <select 
                          id="user-permission"
                          required
                          value={formData.permission_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, permission_type: e.target.value }))}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FF355A] focus:border-[#FF355A] transition-all duration-200"
                        >
                          {PERMISSION_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="user-status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select 
                        id="user-status"
                        required
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FF355A] focus:border-[#FF355A] transition-all duration-200"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>

                    {/* Área de Atuação */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Área de Atuação
                      </label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                          {AREAS_ATUACAO.map((area) => (
                            <label key={area} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.area_atuacao.includes(area)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      area_atuacao: [...prev.area_atuacao, area]
                                    }))
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      area_atuacao: prev.area_atuacao.filter(a => a !== area)
                                    }))
                                  }
                                }}
                                className="rounded border-gray-300 text-[#FF355A] focus:ring-[#FF355A] focus:ring-offset-0"
                              />
                              <span className="text-sm text-gray-700 flex-1">{area}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-gradient-to-r from-[#FF355A] to-[#E02E4D] hover:from-[#E02E4D] hover:to-[#D12846] text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center gap-2"
                    >
                      {submitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      )}
                      {submitting ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}