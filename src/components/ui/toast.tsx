'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import type { ToastProps } from '@/types'

const toastVariants = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-500 text-white border-green-600',
    iconClassName: 'text-green-100'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-500 text-white border-red-600',
    iconClassName: 'text-red-100'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-500 text-white border-yellow-600',
    iconClassName: 'text-yellow-100'
  },
  info: {
    icon: Info,
    className: 'bg-blue-500 text-white border-blue-600',
    iconClassName: 'text-blue-100'
  }
}

export function Toast({ id, title, description, type = 'info', duration = 5000, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const variant = toastVariants[type]
  const Icon = variant.icon

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsVisible(false)
  }

  const toastContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            'fixed top-4 right-4 z-[999999] max-w-sm w-full',
            'bg-background border border-border rounded-lg shadow-lg',
            'p-4 flex items-start gap-3',
            variant.className
          )}
        >
          <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.iconClassName)} />
          
          <div className="flex-1 min-w-0">
            {title && (
              <p className="font-semibold text-sm mb-1">{title}</p>
            )}
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                {action.label}
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(toastContent, document.body)
}

// Toast Container Component
export function ToastContainer() {
  return <div id="toast-root" />
}