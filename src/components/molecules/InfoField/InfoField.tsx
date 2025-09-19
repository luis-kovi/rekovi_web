// src/components/molecules/InfoField/InfoField.tsx
import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { IconName } from '@/types/ui.types';
import { cn } from '@/utils/cn';

export interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
  icon?: IconName;
  className?: string;
  variant?: 'default' | 'compact';
}

export function InfoField({ 
  label, 
  value, 
  icon, 
  className,
  variant = 'default'
}: InfoFieldProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {icon && (
          <div className="w-3 h-3 flex items-center justify-center bg-gray-100 rounded-sm">
            <Icon name={icon} size="xs" className="text-gray-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            {label}
          </div>
          <div className="text-xs text-gray-800 font-medium truncate">
            {value}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} size="sm" className="text-gray-500" />}
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      </div>
      <div className="text-gray-900 font-medium">
        {value}
      </div>
    </div>
  );
}
