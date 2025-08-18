import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { createClient } from '@/utils/supabase/client'

// Mocks já configurados no jest.setup.ts
jest.mock('next/navigation')
jest.mock('@/utils/supabase/client')

describe('LogoutButton Component', () => {
  const mockPush = jest.fn()
  const mockSignOut = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: mockSignOut,
      },
    })
  })

  it('deve renderizar o botão de logout', () => {
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /sair/i })
    expect(button).toBeInTheDocument()
  })

  it('deve chamar signOut e redirecionar ao clicar', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })
    
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /sair/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('deve lidar com erro no logout', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockSignOut.mockResolvedValueOnce({ 
      error: new Error('Erro ao fazer logout') 
    })
    
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /sair/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao fazer logout:',
        expect.any(Error)
      )
      // Não deve redirecionar em caso de erro
      expect(mockPush).not.toHaveBeenCalled()
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('deve ter as classes de estilo corretas', () => {
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /sair/i })
    expect(button).toHaveClass('text-gray-700', 'hover:text-gray-900')
  })

  it('deve renderizar o ícone de logout', () => {
    render(<LogoutButton />)
    
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-5', 'h-5')
  })

  it('deve desabilitar o botão durante o logout', async () => {
    // Mock para simular delay
    mockSignOut.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    )
    
    render(<LogoutButton />)
    
    const button = screen.getByRole('button', { name: /sair/i })
    
    // Inicialmente não deve estar desabilitado
    expect(button).not.toBeDisabled()
    
    // Clicar no botão
    fireEvent.click(button)
    
    // Deve estar desabilitado durante o processo
    expect(button).toBeDisabled()
    
    // Aguardar conclusão
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })
})