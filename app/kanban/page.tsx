// app/kanban/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import KanbanWrapper from '@/components/KanbanWrapper'
import { getUserDataServer } from '@/utils/user-data-server'
import { filterCardsByPermissionsImproved } from '@/utils/auth-validation'
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
  
  // Buscar todos os cards válidos (filtros serão aplicados depois)
  const validPhases = [
    'Fila de Recolha',
    'Aprovar Custo de Recolha', 
    'Tentativa 1 de Recolha',
    'Tentativa 2 de Recolha',
    'Tentativa 3 de Recolha',
    'Desbloquear Veículo',
    'Solicitar Guincho',
    'Tentativa 4 de Recolha',
    'Confirmação de Entrega no Pátio'
  ];

  let query = supabase.from('v_pipefy_cards_detalhada').select(`
    card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
    phase_name, created_at, email_chofer, empresa_recolha,
    modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
    endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
    valor_recolha, custo_km_adicional, public_url
  `).in('phase_name', validPhases).limit(100000);

  // Para chofer, aplicar filtro específico por email
  if (userData.permission_type.toLowerCase() === 'chofer') {
    query = query.eq('email_chofer', user.email);
  }

  const { data: cardsData, error } = await query;
  
  if (error) {
    console.error('Erro ao buscar os cards:', error)
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

  console.log('Debug - User Data:', userData);
  console.log('Debug - Total cards before filter:', allCards.length);
  console.log('Debug - Total cards after filter:', filteredCards.length);

  return (
    <KanbanWrapper 
      initialCards={filteredCards} 
      permissionType={userData.permission_type} 
      user={user} 
    />
  )
}