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
}

export type CardWithSLA = Card & { 
  sla: number; 
  slaText: 'No Prazo' | 'Em Alerta' | 'Atrasado'; 
}