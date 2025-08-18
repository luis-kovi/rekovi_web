// components/CardModal/index.tsx
'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import type { CardWithSLA } from '@/types'
import CardModalHeader from './CardModalHeader'
import CardInfo from './CardInfo'
import CardModalActions from './CardModalActions'
import ChangeDriverForm from './ChangeDriverForm'

// Lazy loading para formulários pesados
const AllocateDriverForm = lazy(() => import('./forms/AllocateDriverForm'))
const RejectCollectionForm = lazy(() => import('./forms/RejectCollectionForm'))
const UnlockVehicleForm = lazy(() => import('./forms/UnlockVehicleForm'))
const RequestTowingForm = lazy(() => import('./forms/RequestTowingForm'))
const ReportProblemForm = lazy(() => import('./forms/ReportProblemForm'))
const ConfirmPatioDeliveryForm = lazy(() => import('./forms/ConfirmPatioDeliveryForm'))
const ConfirmCarTowedForm = lazy(() => import('./forms/ConfirmCarTowedForm'))
const RequestTowMechanicalForm = lazy(() => import('./forms/RequestTowMechanicalForm'))

interface CardModalProps {
  card: CardWithSLA | null;
  onClose: () => void;
  onUpdateChofer?: (cardId: string, newName: string, newEmail: string) => Promise<void>;
  onAllocateDriver?: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string) => Promise<void>;
  onRejectCollection?: (cardId: string, reason: string, observations: string) => Promise<void>;
  onUnlockVehicle?: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onRequestTowing?: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onReportProblem?: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onConfirmPatioDelivery?: (cardId: string, photos: Record<string, File>, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onConfirmCarTowed?: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onRequestTowMechanical?: (cardId: string, reason: string) => Promise<void>;
}

export default function CardModal({ 
  card, 
  onClose, 
  onUpdateChofer, 
  onAllocateDriver, 
  onRejectCollection, 
  onUnlockVehicle, 
  onRequestTowing, 
  onReportProblem, 
  onConfirmPatioDelivery, 
  onConfirmCarTowed, 
  onRequestTowMechanical 
}: CardModalProps) {
  const [copiedPlate, setCopiedPlate] = useState(false)
  const [activeForm, setActiveForm] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!card) return null

  const handleCopyPlate = async () => {
    try {
      await navigator.clipboard.writeText(card.placa)
      setCopiedPlate(true)
      setTimeout(() => setCopiedPlate(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar placa:', err)
    }
  }

  const FormLoader = () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  const renderActiveForm = () => {
    if (!activeForm) return null

    const formProps = {
      card,
      onClose: () => setActiveForm(null)
    }

    return (
      <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
        <Suspense fallback={<FormLoader />}>
          {activeForm === 'changeDriver' && onUpdateChofer && (
            <ChangeDriverForm
              cardId={card.id}
              localOrigem={card.local_origem || ''}
              onClose={() => setActiveForm(null)}
              onUpdateChofer={onUpdateChofer}
            />
          )}
          {activeForm === 'allocateDriver' && onAllocateDriver && (
            <AllocateDriverForm {...formProps} onSubmit={onAllocateDriver} />
          )}
          {activeForm === 'rejectCollection' && onRejectCollection && (
            <RejectCollectionForm {...formProps} onSubmit={onRejectCollection} />
          )}
          {activeForm === 'unlockVehicle' && onUnlockVehicle && (
            <UnlockVehicleForm {...formProps} onSubmit={onUnlockVehicle} />
          )}
          {activeForm === 'requestTowing' && onRequestTowing && (
            <RequestTowingForm {...formProps} onSubmit={onRequestTowing} />
          )}
          {activeForm === 'reportProblem' && onReportProblem && (
            <ReportProblemForm {...formProps} onSubmit={onReportProblem} />
          )}
          {activeForm === 'confirmPatioDelivery' && onConfirmPatioDelivery && (
            <ConfirmPatioDeliveryForm {...formProps} onSubmit={onConfirmPatioDelivery} />
          )}
          {activeForm === 'confirmCarTowed' && onConfirmCarTowed && (
            <ConfirmCarTowedForm {...formProps} onSubmit={onConfirmCarTowed} />
          )}
          {activeForm === 'requestTowMechanical' && onRequestTowMechanical && (
            <RequestTowMechanicalForm {...formProps} onSubmit={onRequestTowMechanical} />
          )}
        </Suspense>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <CardModalHeader
            card={card}
            onClose={onClose}
            copiedPlate={copiedPlate}
            onCopyPlate={handleCopyPlate}
          />

          <CardInfo card={card} />

          {!activeForm && (
            <CardModalActions
              card={card}
              onShowChoferChange={() => setActiveForm('changeDriver')}
              onShowAllocateDriver={() => setActiveForm('allocateDriver')}
              onShowRejectCollection={() => setActiveForm('rejectCollection')}
              onShowUnlockVehicle={() => setActiveForm('unlockVehicle')}
              onShowRequestTowing={() => setActiveForm('requestTowing')}
              onShowReportProblem={() => setActiveForm('reportProblem')}
              onShowConfirmPatioDelivery={() => setActiveForm('confirmPatioDelivery')}
              onShowCarTowed={() => setActiveForm('confirmCarTowed')}
              onShowRequestTowMechanical={() => setActiveForm('requestTowMechanical')}
            />
          )}

          {renderActiveForm()}
        </div>
      </div>
    </div>
  )
}