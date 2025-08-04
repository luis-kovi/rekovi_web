// app/auth/signout/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Lida com pedidos POST
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = host?.startsWith('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  return NextResponse.redirect(origin, {
    status: 302,
  })
}

// Adiciona esta função para lidar também com pedidos GET
export async function GET(request: NextRequest) {
  // Reutiliza a mesma lógica do POST
  return await POST(request)
}