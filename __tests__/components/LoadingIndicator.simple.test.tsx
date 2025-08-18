// __tests__/components/LoadingIndicator.simple.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import LoadingIndicator from '@/components/LoadingIndicator'

describe('LoadingIndicator Component - Simple', () => {
  it('deve renderizar sem erros', () => {
    expect(() => render(<LoadingIndicator />)).not.toThrow()
  })

  it('deve conter um SVG animado', () => {
    render(<LoadingIndicator />)
    
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg).toBeInTheDocument()
    expect(svg.parentElement).toHaveClass('animate-spin')
  })

  it('deve exibir texto de carregamento', () => {
    render(<LoadingIndicator />)
    
    const loadingText = screen.getByText(/carregar|loading/i)
    expect(loadingText).toBeInTheDocument()
  })

  it('deve ter classes de estilo corretas no container', () => {
    const { container } = render(<LoadingIndicator />)
    
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('flex')
    expect(wrapper).toHaveClass('items-center')
    expect(wrapper).toHaveClass('justify-center')
  })
})