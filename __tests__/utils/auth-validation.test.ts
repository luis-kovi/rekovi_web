import { 
  filterCardsByPermissionsImproved,
  validateUserPermission,
  hasAccessToCard
} from '@/utils/auth-validation'
import type { Card, DatabaseUser } from '@/types'

describe('Auth Validation Utils', () => {
  const mockCards: Card[] = [
    {
      id: '1',
      placa: 'ABC-1234',
      nomeDriver: 'João Silva',
      chofer: 'Pedro Santos',
      faseAtual: 'Fila de Recolha',
      dataCriacao: '2024-01-01',
      empresaResponsavel: 'ATIVA',
    },
    {
      id: '2',
      placa: 'DEF-5678',
      nomeDriver: 'Maria Santos',
      chofer: 'Ana Costa',
      faseAtual: 'Tentativa 1 de Recolha',
      dataCriacao: '2024-01-02',
      empresaResponsavel: 'ONSYSTEM',
    },
    {
      id: '3',
      placa: 'GHI-9012',
      nomeDriver: 'Carlos Oliveira',
      chofer: 'chofer@email.com',
      faseAtual: 'Aprovar Custo de Recolha',
      dataCriacao: '2024-01-03',
      emailChofer: 'chofer@email.com',
      empresaResponsavel: 'KOVI',
    },
  ]

  describe('filterCardsByPermissionsImproved', () => {
    it('deve retornar todos os cards para admin', () => {
      const adminUser: DatabaseUser = {
        email: 'admin@test.com',
        permission_type: 'admin',
        status: 'active',
      }

      const filtered = filterCardsByPermissionsImproved(mockCards, adminUser)
      expect(filtered).toHaveLength(3)
      expect(filtered).toEqual(mockCards)
    })

    it('deve filtrar cards por empresa para usuários específicos', () => {
      const ativaUser: DatabaseUser = {
        email: 'user@ativa.com',
        permission_type: 'ativa',
        status: 'active',
      }

      const filtered = filterCardsByPermissionsImproved(mockCards, ativaUser)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].empresaResponsavel).toBe('ATIVA')
    })

    it('deve filtrar cards para chofer pelo email', () => {
      const choferUser: DatabaseUser = {
        email: 'chofer@email.com',
        permission_type: 'chofer',
        status: 'active',
      }

      const filtered = filterCardsByPermissionsImproved(mockCards, choferUser)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].emailChofer).toBe('chofer@email.com')
    })

    it('deve retornar array vazio para usuário sem permissões válidas', () => {
      const invalidUser: DatabaseUser = {
        email: 'invalid@test.com',
        permission_type: 'invalid_type',
        status: 'active',
      }

      const filtered = filterCardsByPermissionsImproved(mockCards, invalidUser)
      expect(filtered).toHaveLength(0)
    })

    it('deve aplicar múltiplas áreas de atuação', () => {
      const multiAreaUser: DatabaseUser = {
        email: 'multi@test.com',
        permission_type: 'ativa',
        status: 'active',
        area_atuacao: ['ATIVA', 'KOVI'],
      }

      const filtered = filterCardsByPermissionsImproved(mockCards, multiAreaUser)
      expect(filtered).toHaveLength(2)
      expect(filtered.map(c => c.empresaResponsavel)).toEqual(['ATIVA', 'KOVI'])
    })
  })

  describe('validateUserPermission', () => {
    it('deve validar permissão de admin corretamente', () => {
      const adminUser: DatabaseUser = {
        email: 'admin@test.com',
        permission_type: 'admin',
        status: 'active',
      }

      expect(validateUserPermission(adminUser, 'admin')).toBe(true)
      expect(validateUserPermission(adminUser, 'ativa')).toBe(false)
    })

    it('deve retornar false para usuário sem permission_type', () => {
      const userWithoutPermission: DatabaseUser = {
        email: 'user@test.com',
        status: 'active',
      }

      expect(validateUserPermission(userWithoutPermission, 'admin')).toBe(false)
    })

    it('deve ser case-insensitive', () => {
      const user: DatabaseUser = {
        email: 'user@test.com',
        permission_type: 'ADMIN',
        status: 'active',
      }

      expect(validateUserPermission(user, 'admin')).toBe(true)
    })
  })

  describe('hasAccessToCard', () => {
    it('admin deve ter acesso a todos os cards', () => {
      const adminUser: DatabaseUser = {
        email: 'admin@test.com',
        permission_type: 'admin',
        status: 'active',
      }

      mockCards.forEach(card => {
        expect(hasAccessToCard(card, adminUser)).toBe(true)
      })
    })

    it('usuário de empresa deve ter acesso apenas aos seus cards', () => {
      const ativaUser: DatabaseUser = {
        email: 'user@ativa.com',
        permission_type: 'ativa',
        status: 'active',
      }

      expect(hasAccessToCard(mockCards[0], ativaUser)).toBe(true) // ATIVA
      expect(hasAccessToCard(mockCards[1], ativaUser)).toBe(false) // ONSYSTEM
      expect(hasAccessToCard(mockCards[2], ativaUser)).toBe(false) // KOVI
    })

    it('chofer deve ter acesso apenas aos seus próprios cards', () => {
      const choferUser: DatabaseUser = {
        email: 'chofer@email.com',
        permission_type: 'chofer',
        status: 'active',
      }

      expect(hasAccessToCard(mockCards[0], choferUser)).toBe(false)
      expect(hasAccessToCard(mockCards[1], choferUser)).toBe(false)
      expect(hasAccessToCard(mockCards[2], choferUser)).toBe(true)
    })

    it('deve retornar false para permissões inválidas', () => {
      const invalidUser: DatabaseUser = {
        email: 'invalid@test.com',
        permission_type: 'invalid',
        status: 'active',
      }

      mockCards.forEach(card => {
        expect(hasAccessToCard(card, invalidUser)).toBe(false)
      })
    })
  })
})