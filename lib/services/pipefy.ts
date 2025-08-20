// lib/services/pipefy.ts
// Service seguro para operações do Pipefy - APENAS SERVER-SIDE

import { PIPEFY_CONFIG, getPipefyHeaders, validatePipefyConfig, PipefyMutationResponse, PipefyRequestOptions } from '@/lib/config/pipefy';
import { logger } from '@/utils/logger';

/**
 * Service class para operações seguras do Pipefy
 */
export class PipefyService {
  private static instance: PipefyService;
  
  private constructor() {
    // Validar configuração no momento da criação
    validatePipefyConfig();
  }
  
  /**
   * Singleton pattern para garantir uma única instância
   */
  public static getInstance(): PipefyService {
    if (!PipefyService.instance) {
      PipefyService.instance = new PipefyService();
    }
    return PipefyService.instance;
  }
  
  /**
   * Executa uma mutation/query GraphQL no Pipefy de forma segura
   */
  public async executeGraphQL(options: PipefyRequestOptions): Promise<PipefyMutationResponse> {
    const { query, variables, timeout = PIPEFY_CONFIG.REQUEST_TIMEOUT } = options;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(PIPEFY_CONFIG.API_URL, {
        method: 'POST',
        headers: getPipefyHeaders(),
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Pipefy API error: ${response.status} - ${response.statusText}`);
      }
      
      const result: PipefyMutationResponse = await response.json();
      
      // Log apenas erros, não dados sensíveis
      if (result.errors && result.errors.length > 0) {
        logger.error('Pipefy GraphQL errors:', result.errors.map(e => e.message));
      }
      
      return result;
      
    } catch (error) {
      logger.error('Erro na comunicação com Pipefy:', error);
      throw new Error('Falha na comunicação com o sistema externo');
    }
  }
  
  /**
   * Atualiza campos de um card no Pipefy
   */
  public async updateCardFields(cardId: string, fields: Array<{ fieldId: string; value: any }>): Promise<boolean> {
    const query = `
      mutation UpdateCardFields($cardId: ID!, $fields: [FieldValueInput!]!) {
        updateFieldsValues(
          input: {
            nodeId: $cardId
            values: $fields
          }
        ) {
          clientMutationId
          success
        }
      }
    `;
    
    const variables = {
      cardId,
      fields: fields.map(field => ({
        fieldId: field.fieldId,
        value: field.value
      }))
    };
    
    const result = await this.executeGraphQL({ query, variables });
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Erro ao atualizar card: ${result.errors[0].message}`);
    }
    
    return result.data?.updateFieldsValues?.success || false;
  }
  
  /**
   * Adiciona um comentário a um card
   */
  public async addComment(cardId: string, text: string): Promise<boolean> {
    const query = `
      mutation AddComment($cardId: ID!, $text: String!) {
        createComment(
          input: {
            card_id: $cardId
            text: $text
          }
        ) {
          comment {
            id
            text
            created_at
            author {
              id
              name
            }
          }
        }
      }
    `;
    
    const variables = { cardId, text };
    
    const result = await this.executeGraphQL({ query, variables });
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Erro ao adicionar comentário: ${result.errors[0].message}`);
    }
    
    return !!result.data?.createComment?.comment;
  }
  
  /**
   * Gera URL pré-assinada para upload de arquivo
   */
  public async createPresignedUrl(fileName: string, contentType: string): Promise<{ url: string; downloadUrl: string }> {
    const query = `
      mutation CreatePresignedUrl($organizationId: ID!, $fileName: String!, $contentType: String!) {
        createPresignedUrl(
          input: {
            organizationId: $organizationId
            fileName: $fileName
            contentType: $contentType
          }
        ) {
          url
          downloadUrl
          clientMutationId
        }
      }
    `;
    
    const variables = {
      organizationId: PIPEFY_CONFIG.ORGANIZATION_ID,
      fileName,
      contentType
    };
    
    const result = await this.executeGraphQL({ query, variables });
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Erro ao gerar URL de upload: ${result.errors[0].message}`);
    }
    
    const { url, downloadUrl } = result.data?.createPresignedUrl || {};
    
    if (!url || !downloadUrl) {
      throw new Error('URLs de upload não fornecidas pela API');
    }
    
    return { url, downloadUrl };
  }
  
  /**
   * Atualiza campo de arquivo após upload
   */
  public async updateFileField(cardId: string, fieldId: string, filePath: string): Promise<boolean> {
    const query = `
      mutation UpdateFileField($cardId: ID!, $fieldId: String!, $filePath: [String!]!) {
        updateCardField(
          input: {
            card_id: $cardId
            field_id: $fieldId
            new_value: $filePath
          }
        ) {
          success
          clientMutationId
        }
      }
    `;
    
    const variables = {
      cardId,
      fieldId,
      filePath: [filePath]
    };
    
    const result = await this.executeGraphQL({ query, variables });
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Erro ao atualizar campo de arquivo: ${result.errors[0].message}`);
    }
    
    return result.data?.updateCardField?.success || false;
  }
  
  /**
   * Upload de arquivo completo (presigned URL + update field)
   */
  public async uploadFile(file: File, fieldId: string, cardId: string): Promise<string> {
    // 1. Gerar URL pré-assinada
    const fileName = `${cardId}_${fieldId}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
    const { url: uploadUrl, downloadUrl } = await this.createPresignedUrl(fileName, file.type);
    
    // 2. Upload do arquivo
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Erro no upload do arquivo: ${uploadResponse.status}`);
    }
    
    // 3. Extrair path e atualizar campo
    const urlParts = downloadUrl.split('/uploads/');
    const filePath = urlParts[1] ? urlParts[1].split('?')[0] : '';
    const fullPath = `orgs/${PIPEFY_CONFIG.ORG_UUID}/uploads/${filePath}`;
    
    const updated = await this.updateFileField(cardId, fieldId, fullPath);
    
    if (!updated) {
      throw new Error('Falha ao vincular arquivo ao card');
    }
    
    return downloadUrl;
  }
}

// Export da instância singleton
export const pipefyService = PipefyService.getInstance();
