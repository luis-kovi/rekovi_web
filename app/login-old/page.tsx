// app/login/page.tsx
'use client'

import { createClient } from '@/utils/supabase/client'

export default function Login() {
  // Usamos o cliente para o navegador
  const supabase = createClient()

  const handleSignInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // A URL de callback continua a mesma
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex items-center justify-center min-h-screen">
      <div className="bg-[#FF355A] rounded-2xl p-8 md:p-12 w-full max-w-md text-center space-y-8 border border-gray-100 shadow-2xl">
        <img src="https://i.ibb.co/zh6PNsYs/kovi-logo-fundo-rosa.png" alt="Logo Kovi" className="h-14 mx-auto" />
        <h1 className="text-3xl md:text-4xl text-white" style={{ fontWeight: 800 }}>Gestão de Recolhas</h1>

        {/* Trocamos a Server Action por um onClick */}
        <button 
          onClick={handleSignInWithGoogle}
          className="flex items-center justify-center gap-3 bg-white border border-gray-200 hover:shadow-lg transition text-gray-700 px-6 py-3 rounded-full font-semibold mx-auto w-full max-w-xs text-base md:text-lg"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
          <span className="font-medium">Entrar com Google</span>
        </button>

      </div>
    </div>
  )
}