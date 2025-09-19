// src/components/ui/Loading/Loading.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <Loader2 className={cn('animate-spin text-primary-500', sizeClasses[size], className)} />
  );
}

export function LoadingDots({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) {
  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-3 h-3',
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn('bg-primary-500 rounded-full', dotSize[size])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <motion.div
      className={cn('bg-primary-500 rounded-full', sizeClasses[size], className)}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function LoadingBars({ size = 'md', className }: { size?: keyof typeof sizeClasses; className?: string }) {
  const barHeight = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  };

  return (
    <div className={cn('flex items-end space-x-1', className)}>
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          className={cn('w-1 bg-primary-500 rounded-t', barHeight[size])}
          animate={{
            scaleY: [1, 2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  );
}

export function Loading({ 
  size = 'md', 
  variant = 'spinner', 
  className, 
  message, 
  fullScreen = false 
}: LoadingProps) {
  const LoadingComponent = {
    spinner: LoadingSpinner,
    dots: LoadingDots,
    pulse: LoadingPulse,
    bars: LoadingBars,
  }[variant];

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      fullScreen ? 'min-h-screen' : 'p-8',
      className
    )}>
      <LoadingComponent size={size} />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Loading Overlay para componentes específicos
export function LoadingOverlay({ 
  isLoading, 
  children, 
  message,
  variant = 'spinner',
  className 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  variant?: LoadingProps['variant'];
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg"
        >
          <Loading variant={variant} message={message} />
        </motion.div>
      )}
    </div>
  );
}
