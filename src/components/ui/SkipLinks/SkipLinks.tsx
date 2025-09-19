// src/components/ui/SkipLinks/SkipLinks.tsx
import React from 'react';
import { cn } from '@/utils/cn';

interface SkipLink {
  href: string;
  label: string;
}

export interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Pular para o conteúdo principal' },
  { href: '#main-navigation', label: 'Pular para a navegação principal' },
  { href: '#search', label: 'Pular para a busca' },
  { href: '#footer', label: 'Pular para o rodapé' },
];

export function SkipLinks({ links = defaultSkipLinks, className }: SkipLinksProps) {
  const handleSkipLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    
    const target = document.querySelector(targetId);
    if (target) {
      // Tornar o elemento focável se não for naturalmente focável
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      
      (target as HTMLElement).focus();
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Anunciar para screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Navegado para: ${targetId.replace('#', '')}`;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (announcement.parentNode) {
          announcement.parentNode.removeChild(announcement);
        }
      }, 1000);
    }
  };

  return (
    <nav 
      aria-label="Links de navegação rápida"
      className={cn("skip-links", className)}
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          onClick={(e) => handleSkipLinkClick(e, link.href)}
          className={cn(
            // Estilo padrão (oculto)
            "sr-only",
            // Estilo quando focado (visível)
            "focus:not-sr-only",
            "focus:absolute",
            "focus:top-0",
            "focus:left-0",
            "focus:z-50",
            "focus:px-6",
            "focus:py-3",
            "focus:bg-primary-600",
            "focus:text-white",
            "focus:font-medium",
            "focus:no-underline",
            "focus:rounded-br-lg",
            "focus:shadow-lg",
            "focus:transition-all",
            "focus:duration-200",
            // Estados de hover e active quando visível
            "focus:hover:bg-primary-700",
            "focus:active:bg-primary-800",
            // Melhor contraste
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-white",
            "focus:ring-offset-2",
            "focus:ring-offset-primary-600"
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

// Componente para criar skip links customizados
export function SkipLink({ 
  href, 
  children, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    
    const target = document.querySelector(href);
    if (target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      
      (target as HTMLElement).focus();
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50",
        "focus:px-6 focus:py-3 focus:bg-primary-600 focus:text-white focus:font-medium",
        "focus:no-underline focus:rounded-br-lg focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2",
        "focus:ring-offset-primary-600 focus:transition-all focus:duration-200",
        className
      )}
    >
      {children}
    </a>
  );
}
