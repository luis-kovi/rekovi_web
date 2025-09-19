// src/components/ui/AccessibleButton/AccessibleButton.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { useFocusManagement } from '@/components/ui/FocusManager';
import { useAccessibility } from '@/hooks/useAccessibility';

const buttonVariants = cva(
  [
    // Base styles
    'inline-flex items-center justify-center',
    'rounded-md font-medium',
    'transition-all duration-200 ease-in-out',
    
    // Focus states - melhor acessibilidade
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    
    // Disabled states
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    
    // Hover states
    'hover:scale-[1.02] active:scale-[0.98]',
    
    // High contrast support
    'forced-colors:border forced-colors:border-current',
    
    // Touch device optimizations
    'touch:min-h-[44px] touch:min-w-[44px]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 active:bg-primary/80',
          'focus:ring-primary/50',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80 active:bg-secondary/70',
          'focus:ring-secondary/50',
        ],
        outline: [
          'border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:ring-ring/50',
          'shadow-sm hover:shadow',
        ],
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'focus:ring-ring/50',
        ],
        success: [
          'bg-green-600 text-white',
          'hover:bg-green-700 active:bg-green-800',
          'focus:ring-green-500/50',
          'dark:bg-green-700 dark:hover:bg-green-800',
        ],
        warning: [
          'bg-yellow-600 text-white',
          'hover:bg-yellow-700 active:bg-yellow-800',
          'focus:ring-yellow-500/50',
          'dark:bg-yellow-700 dark:hover:bg-yellow-800',
        ],
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700 active:bg-red-800',
          'focus:ring-red-500/50',
          'dark:bg-red-700 dark:hover:bg-red-800',
        ],
        link: [
          'text-primary underline-offset-4',
          'hover:underline focus:underline',
          'focus:ring-primary/50',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs min-w-[2rem]',
        md: 'h-10 px-4 py-2 text-sm min-w-[2.5rem]',
        lg: 'h-12 px-8 text-base min-w-[3rem]',
        xl: 'h-14 px-10 text-lg min-w-[3.5rem]',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      loading: false,
    },
  }
);

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  
  // Props básicas
  children?: React.ReactNode;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  
  // Props de acessibilidade
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-controls'?: string;
  'aria-pressed'?: boolean;
  
  // Props de comportamento
  preventDoubleClick?: boolean;
  autoFocus?: boolean;
  tooltip?: string;
  
  // Props visuais
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    className,
    variant,
    size,
    loading = false,
    loadingText = 'Carregando...',
    disabled,
    onClick,
    children,
    preventDoubleClick = false,
    autoFocus = false,
    tooltip,
    leftIcon,
    rightIcon,
    fullWidth = false,
    'aria-label': ariaLabel,
    ...props
  }, ref) => {
    
    const { ref: focusRef, focus } = useFocusManagement();
    const { prefersReducedMotion, announce } = useAccessibility();
    const [isClicking, setIsClicking] = React.useState(false);
    const [lastClickTime, setLastClickTime] = React.useState(0);
    
    // Combinar refs
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(ref, () => buttonRef.current!, []);
    React.useImperativeHandle(focusRef, () => buttonRef.current!, []);
    
    // Auto focus se especificado
    React.useEffect(() => {
      if (autoFocus && buttonRef.current) {
        focus();
      }
    }, [autoFocus, focus]);
    
    // Anunciar mudanças de estado para screen readers
    React.useEffect(() => {
      if (loading) {
        announce(loadingText, 'polite');
      }
    }, [loading, loadingText, announce]);
    
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }
      
      // Prevenção de double click
      if (preventDoubleClick) {
        const now = Date.now();
        if (now - lastClickTime < 500) {
          event.preventDefault();
          return;
        }
        setLastClickTime(now);
      }
      
      // Feedback visual
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 150);
      
      // Chamar handler original
      onClick?.(event);
    }, [loading, disabled, preventDoubleClick, lastClickTime, onClick]);
    
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Enter e Space ativam o botão
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!loading && !disabled) {
          buttonRef.current?.click();
        }
      }
      
      props.onKeyDown?.(event);
    }, [loading, disabled, props]);
    
    const buttonContent = (
      <>
        {leftIcon && !loading && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {loading && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        <span className={cn(
          'flex-1 truncate',
          loading && 'opacity-70'
        )}>
          {loading ? loadingText : children}
        </span>
        
        {rightIcon && !loading && (
          <span className="ml-2 flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );
    
    return (
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          buttonVariants({ variant, size, loading }),
          // Reduce motion support
          prefersReducedMotion && 'transform-none transition-none',
          // Full width
          fullWidth && 'w-full',
          // Visual feedback para clique
          isClicking && !prefersReducedMotion && 'scale-95',
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        title={tooltip}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Componente de botão para toggle (exemplo: switch, checkbox)
export const ToggleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps & {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}>(({
  pressed = false,
  onPressedChange,
  onClick,
  children,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const newPressed = !pressed;
    onPressedChange?.(newPressed);
    onClick?.(event);
  }, [pressed, onPressedChange, onClick]);
  
  return (
    <AccessibleButton
      ref={ref}
      onClick={handleClick}
      aria-pressed={pressed}
      aria-label={ariaLabel || `${pressed ? 'Desativar' : 'Ativar'} ${children}`}
      {...props}
    >
      {children}
    </AccessibleButton>
  );
});

ToggleButton.displayName = 'ToggleButton';
