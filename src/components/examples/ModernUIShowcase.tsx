// src/components/examples/ModernUIShowcase.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Button, 
  Input, 
  Badge, 
  ThemeToggle, 
  Loading, 
  LoadingOverlay,
  Skeleton, 
  SkeletonCard,
  SkeletonKanbanCard,
  ErrorState,
  NetworkError,
  ToastContainer
} from '@/components/ui';
import { ThemeProvider } from '@/components/providers';
import { useToast, useResponsive } from '@/hooks';
import { Search, Plus, Settings, User, Bell, Download } from 'lucide-react';

export function ModernUIShowcase() {
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const { toast, toasts, dismiss, success, error, warning, info } = useToast();
  const { isMobile, isTablet, currentBreakpoint } = useResponsive();

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      success('Carregamento concluído!', 'A ação foi executada com sucesso.');
    }, 3000);
  };

  const handleSkeletonDemo = () => {
    setShowSkeletons(true);
    setTimeout(() => {
      setShowSkeletons(false);
      info('Skeletons removidos', 'O conteúdo foi carregado.');
    }, 2000);
  };

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Sucesso!', message: 'Operação realizada com sucesso.' },
      error: { title: 'Erro!', message: 'Algo deu errado. Tente novamente.' },
      warning: { title: 'Atenção!', message: 'Verifique os dados antes de continuar.' },
      info: { title: 'Informação', message: 'Nova atualização disponível.' },
    };

    const { title, message } = messages[type];
    
    if (type === 'success') success(title, message);
    else if (type === 'error') error(title, message);
    else if (type === 'warning') warning(title, message);
    else info(title, message);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Modern UI Showcase
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Demonstração dos componentes modernos • Breakpoint: {currentBreakpoint} 
                {isMobile && ' (Mobile)'} {isTablet && ' (Tablet)'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle variant="dropdown" showLabel />
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </motion.header>

          {/* Grid de componentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Buttons Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Buttons & Actions
              </h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger">Danger</Button>
                  <Button disabled>Disabled</Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    With Icon
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Inputs Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Form Controls
              </h3>
              <div className="space-y-4">
                <Input 
                  placeholder="Default input" 
                  leftIcon={<Search className="h-4 w-4" />}
                />
                <Input 
                  placeholder="Success state" 
                  variant="success"
                  helper="Looks good!"
                />
                <Input 
                  placeholder="Error state" 
                  variant="error"
                  error="This field is required"
                />
                <div className="flex gap-2">
                  <Input size="sm" placeholder="Small" />
                  <Input size="lg" placeholder="Large" />
                </div>
              </div>
            </motion.div>

            {/* Badges Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Badges & Status
              </h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="danger">Danger</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </motion.div>

            {/* Loading States Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Loading States
              </h3>
              <LoadingOverlay isLoading={isLoading}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Loading variant="spinner" size="sm" />
                      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Spinner</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Loading variant="dots" size="sm" />
                      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Dots</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Loading variant="pulse" size="sm" />
                      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Pulse</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Loading variant="bars" size="sm" />
                      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Bars</p>
                    </div>
                  </div>
                  <Button onClick={handleLoadingDemo} className="w-full">
                    Testar Loading (3s)
                  </Button>
                </div>
              </LoadingOverlay>
            </motion.div>

            {/* Skeleton Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Skeleton Loaders
              </h3>
              <div className="space-y-4">
                {showSkeletons ? (
                  <>
                    <SkeletonKanbanCard />
                    <SkeletonCard />
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <User className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">João Silva</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Desenvolvedor</p>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Conteúdo carregado com sucesso! Os skeletons ajudam a manter 
                        a interface fluida durante o carregamento.
                      </p>
                    </div>
                  </div>
                )}
                <Button onClick={handleSkeletonDemo} variant="outline" className="w-full">
                  Mostrar Skeletons (2s)
                </Button>
              </div>
            </motion.div>

            {/* Toast Notifications Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-soft border dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Toast Notifications
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToastDemo('success')}
                >
                  Success
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToastDemo('error')}
                >
                  Error
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToastDemo('warning')}
                >
                  Warning
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToastDemo('info')}
                >
                  Info
                </Button>
              </div>
            </motion.div>

          </div>

          {/* Error State Demo */}
          {showError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-soft border dark:border-gray-800"
            >
              <NetworkError onRetry={() => setShowError(false)} />
            </motion.div>
          )}

          {!showError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-center"
            >
              <Button 
                onClick={() => setShowError(true)}
                variant="outline"
                className="mr-4"
              >
                Mostrar Error State
              </Button>
              <Button variant="ghost">
                <Download className="h-4 w-4 mr-2" />
                Exportar Demonstração
              </Button>
            </motion.div>
          )}
        </div>

        {/* Toast Container */}
        <ToastContainer 
          toasts={toasts} 
          onClose={dismiss} 
          position="top-right" 
        />
      </div>
    </ThemeProvider>
  );
}
