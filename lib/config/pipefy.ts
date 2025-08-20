// lib/config/pipefy.ts
// Configurações do Pipefy - APENAS SERVER-SIDE

/**
 * Configurações seguras do Pipefy
 * IMPORTANTE: Estas configurações devem ser usadas APENAS no servidor
 */
export const PIPEFY_CONFIG = {
  // URL base da API (será movida para variável de ambiente)
  API_URL: process.env.PIPEFY_API_URL || 'https://api.pipefy.com/graphql',
  
  // Token de autorização (DEVE estar em variável de ambiente)
  TOKEN: process.env.PIPEFY_TOKEN, // NÃO usar NEXT_PUBLIC_
  
  // Organization IDs (movidos para variáveis de ambiente)
  ORGANIZATION_ID: process.env.PIPEFY_ORGANIZATION_ID,
  ORG_UUID: process.env.PIPEFY_ORG_UUID,
  
  // Timeouts e limits
  REQUEST_TIMEOUT: 30000, // 30 segundos
  MAX_RETRIES: 3,
} as const;

/**
 * Valida se as configurações necessárias estão presentes
 */
export function validatePipefyConfig(): void {
  const requiredVars = [
    'PIPEFY_TOKEN',
    'PIPEFY_ORGANIZATION_ID', 
    'PIPEFY_ORG_UUID'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente do Pipefy não configuradas: ${missing.join(', ')}\n` +
      'Verifique o arquivo ENV_SETUP.md para instruções de configuração.'
    );
  }
}

/**
 * Headers seguros para requests do Pipefy
 */
export function getPipefyHeaders(): Record<string, string> {
  if (!PIPEFY_CONFIG.TOKEN) {
    throw new Error('Token do Pipefy não configurado');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${PIPEFY_CONFIG.TOKEN}`,
    'User-Agent': 'Rekovi-Web/1.0',
  };
}

/**
 * Tipos para as operações do Pipefy
 */
export interface PipefyMutationResponse {
  data?: any;
  errors?: Array<{ message: string; extensions?: any }>;
}

export interface PipefyRequestOptions {
  query: string;
  variables?: Record<string, any>;
  timeout?: number;
}
