// src/components/molecules/SearchInput/SearchInput.tsx
import React from 'react';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/utils/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Pesquisar...", 
  className,
  onClear 
}: SearchInputProps) {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        leftIcon={<Icon name="search" size="sm" />}
        rightIcon={
          value && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="x" size="sm" />
            </button>
          )
        }
        className="pr-10"
      />
    </div>
  );
}
