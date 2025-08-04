// app/kanban/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import KanbanBoard from '@/components/KanbanBoard'
import type { Card } from '@/types'

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
  const supabase = await createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    return redirect('/')
  }

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) {
    return redirect('/')
  }

  const permissionType = user.app_metadata?.permissionType?.toLowerCase() || 'default';
  
  // Verificar se o usuário está cadastrado
  if (!permissionType || permissionType === 'default') {
    return redirect('/?error=unauthorized')
  }
  
  let query = supabase.from('v_pipefy_cards_detalhada').select(`
    card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
    phase_name, created_at, email_chofer, empresa_recolha,
    modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
    endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
    valor_recolha, custo_km_adicional, public_url
  `).limit(100000); // Limite alto para pegar todos os 20k cards

  // Filtrar apenas cards com fases válidas diretamente na query
  const validPhases = [
    'Fila de Recolha',
    'Aprovar Custo de Recolha', 
    'Tentativa 1 de Recolha',
    'Tentativa 2 de Recolha',
    'Tentativa 3 de Recolha',
    'Desbloquear Veículo',
    'Solicitar Guincho',
    'Nova tentativa de recolha',
    'Confirmação de Entrega no Pátio'
  ];
  
  // Filtrar por fases válidas
  query = query.in('phase_name', validPhases);
  
  if (permissionType === 'ativa' || permissionType === 'onsystem') {
    query = query.ilike('empresa_recolha', permissionType);
  } else if (permissionType === 'chofer') {
    query = query.eq('email_chofer', user.email);
  } else if (permissionType !== 'kovi' && permissionType !== 'admin') {
    query = query.eq('card_id', 'impossivel'); 
  }

  const { data: cardsData, error } = await query;
  
  console.log('Debug - Permission Type:', permissionType);
  console.log('Debug - User Email:', user.email);
  console.log('Debug - Cards Data:', cardsData);
  console.log('Debug - Error:', error);
  
  // Debug para verificar as fases dos cards
  if (cardsData && cardsData.length > 0) {
    console.log('Debug - Sample phase_names:', cardsData.slice(0, 5).map(card => card.phase_name));
    console.log('Debug - Unique phase_names:', [...new Set(cardsData.map(card => card.phase_name))]);
    console.log('Debug - Sample cards with phase_name:', cardsData.slice(0, 3).map(card => ({
      card_id: card.card_id,
      phase_name: card.phase_name,
      placa: card.placa_veiculo
    })));
  } else {
    console.log('Debug - No cards data received');
  }
  
  if (error) {
    console.error('Erro ao buscar os cards:', error);
  }

  // Debug do filtro
  console.log('Debug - Valid phases to filter:', validPhases);
  
  const initialCards: Card[] = (cardsData || []).map(card => ({
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
  })).filter(card => card.id && card.placa); // Filtrar apenas cards válidos

  return (
    <div className="app-kanban flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Header user={user} permissionType={permissionType} />
      <KanbanBoard initialCards={initialCards} permissionType={permissionType} />
    </div>
  )
}
