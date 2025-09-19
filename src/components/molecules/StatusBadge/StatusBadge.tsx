// src/components/molecules/StatusBadge/StatusBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { SLAStatus } from '@/types/card.types';
import { cn } from '@/utils/cn';

export interface StatusBadgeProps {
  status: SLAStatus;
  slaValue?: number;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  'No Prazo': {
    variant: 'success' as const,
    icon: 'check' as const,
    pulse: false
  },
  'Em Alerta': {
    variant: 'warning' as const,
    icon: 'warning' as const,
    pulse: false
  },
  'Atrasado': {
    variant: 'danger' as const,
    icon: 'warning' as const,
    pulse: true
  }
};

export function StatusBadge({ 
  status, 
  slaValue, 
  showIcon = true, 
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.pulse && 'animate-pulse',
        className
      )}
      icon={showIcon ? <Icon name={config.icon} size="xs" /> : undefined}
    >
      {slaValue !== undefined ? `SLA: ${slaValue}d` : status}
    </Badge>
  );
}
