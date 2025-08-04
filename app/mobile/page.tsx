// app/mobile/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import MobileTaskManager from '@/components/MobileTaskManager'
import type { Card } from '@/types'

export const dynamic = 'force-dynamic'

export default async function MobilePage() {
  const supabase = await createClient()
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
  `).order('card_id', { ascending: true }).limit(100000);

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
  
  if (error) {
    console.error('Erro ao buscar os cards:', error);
  }
  
  const initialCards: Card[] = (cardsData || []).map(card => ({
    id: card.card_id || '',
    placa: card.placa_veiculo || '',
    nomeDriver: card.nome_driver || '',
    chofer: card.nome_chofer_recolha || '',
    faseAtual: card.phase_name || '',
    dataCriacao: card.created_at || '',
    emailChofer: card.email_chofer || '',
    empresaResponsavel: card.empresa_recolha || '',
    modeloVeiculo: card.modelo_veiculo || '',
    telefoneContato: card.telefone_contato || '',
    telefoneOpcional: card.telefone_opcional || '',
    emailCliente: card.email_cliente || '',
    enderecoCadastro: card.endereco_cadastro || '',
    enderecoRecolha: card.endereco_recolha || '',
    linkMapa: card.link_mapa || '',
    origemLocacao: card.origem_locacao || '',
    valorRecolha: card.valor_recolha || '',
    custoKmAdicional: card.custo_km_adicional || '',
    urlPublica: card.public_url || '',
  })).filter(card => card.id && card.placa); // Filtrar apenas cards válidos

  return (
    <div className="app-mobile flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <MobileHeader user={user} permissionType={permissionType} />
      <MobileTaskManager initialCards={initialCards} permissionType={permissionType} />
    </div>
  )
} 
