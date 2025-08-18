// components/CardModal/forms/AllocateDriverForm.tsx
import React, { useState, useEffect } from 'react'
import type { CardWithSLA } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { extractCityFromOrigin } from '@/utils/auth-validation'
import { logger } from '@/utils/logger'

interface AllocateDriverFormProps {
  card: CardWithSLA
  onClose: () => void
  onSubmit: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string) => Promise<void>
}

export default function AllocateDriverForm({ card, onClose, onSubmit }: AllocateDriverFormProps) {
  const [driverName, setDriverName] = useState('')
  const [driverEmail, setDriverEmail] = useState('')
  const [collectionDate, setCollectionDate] = useState('')
  const [collectionTime, setCollectionTime] = useState('')
  const [billingType, setBillingType] = useState('')
  const [collectionValue, setCollectionValue] = useState('')
  const [additionalKm, setAdditionalKm] = useState('')
  const [availableDrivers, setAvailableDrivers] = useState<{nome: string, email: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAvailableDrivers()
  }, [card.local_origem])

  const fetchAvailableDrivers = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const userCity = extractCityFromOrigin(card.local_origem || '')
      
      const { data, error } = await supabase
        .from('pre_approved_users')
        .select('nome, email')
        .eq('permission_type', 'chofer')
        .eq('status', 'active')
        .contains('area_atuacao', [userCity])

      if (error) throw error

      setAvailableDrivers(data || [])
    } catch (error) {
      logger.error('Erro ao buscar motoristas:', error)
      setError('Erro ao carregar lista de motoristas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const dateTime = `${collectionDate}T${collectionTime}`
      await onSubmit(card.id, driverName, driverEmail, dateTime, collectionValue, additionalKm)
      onClose()
    } catch (error) {
      logger.error('Erro ao alocar motorista:', error)
      setError('Erro ao alocar motorista')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alocar Motorista</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Motorista
        </label>
        {loading ? (
          <p className="text-sm text-gray-500">Carregando motoristas...</p>
        ) : (
          <select
            value={driverName}
            onChange={(e) => {
              setDriverName(e.target.value)
              const selected = availableDrivers.find(d => d.nome === e.target.value)
              setDriverEmail(selected?.email || '')
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecione um motorista</option>
            {availableDrivers.map((driver) => (
              <option key={driver.email} value={driver.nome}>
                {driver.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data da Recolha
          </label>
          <input
            type="date"
            value={collectionDate}
            onChange={(e) => setCollectionDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora da Recolha
          </label>
          <input
            type="time"
            value={collectionTime}
            onChange={(e) => setCollectionTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Cobrança
        </label>
        <select
          value={billingType}
          onChange={(e) => setBillingType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecione o tipo de cobrança</option>
          <option value="avulso">Avulso</option>
          <option value="contrato">Contrato</option>
        </select>
      </div>

      {billingType === 'avulso' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Recolha (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={collectionValue}
              onChange={(e) => setCollectionValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KM Adicional
            </label>
            <input
              type="text"
              value={additionalKm}
              onChange={(e) => setAdditionalKm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 50km"
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !driverName}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {submitting ? 'Alocando...' : 'Alocar Motorista'}
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