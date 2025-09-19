// src/components/ui/Skeleton/Skeleton.tsx
import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800',
        'before:absolute before:inset-0 before:-translate-x-full before:bg-shimmer-gradient before:animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

// Skeleton específicos para diferentes casos de uso
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full' // Última linha mais curta
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      <Skeleton className="h-5 w-2/5" />
      <SkeletonText lines={2} />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanbanCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-3 bg-white dark:bg-gray-900 rounded-xl border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}
