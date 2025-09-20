// components/CardModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import type { CardWithSLA } from '@/types'
import { formatPersonName, keepOriginalFormat, formatDate, phaseDisplayNames } from '@/utils/helpers'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/utils/logger'
import AllocateDriverForm from './CardModal/FilaRecolhaActions/AllocateDriverForm'
import RejectCollectionForm from './CardModal/FilaRecolhaActions/RejectCollectionForm'
import UnlockVehicleForm from './CardModal/TentativaRecolhaActions/UnlockVehicleForm'
import RequestTowingForm from './CardModal/TentativaRecolhaActions/RequestTowingForm'
import ReportProblemForm from './CardModal/TentativaRecolhaActions/ReportProblemForm'
import ConfirmPatioDeliveryForm from './CardModal/ConfirmacaoRecolhaActions/ConfirmPatioDeliveryForm'
import CarTowedForm from './CardModal/ConfirmacaoRecolhaActions/CarTowedForm'
import RequestTowMechanicalForm from './CardModal/ConfirmacaoRecolhaActions/RequestTowMechanicalForm'

interface PreApprovedUser {
  nome: string
  email: string
  empresa: string
  permission_type: string
  status: string
  area_atuacao: string[]
}

interface CardModalProps {
  card: CardWithSLA | null;
  onClose: () => void;
  permissionType?: string;
  onUpdateChofer?: (cardId: string, newName: string, newEmail: string) => Promise<void>;
  onAllocateDriver?: (cardId: string, driverName: string, driverEmail: string, dateTime: string, collectionValue: string, additionalKm: string, billingType: string) => Promise<void>;
  onRejectCollection?: (cardId: string, reason: string, observations: string) => Promise<void>;
  onUnlockVehicle?: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onRequestTowing?: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onReportProblem?: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onConfirmPatioDelivery?: (cardId: string, photos: Record<string, File>, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onConfirmCarTowed?: (cardId: string, photo: File, expenses: string[], expenseValues: Record<string, string>, expenseReceipts: Record<string, File>) => Promise<void>;
  onRequestTowMechanical?: (cardId: string, reason: string) => Promise<void>;
}

export default function CardModal({ card, onClose, permissionType, onUpdateChofer, onAllocateDriver, onRejectCollection, onUnlockVehicle, onRequestTowing, onReportProblem, onConfirmPatioDelivery, onConfirmCarTowed, onRequestTowMechanical }: CardModalProps) {
  const [showChoferChange, setShowChoferChange] = useState(false);
  const [selectedChofer, setSelectedChofer] = useState('');
  const [choferEmail, setChoferEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedPlate, setCopiedPlate] = useState(false);
  const [availableChofers, setAvailableChofers] = useState<{name: string, email: string}[]>([]);
  const [loadingChofers, setLoadingChofers] = useState(false);
  const [showAllocateDriver, setShowAllocateDriver] = useState(false);
  const [showRejectCollection, setShowRejectCollection] = useState(false);
  const [showUnlockVehicle, setShowUnlockVehicle] = useState(false);
  const [showRequestTowing, setShowRequestTowing] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [showConfirmPatioDelivery, setShowConfirmPatioDelivery] = useState(false);
  const [showCarTowed, setShowCarTowed] = useState(false);
  const [showRequestTowMechanical, setShowRequestTowMechanical] = useState(false);

  const loadAvailableChofers = async () => {
    if (!card || !card.empresaResponsavel || !card.origemLocacao) {
      setAvailableChofers([]);
      return;
    }

    setLoadingChofers(true);
    try {
      const response = await fetch(`/api/chofers?empresaResponsavel=${encodeURIComponent(card.empresaResponsavel)}&origemLocacao=${encodeURIComponent(card.origemLocacao)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar chofers');
      }

      const users: PreApprovedUser[] = await response.json();

      if (!users || users.length === 0) {
        setAvailableChofers([]);
        return;
      }

      const filteredChofers = users.filter((user: PreApprovedUser) => {
        return user.email !== card.emailChofer &&
               (!user.nome || !card.chofer || user.nome.toLowerCase() !== card.chofer.toLowerCase());
      });

      const choferOptions = filteredChofers.map((user: PreApprovedUser) => ({
        name: user.nome || user.email.split('@')[0],
        email: user.email
      }));

      setAvailableChofers(choferOptions);
    } catch (error) {
      logger.error('Erro ao carregar chofers:', error);
      setAvailableChofers([]);
    } finally {
      setLoadingChofers(false);
    }
  };

  useEffect(() => {
    if (showChoferChange && card) {
      loadAvailableChofers();
    }
  }, [showChoferChange, card]);

  if (!card) return null;

  const isFila = card?.faseAtual === 'Fila de Recolha';
  const isTentativaRecolha = card?.faseAtual && [
    'Tentativa 1 de Recolha',
    'Tentativa 2 de Recolha',
    'Tentativa 3 de Recolha',
    'Tentativa 4 de Recolha'
  ].includes(card.faseAtual);
  const isConfirmacaoRecolha = card?.faseAtual === 'Confirmação de Entrega no Pátio';
  const displayPhase = phaseDisplayNames[card?.faseAtual] || card?.faseAtual;
  const editablePhases = ['Tentativa 1 de Recolha', 'Tentativa 2 de Recolha', 'Tentativa 3 de Recolha', 'Tentativa 4 de Recolha', 'Confirmação de Entrega no Pátio'];
  const allowChoferChange = card?.faseAtual ? editablePhases.includes(card.faseAtual) : false;

  // ... (handleChoferChange and handleCopyPlate are the same)

  const slaStatus = card.sla >= 3 ? 'atrasado' : card.sla === 2 ? 'alerta' : 'no-prazo';

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      id="cardModal"
      className="modal-overlay fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="modal-panel bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-200/50 w-full max-w-7xl max-h-[95vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        {/* ... (rest of the modal content is the same) */}
      </motion.div>
    </motion.div>
  )
}