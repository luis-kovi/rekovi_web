// utils/session-validator.ts
// Utilitário leve para validação completa de sessão quando necessário

export async function validateSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/validate-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    return data.hasSession
  } catch (error) {
    console.error('Session validation error:', error)
    return false
  }
}