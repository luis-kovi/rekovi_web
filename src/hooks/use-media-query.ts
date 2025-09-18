import { useState, useEffect } from 'react'

/**
 * Hook for matching media queries
 * @param query - Media query string
 * @returns Boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Common breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 768px)')
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)')
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1440px)')

// Dark mode hook
export const useIsDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)')

// Reduced motion hook
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

// High contrast hook
export const usePrefersHighContrast = () => useMediaQuery('(prefers-contrast: high)')