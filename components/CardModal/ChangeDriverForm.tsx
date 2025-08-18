// components/CardModal/ChangeDriverForm.tsx
import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/utils/logger'
import { extractCityFromOrigin } from '@/utils/auth-validation'

interface ChangeDriverFormProps {
  cardId: string
  localOrigem: string
  onClose: () => void
  onUpdateChofer: (cardId: string, newName: string, newEmail: string) => Promise<void>
}

export default function ChangeDriverForm({ cardId, localOrigem, onClose, onUpdateChofer }: ChangeDriverFormProps) {
  const [selectedChofer, setSelectedChofer] = useState('')
  const [choferEmail, setChoferEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([])
  const [loadingChofers, setLoadingChofers] = useState(false)

  useEffect(() => {
    fetchAvailableChofers()
  }, [localOrigem])

  const fetchAvailableChofers = async () => {
    setLoadingChofers(true)
    try {
      const supabase = createClient()
      const userCity = extractCityFromOrigin(localOrigem)
      
      logger.log('Buscando choferes para a cidade:', userCity)
      
      const { data, error } = await supabase
        .from('pre_approved_users')
        .select('nome, email')
        .eq('permission_type', 'chofer')
        .eq('status', 'active')
        .contains('area_atuacao', [userCity])

      if (error) {
        logger.error('Erro ao buscar choferes:', error)
        setFeedback('Erro ao carregar lista de choferes')
        return
      }

      logger.log('Choferes encontrados:', data?.length || 0)
      setAvailableChofers(data || [])
    } catch (error) {
      logger.error('Erro ao buscar choferes:', error)
      setFeedback('Erro ao carregar lista de choferes')
    } finally {
      setLoadingChofers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChofer || !choferEmail) {
      setFeedback('Por favor, selecione um chofer')
      return
    }

    setIsUpdating(true)
    setFeedback('')

    try {
      await onUpdateChofer(cardId, selectedChofer, choferEmail)
      setFeedback('Chofer atualizado com sucesso!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      logger.error('Erro ao atualizar chofer:', error)
      setFeedback('Erro ao atualizar chofer')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Novo Chofer
        </label>
        {loadingChofers ? (
          <p className="text-sm text-gray-500">Carregando choferes...</p>
        ) : availableChofers.length > 0 ? (
          <select
            value={selectedChofer}
            onChange={(e) => {
              setSelectedChofer(e.target.value)
              const selected = availableChofers.find(c => c.nome === e.target.value)
              setChoferEmail(selected?.email || '')
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecione um chofer</option>
            {availableChofers.map((chofer) => (
              <option key={chofer.email} value={chofer.nome}>
                {chofer.nome}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-red-600">
            Nenhum chofer disponível para a área de {extractCityFromOrigin(localOrigem)}
          </p>
        )}
      </div>

      {selectedChofer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email do Chofer
          </label>
          <input
            type="email"
            value={choferEmail}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>
      )}

      {feedback && (
        <p className={`text-sm ${feedback.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
          {feedback}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isUpdating || !selectedChofer}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isUpdating ? 'Atualizando...' : 'Confirmar Mudança'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}