// src/components/ui/OptimizedImage/OptimizedImage.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  quality = 75,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.png',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.();
  }, [onError, imgSrc, fallbackSrc]);

  // Reset quando src muda
  React.useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  // Gerar placeholder blur automático se não fornecido
  const defaultBlurDataURL = React.useMemo(() => {
    if (blurDataURL) return blurDataURL;
    
    // Gerar um data URL simples para placeholder
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="#f3f4f6"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">🖼️</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }, [blurDataURL]);

  const imageProps = {
    src: imgSrc,
    alt,
    quality,
    priority,
    loading: priority ? 'eager' as const : loading,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading && 'opacity-50',
      hasError && 'opacity-75',
      className
    ),
    placeholder,
    blurDataURL: placeholder === 'blur' ? defaultBlurDataURL : undefined,
    sizes: sizes || (fill ? '100vw' : undefined),
  };

  if (fill) {
    return (
      <div className="relative overflow-hidden">
        <Image
          {...imageProps}
          fill
          alt={alt}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-2xl" role="img" aria-label="Loading image">🖼️</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        {...imageProps}
        width={width}
        height={height}
        alt={alt}
      />
      {isLoading && width && height && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-gray-400 text-2xl" role="img" aria-label="Loading image">🖼️</span>
        </div>
      )}
    </div>
  );
}

// Componente para avatar otimizado
export interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: AvatarImageProps) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const dimension = sizeMap[size];

  // Gerar initials como fallback
  const initials = React.useMemo(() => {
    return alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [alt]);

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-primary text-white font-semibold rounded-full',
          className
        )}
        style={{ width: dimension, height: dimension, fontSize: dimension * 0.4 }}
      >
        {fallback || initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-full object-cover', className)}
      quality={90}
      placeholder="blur"
      sizes={`${dimension}px`}
    />
  );
}

// Hook para preload de imagens
export function useImagePreload(sources: string[]) {
  React.useEffect(() => {
    const preloadImages = sources.map(src => {
      const img = new window.Image();
      img.src = src;
      return img;
    });

    return () => {
      preloadImages.forEach(img => {
        img.src = '';
      });
    };
  }, [sources]);
}
