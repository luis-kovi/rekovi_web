// hooks/usePipefyOperations.ts
// Hook seguro para operações Pipefy do lado do cliente

import { useState } from 'react';
import { logger } from '@/utils/logger';

export interface PipefyField {
  fieldId: string;
  value: any;
}

export interface PipefyOperationResult {
  success: boolean;
  error?: string;
}

export interface UploadFileResult extends PipefyOperationResult {
  downloadUrl?: string;
}

/**
 * Hook para operações seguras do Pipefy
 */
export function usePipefyOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Limpa o estado de erro
   */
  const clearError = () => setError(null);

  /**
   * Atualiza campos de um card
   */
  const updateCard = async (
    cardId: string, 
    fields: PipefyField[], 
    comment?: string
  ): Promise<PipefyOperationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pipefy/update-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          fields,
          comment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Falha na operação');
      }

      logger.log('Card atualizado com sucesso:', cardId);
      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      logger.error('Erro ao atualizar card:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Faz upload de um arquivo
   */
  const uploadFile = async (
    file: File,
    fieldId: string,
    cardId: string
  ): Promise<UploadFileResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      formData.append('cardId', cardId);

      const response = await fetch('/api/pipefy/upload-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Falha no upload');
      }

      logger.log('Arquivo enviado com sucesso:', result.downloadUrl);
      return { 
        success: true, 
        downloadUrl: result.downloadUrl 
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      logger.error('Erro no upload:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adiciona um comentário
   */
  const addComment = async (
    cardId: string,
    text: string,
    includeUserInfo: boolean = true
  ): Promise<PipefyOperationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pipefy/add-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          text,
          includeUserInfo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Falha ao adicionar comentário');
      }

      logger.log('Comentário adicionado com sucesso:', cardId);
      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      logger.error('Erro ao adicionar comentário:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Upload múltiplo de arquivos
   */
  const uploadMultipleFiles = async (
    files: Array<{ file: File; fieldId: string }>,
    cardId: string
  ): Promise<Array<UploadFileResult>> => {
    const results: Array<UploadFileResult> = [];

    for (const { file, fieldId } of files) {
      const result = await uploadFile(file, fieldId, cardId);
      results.push(result);
      
      // Se houver erro, parar o processo
      if (!result.success) {
        break;
      }
    }

    return results;
  };

  return {
    // State
    isLoading,
    error,
    
    // Actions
    updateCard,
    uploadFile,
    addComment,
    uploadMultipleFiles,
    clearError,
  };
}
