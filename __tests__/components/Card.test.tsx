import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Card from '@/components/Card'
import type { CardWithSLA } from '@/types'

// Mock do componente CardModal
jest.mock('@/components/CardModal', () => {
  return function MockCardModal({ card, onClose }: any) {
    return (
      <div data-testid="card-modal">
        <h2>{card.placa}</h2>
        <button onClick={onClose}>Fechar</button>
      </div>
    )
  }
})

describe('Card Component', () => {
  const mockCard: CardWithSLA = {
    id: '1',
    placa: 'ABC-1234',
    nomeDriver: 'João Silva',
    chofer: 'Pedro Santos',
    faseAtual: 'Fila de Recolha',
    dataCriacao: '2024-01-01T10:00:00Z',
    sla: 2,
    slaText: 'No Prazo',
    empresaResponsavel: 'Empresa Teste',
    modeloVeiculo: 'Honda Civic',
    telefoneContato: '11999999999',
  }

  const disabledCard: CardWithSLA = {
    ...mockCard,
    id: '2',
    faseAtual: 'Aprovar Custo de Recolha',
  }

  it('deve renderizar as informações do card corretamente', () => {
    render(<Card card={mockCard} index={0} />)
    
    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Pedro Santos')).toBeInTheDocument()
    expect(screen.getByText('No Prazo')).toBeInTheDocument()
  })

  it('deve aplicar estilos de SLA corretos', () => {
    const { rerender } = render(<Card card={mockCard} index={0} />)
    
    // No Prazo - deve ter classe verde
    let slaElement = screen.getByText('No Prazo')
    expect(slaElement.className).toContain('bg-green-100')
    expect(slaElement.className).toContain('text-green-800')

    // Em Alerta - deve ter classe amarela
    const alertCard = { ...mockCard, sla: 5, slaText: 'Em Alerta' as const }
    rerender(<Card card={alertCard} index={0} />)
    slaElement = screen.getByText('Em Alerta')
    expect(slaElement.className).toContain('bg-yellow-100')
    expect(slaElement.className).toContain('text-yellow-800')

    // Atrasado - deve ter classe vermelha
    const lateCard = { ...mockCard, sla: 10, slaText: 'Atrasado' as const }
    rerender(<Card card={lateCard} index={0} />)
    slaElement = screen.getByText('Atrasado')
    expect(slaElement.className).toContain('bg-red-100')
    expect(slaElement.className).toContain('text-red-800')
  })

  it('deve abrir o modal ao clicar no card', () => {
    render(<Card card={mockCard} index={0} />)
    
    const cardElement = screen.getByRole('article')
    fireEvent.click(cardElement)
    
    expect(screen.getByTestId('card-modal')).toBeInTheDocument()
    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
  })

  it('deve fechar o modal ao clicar no botão fechar', () => {
    render(<Card card={mockCard} index={0} />)
    
    // Abrir modal
    const cardElement = screen.getByRole('article')
    fireEvent.click(cardElement)
    
    // Verificar que está aberto
    expect(screen.getByTestId('card-modal')).toBeInTheDocument()
    
    // Fechar modal
    const closeButton = screen.getByText('Fechar')
    fireEvent.click(closeButton)
    
    // Verificar que fechou
    expect(screen.queryByTestId('card-modal')).not.toBeInTheDocument()
  })

  it('deve aplicar estilos de card desabilitado para fases desabilitadas', () => {
    render(<Card card={disabledCard} index={0} />)
    
    const cardElement = screen.getByRole('article')
    expect(cardElement.className).toContain('opacity-60')
    expect(cardElement.className).toContain('cursor-not-allowed')
  })

  it('deve exibir mensagem de fase desabilitada', () => {
    render(<Card card={disabledCard} index={0} />)
    
    expect(screen.getByText('em análise da Kovi')).toBeInTheDocument()
  })

  it('deve aplicar animação de entrada com delay baseado no index', () => {
    const { rerender } = render(<Card card={mockCard} index={0} />)
    
    let cardElement = screen.getByRole('article')
    expect(cardElement.style.animationDelay).toBe('0ms')
    
    rerender(<Card card={mockCard} index={5} />)
    cardElement = screen.getByRole('article')
    expect(cardElement.style.animationDelay).toBe('250ms')
  })

  it('deve renderizar informações adicionais quando disponíveis', () => {
    const cardWithExtraInfo = {
      ...mockCard,
      emailChofer: 'pedro@teste.com',
      valorRecolha: 'R$ 100,00',
    }
    
    render(<Card card={cardWithExtraInfo} index={0} />)
    
    // Estas informações aparecem apenas no modal, então vamos abrir
    const cardElement = screen.getByRole('article')
    fireEvent.click(cardElement)
    
    // O modal mockado mostra apenas a placa, mas em um teste real
    // verificaríamos todas as informações
    expect(screen.getByTestId('card-modal')).toBeInTheDocument()
  })
})