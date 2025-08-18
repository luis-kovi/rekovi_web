import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import SignInPage from '@/app/auth/signin/page'
import { createClient } from '@/utils/supabase/client'

// Mocks
jest.mock('next/navigation')
jest.mock('@/utils/supabase/client')

describe('Authentication Flow Integration', () => {
  const mockPush = jest.fn()
  const mockSignIn = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    })
  })

  describe('Sign In Flow', () => {
    it('deve permitir login com credenciais válidas', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      })

      render(<SignInPage />)

      // Preencher formulário
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Verificar chamadas
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('deve exibir erro com credenciais inválidas', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      render(<SignInPage />)

      // Preencher formulário
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpass')
      await user.click(submitButton)

      // Verificar erro
      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('deve validar campos obrigatórios', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)

      const submitButton = screen.getByRole('button', { name: /entrar/i })
      await user.click(submitButton)

      // Verificar que não fez chamada sem preencher campos
      expect(mockSignIn).not.toHaveBeenCalled()
      
      // Verificar mensagens de validação HTML5
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement
      
      expect(emailInput.validity.valueMissing).toBe(true)
      expect(passwordInput.validity.valueMissing).toBe(true)
    })

    it('deve desabilitar formulário durante envio', async () => {
      const user = userEvent.setup()
      
      // Mock com delay para simular requisição
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { user: {} }, error: null }), 100)
        )
      )

      render(<SignInPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // Clicar no botão
      await user.click(submitButton)

      // Verificar que botão está desabilitado
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/entrando/i)).toBeInTheDocument()

      // Aguardar conclusão
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('deve navegar para página de cadastro ao clicar no link', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)

      const signUpLink = screen.getByText(/criar uma conta/i)
      await user.click(signUpLink)

      expect(mockPush).toHaveBeenCalledWith('/auth/signup')
    })
  })
})