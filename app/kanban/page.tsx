// app/kanban/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban'
import { KanbanColumnType } from '@/types/kanban.types'
import { getUserDataServer } from '@/utils/user-data-server'
import { filterCardsByPermissionsImproved } from '@/utils/auth-validation'
import type { Card } from '@/types'
import { logger } from '@/utils/logger'

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    logger.error('Supabase client not available')
    return redirect('/')
  }

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user?.email) {
    return redirect('/')
  }

  // Buscar dados do usuário na tabela pre_approved_users
  const userData = await getUserDataServer(user.email)
  
  if (!userData) {
    return redirect('/auth/signin?error=user_not_registered')
  }

  if (userData.status !== 'active') {
    return redirect('/auth/signin?error=user_inactive')
  }
  
  // Definir colunas Kanban modernas
  const kanbanColumns: KanbanColumnType[] = [
    { id: 'Fila de Recolha', title: 'Fila de Recolha', color: '#2563eb', wipLimit: 20 },
    { id: 'Aprovar Custo de Recolha', title: 'Aprovar Custo', color: '#059669', wipLimit: 10 },
    { id: 'Tentativa 1 de Recolha', title: 'Tentativa 1', color: '#f59e42', wipLimit: 15 },
    { id: 'Tentativa 2 de Recolha', title: 'Tentativa 2', color: '#f59e42', wipLimit: 15 },
    { id: 'Tentativa 3 de Recolha', title: 'Tentativa 3', color: '#f59e42', wipLimit: 15 },
    { id: 'Tentativa 4 de Recolha', title: 'Tentativa 4', color: '#f59e42', wipLimit: 15 },
    { id: 'Desbloquear Veículo', title: 'Desbloquear Veículo', color: '#e11d48', wipLimit: 10 },
    { id: 'Solicitar Guincho', title: 'Solicitar Guincho', color: '#6366f1', wipLimit: 8 },
    { id: 'Confirmação de Entrega no Pátio', title: 'Entrega no Pátio', color: '#10b981', wipLimit: 10 },
  ];

  let query = supabase.from('v_pipefy_cards_detalhada').select(`
    card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
    phase_name, created_at, email_chofer, empresa_recolha,
    modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
    endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
    valor_recolha, custo_km_adicional, public_url
  `).in('phase_name', kanbanColumns.map(col => col.id)).limit(100000);

  // Para chofer, aplicar filtro específico por email
  if (userData.permission_type.toLowerCase() === 'chofer') {
    query = query.eq('email_chofer', user.email);
  }

  const { data: cardsData, error } = await query;
  
  if (error) {
    logger.error('Erro ao buscar os cards:', error)
  }
  
  // Converter dados para formato Card
  const allCards: Card[] = (cardsData || []).map((card: any) => ({
    id: card.card_id,
    placa: card.placa_veiculo,
    nomeDriver: card.nome_driver,
    chofer: card.nome_chofer_recolha,
    faseAtual: card.phase_name,
    dataCriacao: card.created_at,
    emailChofer: card.email_chofer,
    empresaResponsavel: card.empresa_recolha,
    modeloVeiculo: card.modelo_veiculo,
    telefoneContato: card.telefone_contato,
    telefoneOpcional: card.telefone_opcional,
    emailCliente: card.email_cliente,
    enderecoCadastro: card.endereco_cadastro,
    enderecoRecolha: card.endereco_recolha,
    linkMapa: card.link_mapa,
    origemLocacao: card.origem_locacao,
    valorRecolha: card.valor_recolha,
    custoKmAdicional: card.custo_km_adicional,
    urlPublica: card.public_url,
  })).filter((card: Card) => card.id && card.placa);

  // Aplicar filtros baseados nas permissões da tabela pre_approved_users
  const filteredCards = filterCardsByPermissionsImproved(allCards, userData);

  logger.log('Debug - User Data:', userData);
  logger.log('Debug - Total cards before filter:', allCards.length);
  logger.log('Debug - Total cards after filter:', filteredCards.length);

  // Estados de loading, erro e vazio
  const loading = false;
  const errorMsg = error ? 'Erro ao buscar os cards' : undefined;
  const wipLimits = Object.fromEntries(kanbanColumns.map(col => [col.id, col.wipLimit ?? 0]));

  return (
    <KanbanBoard
      columns={kanbanColumns}
      cards={filteredCards}
      loading={loading}
      error={errorMsg}
      wipLimits={wipLimits}
    />
  )
}