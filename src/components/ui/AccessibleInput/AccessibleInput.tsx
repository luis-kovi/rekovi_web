// src/components/ui/AccessibleInput/AccessibleInput.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { useAccessibility } from '@/hooks/useAccessibility';

const inputVariants = cva(
  [
    // Base styles
    'w-full rounded-md border transition-all duration-200',
    'text-sm placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    
    // High contrast support
    'forced-colors:border-current',
    
    // Better mobile experience
    'touch:min-h-[44px]',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-input bg-background',
          'focus:border-ring focus:ring-ring/20',
          'hover:border-ring/50',
        ],
        error: [
          'border-red-500 bg-red-50 text-red-900',
          'focus:border-red-500 focus:ring-red-500/20',
          'dark:bg-red-950/10 dark:text-red-100',
          'placeholder:text-red-400 dark:placeholder:text-red-500',
        ],
        success: [
          'border-green-500 bg-green-50 text-green-900',
          'focus:border-green-500 focus:ring-green-500/20',
          'dark:bg-green-950/10 dark:text-green-100',
          'placeholder:text-green-400 dark:placeholder:text-green-500',
        ],
        warning: [
          'border-yellow-500 bg-yellow-50 text-yellow-900',
          'focus:border-yellow-500 focus:ring-yellow-500/20',
          'dark:bg-yellow-950/10 dark:text-yellow-100',
          'placeholder:text-yellow-400 dark:placeholder:text-yellow-500',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3 py-2',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        error: 'text-red-600 dark:text-red-400',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-red-500",
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      required: false,
    },
  }
);

export interface AccessibleInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  
  // Labels e descrições
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  warning?: string;
  
  // Ícones
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Estados
  loading?: boolean;
  
  // Props de acessibilidade adicionais
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  
  // Containerização
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    className,
    containerClassName,
    labelClassName,
    helperClassName,
    variant,
    size,
    type = 'text',
    label,
    description,
    error,
    success,
    warning,
    leftIcon,
    rightIcon,
    loading = false,
    disabled,
    required,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    ...props
  }, ref) => {
    
    const { generateId, announce } = useAccessibility();
    
    // Gerar IDs únicos se não fornecidos
    const inputId = id || generateId('input');
    const descriptionId = description ? generateId('description') : undefined;
    const errorId = error ? generateId('error') : undefined;
    const successId = success ? generateId('success') : undefined;
    const warningId = warning ? generateId('warning') : undefined;
    
    // Determinar variante baseada no estado
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
    
    // Construir aria-describedby
    const describedBy = [
      ariaDescribedBy,
      descriptionId,
      errorId,
      successId,
      warningId,
    ].filter(Boolean).join(' ') || undefined;
    
    // Anunciar erros para screen readers
    React.useEffect(() => {
      if (error) {
        announce(`Erro no campo ${label || 'input'}: ${error}`, 'assertive');
      }
    }, [error, label, announce]);
    
    const inputElement = (
      <div className="relative">
        {/* Ícone esquerdo */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          type={type}
          id={inputId}
          disabled={disabled || loading}
          required={required}
          className={cn(
            inputVariants({ variant: currentVariant, size }),
            leftIcon && 'pl-10',
            (rightIcon || loading) && 'pr-10',
            className
          )}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid || !!error}
          aria-required={ariaRequired || required}
          {...props}
        />
        
        {/* Ícone direito ou loading */}
        {(rightIcon || loading) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {loading ? (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
    );
    
    // Se não há label nem helper text, retorna apenas o input
    if (!label && !description && !error && !success && !warning) {
      return inputElement;
    }
    
    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              labelVariants({ 
                variant: currentVariant, 
                required: required || false 
              }),
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        {/* Input */}
        {inputElement}
        
        {/* Helper texts */}
        <div className={cn('space-y-1', helperClassName)}>
          {/* Description */}
          {description && (
            <p
              id={descriptionId}
              className="text-sm text-muted-foreground"
            >
              {description}
            </p>
          )}
          
          {/* Error */}
          {error && (
            <p
              id={errorId}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              <span className="sr-only">Erro: </span>
              {error}
            </p>
          )}
          
          {/* Success */}
          {success && !error && (
            <p
              id={successId}
              className="text-sm text-green-600 dark:text-green-400"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">Sucesso: </span>
              {success}
            </p>
          )}
          
          {/* Warning */}
          {warning && !error && !success && (
            <p
              id={warningId}
              className="text-sm text-yellow-600 dark:text-yellow-400"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">Aviso: </span>
              {warning}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Componente especializado para busca
export const SearchInput = React.forwardRef<HTMLInputElement, AccessibleInputProps & {
  onClear?: () => void;
  showClearButton?: boolean;
}>(({
  onClear,
  showClearButton = true,
  leftIcon,
  rightIcon,
  value,
  placeholder = 'Buscar...',
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  
  const hasValue = value && String(value).length > 0;
  
  const handleClear = () => {
    onClear?.();
  };
  
  const searchIcon = (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
  
  const clearButton = showClearButton && hasValue && (
    <button
      type="button"
      onClick={handleClear}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Limpar busca"
    >
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
  
  return (
    <AccessibleInput
      ref={ref}
      type="search"
      value={value}
      placeholder={placeholder}
      leftIcon={leftIcon || searchIcon}
      rightIcon={rightIcon || clearButton}
      aria-label={ariaLabel || 'Campo de busca'}
      role="searchbox"
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';
