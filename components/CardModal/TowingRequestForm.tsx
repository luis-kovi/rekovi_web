'use client'

import { useState } from 'react'

interface TowingRequestFormProps {
  onRequestTowing: (reason: string, photos: Record<string, File>, observations?: string) => Promise<void>
  onClose: () => void
}

export default function TowingRequestForm({
  onRequestTowing,
  onClose,
}: TowingRequestFormProps) {
  const [towingReason, setTowingReason] = useState('')
  const [towingPhotos, setTowingPhotos] = useState({
    frente: null as File | null,
    traseira: null as File | null,
    lateralDireita: null as File | null,
    lateralEsquerda: null as File | null,
    estepe: null as File | null,
    painel: null as File | null
  })
  const [towingObservations, setTowingObservations] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const resetForm = () => {
    setTowingReason('')
    setTowingPhotos({
      frente: null,
      traseira: null,
      lateralDireita: null,
      lateralEsquerda: null,
      estepe: null,
      painel: null
    })
    setTowingObservations('')
  }

  const getImageUrl = (file: File | null, defaultImageUrl: string): string => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return defaultImageUrl
  }

  const handlePhotoUpload = (photoType: string, file: File) => {
    setTowingPhotos(prev => ({ ...prev, [photoType]: file }))
  }

  const handleRequestTowing = async () => {
    if (!towingReason) {
      setFeedback('Por favor, selecione o motivo do guincho.')
      return
    }

    // Validar se pelo menos uma foto foi enviada
    const hasAnyPhoto = Object.values(towingPhotos).some(photo => photo !== null)
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto do veículo.')
      return
    }

    setIsUpdating(true)
    setFeedback('Processando solicitação de guincho...')

    try {
      // Filtrar apenas as fotos que foram enviadas
      const photosToUpload = Object.fromEntries(
        Object.entries(towingPhotos).filter(([key, file]) => file !== null)
      ) as Record<string, File>

      await onRequestTowing(towingReason, photosToUpload, towingObservations)

      setFeedback('Guincho solicitado com sucesso! Os dados serão atualizados em até 3 minutos.')
      setTimeout(() => {
        resetForm()
        setFeedback('')
        setIsUpdating(false)
        onClose()
      }, 3000)
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200/50 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              resetForm()
              setFeedback('')
              onClose()
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Solicitar Guincho
          </h3>
        </div>

        {/* Motivo do Guincho */}
        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Motivo do guincho *
          </label>
          <select
            value={towingReason}
            onChange={(e) => setTowingReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
          >
            <option value="">Selecione um motivo...</option>
            <option value="Veículo com avarias / problemas mecânicos">Veículo com avarias / problemas mecânicos</option>
            <option value="Veículo na rua sem recuperação da chave">Veículo na rua sem recuperação da chave</option>
            <option value="Chave danificada / perdida">Chave danificada / perdida</option>
          </select>
        </div>

        {/* Fotos do Veículo para Guincho */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'frente', label: 'Foto da Frente', image: '/images/placeholders/vehicle-front.webp' },
            { key: 'traseira', label: 'Foto da Traseira', image: '/images/placeholders/vehicle-rear.webp' },
            { key: 'lateralDireita', label: 'Lateral Direita', image: '/images/placeholders/vehicle-right.jpg' },
            { key: 'lateralEsquerda', label: 'Lateral Esquerda', image: '/images/placeholders/vehicle-left.jpg' },
            ...(towingReason !== 'Veículo na rua sem recuperação da chave' ? [
              { key: 'estepe', label: 'Foto do Estepe', image: '/images/placeholders/vehicle-spare.jpg' },
              { key: 'painel', label: 'Foto do Painel', image: '/images/placeholders/vehicle-dashboard.jpg' }
            ] : [])
          ].map((photo) => (
            <div key={photo.key} className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                {photo.label}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-orange-400 transition-colors">
                <div className="w-full aspect-square mb-2">
                  <img
                    src={getImageUrl(towingPhotos[photo.key as keyof typeof towingPhotos], photo.image)}
                    alt={photo.label}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload(photo.key, file)
                  }}
                  className="hidden"
                  id={`towing-upload-${photo.key}`}
                />
                <label
                  htmlFor={`towing-upload-${photo.key}`}
                  className="text-xs text-orange-600 hover:text-orange-800 cursor-pointer block"
                >
                  {towingPhotos[photo.key as keyof typeof towingPhotos] ? 'Trocar' : 'Upload'}
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Observações */}
        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Observações
          </label>
          <textarea
            value={towingObservations}
            onChange={(e) => setTowingObservations(e.target.value)}
            rows={3}
            placeholder="Observações adicionais sobre a solicitação de guincho..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white shadow-sm transition-all duration-200 resize-none"
          />
        </div>

        {feedback && (
          <div className={`text-sm text-center p-3 rounded-lg font-medium ${
            feedback.includes('Erro') || feedback.includes('selecione') || feedback.includes('pelo menos')
              ? 'text-red-700 bg-red-100/50 border border-red-200/50'
              : 'text-green-700 bg-green-100/50 border border-green-200/50'
          }`}>
            {feedback}
          </div>
        )}

        <button
          onClick={handleRequestTowing}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isUpdating ? 'Processando...' : 'Confirmar Solicitação'}
        </button>
      </div>
    </div>
  )
}