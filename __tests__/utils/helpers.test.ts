import {
  calcularSLA,
  formatPersonName,
  keepOriginalFormat,
  formatDate,
  isMobileDevice,
  getRedirectRoute,
} from '@/utils/helpers'

describe('Helpers Utils', () => {
  describe('calcularSLA', () => {
    it('deve retornar 0 para data inválida ou não fornecida', () => {
      expect(calcularSLA()).toBe(0)
      expect(calcularSLA('')).toBe(0)
      expect(calcularSLA('invalid-date')).toBe(0)
    })

    it('deve calcular dias corretos excluindo domingos', () => {
      // Mock da data atual para ser segunda-feira, 8 de janeiro de 2024
      const mockDate = new Date('2024-01-08T12:00:00Z')
      jest.spyOn(global, 'Date').mockImplementation((dateString?: any) => {
        if (dateString) {
          return new Date(dateString)
        }
        return mockDate
      })

      // Teste: criado na segunda anterior (1 de janeiro de 2024)
      // Segunda a segunda = 6 dias úteis (excluindo domingo)
      expect(calcularSLA('2024-01-01T10:00:00Z')).toBe(6)

      // Restaurar Date
      jest.restoreAllMocks()
    })

    it('deve retornar 0 para datas futuras', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      expect(calcularSLA(futureDate.toISOString())).toBe(0)
    })
  })

  describe('formatPersonName', () => {
    it('deve capitalizar nomes corretamente', () => {
      expect(formatPersonName('joão silva')).toBe('João Silva')
      expect(formatPersonName('MARIA DOS SANTOS')).toBe('Maria Dos Santos')
      expect(formatPersonName('josé')).toBe('José')
    })

    it('deve retornar N/A para valores vazios ou N/A', () => {
      expect(formatPersonName()).toBe('N/A')
      expect(formatPersonName('')).toBe('N/A')
      expect(formatPersonName('N/A')).toBe('N/A')
    })

    it('deve lidar com caracteres especiais', () => {
      expect(formatPersonName('andré luís')).toBe('André Luís')
      expect(formatPersonName('joão-pedro')).toBe('João-Pedro')
    })
  })

  describe('keepOriginalFormat', () => {
    it('deve retornar o texto original sem formatação', () => {
      expect(keepOriginalFormat('Texto Original')).toBe('Texto Original')
      expect(keepOriginalFormat('MAIÚSCULAS')).toBe('MAIÚSCULAS')
    })

    it('deve retornar N/A para valores vazios', () => {
      expect(keepOriginalFormat()).toBe('N/A')
      expect(keepOriginalFormat('')).toBe('N/A')
    })
  })

  describe('formatDate', () => {
    it('deve formatar datas ISO para formato brasileiro', () => {
      expect(formatDate('2024-01-15T14:30:00Z')).toBe('15/01/2024 14:30')
      expect(formatDate('2023-12-25T08:00:00')).toBe('25/12/2023 08:00')
    })

    it('deve retornar datas já formatadas sem alteração', () => {
      expect(formatDate('15/01/2024 14:30')).toBe('15/01/2024 14:30')
    })

    it('deve retornar N/A ou string original para valores inválidos', () => {
      expect(formatDate()).toBe('N/A')
      expect(formatDate('')).toBe('N/A')
      expect(formatDate('N/A')).toBe('N/A')
      expect(formatDate('invalid-date')).toBe('invalid-date')
    })

    it('deve adicionar zeros à esquerda quando necessário', () => {
      expect(formatDate('2024-01-05T09:05:00')).toBe('05/01/2024 09:05')
    })
  })

  describe('isMobileDevice', () => {
    it('deve detectar dispositivos móveis pelo user agent', () => {
      // Dispositivos móveis
      expect(isMobileDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')).toBe(true)
      expect(isMobileDevice('Mozilla/5.0 (Linux; Android 10; SM-G960U)')).toBe(true)
      expect(isMobileDevice('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)')).toBe(true)
      expect(isMobileDevice('BlackBerry9300/5.0.0.716')).toBe(true)
      
      // Desktop
      expect(isMobileDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false)
      expect(isMobileDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false)
    })

    it('deve retornar false para user agent vazio', () => {
      expect(isMobileDevice('')).toBe(false)
    })
  })

  describe('getRedirectRoute', () => {
    it('deve redirecionar para /mobile em dispositivos móveis', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      expect(getRedirectRoute(mobileUA)).toBe('/mobile')
    })

    it('deve redirecionar para /kanban em desktop', () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      expect(getRedirectRoute(desktopUA)).toBe('/kanban')
    })
  })
})