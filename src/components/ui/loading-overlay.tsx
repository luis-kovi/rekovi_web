'use client'

import { motion } from 'framer-motion'
import { LoadingSpinner } from './loading-spinner'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ isLoading, message = 'Carregando...', className }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4 p-8 bg-background rounded-xl shadow-lg border border-border"
      >
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </motion.div>
    </motion.div>
  )
}