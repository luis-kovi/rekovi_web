// types.ts
import type { Database } from './types/database.types'
import type { CardView, CardRealtimePayload } from './types/supabase'

export interface Card {
  id: string;
  placa: string;
  nomeDriver: string;
  chofer: string;
  faseAtual: string;
  dataCriacao: string;
  emailChofer?: string;
  empresaResponsavel?: string;
  // Novos campos baseados no HTML
  modeloVeiculo?: string;
  telefoneContato?: string;
  telefoneOpcional?: string;
  emailCliente?: string;
  enderecoCadastro?: string;
  enderecoRecolha?: string;
  linkMapa?: string;
  origemLocacao?: string;
  valorRecolha?: string;
  custoKmAdicional?: string;
  urlPublica?: string;
}

export type CardWithSLA = Card & { 
  sla: number; 
  slaText: 'No Prazo' | 'Em Alerta' | 'Atrasado';
  // Campos adicionais do card_details
  tipo?: string;
  chassi?: string;
  local_origem?: string;
  destino?: string;
  motorista?: string;
  email_motorista?: string;
  cpf_motorista?: string;
  telefone_motorista?: string;
  operador_recolha?: string;
  email_operador_recolha?: string;
  estado_cartao?: string;
  numero_card?: string;
  phase?: string;
  sla_status?: 'on_time' | 'warning' | 'critical' | 'missed';
  sla_end_time?: string;
  created_at?: string;
  updated_at?: string;
  // Campos de status
  recusa_recolha?: boolean;
  motivo_recusa?: string;
  observacoes_recusa?: string;
  tentativa_recolha?: boolean;
  status_tentativa?: string;
  motivo_guincho?: string;
  tipo_dificuldade?: string;
  guincho_confirmado?: boolean;
  veiculo_no_patio?: boolean;
  despesas?: string[];
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    permissionType?: string;
  };
}

export interface PermissionType {
  type: 'admin' | 'kovi' | 'ativa' | 'onsystem' | 'rvs' | 'chofer';
}

export interface DatabaseUser {
  email: string;
  nome?: string;
  empresa?: string;
  permission_type?: string;
  status?: string;
  area_atuacao?: string[];
}

// Export RealtimePayload from supabase types
export type { CardRealtimePayload as RealtimePayload } from './types/supabase'