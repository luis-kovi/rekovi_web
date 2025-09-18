import { useState, useCallback, useRef, useEffect } from 'react'

interface UseAsyncState<T, E = Error> {
  data: T | null
  error: E | null
  isLoading: boolean
}

/**
 * Hook for handling async operations with loading states
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute immediately on mount
 * @returns Async state and control functions
 */
export function useAsync<T, E = Error>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): {
  data: T | null
  error: E | null
  isLoading: boolean
  execute: (...args: any[]) => Promise<T>
  reset: () => void
} {
  const [state, setState] = useState<UseAsyncState<T, E>>({
    data: null,
    error: null,
    isLoading: false,
  })

  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = await asyncFunction(...args)
        
        if (isMountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
          })
        }
        
        return result
      } catch (error) {
        if (isMountedRef.current) {
          setState({
            data: null,
            error: error as E,
            isLoading: false,
          })
        }
        throw error
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    execute,
    reset,
  }
}