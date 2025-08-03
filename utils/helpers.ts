// utils/helpers.ts

export function calcularSLA(dataCriacaoStr?: string): number {
  if (!dataCriacaoStr) return 0;
  const dataCriacao = new Date(dataCriacaoStr);
  if (isNaN(dataCriacao.getTime())) return 0;
  
  const agoraUTC = new Date();
  const dataCriacaoUTC = new Date(Date.UTC(dataCriacao.getFullYear(), dataCriacao.getMonth(), dataCriacao.getDate()));
  let dias = 0;
  let temp = new Date(dataCriacaoUTC);
  const hojeUTC = new Date(Date.UTC(agoraUTC.getUTCFullYear(), agoraUTC.getUTCMonth(), agoraUTC.getUTCDate()));
  
  while (temp < hojeUTC) {
    if (temp.getUTCDay() !== 0) dias++; // Exclui domingos
    temp.setUTCDate(temp.getUTCDate() + 1);
  }
  
  return dias;
}

export function formatPersonName(name?: string): string {
  if (!name || name === 'N/A') return 'N/A';
  return name.toLowerCase().replace(/\b[\wÀ-ÿ]/g, l => l.toUpperCase());
}

export function keepOriginalFormat(text?: string): string {
  return text || 'N/A';
}

export function formatDate(dateString?: string): string {
  if (!dateString || dateString === 'N/A') return dateString || 'N/A';
  try {
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
}

export const fixedPhaseOrder = [
  'Fila de Recolha',
  'Aprovar Custo de Recolha',
  'Tentativa 1 de Recolha',
  'Tentativa 2 de Recolha',
  'Tentativa 3 de Recolha',
  'Nova tentativa de recolha',
  'Desbloquear Veículo',
  'Solicitar Guincho',
  'Dificuldade na Recolha',
  'Confirmação de Entrega no Pátio'
];

export const phaseDisplayNames: { [key: string]: string } = {
  'Fila de Recolha': 'Fila de Recolha',
  'Aprovar Custo de Recolha': 'Aprovar Custo',
  'Tentativa 1 de Recolha': 'Tentativa 1',
  'Tentativa 2 de Recolha': 'Tentativa 2',
  'Tentativa 3 de Recolha': 'Tentativa 3',
  'Nova tentativa de recolha': 'Nova Tentativa',
  'Desbloquear Veículo': 'Desbloquear Veículo',
  'Solicitar Guincho': 'Solicitar Guincho',
  'Dificuldade na Recolha': 'Dificuldade na Recolha',
  'Confirmação de Entrega no Pátio': 'Confirmação de Recolha'
};

export const disabledPhases = ['Aprovar Custo de Recolha', 'Desbloquear Veículo', 'Solicitar Guincho'];

export const disabledPhaseMessages: { [key: string]: string } = {
  'Aprovar Custo de Recolha': 'em análise da Kovi',
  'Desbloquear Veículo': 'em processo de desbloqueio',
  'Solicitar Guincho': 'em análise da Kovi'
};

export const choferNames = {
  ativa: [
    'Alberto Junior Lelis Martins', 'Anderson Pereira Gonçalves', 'Bruno do Nascimento Batista',
    'Bruno Henrique Silva Magno', 'Caroline Vitória Delfino Roza', 'Cauê Silva Carvalho Souza',
    'Danilo Costa Almeida', 'Eduardo Nogueira Alves', 'Fabio Apolinario De Paula',
    'Fausto Guilherme Dantes de Souza', 'Fernando Domiciano', 'Francisco de Jesus Bande',
    'Gleison Lelis Ribeiro', 'Gustavo de Lima Costa', 'Jennifer Rodrigues de Lima',
    'Joice Aparecida Campos de Araújo Lopes', 'Juan Felipe Rocha Dias', 'Lucas Ramos Ferreira Bastos',
    'Luiz Felipe Lima Feitoza', 'Paulo Sergio Makauskas Aragão Araújo', 'Pedro Miguel de Lima Costa',
    'Rafael Bruno Lopes', 'Renato Martins Rodrigues', 'Rodrigo Bruno de Souza',
    'Vitor Costa da Silva', 'William Caetano dos Santos', 'Wilson Rodrigo de Lima'
  ],
  onsystem: [
    'Alberto Gomes da Fonseca', 'Alan Jhonny Inacio Silva', 'Alexandre Carvalho Moraes',
    'Alexandre Gomes de Melo', 'Alisson Gomes Leal', 'Andre Verissimo de Azevedo e Souza',
    'Andréa Aparecida Bessa Vilela', 'Darlene Saraiva Rekos', 'Debora Bessa Pereira',
    'Fabio de Souza', 'Felipe Santos da Silva', 'Gabriel Bueno Carvalho',
    'Gilson José Oliveira Miranda', 'Giordan da Costa', 'Guilherme Falcao Goncalves',
    'Henrique Nogueira Martins', 'Ismael Lucas dos Santos Oliveira', 'Isvã Bezerra Batista',
    'Jean Robson de Souza Silva', 'Juliano Wagner', 'Leonardo Possato',
    'Lucas Bastilhos Alves', 'Marcel Mello de Oliveira', 'Matheus Cabelleira Fraga',
    'Moacir Pereira de Medeiros', 'Orisvaldo Santos Silva', 'Pablo Vinicius Nogueira de Souza Pinto',
    'Rener Borges Ribeiro', 'Rosangela Dos Santos Bessa', 'Saymon Silva da Costa',
    'Sebastião Irineu Pinto', 'Thiago do Carmo Almeida', 'Vinicius Bessa Vilela', 'Willian Grespin'
  ]
};