// components/CardModal/TentativaRecolhaActions/ReportProblemForm.tsx
'use client'

import type { CardWithSLA } from '@/types'
import { useReportProblemForm } from '@/hooks/useReportProblemForm'

interface ReportProblemFormProps {
  card: CardWithSLA;
  onReportProblem: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onClose: () => void;
  onBack: () => void;
}

export default function ReportProblemForm({ card, onReportProblem, onClose, onBack }: ReportProblemFormProps) {
  const {
    difficulty,
    setDifficulty,
    feedback,
    isUpdating,
    handleFileChange,
    handleReportProblem
  } = useReportProblemForm({ card, onReportProblem, onClose });

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50">
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="text-gray-500"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg></button>
                <h3 className="text-lg font-bold text-gray-800">Reportar Problema</h3>
            </div>
            <div>
                <label>Dificuldade *</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">Selecione...</option>
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                </select>
            </div>
            <div>
                <label>Evidências</label>
                <input type="file" multiple onChange={handleFileChange} className="w-full p-2 border rounded"/>
            </div>
            {feedback && <p>{feedback}</p>}
            <button onClick={handleReportProblem} disabled={isUpdating} className="w-full bg-purple-500 text-white p-3 rounded">
                {isUpdating ? 'Reportando...' : 'Reportar Problema'}
            </button>
        </div>
    </div>
  )
}
