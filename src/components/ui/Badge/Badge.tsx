// src/components/ui/Badge/Badge.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300',
        secondary: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        success: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300',
        warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300',
        danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-300',
        info: 'bg-info-100 text-info-800 dark:bg-info-900/20 dark:text-info-300',
        outline: 'border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
