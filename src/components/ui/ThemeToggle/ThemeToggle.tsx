// src/components/ui/ThemeToggle/ThemeToggle.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useThemeContext } from '@/components/providers/ThemeProvider';
import { cn } from '@/utils/cn';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'dropdown';
}

export function ThemeToggle({ className, showLabel = false, variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useThemeContext();

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={cn(
          'relative h-9 w-9 p-0 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800',
          className
        )}
        aria-label="Alternar tema"
      >
        <motion.div
          initial={false}
          animate={{
            scale: resolvedTheme === 'light' ? 1 : 0,
            opacity: resolvedTheme === 'light' ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-4 w-4 text-yellow-500" />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            scale: resolvedTheme === 'dark' ? 1 : 0,
            opacity: resolvedTheme === 'dark' ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-4 w-4 text-blue-500" />
        </motion.div>
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
      {[
        { key: 'light', icon: Sun, label: 'Claro' },
        { key: 'dark', icon: Moon, label: 'Escuro' },
        { key: 'system', icon: Monitor, label: 'Sistema' },
      ].map(({ key, icon: Icon, label }) => (
        <motion.button
          key={key}
          onClick={() => setTheme(key as any)}
          className={cn(
            'relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
            theme === key
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {theme === key && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          
          <Icon className="relative h-4 w-4" />
          {showLabel && <span className="relative">{label}</span>}
        </motion.button>
      ))}
    </div>
  );
}
