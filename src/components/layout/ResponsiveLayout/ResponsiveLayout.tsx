// src/components/layout/ResponsiveLayout/ResponsiveLayout.tsx
import React from 'react';
import { cn } from '@/utils/cn';
import { useResponsive } from '@/hooks/useResponsive';
import { useAccessibility } from '@/hooks/useAccessibility';
import { SkipLinks } from '@/components/ui/SkipLinks';
import { FocusArea } from '@/components/ui/FocusManager';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  sidebarPosition?: 'left' | 'right';
  sidebarCollapsible?: boolean;
  showSkipLinks?: boolean;
}

export interface SimpleLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export function ResponsiveLayout({
  children,
  header,
  sidebar,
  footer,
  className,
  sidebarPosition = 'left',
  sidebarCollapsible = true,
  showSkipLinks = true,
}: ResponsiveLayoutProps) {
  const { 
    isMobile, 
    isTablet, 
    showSidebar: shouldShowSidebar, 
    useCompactLayout,
    device 
  } = useResponsive();
  
  const { prefersReducedMotion, announce } = useAccessibility();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  // Gerenciar sidebar baseado na responsividade
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else if (shouldShowSidebar) {
      setSidebarOpen(true);
    }
  }, [isMobile, shouldShowSidebar]);

  // Anunciar mudanças de layout para screen readers
  React.useEffect(() => {
    if (isMobile) {
      announce('Layout móvel ativo', 'polite');
    } else if (isTablet) {
      announce('Layout tablet ativo', 'polite');
    } else {
      announce('Layout desktop ativo', 'polite');
    }
  }, [isMobile, isTablet, announce]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    announce(
      newState ? 'Sidebar aberta' : 'Sidebar fechada',
      'polite'
    );
  };

  // Classes para diferentes tipos de layout
  const layoutClasses = cn(
    'min-h-screen bg-background text-foreground',
    'flex flex-col',
    useCompactLayout && 'compact-layout',
    device.touchDevice && 'touch-device',
    prefersReducedMotion && 'reduced-motion',
    className
  );

  const mainContentClasses = cn(
    'flex-1 flex',
    // Grid layout para desktop
    !isMobile && 'lg:grid lg:grid-cols-12 lg:gap-0'
  );

  const sidebarClasses = cn(
    // Mobile: overlay absoluto
    isMobile && [
      'fixed inset-y-0 z-40 w-80 transform transition-transform duration-300 ease-in-out',
      sidebarPosition === 'left' ? 'left-0' : 'right-0',
      sidebarOpen ? 'translate-x-0' : (
        sidebarPosition === 'left' ? '-translate-x-full' : 'translate-x-full'
      ),
    ],
    // Tablet/Desktop: layout normal
    !isMobile && [
      'lg:col-span-3 xl:col-span-2',
      sidebarCollapsible && !sidebarOpen && 'lg:hidden',
      'transition-all duration-300',
    ],
    // Background e estilo
    'bg-card border-r border-border',
    'overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/20'
  );

  const contentClasses = cn(
    'flex-1 flex flex-col min-h-0',
    // Desktop grid
    !isMobile && [
      sidebar && sidebarOpen ? 'lg:col-span-9 xl:col-span-10' : 'lg:col-span-12'
    ]
  );

  return (
    <div className={layoutClasses}>
      {/* Skip Links para navegação acessível */}
      {showSkipLinks && <SkipLinks />}

      {/* Header */}
      {header && (
        <FocusArea label="Cabeçalho principal" role="banner">
          <header 
            id="main-header"
            className={cn(
              'sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm',
              'supports-[backdrop-filter]:bg-background/60'
            )}
          >
            {/* Botão de toggle da sidebar para mobile */}
            {sidebar && isMobile && (
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2 z-10',
                  'p-2 rounded-md text-muted-foreground hover:text-foreground',
                  'hover:bg-muted focus:bg-muted',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                )}
                aria-label={sidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
            {header}
          </header>
        </FocusArea>
      )}

      {/* Overlay para mobile quando sidebar está aberta */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Conteúdo principal */}
      <div className={mainContentClasses}>
        {/* Sidebar */}
        {sidebar && (
          <FocusArea label="Navegação lateral" role="navigation">
            <aside
              id="sidebar"
              className={sidebarClasses}
              aria-label="Navegação principal"
              aria-hidden={!sidebarOpen}
            >
              {sidebar}
            </aside>
          </FocusArea>
        )}

        {/* Área de conteúdo */}
        <div className={contentClasses}>
          <FocusArea label="Conteúdo principal" role="main">
            <main 
              id="main-content"
              className={cn(
                'flex-1 overflow-auto',
                'focus:outline-none',
                // Padding responsivo
                'p-4 md:p-6 lg:p-8',
                useCompactLayout && 'p-3 md:p-4'
              )}
              tabIndex={-1}
            >
              {children}
            </main>
          </FocusArea>

          {/* Footer */}
          {footer && (
            <FocusArea label="Rodapé" role="contentinfo">
              <footer 
                id="footer"
                className={cn(
                  'border-t border-border bg-card/50',
                  'p-4 md:p-6',
                  useCompactLayout && 'p-3'
                )}
              >
                {footer}
              </footer>
            </FocusArea>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para layout simples sem sidebar
export function SimpleLayout({
  children,
  header,
  footer,
  className,
  maxWidth = '7xl',
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}) {
  const { useCompactLayout } = useResponsive();
  const { prefersReducedMotion } = useAccessibility();

  const containerClasses = cn(
    `max-w-${maxWidth}`,
    'mx-auto px-4 sm:px-6 lg:px-8',
    useCompactLayout && 'px-3 sm:px-4',
    className
  );

  return (
    <div className={cn(
      'min-h-screen bg-background text-foreground',
      'flex flex-col',
      prefersReducedMotion && 'reduced-motion'
    )}>
      <SkipLinks />
      
      {header && (
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className={containerClasses}>
            {header}
          </div>
        </header>
      )}

      <main 
        id="main-content"
        className="flex-1"
        tabIndex={-1}
      >
        <div className={containerClasses}>
          {children}
        </div>
      </main>

      {footer && (
        <footer 
          id="footer"
          className="border-t border-border bg-card/50"
        >
          <div className={containerClasses}>
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}
