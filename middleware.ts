// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware simplificado - apenas redireciona
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
    * Corresponde a todas as rotas, exceto as de ficheiros estáticos e de otimização de imagem.
    */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}