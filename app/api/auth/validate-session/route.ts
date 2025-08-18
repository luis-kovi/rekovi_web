import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    return NextResponse.json({
      hasSession: !error && !!session,
      session: session
    })
  } catch (error) {
    // Em caso de erro, verificar cookies como fallback
    const cookies = request.cookies
    const authToken = cookies.get('sb-auth-token')
    const accessToken = cookies.get('sb-access-token')
    
    const cookieNames = Array.from(cookies.getAll()).map(c => c.name)
    const hasSessionCookie = cookieNames.some(name => 
      name.includes('sb-') && (name.includes('auth-token') || name.includes('session'))
    )
    
    return NextResponse.json({
      hasSession: !!(authToken || accessToken || hasSessionCookie),
      session: null
    })
  }
}