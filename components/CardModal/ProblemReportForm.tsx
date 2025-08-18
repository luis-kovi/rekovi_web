'use client'

import { useState } from 'react'

interface ProblemReportFormProps {
  onReportProblem: (difficulty: string, evidences: Record<string, File>) => Promise<void>
  onClose: () => void
}

export default function ProblemReportForm({
  onReportProblem,
  onClose,
}: ProblemReportFormProps) {
  const [problemType, setProblemType] = useState('')
  const [problemEvidence, setProblemEvidence] = useState({
    photo1: null as File | null,
    photo2: null as File | null,
    photo3: null as File | null
  })
  const [feedback, setFeedback] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const resetForm = () => {
    setProblemType('')
    setProblemEvidence({
      photo1: null,
      photo2: null,
      photo3: null
    })
  }

  const handlePhotoUpload = (photoType: string, file: File) => {
    setProblemEvidence(prev => ({ ...prev, [photoType]: file }))
  }

  const handleReportProblem = async () => {
    if (!problemType) {
      setFeedback('Por favor, selecione a dificuldade encontrada.')
      return
    }

    // Validar se pelo menos uma foto foi enviada
    const hasAnyPhoto = Object.values(problemEvidence).some(photo => photo !== null)
    if (!hasAnyPhoto) {
      setFeedback('Por favor, envie pelo menos uma foto como evidência.')
      return
    }

    setIsUpdating(true)
    setFeedback('Processando relato do problema...')

    try {
      // Filtrar apenas as fotos que foram enviadas
      const evidencesToUpload = Object.fromEntries(
        Object.entries(problemEvidence).filter(([key, file]) => file !== null)
      ) as Record<string, File>

      await onReportProblem(problemType, evidencesToUpload)

      setFeedback('Problema reportado com sucesso! Os dados serão atualizados em até 3 minutos.')
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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 relative overflow-hidden group">
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
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            Reportar Problema
          </h3>
        </div>

        {/* Qual a dificuldade encontrada */}
        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Qual a dificuldade encontrada na recolha? *
          </label>
          <select
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
          >
            <option value="">Selecione uma dificuldade...</option>
            <option value="Cliente regularizou o pagamento">Cliente regularizou o pagamento</option>
            <option value="Cliente recusa a entrega e informa que vai fazer o pagamento">Cliente recusa a entrega e informa que vai fazer o pagamento</option>
            <option value="Cliente recusa a entrega devido a problemas com a Kovi">Cliente recusa a entrega devido a problemas com a Kovi</option>
            <option value="Carro localizado, mas cliente não encontrado">Carro localizado, mas cliente não encontrado</option>
            <option value="Carro não localizado e sem contato com o cliente">Carro não localizado e sem contato com o cliente</option>
          </select>
        </div>

        {/* Evidências - até 3 fotos */}
        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
            Evidências da dificuldade *
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Envie fotos da rua, da garagem que evidencie a dificuldade na recolha (até 3 fotos)
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'photo1', label: 'Evidência 1' },
              { key: 'photo2', label: 'Evidência 2' },
              { key: 'photo3', label: 'Evidência 3' }
            ].map((photo) => (
              <div key={photo.key} className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {photo.label}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-purple-400 transition-colors min-h-[100px] flex flex-col justify-center">
                  {problemEvidence[photo.key as keyof typeof problemEvidence] ? (
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Foto enviada</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs text-gray-500">Adicionar foto</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload(photo.key, file)
                    }}
                    className="hidden"
                    id={`problem-upload-${photo.key}`}
                  />
                  <label
                    htmlFor={`problem-upload-${photo.key}`}
                    className="text-xs text-purple-600 hover:text-purple-800 cursor-pointer block mt-2"
                  >
                    {problemEvidence[photo.key as keyof typeof problemEvidence] ? 'Trocar' : 'Upload'}
                  </label>
                </div>
              </div>
            ))}
          </div>
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
          onClick={handleReportProblem}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isUpdating ? 'Processando...' : 'Confirmar Relato'}
        </button>
      </div>
    </div>
  )
}