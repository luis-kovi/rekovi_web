// app/api/auth/reset-rate-limit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resetRateLimit } from '@/utils/rate-limiter'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Resetar rate limit para as rotas de autenticação
    resetRateLimit(request, '/auth/signin')
    resetRateLimit(request, '/auth/signup')
    
    return NextResponse.json(
      { success: true, message: 'Rate limit reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resetting rate limit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}