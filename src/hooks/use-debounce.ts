import { useState, useEffect } from 'react'

/**
 * Hook that debounces a value
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value and debouncing state
 */
export function useDebounce<T>(value: T, delay: number): {
  debouncedValue: T
  isDebouncing: boolean
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    // Set debouncing to true when value changes
    setIsDebouncing(true)

    // Set up the debounce timer
    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)

    // Cleanup function
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return { debouncedValue, isDebouncing }
}