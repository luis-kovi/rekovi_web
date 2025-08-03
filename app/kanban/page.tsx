// app/kanban/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import KanbanBoard from '@/components/KanbanBoard'
import type { Card } from '@/types'; // <-- CORREÇÃO APLICADA AQUI

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  const permissionType = user.app_metadata.permissionType?.toLowerCase() || 'default';
  
  let query = supabase.from('v_pipefy_cards_detalhada').select(`
    card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
    phase_name, created_at, email_chofer, empresa_recolha
  `);

  if (permissionType === 'ativa' || permissionType === 'onsystem') {
    query = query.ilike('empresa_recolha', permissionType);
  } else if (permissionType === 'chofer') {
    query = query.eq('email_chofer', user.email);
  } else if (permissionType !== 'kovi' && permissionType !== 'admin') {
    query = query.eq('card_id', 'impossivel'); 
  }

  const { data: cardsData, error } = await query;
  if (error) {
    console.error('Erro ao buscar os cards:', error);
  }

  const initialCards: Card[] = (cardsData || []).map(card => ({
    id: card.card_id,
    placa: card.placa_veiculo,
    nomeDriver: card.nome_driver,
    chofer: card.nome_chofer_recolha,
    faseAtual: card.phase_name,
    dataCriacao: card.created_at,
    emailChofer: card.email_chofer,
    empresaResponsavel: card.empresa_recolha,
  }));

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header user={user} />
      <KanbanBoard initialCards={initialCards} />
    </div>
  )
}