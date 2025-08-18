import { useState } from 'react'

export function usePhotoUpload<T extends Record<string, File | null>>(initialState: T) {
  const [photos, setPhotos] = useState<T>(initialState)

  const handlePhotoUpload = (photoType: string, file: File) => {
    setPhotos(prev => ({ ...prev, [photoType]: file }))
  }

  const getImageUrl = (file: File | null, defaultImageUrl: string): string => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return defaultImageUrl
  }

  const resetPhotos = () => {
    setPhotos(initialState)
  }

  const getUploadedPhotos = () => {
    return Object.fromEntries(
      Object.entries(photos).filter(([key, file]) => file !== null)
    ) as Record<string, File>
  }

  const hasAnyPhoto = () => {
    return Object.values(photos).some(photo => photo !== null)
  }

  return {
    photos,
    handlePhotoUpload,
    getImageUrl,
    resetPhotos,
    getUploadedPhotos,
    hasAnyPhoto
  }
}