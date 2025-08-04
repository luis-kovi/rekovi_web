'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
      } else {
        router.push('/auth/signin')
      }
    } catch (err) {
      console.error('Error during logout:', err)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Sair
    </button>
  )
} 