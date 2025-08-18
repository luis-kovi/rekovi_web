/**
 * Cliente seguro para comunicação com Pipefy através da API proxy
 * Não expõe tokens no código cliente
 */

import { logger } from '@/utils/logger'

interface PipefyResponse<T = any> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

interface PipefyClientOptions {
  onError?: (error: Error) => void
  retries?: number
  retryDelay?: number
}

class PipefyClient {
  private options: PipefyClientOptions

  constructor(options: PipefyClientOptions = {}) {
    this.options = {
      retries: 3,
      retryDelay: 1000,
      ...options
    }
  }

  /**
   * Executa uma query GraphQL no Pipefy através da API proxy
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<PipefyResponse<T>> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.options.retries!; attempt++) {
      try {
        const response = await fetch('/api/pipefy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || `Pipefy API error: ${response.status} ${response.statusText}`
          )
        }

        const data = await response.json()
        
        // Verificar se há erros GraphQL
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map((e: any) => e.message).join(', ')
          logger.error('Pipefy GraphQL errors:', data.errors)
          throw new Error(`GraphQL errors: ${errorMessages}`)
        }

        return data
      } catch (error) {
        lastError = error as Error
        logger.error(`Pipefy query attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.options.retries!) {
          // Aguardar antes de tentar novamente
          await new Promise(resolve => 
            setTimeout(resolve, this.options.retryDelay! * (attempt + 1))
          )
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const finalError = new Error(
      `Failed to execute Pipefy query after ${this.options.retries} retries: ${lastError?.message}`
    )
    
    if (this.options.onError) {
      this.options.onError(finalError)
    }
    
    throw finalError
  }

  /**
   * Verifica se a integração com Pipefy está configurada
   */
  async checkConfiguration(): Promise<boolean> {
    try {
      const response = await fetch('/api/pipefy', {
        method: 'GET',
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.configured === true
    } catch (error) {
      logger.error('Failed to check Pipefy configuration:', error)
      return false
    }
  }
}

// Exportar instância padrão
export const pipefyClient = new PipefyClient({
  onError: (error) => {
    logger.error('Pipefy client error:', error)
  }
})

// Exportar classe para casos de uso customizados
export { PipefyClient }

// Helpers para queries comuns
export const pipefyQueries = {
  /**
   * Atualiza o campo de chofer em um card
   */
  updateChofer: (cardId: string, choferName: string, choferEmail: string) => `
    mutation {
      updateCardField(
        input: {
          card_id: ${cardId}
          field_id: "chofer"
          new_value: "${choferName} (${choferEmail})"
        }
      ) {
        success
      }
    }
  `,

  /**
   * Adiciona um comentário a um card
   */
  addComment: (cardId: string, comment: string) => `
    mutation {
      createComment(
        input: {
          card_id: ${cardId}
          text: "${comment.replace(/"/g, '\\"')}"
        }
      ) {
        comment {
          id
          text
          created_at
        }
      }
    }
  `,

  /**
   * Move um card para outra fase
   */
  moveCard: (cardId: string, destinationPhaseId: string) => `
    mutation {
      moveCardToPhase(
        input: {
          card_id: ${cardId}
          destination_phase_id: ${destinationPhaseId}
        }
      ) {
        card {
          id
          phase {
            id
            name
          }
        }
      }
    }
  `
}