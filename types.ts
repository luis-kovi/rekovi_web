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