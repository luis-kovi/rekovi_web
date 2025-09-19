// types/card.types.ts
/**
 * Tipos relacionados aos cards de recolha
 */

export interface Card {
  id: string;
  placa: string;
  nomeDriver: string;
  chofer: string;
  faseAtual: string;
  dataCriacao: string;
  emailChofer?: string;
  empresaResponsavel?: string;
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
};

export type CardPhase = 
  | 'Fila de Recolha'
  | 'Aprovar Custo de Recolha'
  | 'Tentativa 1 de Recolha'
  | 'Tentativa 2 de Recolha'
  | 'Tentativa 3 de Recolha'
  | 'Tentativa 4 de Recolha'
  | 'Desbloquear Veículo'
  | 'Solicitar Guincho'
  | 'Confirmação de Entrega no Pátio';

export type SLAStatus = 'No Prazo' | 'Em Alerta' | 'Atrasado';

export interface CardFilters {
  searchTerm?: string;
  slaFilter?: SLAStatus | 'all';
  phaseFilter?: CardPhase | 'all';
  hideEmptyPhases?: boolean;
}

export interface CardActions {
  onUpdateChofer?: (cardId: string, newName: string, newEmail: string) => Promise<void>;
  onAllocateDriver?: (
    cardId: string, 
    driverName: string, 
    driverEmail: string, 
    dateTime: string, 
    collectionValue: string, 
    additionalKm: string,
    billingType?: string
  ) => Promise<void>;
  onRejectCollection?: (cardId: string, reason: string, observations: string) => Promise<void>;
  onUnlockVehicle?: (cardId: string, phase: string, photos: Record<string, File>, observations?: string) => Promise<void>;
  onRequestTowing?: (cardId: string, phase: string, reason: string, photos: Record<string, File>) => Promise<void>;
  onReportProblem?: (cardId: string, phase: string, difficulty: string, evidences: Record<string, File>) => Promise<void>;
  onConfirmPatioDelivery?: (
    cardId: string,
    photos: Record<string, File>,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => Promise<void>;
  onConfirmCarTowed?: (
    cardId: string,
    photo: File,
    expenses: string[],
    expenseValues: Record<string, string>,
    expenseReceipts: Record<string, File>
  ) => Promise<void>;
  onRequestTowMechanical?: (cardId: string, reason: string) => Promise<void>;
}
