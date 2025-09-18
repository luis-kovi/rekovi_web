'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { logger } from '@/utils/logger'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, getInitials } from '@/lib/utils'
import { 
  Settings, 
  LogOut, 
  ChevronDown, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User, PermissionType } from '@/types'

interface HeaderProps {
  user: User | null
  permissionType: PermissionType | null
  isUpdating?: boolean
}

export default function Header({ user, permissionType, isUpdating = false }: HeaderProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const router = useRouter()

  // Monitorar conectividade com Supabase
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const channel = supabase
      .channel('connection-status')
      .on('system', { event: 'disconnect' }, () => {
        setIsConnected(false)
        logger.log('Conexão perdida com Supabase')
      })
      .on('system', { event: 'reconnect' }, () => {
        setIsConnected(true)
        setLastUpdate(new Date())
        logger.log('Reconectado ao Supabase')
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
      router.push('/auth/signin')
    }
  }

  const handleSettings = () => {
    router.push('/settings')
    setShowDropdown(false)
  }

  const handleDropdownToggle = (event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    
    setDropdownPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    })
    
    setShowDropdown(!showDropdown)
  }

  // Obter informações do usuário
  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0]
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  // Renderizar dropdown usando Portal
  const renderDropdown = () => {
    if (!showDropdown) return null

    const dropdownContent = (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed bg-background rounded-xl shadow-2xl border border-border py-2 z-[999999] backdrop-blur-sm"
        style={{
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          width: '192px'
        }}
      >
        <div className="py-1">
          {permissionType?.toLowerCase() === 'admin' && (
            <Button
              variant="ghost"
              onClick={handleSettings}
              className="w-full justify-start px-4 py-2 h-auto text-sm text-foreground hover:bg-accent transition-colors duration-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuração
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start px-4 py-2 h-auto text-sm text-destructive hover:bg-destructive/10 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </motion.div>
    )

    // Usar Portal para renderizar no final do body
    return createPortal(dropdownContent, document.body)
  }

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3 shadow-sm relative">
      <div className="flex items-center justify-between">
        {/* Logo - Lado esquerdo */}
        <div className="flex items-center">
          <motion.div 
            className="transform hover:scale-105 transition-transform duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/images/logos/kovi-logo.webp" 
              alt="Logo Kovi" 
              className="h-14 w-auto object-contain" 
              style={{ aspectRatio: '406/130' }}
            />
          </motion.div>
        </div>

        {/* Lado direito - Status e usuário */}
        <div className="flex items-center gap-6">
          {/* Status de conectividade moderno */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <motion.div 
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {isUpdating ? 'Sincronizando...' : (isConnected ? 'Conectado' : 'Desconectado')}
              </span>
            </div>
            
            {lastUpdate && !isUpdating && (
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                Última atualização: {formatLastUpdate(lastUpdate)}
              </div>
            )}
            
            {isUpdating && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                <motion.div 
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs font-medium text-primary">
                  Sincronizando dados...
                </span>
              </div>
            )}
          </div>

          {/* Informações do usuário com dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={handleDropdownToggle}
              className="flex items-center gap-3 px-4 py-2 h-auto hover:bg-accent hover:border-border transition-all duration-200"
            >
              {/* Avatar do usuário */}
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  {userAvatar ? (
                    <AvatarImage src={userAvatar} alt="Avatar" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(userName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Informações do usuário */}
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-32">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-32">
                    {userEmail}
                  </p>
                  <Badge 
                    variant={permissionType === 'admin' ? 'default' : 'secondary'}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {permissionType?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Ícone de dropdown */}
              <motion.div
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay para fechar dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999998]" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </AnimatePresence>

      {/* Renderizar dropdown usando Portal */}
      <AnimatePresence>
        {renderDropdown()}
      </AnimatePresence>
    </header>
  )
}