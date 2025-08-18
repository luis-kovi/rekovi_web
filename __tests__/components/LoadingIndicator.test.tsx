import React from 'react'
import { render, screen } from '@testing-library/react'
import LoadingIndicator from '@/components/LoadingIndicator'

describe('LoadingIndicator Component', () => {
  it('deve renderizar o componente de loading', () => {
    render(<LoadingIndicator />)
    
    const loadingElement = screen.getByRole('status')
    expect(loadingElement).toBeInTheDocument()
  })

  it('deve ter a classe de animação spin', () => {
    render(<LoadingIndicator />)
    
    const spinnerElement = screen.getByRole('status').firstChild
    expect(spinnerElement).toHaveClass('animate-spin')
  })

  it('deve ter texto acessível para leitores de tela', () => {
    render(<LoadingIndicator />)
    
    const srOnlyText = screen.getByText('Loading...')
    expect(srOnlyText).toBeInTheDocument()
    expect(srOnlyText).toHaveClass('sr-only')
  })

  it('deve ter as cores corretas do spinner', () => {
    render(<LoadingIndicator />)
    
    const spinnerPath = screen.getByRole('status').querySelector('path:last-child')
    expect(spinnerPath).toHaveAttribute('fill', 'currentColor')
  })

  it('deve ter o tamanho correto', () => {
    render(<LoadingIndicator />)
    
    const svgElement = screen.getByRole('status').querySelector('svg')
    expect(svgElement).toHaveClass('w-8', 'h-8')
  })
})