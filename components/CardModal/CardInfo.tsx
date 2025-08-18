// components/CardModal/CardInfo.tsx
import React from 'react'
import type { CardWithSLA } from '@/types'
import { formatPersonName, keepOriginalFormat, formatDate } from '@/utils/helpers'

interface CardInfoProps {
  card: CardWithSLA
}

export default function CardInfo({ card }: CardInfoProps) {
  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 ? cleaned : `55${cleaned}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">ID</h3>
          <p className="mt-1 text-sm text-gray-900">{card.id}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
          <p className="mt-1 text-sm text-gray-900">{card.tipo}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Placa</h3>
          <p className="mt-1 text-sm text-gray-900 font-mono">{keepOriginalFormat(card.placa)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Chassi</h3>
          <p className="mt-1 text-sm text-gray-900 font-mono">{card.chassi || 'Não informado'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Local de Origem</h3>
          <p className="mt-1 text-sm text-gray-900">{card.local_origem || 'Não informado'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Destino</h3>
          <p className="mt-1 text-sm text-gray-900">{card.destino || 'Não informado'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Motorista</h3>
          <p className="mt-1 text-sm text-gray-900">
            {card.motorista ? formatPersonName(card.motorista) : 'Não informado'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email do Motorista</h3>
          <p className="mt-1 text-sm text-gray-900 break-all">
            {card.email_motorista || 'Não informado'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">CPF do Motorista</h3>
          <p className="mt-1 text-sm text-gray-900">
            {card.cpf_motorista || 'Não informado'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Telefone do Motorista</h3>
          {card.telefone_motorista ? (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-gray-900">{card.telefone_motorista}</p>
              <a
                href={`https://wa.me/${formatPhoneForWhatsApp(card.telefone_motorista)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700"
                title="Abrir WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-900">Não informado</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Operador de Recolha</h3>
          <p className="mt-1 text-sm text-gray-900">
            {card.operador_recolha ? formatPersonName(card.operador_recolha) : 'Não informado'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email do Operador</h3>
          <p className="mt-1 text-sm text-gray-900 break-all">
            {card.email_operador_recolha || 'Não informado'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Estado do Cartão</h3>
          <p className="mt-1 text-sm text-gray-900">{card.estado_cartao || 'Não informado'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Número do Card</h3>
          <p className="mt-1 text-sm text-gray-900">{card.numero_card || 'Não informado'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Criado em</h3>
          <p className="mt-1 text-sm text-gray-900">{formatDate(card.created_at)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Atualizado em</h3>
          <p className="mt-1 text-sm text-gray-900">{formatDate(card.updated_at)}</p>
        </div>
      </div>

      {/* Informações adicionais baseadas na fase */}
      {card.phase === 'confirmacao_recolha' && card.recusa_recolha && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">Recolha Recusada</h3>
          <p className="text-sm text-red-700">
            <span className="font-medium">Motivo:</span> {card.motivo_recusa || 'Não especificado'}
          </p>
          {card.observacoes_recusa && (
            <p className="text-sm text-red-700 mt-1">
              <span className="font-medium">Observações:</span> {card.observacoes_recusa}
            </p>
          )}
        </div>
      )}

      {card.phase === 'tentativas_recolha' && card.tentativa_recolha && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Tentativa de Recolha</h3>
          <p className="text-sm text-blue-700">
            <span className="font-medium">Status:</span> {card.status_tentativa || 'Em andamento'}
          </p>
          {card.motivo_guincho && (
            <p className="text-sm text-blue-700 mt-1">
              <span className="font-medium">Motivo do Guincho:</span> {card.motivo_guincho}
            </p>
          )}
          {card.tipo_dificuldade && (
            <p className="text-sm text-blue-700 mt-1">
              <span className="font-medium">Dificuldade:</span> {card.tipo_dificuldade}
            </p>
          )}
        </div>
      )}

      {(card.phase === 'confirmacao_recolha' || card.phase === 'finalizacao_recolha') && card.guincho_confirmado && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">Veículo Recolhido</h3>
          <p className="text-sm text-green-700">
            <span className="font-medium">Status:</span> {
              card.veiculo_no_patio ? 'Entregue no Pátio' : 'No Guincho'
            }
          </p>
          {card.despesas && card.despesas.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-green-800">Despesas:</p>
              <ul className="mt-1 space-y-1">
                {card.despesas.map((despesa, index) => (
                  <li key={index} className="text-sm text-green-700">
                    • {despesa}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}