import { useState } from 'react'

export function useFeedback() {
  const [feedback, setFeedback] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const showError = (message: string) => {
    setFeedback(message)
    setIsUpdating(false)
  }

  const showSuccess = (message: string, onComplete?: () => void, delay = 3000) => {
    setFeedback(message)
    setTimeout(() => {
      setFeedback('')
      setIsUpdating(false)
      onComplete?.()
    }, delay)
  }

  const startProcessing = (message: string) => {
    setIsUpdating(true)
    setFeedback(message)
  }

  const resetFeedback = () => {
    setFeedback('')
    setIsUpdating(false)
  }

  return {
    feedback,
    isUpdating,
    showError,
    showSuccess,
    startProcessing,
    resetFeedback
  }
}