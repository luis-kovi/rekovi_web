// types.ts

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