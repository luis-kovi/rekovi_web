// components/Card.tsx
import type { CardWithSLA } from '@/types'; // Importa do nosso ficheiro central

interface CardProps {
  card: CardWithSLA 
}

export default function Card({ card }: CardProps) {
  const slaColor = card.slaText === 'Atrasado' ? 'bg-red-100 text-red-700' 
                 : card.slaText === 'Em Alerta' ? 'bg-yellow-100 text-yellow-700' 
                 : 'bg-green-100 text-green-700';

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 flex flex-col cursor-pointer hover:border-pink-500 transition-all">
      <div className="p-2 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm truncate">{card.placa}</h3>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${slaColor}`}>
          {card.slaText}
        </span>
      </div>
      <div className="px-2 pb-2 space-y-1 text-xs flex-1">
        <div>
          <div className="font-bold text-gray-600 text-[10px]">👤 DRIVER</div>
          <div className="truncate">{card.nomeDriver || 'N/A'}</div>
        </div>
        <div>
          <div className="font-bold text-gray-600 text-[10px]">🚛 CHOFER</div>
          <div className="truncate">{card.chofer || '-'}</div>
        </div>
      </div>
      <div className="p-2 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center text-xs text-red-600 font-semibold">
          SLA: {card.sla}d
        </div>
      </div>
    </div>
  )
}